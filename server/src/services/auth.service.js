import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Candidate from '../models/candidate.model.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { AppError } from '../utils/app-error.js';
import { createAccessToken, createRefreshToken } from '../utils/auth-tokens.js';

const PUBLIC_REGISTRATION_ROLES = [USER_ROLES.TALENT, USER_ROLES.RECRUITER];

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

export async function registerUser({ firstName, lastName, email, password, role }) {
  if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
    throw new AppError('Only Talent and Recruiter accounts can be registered publicly.', 403);
  }

  const existingUser = await User.exists({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('An account already exists for this email address.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ firstName, lastName, email, passwordHash, role });

  if (role === USER_ROLES.TALENT) {
    try {
      await createCandidateRecord(user.id);
    } catch (error) {
      await User.deleteOne({ _id: user.id });
      throw error;
    }
  }

  return createSession(user);
}

async function createCandidateRecord(userId) {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceNumber = `TAL-${year}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    try {
      await Candidate.create({ user: userId, referenceNumber });
      return;
    } catch (error) {
      if (error.code !== 11000 || attempt === 4) {
        throw error;
      }
    }
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

  user.lastLoginAt = new Date();
  await user.save();

  return createSession(user);
}

export async function createSession(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  return { user: serializeUser(user), accessToken, refreshToken };
}
