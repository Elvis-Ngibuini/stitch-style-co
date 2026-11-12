const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  handleStripeWebhook,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');
const { orderSchema, validate } = require('../middleware/validation');

router.post('/create-payment-intent', protect, validate(orderSchema), createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.get('/', protect, getOrders);
router.get('/dashboard/stats', protect, admin, getDashboardStats);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;