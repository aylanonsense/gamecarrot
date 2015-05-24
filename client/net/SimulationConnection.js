var EventHelper = require('../../shared/EventHelper');
var DelayQueue = require('../../shared/DelayQueue');
var now = require('performance-now'); //will use performance.now browser-side
var Connection = require('./LaggyConnection');

module.exports = function SimulationConnection(connKey) {
	var events = new EventHelper([ 'connect', 'reconnect', 'sync', 'resync', 'receive', 'desync', 'disconnect' ]);
	var bufferedMessages = [];
	var wantsToBeConnected = false;
	var hasSentHandshake = false;
	var hasBeenConnectedBefore = false;
	var isConnected = false;
	var isSynced = false;

	function handshake() {
		Connection.send({ type: 'connect-sim-request', connKey: connKey });
		hasSentHandshake = true;
	}

	Connection.on('connect', function() {
		if(wantsToBeConnected) {
			handshake();
		}
	});
	Connection.on('reconnect', function() {
		if(wantsToBeConnected) {
			handshake();
		}
	});
	Connection.on('receive', function(msg) {
		if(msg && msg.connKey === connKey) {
			if(msg.type === 'connect-sim-accept') {
				if(!isConnected && wantsToBeConnected) {
					isConnected = true;
					if(!hasBeenConnectedBefore) {
						hasBeenConnectedBefore = true;
						events.trigger('connect');
					}
					else {
						events.trigger('reconnect');
					}
				}
			}
			else if(msg.type === 'sim-messages') {
				for(var i = 0; i < msg.messages.length; i++) {
					//TODO instead of triggering now, delay until appropriate time
					events.trigger('receive', msg.messages[i]);
				}
			}
		}
	});
	Connection.on('disconnect', function() {
		isSynced = false;
		hasSentHandshake = false;
		if(isConnected) {
			isConnected = false;
			events.trigger('disconnect');
		}
	});

	//add methods
	this.connect = function() {
		wantsToBeConnected = true;
		if(!isConnected) {
			if(Connection.isConnected()) {
				if(!hasSentHandshake) {
					handshake();
				}
			}
			else {
				Connection.connect();
			}
		}
	};
	this.isConnected = function() {
		return isConnected;
	};
	this.isSynced = function() {
		return isSynced;
	};
	this.send = function(msg /*, msg2, ... */) {
		bufferedMessages.push({
			messages: Array.prototype.slice.call(arguments)
		});
	};
	this.flush = function() {
		Connection.send({ type: 'sim-messages', messages: bufferedMessages, connKey: connKey });
		bufferedMessages = [];
	};
	this.disconnect = function() {
		wantsToBeConnected = false;
		hasSentHandshake = false;
		isSynced = false;
		if(isConnected) {
			isConnected = false;
			Connection.send({ type: 'disconnect-sim', connKey: connKey });
			events.trigger('disconnect');
		}
	};
	this.on = function(eventName, callback) {
		events.on(eventName, callback);
	};
};