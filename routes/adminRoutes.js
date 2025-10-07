const express = require('express');
const { auth } = require('../middlewares/auth.JS');
const { requireAdmin } = require('../middlewares/adminMiddleware');
const User = require('../models/user');
const Shop = require('../models/shop');

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
adminRouter.get('/settings', auth, requireAdmin, async (req, res) => {
  try {
    // Return default settings - in a real app, these would be stored in database
    const settings = {
      emailNotifications: true,
      pushNotifications: false,
      autoApproveShops: false,
      maintenanceMode: false,
      maxShopsPerUser: 5,
      sessionTimeout: 30,
      backupFrequency: 'daily',
    };
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

adminRouter.put('/settings', auth, requireAdmin, async (req, res) => {
  try {
    // In a real app, save settings to database
    const settings = req.body;
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics
adminRouter.get('/analytics', auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalShops = await Shop.countDocuments();
    
    res.json({
      platformStats: {
        totalUsers,
        activeUsers: Math.floor(totalUsers * 0.7),
        totalShops,
        totalViews: 45230,
        totalClicks: 12450
      },
      topCategories: [
        { name: 'Restaurants', count: 45, percentage: 28.8 },
        { name: 'Retail', count: 38, percentage: 24.4 }
      ],
      popularLocations: [
        { city: 'New York', shopCount: 45, viewCount: 12500 }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = { adminRouter };