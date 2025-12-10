import mongoose, { Schema } from 'mongoose';

const ChatLockSchema = new Schema(
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lockType: {
      type: String,
      enum: ['pin', 'fingerprint', 'webauthn', 'password'],
      required: true,
    },
    // Hashed PIN/password (never store plaintext)
    lockHash: {
      type: String,
      required: true,
      select: false,
    },
    // Encrypted chat data key (encrypted with lock key)
    encryptedDataKey: {
      type: String,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    lockTimeout: {
      type: Number, // seconds
      default: 300, // 5 minutes
    },
    lastUnlockedAt: {
      type: Date,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ChatLockSchema.index({ chatId: 1 });
ChatLockSchema.index({ groupId: 1 });
ChatLockSchema.index({ userId: 1 });

const ChatLock = mongoose.models.ChatLock || mongoose.model('ChatLock', ChatLockSchema);

export default ChatLock;

