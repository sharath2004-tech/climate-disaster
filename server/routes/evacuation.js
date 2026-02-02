import express from 'express';
import { adminAuth, auth } from '../middleware/auth.js';
import EvacuationRoute from '../models/EvacuationRoute.js';

const router = express.Router();

// Get all evacuation routes
router.get('/', async (req, res) => {
  try {
    const { status, active } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (active !== undefined) query.active = active === 'true';

    const routes = await EvacuationRoute.find(query)
      .populate('shelters')
      .sort({ priority: -1 });

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get routes from a location
router.get('/from', async (req, res) => {
  try {
    const { longitude, latitude, radius = 5 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const routes = await EvacuationRoute.find({
      active: true,
      'fromLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radius * 1000,
        },
      },
    })
    .populate('shelters')
    .sort({ priority: -1 });

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get route by ID
router.get('/:id', async (req, res) => {
  try {
    const route = await EvacuationRoute.findById(req.params.id)
      .populate('shelters');
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new evacuation route (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const route = new EvacuationRoute(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update evacuation route (admin only)
router.patch('/:id', auth, adminAuth, async (req, res) => {
  try {
    const route = await EvacuationRoute.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('shelters');
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete evacuation route (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const route = await EvacuationRoute.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
