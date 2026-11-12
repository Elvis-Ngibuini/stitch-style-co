const Category = require('../models/Category');

const mockCategories = [
  { _id: '60d21b4667d0d8992e610c80', name: 'Men', slug: 'men', parentCategory: null },
  { _id: '60d21b4667d0d8992e610c81', name: 'Women', slug: 'women', parentCategory: null },
  { _id: '60d21b4667d0d8992e610c82', name: 'Kids', slug: 'kids', parentCategory: null },
  { _id: '60d21b4667d0d8992e610c83', name: 'Boys', slug: 'boys', parentCategory: '60d21b4667d0d8992e610c82' },
  { _id: '60d21b4667d0d8992e610c84', name: 'Girls', slug: 'girls', parentCategory: '60d21b4667d0d8992e610c82' },
];

let nextCategoryId = mockCategories.length + 1;

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory');
    res.json(categories);
  } catch (dbErr) {
    res.json(mockCategories);
  }
};

const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    const createdCategory = await category.save();
    await createdCategory.populate('parentCategory');
    res.status(201).json(createdCategory);
  } catch (dbErr) {
    const newCategory = {
      _id: `mock_cat_${nextCategoryId++}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockCategories.push(newCategory);
    res.status(201).json(newCategory);
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('parentCategory');
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (dbErr) {
    const index = mockCategories.findIndex(c => c._id === req.params.id);
    if (index > -1) {
      mockCategories[index] = { ...mockCategories[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(mockCategories[index]);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category removed' });
  } catch (dbErr) {
    const index = mockCategories.findIndex(c => c._id === req.params.id);
    if (index > -1) {
      mockCategories.splice(index, 1);
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};