const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['borrower', 'lender', 'admin'],
      default: 'borrower',
    },
    profilePicture: {
      type: String,
      default: 'default-profile.png',
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    aadharNumber: {
      type: String,
      // Only required for Indian users
      match: [/^[0-9]{12}$/, 'Please add a valid 12-digit Aadhar number'],
    },
    panNumber: {
      type: String,
      // Format check for PAN
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please add a valid PAN number'],
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified',
    },
    communities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
      },
    ],
    loans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
      },
    ],
    creditScore: {
      type: Number,
      default: 650,
      min: 300,
      max: 900,
    },
    notifications: [
      {
        message: String,
        type: {
          type: String,
          enum: ['loan', 'payment', 'community', 'system'],
        },
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  // Only run if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model('User', userSchema); 