
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0] // Default coordinates for now
    }
  },
  address: {
    type: String,
    required: true
  },
  categories: [{
    type: String,
    required: true
  }],
  openingHours: {
    type: Map,
    of: {
      open: String,
      close: String
    },
    required: true,
    default: {
      'monday': { open: '09:00', close: '17:00' },
      'tuesday': { open: '09:00', close: '17:00' },
      'wednesday': { open: '09:00', close: '17:00' },
      'thursday': { open: '09:00', close: '17:00' },
      'friday': { open: '09:00', close: '17:00' },
      'saturday': { open: '10:00', close: '16:00' },
      'sunday': { open: '10:00', close: '16:00' }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index
shopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shop', shopSchema);
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');