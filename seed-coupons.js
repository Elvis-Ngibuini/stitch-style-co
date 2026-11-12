const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Coupon = require('./models/Coupon');

dotenv.config();

const connectDB = async () => {
  try {
    const localUri = 'mongodb://localhost:27017/stitch-style-co';
    const conn = await mongoose.connect(localUri);
    console.log(`✅ MongoDB Connected (local): ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const sampleCoupons = [
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: 100,
    usedCount: 0
  },
  {
    code: 'SAVE20',
    discountType: 'fixed',
    discountValue: 20,
    expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    usageLimit: 50,
    usedCount: 0
  },
  {
    code: 'VIP15',
    discountType: 'percentage',
    discountValue: 15,
    expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    usageLimit: 200,
    usedCount: 0
  },
  {
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 15,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: 500,
    usedCount: 0
  },
  {
    code: 'NEWYEAR25',
    discountType: 'percentage',
    discountValue: 25,
    expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    usageLimit: 100,
    usedCount: 0
  }
];

const seedCoupons = async () => {
  await connectDB();
  try {
    await Coupon.deleteMany({});
    const createdCoupons = await Coupon.create(sampleCoupons);
    console.log('✅ Coupons seeded successfully!');
    console.log(`Created ${createdCoupons.length} coupons:`);
    createdCoupons.forEach(c => {
      console.log(`  - ${c.code}: ${c.discountType === 'percentage' ? c.discountValue + '%' : '$' + c.discountValue} (${c.usageLimit} uses)`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedCoupons();