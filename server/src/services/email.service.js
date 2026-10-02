import { Resend } from 'resend';
import environment from '../config/env.js';

let client = null;

function isConfigured() {
  return Boolean(environment.RESEND_API_KEY && environment.EMAIL_FROM);
}

function getClient() {
  if (!client) {
    client = new Resend(environment.RESEND_API_KEY);
  }

  return client;
}

export async function sendEmail({ to, subject, text, html, replyTo }) {
  if (!isConfigured()) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('Email is not configured.');
    }

    
    console.info(`[Development email]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return;
  }

  const { error } = await getClient().emails.send({
    from: environment.EMAIL_FROM,
    to,
    subject,
    text,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message ?? error.name ?? 'unknown Resend error'}`);
  }
}
