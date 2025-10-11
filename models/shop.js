
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.ownerId;
    }
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90.'
      }
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
  images: [{
    type: String
  }],
  approved: {
    type: Boolean,
    default: false
  },
  contact: {
    type: String,
    trim: true
  },
  openingHours: {
    type: Map,
    of: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    required: true,
    default: {
      'monday': { open: '09:00', close: '17:00', isClosed: false },
      'tuesday': { open: '09:00', close: '17:00', isClosed: false },
      'wednesday': { open: '09:00', close: '17:00', isClosed: false },
      'thursday': { open: '09:00', close: '17:00', isClosed: false },
      'friday': { open: '09:00', close: '17:00', isClosed: false },
      'saturday': { open: '10:00', close: '16:00', isClosed: false },
      'sunday': { open: '10:00', close: '16:00', isClosed: false }
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