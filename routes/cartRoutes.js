const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { cartSchema, updateCartSchema, validate } = require('../middleware/validation');

router.route('/')
  .get(protect, getCart)
  .post(protect, validate(cartSchema), addToCart)
  .put(protect, validate(updateCartSchema), updateCartItem);

router.route('/:itemId')
  .delete(protect, removeFromCart);

module.exports = router;