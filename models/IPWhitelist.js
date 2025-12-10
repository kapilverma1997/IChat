import mongoose, { Schema } from 'mongoose';

const IPWhitelistSchema = new Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

IPWhitelistSchema.index({ isActive: 1, expiresAt: 1 });

const IPWhitelist = mongoose.models.IPWhitelist || mongoose.model('IPWhitelist', IPWhitelistSchema);

export default IPWhitelist;

