var Pinger = require('./Pinger');
var now = require('performance-now'); //will use performance.now browser-side

module.exports = {
	getServerTime: function() {
		var serverTimeOffset = Pinger.getServerTimeOffset();
		if(serverTimeOffset === null) { return null; }
		return now() - serverTimeOffset;
	},
	getClientTime: function() {
		var serverTimeOffset = Pinger.getServerTimeOffset();
		var clientEnforcedDelay = Pinger.getClientEnforcedDelay();
		if(serverTimeOffset === null) { return null; }
		if(clientEnforcedDelay === null) { return null; }
		return now() - serverTimeOffset - clientEnforcedDelay;
	},
	getServerReceiveTime: function() {
		var serverTimeOffset = Pinger.getServerTimeOffset();
		var clientEnforcedDelay = Pinger.getClientEnforcedDelay();
		if(serverTimeOffset === null || clientEnforcedDelay === null) {
			return null;
		}
		else {
			return now() - serverTimeOffset + clientEnforcedDelay;
		}
	}
};