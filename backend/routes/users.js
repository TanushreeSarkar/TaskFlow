const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/users/search?email= — search users by email for "add member" feature
router.get('/search', auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || email.length < 2) return res.json([]);

    const users = await User.find({
      email: { $regex: email, $options: 'i' }
    }).select('name email').limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me — get current user profile
router.get('/me', auth, async (req, res) => {
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email });
});

module.exports = router;
