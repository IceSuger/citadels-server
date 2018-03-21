var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var RoomService = require('./app/services/roomService');
var fs = require('fs');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'citadels');
app.set('curMaxRoomId', 1);
app.set('roomService', new RoomService());

// app configuration
app.configure('production|development', 'connector', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			heartbeat : 3,
			useDict : true,
            useProtobuf: true,
            // ssl: {
            //     key: fs.readFileSync('/etc/nginx/default.d/CA.key'),
            //     cert: fs.readFileSync('/etc/nginx/default.d/CA.crt'),
            // }
		});
});

app.configure('production|development', 'gate', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
            useDict: true,
            useProtobuf: true,
            // ssl: {
            //     key: fs.readFileSync('/etc/nginx/default.d/CA.key'),
            //     cert: fs.readFileSync('/etc/nginx/default.d/CA.crt'),
            // }
		});
});

// app configure
app.configure('production|development', function() {
	// route configures
	app.route('core', routeUtil.core);

	// filter configures
	app.filter(pomelo.timeout());
});

// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});