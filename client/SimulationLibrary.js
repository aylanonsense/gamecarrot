var EventHelper = require('../shared/EventHelper');
var SimulationConnection = require('./net/SimulationConnection');
var now = require('performance-now'); //will use performance.now browser-side

function defineSimulation(def) {
	function Simulation() {
		//set up simulation variables
		var self = this;
		var events = new EventHelper([ 'render' ]);

		//connect vars
		var connection = null;

		//run vars
		var isRunning = false;
		var runTimer = null;
		var framesPerSecond = null;
		var timeOfLastLoop = null;
		function loop() {
			var time = now();
			self.update(time - timeOfLastLoop);
			timeOfLastLoop = time;
			scheduleLoop();
			events.trigger('render');
		}
		function cancelLoop() {
			if(runTimer) {
				if(framesPerSecond === null) {
					cancelAnimationFrame(runTimer);
				}
				else {
					clearTimeout(runTimer);
				}
			}
		}
		function scheduleLoop() {
			//schedule next loop
			if(framesPerSecond === null) {
				runTimer = requestAnimationFrame(function() {
					runTimer = null;
					loop();
				});
			}
			else {
				runTimer = setTimeout(function() {
					runTimer = null;
					loop();
				}, 1 / framesPerSecond);
			}
		}

		//add simulation-specific functions
		this.getState = def.getState;
		this.setState = def.setState;
		this.update = def.update;
		this.applyEvent = function(evt, shouldSend) {
			def.applyEvent.call(self, evt);
			if(shouldSend !== false) {
				//TODO
			}
		};
		this.on = function(eventName, callback) {
			events.on(eventName, callback);
		};

		//add run methods
		this.run = function(opts) {
			//cancel existing run timer
			cancelLoop();

			//set up new run options
			if(typeof opts.framesPerSecond === 'number') {
				framesPerSecond = opts.framesPerSecond;
			}
			else {
				framesPerSecond = null;
			}

			//start it running
			timeOfLastLoop = now();
			scheduleLoop();
			isRunning = true;
		};
		this.pause = function() {
			cancelLoop();
			runTimer = null;
			isRunning = false;
		};
		this.resume = function() {
			if(!isRunning) {
				isRunning = true;
				timeOfLastLoop = now();
				scheduleLoop();
			}
		};

		//add connection methods
		this.connect = function(key) {
			if(!connection) {
				connection = new SimulationConnection(key);
				connection.connect();
			}
			else {
				throw new Error("Already connected!");
			}
		};

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