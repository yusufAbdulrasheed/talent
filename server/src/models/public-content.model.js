import mongoose from 'mongoose';

const publicContentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['testimonial', 'gallery_item', 'event', 'faq'], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 5000 },
    imageUrl: { type: String, trim: true, maxlength: 1000 },
    eventDate: { type: Date },
    isPublished: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PublicContent = mongoose.model('PublicContent', publicContentSchema);

export default PublicContent;
