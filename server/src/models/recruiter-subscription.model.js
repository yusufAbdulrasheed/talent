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
    tier: { type: String, enum: Object.values(SUBSCRIPTION_TIERS), default: SUBSCRIPTION_TIERS.JUNIOR, required: true },
    tierExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const RecruiterSubscription = mongoose.model('RecruiterSubscription', recruiterSubscriptionSchema);

export default RecruiterSubscription;
