const User = require('../models/user');
const jwt = require('jsonwebtoken');
const  logger  = require('../utils/logger');
// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// ----------------------
// REGISTER
// ----------------------
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user — pre-save hook will hash password automatically
    const user = new User({ name, email, password });
    await user.save();

    // Generate JWT
    const token = generateToken(user._id);
    logger.info(`User registered: ${user._id} (${user.email})`);  

    res.status(201).json({ token });
  } catch (err) {
  logger.error('Register error:', err);
  res.status(500).json({ 
    message: 'Server error during registration', 
    error: err.message,
    stack: err.stack
  });
}
};

// ----------------------
// LOGIN
// ----------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // Find user
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });


    // Generate JWT
    const token = generateToken(user._id);
    logger.info(`User logged in: ${user._id} (${user.email})`); 
    res.json({ token });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};