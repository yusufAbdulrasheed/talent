import nodemailer from 'nodemailer';
import environment from '../config/env.js';

function isSmtpConfigured() {
  return Boolean(environment.SMTP_HOST && environment.SMTP_USER && environment.SMTP_PASSWORD && environment.SMTP_FROM);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT || 587,
    secure: Number(environment.SMTP_PORT) === 465,
    auth: { user: environment.SMTP_USER, pass: environment.SMTP_PASSWORD },
  });
}

export async function sendEmail({ to, subject, text }) {
  if (!isSmtpConfigured()) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('Email is not configured.');
    }

    console.info(`[Development email] To: ${to}; Subject: ${subject}; Body: ${text}`);
    return;
  }

  await createTransporter().sendMail({ from: environment.SMTP_FROM, to, subject, text });
}
