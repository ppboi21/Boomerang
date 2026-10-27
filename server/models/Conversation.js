import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: { validator: (v) => v.length === 2, message: 'A conversation has exactly two participants' },
    },
    // Sorted participant ids joined with "_" - lets a unique index stop duplicate
    // conversations between the same two people about the same item.
    participantsKey: { type: String, required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
    // userId -> when that user last read this conversation (powers unread counts)
    lastReadAt: { type: Map, of: Date, default: {} },
  },
  { timestamps: true },
);

conversationSchema.index({ item: 1, participantsKey: 1 }, { unique: true });
conversationSchema.index({ participants: 1, updatedAt: -1 });

conversationSchema.statics.keyFor = (a, b) => [String(a), String(b)].sort().join('_');

export const Conversation = mongoose.model('Conversation', conversationSchema);
