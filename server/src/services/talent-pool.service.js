import Candidate from '../models/candidate.model.js';
import TrainerAssignment from '../models/trainer-assignment.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { TIER_EXPERIENCE_LEVELS } from './recruiter-subscription.service.js';

export const ANONYMOUS_CANDIDATE_FIELDS = Object.freeze([
  'referenceNumber',
  'location',
  'jobTitle',
  'bio',
  'skills',
  'certifications',
  'education',
]);

const PROJECTION = `${ANONYMOUS_CANDIDATE_FIELDS.join(' ')} experienceLevel -_id`;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function caseInsensitiveMatch(value) {
  return new RegExp(escapeRegex(value), 'i');
}

async function buildTalentPoolQuery(filters, unlockedLevels) {
  const query = {};

  const levelsInScope = filters.tier ? TIER_EXPERIENCE_LEVELS[filters.tier] : unlockedLevels;
  query.experienceLevel = { $in: levelsInScope.filter((level) => unlockedLevels.includes(level)) };

  if (filters.location) {
    query.location = caseInsensitiveMatch(filters.location);
  }

  if (filters.jobTitle) {
    query.jobTitle = caseInsensitiveMatch(filters.jobTitle);
  }

  if (filters.skills?.length) {
    query.skills = { $all: filters.skills.map(caseInsensitiveMatch) };
  }

  if (filters.certification) {
    query.certifications = caseInsensitiveMatch(filters.certification);
  }

  if (filters.keyword) {
    const pattern = caseInsensitiveMatch(filters.keyword);
    query.$or = [
      { jobTitle: pattern },
      { skills: pattern },
      { certifications: pattern },
      { education: pattern },
      { location: pattern },
    ];
  }

  if (filters.program) {
    const assignments = await TrainerAssignment.find({ program: filters.program }).select(
      'assignedCandidates',
    );
    const candidateIds = assignments.flatMap((assignment) => assignment.assignedCandidates);

    query._id = { $in: candidateIds };
  }

  query.status = CANDIDATE_STATUSES.APPROVED;

  return query;
}

export async function searchTalentPool(filters, { page, limit }, unlockedLevels) {
  const query = await buildTalentPoolQuery(filters, unlockedLevels);
  const skip = (page - 1) * limit;

  const [candidates, total] = await Promise.all([
    Candidate.find(query).select(PROJECTION).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Candidate.countDocuments(query),
  ]);

  return {
    candidates: candidates.map((candidate) => serializeAnonymousCandidate(candidate, unlockedLevels)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function summariseTiers(unlockedLevels) {
  const rows = await Candidate.aggregate([
    { $match: { status: CANDIDATE_STATUSES.APPROVED } },
    { $group: { _id: '$experienceLevel', total: { $sum: 1 } } },
  ]);
  const totalByLevel = Object.fromEntries(rows.map(({ _id, total }) => [_id, total]));

  return Object.entries(TIER_EXPERIENCE_LEVELS).map(([tier, levels]) => ({
    tier,
    unlocked: levels.every((level) => unlockedLevels.includes(level)),
    total: levels.reduce((sum, level) => sum + (totalByLevel[level] ?? 0), 0),
  }));
}

export async function findAnonymousCandidate(referenceNumber, unlockedLevels) {
  const candidate = await Candidate.findOne({
    referenceNumber: referenceNumber.toUpperCase(),
    status: CANDIDATE_STATUSES.APPROVED,
  })
    .select(PROJECTION)
    .lean();

  return candidate ? serializeAnonymousCandidate(candidate, unlockedLevels) : null;
}

export function serializeAnonymousCandidate(candidate, unlockedLevels) {
  const isLocked = !unlockedLevels.includes(candidate.experienceLevel);

  if (isLocked) {
    return {
      locked: true,
      referenceNumber: candidate.referenceNumber,
      location: candidate.location ?? null,
      skillsCount: (candidate.skills ?? []).length,
    };
  }

  return {
    locked: false,
    referenceNumber: candidate.referenceNumber,
    location: candidate.location ?? null,
    jobTitle: candidate.jobTitle ?? null,
    bio: candidate.bio ?? null,
    skills: candidate.skills ?? [],
    certifications: candidate.certifications ?? [],
    education: candidate.education ?? null,
  };
}
