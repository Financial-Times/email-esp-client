const hourInMs = 3600000;
module.exports = ({ hoursAgo = 1 } = {}) => {
	const now = Date.now();
	const transformedDate = now - (hoursAgo * hourInMs);
	return new Date(transformedDate).toISOString().substr(0, 16);
};
