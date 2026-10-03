import mongoose from 'mongoose';
import serverless from 'serverless-http';
import app from '../../src/app.js';
import { connectDatabase } from '../../src/config/database.js';

const serverlessHandler = serverless(app);

let connectionPromise = null;

async function ensureDatabaseConnected() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = connectDatabase().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

const FUNCTION_PATH_PREFIX = '/.netlify/functions/api';

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  await ensureDatabaseConnected();

  const rewrittenEvent =
    typeof event.path === 'string' && event.path.startsWith(FUNCTION_PATH_PREFIX)
      ? { ...event, path: `/api${event.path.slice(FUNCTION_PATH_PREFIX.length)}` }
      : event;

  return serverlessHandler(rewrittenEvent, context);
}
