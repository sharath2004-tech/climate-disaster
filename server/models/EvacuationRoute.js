import mongoose from 'mongoose';

const evacuationRouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  fromLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    address: String,
  },
  toLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    address: String,
  },
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString',
    },
    coordinates: [[Number]], // Array of [longitude, latitude] pairs
  },
  distance: {
    type: Number, // in kilometers
  },
  estimatedDuration: {
    type: Number, // in minutes
  },
  status: {
    type: String,
    enum: ['open', 'congested', 'closed', 'hazardous'],
    default: 'open',
  },
  transportModes: {
    type: [String],
    enum: ['walking', 'driving', 'bus', 'train', 'boat', 'helicopter'],
    default: ['driving', 'walking'],
  },
  hazards: [{
    type: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    description: String,
  }],
  shelters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
  }],
  checkpoints: [{
    name: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    services: [String],
  }],
  capacity: {
    current: Number,
    maximum: Number,
  },
  priority: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
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
evacuationRouteSchema.index({ 'fromLocation.coordinates': '2dsphere' });
evacuationRouteSchema.index({ 'toLocation.coordinates': '2dsphere' });
evacuationRouteSchema.index({ status: 1, active: 1 });

export default mongoose.model('EvacuationRoute', evacuationRouteSchema);
