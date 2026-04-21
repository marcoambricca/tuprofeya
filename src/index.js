require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const chatRepo = require('./repositories/chat.repository');
const { query } = require('./config/database');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'https://tuprofeya-front.vercel.app/', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/teachers', require('./routes/teachers.routes'));
app.use('/api/announcements', require('./routes/announcements.routes'));
app.use('/api/requests', require('./routes/requests.routes'));
app.use('/api/chats', require('./routes/chats.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));
app.use('/api/subscriptions', require('./routes/subscriptions.routes'));
app.use('/api/uploads', require('./routes/uploads.routes'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io — Real-time chat
const connectedUsers = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, name, role FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows[0]) return next(new Error('User not found'));
    socket.user = result.rows[0];
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  connectedUsers.set(socket.user.id, socket.id);
  socket.emit('connected', { userId: socket.user.id });

  // Join chat room
  socket.on('join_chat', async ({ chatId }) => {
    const hasAccess = await chatRepo.hasAccess(chatId, socket.user.id);
    if (!hasAccess) return socket.emit('error', { message: 'Acceso denegado' });
    socket.join(`chat:${chatId}`);
  });

  // Send message
  socket.on('send_message', async ({ chatId, content }) => {
    if (!content?.trim()) return;

    const hasAccess = await chatRepo.hasAccess(chatId, socket.user.id);
    if (!hasAccess) return socket.emit('error', { message: 'Acceso denegado' });

    const message = await chatRepo.addMessage(chatId, socket.user.id, content.trim());
    const fullMessage = {
      ...message,
      sender_name: socket.user.name,
    };

    io.to(`chat:${chatId}`).emit('new_message', fullMessage);
  });

  // Typing indicator
  socket.on('typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('user_typing', { userId: socket.user.id, name: socket.user.name });
  });

  socket.on('stop_typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('user_stop_typing', { userId: socket.user.id });
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.user.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`SuperProfe API running on port ${PORT}`);
});
