const Shop = require('../models/shop');
const Review = require('../models/review');
const Analytics = require('../models/analytics');


const getDashboardStats = async (req, res) => {
  try {
    const shops = await Shop.find({ 
      $or: [
        { owner: req.user.userId },
        { ownerId: req.user.userId }
      ]
    });
    const shopIds = shops.map(shop => shop._id);

    // Get today's analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayViews = await Analytics.countDocuments({
      shopId: { $in: shopIds },
      type: 'view',
      timestamp: { $gte: today }
    });
    
    const todayClicks = await Analytics.countDocuments({
      shopId: { $in: shopIds },
      type: 'click',
      timestamp: { $gte: today }
    });

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
        dailyVisits: todayViews,
        dailyClicks: todayClicks,
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
    const shopOwnerId = shop?.owner?.toString() || shop?.ownerId?.toString();
    if (!shop || shopOwnerId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get analytics data grouped by day
    const analyticsData = await Analytics.aggregate([
      {
        $match: {
          shopId: shop._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            type: "$type"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          views: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "view"] }, "$count", 0]
            }
          },
          clicks: {
            $sum: {
              $cond: [{ $eq: ["$_id.type", "click"] }, "$count", 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const reviews = await Review.find({ shop: shopId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Get total counts
    const totalViews = await Analytics.countDocuments({ shopId: shop._id, type: 'view' });
    const totalClicks = await Analytics.countDocuments({ shopId: shop._id, type: 'click' });

    res.json({
      analytics: analyticsData,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      totalViews,
      totalClicks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyShops = async (req, res) => {
  try {
    const shops = await Shop.find({ 
      $or: [
        { owner: req.user.userId },
        { ownerId: req.user.userId }
      ]
    }).populate('owner', 'name email');
    
    // Get analytics for each shop
    const shopsWithAnalytics = await Promise.all(
      shops.map(async (shop) => {
        const totalViews = await Analytics.countDocuments({ shopId: shop._id, type: 'view' });
        const totalClicks = await Analytics.countDocuments({ shopId: shop._id, type: 'click' });
        const totalReviews = await Review.countDocuments({ shop: shop._id });
        
        return {
          ...shop.toObject(),
          analytics: {
            totalViews,
            totalClicks,
            totalReviews
          }
        };
      })
    );
    
    res.json({ shops: shopsWithAnalytics });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getShopAnalytics,
  getMyShops,
};