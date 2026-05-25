// //Built with ❤️ for the **[Ethara.AI](https://ethara.ai)** Full-Stack Engineering Assessment 
// By Tanushree Sarkar (2201641530214)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const validate = require('../middleware/validate');

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Signup — no global role anymore
router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
