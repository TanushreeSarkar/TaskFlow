const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let io = null;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.user._id})`);

    // Join a project room
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`${socket.user.name} joined project:${projectId}`);
    });

    // Leave a project room
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`${socket.user.name} left project:${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { setupSocket, getIO };
