const express = require('express');
const { auth } = require('../middlewares/auth.JS');
const { requireAdmin } = require('../middlewares/adminMiddleware');
const User = require('../models/user');
const Shop = require('../models/shop');
const Analytics = require('../models/analytics');
const { getSettings, updateSettings } = require('../controllers/settingsController');


const adminRouter = express.Router();

// Suspend/Unsuspend user
adminRouter.put('/users/:userId/suspend', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { suspended: suspend },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin shop management
adminRouter.get('/shops', auth, requireAdmin, async (req, res) => {
  try {
    const shops = await Shop.find({}).populate('owner', 'name email');
    res.json({ shops });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

adminRouter.post('/shops', auth, requireAdmin, async (req, res) => {
  try {
    const { name, description, address, categories, ownerId, location } = req.body;
    const shop = new Shop({
      name,
      description,
      address,
      categories: categories || ['General'],
      owner: ownerId,
      ownerId,
      location: location || { type: 'Point', coordinates: [0, 0] }
    });
    await shop.save();
    await shop.populate('owner', 'name email');
    res.status(201).json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

adminRouter.put('/shops/:id', auth, requireAdmin, async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('owner', 'name email');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

adminRouter.put('/shops/:id/approve', auth, requireAdmin, async (req, res) => {
  try {
    console.log('Approving shop with ID:', req.params.id);
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).populate('owner', 'name email');
    if (!shop) {
      console.log('Shop not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Shop not found' });
    }
    console.log('Shop approved successfully:', shop.name);
    res.json({ message: 'Shop approved successfully', shop });
  } catch (error) {
    console.error('Error approving shop:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

adminRouter.delete('/shops/:id', auth, requireAdmin, async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Settings management
adminRouter.get('/settings', auth, requireAdmin, getSettings);
adminRouter.put('/settings', auth, requireAdmin, updateSettings);



// Get admin stats
adminRouter.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ approved: true });
    const pendingShops = await Shop.countDocuments({ approved: false });
    
    // Get categories count
    const categoryStats = await Shop.aggregate([
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const totalCategories = categoryStats.length;
    
    // Mock data for reports (you can implement actual report model later)
    const pendingReports = 8;
    const resolvedReports = 45;
    
    res.json({
      totalUsers,
      totalShops,
      activeShops,
      pendingShops,
      totalCategories,
      pendingReports,
      resolvedReports,
      categoryStats: categoryStats.slice(0, 5) // Top 5 categories
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics
adminRouter.get('/analytics', auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalShops = await Shop.countDocuments();
    const activeUsers = await User.countDocuments({ suspended: { $ne: true } });
    
    // Get category statistics
    const categoryStats = await Shop.aggregate([
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Calculate percentages for categories
    const topCategories = categoryStats.map(cat => ({
      name: cat._id,
      count: cat.count,
      percentage: totalShops > 0 ? Math.round((cat.count / totalShops) * 100 * 10) / 10 : 0
    }));
    
    // Get location statistics (group by first word of address as city)
    const locationStats = await Shop.aggregate([
      {
        $addFields: {
          city: {
            $arrayElemAt: [
              { $split: ['$address', ','] },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$city',
          shopCount: { $sum: 1 }
        }
      },
      { $sort: { shopCount: -1 } },
      { $limit: 5 }
    ]);
    
    const popularLocations = locationStats.map(loc => ({
      city: loc._id.trim(),
      shopCount: loc.shopCount,
      viewCount: Math.floor(loc.shopCount * 250) // Mock view count based on shop count
    }));
    
    res.json({
      platformStats: {
        totalUsers,
        activeUsers,
        totalShops,
        totalViews: await Analytics.countDocuments({ type: 'view' }),
        totalClicks: await Analytics.countDocuments({ type: 'click' })
      },
      topCategories,
      popularLocations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track analytics
adminRouter.post('/track', async (req, res) => {
  try {
    const { shopId, type } = req.body;
    const analytics = new Analytics({
      shopId,
      type,
      userId: req.user?.userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await analytics.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Tracking failed', error: error.message });
  }
});

module.exports = { adminRouter };