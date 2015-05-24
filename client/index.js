var EventHelper = require('../shared/EventHelper');
var SimulationLibrary = require('./SimulationLibrary');
var Pinger = require('./net/Pinger');
var Clock = require('./net/Clock');
var Connection = require('./net/LaggyConnection');

Pinger.startPinging();
var events = new EventHelper([ 'connect', 'reconnect', 'disconnect' ]);
Connection.on('connect', function() { events.trigger('connect'); });
Connection.on('reconnect', function() { events.trigger('reconnect'); });
Connection.on('disconnect', function() { events.trigger('disconnect'); });

module.exports = {
	defineSimulation: function(key, def) {
		return SimulationLibrary.defineSimulation(key, def);
	},
	getServerTime: function() {
		return Clock.getServerTime();
	},
	getClientTime: function() {
		return Clock.getClientTime();
	},
	getServerReceiveTime: function() {
		return Clock.getServerReceiveTime();
	},
	connect: function() {
		Connection.connect();
	},
	isConnected: function() {
		return Connection.isConnected();
	},
	disconnect: function() {
		Connection.disconnect();
	},
	setFakeLag: function(func) {
		Connection.setFakeLag(func);
	},
	on: function(eventName, callback) {
		events.on(eventName, callback);
	}
};