const Shop = require('../models/shop');
const User = require('../models/user');
const Analytics = require('../models/analytics');
const NodeGeocoder = require('node-geocoder');
const { uploadToS3 } = require('../utils/uploadToS3');


const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

const createShop = async (req, res) => {
  try {
    console.log('=== CREATE SHOP START ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const contentType = req.get('Content-Type');
    const isFormData = contentType && contentType.includes('multipart/form-data');
    
    let name, description, address, contact, categories, location, openingHours, ownerId;
    
    if (isFormData) {
      // Handle FormData request (with potential file upload)
      ({ name, description, address, contact } = req.body);
      try {
        categories = req.body.categories ? JSON.parse(req.body.categories) : ['General'];
        location = req.body.location ? JSON.parse(req.body.location) : null;
        openingHours = req.body.openingHours ? JSON.parse(req.body.openingHours) : null;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return res.status(400).json({ message: 'Invalid JSON in form data', error: parseError.message });
      }
      ownerId = req.body.ownerId;
    } else {
      // Handle JSON request (no file upload)
      ({ name, description, address, contact, categories = ['General'], location, openingHours, ownerId } = req.body);
    }
    
    console.log('Parsed data:', { name, description, address, categories, contact, location });
    
    let imageUrl = null;
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        console.log('Uploading image to S3...');
        imageUrl = await uploadToS3(req.files.image[0]);
        console.log('Image uploaded to S3:', imageUrl);
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({ message: 'Image upload failed', error: uploadError.message });
      }
    }
    
    // Validate required fields
    if (!name || !description || !address) {
      console.log('Validation failed:', { name: !!name, description: !!description, address: !!address });
      return res.status(400).json({ message: 'Name, description, and address are required' });
    }
    
    // Validate location coordinates
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      console.log('Location validation failed:', { location });
      return res.status(400).json({ message: 'Valid location coordinates are required' });
    }
    
    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'Invalid coordinates provided' });
    }
    
    // Ensure openingHours has proper structure with isClosed property
    const defaultHours = {
      'monday': { open: '09:00', close: '17:00', isClosed: false },
      'tuesday': { open: '09:00', close: '17:00', isClosed: false },
      'wednesday': { open: '09:00', close: '17:00', isClosed: false },
      'thursday': { open: '09:00', close: '17:00', isClosed: false },
      'friday': { open: '09:00', close: '17:00', isClosed: false },
      'saturday': { open: '10:00', close: '16:00', isClosed: false },
      'sunday': { open: '10:00', close: '16:00', isClosed: false }
    };

    const shop = new Shop({
      owner: ownerId || req.user.userId,
      ownerId: ownerId || req.user.userId,
      name,
      description,
      address,
      contact,
      categories,
      imageUrl,
      location,
      openingHours: openingHours || defaultHours
    });

    await shop.save();
    await shop.populate('owner', 'name email');



    res.status(201).json({
      message: 'Shop created successfully',
      shop
    });
  } catch (error) {
    console.error('=== CREATE SHOP ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
};

const getShops = async (req, res) => {
  try {
    console.log('getShops called with query:', req.query);
    const { lat, lng, radius = 5000, category, search } = req.query;
    
    let query = { approved: true };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { categories: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Add geolocation filter if coordinates provided
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }
    
    // Add category filter if provided
    if (category) {
      query.categories = { $in: [new RegExp(category, 'i')] };
    }
    
    console.log('Shop query:', JSON.stringify(query, null, 2));
    const shops = await Shop.find(query).populate('owner', 'name email');
    console.log('Found shops:', shops.length);
    
    // Convert shops to objects and ensure openingHours is properly formatted
    const formattedShops = shops.map(shop => {
      const shopObject = shop.toObject();
      if (shopObject.openingHours && shopObject.openingHours instanceof Map) {
        shopObject.openingHours = Object.fromEntries(shopObject.openingHours);
      }
      return shopObject;
    });
    
    res.json({ shops: formattedShops });
  } catch (error) {
    console.error('getShops error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getShopById = async (req, res) => {
  try {
    console.log('getShopById - fetching shop with ID:', req.params.id);
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email');
    if (!shop) {
      console.log('getShopById - shop not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Track view analytics
    try {
      const analytics = new Analytics({
        shopId: shop._id,
        type: 'view',
        userId: req.user?.userId || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      await analytics.save();
    } catch (analyticsError) {
      console.error('Error saving analytics:', analyticsError);
    }
    
    // Convert shop to object and ensure openingHours is properly formatted
    const shopObject = shop.toObject();
    console.log('getShopById - original openingHours:', shopObject.openingHours);
    
    // Ensure openingHours is a proper object (convert from Map if needed)
    if (shopObject.openingHours && typeof shopObject.openingHours === 'object') {
      if (shopObject.openingHours instanceof Map) {
        shopObject.openingHours = Object.fromEntries(shopObject.openingHours);
      }
    }
    
    console.log('getShopById - processed openingHours:', shopObject.openingHours);
    console.log('getShopById - found shop:', shop.name);
    console.log('getShopById - shop images:', shop.images);
    res.json({ shop: shopObject });
  } catch (error) {
    console.error('getShopById - error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getShopsByOwner = async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.params.id }).populate('owner', 'name email');
    res.json({ shops });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateShop = async (req, res) => {
  try {
    console.log('=== UPDATE SHOP START ===');
    console.log('Shop ID:', req.params.id);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const contentType = req.get('Content-Type');
    const isFormData = contentType && contentType.includes('multipart/form-data');
    
    let name, description, address, contact, categories, location, openingHours;
    
    if (isFormData) {
      // Handle FormData request (with potential file upload)
      ({ name, description, address, contact } = req.body);
      try {
        categories = req.body.categories ? JSON.parse(req.body.categories) : undefined;
        location = req.body.location ? JSON.parse(req.body.location) : undefined;
        openingHours = req.body.openingHours ? JSON.parse(req.body.openingHours) : undefined;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return res.status(400).json({ message: 'Invalid JSON in form data', error: parseError.message });
      }
    } else {
      // Handle JSON request (no file upload)
      ({ name, description, address, contact, categories, location, openingHours } = req.body);
    }
    
    console.log('Parsed data:', { name, description, address, categories, contact, location, openingHours });
    
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const shopOwnerId = shop.owner?.toString() || shop.ownerId?.toString();
    if (shopOwnerId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this shop' });
    }

    // Handle image upload if present
    let imageUrl = shop.imageUrl; // Keep existing image by default
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        console.log('Uploading new image to S3...');
        imageUrl = await uploadToS3(req.files.image[0]);
        console.log('New image uploaded to S3:', imageUrl);
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({ message: 'Image upload failed', error: uploadError.message });
      }
    }
    
    const updateData = { name, description, address, categories, contact, imageUrl };
    if (location && location.coordinates) {
      updateData.location = location;
    }
    if (openingHours) {
      updateData.openingHours = openingHours;
    }

    console.log('updateShop - updateData:', updateData);

    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('owner', 'name email');

    console.log('updateShop - success');

    res.json({
      message: 'Shop updated successfully',
      shop: updatedShop
    });
  } catch (error) {
    console.error('=== UPDATE SHOP ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Allow admin to delete any shop, or shop owner to delete their own shop
    const shopOwnerId = shop.owner?.toString() || shop.ownerId?.toString();
    const isAdmin = req.user.role === 'admin';
    const isOwner = shopOwnerId === req.user.userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this shop' });
    }

    await Shop.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const searchShopsByLocation = async (req, res) => {
  try {
    console.log('searchShopsByLocation called with query:', req.query);
    const { lat, lng, radius = 5000, category } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    let query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    };
    
    if (category) {
      query.categories = { $in: [new RegExp(category, 'i')] };
    }
    
    console.log('Location search query:', JSON.stringify(query, null, 2));
    const shops = await Shop.find(query).populate('owner', 'name email');
    console.log('Found shops by location:', shops.length);
    shops.forEach(shop => {
      console.log(`Shop: ${shop.name}, Coordinates: [${shop.location.coordinates}]`);
    });
    
    // Convert shops to objects and ensure openingHours is properly formatted
    const formattedShops = shops.map(shop => {
      const shopObject = shop.toObject();
      if (shopObject.openingHours && shopObject.openingHours instanceof Map) {
        shopObject.openingHours = Object.fromEntries(shopObject.openingHours);
      }
      return shopObject;
    });
    
    res.json({ shops: formattedShops, count: formattedShops.length });
  } catch (error) {
    console.error('searchShopsByLocation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const trackShopClick = async (req, res) => {
  try {
    const { shopId } = req.params;
    console.log('trackShopClick called for shopId:', shopId);
    
    const shop = await Shop.findById(shopId);
    if (!shop) {
      console.log('Shop not found for ID:', shopId);
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    const analyticsData = {
      shopId: shop._id,
      type: 'click',
      userId: req.user?.userId || null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    console.log('Creating analytics record:', analyticsData);
    
    const analytics = new Analytics(analyticsData);
    await analytics.save();
    console.log('Click analytics saved successfully');
    
    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('trackShopClick error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getShopStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = shop.openingHours.get(currentDay);
    
    let isOpen = false;
    let message = 'Hours not available';

    if (todayHours) {
      if (todayHours.isClosed) {
        message = 'Closed today';
      } else {
        const openTime = todayHours.open;
        const closeTime = todayHours.close;

        if (currentTime >= openTime && currentTime <= closeTime) {
          isOpen = true;
          message = `Open until ${closeTime}`;
        } else if (currentTime < openTime) {
          message = `Opens at ${openTime}`;
        } else {
          message = 'Closed - Opens tomorrow';
        }
      }
    }

    res.json({ isOpen, message, currentTime, currentDay });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createShop,
  getShops,
  getShopById,
  getShopsByOwner,
  updateShop,
  deleteShop,
  searchShopsByLocation,
  trackShopClick,
  getShopStatus
};