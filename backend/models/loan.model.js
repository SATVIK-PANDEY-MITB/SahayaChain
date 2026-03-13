const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [1000, 'Loan amount must be at least ₹1,000'],
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      min: [0, 'Interest rate cannot be negative'],
      max: [30, 'Interest rate cannot exceed 30%'],
      default: 10, // 10% default interest rate
    },
    term: {
      type: Number,
      required: [true, 'Loan term is required'],
      min: [1, 'Loan term must be at least 1 month'],
      max: [60, 'Loan term cannot exceed 60 months'],
      default: 12, // 12 months default term
    },
    purpose: {
      type: String,
      required: [true, 'Loan purpose is required'],
      enum: [
        'medical',
        'education',
        'business',
        'housing',
        'personal',
        'emergency',
        'other',
      ],
    },
    purposeDetails: {
      type: String,
      required: [true, 'Detailed purpose is required'],
      minlength: [10, 'Purpose details must be at least 10 characters'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'funded',
        'active',
        'completed',
        'defaulted',
        'cancelled',
        'rejected',
      ],
      default: 'pending',
    },
    paymentFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'biannually', 'annually', 'bullet'],
      default: 'monthly',
    },
    dateRequested: {
      type: Date,
      default: Date.now,
    },
    dateApproved: Date,
    dateFunded: Date,
    dateStarted: Date,
    dateCompleted: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disbursementMethod: {
      type: String,
      enum: ['upi', 'bank_transfer', 'cash', 'other'],
      default: 'upi',
    },
    disbursementDetails: {
      upiId: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String,
    },
    supportingDocuments: [
      {
        name: String,
        fileUrl: String,
        documentType: {
          type: String,
          enum: ['id_proof', 'income_proof', 'purpose_proof', 'other'],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    payments: [
      {
        amount: Number,
        date: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'completed', 'late', 'missed'],
          default: 'pending',
        },
        method: {
          type: String,
          enum: ['upi', 'bank_transfer', 'cash', 'other'],
        },
        transactionId: String,
        receiptUrl: String,
      },
    ],
    paymentSchedule: [
      {
        dueDate: Date,
        amount: Number,
        principal: Number,
        interest: Number,
        status: {
          type: String,
          enum: ['upcoming', 'due', 'paid', 'overdue', 'missed'],
          default: 'upcoming',
        },
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment',
        },
      },
    ],
    collateral: {
      hasCollateral: {
        type: Boolean,
        default: false,
      },
      description: String,
      estimatedValue: Number,
      documentUrls: [String],
    },
    guarantor: {
      hasGuarantor: {
        type: Boolean,
        default: false,
      },
      name: String,
      relationship: String,
      phone: String,
      email: String,
      address: String,
    },
    contractHash: String, // For blockchain verification
    contractAddress: String, // For blockchain smart contract address
    totalAmountDue: {
      type: Number,
      default: 0,
    },
    totalAmountPaid: {
      type: Number,
      default: 0,
    },
    principalAmountPaid: {
      type: Number,
      default: 0,
    },
    interestAmountPaid: {
      type: Number,
      default: 0,
    },
    daysLate: {
      type: Number,
      default: 0,
    },
    notes: [
      {
        content: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        visibility: {
          type: String,
          enum: ['borrower', 'lender', 'admin', 'all'],
          default: 'all',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate payment schedule
loanSchema.methods.generatePaymentSchedule = function () {
  const monthlyInterestRate = this.interestRate / 100 / 12;
  const totalPayments = this.term;
  const principal = this.amount;

  // Calculate monthly payment using the formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyPayment =
    (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) /
    (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);

  let remainingPrincipal = principal;
  const schedule = [];

  for (let i = 0; i < totalPayments; i++) {
    const interestPayment = remainingPrincipal * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestPayment;
    
    remainingPrincipal -= principalPayment;

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    
    schedule.push({
      dueDate,
      amount: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      status: 'upcoming',
    });
  }

  this.paymentSchedule = schedule;
  this.totalAmountDue = monthlyPayment * totalPayments;
  
  return schedule;
};

// Calculate remaining balance
loanSchema.methods.calculateRemainingBalance = function () {
  return this.totalAmountDue - this.totalAmountPaid;
};

// Check if loan is in default
loanSchema.methods.isInDefault = function () {
  return this.daysLate > 30;
};

// Update loan status based on payments
loanSchema.methods.updateStatus = function () {
  if (this.totalAmountPaid >= this.totalAmountDue) {
    this.status = 'completed';
    this.dateCompleted = Date.now();
  } else if (this.isInDefault()) {
    this.status = 'defaulted';
  } else if (this.dateFunded && !this.dateCompleted) {
    this.status = 'active';
  }
};

module.exports = mongoose.model('Loan', loanSchema); 