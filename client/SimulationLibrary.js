var EventHelper = require('../shared/EventHelper');

function defineSimulation(def) {
	function Simulation() {
		//set up simulation variables
		var self = this;
		var events = new EventHelper([ 'render' ]);
		var isRunning = false;
		function loop() {
			if(isRunning) {
				self.update(1 / 60);
				requestAnimationFrame(loop);
				events.trigger('render');
			}
		}

		//add simulation-specific functions
		this.getState = def.getState;
		this.setState = def.setState;
		this.update = def.update;

		//add utility functions
		this.on = function(eventName, callback) {
			events.on(eventName, callback);
		};
		this.run = function(opts) {
			if(!isRunning) {
				isRunning = true;
				requestAnimationFrame(loop);
			}
		};
		this.pause = function() {
			isRunning = false;
		};
		this.connect = function(opts) {};

		//call constructor
		def.init.apply(this, arguments);
	}
	return Simulation;
}

module.exports = {
	defineSimulation: function(key, def) {
		return defineSimulation(def);
	}
};