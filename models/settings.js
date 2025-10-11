const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ['security', 'shop_management', 'system'],
    default: 'system',
  },
}, {
  timestamps: true,
});



module.exports = mongoose.model('Settings', settingsSchema);