import environment from '../config/env.js';

const BRAND_NAME = 'Sultan Magnate Consulting';

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
      <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#000066;">${escapeHtml(BRAND_NAME)}</p>
      <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>
      ${bodyHtml}
      <p style="margin:32px 0 0;font-size:12px;color:#64748b;">${escapeHtml(BRAND_NAME)}</p>
    </div>
  </body>
</html>`;
}

function button(href, label) {
  return `<p style="margin:24px 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;background:#0000f8;color:#ffffff;border-radius:8px;text-decoration:none;">${escapeHtml(label)}</a>
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

export function candidateApprovedEmail({ firstName, referenceNumber }) {
  const link = new URL('/talent', environment.CLIENT_URL).toString();

  return {
    subject: 'Your application has been approved',
    text: `Hello ${firstName},\n\nGood news — your application (${referenceNumber}) has been approved. Your anonymous profile is now visible to recruiters in our talent pool.\n\nView your dashboard: ${link}`,
    html: layout({
      heading: `Hello ${firstName},`,
      bodyHtml: `<p style="margin:0 0 12px;">Good news — your application <strong>${escapeHtml(referenceNumber)}</strong> has been approved.</p>
      <p style="margin:0;">Your anonymous profile is now visible to recruiters in our talent pool. Your name and contact details stay private until a placement is agreed.</p>${button(link, 'View your dashboard')}`,
    }),
  };
}

export function candidateRejectedEmail({ firstName, referenceNumber, note }) {
  const link = new URL('/talent', environment.CLIENT_URL).toString();
  const noteHtml = note
    ? `<p style="margin:16px 0 0;padding:12px;background:#f1f5f9;border-radius:8px;"><strong>Reviewer note:</strong><br>${escapeHtml(note)}</p>`
    : '';

  return {
    subject: 'An update on your application',
    text: `Hello ${firstName},\n\nWe have reviewed your application (${referenceNumber}) and it was not approved at this time.${note ? `\n\nReviewer note: ${note}` : ''}\n\nView your dashboard: ${link}`,
    html: layout({
      heading: `Hello ${firstName},`,
      bodyHtml: `<p style="margin:0;">We have reviewed your application <strong>${escapeHtml(referenceNumber)}</strong> and it was not approved at this time.</p>${noteHtml}${button(link, 'View your dashboard')}`,
    }),
  };
}

export function placementRequestStatusEmail({ contactPerson, jobTitle, candidateReference, status, note }) {
  const link = new URL('/recruiter/requests', environment.CLIENT_URL).toString();
  const readableStatus = status.replaceAll('_', ' ');
  const noteHtml = note
    ? `<p style="margin:16px 0 0;padding:12px;background:#f1f5f9;border-radius:8px;"><strong>Note from our team:</strong><br>${escapeHtml(note)}</p>`
    : '';

  return {
    subject: `Your placement request is now ${readableStatus}`,
    text: `Hello ${contactPerson},\n\nYour placement request for ${jobTitle} (candidate ${candidateReference}) is now "${readableStatus}".${note ? `\n\nNote: ${note}` : ''}\n\nView your requests: ${link}`,
    html: layout({
      heading: `Hello ${escapeHtml(contactPerson)},`,
      bodyHtml: `<p style="margin:0;">Your placement request for <strong>${escapeHtml(jobTitle)}</strong> (candidate ${escapeHtml(candidateReference)}) is now <strong>${escapeHtml(readableStatus)}</strong>.</p>${noteHtml}${button(link, 'View your requests')}`,
    }),
  };
}

export function trainerInviteEmail({ firstName, token }) {
  const link = buildLink('/reset-password', token);

  return {
    subject: 'Your trainer account is ready',
    text: `Hello ${firstName},\n\nAn administrator has created a trainer account for you. Set your password to sign in:\n${link}\n\nThis link expires in one hour. If it expires, use "Forgot password" on the sign-in page.`,
    html: layout({
      heading: `Hello ${firstName},`,
      bodyHtml: `<p style="margin:0;">An administrator has created a trainer account for you. Set your password to sign in.</p>${button(link, 'Set your password')}<p style="margin:16px 0 0;font-size:13px;color:#64748b;">This link expires in one hour. If it expires, use “Forgot password” on the sign-in page.</p>`,
    }),
  };
}

export function placementRequestEmail({
  companyName,
  candidateReference,
  jobTitle,
  employmentType,
  location,
  candidateCount = 1,
}) {
  const link = new URL('/admin/placement-requests', environment.CLIENT_URL).toString();
  const rows = [
    ['Company', companyName],
    [candidateCount > 1 ? 'Candidate references' : 'Candidate reference', candidateReference],
    ['Job title', jobTitle],
    ['Employment type', employmentType.replaceAll('_', ' ')],
    ['Location', location],
    ['Talents requested', String(candidateCount)],
  ];

  return {
    subject: `New placement request from ${companyName}`,
    text: `A recruiter has submitted a placement request.\n\n${rows.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nReview it here: ${link}`,
    html: layout({
      heading: 'New placement request',
      bodyHtml: `<p style="margin:0 0 16px;">A recruiter has submitted a placement request.</p>
      <dl style="margin:0;font-size:14px;">
        ${rows
          .map(
            ([key, value]) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #e2e8f0;"><dt style="color:#64748b;">${escapeHtml(key)}</dt><dd style="margin:0;font-weight:600;">${escapeHtml(value)}</dd></div>`,
          )
          .join('')}
      </dl>${button(link, 'Review placement requests')}`,
    }),
  };
}

export function savingsWithdrawalRequestEmail({ referenceNumber, amount }) {
  const link = new URL('/admin/savings-withdrawals', environment.CLIENT_URL).toString();

  return {
    subject: `Savings withdrawal request from ${referenceNumber}`,
    text: `${referenceNumber} has requested a savings withdrawal of ${amount}.\n\nReview it here: ${link}`,
    html: layout({
      heading: 'New savings withdrawal request',
      bodyHtml: `<p style="margin:0;">Candidate <strong>${escapeHtml(referenceNumber)}</strong> has requested a withdrawal of <strong>${escapeHtml(String(amount))}</strong>.</p>${button(link, 'Review withdrawal requests')}`,
    }),
  };
}

export function savingsWithdrawalDecisionEmail({ firstName, amount, status, decisionNote }) {
  const link = new URL('/talent/savings', environment.CLIENT_URL).toString();
  const isApproved = status === 'approved';
  const noteHtml = decisionNote
    ? `<p style="margin:16px 0 0;padding:12px;background:#f1f5f9;border-radius:8px;"><strong>Note from our team:</strong><br>${escapeHtml(decisionNote)}</p>`
    : '';

  return {
    subject: isApproved ? 'Your withdrawal request was approved' : 'An update on your withdrawal request',
    text: `Hello ${firstName},\n\nYour savings withdrawal request for ${amount} was ${status}.${decisionNote ? `\n\nNote: ${decisionNote}` : ''}\n\nView your savings: ${link}`,
    html: layout({
      heading: `Hello ${firstName},`,
      bodyHtml: `<p style="margin:0;">Your savings withdrawal request for <strong>${escapeHtml(String(amount))}</strong> was <strong>${escapeHtml(status)}</strong>.</p>${noteHtml}${button(link, 'View your savings')}`,
    }),
  };
}

export function contactMessageEmail({ name, email, subject, message }) {
  const heading = subject ? `Contact: ${subject}` : 'New contact message';
  const rows = [
    ['From', name],
    ['Email', email],
    ['Subject', subject || '—'],
  ];

  return {
    subject: `[Website] ${subject || `Message from ${name}`}`,
    text: `${rows.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nMessage:\n${message}`,
    html: layout({
      heading,
      bodyHtml: `<dl style="margin:0 0 16px;font-size:14px;">
        ${rows
          .map(
            ([key, value]) =>
              `<div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #e2e8f0;"><dt style="color:#64748b;">${escapeHtml(key)}</dt><dd style="margin:0;font-weight:600;">${escapeHtml(value)}</dd></div>`,
          )
          .join('')}
      </dl>
      <p style="margin:0 0 6px;color:#64748b;font-size:13px;">Message</p>
      <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>`,
    }),
  };
}
