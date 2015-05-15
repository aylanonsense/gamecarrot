var SimulationLibrary = require('./SimulationLibrary');

module.exports = {
	defineSimulation: function(key, def) {
		return SimulationLibrary.defineSimulation(key, def);
	}
};