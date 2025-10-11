const express = require('express');
const { createShop, getShops, getShopById, getShopsByOwner, updateShop, deleteShop, searchShopsByLocation, trackShopClick, getShopStatus } = require('../controllers/shopController');
const { auth } = require('../middlewares/auth.JS');
const { requireAdmin } = require('../middlewares/adminMiddleware');

const shopRouter = express.Router();

shopRouter.get('/', getShops);
shopRouter.get('/search', searchShopsByLocation);
shopRouter.get('/owner/:id', getShopsByOwner);
shopRouter.get('/:id', getShopById);
shopRouter.post('/', auth, createShop);
shopRouter.put('/:id', auth, updateShop);
shopRouter.delete('/:id', auth, deleteShop);
shopRouter.get('/:shopId/status', getShopStatus);
shopRouter.post('/:shopId/track-click', (req, res, next) => {
  // Optional auth - don't require authentication for click tracking
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    // If token exists, try to decode it but don't fail if it's invalid
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Ignore auth errors for click tracking
    }
  }
  next();
}, trackShopClick);

module.exports = { shopRouter };
