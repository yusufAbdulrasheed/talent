import mongoose from 'mongoose';
import { PLACEMENT_REQUEST_STATUSES } from '../constants/statuses.js';

const placementRequestSchema = new mongoose.Schema(
  {
    recruiterCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruiterCompany', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    jobTitle: { type: String, required: true, trim: true, maxlength: 160 },
    jobDescription: { type: String, required: true, trim: true, maxlength: 6000 },
    employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'internship'], required: true },
    salaryRange: { type: String, trim: true, maxlength: 120 },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    startDate: { type: Date },
    numberRequired: { type: Number, required: true, min: 1, default: 1 },
    groupId: { type: String, index: true },
    additionalNotes: { type: String, trim: true, maxlength: 3000 },
    status: { type: String, enum: Object.values(PLACEMENT_REQUEST_STATUSES), default: PLACEMENT_REQUEST_STATUSES.SUBMITTED, index: true },
    adminNote: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

const PlacementRequest = mongoose.model('PlacementRequest', placementRequestSchema);

export default PlacementRequest;
