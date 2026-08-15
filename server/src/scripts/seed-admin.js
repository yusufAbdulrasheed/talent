import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/user.model.js';
import { USER_ROLES } from '../constants/user-roles.js';

const PASSWORD_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;

/**
 * Creates the first administrator account. Public registration is limited to
 * talents and recruiters, so this is the only way an admin comes into being.
 *
 *   npm run seed:admin --workspace=server
 *
 * Reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME.
 * Re-running is safe: an existing account is reported, never overwritten.
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'System';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Administrator';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding an administrator.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  await connectDatabase();

  const existing = await User.findOne({ email });

  if (existing) {
    console.info(
      existing.role === USER_ROLES.ADMIN
        ? `An administrator already exists for ${email}. Nothing to do.`
        : `A ${existing.role} account already uses ${email}. Choose a different ADMIN_EMAIL.`,
    );
    return;
  }

  await User.create({
    firstName,
    lastName,
    email,
    passwordHash: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS),
    role: USER_ROLES.ADMIN,
    // Seeded by an operator who already controls the mailbox.
    isEmailVerified: true,
  });

  console.info(`Administrator created for ${email}.`);
}

seedAdmin()
  .catch((error) => {
    console.error('Unable to seed the administrator account:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDatabase();
    }
  });
