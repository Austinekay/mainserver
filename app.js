require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');

//routes
const {userRouter}= require('./routes/userroutes');
const {shopRouter}=require('./routes/shopRoutes');
const {authRouter}=require('./routes/authroutes');
const {reviewRouter}=require('./routes/reviewRoutes');
const {shopOwnerRouter}=require('./routes/shopOwnerRoutes');
const {adminRouter}=require('./routes/adminRoutes');

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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/',(req,res)=>{
    res.send("hello world")
    console.log("hello world")
})

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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(8000,()=>{
    console.log('server running on port 8000')
})