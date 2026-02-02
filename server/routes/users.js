import express from 'express';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/me', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'location', 'emergencyContacts', 'medicalInfo', 'preferences'];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

    if (!isValidUpdate) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    updates.forEach(update => {
      req.user[update] = req.body[update];
    });

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user location
router.patch('/me/location', auth, async (req, res) => {
  try {
    const { longitude, latitude, address } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    req.user.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address,
    };

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby users (for emergency contact)
router.get('/nearby', auth, async (req, res) => {
  try {
    const { radius = 5 } = req.query;

    if (!req.user.location || !req.user.location.coordinates) {
      return res.status(400).json({ error: 'User location not set' });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: req.user.location.coordinates,
          },
          $maxDistance: radius * 1000,
        },
      },
    })
    .select('name location')
    .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
