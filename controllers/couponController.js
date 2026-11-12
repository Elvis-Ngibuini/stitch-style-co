const Coupon = require('../models/Coupon');

const mockCoupons = [
  { _id: 'coupon_1', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, expirationDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), usageLimit: 100, usedCount: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'coupon_2', code: 'SAVE20', discountType: 'fixed', discountValue: 20, expirationDate: new Date(Date.now() + 60*24*60*60*1000).toISOString(), usageLimit: 50, usedCount: 12, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'coupon_3', code: 'VIP15', discountType: 'percentage', discountValue: 15, expirationDate: new Date(Date.now() + 90*24*60*60*1000).toISOString(), usageLimit: 200, usedCount: 45, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let nextCouponId = mockCoupons.length + 1;

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (dbErr) {
    res.json(mockCoupons);
  }
};

const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (dbErr) {
    const newCoupon = {
      _id: `mock_coupon_${nextCouponId++}`,
      ...req.body,
      expirationDate: new Date(req.body.expirationDate).toISOString(),
      usedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockCoupons.push(newCoupon);
    res.status(201).json(newCoupon);
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (coupon) {
      res.json(coupon);
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (dbErr) {
    const index = mockCoupons.findIndex(c => c._id === req.params.id);
    if (index > -1) {
      mockCoupons[index] = { ...mockCoupons[index], ...req.body, updatedAt: new Date().toISOString() };
      if (req.body.expirationDate) mockCoupons[index].expirationDate = new Date(req.body.expirationDate).toISOString();
      res.json(mockCoupons[index]);
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon removed' });
  } catch (dbErr) {
    const index = mockCoupons.findIndex(c => c._id === req.params.id);
    if (index > -1) {
      mockCoupons.splice(index, 1);
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};