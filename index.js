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

        cache.put(key, json, Number(json.expires_in) * 1000 / 2);

        return json;
    };

    /**
     * This API allows users to retrieve either a summary or detailed information about a specific USPS® package.
     * @see https://developers.usps.com/trackingv3
     */
    this.getTracking = async (trackingNumber, _options = {}) => {
        const accessToken = await this.getAccessToken();

        const body = [{
            trackingNumber: `${trackingNumber}`,
            ...(_options.destinationZIPCode && { destinationZIPCode: _options.destinationZIPCode }),
            ...(_options.mailingDate && { mailingDate: _options.mailingDate })
        }];

        const query = new URLSearchParams();

        if (_options.expand) {
            query.set('expand', _options.expand);
        }

        const res = await fetch(`${options.environment_url}/tracking/v3r2/tracking?${query.toString()}`, {
            body: JSON.stringify(body),
            headers: {
                Authorization: `Bearer ${accessToken.access_token}`,
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
