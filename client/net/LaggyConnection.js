var EventHelper = require('../../shared/EventHelper');
var DelayQueue = require('../../shared/DelayQueue');
var now = require('performance-now'); //will use performance.now browser-side

//connection vars
var socket = null;
var generateFakeLag = null;
var isConnected = false;
var events = new EventHelper([ 'connect', 'reconnect', 'receive', 'disconnect' ]);

//set up message queues (allows us to add fake lag)
var inboundMessages = new DelayQueue();
inboundMessages.on('dequeue', function(msg) {
	events.trigger('receive', msg);
});
var outboundMessages = new DelayQueue();
outboundMessages.on('dequeue', function(msg) {
	socket.emit('message', msg);
});

module.exports = {
	connect: function() {
		if(!socket) {
			socket = io();

			//add listeners to the socket
			socket.on('connect', function() {
				isConnected = true;
				events.trigger('connect');
			});
			socket.on('reconnect', function() {
				isConnected = true;
				events.trigger('reconnect');
			});
			socket.on('message', function(msg) {
				inboundMessages.enqueue(msg, now() + (generateFakeLag ? generateFakeLag() : 0));
			});
			socket.on('disconnect', function() {
				isConnected = false;
				inboundMessages.empty();
				outboundMessages.empty();
				events.trigger('disconnect');
			});
		}
	},
	isConnected: function() {
		return isConnected;
	},
	send: function(msg) {
		outboundMessages.enqueue(msg, now() + (generateFakeLag ? generateFakeLag() : 0));
	},
	disconnect: function() {
		socket.disconnect();
	},
	setFakeLag: function(func) {
		generateFakeLag = func;
	},
	on: function(eventName, callback) {
		events.on(eventName, callback);
	}
};