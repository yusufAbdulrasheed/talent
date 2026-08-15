import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Candidate from '../models/candidate.model.js';
import RecruiterCompany from '../models/recruiter-company.model.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { createAccessToken } from '../utils/auth-tokens.js';
import { generateCandidateReference } from '../services/reference-number.service.js';

export const TEST_PASSWORD = 'password123';

let sequence = 0;

function uniqueEmail(prefix) {
  sequence += 1;
  return `${prefix}${sequence}@example.test`;
}

export async function createUser({ role = USER_ROLES.TALENT, isEmailVerified = true, isActive = true, email } = {}) {
  return User.create({
    firstName: 'Test',
    lastName: role,
    email: email ?? uniqueEmail(role),
    passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
    role,
    isEmailVerified,
    isActive,
  });
}

/** Creates a user of the given role and returns `{ user, token }`. */
export async function createAuthedUser(options = {}) {
  const user = await createUser(options);
  return { user, token: createAccessToken(user) };
}

export async function createCandidate({
  user,
  status = CANDIDATE_STATUSES.APPROVED,
  overrides = {},
} = {}) {
  const owner = user ?? (await createUser({ role: USER_ROLES.TALENT }));

  const candidate = await Candidate.create({
    user: owner.id,
    referenceNumber: await generateCandidateReference(),
    phoneNumber: '+2348012345678',
    gender: 'female',
    dateOfBirth: new Date('1998-04-12'),
    location: 'Ikeja, Lagos',
    education: 'BSc Computer Science, Unilag',
    skills: ['React', 'Node.js'],
    certifications: ['AWS Cloud Practitioner'],
    workExperience: 'Ada Obi worked at Acme Ltd as a developer.',
    availability: 'immediate',
    experienceLevel: 'mid',
    status,
    ...overrides,
  });

  return { candidate, user: owner };
}

export async function createRecruiter({ companyName = 'Acme Nigeria' } = {}) {
  const user = await createUser({ role: USER_ROLES.RECRUITER });
  const company = await RecruiterCompany.create({
    user: user.id,
    companyName,
    companyEmail: user.email,
    contactPerson: 'Test Recruiter',
  });

  return { user, company, token: createAccessToken(user) };
}

export function bearer(token) {
  return `Bearer ${token}`;
}
