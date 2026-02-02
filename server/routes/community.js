import express from 'express';
import { auth } from '../middleware/auth.js';
import CommunityPost from '../models/CommunityPost.js';

const router = express.Router();

// Get all community posts
router.get('/', async (req, res) => {
  try {
    const { category, status, limit = 50 } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const posts = await CommunityPost.find(query)
      .populate('userId', 'name')
      .populate('comments.userId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get posts near a location
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const posts = await CommunityPost.find({
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
    .populate('userId', 'name')
    .populate('comments.userId', 'name')
    .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new post
router.post('/', auth, async (req, res) => {
  try {
    const post = new CommunityPost({
      ...req.body,
      userId: req.user._id,
    });
    await post.save();
    
    const populatedPost = await CommunityPost.findById(post._id)
      .populate('userId', 'name');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update post
router.patch('/:id', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    Object.assign(post, req.body, { updatedAt: new Date() });
    await post.save();

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('userId', 'name')
      .populate('comments.userId', 'name');

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to post
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      userId: req.user._id,
      content: req.body.content,
    });

    post.updatedAt = new Date();
    await post.save();

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('userId', 'name')
      .populate('comments.userId', 'name');

    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
