import mongoose from 'mongoose';

const accountTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['email_verification', 'password_reset'], required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

accountTokenSchema.index({ user: 1, type: 1 });

const AccountToken = mongoose.model('AccountToken', accountTokenSchema);

export default AccountToken;
