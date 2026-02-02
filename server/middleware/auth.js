import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const adminAuth = async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  if (!req.user.isActive) {
    return res.status(403).json({ error: 'Account is deactivated.' });
  }
  next();
};
