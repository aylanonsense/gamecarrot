var EventHelper = require('../../shared/EventHelper');
var DelayQueue = require('../../shared/DelayQueue');
var now = require('performance-now');

function Connection(socket) {
	//connection vars
	var generateFakeLag = null;
	var events = new EventHelper([ 'receive', 'disconnect' ]);

	//set up message queues (allows us to add fake lag)
	var inboundMessages = new DelayQueue();
	inboundMessages.on('dequeue', function(msg) {
		events.trigger('receive', msg);
	});
	var outboundMessages = new DelayQueue();
	outboundMessages.on('dequeue', function(msg) {
		socket.emit('message', msg);
	});

	//add listeners to the socket
	socket.on('message', function(msg) {
		inboundMessages.enqueue(msg, now() + (generateFakeLag ? generateFakeLag() : 0));
	});
	socket.on('disconnect', function() {
		inboundMessages.empty();
		outboundMessages.empty();
		events.trigger('disconnect');
	});

	//add connection methods
	this.send = function(msg) {
		outboundMessages.enqueue(msg, now() + (generateFakeLag ? generateFakeLag() : 0));
	};
	this.disconnect = function() {
		socket.disconnect();
	};
	this.setFakeLag = function(func) {
		generateFakeLag = func;
	};
	this.on = function(eventName, callback) {
		events.on(eventName, callback);
	};
}

module.exports = Connection;