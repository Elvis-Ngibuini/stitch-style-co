const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1)
});

const productSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(5000).trim(),
  basePrice: z.number().positive().max(100000),
  images: z.array(z.string().url()).min(1).max(10),
  variants: z.array(z.object({
    size: z.string().min(1).max(20),
    color: z.string().min(1).max(50),
    SKU: z.string().min(1).max(50).toUpperCase(),
    stockQuantity: z.number().int().min(0).max(10000)
  })).min(1).max(50),
  category: z.string().min(1)
});

const categorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z.string().min(1).max(100).toLowerCase().regex(/^[a-z0-9-]+$/),
  parentCategory: z.string().optional()
});

const cartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99)
});

const updateCartSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(99)
});

const couponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  expirationDate: z.string().datetime(),
  usageLimit: z.number().int().min(1).max(10000).default(1)
});

const reviewSchema = z.object({
  product: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000).trim()
});

const wishlistSchema = z.object({
  productId: z.string().min(1)
});

const orderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    zipCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100)
  }),
  couponCode: z.string().max(50).optional(),
  sessionId: z.string().optional()
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Validation error', errors: error.errors });
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  categorySchema,
  cartSchema,
  updateCartSchema,
  couponSchema,
  reviewSchema,
  wishlistSchema,
  orderSchema,
  validate
};