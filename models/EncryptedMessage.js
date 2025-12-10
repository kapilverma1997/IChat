import mongoose, { Schema } from 'mongoose';

const EncryptedMessageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Encrypted payload (AES encrypted)
    encryptedContent: {
      type: String,
      required: true,
    },
    // Encrypted session key (RSA encrypted for each recipient)
    encryptedSessionKeys: [
      {
        recipientId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        encryptedKey: {
          type: String,
          required: true,
        },
      },
    ],
    // Message metadata (not encrypted, for search/filtering)
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'file', 'audio', 'location', 'contact'],
      default: 'text',
    },
    messageHash: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

EncryptedMessageSchema.index({ chatId: 1, createdAt: -1 });
EncryptedMessageSchema.index({ groupId: 1, createdAt: -1 });
EncryptedMessageSchema.index({ senderId: 1 });
EncryptedMessageSchema.index({ expiresAt: 1 });

const EncryptedMessage = mongoose.models.EncryptedMessage || mongoose.model('EncryptedMessage', EncryptedMessageSchema);

export default EncryptedMessage;

