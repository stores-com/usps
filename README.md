# usps

[![Test](https://github.com/stores-com/usps/actions/workflows/test.yml/badge.svg)](https://github.com/stores-com/usps/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/stores-com/usps/badge.svg)](https://coveralls.io/github/stores-com/usps)
[![npm version](https://img.shields.io/npm/v/@stores.com/usps)](https://www.npmjs.com/package/@stores.com/usps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

USPS API client for tracking packages using OAuth 2.0 authentication.

## Installation

```
$ npm install @stores.com/usps
```

## Usage

```javascript
const USPS = require('@stores.com/usps');

const usps = new USPS({
    client_id: 'your_client_id',
    client_secret: 'your_client_secret',
    environment_url: 'https://apis-tem.usps.com' // Use https://apis.usps.com for production
});
```

## Documentation

- https://developers.usps.com/

## Methods

### getAccessToken()

OAuth access tokens are used to grant authorized access to USPS® APIs. Access tokens will expire, requiring applications to periodically check the expiration time and get new tokens.

See: https://developers.usps.com/Oauth

```javascript
const accessToken = await usps.getAccessToken();

console.log(accessToken);
// {
//     access_token: '...',
//     expires_in: '3600',
//     token_type: 'Bearer'
// }
```

### getTracking(trackingNumber, options)

This API allows users to retrieve either a summary or detailed information about a specific USPS® package.

See: https://developers.usps.com/trackingv3r2

```javascript
const tracking = await usps.getTracking('9434650899562092878282');

console.log(tracking);
// [{
//     trackingNumber: '9434650899562092878282',
//     statusCategory: 'Delivered',
//     statusSummary: '...',
//     ...
// }]
```

#### Options

| Name | Description |
| --- | --- |
| `destinationZIPCode` | Destination ZIP Code |
| `mailingDate` | Mailing date (e.g. `2026-01-01`) |

```javascript
const tracking = await usps.getTracking('9434650899562092878282', {
    destinationZIPCode: '20500'
});
```
