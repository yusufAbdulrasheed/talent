import TalentSavings, { SAVINGS_STATUSES, WITHDRAWAL_STATUSES } from '../models/talent-savings.model.js';
import { AppError } from '../utils/app-error.js';

const MIN_ACCRUALS_FOR_WITHDRAWAL = 6;
const MAX_WITHDRAWAL_SHARE = 0.9;

export function currentPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function periodIndex(period) {
  const [year, month] = period.split('-').map(Number);
  return year * 12 + (month - 1);
}

export function addMonthsToPeriod(period, months) {
  const index = periodIndex(period) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function monthsBetweenPeriods(from, to) {
  return periodIndex(to) - periodIndex(from);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function applyLazyAccrual(savings, now = new Date()) {
  if (savings.status !== SAVINGS_STATUSES.ACTIVE) {
    return false;
  }
  if (!savings.monthlySalary || !savings.savingsRate || !savings.lastAccrualPeriod) {
    return false;
  }

  const nowPeriod = currentPeriod(now);
  let changed = false;

  while (monthsBetweenPeriods(savings.lastAccrualPeriod, nowPeriod) > 0) {
    const nextPeriod = addMonthsToPeriod(savings.lastAccrualPeriod, 1);
    const amount = round2(savings.monthlySalary * (savings.savingsRate / 100));

    savings.balance = round2(savings.balance + amount);
    savings.accrualCount += 1;
    savings.ledger.push({ period: nextPeriod, amount, balanceAfter: savings.balance, type: 'accrual' });
    savings.lastAccrualPeriod = nextPeriod;
    changed = true;
  }

  return changed;
}

export async function getOrCreateSavings(candidateId, now = new Date()) {
  let savings = await TalentSavings.findOne({ candidate: candidateId });

  if (!savings) {
    savings = await TalentSavings.create({ candidate: candidateId });
  }

  if (applyLazyAccrual(savings, now)) {
    await savings.save();
  }

  return savings;
}

export async function configureSavings(candidateId, { monthlySalary, savingsRate }, now = new Date()) {
  const savings = await getOrCreateSavings(candidateId, now);

  savings.monthlySalary = monthlySalary;
  savings.savingsRate = savingsRate;

  if (savings.status === SAVINGS_STATUSES.NOT_STARTED) {
    savings.status = SAVINGS_STATUSES.ACTIVE;
    savings.startedAt = now;
    savings.lastAccrualPeriod = addMonthsToPeriod(currentPeriod(now), -1);
  }

  await savings.save();
  return savings;
}

export async function setParticipationStatus(candidateId, nextStatus, now = new Date()) {
  const savings = await getOrCreateSavings(candidateId, now);

  if (savings.status === SAVINGS_STATUSES.NOT_STARTED) {
    throw new AppError('Your savings account has not been set up yet.', 409);
  }

  if (nextStatus === SAVINGS_STATUSES.DISCONTINUED) {
    if (savings.status !== SAVINGS_STATUSES.ACTIVE) {
      throw new AppError('Savings are not currently active.', 409);
    }
    savings.status = SAVINGS_STATUSES.DISCONTINUED;
  } else {
    if (savings.status !== SAVINGS_STATUSES.DISCONTINUED) {
      throw new AppError('Savings are not currently discontinued.', 409);
    }
    savings.status = SAVINGS_STATUSES.ACTIVE;
    savings.lastAccrualPeriod = addMonthsToPeriod(currentPeriod(now), -1);
  }

  await savings.save();
  return savings;
}

export function isEligibleForWithdrawal(savings) {
  return savings.accrualCount >= MIN_ACCRUALS_FOR_WITHDRAWAL;
}

export function maxWithdrawable(savings) {
  return round2(savings.balance * MAX_WITHDRAWAL_SHARE);
}

export function hasPendingWithdrawal(savings) {
  return savings.withdrawalRequests.some((request) => request.status === WITHDRAWAL_STATUSES.PENDING);
}

export async function requestWithdrawal(candidateId, amount, now = new Date()) {
  const savings = await getOrCreateSavings(candidateId, now);

  if (!isEligibleForWithdrawal(savings)) {
    throw new AppError(
      `Withdrawals open up once ${MIN_ACCRUALS_FOR_WITHDRAWAL} months of savings have been posted.`,
      409,
    );
  }

  if (hasPendingWithdrawal(savings)) {
    throw new AppError('You already have a withdrawal request awaiting a decision.', 409);
  }

  const limit = maxWithdrawable(savings);
  if (amount > limit) {
    throw new AppError(`You can request at most ${limit} (90% of your current balance).`, 422);
  }

  savings.withdrawalRequests.push({
    amount,
    balanceAtRequest: savings.balance,
    status: WITHDRAWAL_STATUSES.PENDING,
  });

  await savings.save();
  return savings;
}

export async function decideWithdrawal(candidateId, requestId, { status, decisionNote }, adminUserId, now = new Date()) {
  const savings = await getOrCreateSavings(candidateId, now);
  const request = savings.withdrawalRequests.id(requestId);

  if (!request) {
    throw new AppError('Withdrawal request not found.', 404);
  }
  if (request.status !== WITHDRAWAL_STATUSES.PENDING) {
    throw new AppError('This withdrawal request has already been decided.', 409);
  }

  if (status === WITHDRAWAL_STATUSES.APPROVED) {
    savings.balance = round2(savings.balance - request.amount);
    savings.ledger.push({
      period: currentPeriod(now),
      amount: request.amount,
      balanceAfter: savings.balance,
      type: 'withdrawal',
    });
  }

  request.status = status;
  request.decidedAt = now;
  request.decidedBy = adminUserId;
  request.decisionNote = decisionNote;

  await savings.save();
  return savings;
}

export function serializeSavings(savings) {
  return {
    id: savings.id,
    monthlySalary: savings.monthlySalary,
    savingsRate: savings.savingsRate,
    status: savings.status,
    balance: savings.balance,
    startedAt: savings.startedAt,
    accrualCount: savings.accrualCount,
    monthlyAccrualAmount:
      savings.monthlySalary && savings.savingsRate
        ? round2(savings.monthlySalary * (savings.savingsRate / 100))
        : null,
    eligibleForWithdrawal: isEligibleForWithdrawal(savings),
    monthsUntilEligible: Math.max(0, MIN_ACCRUALS_FOR_WITHDRAWAL - savings.accrualCount),
    maxWithdrawable: maxWithdrawable(savings),
    hasPendingWithdrawal: hasPendingWithdrawal(savings),
    ledger: savings.ledger.map((entry) => ({
      period: entry.period,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      type: entry.type,
      createdAt: entry.createdAt,
    })),
    withdrawalRequests: savings.withdrawalRequests.map((request) => ({
      id: request.id,
      amount: request.amount,
      balanceAtRequest: request.balanceAtRequest,
      status: request.status,
      requestedAt: request.requestedAt,
      decidedAt: request.decidedAt,
      decisionNote: request.decisionNote,
    })),
  };
}
