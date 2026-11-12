const express = require('express');
const router = express.Router();
const {
  getReviewsByProduct,
  createReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { reviewSchema, validate } = require('../middleware/validation');

router.route('/product/:productId')
  .get(getReviewsByProduct);

router.route('/')
  .post(protect, validate(reviewSchema), createReview);

module.exports = router;