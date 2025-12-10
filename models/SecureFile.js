import mongoose, { Schema } from 'mongoose';

const SecureFileSchema = new Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    encryptedName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    encryptedFilePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    encryptedSize: {
      type: Number,
      required: true,
    },
    // Encrypted file encryption key (RSA encrypted for each recipient)
    encryptedKeys: [
      {
        userId: {
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
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

SecureFileSchema.index({ chatId: 1 });
SecureFileSchema.index({ groupId: 1 });
SecureFileSchema.index({ uploadedBy: 1 });
SecureFileSchema.index({ expiresAt: 1 });

const SecureFile = mongoose.models.SecureFile || mongoose.model('SecureFile', SecureFileSchema);

export default SecureFile;

