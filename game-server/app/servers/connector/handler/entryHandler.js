module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry core server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var self = this;
    var roomId = msg.roomId;
    var uid = msg.username + '*' + roomId;
	var sessionService = self.app.get('sessionService');

	//duplicate log in
	if( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			error: true
		});
		return;
	}

	session.bind(uid);
    session.set('roomId', roomId);
    session.push('roomId', function (err) {
		if(err) {
            console.error('set roomId for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	//put user into channel
    self.app.rpc.core.coreRemote.add(session, uid, self.app.get('serverId'), roomId, true, function (users) {
		next(null, {
			users:users
		});
	});
};

/**
 * 创建房间
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback, 其中将返回创建出的房间号
 * @return {Void}
 */
handler.createRoom = function(msg, session, next) {
    var self = this;
    console.log("now in entryHandler.createRoom!!!");
    console.log(msg);

    //create room
    self.app.rpc.core.coreRemote.createRoom.toServer('core-server-1', msg, function (roomId) {
    	console.log("handler creating room.");
        next(null, {
            roomId: roomId
        });
    });
};

/**
 * 进入房间。
 * 传入 uid 和 roomId
 *
 * @param msg
 * @param session
 * @param next
 */
handler.enterRoom = function(msg, session, next) {
    var self = this;
	msg.serverId = this.app.get('serverId');

    session.bind(msg.uid);
    session.set('roomId', msg.roomId);
    session.push('roomId', function (err) {
        if (err) {
            console.error('set roomId for session service failed! error is : %j', err.stack);
        }
    });
    session.on('closed', onUserLeave.bind(null, self.app));

    // put player into room
    this.app.rpc.core.coreRemote.enterRoom(session, msg, function (data) {
        next(null, {
            code: data
        })
	});
};

/**
 * 用户断开连接
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
    app.rpc.core.coreRemote.leave(session, session.uid, app.get('serverId'), session.get('roomId'), null);
};

// /**
//  * 用户断开连接
//  *
//  * @param {Object} app current application
//  * @param {Object} session current session object
//  *
//  */
// var onUserLeave = function(app, session) {
//     if(!session || !session.uid) {
//         return;
//     }
//     app.rpc.core.coreRemote.kick(session, session.uid, app.get('serverId'), session.get('roomId'), null);
// };