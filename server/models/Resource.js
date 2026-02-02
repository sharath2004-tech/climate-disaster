import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['shelter', 'hospital', 'fire-station', 'police-station', 'food-bank', 'water-supply', 'pharmacy', 'gas-station', 'emergency-service', 'other'],
    required: true,
  },
  location: {
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
    city: String,
    state: String,
    zipCode: String,
  },
  contact: {
    phone: String,
    email: String,
    website: String,
  },
  capacity: {
    current: Number,
    maximum: Number,
  },
  availability: {
    type: String,
    enum: ['available', 'limited', 'full', 'closed'],
    default: 'available',
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  services: [String],
  amenities: [String],
  accessibility: {
    wheelchairAccessible: Boolean,
    parkingAvailable: Boolean,
    publicTransportNearby: Boolean,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected', 'archived'],
    default: 'active',
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  description: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for geospatial queries
resourceSchema.index({ 'location.coordinates': '2dsphere' });
resourceSchema.index({ type: 1, availability: 1 });

export default mongoose.model('Resource', resourceSchema);
