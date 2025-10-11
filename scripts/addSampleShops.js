const mongoose = require('mongoose');
const Shop = require('../models/shop');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppilot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleShops = [
  {
    name: "Tech World Electronics",
    description: "Latest electronics and gadgets for all your tech needs",
    address: "123 Tech Street, Lagos, Nigeria",
    categories: ["Electronics", "Technology"],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244] // Lagos coordinates
    },
    contact: "+234 123 456 7890",
    images: []
  },
  {
    name: "Fashion Hub",
    description: "Trendy clothes and accessories for men and women",
    address: "456 Fashion Avenue, Lagos, Nigeria", 
    categories: ["Fashion", "Clothing"],
    location: {
      type: "Point",
      coordinates: [3.3800, 6.5250]
    },
    contact: "+234 123 456 7891",
    images: []
  },
  {
    name: "Healthy Bites Restaurant",
    description: "Fresh and healthy meals prepared with organic ingredients",
    address: "789 Food Court, Lagos, Nigeria",
    categories: ["Food", "Restaurant"],
    location: {
      type: "Point",
      coordinates: [3.3785, 6.5235]
    },
    contact: "+234 123 456 7892",
    images: []
  },
  {
    name: "Beauty Palace",
    description: "Professional beauty services and cosmetic products",
    address: "321 Beauty Lane, Lagos, Nigeria",
    categories: ["Beauty", "Services"],
    location: {
      type: "Point",
      coordinates: [3.3810, 6.5260]
    },
    contact: "+234 123 456 7893",
    images: []
  },
  {
    name: "Auto Care Center",
    description: "Complete automotive services and car accessories",
    address: "654 Auto Street, Lagos, Nigeria",
    categories: ["Automotive", "Services"],
    location: {
      type: "Point",
      coordinates: [3.3775, 6.5225]
    },
    contact: "+234 123 456 7894",
    images: []
  }
];

async function addSampleShops() {
  try {
    // Find any user to be the owner (or create a default one)
    let owner = await User.findOne({ role: 'shop_owner' });
    
    if (!owner) {
      // Create a default shop owner
      owner = new User({
        name: 'Sample Shop Owner',
        email: 'shopowner@example.com',
        password: 'password123', // This should be hashed in real app
        role: 'shop_owner'
      });
      await owner.save();
      console.log('Created default shop owner');
    }

    // Clear existing shops
    await Shop.deleteMany({});
    console.log('Cleared existing shops');

    // Add sample shops
    for (const shopData of sampleShops) {
      const shop = new Shop({
        ...shopData,
        owner: owner._id,
        ownerId: owner._id,
        approved: true
      });
      await shop.save();
      console.log(`Added shop: ${shop.name}`);
    }

    console.log('Successfully added all sample shops!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample shops:', error);
    process.exit(1);
  }
}

addSampleShops();