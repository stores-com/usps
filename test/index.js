const assert = require('node:assert');
const test = require('node:test');

const nock = require('nock');

const USPS = require('../index');

test('getAccessToken', { concurrency: true }, async (t) => {
    t.test('should return an error for invalid environment_url', async () => {
        const usps = new USPS({
            environment_url: 'invalid'
        });

        await assert.rejects(usps.getAccessToken(), { message: 'Failed to parse URL from invalid/oauth2/v3/token' });
    });

    t.test('should return an error for non 200 status code', async () => {
        const usps = new USPS({
            environment_url: 'https://httpbin.org/status/500#'
        });

        await assert.rejects(usps.getAccessToken(), (err) => {
            assert.strictEqual(err.name, 'HttpError');
            assert.match(err.message, /^500/);
            return true;
        });
    });

    t.test('should return a valid access token', async () => {
        const usps = new USPS({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        });

        const accessToken = await usps.getAccessToken();

        assert(accessToken);
        assert(accessToken.access_token);
        assert(accessToken.expires_in);
        assert.strictEqual(accessToken.token_type, 'Bearer');
    });

    t.test('should return the same access token on subsequent calls', async () => {
        const usps = new USPS({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        });

        const accessToken1 = await usps.getAccessToken();
        const accessToken2 = await usps.getAccessToken();

        assert.deepStrictEqual(accessToken2, accessToken1);
    });
});

test('getTracking', { concurrency: true }, async (t) => {
    t.test('should return tracking data for tracking number', async () => {
        const usps = new USPS({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        });

        const tracking = await usps.getTracking('9434650899562092878282');

        assert(tracking);
        // Response should be an array since request was an array
        assert(Array.isArray(tracking) || tracking.trackingNumber);
    });

    t.test('should pass optional parameters in request body', async () => {
        const scope = nock('https://apis-tem.usps.com')
            .post('/oauth2/v3/token')
            .reply(200, { access_token: 'test', expires_in: 3600, token_type: 'Bearer' })
            .post('/tracking/v3r2/tracking', (body) => {
                assert.deepStrictEqual(body, [{
                    trackingNumber: '9434650899562092878282',
                    destinationZIPCode: '20500',
                    expand: 'DETAIL',
                    mailingDate: '2026-01-01'
                }]);

                return true;
            })
            .reply(200, {});

        const usps = new USPS({
            client_id: 'test',
            client_secret: 'test'
        });

        await usps.getTracking('9434650899562092878282', {
            destinationZIPCode: '20500',
            expand: 'DETAIL',
            mailingDate: '2026-01-01'
        });

        scope.done();
    });

    t.test('should handle error for blank tracking number', async () => {
        const usps = new USPS({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        });

        await assert.rejects(usps.getTracking(null));
    });
});
