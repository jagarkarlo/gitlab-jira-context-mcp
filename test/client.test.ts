import assert from 'node:assert/strict';
import test from 'node:test';
import { parseJsonResponse, requiredEnvironment, trimTrailingSlash } from '../src/client.js';

test('trimTrailingSlash removes one trailing slash', () => {
  assert.equal(trimTrailingSlash('https://gitlab.example.com/'), 'https://gitlab.example.com');
  assert.equal(trimTrailingSlash('https://gitlab.example.com'), 'https://gitlab.example.com');
});

test('requiredEnvironment returns a configured value and rejects missing values', () => {
  assert.equal(requiredEnvironment({ API_URL: 'https://example.com' }, 'API_URL'), 'https://example.com');
  assert.throws(() => requiredEnvironment({}, 'API_URL'), /Missing required environment variable: API_URL/);
});

test('parseJsonResponse parses JSON and retains plain text', async () => {
  assert.deepEqual(await parseJsonResponse(new Response('{"ready":true}')), { ready: true });
  assert.equal(await parseJsonResponse(new Response('service unavailable')), 'service unavailable');
});
