import mongoose from 'mongoose';

const recruiterCompanySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true, trim: true, maxlength: 160 },
    cacNumber: { type: String, trim: true, uppercase: true, maxlength: 80 },
    businessAddress: { type: String, trim: true, maxlength: 500 },
    companyEmail: { type: String, required: true, lowercase: true, trim: true },
    website: { type: String, trim: true, maxlength: 300 },
    industry: { type: String, trim: true, maxlength: 120 },
    phoneNumber: { type: String, trim: true, maxlength: 40 },
    contactPerson: { type: String, trim: true, maxlength: 160 },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

const RecruiterCompany = mongoose.model('RecruiterCompany', recruiterCompanySchema);

export default RecruiterCompany;
