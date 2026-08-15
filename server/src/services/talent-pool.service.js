import Candidate from '../models/candidate.model.js';
import TrainerAssignment from '../models/trainer-assignment.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';

/**
 * The ONLY candidate fields a recruiter may ever receive.
 *
 * This is applied as a database projection, not just a serializer filter, so
 * identifying data is never even loaded into memory on this code path.
 *
 * Deliberately excluded:
 *   - user, phoneNumber, gender, dateOfBirth  (direct identifiers)
 *   - documents                                (contain name, photo, ID)
 *   - adminReview                              (internal notes)
 *   - workExperience                           (free text; candidates commonly
 *     name themselves or their employer in it, which would defeat anonymity)
 */
export const ANONYMOUS_CANDIDATE_FIELDS = Object.freeze([
  'referenceNumber',
  'location',
  'skills',
  'certifications',
  'education',
  'availability',
  'experienceLevel',
]);

const PROJECTION = `${ANONYMOUS_CANDIDATE_FIELDS.join(' ')} -_id`;

/** Escapes user input before it is used inside a regular expression. */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function caseInsensitiveMatch(value) {
  return new RegExp(escapeRegex(value), 'i');
}

/**
 * Translates recruiter filters into a Mongo query.
 * The approved-status constraint is applied last and cannot be overridden.
 */
async function buildTalentPoolQuery(filters) {
  const query = {};

  if (filters.location) {
    query.location = caseInsensitiveMatch(filters.location);
  }

  // Every requested skill must be present, not just one of them.
  if (filters.skills?.length) {
    query.skills = { $all: filters.skills.map(caseInsensitiveMatch) };
  }

  if (filters.certification) {
    query.certifications = caseInsensitiveMatch(filters.certification);
  }

  if (filters.availability) {
    query.availability = filters.availability;
  }

  if (filters.experienceLevel) {
    query.experienceLevel = filters.experienceLevel;
  }

  if (filters.keyword) {
    const pattern = caseInsensitiveMatch(filters.keyword);
    query.$or = [
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

  // Non-negotiable: only administrator-approved candidates are ever visible.
  query.status = CANDIDATE_STATUSES.APPROVED;

  return query;
}

export async function searchTalentPool(filters, { page, limit }) {
  const query = await buildTalentPoolQuery(filters);
  const skip = (page - 1) * limit;

  const [candidates, total] = await Promise.all([
    Candidate.find(query).select(PROJECTION).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Candidate.countDocuments(query),
  ]);

  return {
    candidates: candidates.map(serializeAnonymousCandidate),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function findAnonymousCandidate(referenceNumber) {
  const candidate = await Candidate.findOne({
    referenceNumber: referenceNumber.toUpperCase(),
    status: CANDIDATE_STATUSES.APPROVED,
  })
    .select(PROJECTION)
    .lean();

  return candidate ? serializeAnonymousCandidate(candidate) : null;
}

/**
 * Second gate after the projection: builds the response from an explicit
 * whitelist, so a future schema change cannot silently widen what is exposed.
 */
export function serializeAnonymousCandidate(candidate) {
  return {
    referenceNumber: candidate.referenceNumber,
    location: candidate.location ?? null,
    skills: candidate.skills ?? [],
    certifications: candidate.certifications ?? [],
    education: candidate.education ?? null,
    availability: candidate.availability ?? null,
    experienceLevel: candidate.experienceLevel ?? null,
  };
}
