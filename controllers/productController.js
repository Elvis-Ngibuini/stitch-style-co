const Product = require('../models/Product');

const mockProducts = [
  {
    _id: '60d21b4667d0d8992e610c85',
    title: 'Cashmere Overcoat',
    description: 'Crafted from the finest 100% cashmere, this overcoat is designed for timeless elegance and supreme comfort.',
    basePrice: 895,
    images: [
      'https://picsum.photos/id/1073/800',
      'https://picsum.photos/id/1062/800'
    ],
    variants: [
      { _id: 'var-1', size: 'XS', color: 'Black', SKU: 'SS26-OVC-BK-XS', stockQuantity: 8 },
      { _id: 'var-2', size: 'S', color: 'Black', SKU: 'SS26-OVC-BK-S', stockQuantity: 12 },
      { _id: 'var-3', size: 'M', color: 'Black', SKU: 'SS26-OVC-BK-M', stockQuantity: 15 },
      { _id: 'var-4', size: 'L', color: 'Black', SKU: 'SS26-OVC-BK-L', stockQuantity: 10 },
      { _id: 'var-5', size: 'XL', color: 'Black', SKU: 'SS26-OVC-BK-XL', stockQuantity: 6 },
      { _id: 'var-6', size: 'XS', color: 'Navy', SKU: 'SS26-OVC-NV-XS', stockQuantity: 7 },
      { _id: 'var-7', size: 'S', color: 'Navy', SKU: 'SS26-OVC-NV-S', stockQuantity: 11 },
      { _id: 'var-8', size: 'M', color: 'Navy', SKU: 'SS26-OVC-NV-M', stockQuantity: 14 },
      { _id: 'var-9', size: 'L', color: 'Navy', SKU: 'SS26-OVC-NV-L', stockQuantity: 9 },
      { _id: 'var-10', size: 'XL', color: 'Navy', SKU: 'SS26-OVC-NV-XL', stockQuantity: 5 }
    ],
    category: { _id: '60d21b4667d0d8992e610c80', name: 'Men', slug: 'men' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c86',
    title: 'Wool Blend Blazer',
    description: 'A sophisticated wool blend blazer perfect for both formal and casual occasions.',
    basePrice: 645,
    images: [
      'https://picsum.photos/id/1059/800',
      'https://picsum.photos/id/1011/800'
    ],
    variants: [
      { _id: 'var-11', size: 'S', color: 'Black', SKU: 'SS26-BLZ-BK-S', stockQuantity: 10 },
      { _id: 'var-12', size: 'M', color: 'Black', SKU: 'SS26-BLZ-BK-M', stockQuantity: 12 },
      { _id: 'var-13', size: 'L', color: 'Black', SKU: 'SS26-BLZ-BK-L', stockQuantity: 8 },
      { _id: 'var-14', size: 'S', color: 'Navy', SKU: 'SS26-BLZ-NV-S', stockQuantity: 9 },
      { _id: 'var-15', size: 'M', color: 'Navy', SKU: 'SS26-BLZ-NV-M', stockQuantity: 11 },
      { _id: 'var-16', size: 'L', color: 'Navy', SKU: 'SS26-BLZ-NV-L', stockQuantity: 7 }
    ],
    category: { _id: '60d21b4667d0d8992e610c80', name: 'Men', slug: 'men' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c87',
    title: 'Silk Turtleneck',
    description: 'Luxurious silk turtleneck sweater, perfect for layering or wearing alone.',
    basePrice: 395,
    images: [
      'https://picsum.photos/id/1071/800',
      'https://picsum.photos/id/1047/800'
    ],
    variants: [
      { _id: 'var-17', size: 'XS', color: 'Black', SKU: 'SS26-TNK-BK-XS', stockQuantity: 15 },
      { _id: 'var-18', size: 'S', color: 'Black', SKU: 'SS26-TNK-BK-S', stockQuantity: 18 },
      { _id: 'var-19', size: 'M', color: 'Black', SKU: 'SS26-TNK-BK-M', stockQuantity: 20 },
      { _id: 'var-20', size: 'L', color: 'Black', SKU: 'SS26-TNK-BK-L', stockQuantity: 16 },
      { _id: 'var-21', size: 'XS', color: 'Cream', SKU: 'SS26-TNK-CR-XS', stockQuantity: 12 },
      { _id: 'var-22', size: 'S', color: 'Cream', SKU: 'SS26-TNK-CR-S', stockQuantity: 14 },
      { _id: 'var-23', size: 'M', color: 'Cream', SKU: 'SS26-TNK-CR-M', stockQuantity: 17 }
    ],
    category: { _id: '60d21b4667d0d8992e610c81', name: 'Women', slug: 'women' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c88',
    title: 'Tailored Trousers',
    description: 'Perfectly tailored trousers for a sharp, professional look.',
    basePrice: 445,
    images: [
      'https://picsum.photos/id/1005/800',
      'https://picsum.photos/id/1006/800'
    ],
    variants: [
      { _id: 'var-24', size: '30', color: 'Black', SKU: 'SS26-TRS-BK-30', stockQuantity: 10 },
      { _id: 'var-25', size: '32', color: 'Black', SKU: 'SS26-TRS-BK-32', stockQuantity: 14 },
      { _id: 'var-26', size: '34', color: 'Black', SKU: 'SS26-TRS-BK-34', stockQuantity: 12 },
      { _id: 'var-27', size: '36', color: 'Black', SKU: 'SS26-TRS-BK-36', stockQuantity: 8 },
      { _id: 'var-28', size: '30', color: 'Navy', SKU: 'SS26-TRS-NV-30', stockQuantity: 9 },
      { _id: 'var-29', size: '32', color: 'Navy', SKU: 'SS26-TRS-NV-32', stockQuantity: 11 },
      { _id: 'var-30', size: '34', color: 'Navy', SKU: 'SS26-TRS-NV-34', stockQuantity: 10 },
      { _id: 'var-31', size: '30', color: 'Gray', SKU: 'SS26-TRS-GY-30', stockQuantity: 8 },
      { _id: 'var-32', size: '32', color: 'Gray', SKU: 'SS26-TRS-GY-32', stockQuantity: 10 }
    ],
    category: { _id: '60d21b4667d0d8992e610c80', name: 'Men', slug: 'men' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c89',
    title: 'Leather Jacket',
    description: 'Premium leather jacket with a timeless design.',
    basePrice: 995,
    images: [
      'https://picsum.photos/id/1082/800',
      'https://picsum.photos/id/1027/800'
    ],
    variants: [
      { _id: 'var-33', size: 'S', color: 'Black', SKU: 'SS26-LTH-BK-S', stockQuantity: 8 },
      { _id: 'var-34', size: 'M', color: 'Black', SKU: 'SS26-LTH-BK-M', stockQuantity: 10 },
      { _id: 'var-35', size: 'L', color: 'Black', SKU: 'SS26-LTH-BK-L', stockQuantity: 7 },
      { _id: 'var-36', size: 'XL', color: 'Black', SKU: 'SS26-LTH-BK-XL', stockQuantity: 5 },
      { _id: 'var-37', size: 'S', color: 'Brown', SKU: 'SS26-LTH-BR-S', stockQuantity: 6 },
      { _id: 'var-38', size: 'M', color: 'Brown', SKU: 'SS26-LTH-BR-M', stockQuantity: 9 },
      { _id: 'var-39', size: 'L', color: 'Brown', SKU: 'SS26-LTH-BR-L', stockQuantity: 6 }
    ],
    category: { _id: '60d21b4667d0d8992e610c80', name: 'Men', slug: 'men' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c8a',
    title: 'Cotton Shirt',
    description: 'Classic cotton shirt, perfect for any occasion.',
    basePrice: 195,
    images: [
      'https://picsum.photos/id/1060/800',
      'https://picsum.photos/id/1058/800'
    ],
    variants: [
      { _id: 'var-40', size: 'S', color: 'White', SKU: 'SS26-CSH-WH-S', stockQuantity: 20 },
      { _id: 'var-41', size: 'M', color: 'White', SKU: 'SS26-CSH-WH-M', stockQuantity: 25 },
      { _id: 'var-42', size: 'L', color: 'White', SKU: 'SS26-CSH-WH-L', stockQuantity: 22 },
      { _id: 'var-43', size: 'S', color: 'Light Blue', SKU: 'SS26-CSH-LB-S', stockQuantity: 15 },
      { _id: 'var-44', size: 'M', color: 'Light Blue', SKU: 'SS26-CSH-LB-M', stockQuantity: 18 },
      { _id: 'var-45', size: 'L', color: 'Light Blue', SKU: 'SS26-CSH-LB-L', stockQuantity: 16 },
      { _id: 'var-46', size: 'S', color: 'Navy', SKU: 'SS26-CSH-NV-S', stockQuantity: 12 },
      { _id: 'var-47', size: 'M', color: 'Navy', SKU: 'SS26-CSH-NV-M', stockQuantity: 14 },
      { _id: 'var-48', size: 'L', color: 'Navy', SKU: 'SS26-CSH-NV-L', stockQuantity: 11 }
    ],
    category: { _id: '60d21b4667d0d8992e610c80', name: 'Men', slug: 'men' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c8b',
    title: 'Boys Denim Jacket',
    description: 'Classic denim jacket for boys, made with durable cotton denim.',
    basePrice: 125,
    images: [
      'https://picsum.photos/id/1005/800',
      'https://picsum.photos/id/1011/800'
    ],
    variants: [
      { _id: 'var-49', size: 'XS', color: 'Blue', SKU: 'SS26-BDJ-BL-XS', stockQuantity: 10 },
      { _id: 'var-50', size: 'S', color: 'Blue', SKU: 'SS26-BDJ-BL-S', stockQuantity: 12 },
      { _id: 'var-51', size: 'M', color: 'Blue', SKU: 'SS26-BDJ-BL-M', stockQuantity: 15 },
      { _id: 'var-52', size: 'L', color: 'Blue', SKU: 'SS26-BDJ-BL-L', stockQuantity: 8 },
      { _id: 'var-53', size: 'XL', color: 'Blue', SKU: 'SS26-BDJ-BL-XL', stockQuantity: 6 }
    ],
    category: { _id: '60d21b4667d0d8992e610c82', name: 'Kids', slug: 'kids' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c8c',
    title: 'Boys Graphic T-Shirt',
    description: 'Comfortable cotton t-shirt with cool graphic print.',
    basePrice: 45,
    images: [
      'https://picsum.photos/id/1060/800',
      'https://picsum.photos/id/1035/800'
    ],
    variants: [
      { _id: 'var-54', size: 'XS', color: 'Navy', SKU: 'SS26-BTS-NV-XS', stockQuantity: 15 },
      { _id: 'var-55', size: 'S', color: 'Navy', SKU: 'SS26-BTS-NV-S', stockQuantity: 18 },
      { _id: 'var-56', size: 'M', color: 'Navy', SKU: 'SS26-BTS-NV-M', stockQuantity: 20 },
      { _id: 'var-57', size: 'L', color: 'Navy', SKU: 'SS26-BTS-NV-L', stockQuantity: 12 },
      { _id: 'var-58', size: 'XL', color: 'Navy', SKU: 'SS26-BTS-NV-XL', stockQuantity: 10 },
      { _id: 'var-59', size: 'XS', color: 'Gray', SKU: 'SS26-BTS-GY-XS', stockQuantity: 12 },
      { _id: 'var-60', size: 'S', color: 'Gray', SKU: 'SS26-BTS-GY-S', stockQuantity: 14 },
      { _id: 'var-61', size: 'M', color: 'Gray', SKU: 'SS26-BTS-GY-M', stockQuantity: 16 },
      { _id: 'var-62', size: 'L', color: 'Gray', SKU: 'SS26-BTS-GY-L', stockQuantity: 10 },
      { _id: 'var-63', size: 'XL', color: 'Gray', SKU: 'SS26-BTS-GY-XL', stockQuantity: 8 }
    ],
    category: { _id: '60d21b4667d0d8992e610c82', name: 'Kids', slug: 'kids' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c8d',
    title: 'Boys Chino Pants',
    description: 'Smart chino pants for boys, perfect for school or special occasions.',
    basePrice: 75,
    images: [
      'https://picsum.photos/id/1005/800',
      'https://picsum.photos/id/1011/800'
    ],
    variants: [
      { _id: 'var-64', size: 'XS', color: 'Khaki', SKU: 'SS26-BCP-KH-XS', stockQuantity: 8 },
      { _id: 'var-65', size: 'S', color: 'Khaki', SKU: 'SS26-BCP-KH-S', stockQuantity: 10 },
      { _id: 'var-66', size: 'M', color: 'Khaki', SKU: 'SS26-BCP-KH-M', stockQuantity: 12 },
      { _id: 'var-67', size: 'L', color: 'Khaki', SKU: 'SS26-BCP-KH-L', stockQuantity: 6 },
      { _id: 'var-68', size: 'XL', color: 'Khaki', SKU: 'SS26-BCP-KH-XL', stockQuantity: 5 },
      { _id: 'var-69', size: 'XS', color: 'Navy', SKU: 'SS26-BCP-NV-XS', stockQuantity: 7 },
      { _id: 'var-70', size: 'S', color: 'Navy', SKU: 'SS26-BCP-NV-S', stockQuantity: 9 },
      { _id: 'var-71', size: 'M', color: 'Navy', SKU: 'SS26-BCP-NV-M', stockQuantity: 11 },
      { _id: 'var-72', size: 'L', color: 'Navy', SKU: 'SS26-BCP-NV-L', stockQuantity: 5 },
      { _id: 'var-73', size: 'XL', color: 'Navy', SKU: 'SS26-BCP-NV-XL', stockQuantity: 4 }
    ],
    category: { _id: '60d21b4667d0d8992e610c82', name: 'Kids', slug: 'kids' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c8e',
    title: 'Boys Hoodie',
    description: 'Cozy fleece hoodie for boys, great for everyday wear.',
    basePrice: 85,
    images: [
      'https://picsum.photos/id/1035/800',
      'https://picsum.photos/id/1082/800'
    ],
    variants: [
      { _id: 'var-74', size: 'XS', color: 'Black', SKU: 'SS26-BHD-BK-XS', stockQuantity: 12 },
      { _id: 'var-75', size: 'S', color: 'Black', SKU: 'SS26-BHD-BK-S', stockQuantity: 15 },
      { _id: 'var-76', size: 'M', color: 'Black', SKU: 'SS26-BHD-BK-M', stockQuantity: 18 },
      { _id: 'var-77', size: 'L', color: 'Black', SKU: 'SS26-BHD-BK-L', stockQuantity: 10 },
      { _id: 'var-78', size: 'XL', color: 'Black', SKU: 'SS26-BHD-BK-XL', stockQuantity: 8 },
      { _id: 'var-79', size: 'XS', color: 'Burgundy', SKU: 'SS26-BHD-BG-XS', stockQuantity: 9 },
      { _id: 'var-80', size: 'S', color: 'Burgundy', SKU: 'SS26-BHD-BG-S', stockQuantity: 12 },
      { _id: 'var-81', size: 'M', color: 'Burgundy', SKU: 'SS26-BHD-BG-M', stockQuantity: 14 },
      { _id: 'var-82', size: 'L', color: 'Burgundy', SKU: 'SS26-BHD-BG-L', stockQuantity: 7 },
      { _id: 'var-83', size: 'XL', color: 'Burgundy', SKU: 'SS26-BHD-BG-XL', stockQuantity: 6 }
    ],
    category: { _id: '60d21b4667d0d8992e610c82', name: 'Kids', slug: 'kids' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c8f',
    title: 'Girls Floral Dress',
    description: 'Beautiful floral dress for girls, perfect for special occasions.',
    basePrice: 95,
    images: [
      'https://picsum.photos/id/1062/800',
      'https://picsum.photos/id/1080/800'
    ],
    variants: [
      { _id: 'var-84', size: 'XS', color: 'Pink', SKU: 'SS26-GFD-PK-XS', stockQuantity: 10 },
      { _id: 'var-85', size: 'S', color: 'Pink', SKU: 'SS26-GFD-PK-S', stockQuantity: 12 },
      { _id: 'var-86', size: 'M', color: 'Pink', SKU: 'SS26-GFD-PK-M', stockQuantity: 14 },
      { _id: 'var-87', size: 'L', color: 'Pink', SKU: 'SS26-GFD-PK-L', stockQuantity: 8 },
      { _id: 'var-88', size: 'XL', color: 'Pink', SKU: 'SS26-GFD-PK-XL', stockQuantity: 6 },
      { _id: 'var-89', size: 'XS', color: 'Cream', SKU: 'SS26-GFD-CR-XS', stockQuantity: 8 },
      { _id: 'var-90', size: 'S', color: 'Cream', SKU: 'SS26-GFD-CR-S', stockQuantity: 10 },
      { _id: 'var-91', size: 'M', color: 'Cream', SKU: 'SS26-GFD-CR-M', stockQuantity: 12 },
      { _id: 'var-92', size: 'L', color: 'Cream', SKU: 'SS26-GFD-CR-L', stockQuantity: 6 },
      { _id: 'var-93', size: 'XL', color: 'Cream', SKU: 'SS26-GFD-CR-XL', stockQuantity: 5 }
    ],
    category: { _id: '60d21b4667d0d8992e610c83', name: 'Kids', slug: 'kids' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '60d21b4667d0d8992e610c90',
    title: 'Girls Ballet Flats',
    description: 'Comfortable and stylish ballet flats for girls.',
    basePrice: 65,
    images: [
      'https://picsum.photos/id/1005/800',
      'https://picsum.photos/id/1011/800'
    ],
    variants: [
      { _id: 'var-94', size: 'XS', color: 'Black', SKU: 'SS26-GBF-BK-XS', stockQuantity: 15 },
      { _id: 'var-95', size: 'S', color: 'Black', SKU: 'SS26-GBF-BK-S', stockQuantity: 18 },
      { _id: 'var-96', size: 'M', color: 'Black', SKU: 'SS26-GBF-BK-M', stockQuantity: 20 },
      { _id: 'var-97', size: 'L', color: 'Black', SKU: 'SS26-GBF-BK-L', stockQuantity: 12 },
      { _id: 'var-98', size: 'XL', color: 'Black', SKU: 'SS26-GBF-BK-XL', stockQuantity: 10 },
      { _id: 'var-99', size: 'XS', color: 'Pink', SKU: 'SS26-GBF-PK-XS', stockQuantity: 12 },
      { _id: 'var-100', size: 'S', color: 'Pink', SKU: 'SS26-GBF-PK-S', stockQuantity: 14 },
      { _id: 'var-101', size: 'M', color: 'Pink', SKU: 'SS26-GBF-PK-M', stockQuantity: 16 },
      { _id: 'var-102', size: 'L', color: 'Pink', SKU: 'SS26-GBF-PK-L', stockQuantity: 10 },
      { _id: 'var-103', size: 'XL', color: 'Pink', SKU: 'SS26-GBF-PK-XL', stockQuantity: 8 }
    ],
    category: { _id: '60d21b4667d0d8992e610c83', name: 'Kids', slug: 'kids' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getProducts = async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.page) || 1;

  try {
    let products = [];
    let total = 0;

    try {
      const filter = {};
      if (req.query.category) {
        filter.$or = [
          { title: { $regex: req.query.category, $options: 'i' } },
          { description: { $regex: req.query.category, $options: 'i' } }
        ];
      }

      if (req.query.size) {
        const sizes = req.query.size.split(',');
        filter['variants.size'] = { $in: sizes };
      }

      if (req.query.color) {
        const colors = req.query.color.split(',');
        filter['variants.color'] = { $in: colors };
      }

      if (req.query.minPrice || req.query.maxPrice) {
        filter.basePrice = {};
        if (req.query.minPrice) filter.basePrice.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filter.basePrice.$lte = Number(req.query.maxPrice);
      }

      let sort = { createdAt: -1 };
      if (req.query.sort) {
        if (req.query.sort === 'price-asc') sort = { basePrice: 1 };
        else if (req.query.sort === 'price-desc') sort = { basePrice: -1 };
        else if (req.query.sort === 'name-asc') sort = { title: 1 };
        else if (req.query.sort === 'name-desc') sort = { title: -1 };
      }

      total = await Product.countDocuments(filter);
      products = await Product.find(filter)
        .sort(sort)
        .populate('category')
        .limit(pageSize)
        .skip(pageSize * (page - 1));
    } catch (dbErr) {
      console.log('Using mock product data');
      let filtered = [...mockProducts];

      if (req.query.category) {
        const catLower = req.query.category.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(catLower) ||
          p.description.toLowerCase().includes(catLower) ||
          (p.category && p.category.name && p.category.name.toLowerCase().includes(catLower)) ||
          (p.category && p.category.slug && p.category.slug.toLowerCase().includes(catLower))
        );
      }

      if (req.query.size) {
        const sizes = req.query.size.split(',');
        filtered = filtered.filter(p =>
          p.variants.some(v => sizes.includes(v.size))
        );
      }

      if (req.query.color) {
        const colors = req.query.color.split(',');
        filtered = filtered.filter(p =>
          p.variants.some(v => colors.includes(v.color))
        );
      }

      if (req.query.minPrice) {
        filtered = filtered.filter(p => p.basePrice >= Number(req.query.minPrice));
      }

      if (req.query.maxPrice) {
        filtered = filtered.filter(p => p.basePrice <= Number(req.query.maxPrice));
      }

      if (req.query.sort) {
        if (req.query.sort === 'price-asc') filtered.sort((a, b) => a.basePrice - b.basePrice);
        else if (req.query.sort === 'price-desc') filtered.sort((a, b) => b.basePrice - a.basePrice);
        else if (req.query.sort === 'name-asc') filtered.sort((a, b) => a.title.localeCompare(b.title));
        else if (req.query.sort === 'name-desc') filtered.sort((a, b) => b.title.localeCompare(a.title));
      }

      total = filtered.length;
      const start = (page - 1) * pageSize;
      products = filtered.slice(start, start + pageSize);
    }

    res.json({
      products,
      page,
      pages: Math.ceil(total / pageSize),
      total,
      pageSize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    try {
      const product = await Product.findById(req.params.id).populate('category');
      if (product) return res.json(product);
    } catch (dbErr) { /* MongoDB failed */ }

    const product = mockProducts.find(p => p._id === req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(404).json({ message: 'Product not found' });
  }
};

const createProduct = async (req, res) => {
  const product = new Product(req.body);
  const createdProduct = await product.save();
  await createdProduct.populate('category');
  res.status(201).json(createdProduct);
};

const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('category');

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (product) {
    res.json({ message: 'Product removed' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  mockProducts
};