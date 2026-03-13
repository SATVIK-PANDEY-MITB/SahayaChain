require('dotenv').config({ path: './config/config.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

// Import route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const communityRoutes = require('./routes/community.routes');
const loanRoutes = require('./routes/loan.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

// Import middleware
const { notFound, errorHandler } = require('./middleware/error.middleware');

// Import CORS configuration
const corsOptions = require('./config/cors.config');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: corsOptions.credentials
  }
});

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Serve static frontend files from parent directory (BEFORE API routes)
app.use(express.static(path.join(__dirname, '..')));

// Logger middleware in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Reuse loan routes for community loans
app.use('/api/communities/:communityId/loans', loanRoutes);

// Reuse user routes for community members
app.use('/api/communities/:communityId/members', userRoutes);

// Reuse loan routes for user loans
app.use('/api/users/:userId/loans', loanRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Error middleware
app.use(notFound);
app.use(errorHandler);

// Import the User model and chatbot response generator
const User = require('./models/user.model');
const { generateResponse } = require('./controllers/chatbot.controller');

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`New WebSocket connection: ${socket.id}`);

  // Join a community chat room
  socket.on('joinCommunity', (communityId) => {
    socket.join(`community-${communityId}`);
    console.log(`User joined community chat: ${communityId}`);
  });

  // Leave a community chat room
  socket.on('leaveCommunity', (communityId) => {
    socket.leave(`community-${communityId}`);
    console.log(`User left community chat: ${communityId}`);
  });

  // Handle chat message
  socket.on('sendMessage', (data) => {
    // In a real app, save message to database here

    io.to(`community-${data.communityId}`).emit('message', {
      user: data.user,
      text: data.text,
      timestamp: new Date().toISOString()
    });
  });

  // Handle chatbot message
  socket.on('chatbotMessage', async (data) => {
    try {
      // Get user data
      const user = await User.findById(data.userId)
        .select('name verificationStatus loans communities')
        .populate('loans', 'amount status dateRequested')
        .populate('communities', 'name');

      // Generate simple rule-based response (fallback if controller function not available)
      let response;
      if (typeof generateResponse === 'function') {
        response = generateResponse(data.message, user);
      } else {
        response = {
          text: "I'm your financial assistant. How can I help you today?",
          actions: []
        };
      }

      // Send response back to the user
      socket.emit('chatbotResponse', {
        response: response.text,
        actions: response.actions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('chatbotResponse', {
        response: "Sorry, I'm having trouble processing your request right now.",
        actions: [],
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket disconnected: ${socket.id}`);
  });
});

// Set port
const PORT = process.env.PORT || 5000;

// Set strictQuery to suppress deprecation warning
mongoose.set('strictQuery', false);

// Function to start the server
const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}/`);
    console.log(`API: http://localhost:${PORT}/api/`);
  });
};

// Try to connect to database, but start server anyway if connection fails
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    startServer();
  })
  .catch(err => {
    console.warn('⚠️  Database connection failed:', err.message);
    console.warn('⚠️  Starting server in DEMO MODE (API routes requiring database will not work)');
    startServer();
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
}); 