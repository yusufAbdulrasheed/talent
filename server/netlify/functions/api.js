import mongoose from 'mongoose';
import serverless from 'serverless-http';
import app from '../../src/app.js';
import { connectDatabase } from '../../src/config/database.js';

/**
 * Wraps the real Express app (unmodified — same file `server.js` boots
 * locally) for Netlify Functions, via serverless-http.
 *
 *   netlify.toml redirects /api/* to /.netlify/functions/api/:splat, so a
 *   browser request to /api/v1/auth/login arrives here with
 *   event.path === '/.netlify/functions/api/v1/auth/login'. app.js mounts
 *   every router under /api/v1/..., so that prefix is rewritten back before
 *   handing the event to serverless-http — the Express app itself needs no
 *   Netlify-specific knowledge at all.
 *
 * Mongoose connections are cached at module scope (readyState check first)
 * so a warm invocation reuses the existing connection instead of dialing
 * Atlas again on every request — both for latency and to avoid exhausting
 * the connection pool under load. The same guard also makes this safe to
 * import under the test suite, which already holds its own connection to an
 * in-memory MongoDB before any test runs.
 */
const serverlessHandler = serverless(app);

let connectionPromise = null;

async function ensureDatabaseConnected() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = connectDatabase().catch((error) => {
      // Let the next invocation try again rather than caching a failure forever.
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

const FUNCTION_PATH_PREFIX = '/.netlify/functions/api';

export async function handler(event, context) {
  // Mongoose keeps the socket open for reuse on the next warm invocation;
  // without this, Node waits for that socket to close before the Lambda
  // runtime considers the invocation finished, adding needless latency (and,
  // on some runtimes, time-outs) to every request.
  context.callbackWaitsForEmptyEventLoop = false;

  await ensureDatabaseConnected();

  const rewrittenEvent =
    typeof event.path === 'string' && event.path.startsWith(FUNCTION_PATH_PREFIX)
      ? { ...event, path: `/api${event.path.slice(FUNCTION_PATH_PREFIX.length)}` }
      : event;

  return serverlessHandler(rewrittenEvent, context);
}
