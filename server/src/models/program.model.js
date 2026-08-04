import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 4000 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const Program = mongoose.model('Program', programSchema);

export default Program;
