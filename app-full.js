require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: "ShopPilot Backend API",
    status: "running",
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Import routes with error handling
let routes = {};
try {
  routes.userRouter = require('./routes/userroutes');
  routes.shopRouter = require('./routes/shopRoutes');
  routes.authRouter = require('./routes/authroutes');
  routes.reviewRouter = require('./routes/reviewRoutes');
  routes.shopOwnerRouter = require('./routes/shopOwnerRoutes');
  routes.adminRouter = require('./routes/adminRoutes');
  routes.recommendationRouter = require('./routes/recommendationRoutes');
  
  // Use routes
  app.use('/api/v1/auth', routes.authRouter);
  app.use('/api/v1/users', routes.userRouter);
  app.use('/api/v1/shops', routes.shopRouter);
  app.use('/api/v1/reviews', routes.reviewRouter);
  app.use('/api/v1/shop-owner', routes.shopOwnerRouter);
  app.use('/api/v1/admin', routes.adminRouter);
  app.use('/api', routes.recommendationRouter);
  
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error.message);
  // Continue without routes for now
}

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Initialize settings only after successful connection
    try {
      const { initializeSettings } = require('./controllers/settingsController');
      await initializeSettings();
      console.log('Settings initialized');
    } catch (error) {
      console.error('Error initializing settings:', error.message);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });
} else {
  console.log('MONGODB_URI not provided');
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});