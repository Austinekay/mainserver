const express = require('express');
const { createShop, getShops, getShopById, getShopsByOwner, updateShop, deleteShop, searchShopsByLocation, trackShopClick, getShopStatus } = require('../controllers/shopController');
const { upload } = require('../middlewares/upload');
const { auth } = require('../middlewares/auth.JS');
const { requireAdmin } = require('../middlewares/adminMiddleware');

const shopRouter = express.Router();

shopRouter.get('/', getShops);
shopRouter.get('/search', searchShopsByLocation);
shopRouter.get('/owner/:id', getShopsByOwner);
shopRouter.get('/:id', getShopById);
shopRouter.post('/', auth, (req, res, next) => {
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Headers:', req.headers);
  
  // Only apply multer if the request is multipart/form-data
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('multipart/form-data')) {
    upload.fields([{ name: 'image', maxCount: 1 }])(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      console.log('After multer - req.body:', req.body);
      console.log('After multer - req.files:', req.files);
      next();
    });
  } else {
    console.log('JSON request - req.body:', req.body);
    next();
  }
}, createShop);
shopRouter.put('/:id', auth, (req, res, next) => {
  console.log('PUT middleware - Content-Type:', req.get('Content-Type'));
  console.log('PUT middleware - Headers:', req.headers);
  
  // Only apply multer if the request is multipart/form-data
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('multipart/form-data')) {
    upload.fields([{ name: 'image', maxCount: 1 }])(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      console.log('PUT multer - req.body:', req.body);
      console.log('PUT multer - req.files:', req.files);
      next();
    });
  } else {
    console.log('PUT JSON request - req.body:', req.body);
    next();
  }
}, updateShop);
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
