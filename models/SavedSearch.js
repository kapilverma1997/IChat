import mongoose, { Schema } from 'mongoose';

const SavedSearchSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
    },
    filters: {
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      dateFrom: {
        type: Date,
      },
      dateTo: {
        type: Date,
      },
      fileType: {
        type: String,
        enum: ['image', 'video', 'document', 'audio', 'link'],
      },
      chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
      },
      groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
      onlyStarred: {
        type: Boolean,
        default: false,
      },
      onlyImages: {
        type: Boolean,
        default: false,
      },
      onlyDocuments: {
        type: Boolean,
        default: false,
      },
      onlyVideos: {
        type: Boolean,
        default: false,
      },
      onlyLinks: {
        type: Boolean,
        default: false,
      },
    },
    name: {
      type: String,
      trim: true,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

SavedSearchSchema.index({ userId: 1, lastSearchedAt: -1 });
SavedSearchSchema.index({ userId: 1, query: 1 });

const SavedSearch = mongoose.models.SavedSearch || mongoose.model('SavedSearch', SavedSearchSchema);

export default SavedSearch;

