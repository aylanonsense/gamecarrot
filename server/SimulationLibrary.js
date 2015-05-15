function defineSimulation(def) {
	function Simulation() {
		def.init.apply(this, arguments);
	}
	Simulation.prototype.on = function(eventName, callback) {};
	Simulation.prototype.tick = function(t) {};
	Simulation.prototype.getState = def.getState;
	Simulation.prototype.setState = def.setState;
	Simulation.prototype.run = function(opts) {
		//TODO
	};
	Simulation.prototype.host = function(connectionKey) {
		//TODO
	};
	return Simulation;
}

module.exports = {
	defineSimulation: function(key, def) {
		return defineSimulation(def);
	}
};