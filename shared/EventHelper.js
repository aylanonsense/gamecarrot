function EventHelper(eventNames) {
	this._nextToken = 0;
	this._eventCallbacks = {};
	eventNames = eventNames || [];
	for(var i = 0; i < eventNames.length; i++) {
		this._eventCallbacks[eventNames[i]] = [];
	}
}
EventHelper.prototype.trigger = function(eventName, data /*, additionalData */) {
	if(!this._eventCallbacks[eventName]) {
		throw new Error("Event '" + eventName + "' is not registered");
	}

	//event may be triggered with multiple arguments -- put that together
	var args;
	if(arguments.length <= 2) {
		args = [ data ];
	}
	else {
		args = Array.prototype.slice.call(arguments);
		args.shift(); //ignore eventName
	}

	//trigger event
	for(var i = 0; i < this._eventCallbacks[eventName].length; i++) {
		this._eventCallbacks[eventName][i].callback.apply(this, args);
	}
};
EventHelper.prototype.on = function(eventName, callback) {
	var token = this._nextToken++;
	if(eventName instanceof Array) {
		for(var i = 0; i < eventName.length; i++) {
			this._pushCallback(eventName[i], callback, token);
		}
	}
	else {
		this._pushCallback(eventName, callback, token);
	}
	return token;
};
EventHelper.prototype._pushCallback = function(eventName, callback, token) {
	if(!this._eventCallbacks[eventName]) {
		throw new Error("Event '" + eventName + "' is not registered");
	}
	this._eventCallbacks[eventName].push({ token: token, callback: callback });
};
EventHelper.prototype.off = function(token) {
	function doesNotMatchToken(obj) {
		return obj.token !== token;
	}
	for(var k in this._eventCallbacks) {
		this._eventCallbacks[k] = this._eventCallbacks[k].filter(doesNotMatchToken);
	}
};
module.exports = EventHelper;