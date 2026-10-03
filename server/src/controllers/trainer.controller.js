import TrainerAssignment from '../models/trainer-assignment.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/api-response.js';

export const getMyDashboard = asyncHandler(async (request, response) => {
  const assignments = await TrainerAssignment.find({ trainer: request.user.id })
    .populate({ path: 'program', select: 'title description isActive' })
    .sort({ createdAt: -1 });

  const serialized = assignments.map((assignment) => ({
    id: assignment.id,
    batchName: assignment.batchName,
    announcement: assignment.announcement,
    isActive: assignment.isActive,
    candidateCount: assignment.assignedCandidates?.length ?? 0,
    program: assignment.program
      ? {
        id: assignment.program._id.toString(),
        title: assignment.program.title,
        description: assignment.program.description,
        isActive: assignment.program.isActive,
      }
      : null,
    createdAt: assignment.createdAt,
  }));

  const activeAssignments = serialized.filter((assignment) => assignment.isActive);

  sendSuccess(response, {
    data: {
      profile: {
        fullName: `${request.user.firstName} ${request.user.lastName}`,
        email: request.user.email,
        isActive: request.user.isActive,
        lastLoginAt: request.user.lastLoginAt,
      },
      summary: {
        totalAssignments: serialized.length,
        activeAssignments: activeAssignments.length,
        totalCandidates: activeAssignments.reduce((sum, item) => sum + item.candidateCount, 0),
      },
      assignments: serialized,
    },
  });
});
