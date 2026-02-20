import express from 'express';
import { adminAuth, auth } from '../middleware/auth.js';
import Alert from '../models/Alert.js';
import CommunityPost from '../models/CommunityPost.js';
import EmergencyAlert from '../models/EmergencyAlert.js';
import Report from '../models/Report.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Admin Dashboard Stats
 * GET /api/admin/stats
 */
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalReports,
      totalResources,
      totalAlerts,
      totalCommunityPosts,
      activeEmergencyAlerts,
      subAdmins
    ] = await Promise.all([
      User.countDocuments(),
      Report.countDocuments(),
      Resource.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
      CommunityPost.countDocuments(),
      EmergencyAlert.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'subadmin' })
    ]);

    res.json({
      totalUsers,
      totalReports,
      totalResources,
      totalAlerts,
      totalCommunityPosts,
      activeEmergencyAlerts,
      subAdmins
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { role, limit = 50, page = 1 } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create sub-admin (admin only)
 * POST /api/admin/subadmin
 */
router.post('/subadmin', auth, adminAuth, async (req, res) => {
  try {
    // Only full admins can create sub-admins
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create sub-admins' });
    }

    const { email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const subAdmin = new User({
      email,
      password,
      name,
      phone,
      role: 'subadmin',
      createdBy: req.user._id,
    });

    await subAdmin.save();

    res.status(201).json({
      message: 'Sub-admin created successfully',
      user: {
        _id: subAdmin._id,
        email: subAdmin.email,
        name: subAdmin.name,
        role: subAdmin.role,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove sub-admin (admin only)
 * DELETE /api/admin/subadmin/:id
 */
router.delete('/subadmin/:id', auth, adminAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove sub-admins' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'subadmin') {
      return res.status(400).json({ error: 'User is not a sub-admin' });
    }

    // Instead of deleting, deactivate
    user.isActive = false;
    user.role = 'user';
    await user.save();

    res.json({ message: 'Sub-admin removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send emergency alert (admin/subadmin)
 * POST /api/admin/emergency-alert
 */
router.post('/emergency-alert', auth, adminAuth, async (req, res) => {
  try {
    const { title, message, severity, targetLocation, affectedRadius, actionRequired, instructions, expiresAt } = req.body;

    // Create EmergencyAlert for admin tracking
    const emergencyAlert = new EmergencyAlert({
      title,
      message,
      severity,
      targetLocation,
      affectedRadius,
      actionRequired,
      instructions,
      expiresAt,
      issuedBy: req.user._id,
    });

    await emergencyAlert.save();

    // Map emergency alert severity to public alert severity
    const severityMap = {
      'info': 'low',
      'warning': 'medium',
      'critical': 'high',
      'evacuation': 'critical'
    };

    // Map actionRequired to alert type
    const typeMap = {
      'evacuate': 'flood',
      'shelter-in-place': 'hurricane',
      'avoid-area': 'fire',
      'prepare': 'other',
      'standby': 'other',
      'all-clear': 'other'
    };

    // Also create a public Alert so it shows in the AlertsSection
    const publicAlert = new Alert({
      title,
      description: message,
      severity: severityMap[severity] || 'medium',
      type: typeMap[actionRequired] || 'other',
      location: targetLocation,
      affectedRadius,
      status: 'active',
      instructions,
      sourceAgency: 'SKYNETRA Emergency System',
      validFrom: new Date(),
      validUntil: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
    });

    await publicAlert.save();

    const populatedAlert = await EmergencyAlert.findById(emergencyAlert._id)
      .populate('issuedBy', 'name role');

    res.status(201).json({
      emergencyAlert: populatedAlert,
      publicAlert: publicAlert,
      message: 'Alert sent successfully to both admin and public channels'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all emergency alerts
 * GET /api/admin/emergency-alerts
 */
router.get('/emergency-alerts', auth, adminAuth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const alerts = await EmergencyAlert.find({ status })
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel emergency alert
 * PATCH /api/admin/emergency-alert/:id/cancel
 */
router.patch('/emergency-alert/:id/cancel', auth, adminAuth, async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'cancelled';
    alert.updatedAt = new Date();
    await alert.save();

    res.json({ message: 'Alert cancelled', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Toggle notifications for emergency alert
 * PATCH /api/admin/emergency-alert/:id/notifications
 */
router.patch('/emergency-alert/:id/notifications', auth, adminAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { 
        notificationsEnabled: enabled,
        updatedAt: new Date() 
      },
      { new: true }
    ).populate('issuedBy', 'name role');
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ 
      message: `Notifications ${enabled ? 'enabled' : 'disabled'} for emergency alert`,
      alert 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all community posts for moderation
 * GET /api/admin/community-posts
 */
router.get('/community-posts', auth, adminAuth, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    const posts = await CommunityPost.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CommunityPost.countDocuments();

    res.json({ posts, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create community post as admin
 * POST /api/admin/community-post
 */
router.post('/community-post', auth, adminAuth, async (req, res) => {
  try {
    const post = new CommunityPost({
      ...req.body,
      userId: req.user._id,
      verified: true, // Admin posts are auto-verified
    });

    await post.save();

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('userId', 'name');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete any community post (moderation)
 * DELETE /api/admin/community-post/:id
 */
router.delete('/community-post/:id', auth, adminAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all reports for review
 * GET /api/admin/reports
 */
router.get('/reports', auth, adminAuth, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify/update report status
 * PATCH /api/admin/report/:id
 */
router.patch('/report/:id', auth, adminAuth, async (req, res) => {
  try {
    const { status, verified, response } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (status) report.status = status;
    if (verified !== undefined) {
      report.verified = verified;
      report.verifiedBy = req.user._id;
      report.verifiedAt = new Date();
    }
    if (response) {
      report.response = {
        message: response,
        responder: req.user._id,
        respondedAt: new Date(),
      };
    }

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate('userId', 'name')
      .populate('verifiedBy', 'name');

    res.json(populatedReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all resources for management
 * GET /api/admin/resources
 */
router.get('/resources', auth, adminAuth, async (req, res) => {
  try {
    const resources = await Resource.find()
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Activity log - recent actions across the platform
 * GET /api/admin/activity
 */
router.get('/activity', auth, adminAuth, async (req, res) => {
  try {
    const [recentReports, recentPosts, recentAlerts, recentUsers] = await Promise.all([
      Report.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name'),
      CommunityPost.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name'),
      EmergencyAlert.find().sort({ createdAt: -1 }).limit(10).populate('issuedBy', 'name'),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt'),
    ]);

    // Combine and sort by date
    const activities = [
      ...recentReports.map(r => ({ type: 'report', data: r, createdAt: r.createdAt })),
      ...recentPosts.map(p => ({ type: 'community_post', data: p, createdAt: p.createdAt })),
      ...recentAlerts.map(a => ({ type: 'emergency_alert', data: a, createdAt: a.createdAt })),
      ...recentUsers.map(u => ({ type: 'new_user', data: u, createdAt: u.createdAt })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
