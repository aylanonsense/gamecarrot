//same trick as socket.io -- read in the client source code and serve it
var read = require('fs').readFileSync;
var clientSource = read(require.resolve('./client'), 'utf-8');

module.exports = {
	listen: function(server, socketServer) {
		//serve client source code at [host]/gamecarrot/gamecarrot.js
		server.on('request', function(req, res) {
			if(req.url.indexOf('/gamecarrot/gamecarrot.js') === 0) {
				res.setHeader('Content-Type', 'application/javascript');
				res.writeHead(200);
				res.end(clientSource);
			}
		});

		//handle incoming sockets
		socketServer.on('connection', function() {});
	}
};