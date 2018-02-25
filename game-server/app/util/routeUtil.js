var exp = module.exports;
var dispatcher = require('./dispatcher');

exp.core = function(session, msg, app, cb) {
	var coreServers = app.getServersByType('core');

	if(!coreServers || coreServers.length === 0) {
		cb(new Error('can not find core servers.'));
		return;
	}

    // console.log(session);
    var res = dispatcher.dispatch(session.get('roomId'), coreServers);

	cb(null, res.id);
};