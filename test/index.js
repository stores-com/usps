const assert = require('node:assert');
const test = require('node:test');

const cache = require('memory-cache');

const USPS = require('../index');

const mock = test.mock;

const ACCESS_TOKEN = {
    access_token: 'test-access-token',
    expires_in: 3600,
    token_type: 'Bearer'
};

function jsonResponse(body, status) {
    return new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json' },
        status: status || 200
    });
}

// Replace global fetch with a router for the USPS sandbox endpoints so the
// suite never touches the live API. `overrides` maps a pathname to a function
// returning the Response for that endpoint, letting a test force an error.
function mockUspsFetch(overrides) {
    const routes = overrides || {};

    mock.method(globalThis, 'fetch', async (url, init) => {
        const pathname = new URL(url).pathname;

        if (routes[pathname]) {
            return routes[pathname](init);
        }

        if (pathname === '/oauth2/v3/token') {
            return jsonResponse(ACCESS_TOKEN);
        }

        if (pathname === '/tracking/v3r2/tracking') {
            const body = JSON.parse(init.body);

            if (!body[0] || !body[0].trackingNumber || body[0].trackingNumber === 'null') {
                return jsonResponse({ error: 'A valid tracking number is required.' }, 400);
            }

            return jsonResponse(body.map(item => ({ trackingEvents: [], trackingNumber: item.trackingNumber })));
        }

        return new Response('Not found', { status: 404 });
    });
}

test('getAccessToken', async (t) => {
    t.afterEach(() => {
        mock.restoreAll();
        cache.clear();
    });

    t.test('should return an error for invalid environment_url', async () => {
        // No mock here: this exercises the real fetch URL parsing.
        const usps = new USPS({
            environment_url: 'invalid'
        });

        await assert.rejects(usps.getAccessToken(), { message: 'Failed to parse URL from invalid/oauth2/v3/token' });
    });

    t.test('should return an error for non 200 status code', async () => {
        mockUspsFetch({
            '/oauth2/v3/token': () => new Response('Server error', { status: 500, statusText: 'Internal Server Error' })
        });

        const usps = new USPS({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret'
        });

        await assert.rejects(usps.getAccessToken(), (err) => {
            assert.strictEqual(err.name, 'HttpError');
            assert.match(err.message, /^500/);
            return true;
        });
    });

    t.test('should return a valid access token', async () => {
        mockUspsFetch();

        const usps = new USPS({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret'
        });

        const accessToken = await usps.getAccessToken();

        assert(accessToken);
        assert(accessToken.access_token);
        assert(accessToken.expires_in);
        assert.strictEqual(accessToken.token_type, 'Bearer');
    });

    t.test('should return the same access token on subsequent calls', async () => {
        mockUspsFetch();

        const usps = new USPS({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret'
        });

        const accessToken1 = await usps.getAccessToken();
        const accessToken2 = await usps.getAccessToken();

        assert.deepStrictEqual(accessToken2, accessToken1);
        // The second call should be served from cache, not a second fetch.
        assert.strictEqual(globalThis.fetch.mock.calls.length, 1);
    });
});

test('getTracking', async (t) => {
    t.afterEach(() => {
        mock.restoreAll();
        cache.clear();
    });

    t.test('should return tracking data for tracking number', async () => {
        mockUspsFetch();

        const usps = new USPS({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret'
        });

        const tracking = await usps.getTracking('9434650899562092878282');

        assert(tracking);
        // Response should be an array since request was an array
        assert(Array.isArray(tracking) || tracking.trackingNumber);
    });

    t.test('should support destinationZIPCode option', async () => {
        mockUspsFetch();

        const usps = new USPS({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret'
        });

        const tracking = await usps.getTracking('9434650899562092878282', {
            destinationZIPCode: '20500'
        });

        assert(tracking);
    });

    t.test('should support mailingDate option', async () => {
        mockUspsFetch();

        const usps = new USPS({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret'
        });

        const tracking = await usps.getTracking('9434650899562092878282', {
            mailingDate: '2026-01-01'
        });

        assert(tracking);
    });

    t.test('should handle error for blank tracking number', async () => {
        mockUspsFetch();

        const usps = new USPS({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret'
        });

        await assert.rejects(usps.getTracking(null));
    });
});
