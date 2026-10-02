import RecruiterSubscription, { SUBSCRIPTION_TIERS } from '../models/recruiter-subscription.model.js';
import environment from '../config/env.js';

const SUBSCRIPTION_WINDOW_DAYS = 30;

export const TIER_RANK = Object.freeze({
  [SUBSCRIPTION_TIERS.JUNIOR]: 0,
  [SUBSCRIPTION_TIERS.INTERMEDIATE]: 1,
  [SUBSCRIPTION_TIERS.SENIOR]: 2,
});

// Cumulative: a higher tier also unlocks everything a lower tier does.
export const TIER_EXPERIENCE_ACCESS = Object.freeze({
  [SUBSCRIPTION_TIERS.JUNIOR]: ['entry', 'junior'],
  [SUBSCRIPTION_TIERS.INTERMEDIATE]: ['entry', 'junior', 'mid'],
  [SUBSCRIPTION_TIERS.SENIOR]: ['entry', 'junior', 'mid', 'senior'],
});

// The levels each tier adds on top of the one below it — the talent that
// "belongs" to that tier when browsing the pool by Junior / Intermediate /
// Senior. Derived from the cumulative table above so the two can never drift.
export const TIER_EXPERIENCE_LEVELS = Object.freeze(
  Object.fromEntries(
    Object.entries(TIER_EXPERIENCE_ACCESS).map(([tier, levels], index, tiers) => {
      const levelsBelow = index === 0 ? [] : tiers[index - 1][1];
      return [tier, Object.freeze(levels.filter((level) => !levelsBelow.includes(level)))];
    }),
  ),
);

const TIER_PRICING_ENV_KEY = Object.freeze({
  [SUBSCRIPTION_TIERS.INTERMEDIATE]: 'RECRUITER_SUB_INTERMEDIATE_NGN',
  [SUBSCRIPTION_TIERS.SENIOR]: 'RECRUITER_SUB_SENIOR_NGN',
});

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** NGN price for a paid tier, or null if the operator has not configured one. */
export function getTierPriceNgn(tier) {
  if (tier === SUBSCRIPTION_TIERS.JUNIOR) {
    return 0;
  }
  return environment[TIER_PRICING_ENV_KEY[tier]] ?? null;
}

export async function getOrCreateSubscription(recruiterCompanyId) {
  let subscription = await RecruiterSubscription.findOne({ recruiterCompany: recruiterCompanyId });

  if (!subscription) {
    subscription = await RecruiterSubscription.create({ recruiterCompany: recruiterCompanyId });
  }

  return subscription;
}

/**
 * The subscription analogue of the savings module's lazy accrual: reverts an
 * expired paid tier back to junior on read, so no scheduler is needed.
 * Mutates in place; the caller saves if this returns true.
 */
export function applyLazyExpiry(subscription, now = new Date()) {
  if (subscription.tier !== SUBSCRIPTION_TIERS.JUNIOR && subscription.tierExpiresAt && subscription.tierExpiresAt <= now) {
    subscription.tier = SUBSCRIPTION_TIERS.JUNIOR;
    subscription.tierExpiresAt = null;
    return true;
  }
  return false;
}

/** Loads (or creates) a subscription and brings it up to date. Every read path should go through this. */
export async function getCurrentSubscription(recruiterCompanyId, now = new Date()) {
  const subscription = await getOrCreateSubscription(recruiterCompanyId);

  if (applyLazyExpiry(subscription, now)) {
    await subscription.save();
  }

  return subscription;
}

export function getUnlockedExperienceLevels(subscription) {
  return TIER_EXPERIENCE_ACCESS[subscription.tier];
}

/** True if `tier` is below the subscription's current tier — checkout must refuse this. */
export function isDowngrade(subscription, tier) {
  return TIER_RANK[tier] < TIER_RANK[subscription.tier];
}

/**
 * Applies a confirmed payment for `tier`. Buying the same tier while it is
 * still active extends the window from its current expiry (an early renewal
 * never wastes already-paid days); anything else (a fresh purchase, or a
 * higher tier) starts a new 30-day window from now. Call `applyLazyExpiry`
 * first so an already-lapsed tier is treated as a fresh purchase, not a
 * renewal based on a stale expiry.
 */
export function activateTier(subscription, tier, now = new Date()) {
  const isRenewal = subscription.tier === tier && subscription.tierExpiresAt;
  const base = isRenewal ? subscription.tierExpiresAt : now;

  subscription.tier = tier;
  subscription.tierExpiresAt = addDays(base, SUBSCRIPTION_WINDOW_DAYS);
}

export function serializeSubscription(subscription) {
  return {
    tier: subscription.tier,
    tierExpiresAt: subscription.tierExpiresAt,
    pricing: {
      intermediate: getTierPriceNgn(SUBSCRIPTION_TIERS.INTERMEDIATE),
      senior: getTierPriceNgn(SUBSCRIPTION_TIERS.SENIOR),
    },
  };
}
