module.exports = ({
	apiName,
	apiEndpoints,
	fromIsoDatetime,
	timezone,
	metricNames
}) => {
	return `${apiEndpoints.get(apiName)}?${[
		`from=${fromIsoDatetime}`,
		`timezone=${timezone}`,
		`metrics=${[...metricNames].join(',')}`
	].join('&')}`;
};
