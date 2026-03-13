const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Community description is required'],
    },
    location: {
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'India',
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: '2dsphere',
        },
      },
    },
    coverImage: {
      type: String,
      default: 'default-community.jpg',
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['member', 'admin', 'moderator'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified',
    },
    verificationDocuments: [
      {
        name: String,
        documentType: {
          type: String,
          enum: ['registration', 'address', 'tax', 'other'],
        },
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
      },
    ],
    rules: [
      {
        title: String,
        description: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    loans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
      },
    ],
    metrics: {
      totalLoansAmount: {
        type: Number,
        default: 0,
      },
      activeLoansCount: {
        type: Number,
        default: 0,
      },
      repaymentRate: {
        type: Number,
        default: 0, // Percentage
      },
      defaultRate: {
        type: Number,
        default: 0, // Percentage
      },
      avgLoanAmount: {
        type: Number,
        default: 0,
      },
    },
    settings: {
      allowPublicJoin: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
      minimumCreditScore: {
        type: Number,
        default: 600,
      },
      maxLoanAmount: {
        type: Number,
        default: 100000, // ₹ 1,00,000
      },
    },
    announcements: [
      {
        title: String,
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    joinRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        processedAt: Date,
        processedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware to update member count
communitySchema.pre('save', function (next) {
  if (this.members) {
    this.memberCount = this.members.length;
  }
  next();
});

// Index for geo queries
communitySchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Community', communitySchema); 