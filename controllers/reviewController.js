const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

const mockProducts = require('./productController').mockProducts || [];
const mockReviews = new Map();

const getMockProduct = (productId) => mockProducts.find(p => p._id === productId);

const getMockUser = (userId) => ({ _id: userId, name: 'Test User', email: 'test@example.com' });

const getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name');
    res.json(reviews);
  } catch (dbErr) {
    const key = `product:${req.params.productId}`;
    const reviews = mockReviews.get(key) || [];
    
    const populatedReviews = reviews.map(review => ({
      ...review,
      user: getMockUser(review.userId)
    }));
    
    res.json(populatedReviews);
  }
};

const createReview = async (req, res) => {
  const { product, rating, comment } = req.body;
  
  try {
    const review = await Review.create({
      user: req.user._id,
      product,
      rating,
      comment
    });
    await review.populate('user', 'name');
    res.status(201).json(review);
  } catch (dbErr) {
    const productData = getMockProduct(product);
    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const key = `product:${product}`;
    const reviews = mockReviews.get(key) || [];
    
    const newReview = {
      _id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user._id,
      product,
      rating,
      comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    reviews.push(newReview);
    mockReviews.set(key, reviews);
    
    const populatedReview = {
      ...newReview,
      user: getMockUser(req.user._id)
    };
    
    res.status(201).json(populatedReview);
  }
};

module.exports = {
  getReviewsByProduct,
  createReview
};