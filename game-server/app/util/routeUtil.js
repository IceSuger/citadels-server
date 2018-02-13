var exp = module.exports;
var dispatcher = require('./dispatcher');

exp.play = function(session, msg, app, cb) {
	var playServers = app.getServersByType('play');

	if(!playServers || playServers.length === 0) {
		cb(new Error('can not find play servers.'));
		return;
	}

	var res = dispatcher.dispatch(session.get('rid'), playServers);

	cb(null, res.id);
};