const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const mockProducts = require('./productController').mockProducts || [];
const mockWishlists = new Map();

const getMockProduct = (productId) => mockProducts.find(p => p._id === productId);

const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }
    res.json(wishlist);
  } catch (dbErr) {
    const key = `user:${req.user._id}`;
    let wishlist = mockWishlists.get(key);
    if (!wishlist) {
      wishlist = { _id: key, user: req.user._id, products: [] };
      mockWishlists.set(key, wishlist);
    }
    
    const populatedProducts = wishlist.products.map(pid => {
      const product = getMockProduct(pid);
      return product || { _id: pid, title: 'Unknown Product', basePrice: 0, images: [] };
    });
    
    res.json({ ...wishlist, products: populatedProducts });
  }
};

const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
    } else {
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
      }
    }
    await wishlist.populate('products');
    res.json(wishlist);
  } catch (dbErr) {
    const product = getMockProduct(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const key = `user:${req.user._id}`;
    let wishlist = mockWishlists.get(key);
    if (!wishlist) {
      wishlist = { _id: key, user: req.user._id, products: [] };
    }
    
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }
    mockWishlists.set(key, wishlist);
    
    const populatedProducts = wishlist.products.map(pid => {
      const p = getMockProduct(pid);
      return p || { _id: pid, title: 'Unknown Product', basePrice: 0, images: [] };
    });
    
    res.json({ ...wishlist, products: populatedProducts });
  }
};

const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
      await wishlist.populate('products');
    }
    res.json(wishlist);
  } catch (dbErr) {
    const key = `user:${req.user._id}`;
    const wishlist = mockWishlists.get(key);
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id !== productId);
      mockWishlists.set(key, wishlist);
    }
    
    const populatedProducts = wishlist?.products.map(pid => {
      const p = getMockProduct(pid);
      return p || { _id: pid, title: 'Unknown Product', basePrice: 0, images: [] };
    }) || [];
    
    res.json({ ...wishlist, products: populatedProducts });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};