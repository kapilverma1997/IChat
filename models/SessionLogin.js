import mongoose, { Schema } from 'mongoose';

const SessionLoginSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      index: true,
    },
    deviceName: {
      type: String,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    location: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    isTrusted: {
      type: Boolean,
      default: false,
    },
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    suspiciousReasons: [
      {
        type: String,
        enum: ['new_device', 'new_ip', 'unusual_time', 'unusual_location', 'multiple_failed_attempts'],
      },
    ],
    loginAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    loggedOutAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SessionLoginSchema.index({ userId: 1, isActive: 1 });
SessionLoginSchema.index({ userId: 1, loginAt: -1 });
SessionLoginSchema.index({ ipAddress: 1, loginAt: -1 });

const SessionLogin = mongoose.models.SessionLogin || mongoose.model('SessionLogin', SessionLoginSchema);

export default SessionLogin;

