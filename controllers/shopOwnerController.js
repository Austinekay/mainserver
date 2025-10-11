const Shop = require('../models/shop');
const Review = require('../models/review');
const Analytics = require('../models/analytics');


const getDashboardStats = async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user.userId });
    const shopIds = shops.map(shop => shop._id);

    // Get today's analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await Analytics.aggregate([
      { $match: { shop: { $in: shopIds }, date: { $gte: today } } },
      { $group: { _id: null, visits: { $sum: '$visits' }, clicks: { $sum: '$clicks' } } }
    ]);

    // Get total reviews
    const totalReviews = await Review.countDocuments({ shop: { $in: shopIds } });
    
    // Get recent reviews
    const recentReviews = await Review.find({ shop: { $in: shopIds } })
      .populate('user', 'name')
      .populate('shop', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        dailyVisits: todayStats[0]?.visits || 0,
        dailyClicks: todayStats[0]?.clicks || 0,
        totalReviews,
        totalShops: shops.length,
      },
      recentReviews,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const getShopAnalytics = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = '7' } = req.query;

    const shop = await Shop.findById(shopId);
    if (!shop || shop.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Analytics.find({
      shop: shopId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const reviews = await Review.find({ shop: shopId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    res.json({
      analytics,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getShopAnalytics,
};