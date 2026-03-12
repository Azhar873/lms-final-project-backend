const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.put('/resetpassword', resetPassword);

module.exports = router;
