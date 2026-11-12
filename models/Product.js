const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a product title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a product description']
  },
  basePrice: {
    type: Number,
    required: [true, 'Please add a base price']
  },
  images: [{
    type: String,
    required: true
  }],
  variants: [{
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    SKU: {
      type: String,
      required: true,
      unique: true
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0
    }
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please add a category']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
