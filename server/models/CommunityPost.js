import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['update', 'help-needed', 'help-offered', 'information', 'question', 'alert'],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number], // [longitude, latitude]
    address: String,
  },
  images: [String],
  tags: [String],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
communityPostSchema.index({ userId: 1 });
communityPostSchema.index({ category: 1, status: 1 });
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('CommunityPost', communityPostSchema);
