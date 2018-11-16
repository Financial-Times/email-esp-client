const fetch = require('node-fetch');

const buildFetchOptions = espMetricsApiKey => ({
	headers: {
		Accept: 'application/json',
		Authorization: espMetricsApiKey
	}
});

module.exports = ({ config, path }) => {
	return fetch(`${config.host}${path}`, buildFetchOptions(config.key))
		.catch((err) => {
			throw new Error(`Sorry, a network error occurred: ${err.message}`);
		});
};
