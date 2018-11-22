module.exports = ({
	apiName,
	apiEndpoints,
	fromIsoDatetime,
	timezone,
	metricNames,
	orderBy
}) => {
	const orderByParam = orderBy ? `&order_by=${orderBy}` : '';

	return `${apiEndpoints.get(apiName)}?${[
		`from=${fromIsoDatetime}`,
		`timezone=${timezone}`,
		`metrics=${[...metricNames].join(',')}`,
	].join('&')}${orderByParam}`;
};
