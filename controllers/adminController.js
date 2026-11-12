const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');

const mockProducts = require('./productController').mockProducts || [];
const mockCategories = require('./categoryController').mockCategories || [];

const mockUsers = [
  { _id: 'user_1', name: 'Admin User', email: 'admin@stitchstyle.co', role: 'Admin', createdAt: new Date().toISOString() },
  { _id: 'user_2', name: 'John Doe', email: 'john@example.com', role: 'Customer', createdAt: new Date().toISOString() },
  { _id: 'user_3', name: 'Jane Smith', email: 'jane@example.com', role: 'Customer', createdAt: new Date().toISOString() },
];

const mockOrders = [
  { _id: 'order_1', user: 'user_2', totalAmount: 89500, paymentStatus: 'Paid', fulfillmentStatus: 'Delivered', createdAt: new Date().toISOString() },
  { _id: 'order_2', user: 'user_3', totalAmount: 64500, paymentStatus: 'Paid', fulfillmentStatus: 'Shipped', createdAt: new Date().toISOString() },
];

const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    const productsWithCategory = mockProducts.map(p => {
      const cat = mockCategories.find(c => c._id === p.category);
      return { ...p, category: cat ? { name: cat.name } : { name: 'Unknown' } };
    });
    res.status(200).json({ success: true, count: productsWithCategory.length, data: productsWithCategory });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    const newProduct = { _id: `mock_prod_${Date.now()}`, ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    mockProducts.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
  }
};

const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    const index = mockProducts.findIndex(p => p._id === req.params.id);
    if (index > -1) {
      mockProducts[index] = { ...mockProducts[index], ...req.body, updatedAt: new Date().toISOString() };
      res.status(200).json({ success: true, data: mockProducts[index] });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    const index = mockProducts.findIndex(p => p._id === req.params.id);
    if (index > -1) {
      mockProducts.splice(index, 1);
      res.status(200).json({ success: true, data: {} });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    const ordersWithUser = mockOrders.map(o => {
      const user = mockUsers.find(u => u._id === o.user);
      return { ...o, user: user ? { name: user.name, email: user.email } : { name: 'Unknown', email: 'unknown@test.com' } };
    });
    res.status(200).json({ success: true, count: ordersWithUser.length, data: ordersWithUser });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.fulfillmentStatus = req.body.fulfillmentStatus || req.body.status;
    if (req.body.fulfillmentStatus === 'Delivered' || req.body.status === 'delivered') {
      order.deliveredAt = Date.now();
    }
    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    const index = mockOrders.findIndex(o => o._id === req.params.id);
    if (index > -1) {
      mockOrders[index].fulfillmentStatus = req.body.fulfillmentStatus || req.body.status;
      if (req.body.fulfillmentStatus === 'Delivered' || req.body.status === 'delivered') {
        mockOrders[index].deliveredAt = new Date().toISOString();
      }
      res.status(200).json({ success: true, data: mockOrders[index] });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(200).json({ success: true, count: mockUsers.length, data: mockUsers });
  }
};

const updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const index = mockUsers.findIndex(u => u._id === req.params.id);
    if (index > -1) {
      mockUsers[index] = { ...mockUsers[index], ...req.body };
      res.status(200).json({ success: true, data: mockUsers[index] });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    const index = mockUsers.findIndex(u => u._id === req.params.id);
    if (index > -1) {
      mockUsers.splice(index, 1);
      res.status(200).json({ success: true, data: {} });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find().populate('user', 'name email').sort('-createdAt').limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total / 100 || 0,
        recentOrders
      }
    });
  } catch (error) {
    const lowStockProducts = mockProducts.flatMap(p => 
      p.variants.filter(v => v.stockQuantity < 10).map(v => ({
        _id: p._id, title: p.title, lowStockVariants: [{ size: v.size, color: v.color, stock: v.stockQuantity }]
      }))
    );
    
    res.status(200).json({
      success: true,
      data: {
        totalProducts: mockProducts.length,
        totalOrders: mockOrders.length,
        totalUsers: mockUsers.length,
        totalRevenue: mockOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / 100,
        recentOrders: mockOrders.slice(-5).map(o => {
          const user = mockUsers.find(u => u._id === o.user);
          return { ...o, user: user ? { name: user.name, email: user.email } : { name: 'Unknown', email: 'unknown@test.com' } };
        }),
        lowStockProducts
      }
    });
  }
};

module.exports = {
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
};