import assert from 'node:assert/strict';
import test from 'node:test';
import {
  optionalConnection,
  parseJsonResponse,
  requiredEnvironment,
  trimTrailingSlash
} from '../src/client.js';

test('trimTrailingSlash removes one trailing slash', () => {
  assert.equal(trimTrailingSlash('https://gitlab.example.com/'), 'https://gitlab.example.com');
  assert.equal(trimTrailingSlash('https://gitlab.example.com'), 'https://gitlab.example.com');
});

test('requiredEnvironment returns a configured value and rejects missing values', () => {
  assert.equal(requiredEnvironment({ API_URL: 'https://example.com' }, 'API_URL'), 'https://example.com');
  assert.throws(() => requiredEnvironment({}, 'API_URL'), /Missing required environment variable: API_URL/);
});

test('optionalConnection requires a complete configuration pair', () => {
  assert.equal(optionalConnection({}, 'SERVICE_URL', 'SERVICE_TOKEN'), undefined);
  assert.deepEqual(optionalConnection({ SERVICE_URL: 'https://example.com/', SERVICE_TOKEN: 'token' }, 'SERVICE_URL', 'SERVICE_TOKEN'), {
    baseUrl: 'https://example.com',
    token: 'token'
  });
  assert.throws(
    () => optionalConnection({ SERVICE_URL: 'https://example.com' }, 'SERVICE_URL', 'SERVICE_TOKEN'),
    /Set both SERVICE_URL and SERVICE_TOKEN/
  );
});

test('parseJsonResponse parses JSON and retains plain text', async () => {
  assert.deepEqual(await parseJsonResponse(new Response('{"ready":true}')), { ready: true });
  assert.equal(await parseJsonResponse(new Response('service unavailable')), 'service unavailable');
});
