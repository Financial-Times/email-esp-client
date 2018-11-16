const fetchMetrics = require('./fetch-metrics');

module.exports = (...config) => {
	if (!config || typeof config.host !== 'string' || typeof config.key !== 'string') {
		throw new Error('ESP client missing a config object with host and key properties (both strings)');
	}

	return {
		fetchMetrics: fetchMetrics(config)
	};
};
