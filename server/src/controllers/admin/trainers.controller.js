import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../../models/user.model.js';
import TrainerAssignment from '../../models/trainer-assignment.model.js';
import { USER_ROLES } from '../../constants/user-roles.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { paginate } from '../../utils/pagination.js';
import { sendTrainerInvite } from '../../services/account-token.service.js';

function serializeTrainer(user, assignmentCount) {
  return {
    id: user.id ?? user._id?.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    ...(assignmentCount === undefined ? {} : { assignmentCount }),
  };
}

export const listTrainers = asyncHandler(async (request, response) => {
  const { page, limit } = request.validatedQuery;

  const { items, pagination } = await paginate(User, {
    query: { role: USER_ROLES.TRAINER },
    page,
    limit,
    select: 'firstName lastName email isActive isEmailVerified lastLoginAt createdAt',
  });

  const counts = await TrainerAssignment.aggregate([
    { $match: { trainer: { $in: items.map((trainer) => trainer._id) } } },
    { $group: { _id: '$trainer', count: { $sum: 1 } } },
  ]);
  const countByTrainer = Object.fromEntries(counts.map(({ _id, count }) => [_id.toString(), count]));

  sendSuccess(response, {
    data: {
      trainers: items.map((trainer) => serializeTrainer(trainer, countByTrainer[trainer.id] ?? 0)),
      pagination,
    },
  });
});

/**
 * Creates a trainer account. Trainers cannot self-register, so the account is
 * made with an unusable random password and the trainer sets their own via the
 * invite link. The password is never transmitted anywhere.
 */
export const createTrainer = asyncHandler(async (request, response) => {
  const { firstName, lastName, email } = request.validated;

  if (await User.exists({ email: email.toLowerCase() })) {
    throw new AppError('An account already exists for this email address.', 409);
  }

  const unusablePassword = crypto.randomBytes(48).toString('base64url');
  const trainer = await User.create({
    firstName,
    lastName,
    email,
    passwordHash: await bcrypt.hash(unusablePassword, 12),
    role: USER_ROLES.TRAINER,
    isEmailVerified: true,
  });

  try {
    await sendTrainerInvite(trainer.id);
  } catch (error) {
    console.error('Unable to send the trainer invitation email:', error);
  }

  sendSuccess(response, {
    status: 201,
    message: 'Trainer created. An invitation to set their password has been sent.',
    data: { trainer: serializeTrainer(trainer) },
  });
});

export const setTrainerStatus = asyncHandler(async (request, response) => {
  const trainer = await User.findOne({ _id: request.params.id, role: USER_ROLES.TRAINER });

  if (!trainer) {
    throw new AppError('Trainer not found.', 404);
  }

  trainer.isActive = request.validated.isActive;
  await trainer.save();

  sendSuccess(response, {
    message: trainer.isActive ? 'Trainer reactivated.' : 'Trainer deactivated.',
    data: { trainer: serializeTrainer(trainer) },
  });
});
