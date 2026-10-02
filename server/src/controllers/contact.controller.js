import User from '../models/user.model.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import { sendEmail } from '../services/email.service.js';
import { contactMessageEmail } from '../services/email-templates.js';

/**
 * Public "Contact us" form. Emails every active administrator with the
 * message, reply-to set to the sender. Delivery is best-effort: a mail
 * outage must not surface as a failed submission to the visitor.
 */
export const submitContactMessage = asyncHandler(async (request, response) => {
  const { name, email, subject, message } = request.validated;

  const admins = await User.find({ role: USER_ROLES.ADMIN, isActive: true }).select('email');
  const mail = contactMessageEmail({ name, email, subject, message });

  if (admins.length === 0) {
    console.warn('A contact message was submitted but no active administrator exists to notify.');
  } else {
    await Promise.allSettled(
      admins.map((admin) => sendEmail({ to: admin.email, replyTo: email, ...mail })),
    );
  }

  sendSuccess(response, {
    message: "Thanks for reaching out — we'll reply within one business day.",
  });
});
