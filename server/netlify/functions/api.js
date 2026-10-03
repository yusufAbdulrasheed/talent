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

export function resolveClientIp(headers = {}) {
  let viaNetlify;
  let viaForwardedFor;

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'x-nf-client-connection-ip') viaNetlify = value;
    else if (lowerKey === 'x-forwarded-for') viaForwardedFor = value;
  }

  if (viaNetlify) return viaNetlify;
  if (viaForwardedFor) return viaForwardedFor.split(',')[0].trim();
  return undefined;
}

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  await ensureDatabaseConnected();

  const rewrittenEvent =
    typeof event.path === 'string' && event.path.startsWith(FUNCTION_PATH_PREFIX)
      ? { ...event, path: `/api${event.path.slice(FUNCTION_PATH_PREFIX.length)}` }
      : event;

  // serverless-http builds the synthetic request's remoteAddress from
  // event.requestContext.identity.sourceIp, which Netlify's own event
  // doesn't reliably populate (unlike real AWS API Gateway) — without this,
  // Express's req.ip comes out undefined and express-rate-limit throws
  // rather than keying everyone into one bucket. x-nf-client-connection-ip
  // is Netlify's own documented, reliable client-IP header.
  const clientIp = resolveClientIp(rewrittenEvent.headers);
  if (clientIp) {
    rewrittenEvent.requestContext = {
      ...rewrittenEvent.requestContext,
      identity: { ...rewrittenEvent.requestContext?.identity, sourceIp: clientIp },
    };
  }

  return serverlessHandler(rewrittenEvent, context);
}
