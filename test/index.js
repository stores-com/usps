const assert = require('node:assert');
const test = require('node:test');

const cache = require('memory-cache');

const USPS = require('../index');

test('getAccessToken', { concurrency: true }, async (t) => {
    t.after(() => {
        cache.clear();
    });

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
    t.after(() => {
        cache.clear();
    });

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

    t.test('should handle error for blank tracking number', async () => {
        const usps = new USPS({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET
        });

        await assert.rejects(usps.getTracking(null));
    });
});
