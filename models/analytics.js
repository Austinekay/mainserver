const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  visits: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
analyticsSchema.index({ shop: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);