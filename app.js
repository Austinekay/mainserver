require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');

const { initializeSettings } = require('./controllers/settingsController');

//routes
const {userRouter}= require('./routes/userroutes');
const {shopRouter}=require('./routes/shopRoutes');
const {authRouter}=require('./routes/authroutes');
const {reviewRouter}=require('./routes/reviewRoutes');
const {shopOwnerRouter}=require('./routes/shopOwnerRoutes');
const {adminRouter}=require('./routes/adminRoutes');
const {recommendationRouter}=require('./routes/recommendationRoutes');


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

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Initialize default settings
      await initializeSettings();
      console.log('Settings initialized');
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/',(req,res)=>{
    res.json({ 
      message: "ShopPilot Backend API",
      status: "running",
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

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  next();
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/shops', shopRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/shop-owner', shopOwnerRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api', recommendationRouter);


// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});



// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});