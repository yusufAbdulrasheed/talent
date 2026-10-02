import Candidate from '../models/candidate.model.js';
import TrainerAssignment from '../models/trainer-assignment.model.js';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';
import { TIER_EXPERIENCE_LEVELS } from './recruiter-subscription.service.js';

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
 *   - availability                              (no longer surfaced to recruiters at all)
 *
 * `bio` is free text too, but it exists specifically as the recruiter-facing
 * summary: the talent form tells candidates not to include names or contact
 * details, and an administrator reviews it before the candidate is approved.
 *
 * `jobTitle` is the role the candidate presents themselves for (e.g.
 * "Frontend Developer"), not a free-text field, so it carries no anonymity risk.
 */
export const ANONYMOUS_CANDIDATE_FIELDS = Object.freeze([
  'referenceNumber',
  'location',
  'jobTitle',
  'bio',
  'skills',
  'certifications',
  'education',
]);

// `experienceLevel` is loaded to decide lock state below, but it is never
// part of `ANONYMOUS_CANDIDATE_FIELDS` and must never appear in a response —
// recruiters no longer see the literal experience-level field at all,
// paid tier or not; it only gates which candidates are unlocked.
const PROJECTION = `${ANONYMOUS_CANDIDATE_FIELDS.join(' ')} experienceLevel -_id`;

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
async function buildTalentPoolQuery(filters, unlockedLevels) {
  const query = {};

  // Only talent the recruiter's plan unlocks is ever listed. Locked talent is
  // not returned at all — not even as an anonymous card — so no filter can be
  // used to probe what sits behind the paywall; it is only counted (see
  // `summariseTiers`). A `tier` narrows the list to that tier's own levels, and
  // a tier above the plan therefore matches nothing.
  const levelsInScope = filters.tier ? TIER_EXPERIENCE_LEVELS[filters.tier] : unlockedLevels;
  query.experienceLevel = { $in: levelsInScope.filter((level) => unlockedLevels.includes(level)) };

  if (filters.location) {
    query.location = caseInsensitiveMatch(filters.location);
  }

  if (filters.jobTitle) {
    query.jobTitle = caseInsensitiveMatch(filters.jobTitle);
  }

  // Every requested skill must be present, not just one of them.
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

  // Non-negotiable: only administrator-approved candidates are ever visible.
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
    // Every row is unlocked (the query only matches levels the plan covers),
    // so each is serialized in full.
    candidates: candidates.map((candidate) => serializeAnonymousCandidate(candidate, unlockedLevels)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/**
 * How many approved talents sit in each tier, and whether the recruiter's plan
 * unlocks it. Deliberately ignores every search filter: a count that moved with
 * the filters would reveal what locked talent contains ("one Senior talent has
 * Kubernetes"). A locked tier discloses its head-count and nothing else.
 */
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

/**
 * Second gate after the projection: builds the response from an explicit
 * whitelist, so a future schema change cannot silently widen what is exposed.
 *
 * A candidate whose experience level isn't in `unlockedLevels` (including one
 * with no experience level set yet) comes back as a locked teaser — no skill
 * names, no education, and critically no literal experience-level text or
 * tier hint anywhere, so a recruiter can never infer the underlying level
 * from what's shown.
 */
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
