import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
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

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
