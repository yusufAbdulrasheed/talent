import mongoose from 'mongoose';

export const SUBSCRIPTION_TIERS = Object.freeze({
  JUNIOR: 'junior',
  INTERMEDIATE: 'intermediate',
  SENIOR: 'senior',
});

const recruiterSubscriptionSchema = new mongoose.Schema(
  {
    recruiterCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterCompany',
      required: true,
      unique: true,
      index: true,
    },
    // Junior is the free default and never expires. Intermediate/senior are
    // paid, 30-day windows — see recruiter-subscription.service.js.
    tier: { type: String, enum: Object.values(SUBSCRIPTION_TIERS), default: SUBSCRIPTION_TIERS.JUNIOR, required: true },
    tierExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const RecruiterSubscription = mongoose.model('RecruiterSubscription', recruiterSubscriptionSchema);

export default RecruiterSubscription;
