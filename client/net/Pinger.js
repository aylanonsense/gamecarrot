var EventHelper = require('../../shared/EventHelper');
var Connection = require('./LaggyConnection');
var now = require('performance-now'); //will use performance.now browser-side

//constants
var MS_BETWEEN_PINGS = 1000;
var NUM_CACHED_PINGS = 20;
var PINGS_TO_IGNORE = 4;

var events = new EventHelper([ 'server-time-offset-changed', 'client-enforced-delay-changed' ]);
var wantsToPing = false;
var nextPingId = 0;
var pingTimer = null;
var pings = [];
var pingsSinceDelayLowered = 0;
var serverTimeOffset = { min: null, max: null };
var clientEnforcedDelay = null;
var recentPackets = [];

function sendPing() {
	var pingId = nextPingId++;
	pings.push({ pingId: pingId, sent: now(), received: null });
	Connection.send({ type: 'ping', pingId: pingId });
}

//set up interval to constantly ping the server
Connection.on(['connect', 'reconnect'], function() {
	startPinging();
});
Connection.on('disconnect', function() {
	stopPinging();
});

function startPinging() {
	if(!pingTimer && wantsToPing) {
		pingTimer = setInterval(function() {
			sendPing();
		}, MS_BETWEEN_PINGS);
	}
}
function stopPinging() {
	var offsetWasNull = (serverTimeOffset.min === null || serverTimeOffset.max === null);
	var delayWasNull = (clientEnforcedDelay === null);
	if(pingTimer) {
		clearInterval(pingTimer);
	}
	pingTimer = null;
	pings = [];
	pingsSinceDelayLowered = 0;
	serverTimeOffset = { min: null, max: null };
	clientEnforcedDelay = null;
	recentPackets = [];
	if(!offsetWasNull) {
		events.trigger('server-time-offset-changed', null);
	}
	if(!delayWasNull) {
		events.trigger('client-enforced-delay-changed', null);
	}
}

Connection.on('receive', function(msg) {
	if(msg && msg.type === 'ping-response' && wantsToPing) {
		var time = now();
		for(var i = 0; i < pings.length; i++) {
			if(pings[i].pingId === msg.pingId) {
				//we got a response to one of our pings
				pings[i].received = time;
				var lag = pings[i].received - pings[i].sent;

				//see if we can't gain a better estimate of server time
				var offsetChanged = false;
				var minServerTimeOffset = Math.min(time - msg.time, time - msg.time - lag);
				var maxServerTimeOffset = Math.max(time - msg.time, time - msg.time - lag);
				if(serverTimeOffset.min === null || serverTimeOffset.min < minServerTimeOffset) {
					serverTimeOffset.min = minServerTimeOffset;
					offsetChanged = true;
				}
				if(serverTimeOffset.max === null || serverTimeOffset.max > maxServerTimeOffset) {
					serverTimeOffset.max = maxServerTimeOffset;
					offsetChanged = true;
				}

				//may need to increase/decrease delay depending on lag
				pingsSinceDelayLowered++;
				var delayChanged = recalculateClientEnforcedDelay();

				//broadcast better estimate of server time
				if(offsetChanged) {
					events.trigger('server-time-offset-changed', serverTimeOffset.min +
						(serverTimeOffset.max - serverTimeOffset.min) / 2);
				}

				//broadcast better client-enforced delay
				if(delayChanged) {
					events.trigger('client-enforced-delay-changed', clientEnforcedDelay);
				}
			}
		}
	}
});

function recalculateClientEnforcedDelay() {
	//create a sorted array of latency times (worst latency first)
	var latencies = pings.map(function(ping) {
		return ping.received - ping.sent;
	}).sort(function(a, b) { return b - a; });

	//the worst latencies are ignored
	var idealDelay = latencies[Math.min(PINGS_TO_IGNORE, pings.length - 1)] + 3; //buffer ms added
	var delayChanged = false;

	//if we don't have an enforced delay yet, this is the best estimate to use
	if(clientEnforcedDelay === null) {
		clientEnforcedDelay = idealDelay;
		pingsSinceDelayLowered = 0;
		delayChanged = true;
	}
	//if the network got worse we can safely adopt the new delay -- client will stutter
	else if(clientEnforcedDelay <= idealDelay) {
		clientEnforcedDelay = idealDelay;
		pingsSinceDelayLowered = 0;
		delayChanged = true;
	}
	//if the network got better, we might not trust that it will stay good
	else {
		//we only lower the client's delay if the "gains" are worth it
		var gains = Math.sqrt(clientEnforcedDelay - idealDelay); //we undervalue huge gains
		if(gains * pingsSinceDelayLowered > 50) {
			clientEnforcedDelay = idealDelay;
			delayChanged = true;
		}
	}

	//if we changed the delay, the game clock needs to be updated
	return delayChanged;
}

module.exports = {
	startPinging: function() {
		wantsToPing = true;
		if(Connection.isConnected()) {
			startPinging();
		}
	},
	getClientEnforcedDelay: function() {
		return clientEnforcedDelay;
	},
	getServerTimeOffset: function() {
		if(serverTimeOffset.min === null || serverTimeOffset.max === null) {
			return null;
		}
		else {
			return serverTimeOffset.min + (serverTimeOffset.max - serverTimeOffset.min) / 2;
		}
	},
	on: function(eventName, callback) {
		events.on(eventName, callback);
	}
};