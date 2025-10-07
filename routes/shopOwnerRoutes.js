const express = require('express');
const Shop = require('../models/shop');
const { 
  getDashboardStats, 
  getNotifications, 
  markNotificationRead, 
  getShopAnalytics 
} = require('../controllers/shopOwnerController');
const { auth } = require('../middlewares/auth.JS');

const shopOwnerRouter = express.Router();

// Dashboard routes
shopOwnerRouter.get('/dashboard/stats', auth, getDashboardStats);
shopOwnerRouter.get('/notifications', auth, getNotifications);
shopOwnerRouter.put('/notifications/:id/read', auth, markNotificationRead);

// Shop management
shopOwnerRouter.get('/my-shops', auth, async (req, res) => {
  try {
    const shops = await Shop.find({ 
      $or: [
        { owner: req.user.userId },
        { ownerId: req.user.userId }
      ]
    }).populate('owner', 'name email');
    res.json({ shops });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Analytics
shopOwnerRouter.get('/shops/:shopId/analytics', auth, getShopAnalytics);

module.exports = { shopOwnerRouter };