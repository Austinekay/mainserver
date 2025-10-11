const Shop = require('../models/shop');
const User = require('../models/user');
const NodeGeocoder = require('node-geocoder');


const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

const createShop = async (req, res) => {
  try {
    const { name, description, address, categories, location, openingHours, ownerId, images, contact } = req.body;
    
    console.log('createShop - received data:', { name, description, address, categories, images: images?.length || 0, contact });
    console.log('createShop - images array:', images);
    
    // Validate required fields
    if (!name || !description || !address) {
      return res.status(400).json({ message: 'Name, description, and address are required' });
    }
    
    // Validate location coordinates
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid location coordinates are required' });
    }
    
    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'Invalid coordinates provided' });
    }
    
    const shop = new Shop({
      owner: ownerId || req.user.userId,
      ownerId: ownerId || req.user.userId,
      name,
      description,
      address,
      contact,
      categories: categories || ['General'],
      images: images || [],
      location,
      openingHours: openingHours || undefined
    });

    await shop.save();
    await shop.populate('owner', 'name email');



    res.status(201).json({
      message: 'Shop created successfully',
      shop
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.json({ shops });
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
    console.log('getShopById - found shop:', shop.name);
    console.log('getShopById - shop images:', shop.images);
    res.json({ shop });
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
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const shopOwnerId = shop.owner?.toString() || shop.ownerId?.toString();
    if (shopOwnerId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this shop' });
    }

    const { name, description, address, categories, coordinates, openingHours, images, contact } = req.body;
    
    const updateData = { name, description, address, categories, openingHours, images, contact };
    if (coordinates) {
      updateData.location = { type: 'Point', coordinates };
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('owner', 'name email');

    res.json({
      message: 'Shop updated successfully',
      shop: updatedShop
    });
  } catch (error) {
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
    res.json({ shops, count: shops.length });
  } catch (error) {
    console.error('searchShopsByLocation error:', error);
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
  searchShopsByLocation
};