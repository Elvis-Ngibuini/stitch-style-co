const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/auth');
const { categorySchema, validate } = require('../middleware/validation');

router.route('/')
  .get(getCategories)
  .post(protect, admin, validate(categorySchema), createCategory);

router.route('/:id')
  .put(protect, admin, validate(categorySchema), updateCategory)
  .delete(protect, admin, deleteCategory);

module.exports = router;