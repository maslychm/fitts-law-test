import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp, validateSession } from './app.mjs';

function makeSession(overrides = {}) {
  return {
    schemaVersion: 1,
    sessionId: 'session-1',
    sessionType: 'formal',
    startedAt: '2026-08-14T12:00:00.000Z',
    completedAt: '2026-08-14T12:01:00.000Z',
    participant: { name: 'Comma, Quote " and\nnewline' },
    practiceRuns: [{ label: 'PRACTICE', phase: 'practice', clicks: [{ targetHit: true }] }],
    runs: [{ label: 'RUN #1', phase: 'formal', clicks: [{ targetHit: true }], average: {} }],
    overallAverage: { hits: 1 },
    ...overrides
  };
}

test('validates required session fields', () => {
  assert.equal(validateSession(makeSession()), null);
  assert.match(validateSession(makeSession({ sessionType: 'unknown' })), /sessionType/);
  assert.match(validateSession(makeSession({ runs: [] })), /runs/);
});

test('appends one valid JSON object per session', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'fitts-law-test-'));
  const resultsFile = path.join(directory, 'nested', 'results.jsonl');
  const server = createApp({ resultsFile }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();

  try {
    for (const sessionId of ['session-1', 'session-2']) {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeSession({ sessionId }))
      });
      assert.equal(response.status, 201);
    }

    const lines = (await readFile(resultsFile, 'utf8')).trim().split('\n');
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[0]).participant.name, 'Comma, Quote " and\nnewline');
    assert.equal(JSON.parse(lines[1]).sessionId, 'session-2');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('rejects an invalid payload without writing it', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'fitts-law-test-'));
  const server = createApp({ resultsFile: path.join(directory, 'results.jsonl') }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1 })
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /sessionId/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('reports a write failure without accepting the session', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'fitts-law-test-'));
  const blockingFile = path.join(directory, 'not-a-directory');
  await writeFile(blockingFile, 'blocking file', 'utf8');
  const server = createApp({
    resultsFile: path.join(blockingFile, 'results.jsonl'),
    logger: { error() {} }
  }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeSession())
    });
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /could not be written/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
