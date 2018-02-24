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
	var rid = msg.rid;
	var uid = msg.username + '*' + rid
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
	session.set('rid', rid);
	session.push('rid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	//put user into channel
	self.app.rpc.core.coreRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
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

    //create room
    self.app.rpc.core.coreRemote.createRoom.toServer('core-server-1', function(rid){
    	console.log("handler creating room.");
        next(null, {
            rid:rid
        });
    });
};

/**
 * 进入房间。
 * 传入 uid 和 rid
 *
 * @param msg
 * @param session
 * @param next
 */
handler.enterRoom = function(msg, session, next) {
	msg.serverId = this.app.get('serverId');

	// put player into room
	this.app.rpc.game.gameRemote.enterRoom(session, msg, function(data) {
		if(!!data.roomId && data.roomId > 0) {
			session.set('roomId', data.roomId);
		}

		session.push('roomId', function(err) {
			if(err) {
				console.error('Set roomId for session service failed! error is : %j', err.stack);
			} else {
				next(null, {
					roomId: data.roomId,
					seatNum: data.seatNum
				});
			}
		});
	});
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.play.playRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};