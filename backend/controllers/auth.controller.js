const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user.model');
const { ErrorResponse, asyncHandler } = require('../middleware/error.middleware');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'borrower', // Default to borrower if not specified
  });

  // Create and send token response
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, phone, password } = req.body;

  // Validate email/phone and password
  if ((!email && !phone) || !password) {
    return next(new ErrorResponse('Please provide email/phone and password', 400));
  }

  // Find user by email or phone
  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Create and send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Send OTP for phone verification
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new ErrorResponse('Phone number is required', 400));
  }

  // Generate OTP (6 digit number)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // In a production environment, this would send an actual SMS
  // For now, we'll just store the OTP in the user's document
  
  // Find user or create if not exists
  let user = await User.findOne({ phone });
  
  if (!user) {
    // Create a temporary user with just the phone number
    user = await User.create({
      phone,
      name: 'Temporary User',
      email: `temp_${phone}@example.com`,
      password: crypto.randomBytes(10).toString('hex'), // Random password
    });
  }
  
  // Store OTP in the database (would use Redis in production)
  // Here using a dummy field. In production, this would be properly hashed
  user.resetPasswordToken = bcrypt.hashSync(otp, 10);
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });
  
  // Send response
  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      phone,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    },
  });
});

// @desc    Verify OTP and login/register
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { phone, otp, name, email } = req.body;

  if (!phone || !otp) {
    return next(new ErrorResponse('Phone and OTP are required', 400));
  }

  // Find user by phone
  const user = await User.findOne({ 
    phone,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid OTP or OTP expired', 401));
  }

  // Verify OTP (in production would be comparing hashes)
  const isValid = await bcrypt.compare(otp, user.resetPasswordToken);

  if (!isValid) {
    return next(new ErrorResponse('Invalid OTP', 401));
  }

  // Clear the OTP fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // If email and name provided, update user record
  if (name && email) {
    user.name = name;
    user.email = email;
    user.verificationStatus = 'verified';
  }

  await user.save();

  // Create and send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // In a cookie-based auth system, we would clear the cookie here
  
  res.status(200).json({
    success: true,
    message: 'Successfully logged out',
    data: {},
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
  };

  // Filter out undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide an email', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('No user found with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  // In a production environment, send an email with the reset URL
  // For now, just return the URL in the response (for testing)

  res.status(200).json({
    success: true,
    message: 'Password reset token sent',
    data: {
      resetUrl,
    },
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token or token expired', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = generateToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
}; 