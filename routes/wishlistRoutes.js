const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');
const { wishlistSchema, validate } = require('../middleware/validation');

router.route('/')
  .get(protect, getWishlist)
  .post(protect, validate(wishlistSchema), addToWishlist);

router.route('/:productId')
  .delete(protect, removeFromWishlist);

module.exports = router;