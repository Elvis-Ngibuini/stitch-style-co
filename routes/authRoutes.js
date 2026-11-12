const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, logoutAll, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerSchema, loginSchema, validate } = require('../middleware/validation');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.get('/me', protect, getMe);

module.exports = router;