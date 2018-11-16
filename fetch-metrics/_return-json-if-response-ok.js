module.exports = async (response) => {
	const json = await response.json();

	if (!response.ok) {
		const err = new Error(`SparkPost sent back a ${response.status} error`);

		err.errors = json.errors;
		err.status = response.status;

		throw err;
	}

	return json.results;
};
