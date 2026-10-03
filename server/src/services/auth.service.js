import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Candidate from '../models/candidate.model.js';
import RecruiterCompany from '../models/recruiter-company.model.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { AppError } from '../utils/app-error.js';
import { createAccessToken, createRefreshToken } from '../utils/auth-tokens.js';
import { generateCandidateReference } from './reference-number.service.js';

const PUBLIC_REGISTRATION_ROLES = [USER_ROLES.TALENT, USER_ROLES.RECRUITER];
const PASSWORD_SALT_ROUNDS = 12;

const SKIP_EMAIL_VERIFICATION = true;

export function serializeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
  };
}

export async function registerUser({ firstName, lastName, email, password, role, companyName }) {
  if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
    throw new AppError('Only Talent and Recruiter accounts can be registered publicly.', 403);
  }

  const existingUser = await User.exists({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('An account already exists for this email address.', 409);
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    role,
    ...(SKIP_EMAIL_VERIFICATION ? { isEmailVerified: true } : {}),
  });

  try {
    await createRoleProfile(user, { companyName });
  } catch (error) {
    await User.deleteOne({ _id: user.id });
    throw error;
  }

  return createSession(user);
}

async function createRoleProfile(user, { companyName }) {
  if (user.role === USER_ROLES.TALENT) {
    await Candidate.create({ user: user.id, referenceNumber: await generateCandidateReference() });
    return;
  }

  if (user.role === USER_ROLES.RECRUITER) {
    await RecruiterCompany.create({
      user: user.id,
      companyName,
      companyEmail: user.email,
      contactPerson: `${user.firstName} ${user.lastName}`,
    });
  }
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  if (SKIP_EMAIL_VERIFICATION && !user.isEmailVerified) {
    user.isEmailVerified = true;
  }

  user.lastLoginAt = new Date();
  await user.save();

  return createSession(user);
}

export async function createSession(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  return { user: serializeUser(user), accessToken, refreshToken };
}
