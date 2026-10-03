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
    period: { type: String, required: true }, 
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['accrual', 'withdrawal'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

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
    monthlySalary: { type: Number, min: 0, default: null },
    savingsRate: { type: Number, min: 5, max: 10, default: null },
    status: { type: String, enum: Object.values(SAVINGS_STATUSES), default: SAVINGS_STATUSES.NOT_STARTED },
    balance: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, default: null },
    lastAccrualPeriod: { type: String, default: null },
    accrualCount: { type: Number, default: 0 },
    ledger: [ledgerEntrySchema],
    withdrawalRequests: [withdrawalRequestSchema],
  },
  { timestamps: true },
);

const TalentSavings = mongoose.model('TalentSavings', talentSavingsSchema);

export default TalentSavings;
