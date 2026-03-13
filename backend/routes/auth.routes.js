const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  sendOTP,
  verifyOTP
} = require('../controllers/auth.controller');

const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.use(authMiddleware);
router.get('/logout', logout);
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

module.exports = router; 