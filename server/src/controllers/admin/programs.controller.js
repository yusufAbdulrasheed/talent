import Program from '../../models/program.model.js';
import TrainerAssignment from '../../models/trainer-assignment.model.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/api-response.js';
import { paginate } from '../../utils/pagination.js';

function serializeAssignment(assignment) {
  const trainer = assignment.trainer;
  const program = assignment.program;

  return {
    id: assignment.id ?? assignment._id?.toString(),
    trainer: trainer
      ? { id: trainer._id?.toString(), fullName: `${trainer.firstName} ${trainer.lastName}`, email: trainer.email }
      : null,
    program: program ? { id: program._id?.toString(), title: program.title } : null,
    batchName: assignment.batchName,
    candidateCount: assignment.assignedCandidates?.length ?? 0,
    announcement: assignment.announcement,
    isActive: assignment.isActive,
    createdAt: assignment.createdAt,
  };
}

export const listPrograms = asyncHandler(async (request, response) => {
  const { page, limit } = request.validatedQuery;
  const { items, pagination } = await paginate(Program, { query: {}, page, limit, sort: { title: 1 } });

  sendSuccess(response, { data: { programs: items, pagination } });
});

export const createProgram = asyncHandler(async (request, response) => {
  const program = await Program.create(request.validated);
  sendSuccess(response, { status: 201, message: 'Program created.', data: { program } });
});

export const updateProgram = asyncHandler(async (request, response) => {
  const program = await Program.findById(request.params.id);

  if (!program) {
    throw new AppError('Program not found.', 404);
  }

  Object.assign(program, request.validated);
  await program.save();

  sendSuccess(response, { message: 'Program updated.', data: { program } });
});

export const listAssignments = asyncHandler(async (request, response) => {
  const { page, limit } = request.validatedQuery;

  const { items, pagination } = await paginate(TrainerAssignment, {
    query: {},
    page,
    limit,
    populate: [
      { path: 'trainer', select: 'firstName lastName email' },
      { path: 'program', select: 'title' },
    ],
  });

  sendSuccess(response, {
    data: { assignments: items.map(serializeAssignment), pagination },
  });
});

export const createAssignment = asyncHandler(async (request, response) => {
  const assignment = await TrainerAssignment.create(request.validated);
  await assignment.populate([
    { path: 'trainer', select: 'firstName lastName email' },
    { path: 'program', select: 'title' },
  ]);

  sendSuccess(response, {
    status: 201,
    message: 'Assignment created.',
    data: { assignment: serializeAssignment(assignment) },
  });
});

export const updateAssignment = asyncHandler(async (request, response) => {
  const assignment = await TrainerAssignment.findById(request.params.id);

  if (!assignment) {
    throw new AppError('Assignment not found.', 404);
  }

  Object.assign(assignment, request.validated);
  await assignment.save();
  await assignment.populate([
    { path: 'trainer', select: 'firstName lastName email' },
    { path: 'program', select: 'title' },
  ]);

  sendSuccess(response, {
    message: 'Assignment updated.',
    data: { assignment: serializeAssignment(assignment) },
  });
});
