const Cart = require('../models/Cart');
const Product = require('../models/Product');

const mockProducts = require('./productController').mockProducts || [];

const mockCarts = new Map();

const getCartKey = (req) => {
  if (req.user) return `user:${req.user._id}`;
  if (req.query.sessionId) return `session:${req.query.sessionId}`;
  return null;
};

const getMockProduct = (productId) => mockProducts.find(p => p._id === productId);

const getMockVariant = (product, variantId) => product.variants.find(v => v._id === variantId);

const getCart = async (req, res) => {
  try {
    const filter = {};
    if (req.user) {
      filter.user = req.user._id;
    } else if (req.query.sessionId) {
      filter.sessionId = req.query.sessionId;
    } else {
      return res.json({ items: [] });
    }

    let cart = await Cart.findOne(filter).populate('items.product');
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (dbErr) {
    const key = getCartKey(req);
    const cart = mockCarts.get(key) || { _id: key, items: [], user: req.user?._id || null, sessionId: req.query.sessionId || null };
    
    const populatedItems = cart.items.map(item => {
      const product = getMockProduct(item.productId);
      const variant = product ? getMockVariant(product, item.variantId) : null;
      return {
        ...item,
        _id: item._id,
        product: product || { _id: item.productId, title: 'Unknown Product', basePrice: 0, images: [] },
        variant: variant || { _id: item.variantId, size: 'N/A', color: 'N/A', SKU: 'N/A', stockQuantity: 0 },
        priceAtTimeOfAdd: item.priceAtTimeOfAdd || (product?.basePrice || 0)
      };
    });
    
    res.json({ ...cart, items: populatedItems });
  }
};

const addToCart = async (req, res) => {
  const { productId, variantId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    const filter = {};
    if (req.user) {
      filter.user = req.user._id;
    } else if (req.query.sessionId) {
      filter.sessionId = req.query.sessionId;
    } else {
      return res.status(400).json({ message: 'Session or user required' });
    }

    let cart = await Cart.findOne(filter);

    if (!cart) {
      cart = new Cart({ ...filter, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variant.toString() === variantId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId, variant: variantId, quantity, priceAtTimeOfAdd: product.basePrice });
    }

    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (dbErr) {
    const product = getMockProduct(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variant = getMockVariant(product, variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    const key = getCartKey(req);
    if (!key) {
      return res.status(400).json({ message: 'Session or user required' });
    }

    let cart = mockCarts.get(key);
    if (!cart) {
      cart = { _id: key, user: req.user?._id || null, sessionId: req.query.sessionId || null, items: [] };
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId && item.variantId === variantId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        _id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId, variantId, quantity, priceAtTimeOfAdd: product.basePrice
      });
    }

    mockCarts.set(key, cart);
    
    const populatedItems = cart.items.map(item => {
      const p = getMockProduct(item.productId);
      const v = p ? getMockVariant(p, item.variantId) : null;
      return {
        ...item,
        product: p || { _id: item.productId, title: 'Unknown Product', basePrice: 0, images: [] },
        variant: v || { _id: item.variantId, size: 'N/A', color: 'N/A', SKU: 'N/A', stockQuantity: 0 }
      };
    });
    
    res.json({ ...cart, items: populatedItems });
  }
};

const updateCartItem = async (req, res) => {
  const { itemId, quantity } = req.body;
  const filter = {};
  if (req.user) {
    filter.user = req.user._id;
  } else if (req.query.sessionId) {
    filter.sessionId = req.query.sessionId;
  }

  try {
    let cart = await Cart.findOne(filter);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (dbErr) {
    const key = getCartKey(req);
    if (!key) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cart = mockCarts.get(key);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(i => i._id === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    item.quantity = quantity;
    mockCarts.set(key, cart);
    
    const populatedItems = cart.items.map(item => {
      const p = getMockProduct(item.productId);
      const v = p ? getMockVariant(p, item.variantId) : null;
      return {
        ...item,
        product: p || { _id: item.productId, title: 'Unknown Product', basePrice: 0, images: [] },
        variant: v || { _id: item.variantId, size: 'N/A', color: 'N/A', SKU: 'N/A', stockQuantity: 0 }
      };
    });
    
    res.json({ ...cart, items: populatedItems });
  }
};

const removeFromCart = async (req, res) => {
  const { itemId } = req.params;
  const filter = {};
  if (req.user) {
    filter.user = req.user._id;
  } else if (req.query.sessionId) {
    filter.sessionId = req.query.sessionId;
  }

  try {
    let cart = await Cart.findOne(filter);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (dbErr) {
    const key = getCartKey(req);
    if (!key) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cart = mockCarts.get(key);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id !== itemId);
    mockCarts.set(key, cart);
    
    const populatedItems = cart.items.map(item => {
      const p = getMockProduct(item.productId);
      const v = p ? getMockVariant(p, item.variantId) : null;
      return {
        ...item,
        product: p || { _id: item.productId, title: 'Unknown Product', basePrice: 0, images: [] },
        variant: v || { _id: item.variantId, size: 'N/A', color: 'N/A', SKU: 'N/A', stockQuantity: 0 }
      };
    });
    
    res.json({ ...cart, items: populatedItems });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};