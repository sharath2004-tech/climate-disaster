import express from 'express';
import { adminAuth, auth } from '../middleware/auth.js';
import Resource from '../models/Resource.js';

const router = express.Router();

// Get all resources
router.get('/', async (req, res) => {
  try {
    const { type, availability, limit = 100 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (availability) query.availability = availability;

    const resources = await Resource.find(query)
      .limit(parseInt(limit));

    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resources near a location
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 20, type } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const query = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radius * 1000,
        },
      },
    };

    if (type) query.type = type;

    const resources = await Resource.find(query);
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new resource (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const resource = new Resource(req.body);
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest a new resource (any authenticated user) - creates pending resource
router.post('/suggest', auth, async (req, res) => {
  try {
    const resource = new Resource({
      ...req.body,
      status: 'pending', // Needs admin approval
      suggestedBy: req.user._id,
      createdAt: new Date(),
    });
    await resource.save();
    res.status(201).json({ 
      message: 'Resource suggestion submitted for review',
      resource 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update resource
router.patch('/:id', auth, adminAuth, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true }
    );
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resource (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
