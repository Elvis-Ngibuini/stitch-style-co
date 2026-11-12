const express = require('express');
const router = express.Router();
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');
const { couponSchema, validate } = require('../middleware/validation');

router.route('/')
  .get(protect, admin, getCoupons)
  .post(protect, admin, validate(couponSchema), createCoupon);

router.route('/:id')
  .put(protect, admin, validate(couponSchema), updateCoupon)
  .delete(protect, admin, deleteCoupon);

module.exports = router;