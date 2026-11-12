const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    required: true,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

couponSchema.index({ expirationDate: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
