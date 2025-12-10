import mongoose, { Schema } from 'mongoose';

const MessageRetentionSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      unique: true,
      sparse: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      unique: true,
      sparse: true,
    },
    retentionPeriod: {
      type: String,
      enum: ['24h', '7d', '30d', 'forever'],
      default: 'forever',
    },
    retentionDays: {
      type: Number,
      default: null, // null means forever
    },
    setBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastPurgedAt: {
      type: Date,
    },
    nextPurgeAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

MessageRetentionSchema.index({ chatId: 1 });
MessageRetentionSchema.index({ groupId: 1 });
MessageRetentionSchema.index({ nextPurgeAt: 1 });
MessageRetentionSchema.index({ isActive: 1 });

const MessageRetention = mongoose.models.MessageRetention || mongoose.model('MessageRetention', MessageRetentionSchema);

export default MessageRetention;

