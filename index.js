const fetchMetrics = require('./fetch-metrics');

module.exports = ({ host, key } = {}) => {
	if (typeof host !== 'string' || typeof key !== 'string') {
		throw new Error('ESP client missing a config object with host and key properties (both strings)');
	}

	return {
		fetchMetrics: fetchMetrics({ host, key })
	};
};
