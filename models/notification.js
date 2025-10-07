const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['review', 'admin_message', 'shop_approved', 'shop_rejected'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
  },
  relatedReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);