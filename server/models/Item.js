import mongoose from 'mongoose';

export const CATEGORIES = ['electronics', 'id-wallets', 'keys', 'bags', 'books', 'clothing', 'bottles', 'other'];
export const ITEM_TYPES = ['lost', 'found'];
// open: just reported · contacted: someone has started a chat about it · resolved: reunited/closed
export const STATUSES = ['open', 'contacted', 'resolved'];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ITEM_TYPES, required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    date: { type: Date, required: true },
    images: {
      type: [imageSchema],
      default: [],
      validate: { validator: (v) => v.length <= 3, message: 'At most 3 photos per report' },
    },
    // Private: only the report owner sees this. Used to check ownership claims.
    identifyingDetails: { type: String, trim: true, maxlength: 500, default: '' },
    reward: { type: String, trim: true, maxlength: 100, default: '' },
    status: { type: String, enum: STATUSES, default: 'open' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

itemSchema.index({ type: 1, status: 1, createdAt: -1 });
itemSchema.index({ category: 1, type: 1, status: 1 });
itemSchema.index({ status: 1, resolvedAt: -1 });
itemSchema.index({ 'images.url': 1 });

export const Item = mongoose.model('Item', itemSchema);
