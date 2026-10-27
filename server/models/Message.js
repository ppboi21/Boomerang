import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // A message has text, a photo, or both.
    text: { type: String, trim: true, maxlength: 2000, default: '' },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
