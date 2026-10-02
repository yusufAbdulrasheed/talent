import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import environment from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import Candidate from '../models/candidate.model.js';
import Payment, { PAYMENT_PURPOSES } from '../models/payment.model.js';
import PlacementRequest from '../models/placement-request.model.js';
import RecruiterCompany from '../models/recruiter-company.model.js';
import { SUBSCRIPTION_TIERS } from '../models/recruiter-subscription.model.js';
import User from '../models/user.model.js';
import { CANDIDATE_STATUSES, PLACEMENT_REQUEST_STATUSES } from '../constants/statuses.js';
import { USER_ROLES } from '../constants/user-roles.js';
import {
  activateTier,
  getCurrentSubscription,
  getOrCreateSubscription,
  getTierPriceNgn,
  getUnlockedExperienceLevels,
  TIER_EXPERIENCE_ACCESS,
} from '../services/recruiter-subscription.service.js';
import { generateCandidateReference } from '../services/reference-number.service.js';
import { DEMO_PLACEMENT_REQUESTS } from './seed-data/demo-placement-requests.js';
import { DEMO_RECRUITERS } from './seed-data/demo-recruiters.js';
import { DEMO_TALENTS, EXPERIENCE_LEVEL_GUIDE } from './seed-data/demo-talents.js';
import { DEMO_TRAINERS } from './seed-data/demo-trainers.js';

const PASSWORD_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_DEMO_PASSWORD = 'Demo@12345';
const DEFAULT_ACCOUNTS_FILE = fileURLToPath(new URL('../../demo-accounts.md', import.meta.url));
const DAY_MS = 24 * 60 * 60 * 1000;

// Registration dates are staggered so the admin lists read like a real intake
// rather than one identical timestamp. Approved talents registered long before
// anything else in the dataset happens (so every review, subscription and
// request below falls after it); talents still awaiting a decision are recent.
const FIRST_TALENT_REGISTERED_DAYS_AGO = 90;
const FIRST_RECRUITER_REGISTERED_DAYS_AGO = 100;
const FIRST_TRAINER_REGISTERED_DAYS_AGO = 60;

// Only used when RECRUITER_SUB_*_NGN is not configured; mirrors the test environment.
const FALLBACK_TIER_PRICE_NGN = Object.freeze({
  [SUBSCRIPTION_TIERS.INTERMEDIATE]: 15_000,
  [SUBSCRIPTION_TIERS.SENIOR]: 30_000,
});

// Stable public placeholders. Real uploads go to Cloudinary; these stand in so
// the document lists render. `publicId` is deliberately left unset — that is
// what the upload service uses to delete an asset, and these are not ours.
const PLACEHOLDER_IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const PLACEHOLDER_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const TIER_LABELS = Object.freeze({
  [SUBSCRIPTION_TIERS.JUNIOR]: 'Junior (free)',
  [SUBSCRIPTION_TIERS.INTERMEDIATE]: 'Intermediate',
  [SUBSCRIPTION_TIERS.SENIOR]: 'Senior',
});

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
const daysFromNow = (days) => new Date(Date.now() + days * DAY_MS);

/**
 * Seeds the demo dataset — everything the admin dashboard reports on:
 *
 *  - 20 fully populated talents, five per experience level (16 approved, 4
 *    awaiting review);
 *  - 15 recruiter companies across every subscription tier, with a successful
 *    subscription payment for each paid one;
 *  - 16 placement requests from those recruiters, covering every status;
 *  - 1 trainer account.
 *
 * Assumes mongoose is already connected. Re-running is safe: an account whose
 * email already exists is left exactly as it is, and payments and requests are
 * only added when missing, so nothing is overwritten or duplicated.
 *
 * @param {object} [options]
 * @param {string} [options.password]     Shared password for every demo account.
 * @param {string|null} [options.accountsFile]  Where to write the credentials
 *   sheet (markdown); pass `null` to skip writing it.
 */
export async function seedDemoData({
  password = DEFAULT_DEMO_PASSWORD,
  accountsFile = DEFAULT_ACCOUNTS_FILE,
} = {}) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`The demo password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  // One hash serves every account: they all share the demo password, and
  // hashing 35 times at production cost would only slow the run down.
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const reviewer = await User.findOne({ role: USER_ROLES.ADMIN }).select('_id');

  // Sequential on purpose: reference numbers are allocated in seed order, so
  // they read entry → senior.
  const talents = [];
  for (const [index, talent] of DEMO_TALENTS.entries()) {
    talents.push({ ...talent, ...(await seedTalent(talent, index, passwordHash, reviewer)) });
  }

  const recruiters = [];
  for (const [index, recruiter] of DEMO_RECRUITERS.entries()) {
    recruiters.push({ ...recruiter, ...(await seedRecruiter(recruiter, index, passwordHash)) });
  }

  const payments = [];
  for (const recruiter of recruiters) {
    const payment = await seedSubscriptionPayment(recruiter);

    if (payment) {
      payments.push({ ...payment, companyName: recruiter.companyName, tier: recruiter.tier });
    }
  }

  const placementRequests = await seedPlacementRequests({ talents, recruiters });

  const trainers = [];
  for (const [index, trainer] of DEMO_TRAINERS.entries()) {
    trainers.push({ ...trainer, ...(await seedTrainer(trainer, index, passwordHash)) });
  }

  const markdown = renderAccountsSheet({ password, talents, recruiters, placementRequests, trainers });

  if (accountsFile) {
    await mkdir(path.dirname(accountsFile), { recursive: true });
    await writeFile(accountsFile, markdown, 'utf8');
  }

  return { password, talents, recruiters, payments, placementRequests, trainers, markdown };
}

function emailPart(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function talentEmail({ firstName, lastName }) {
  return `${emailPart(firstName)}.${emailPart(lastName)}@talents.demo.test`;
}

function recruiterEmail({ firstName, lastName, slug }) {
  return `${emailPart(firstName)}.${emailPart(lastName)}@${slug}.demo.test`;
}

function trainerEmail({ firstName, lastName, slug }) {
  return `${emailPart(firstName)}.${emailPart(lastName)}@${slug}.demo.test`;
}

/** Finds an existing account for `email`, refusing to reuse one that belongs to another role. */
async function findExistingUser(email, role) {
  const existing = await User.findOne({ email });

  if (existing && existing.role !== role) {
    throw new Error(`${email} is already used by a ${existing.role} account, so it cannot be seeded as a ${role}.`);
  }

  return existing;
}

function buildDocuments(talent) {
  const stem = `${emailPart(talent.firstName)}-${emailPart(talent.lastName)}`;
  const documents = [
    { type: 'passport_photo', url: PLACEHOLDER_IMAGE_URL, originalName: `${stem}-passport.jpg`, mimeType: 'image/jpeg', size: 184_320 },
    { type: 'resume', url: PLACEHOLDER_PDF_URL, originalName: `${stem}-cv.pdf`, mimeType: 'application/pdf', size: 262_144 },
    { type: 'national_id', url: PLACEHOLDER_PDF_URL, originalName: `${stem}-national-id.pdf`, mimeType: 'application/pdf', size: 524_288 },
  ];

  if (talent.certifications.length > 0) {
    documents.push({
      type: 'certificate',
      url: PLACEHOLDER_PDF_URL,
      originalName: `${stem}-certificates.pdf`,
      mimeType: 'application/pdf',
      size: 348_160,
    });
  }

  return documents;
}

/** The admin's review record, shaped by how far along the candidate is. */
function buildAdminReview({ talent, status, registeredAt, index, reviewer }) {
  if (status === CANDIDATE_STATUSES.SUBMITTED) {
    return undefined; // Nobody has looked at it yet.
  }

  const levelGuide = EXPERIENCE_LEVEL_GUIDE[talent.experienceLevel];
  const isApproved = status === CANDIDATE_STATUSES.APPROVED;

  return {
    ...(reviewer ? { reviewedBy: reviewer.id } : {}),
    reviewedAt: new Date(registeredAt.getTime() + (isApproved ? 3 + (index % 4) : 1) * DAY_MS),
    note: isApproved
      ? `Documents verified. ${levelGuide.years} of experience — categorised as ${levelGuide.label} level.`
      : 'Documents received; verifying certificates and references.',
  };
}

async function seedTalent(talent, index, passwordHash, reviewer) {
  const email = talentEmail(talent);
  const existing = await findExistingUser(email, USER_ROLES.TALENT);

  if (existing) {
    const candidate = await Candidate.findOne({ user: existing.id });

    // Backfill fields added to the seed data after this account already
    // existed (jobTitle, bio). Only fills a gap — never overwrites a value
    // that's already set, in case the account was actually logged into and
    // edited by hand.
    if (candidate) {
      let patched = false;
      for (const field of ['jobTitle', 'bio']) {
        if (!candidate[field] && talent[field]) {
          candidate[field] = talent[field];
          patched = true;
        }
      }
      if (patched) {
        await candidate.save();
      }
    }

    return {
      email,
      candidateId: candidate?.id ?? null,
      referenceNumber: candidate?.referenceNumber ?? null,
      status: candidate?.status ?? null,
      created: false,
    };
  }

  const status = talent.status ?? CANDIDATE_STATUSES.APPROVED;
  const registeredAt = daysAgo(
    status === CANDIDATE_STATUSES.APPROVED ? FIRST_TALENT_REGISTERED_DAYS_AGO - 2 * index : 2 + (index % 7),
  );

  const user = await User.create({
    firstName: talent.firstName,
    lastName: talent.lastName,
    email,
    passwordHash,
    role: USER_ROLES.TALENT,
    // Same as the admin seeder: nobody has to click an emailed link to demo.
    isEmailVerified: true,
    createdAt: registeredAt,
  });

  try {
    const adminReview = buildAdminReview({ talent, status, registeredAt, index, reviewer });
    const candidate = await Candidate.create({
      user: user.id,
      referenceNumber: await generateCandidateReference(),
      phoneNumber: talent.phoneNumber,
      gender: talent.gender,
      dateOfBirth: new Date(talent.dateOfBirth),
      location: talent.location,
      jobTitle: talent.jobTitle,
      bio: talent.bio,
      education: talent.education,
      skills: talent.skills,
      certifications: talent.certifications,
      workExperience: talent.workExperience,
      availability: talent.availability,
      experienceLevel: talent.experienceLevel,
      documents: buildDocuments(talent),
      status,
      ...(adminReview ? { adminReview } : {}),
      createdAt: registeredAt,
    });

    return { email, candidateId: candidate.id, referenceNumber: candidate.referenceNumber, status, created: true };
  } catch (error) {
    // Mirrors registerUser: never leave a user behind without its profile.
    await User.deleteOne({ _id: user.id });
    throw error;
  }
}

/**
 * Keeps a paid-tier demo subscription valid no matter how long it's been
 * since the seed last ran. `subscriptionPaidDaysAgo` only describes the
 * subscription's state *at seed time* — real time keeps moving after that,
 * so a subscription seeded as "18 days into a 30-day window" quietly expires
 * (by design — that's the app's own lazy-expiry feature working correctly)
 * if the seed isn't re-run for a few weeks. Re-activating with a fresh
 * `paidAt` on every run is what keeps re-running the seeder reliable.
 */
async function ensureSubscriptionTier(companyId, recruiter) {
  const isPaidTier = recruiter.tier !== SUBSCRIPTION_TIERS.JUNIOR;

  if (isPaidTier && recruiter.subscriptionPaidDaysAgo === undefined) {
    throw new Error(`${recruiter.companyName} is on the ${recruiter.tier} plan but has no subscriptionPaidDaysAgo.`);
  }

  // Every recruiter gets an explicit subscription row, junior tier included —
  // the app itself would only create one lazily on first use, but the seed
  // leaves a complete, consistent snapshot rather than depending on that.
  const subscription = await getOrCreateSubscription(companyId);

  if (isPaidTier) {
    activateTier(subscription, recruiter.tier, daysAgo(recruiter.subscriptionPaidDaysAgo));
    await subscription.save();
  }
}

async function seedRecruiter(recruiter, index, passwordHash) {
  const email = recruiterEmail(recruiter);
  const existing = await findExistingUser(email, USER_ROLES.RECRUITER);

  if (existing) {
    const company = await RecruiterCompany.findOne({ user: existing.id });

    if (company) {
      await ensureSubscriptionTier(company.id, recruiter);
    }

    return { email, companyId: company?.id ?? null, created: false };
  }

  const registeredAt = daysAgo(FIRST_RECRUITER_REGISTERED_DAYS_AGO - 3 * index);
  const user = await User.create({
    firstName: recruiter.firstName,
    lastName: recruiter.lastName,
    email,
    passwordHash,
    role: USER_ROLES.RECRUITER,
    isEmailVerified: true,
    createdAt: registeredAt,
  });

  try {
    const company = await RecruiterCompany.create({
      user: user.id,
      companyName: recruiter.companyName,
      cacNumber: recruiter.cacNumber,
      businessAddress: recruiter.businessAddress,
      companyEmail: `careers@${recruiter.slug}.demo.test`,
      website: `https://www.${recruiter.slug}.demo.test`,
      industry: recruiter.industry,
      phoneNumber: recruiter.phoneNumber,
      contactPerson: `${recruiter.firstName} ${recruiter.lastName}`,
      isApproved: recruiter.isApproved,
      createdAt: registeredAt,
    });

    await ensureSubscriptionTier(company.id, recruiter);

    return { email, companyId: company.id, created: true };
  } catch (error) {
    await RecruiterCompany.deleteOne({ user: user.id });
    await User.deleteOne({ _id: user.id });
    throw error;
  }
}

/**
 * A trainer account. In the real flow (createTrainer in
 * admin/trainers.controller.js) this gets an unusable random password and an
 * email invite to set their own — here it gets the shared demo password
 * directly, the same shortcut every other seeded account takes, so it is
 * usable immediately without a working mailbox.
 */
async function seedTrainer(trainer, index, passwordHash) {
  const email = trainerEmail(trainer);
  const existing = await findExistingUser(email, USER_ROLES.TRAINER);

  if (existing) {
    return { email, created: false };
  }

  await User.create({
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    email,
    passwordHash,
    role: USER_ROLES.TRAINER,
    isEmailVerified: true,
    createdAt: daysAgo(FIRST_TRAINER_REGISTERED_DAYS_AGO - 5 * index),
  });

  return { email, created: true };
}

/** The successful Paystack payment behind a paid recruiter's plan; `null` for the free tier. */
async function seedSubscriptionPayment(recruiter) {
  if (recruiter.subscriptionPaidDaysAgo === undefined || !recruiter.companyId) {
    return null;
  }

  const reference = `SUB-DEMO-${recruiter.slug.toUpperCase()}`;

  if (await Payment.exists({ reference })) {
    return { reference, created: false };
  }

  const priceNgn = getTierPriceNgn(recruiter.tier) ?? FALLBACK_TIER_PRICE_NGN[recruiter.tier];
  const paidAt = daysAgo(recruiter.subscriptionPaidDaysAgo);

  await Payment.create({
    purpose: PAYMENT_PURPOSES.RECRUITER_SUBSCRIPTION,
    recruiterCompany: recruiter.companyId,
    subscriptionTier: recruiter.tier,
    provider: 'paystack',
    reference,
    // Stored in kobo, exactly as the real checkout does
    // (see initializeSubscriptionCheckout in recruiter-subscription.controller.js).
    amount: priceNgn * 100,
    currency: 'NGN',
    status: 'success',
    paidAt,
    createdAt: paidAt,
  });

  return { reference, created: true };
}

/**
 * Recruiter placement requests. Mirrors the two rules createPlacementRequest
 * enforces — the candidate must be approved and inside the recruiter's unlocked
 * experience levels — against the real database state, so seed data can never
 * describe something the product would refuse.
 */
async function seedPlacementRequests({ talents, recruiters }) {
  const results = [];

  for (const spec of DEMO_PLACEMENT_REQUESTS) {
    const recruiter = recruiters.find((candidate) => candidate.slug === spec.recruiter);
    const talent = talents.find((candidate) => `${candidate.firstName} ${candidate.lastName}` === spec.candidate);

    if (!recruiter?.companyId || !talent?.candidateId) {
      throw new Error(`Placement request "${spec.jobTitle}" refers to a recruiter or talent that was not seeded.`);
    }

    const candidate = await Candidate.findById(talent.candidateId).select('referenceNumber status experienceLevel');
    const subscription = await getCurrentSubscription(recruiter.companyId);

    if (candidate.status !== CANDIDATE_STATUSES.APPROVED) {
      throw new Error(`${spec.candidate} is not approved, so ${recruiter.companyName} cannot request them.`);
    }

    if (!getUnlockedExperienceLevels(subscription).includes(candidate.experienceLevel)) {
      throw new Error(
        `${recruiter.companyName}'s ${subscription.tier} plan does not unlock ${spec.candidate}'s experience level.`,
      );
    }

    const alreadySeeded = await PlacementRequest.exists({
      recruiterCompany: recruiter.companyId,
      candidate: candidate.id,
      jobTitle: spec.jobTitle,
    });

    if (!alreadySeeded) {
      const createdAt = daysAgo(spec.submittedDaysAgo);
      const isUntouched = spec.status === PLACEMENT_REQUEST_STATUSES.SUBMITTED;

      await PlacementRequest.create({
        recruiterCompany: recruiter.companyId,
        candidate: candidate.id,
        jobTitle: spec.jobTitle,
        jobDescription: spec.jobDescription,
        employmentType: spec.employmentType,
        salaryRange: spec.salaryRange,
        location: spec.location,
        startDate: daysFromNow(spec.startInDays),
        numberRequired: spec.numberRequired,
        additionalNotes: spec.additionalNotes,
        status: spec.status,
        adminNote: spec.adminNote,
        createdAt,
        // An admin acted on it a couple of days after it came in.
        updatedAt: isUntouched ? createdAt : new Date(createdAt.getTime() + 2 * DAY_MS),
      });
    }

    results.push({
      ...spec,
      companyName: recruiter.companyName,
      candidateReference: candidate.referenceNumber,
      created: !alreadySeeded,
    });
  }

  return results;
}

function titleCase(value) {
  return value.replace(/_/g, ' ').replace(/^./, (character) => character.toUpperCase());
}

/** The credentials sheet: printed to the console and written to `demo-accounts.md`. */
function renderAccountsSheet({ password, talents, recruiters, placementRequests, trainers }) {
  const countByStatus = (status) => talents.filter((talent) => talent.status === status).length;
  const awaitingReview = countByStatus(CANDIDATE_STATUSES.SUBMITTED) + countByStatus(CANDIDATE_STATUSES.UNDER_REVIEW);
  const openRequests = placementRequests.filter((request) =>
    [
      PLACEMENT_REQUEST_STATUSES.SUBMITTED,
      PLACEMENT_REQUEST_STATUSES.UNDER_REVIEW,
      PLACEMENT_REQUEST_STATUSES.IN_PROGRESS,
    ].includes(request.status),
  ).length;

  const lines = [
    '# Demo accounts',
    '',
    `Every account below signs in with the same password: \`${password}\``,
    '',
    `Sign in at ${environment.CLIENT_URL}/login`,
    '',
    '## What was seeded',
    '',
    `- ${talents.length} talents — ${countByStatus(CANDIDATE_STATUSES.APPROVED)} approved, ${awaitingReview} awaiting admin review`,
    `- ${recruiters.length} recruiters — ${recruiters.filter((recruiter) => recruiter.isApproved).length} approved, ${recruiters.filter((recruiter) => !recruiter.isApproved).length} pending approval`,
    `- ${recruiters.filter((recruiter) => recruiter.subscriptionPaidDaysAgo !== undefined).length} paid subscription payments`,
    `- ${placementRequests.length} placement requests (${openRequests} open)`,
    `- ${trainers.length} trainer${trainers.length === 1 ? '' : 's'}`,
    '',
    `## Talents (${talents.length})`,
    '',
    'Only approved talents appear in the recruiter talent pool. What a recruiter can actually open depends on their',
    'subscription plan — see the recruiter table below.',
  ];

  for (const [level, guide] of Object.entries(EXPERIENCE_LEVEL_GUIDE)) {
    const group = talents.filter((talent) => talent.experienceLevel === level);

    lines.push(
      '',
      `### ${guide.label} level — ${guide.years} (${group.length})`,
      '',
      '| Name | Job title | Email | Reference | Status | Location | Availability |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      ...group.map(
        (talent) =>
          `| ${talent.firstName} ${talent.lastName} | ${talent.jobTitle ?? '—'} | ${talent.email} | ${talent.referenceNumber ?? '—'} | ${titleCase(talent.status ?? 'unknown')} | ${talent.location} | ${titleCase(talent.availability)} |`,
      ),
    );
  }

  lines.push(
    '',
    `## Recruiters (${recruiters.length})`,
    '',
    'A recruiter always sees talent anonymously (reference number, location, skills). Their plan decides which',
    'experience levels are unlocked; the rest show as locked teasers.',
    '',
    '| Company | Contact | Email | Plan | Unlocks | Approval |',
    '| --- | --- | --- | --- | --- | --- |',
    ...recruiters.map((recruiter) => {
      const unlocks = TIER_EXPERIENCE_ACCESS[recruiter.tier].map((level) => EXPERIENCE_LEVEL_GUIDE[level].label).join(', ');

      return `| ${recruiter.companyName} | ${recruiter.firstName} ${recruiter.lastName} | ${recruiter.email} | ${TIER_LABELS[recruiter.tier]} | ${unlocks} | ${recruiter.isApproved ? 'Approved' : 'Pending'} |`;
    }),
    '',
    `## Placement requests (${placementRequests.length})`,
    '',
    'Recruiters only ever know a talent by reference number, so that is how they are listed here.',
    '',
    '| Company | Role | Candidate | Status |',
    '| --- | --- | --- | --- |',
    ...placementRequests.map(
      (request) =>
        `| ${request.companyName} | ${request.jobTitle} | ${request.candidateReference} | ${titleCase(request.status)} |`,
    ),
    '',
    `## Trainers (${trainers.length})`,
    '',
    'The trainer portal is read-only in this build: no programme or batch is seeded, so a fresh trainer sees',
    '"No assignments yet" until an admin creates one and assigns it to them.',
    '',
    '| Name | Email |',
    '| --- | --- |',
    ...trainers.map((trainer) => `| ${trainer.firstName} ${trainer.lastName} | ${trainer.email} |`),
    '',
  );

  return lines.join('\n');
}

/** The connection string with credentials and options stripped, safe to print. */
function describeTarget(uri) {
  return uri.replace(/\/\/[^@/]*@/, '//').replace(/\?.*$/, '');
}

function parseAccountsFileArgument(argv) {
  const argument = argv.find((value) => value.startsWith('--out='));
  return argument ? path.resolve(argument.slice('--out='.length)) : DEFAULT_ACCOUNTS_FILE;
}

/**
 * Seeds the demo dataset into whatever database MONGODB_URI points at, then
 * prints (and saves) every demo login.
 *
 *   npm run seed:demo --workspace=server
 *
 * Optional: SEED_DEMO_PASSWORD overrides the shared password; `--out=<path>`
 * changes where the credentials sheet is written.
 */
async function main() {
  if (environment.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error(
      'Refusing to seed demo accounts with NODE_ENV=production — they all share one known password. Set SEED_ALLOW_PRODUCTION=true only if you are certain.',
    );
  }

  console.info(`Seeding demo data into ${describeTarget(environment.MONGODB_URI)}`);
  await connectDatabase();

  const { talents, recruiters, payments, placementRequests, trainers, markdown } = await seedDemoData({
    password: process.env.SEED_DEMO_PASSWORD || DEFAULT_DEMO_PASSWORD,
    accountsFile: parseAccountsFileArgument(process.argv.slice(2)),
  });

  const summarise = (label, items) => {
    const created = items.filter((item) => item.created).length;
    return `${label}: ${created} created, ${items.length - created} already existed`;
  };

  console.info(
    `${[
      summarise('Talents', talents),
      summarise('Recruiters', recruiters),
      summarise('Subscription payments', payments),
      summarise('Placement requests', placementRequests),
      summarise('Trainers', trainers),
    ].join('. ')}.`,
  );
  console.info(`\n${markdown}`);
}

// Only run when invoked directly, so tests can import `seedDemoData`.
const isEntryPoint =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntryPoint) {
  main()
    .catch((error) => {
      console.error('Unable to seed demo data:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) {
        await disconnectDatabase();
      }
    });
}
