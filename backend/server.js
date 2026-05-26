require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
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

// Robust dynamic CORS setup
app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  const host = req.header('Host');
  const referer = req.header('Referer');
  
  let corsOptions = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  // If there's no Origin header (e.g., curl, mobile app, server-to-server request)
  if (!origin) {
    corsOptions.origin = true;
    return callback(null, corsOptions);
  }

  // 1. Check if the origin matches any allowed list
  const originsToAllow = isProduction ? allowedOrigins : [...localOrigins, ...allowedOrigins];
  const isAllowedOrigin = originsToAllow.some(o => origin.startsWith(o.replace(/\/+$/, '')));

  // 2. Check if same-origin (frontend is served by same server as backend)
  const cleanOrigin = origin.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const isSameHost = host && cleanOrigin === host.replace(/\/+$/, '');
  const isSameReferer = referer && referer.replace(/^https?:\/\//i, '').startsWith(host.replace(/\/+$/, ''));

  // 3. Fallback for non-production environments
  const isLocalDev = !isProduction;

  if (isAllowedOrigin || isSameHost || isSameReferer || isLocalDev) {
    corsOptions.origin = origin;
  } else {
    // Gracefully block cross-origin requests by not returning Access-Control-Allow-Origin header
    corsOptions.origin = false;
  }

  callback(null, corsOptions);
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
  const frontendDistPath = path.join(__dirname, '../frontend/dist');
  const indexHtmlPath = path.join(frontendDistPath, 'index.html');

  if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(frontendDistPath));

    // Use Regex /.*/ instead of string '*' for Express 5 compatibility
    app.get(/.*/, (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    // If the frontend is deployed separately (as a static site on Render),
    // the backend won't have the dist directory. Serve a simple health check message.
    app.get('/', (req, res) => {
      res.json({ status: 'ok', message: 'TaskFlow API Server is running in production' });
    });
  }
}

// Validate essential environment variables at startup
if (!process.env.MONGO_URI) {
  console.error('❌ CRITICAL ERROR: MONGO_URI is not defined in the environment variables!');
  console.error('👉 Fix: Please configure MONGO_URI on your hosting dashboard (e.g. Render config vars) or in .env');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL ERROR: JWT_SECRET is not defined in the environment variables!');
  console.error('👉 Fix: Please configure JWT_SECRET on your hosting dashboard (e.g. Render config vars) or in .env');
  process.exit(1);
}

// Database Connection
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  
  const options = {
    dbName: 'taskflow',                     // Force database name
    serverSelectionTimeoutMS: 5000,         // Timeout after 5s instead of hanging
    autoIndex: process.env.NODE_ENV !== 'production', // Disable auto-indexing in production
  };

  try {
    await mongoose.connect(uri, options);
    console.log(`✅ Connected to MongoDB Atlas DB: "${options.dbName}" (${process.env.NODE_ENV || 'development'})`);
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err.message);
    console.error('👉 Fix: Check your credentials and verify that the database server is online.');
    console.error('👉 Fix: Please ensure your IP address is whitelisted in MongoDB Atlas Network Access (use 0.0.0.0/0 for anywhere).');
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
