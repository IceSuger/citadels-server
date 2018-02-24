var exp = module.exports;
var dispatcher = require('./dispatcher');

exp.core = function(session, msg, app, cb) {
	var coreServers = app.getServersByType('core');

	if(!coreServers || coreServers.length === 0) {
		cb(new Error('can not find core servers.'));
		return;
	}

	var res = dispatcher.dispatch(session.get('rid'), coreServers);

	cb(null, res.id);
};