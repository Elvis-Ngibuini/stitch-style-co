const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

const connectDB = async () => {
  try {
    // Use local MongoDB for development
    const localUri = 'mongodb://localhost:27017/stitch-style-co';
    const conn = await mongoose.connect(localUri);
    console.log(`✅ MongoDB Connected (local): ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const sampleProducts = [
  {
    title: 'Cashmere Overcoat',
    description: 'Crafted from the finest 100% cashmere, this overcoat is designed for timeless elegance and supreme comfort. A perfect addition to any modern wardrobe.',
    basePrice: 895,
    images: [
      'https://images.unsplash.com/photo-1548169875-4369b5997bfa?w=800',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800'
    ],
    variants: [
      { size: 'XS', color: 'Black', SKU: 'SS26-OVC-BK-XS', stockQuantity: 8 },
      { size: 'S', color: 'Black', SKU: 'SS26-OVC-BK-S', stockQuantity: 12 },
      { size: 'M', color: 'Black', SKU: 'SS26-OVC-BK-M', stockQuantity: 15 },
      { size: 'L', color: 'Black', SKU: 'SS26-OVC-BK-L', stockQuantity: 10 },
      { size: 'XL', color: 'Black', SKU: 'SS26-OVC-BK-XL', stockQuantity: 6 },
      { size: 'XS', color: 'Navy', SKU: 'SS26-OVC-NV-XS', stockQuantity: 7 },
      { size: 'S', color: 'Navy', SKU: 'SS26-OVC-NV-S', stockQuantity: 11 },
      { size: 'M', color: 'Navy', SKU: 'SS26-OVC-NV-M', stockQuantity: 14 },
      { size: 'L', color: 'Navy', SKU: 'SS26-OVC-NV-L', stockQuantity: 9 },
      { size: 'XL', color: 'Navy', SKU: 'SS26-OVC-NV-XL', stockQuantity: 5 }
    ],
    category: null
  },
  {
    title: 'Wool Blend Blazer',
    description: 'A sophisticated wool blend blazer perfect for both formal and casual occasions.',
    basePrice: 645,
    images: [
      'https://images.unsplash.com/photo-1507608869274-d317839518316-3221e0047a2a?w=800',
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800'
    ],
    variants: [
      { size: 'S', color: 'Black', SKU: 'SS26-BLZ-BK-S', stockQuantity: 10 },
      { size: 'M', color: 'Black', SKU: 'SS26-BLZ-BK-M', stockQuantity: 12 },
      { size: 'L', color: 'Black', SKU: 'SS26-BLZ-BK-L', stockQuantity: 8 },
      { size: 'S', color: 'Navy', SKU: 'SS26-BLZ-NV-S', stockQuantity: 9 },
      { size: 'M', color: 'Navy', SKU: 'SS26-BLZ-NV-M', stockQuantity: 11 },
      { size: 'L', color: 'Navy', SKU: 'SS26-BLZ-NV-L', stockQuantity: 7 }
    ],
    category: null
  },
  {
    title: 'Silk Turtleneck',
    description: 'Luxurious silk turtleneck sweater, perfect for layering or wearing alone.',
    basePrice: 395,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      'https://images.unsplash.com/photo-1485178575877-1a13bf489dfe?w=800'
    ],
    variants: [
      { size: 'XS', color: 'Black', SKU: 'SS26-TNK-BK-XS', stockQuantity: 15 },
      { size: 'S', color: 'Black', SKU: 'SS26-TNK-BK-S', stockQuantity: 18 },
      { size: 'M', color: 'Black', SKU: 'SS26-TNK-BK-M', stockQuantity: 20 },
      { size: 'L', color: 'Black', SKU: 'SS26-TNK-BK-L', stockQuantity: 16 },
      { size: 'XS', color: 'Cream', SKU: 'SS26-TNK-CR-XS', stockQuantity: 12 },
      { size: 'S', color: 'Cream', SKU: 'SS26-TNK-CR-S', stockQuantity: 14 },
      { size: 'M', color: 'Cream', SKU: 'SS26-TNK-CR-M', stockQuantity: 17 }
    ],
    category: null
  },
  {
    title: 'Tailored Trousers',
    description: 'Perfectly tailored trousers for a sharp, professional look.',
    basePrice: 445,
    images: [
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea5f?w=800',
      'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=800'
    ],
    variants: [
      { size: '30', color: 'Black', SKU: 'SS26-TRS-BK-30', stockQuantity: 10 },
      { size: '32', color: 'Black', SKU: 'SS26-TRS-BK-32', stockQuantity: 14 },
      { size: '34', color: 'Black', SKU: 'SS26-TRS-BK-34', stockQuantity: 12 },
      { size: '36', color: 'Black', SKU: 'SS26-TRS-BK-36', stockQuantity: 8 },
      { size: '30', color: 'Navy', SKU: 'SS26-TRS-NV-30', stockQuantity: 9 },
      { size: '32', color: 'Navy', SKU: 'SS26-TRS-NV-32', stockQuantity: 11 },
      { size: '34', color: 'Navy', SKU: 'SS26-TRS-NV-34', stockQuantity: 10 },
      { size: '30', color: 'Gray', SKU: 'SS26-TRS-GY-30', stockQuantity: 8 },
      { size: '32', color: 'Gray', SKU: 'SS26-TRS-GY-32', stockQuantity: 10 }
    ],
    category: null
  },
  {
    title: 'Leather Jacket',
    description: 'Premium leather jacket with a timeless design.',
    basePrice: 995,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800'
    ],
    variants: [
      { size: 'S', color: 'Black', SKU: 'SS26-LTH-BK-S', stockQuantity: 8 },
      { size: 'M', color: 'Black', SKU: 'SS26-LTH-BK-M', stockQuantity: 10 },
      { size: 'L', color: 'Black', SKU: 'SS26-LTH-BK-L', stockQuantity: 7 },
      { size: 'XL', color: 'Black', SKU: 'SS26-LTH-BK-XL', stockQuantity: 5 },
      { size: 'S', color: 'Brown', SKU: 'SS26-LTH-BR-S', stockQuantity: 6 },
      { size: 'M', color: 'Brown', SKU: 'SS26-LTH-BR-M', stockQuantity: 9 },
      { size: 'L', color: 'Brown', SKU: 'SS26-LTH-BR-L', stockQuantity: 6 }
    ],
    category: null
  },
  {
    title: 'Cotton Shirt',
    description: 'Classic cotton shirt, perfect for any occasion.',
    basePrice: 195,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'
    ],
    variants: [
      { size: 'S', color: 'White', SKU: 'SS26-CSH-WH-S', stockQuantity: 20 },
      { size: 'M', color: 'White', SKU: 'SS26-CSH-WH-M', stockQuantity: 25 },
      { size: 'L', color: 'White', SKU: 'SS26-CSH-WH-L', stockQuantity: 22 },
      { size: 'S', color: 'Light Blue', SKU: 'SS26-CSH-LB-S', stockQuantity: 15 },
      { size: 'M', color: 'Light Blue', SKU: 'SS26-CSH-LB-M', stockQuantity: 18 },
      { size: 'L', color: 'Light Blue', SKU: 'SS26-CSH-LB-L', stockQuantity: 16 },
      { size: 'S', color: 'Navy', SKU: 'SS26-CSH-NV-S', stockQuantity: 12 },
      { size: 'M', color: 'Navy', SKU: 'SS26-CSH-NV-M', stockQuantity: 14 },
      { size: 'L', color: 'Navy', SKU: 'SS26-CSH-NV-L', stockQuantity: 11 }
    ],
    category: null
  },
  {
    title: 'Cashmere Sweater',
    description: 'Ultra-soft cashmere sweater for ultimate comfort.',
    basePrice: 545,
    images: [
      'https://images.unsplash.com/photo-1485968579169-7c3e2780c18c?w=800',
      'https://images.unsplash.com/photo-1520975693416-35a797d826a3?w=800'
    ],
    variants: [
      { size: 'XS', color: 'Cream', SKU: 'SS26-SWT-CR-XS', stockQuantity: 10 },
      { size: 'S', color: 'Cream', SKU: 'SS26-SWT-CR-S', stockQuantity: 12 },
      { size: 'M', color: 'Cream', SKU: 'SS26-SWT-CR-M', stockQuantity: 14 },
      { size: 'L', color: 'Cream', SKU: 'SS26-SWT-CR-L', stockQuantity: 11 },
      { size: 'XS', color: 'Gray', SKU: 'SS26-SWT-GY-XS', stockQuantity: 8 },
      { size: 'S', color: 'Gray', SKU: 'SS26-SWT-GY-S', stockQuantity: 10 },
      { size: 'M', color: 'Gray', SKU: 'SS26-SWT-GY-M', stockQuantity: 12 },
      { size: 'L', color: 'Gray', SKU: 'SS26-SWT-GY-L', stockQuantity: 9 },
      { size: 'XS', color: 'Burgundy', SKU: 'SS26-SWT-BU-XS', stockQuantity: 7 },
      { size: 'S', color: 'Burgundy', SKU: 'SS26-SWT-BU-S', stockQuantity: 9 },
      { size: 'M', color: 'Burgundy', SKU: 'SS26-SWT-BU-M', stockQuantity: 11 },
      { size: 'L', color: 'Burgundy', SKU: 'SS26-SWT-BU-L', stockQuantity: 8 }
    ],
    category: null
  },
  {
    title: 'Suede Boots',
    description: 'High-quality suede boots, perfect for the fall and winter seasons.',
    basePrice: 495,
    images: [
      'https://images.unsplash.com/photo-1533867617858-e2d80f5039a1?w=800',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800'
    ],
    variants: [
      { size: '8', color: 'Black', SKU: 'SS26-BTS-BK-8', stockQuantity: 6 },
      { size: '9', color: 'Black', SKU: 'SS26-BTS-BK-9', stockQuantity: 8 },
      { size: '10', color: 'Black', SKU: 'SS26-BTS-BK-10', stockQuantity: 10 },
      { size: '11', color: 'Black', SKU: 'SS26-BTS-BK-11', stockQuantity: 7 },
      { size: '12', color: 'Black', SKU: 'SS26-BTS-BK-12', stockQuantity: 5 },
      { size: '8', color: 'Brown', SKU: 'SS26-BTS-BR-8', stockQuantity: 5 },
      { size: '9', color: 'Brown', SKU: 'SS26-BTS-BR-9', stockQuantity: 7 },
      { size: '10', color: 'Brown', SKU: 'SS26-BTS-BR-10', stockQuantity: 8 },
      { size: '11', color: 'Brown', SKU: 'SS26-BTS-BR-11', stockQuantity: 6 },
      { size: '12', color: 'Brown', SKU: 'SS26-BTS-BR-12', stockQuantity: 4 }
    ],
    category: null
  }
];

const seedData = async () => {
  await connectDB();
  try {
    await Product.deleteMany({});
    await Category.deleteMany({});

    const categories = await Category.create([
      { name: 'Men', slug: 'men' },
      { name: 'Women', slug: 'women' },
      { name: 'Kids', slug: 'kids' }
    ]);

    const productsWithCategories = sampleProducts.map((product, index) => ({
      ...product,
      category: categories[index % categories.length]._id
    }));

    const createdProducts = await Product.create(productsWithCategories);
    console.log('✅ Sample data seeded successfully!');
    console.log(`Created ${createdProducts.length} products`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1)
  }
};

seedData();