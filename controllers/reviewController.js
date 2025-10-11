const mongoose = require('mongoose');
const Review = require('../models/review');
const Shop = require('../models/shop');


const createReview = async (req, res) => {
  try {
    const { shopId, rating, comment, photos } = req.body;
    
    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if user already reviewed this shop
    const existingReview = await Review.findOne({ 
      shop: shopId, 
      user: req.user.userId 
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this shop' });
    }

    const review = new Review({
      shop: shopId,
      user: req.user.userId,
      rating,
      comment,
      photos: photos || [],
    });

    await review.save();
    await review.populate('user', 'name');



    res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };

    const reviews = await Review.find({ shop: shopId })
      .populate('user', 'name')
      .populate('reply.author', 'name')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ shop: shopId });
    
    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { shop: mongoose.Types.ObjectId(shopId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({
      reviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
      stats: avgRating[0] || { avgRating: 0, count: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, photos } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.photos = photos || review.photos;

    await review.save();
    await review.populate('user', 'name');

    res.json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(reviewId);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;

    const review = await Review.findById(reviewId).populate('shop');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only shop owner or admin can reply
    if (review.shop.owner.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reply to this review' });
    }

    review.reply = {
      text,
      date: new Date(),
      author: req.user.userId,
    };

    await review.save();
    await review.populate('reply.author', 'name');
    await review.populate('user', 'name');



    res.json({
      message: 'Reply added successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user.userId;
    const isHelpful = review.helpful.includes(userId);

    if (isHelpful) {
      review.helpful = review.helpful.filter(id => id.toString() !== userId);
    } else {
      review.helpful.push(userId);
    }

    await review.save();

    res.json({
      message: isHelpful ? 'Removed from helpful' : 'Marked as helpful',
      helpfulCount: review.helpful.length,
      isHelpful: !isHelpful,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createReview,
  getShopReviews,
  updateReview,
  deleteReview,
  replyToReview,
  markHelpful,
};