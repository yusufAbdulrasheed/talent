import mongoose from 'mongoose';

export const SAVINGS_STATUSES = Object.freeze({
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  DISCONTINUED: 'discontinued',
});

export const WITHDRAWAL_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

const ledgerEntrySchema = new mongoose.Schema(
  {
    period: { type: String, required: true }, // 'YYYY-MM'
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['accrual', 'withdrawal'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// Keeps its own _id — it's addressed directly as a route param when an
// administrator decides it.
const withdrawalRequestSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  balanceAtRequest: { type: Number, required: true, min: 0 },
  status: { type: String, enum: Object.values(WITHDRAWAL_STATUSES), default: WITHDRAWAL_STATUSES.PENDING },
  requestedAt: { type: Date, default: Date.now },
  decidedAt: { type: Date },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decisionNote: { type: String, trim: true, maxlength: 1000 },
});

const talentSavingsSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, unique: true, index: true },
    // Set by an administrator once a candidate is placed. There is no real
    // payroll integration behind this — it is the figure accrual is
    // calculated against, not a live salary feed.
    monthlySalary: { type: Number, min: 0, default: null },
    // Whole percentage points (5-10), not a fraction.
    savingsRate: { type: Number, min: 5, max: 10, default: null },
    status: { type: String, enum: Object.values(SAVINGS_STATUSES), default: SAVINGS_STATUSES.NOT_STARTED },
    balance: { type: Number, min: 0, default: 0 },
    // Set once on first activation; never reset by discontinuing or resuming.
    startedAt: { type: Date, default: null },
    // Catch-up watermark for the lazy monthly accrual — see talent-savings.service.js.
    lastAccrualPeriod: { type: String, default: null },
    // Count of posted accrual entries. Drives the "six months of saving"
    // withdrawal-eligibility check — deliberately a count of contributions
    // actually made, not wall-clock time since `startedAt`.
    accrualCount: { type: Number, default: 0 },
    ledger: [ledgerEntrySchema],
    withdrawalRequests: [withdrawalRequestSchema],
  },
  { timestamps: true },
);

const TalentSavings = mongoose.model('TalentSavings', talentSavingsSchema);

export default TalentSavings;
