
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const logger = require('../utils/logger');

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    logger.info(`Authenticated user: ${req.user._id} (${req.user.email})`);
    next();
  } catch (err) {
    logger.error('Authentication error:', err);
    res.status(401).json({ message: 'Token invalid' });
  }
};