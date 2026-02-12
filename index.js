const cache = require('memory-cache');

const HttpError = require('@stores.com/http-error');

function USPS(args) {
    const options = {
        environment_url: 'https://apis-tem.usps.com',
        ...args
    };

    /**
     * OAuth access tokens are used to grant authorized access to USPS® APIs. Access tokens will expire, requiring applications to periodically check the expiration time and get new tokens.
     * @see https://developers.usps.com/Oauth
     */
    this.getAccessToken = async (_options = {}) => {
        const url = `${options.environment_url}/oauth2/v3/token`;
        const key = `usps:oauth:${options.client_id}`;

        // Try to get the access token from memory cache
        const accessToken = cache.get(key);

        if (accessToken) {
            return accessToken;
        }

        const formData = new URLSearchParams({
            client_id: options.client_id,
            client_secret: options.client_secret,
            grant_type: 'client_credentials'
        });

        const res = await fetch(url, {
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        const json = await res.json();

        // Put the access token in memory cache
        cache.put(key, json, Number(json.expires_in) * 1000 / 2);

        return json;
    };


    this.getTracking = async (trackingNumber, _options = {}) => {
        const tokenData = await this.getAccessToken();

        // Build request body according to API spec
        const requestBody = [{
            trackingNumber: `${trackingNumber}`,
            ...(_options.mailingDate && { mailingDate: _options.mailingDate }),
            ...(_options.destinationZIPCode && { destinationZIPCode: _options.destinationZIPCode })
        }];

        const res = await fetch(`${options.environment_url}/tracking/v3r2/tracking`, {
            body: JSON.stringify(requestBody),
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            signal: AbortSignal.timeout(_options.timeout || 30000)
        });

        if (!res.ok) {
            throw await HttpError.from(res);
        }

        return await res.json();
    };
}

module.exports = USPS;
