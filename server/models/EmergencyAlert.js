import mongoose from 'mongoose';

/**
 * EmergencyAlert Model
 * 
 * Used by admins and sub-admins to send immediate action alerts
 * to specific locations/areas for citizen safety.
 */
const emergencyAlertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'evacuation'],
    default: 'warning',
  },
  targetLocation: {
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
  },
  affectedRadius: {
    type: Number, // in kilometers
    default: 5,
  },
  actionRequired: {
    type: String,
    enum: ['prepare', 'evacuate', 'shelter-in-place', 'avoid-area', 'standby', 'all-clear'],
    required: true,
  },
  instructions: [String],
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  notificationsEnabled: {
    type: Boolean,
    default: true, // Notifications are enabled by default when alert is created
  },
  expiresAt: {
    type: Date,
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

// Index for geospatial queries
emergencyAlertSchema.index({ 'targetLocation.coordinates': '2dsphere' });

export default mongoose.model('EmergencyAlert', emergencyAlertSchema);
