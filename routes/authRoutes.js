const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.post('/send-otp', forgotPassword); // Alias
router.post('/verify-otp', verifyOTP);
router.put('/resetpassword', resetPassword);
router.post('/reset-password', resetPassword); // Alias for POST

module.exports = router;
