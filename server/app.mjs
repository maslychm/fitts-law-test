import express from 'express';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const MAX_SESSION_BYTES = 10 * 1024 * 1024;

export function createApp(options = {}) {
  const resultsFile = options.resultsFile || path.resolve('data', 'results.jsonl');
  const frontendDir = options.frontendDir || path.resolve('dist', 'fitts-law-test', 'browser');
  const logger = options.logger || console;
  const app = express();

  app.use(express.json({ limit: MAX_SESSION_BYTES }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.post('/api/sessions', async (request, response) => {
    const error = validateSession(request.body);
    if (error) {
      response.status(400).json({ error });
      return;
    }

    try {
      await mkdir(path.dirname(resultsFile), { recursive: true });
      await appendFile(resultsFile, `${JSON.stringify(request.body)}\n`, 'utf8');
      response.status(201).json({ sessionId: request.body.sessionId });
    } catch (writeError) {
      logger.error('Unable to append the local session result:', writeError);
      response.status(500).json({ error: 'The local results file could not be written.' });
    }
  });

  app.use(express.static(frontendDir));
  app.use((request, response, next) => {
    if (request.method === 'GET' && !request.path.startsWith('/api/')) {
      response.sendFile(path.join(frontendDir, 'index.html'));
      return;
    }
    next();
  });

  app.use((error, _request, response, next) => {
    if (error && error.type === 'entity.too.large') {
      response.status(413).json({ error: 'The session is larger than the 10 MB limit.' });
      return;
    }
    if (error instanceof SyntaxError) {
      response.status(400).json({ error: 'The request body is not valid JSON.' });
      return;
    }
    next(error);
  });

  return app;
}

export function validateSession(session) {
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    return 'A session object is required.';
  }
  if (session.schemaVersion !== 1) {
    return 'schemaVersion must be 1.';
  }
  if (!isNonEmptyString(session.sessionId) || session.sessionId.length > 128) {
    return 'A valid sessionId is required.';
  }
  if (!['formal', 'demo'].includes(session.sessionType)) {
    return 'sessionType must be formal or demo.';
  }
  if (!isIsoDate(session.startedAt) || !isIsoDate(session.completedAt)) {
    return 'Valid startedAt and completedAt timestamps are required.';
  }
  if (!session.participant || typeof session.participant !== 'object' || Array.isArray(session.participant)) {
    return 'A participant object is required.';
  }
  if (!Array.isArray(session.practiceRuns) || !session.practiceRuns.every(isValidRun)) {
    return 'practiceRuns must contain labeled runs with click arrays.';
  }
  if (!Array.isArray(session.runs) || !session.runs.length || !session.runs.every(isValidRun)) {
    return 'runs must contain at least one labeled run with a click array.';
  }
  if (!session.overallAverage || typeof session.overallAverage !== 'object' || Array.isArray(session.overallAverage)) {
    return 'An overallAverage object is required.';
  }
  return null;
}

function isValidRun(run) {
  return run && typeof run === 'object' && isNonEmptyString(run.label) &&
    ['practice', 'formal', 'demo'].includes(run.phase) && Array.isArray(run.clicks);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value) {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}
