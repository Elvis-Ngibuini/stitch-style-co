const express = require('express');
const {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers,
  updateUser,
  deleteUser,
  getDashboardStats
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/admin');
const { productSchema, validate } = require('../middleware/validation');

const router = express.Router();

router.use(protect);
router.use(protectAdmin);

// Product routes
router.route('/products')
  .get(getAdminProducts)
  .post(validate(productSchema), createProduct);

router.route('/products/:id')
  .put(validate(productSchema), updateProduct)
  .delete(deleteProduct);

// Order routes
router.route('/orders')
  .get(getAdminOrders);

router.route('/orders/:id/status')
  .put(updateOrderStatus);

// User routes
router.route('/users')
  .get(getAdminUsers);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

// Dashboard stats
router.route('/stats')
  .get(getDashboardStats);

module.exports = router;