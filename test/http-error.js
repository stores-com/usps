const assert = require('node:assert');
const test = require('node:test');

const HttpError = require('../http-error');

test('HttpError', { concurrency: true }, async (t) => {
    t.test('should capture non-JSON response body as text', async () => {
        const response = new Response('Not JSON', { status: 400, statusText: 'Bad Request' });
        const err = await HttpError.from(response);

        assert.strictEqual(err.name, 'HttpError');
        assert.strictEqual(err.message, '400 Bad Request');
        assert.strictEqual(err.text, 'Not JSON');
        assert.strictEqual(err.json, undefined);
    });

    t.test('should capture JSON response body', async () => {
        const response = new Response('{"error":"invalid"}', { status: 422, statusText: 'Unprocessable Entity' });
        const err = await HttpError.from(response);

        assert.strictEqual(err.text, '{"error":"invalid"}');
        assert.deepStrictEqual(err.json, { error: 'invalid' });
    });
});
