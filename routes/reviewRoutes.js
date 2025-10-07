const express = require('express');
const { 
  createReview, 
  getShopReviews, 
  updateReview, 
  deleteReview, 
  replyToReview, 
  markHelpful 
} = require('../controllers/reviewController');
const { auth } = require('../middlewares/auth.JS');

const reviewRouter = express.Router();

// Public routes
reviewRouter.get('/shop/:shopId', getShopReviews);

// Protected routes
reviewRouter.post('/', auth, createReview);
reviewRouter.put('/:reviewId', auth, updateReview);
reviewRouter.delete('/:reviewId', auth, deleteReview);
reviewRouter.post('/:reviewId/reply', auth, replyToReview);
reviewRouter.post('/:reviewId/helpful', auth, markHelpful);

module.exports = { reviewRouter };