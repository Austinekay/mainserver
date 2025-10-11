const express = require('express');
const { 
  getDashboardStats, 
  getShopAnalytics,
  getMyShops
} = require('../controllers/shopOwnerController');
const { auth } = require('../middlewares/auth.JS');

const shopOwnerRouter = express.Router();

// Dashboard routes
shopOwnerRouter.get('/dashboard/stats', auth, getDashboardStats);


// Shop management
shopOwnerRouter.get('/my-shops', auth, getMyShops);

// Analytics
shopOwnerRouter.get('/shops/:shopId/analytics', auth, getShopAnalytics);

module.exports = { shopOwnerRouter };