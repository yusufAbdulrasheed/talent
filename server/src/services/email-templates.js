import environment from '../config/env.js';

const BRAND_NAME = 'Talent Recruitment & Training Management System';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildLink(path, token) {
  const url = new URL(path, environment.CLIENT_URL);
  url.searchParams.set('token', token);
  return url.toString();
}

/**
 * Minimal, table-free HTML with a plain-text counterpart. Inline styles only,
 * since email clients strip stylesheets.
 */
function layout({ heading, bodyHtml }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;">
      <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>
      ${bodyHtml}
      <p style="margin:32px 0 0;font-size:12px;color:#64748b;">${escapeHtml(BRAND_NAME)}</p>
    </div>
  </body>
</html>`;
}

function button(href, label) {
  return `<p style="margin:24px 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#ffffff;border-radius:8px;text-decoration:none;">${escapeHtml(label)}</a>
  </p>
  <p style="margin:0;font-size:13px;color:#64748b;">If the button does not work, paste this link into your browser:<br>${escapeHtml(href)}</p>`;
}

export function verificationEmail({ firstName, token }) {
  const link = buildLink('/verify-email', token);

  return {
    subject: 'Verify your email address',
    text: `Hello ${firstName},\n\nConfirm your email address to activate your account:\n${link}\n\nThis link expires in one hour.`,
    html: layout({
      heading: `Hello ${firstName},`,
      bodyHtml: `<p style="margin:0;">Confirm your email address to activate your account.</p>${button(link, 'Verify email address')}<p style="margin:16px 0 0;font-size:13px;color:#64748b;">This link expires in one hour.</p>`,
    }),
  };
}

export function passwordResetEmail({ firstName, token }) {
  const link = buildLink('/reset-password', token);

  return {
    subject: 'Reset your password',
    text: `Hello ${firstName},\n\nUse this link to choose a new password:\n${link}\n\nThis link expires in one hour. If you did not request it, you can ignore this email.`,
    html: layout({
      heading: `Hello ${firstName},`,
      bodyHtml: `<p style="margin:0;">Use the button below to choose a new password.</p>${button(link, 'Reset password')}<p style="margin:16px 0 0;font-size:13px;color:#64748b;">This link expires in one hour. If you did not request it, you can ignore this email.</p>`,
    }),
  };
}

export function paymentReceiptEmail({ firstName, referenceNumber, reference, amount, currency, paidAt }) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
  }).format(amount);
  const formattedDate = new Date(paidAt).toLocaleString('en-NG');

  const rows = [
    ['Candidate reference', referenceNumber],
    ['Payment reference', reference],
    ['Amount', formattedAmount],
    ['Date', formattedDate],
  ];

  return {
    subject: 'Your training fee payment receipt',
    text: `Hello ${firstName},\n\nWe have received your training fee payment.\n\n${rows.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nYour application is now with our team for review.`,
    html: layout({
      heading: `Hello ${firstName},`,
      bodyHtml: `<p style="margin:0 0 16px;">We have received your training fee payment.</p>
      <dl style="margin:0;font-size:14px;">
        ${rows
          .map(
            ([key, value]) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #e2e8f0;"><dt style="color:#64748b;">${escapeHtml(key)}</dt><dd style="margin:0;font-weight:600;">${escapeHtml(value)}</dd></div>`,
          )
          .join('')}
      </dl>
      <p style="margin:24px 0 0;">Your application is now with our team for review.</p>`,
    }),
  };
}
