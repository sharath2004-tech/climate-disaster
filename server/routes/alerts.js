import express from 'express';
import { adminAuth, auth } from '../middleware/auth.js';
import Alert from '../models/Alert.js';

const router = express.Router();

// Get all active alerts
router.get('/', async (req, res) => {
  try {
    const { severity, type, limit = 50 } = req.query;
    
    const query = { status: 'active' };
    if (severity) query.severity = severity;
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alerts near a location
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const alerts = await Alert.find({
      status: 'active',
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      },
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new alert (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update alert (admin only)
router.patch('/:id', auth, adminAuth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle notifications for an alert (admin only)
router.patch('/:id/notifications', auth, adminAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { 
        notificationsEnabled: enabled,
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ 
      message: `Notifications ${enabled ? 'enabled' : 'disabled'} for alert`,
      alert 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
