import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  type: {
    type: String,
    enum: ['flood', 'fire', 'earthquake', 'hurricane', 'tornado', 'tsunami', 'landslide', 'other'],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point', 'Polygon'],
      default: 'Point',
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed, // Can be [longitude, latitude] or array of arrays for Polygon
      required: true,
    },
    address: String,
    city: String,
    state: String,
    country: String,
  },
  affectedRadius: {
    type: Number, // in kilometers
    default: 5,
  },
  status: {
    type: String,
    enum: ['active', 'monitoring', 'resolved'],
    default: 'active',
  },
  instructions: [String],
  sourceAgency: String,
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: Date,
  affectedPopulation: Number,
  evacuationRequired: {
    type: Boolean,
    default: false,
  },
  resources: [{
    type: String,
    description: String,
    location: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for geospatial queries
alertSchema.index({ 'location.coordinates': '2dsphere' });
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ createdAt: -1 });

export default mongoose.model('Alert', alertSchema);
