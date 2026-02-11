# @mediocre/usps

USPS API client for tracking packages using OAuth 2.0 authentication.

## Installation

```bash
npm install @mediocre/usps
```

## Usage

```javascript
const USPS = require('@mediocre/usps');

const usps = new USPS({
    client_id: 'your_client_id',
    client_secret: 'your_client_secret'
});

// Get tracking information
const tracking = await usps.getTracking('9400100000000000000000');
console.log(tracking);
```

## Configuration

The USPS constructor accepts the following options:

- `client_id` (required): Your USPS API client ID
- `client_secret` (required): Your USPS API client secret
- `environment_url` (optional): The USPS API base URL (defaults to `https://apis.usps.com`)

## API Methods

### getAccessToken()

Retrieves an OAuth 2.0 access token. Tokens are automatically cached for half their expiry time.

```javascript
const accessToken = await usps.getAccessToken();
```

### getTracking(trackingNumber, options)

Retrieves tracking information for a package.

```javascript
const tracking = await usps.getTracking('9400100000000000000000', {
    expand: 'DETAIL' // Default value, includes detailed scan events
});
```

## Getting Started

1. Register for a USPS developer account at https://developer.usps.com/
2. Create an application to get your `client_id` and `client_secret`
3. Use the credentials to initialize the USPS client

## License

Apache-2.0
