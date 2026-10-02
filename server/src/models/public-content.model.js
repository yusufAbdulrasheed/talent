import mongoose from 'mongoose';

export const PUBLIC_CONTENT_TYPES = Object.freeze([
  'post',
  'event',
  'testimonial',
  'gallery_item',
  'faq',
]);

const publicContentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: PUBLIC_CONTENT_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 20000 },
    excerpt: { type: String, trim: true, maxlength: 300 },
    author: { type: String, trim: true, maxlength: 120 },
    imageUrl: { type: String, trim: true, maxlength: 1000 },
    eventDate: { type: Date },
    isPublished: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PublicContent = mongoose.model('PublicContent', publicContentSchema);

export default PublicContent;
