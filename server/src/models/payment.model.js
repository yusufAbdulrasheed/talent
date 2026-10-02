import mongoose from 'mongoose';

export const PAYMENT_PURPOSES = Object.freeze({
  CANDIDATE_TRAINING: 'candidate_training',
  RECRUITER_SUBSCRIPTION: 'recruiter_subscription',
});

const paymentSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      enum: Object.values(PAYMENT_PURPOSES),
      default: PAYMENT_PURPOSES.CANDIDATE_TRAINING,
      required: true,
      index: true,
    },
    // Exactly one of candidate/recruiterCompany is set, matching `purpose` —
    // enforced below.
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', index: true },
    recruiterCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruiterCompany', index: true },
    subscriptionTier: { type: String, enum: ['intermediate', 'senior'] },
    provider: { type: String, enum: ['paystack'], default: 'paystack', required: true },
    reference: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN', uppercase: true, trim: true },
    status: { type: String, enum: ['initialized', 'success', 'failed', 'abandoned'], default: 'initialized', index: true },
    paidAt: { type: Date },
    providerPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentSchema.pre('validate', function enforcePurposeShape(next) {
  if (this.purpose === PAYMENT_PURPOSES.CANDIDATE_TRAINING) {
    if (!this.candidate) {
      next(new Error('A candidate_training payment requires `candidate`.'));
      return;
    }
  } else if (this.purpose === PAYMENT_PURPOSES.RECRUITER_SUBSCRIPTION) {
    if (!this.recruiterCompany || !this.subscriptionTier) {
      next(new Error('A recruiter_subscription payment requires `recruiterCompany` and `subscriptionTier`.'));
      return;
    }
  }

  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
