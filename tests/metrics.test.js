const { expect } = require('chai').use(require('chai-as-promised'));
const nock = require('nock');
const { useFakeTimers } = require('sinon');

const testEspHost = 'https://test-esp-host';
const testEspMetricsApiKey = 'test-esp-metrics-api-key';
const espMetricsBaseUrl = `${testEspHost}/api/v1/metrics`;
const defaultQueryParams = [
	'from=1888-01-10T00:00',
	'timezone=Europe/London'
];

describe('Fetch ESP deliverability metrics:', () => {
	let fetchMetrics;

	before(() => {
		nock.disableNetConnect();
		// Override Date.now() for the `from` query param
		this.clock = useFakeTimers({
			toFake: ['Date'],
			now: new Date('1888-01-10T01:00')
		});
		fetchMetrics = require('../fetch-metrics')({ host: testEspHost, key: testEspMetricsApiKey });
	});

	after(() => {
		this.clock.restore();
		nock.restore();
		nock.enableNetConnect();
	});

	describe('IP pool endpoint', () => {
		const ipPoolFixtures = {
			ok: require('./fixtures/metrics-discoverability-ip-pool-200.json'),
			badRequest: require('./fixtures/metrics-discoverability-ip-pool-400.json'),
			serverError: require('./fixtures/metrics-discoverability-ip-pool-500.json')
		};

		const exampleMetrics = 'metrics=count_injected,count_hard_bounce';
		const ipPoolUrl = `/deliverability/ip-pool?${defaultQueryParams.join('&')}&${exampleMetrics}`;
		const goodParams = {
			apiName: 'ipPool',
			metricNames: new Set(['count_injected', 'count_hard_bounce'])
		};

		describe('When everything is great', () => {
			beforeEach(() => {
				this.nocked = nock(espMetricsBaseUrl)
					.get(ipPoolUrl)
					.reply(200, ipPoolFixtures.ok);
			});
			afterEach(nock.cleanAll);

			describe('Promises', () => {
				it('returns something thenable', () => {
					expect(fetchMetrics(goodParams).then).to.be.a('function');
				});

				it('returns a resolved promise', (done) => {
					fetchMetrics(goodParams)
						.then(() => done())
						.catch(done);
				});
			});

			describe('Fetch requests', () => {
				it('calls the expected url', () => {
					return fetchMetrics(goodParams).then(() => {
						expect(this.nocked.isDone()).to.be.true;
					});
				});

				it('calls with the expected `Authorization` header', () => {
					this.nocked.matchHeader('Authorization', testEspMetricsApiKey);

					return fetchMetrics(goodParams).then(() => {
						expect(this.nocked.isDone()).to.be.true;
					});
				});

				it('parses a JSON string response', () => {
					nock.cleanAll();
					nock(espMetricsBaseUrl)
						.get(ipPoolUrl)
						.reply(200, JSON.stringify({ results: { test: 'hello' } }));

					return fetchMetrics(goodParams).then((metrics) => {
						expect(metrics).to.deep.equal({ test: 'hello' });
					});
				});

				it('passes on a custom `from` ISO datetime', () => {
					nock.cleanAll();

					const customFrom = '2018-01-01T10:00';
					const [, defaultTimezone] = defaultQueryParams;
					const ipPoolUrlCustomFrom = `/deliverability/ip-pool?from=${customFrom}&${defaultTimezone}&${exampleMetrics}`;

					const nocked = nock(espMetricsBaseUrl)
						.get(ipPoolUrlCustomFrom)
						.reply(200, ipPoolFixtures.ok);

					const params = {
						...goodParams,
						fromIsoDatetime: customFrom
					};

					return fetchMetrics(params).then(() => {
						expect(nocked.isDone()).to.be.true;
					});
				});

				it('passes on requested metrics names to the API', () => {
					nock.cleanAll();

					const [defaultFrom, defaultTimezone] = defaultQueryParams;
					const customMetrics = ['count_delayed', 'count_unsubscribe'];
					const ipPoolUrlCustomMetrics = `/deliverability/ip-pool?${defaultFrom}&${defaultTimezone}&metrics=${customMetrics.join()}`;

					const nocked = nock(espMetricsBaseUrl)
						.get(ipPoolUrlCustomMetrics)
						.reply(200, ipPoolFixtures.ok);

					const params = {
						...goodParams,
						metricNames: new Set(customMetrics)
					};

					return fetchMetrics(params).then(() => {
						expect(nocked.isDone()).to.be.true;
					});
				});

				it('passes on requested orderBy field to the API', () => {
					nock.cleanAll();

					const [defaultFrom, defaultTimezone] = defaultQueryParams;
					const ipPoolUrlCustomOrder = `/deliverability/ip-pool?${defaultFrom}&${defaultTimezone}&${exampleMetrics}&order_by=count_injected`;

					const nocked = nock(espMetricsBaseUrl)
						.get(ipPoolUrlCustomOrder)
						.reply(200, ipPoolFixtures.ok);

					const params = {
						...goodParams,
						orderBy: 'count_injected'
					};

					return fetchMetrics(params).then(() => {
						expect(nocked.isDone()).to.be.true;
					});
				});
			});
		});

		describe('When not everything is great tbqh', () => {
			afterEach(nock.cleanAll);

			it('rejects if no apiName is passed in', () => {
				const promise = fetchMetrics({
					...goodParams,
					apiName: null
				});

				return expect(promise).to.be.rejectedWith(Error);
			});

			it('rejects if no metricNames are passed in', () => {
				const promise = fetchMetrics({
					...goodParams,
					metricNames: null
				});

				return expect(promise).to.be.rejectedWith(Error);
			});

			it('rejects if an unknown apiName is passed in', () => {
				const promise = fetchMetrics({
					...goodParams,
					apiName: 'totallyMadeUpApiName'
				});

				return expect(promise).to.be.rejectedWith(Error);
			});

			it('rejects if the server responds with an error (how dare they)', () => {
				nock(espMetricsBaseUrl)
					.get(ipPoolUrl)
					.reply(500, ipPoolFixtures.serverError);

				const promise = fetchMetrics(goodParams);

				return expect(promise).to.be.rejectedWith(Error);
			});

			it('rejects if the server responds with a bad request error', () => {
				nock(espMetricsBaseUrl)
					.get(ipPoolUrl)
					.reply(400, ipPoolFixtures.badRequest);

				const promise = fetchMetrics(goodParams);

				return expect(promise).to.be.rejectedWith(Error);
			});

			it('rejects if the server responds as a teapot', () => {
				nock(espMetricsBaseUrl)
					.get(ipPoolUrl)
					.reply(418, ipPoolFixtures.serverError);

				const promise = fetchMetrics(goodParams);

				return expect(promise).to.be.rejectedWith(Error);
			});
		});
	});

	describe('General failures', () => {
		afterEach(nock.cleanAll);

		it('rejects if no params are passed in', () => {
			const promise = fetchMetrics();

			return expect(promise).to.be.rejectedWith(Error);
		});
	});
});
