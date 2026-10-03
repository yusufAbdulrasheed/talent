import mongoose from 'mongoose';
import { CANDIDATE_STATUSES } from '../constants/statuses.js';

export const CANDIDATE_DOCUMENT_TYPES = Object.freeze([
  'passport_photo',
  'resume',
  'national_id',
  'certificate',
]);

export const REQUIRED_DOCUMENT_TYPES = Object.freeze(['passport_photo', 'resume', 'national_id']);

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, enum: CANDIDATE_DOCUMENT_TYPES },
    url: { type: String, required: true },
    publicId: { type: String },
    storageKey: { type: String },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const candidateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    referenceNumber: { type: String, required: true, unique: true, uppercase: true, immutable: true },
    phoneNumber: { type: String, trim: true },
    gender: { type: String, enum: ['female', 'male', 'prefer_not_to_say'] },
    dateOfBirth: { type: Date },
    location: { type: String, trim: true, maxlength: 160 },
    jobTitle: { type: String, trim: true, maxlength: 160, index: true },
    bio: { type: String, trim: true, maxlength: 600 },
    education: { type: String, trim: true, maxlength: 1000 },
    skills: [{ type: String, trim: true, maxlength: 80 }],
    certifications: [{ type: String, trim: true, maxlength: 160 }],
    workExperience: { type: String, trim: true, maxlength: 4000 },
    availability: { type: String, enum: ['immediate', 'two_weeks', 'one_month', 'not_available'] },
    experienceLevel: { type: String, enum: ['entry', 'junior', 'mid', 'senior'] },
    documents: [documentSchema],
    status: {
      type: String,
      enum: Object.values(CANDIDATE_STATUSES),
      default: CANDIDATE_STATUSES.DRAFT,
      index: true,
    },
    adminReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      note: { type: String, trim: true, maxlength: 2000 },
    },
  },
  { timestamps: true },
);

candidateSchema.index({ status: 1, location: 1, skills: 1 });

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
