import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    sequence: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
