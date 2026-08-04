import mongoose from 'mongoose';

const trainerAssignmentSchema = new mongoose.Schema(
  {
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    batchName: { type: String, required: true, trim: true, maxlength: 120 },
    assignedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
    announcement: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

trainerAssignmentSchema.index({ trainer: 1, program: 1, batchName: 1 }, { unique: true });

const TrainerAssignment = mongoose.model('TrainerAssignment', trainerAssignmentSchema);

export default TrainerAssignment;
