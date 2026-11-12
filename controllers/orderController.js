const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');

let stripe = null;

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } catch (e) {
      console.warn('Stripe initialization failed:', e.message);
    }
  }
  return stripe;
};

const createPaymentIntent = async (req, res) => {
  const { shippingAddress, couponCode, sessionId } = req.body;

  let cart;
  if (req.user) {
    cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId }).populate('items.product');
  }

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    totalAmount += item.priceAtTimeOfAdd * item.quantity;
    const product = item.product;
    const variant = product.variants.id(item.variant);
    orderItems.push({
      product: product._id,
      productSnapshot: {
        title: product.title,
        description: product.description,
        basePrice: product.basePrice,
        images: product.images
      },
      variant: { size: variant.size, color: variant.color, SKU: variant.SKU },
      quantity: item.quantity,
      priceAtTimeOfPurchase: item.priceAtTimeOfAdd
    });
  }

  let couponApplied = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon && new Date() < coupon.expirationDate && coupon.usedCount < coupon.usageLimit) {
      couponApplied = coupon._id;
      if (coupon.discountType === 'percentage') {
        totalAmount = totalAmount * (1 - coupon.discountValue / 100);
      } else {
        totalAmount = totalAmount - coupon.discountValue;
      }
    }
  }

  const order = await Order.create({
    user: req.user ? req.user._id : null,
    items: orderItems,
    totalAmount: Math.round(totalAmount * 100),
    shippingAddress,
    couponApplied
  });

  const stripeInstance = getStripe();
  if (!stripeInstance) {
    return res.status(503).json({ message: 'Payment service not configured' });
  }

  const paymentIntent = await stripeInstance.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: 'usd',
    metadata: { orderId: order._id.toString() }
  });

  order.paymentIntentId = paymentIntent.id;
  await order.save();

  res.json({
    clientSecret: paymentIntent.client_secret,
    orderId: order._id
  });
};

const handleStripeWebhook = async (req, res) => {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    return res.status(503).json({ message: 'Payment service not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = 'Paid';
      await order.save();

      for (const item of order.items) {
        const product = await Product.findById(item.product);
        const variantIndex = product.variants.findIndex(
          v => v.SKU === item.variant.SKU
        );
        if (variantIndex > -1) {
          product.variants[variantIndex].stockQuantity -= item.quantity;
          await product.save();
        }
      }

      if (order.couponApplied) {
        const coupon = await Coupon.findById(order.couponApplied);
        if (coupon) {
          coupon.usedCount += 1;
          await coupon.save();
        }
      }

      if (order.user) {
        await Cart.deleteOne({ user: order.user });
      }
    }
  }

  res.json({ received: true });
};

const getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json(orders);
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product').populate('user', 'name email');
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { fulfillmentStatus } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { fulfillmentStatus },
    { new: true }
  ).populate('items.product');

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const getDashboardStats = async (req, res) => {
  const totalSales = await Order.aggregate([
    { $match: { paymentStatus: 'Paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const totalOrders = await Order.countDocuments({ paymentStatus: 'Paid' });

  const lowStockProducts = await Product.aggregate([
    { $unwind: '$variants' },
    { $match: { 'variants.stockQuantity': { $lt: 10 } } },
    { $group: {
        _id: '$_id',
        title: { $first: '$title' },
        lowStockVariants: { $push: { size: '$variants.size', color: '$variants.color', stock: '$variants.stockQuantity' } }
      }
    }
  ]);

  res.json({
    totalSales: totalSales.length > 0 ? totalSales[0].total / 100 : 0,
    totalOrders,
    lowStockProducts
  });
};

module.exports = {
  createPaymentIntent,
  handleStripeWebhook,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats
};