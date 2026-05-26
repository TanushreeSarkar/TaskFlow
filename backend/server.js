require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { setupSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocket(server);
app.set('io', io);

const isProduction = process.env.NODE_ENV === 'production';
const localOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
].filter(Boolean);

if (isProduction && allowedOrigins.length === 0) {
  console.warn('⚠️ No production CORS origins configured. Set CLIENT_URL, FRONTEND_URL, or PRODUCTION_URL.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const originsToAllow = isProduction ? allowedOrigins : [...localOrigins, ...allowedOrigins];
    if (originsToAllow.some(o => origin.startsWith(o.replace(/\/+$/, '')))) {
      return callback(null, true);
    }

    if (!isProduction) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// Explicit JSON fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Use Regex /.*/ instead of string '*' for Express 5 compatibility
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
}

// Database Connection
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB Atlas (${process.env.NODE_ENV || 'development'})`);
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    console.error('👉 Fix: Please ensure your current IP address is whitelisted in MongoDB Atlas Network Access (use 0.0.0.0/0 for anywhere).');
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
