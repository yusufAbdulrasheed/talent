import nodemailer from 'nodemailer';
import environment from '../config/env.js';

let transporter = null;

function isSmtpConfigured() {
  return Boolean(
    environment.SMTP_HOST
    && environment.SMTP_USER
    && environment.SMTP_PASSWORD
    && environment.SMTP_FROM,
  );
}

// One pooled transporter for the process rather than one per message.
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: environment.SMTP_HOST,
      port: environment.SMTP_PORT || 587,
      secure: Number(environment.SMTP_PORT) === 465,
      auth: { user: environment.SMTP_USER, pass: environment.SMTP_PASSWORD },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  if (!isSmtpConfigured()) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('Email is not configured.');
    }

    // Without SMTP credentials the message is logged so local flows that
    // depend on a token (verification, reset) remain testable.
    console.info(`[Development email]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return;
  }

  await getTransporter().sendMail({ from: environment.SMTP_FROM, to, subject, text, html });
}
