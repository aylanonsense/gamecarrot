var socketIO = require('socket.io');
var SimulationLibrary = require('./SimulationLibrary');
// var ConnectionServer = require('./ConnectionServer');

//same trick as socket.io -- read in the client source code and serve it
var read = require('fs').readFileSync;
var clientSource = read(require.resolve('../build/gamecarrot-client.js'), 'utf-8');

module.exports = {
	listen: function(server, opts) {
		//serve client source code at /gamecarrot/gamecarrot.js
		server.on('request', function(req, res) {
			if(req.url.indexOf('/gamecarrot/gamecarrot.js') === 0) {
				res.setHeader('Content-Type', 'application/javascript');
				res.writeHead(200);
				res.end(clientSource);
			}
		});

		//handle incoming sockets
		var socketServer = socketIO(server, opts);
		socketServer.on('connection', function(socket) {
			// ConnectionServer.handleSocket(socket);
		});
		return socketServer;
	},
	defineSimulation: function(key, def) {
		return SimulationLibrary.defineSimulation(key, def);
	}
};