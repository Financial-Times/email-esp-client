const logger = require('@financial-times/n-logger').default;
const getIsoDatetimeFrom = require('./_get-iso-datetime-from');
const apiEndpoints = require('./_api-endpoints');
const buildPath = require('./_build-path');
const callFetch = require('./_call-fetch');
const returnJsonIfResponseOk = require('./_return-json-if-response-ok');

module.exports = config => ({
	apiName,
	fromIsoDatetime = getIsoDatetimeFrom({ hoursAgo: 1 }),
	timezone = 'Europe/London',
	metricNames
} = {}) => {
	if (!apiName || !metricNames) {
		const message = 'Expected an object to be passed in with an `apiName` string and `metricNames` array of strings.';
		logger.warn({ event: 'ESP_METRICS_BAD_PARAMS', message, apiName, metricNames });
		return Promise.reject(new Error(message));
	}

	if (!apiEndpoints.has(apiName)) {
		const message = `${apiName} is not a known API endpoint. Valid options are: ${[...apiEndpoints.keys()].join(', ')}.`;
		logger.warn({ event: 'ESP_METRICS_UNKNOWN_ENDPOINT', message });
		return Promise.reject(new Error(message));
	}

	const path = buildPath({ apiName, apiEndpoints, fromIsoDatetime, timezone, metricNames });

	return callFetch({ config, path })
		.then(returnJsonIfResponseOk)
		.catch((err) => {
			const message = `This error happened while attempting to fetch SparkPost metrics: ${err.message}`;
			logger.error({ event: 'ESP_METRICS_FETCH_ERROR', message, status: err.status, errors: err.errors });
			return Promise.reject(new Error(message));
		});
};
