var coreRemote = require('../remote/coreRemote');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
	this.roomService = app.get('roomService');
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.send = function(msg, session, next) {
	var rid = session.get('rid');
	var username = session.uid.split('*')[0];
	var channelService = this.app.get('channelService');
	var param = {
		msg: msg.content,
		from: username,
		target: msg.target
	};
	channel = channelService.getChannel(rid, false);

	//the target is all users
    if (msg.target === '*') {
		channel.pushMessage('onplay', param);
	}
	//the target is specific user
	else {
		var tuid = msg.target + '*' + rid;
		var tsid = channel.getMember(tuid)['sid'];
		channelService.pushMessageByUids('onplay', param, [{
			uid: tuid,
			sid: tsid
		}]);
	}
	next(null, {
		route: msg.route
	});
};


/**
 * 玩家准备。
 * @param msg
 * @param session
 * @param next
 */
handler.ready = function(msg, session, next){
	msg.uid = session.uid;
    msg.roomId = session.get('roomId');
    var ret = this.roomService.ready(msg);
    next(null, {
        ret: ret
    });
};

handler.cancelReady = function (msg, session, next) {
    msg.uid = session.uid;
    msg.roomId = session.get('roomId');
    var ret = this.roomService.cancelReady(msg);
    next(null, {
        ret: ret
    });
};

handler.pickRole = function (msg, session, next) {
    msg.uid = session.uid;
    msg.roomId = session.get('roomId');
    this.roomService.pickRole(msg);
    next();
};

handler.takeCoinsOrBuildingCards = function (msg, session, next) {
    msg.uid = session.uid;
    msg.roomId = session.get('roomId');
    var candidates = this.roomService.takeCoinsOrBuildingCards(msg);
    if (!candidates) {
        next();
    } else {
        next(null, {
            candidates: candidates
        });
    }
};

handler.pickBuildingCard = function (msg, session, next) {
    msg.uid = session.uid;
    msg.roomId = session.get('roomId');
    this.roomService.pickBuildingCard(msg);
    next();
};

handler.useAbility = function (msg, session, next) {
    msg.uid = session.uid;
    msg.roomId = session.get('roomId');
    this.roomService.useAbility(msg);
    next();
};

handler.collectTaxes = function (msg, session, next) {
    msg.uid = session.uid;
    msg.roomId = session.get('roomId');
    this.roomService.collectTaxes(msg);
};
