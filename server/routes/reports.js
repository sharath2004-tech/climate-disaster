import express from 'express';
import { adminAuth, auth } from '../middleware/auth.js';
import Report from '../models/Report.js';

const router = express.Router();

// Get all reports
router.get('/', async (req, res) => {
  try {
    const { status, type, severity, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (severity) query.severity = severity;

    const reports = await Report.find(query)
      .populate('userId', 'name email')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports near a location
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const reports = await Report.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: radius * 1000,
        },
      },
    })
    .populate('userId', 'name email');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new report
router.post('/', auth, async (req, res) => {
  try {
    const report = new Report({
      ...req.body,
      userId: req.user._id,
    });
    await report.save();
    
    const populatedReport = await Report.findById(report._id)
      .populate('userId', 'name email');
    
    res.status(201).json(populatedReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update report status (admin only)
router.patch('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, verified, responseMessage } = req.body;
    
    const updateData = {
      status,
      verified,
      updatedAt: new Date(),
    };

    if (verified) {
      updateData.verifiedBy = req.user._id;
      updateData.verifiedAt = new Date();
    }

    if (responseMessage) {
      updateData.response = {
        message: responseMessage,
        responder: req.user._id,
        respondedAt: new Date(),
      };
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('userId', 'name email');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upvote a report
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const upvoteIndex = report.upvotes.indexOf(req.user._id);
    
    if (upvoteIndex > -1) {
      // Remove upvote
      report.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      report.upvotes.push(req.user._id);
    }

    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
