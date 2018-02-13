module.exports = function(app) {
	return new playRemote(app);
};

var playRemote = function(app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * Add user into play channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
playRemote.prototype.add = function(uid, sid, name, flag, cb) {
	var channel = this.channelService.getChannel(name, flag);
	var username = uid.split('*')[0];
	var param = {
		route: 'onAdd',
		user: username
	};
	channel.pushMessage(param);

	if( !! channel) {
		channel.add(uid, sid);
	}

	cb(this.get(name, flag));
};

/**
 * Get user from play channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
playRemote.prototype.get = function(name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if( !! channel) {
		users = channel.getMembers();
	}
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	return users;
};

/**
 * Kick user out play channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
playRemote.prototype.kick = function(uid, sid, name, cb) {
	var channel = this.channelService.getChannel(name, false);
	// leave channel
	if( !! channel) {
		channel.leave(uid, sid);
	}
	var username = uid.split('*')[0];
	var param = {
		route: 'onLeave',
		user: username
	};
	channel.pushMessage(param);
	cb();
};


/**
 * 新建房间/新建channel
 *
 */
playRemote.prototype.createRoom = function(cb) {
	var curMaxRid = this.app.get("curMaxRoomId");
	var name = ""+curMaxRid;
	this.app.set("curMaxRoomId", curMaxRid+1);
	var channel = this.channelService.createChannel(name);

	cb(name);
};