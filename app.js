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
// Clean CLIENT_URL and setup CORS
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
console.log('CORS origin set to:', clientUrl);

app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
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
    console.error('MongoDB connection error:', err.message);
  });
} else {
  console.log('MONGODB_URI not provided');
}

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



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});