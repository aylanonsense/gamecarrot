var gamecarrot = (function() {
	console.log("Yay the client source code works!");
	return  {
		//simulation
		run: function(simulation) {},
		getTime: function() {},
		getClientTime: function() {},
		getServerTime: function() {},

		//net
		connect: function() {},
		isConnected: function() {},
		isSynced: function() {},
		on: function() {}, //connect, reconnect, sync, resync, receive, desync, disconnect
		send: function(msg) {},
		disconnect: function() {}
	};
})();