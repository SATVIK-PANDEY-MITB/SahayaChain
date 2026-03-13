const Loan = require('../models/loan.model');
const User = require('../models/user.model');
const Community = require('../models/community.model');
const { ErrorResponse, asyncHandler } = require('../middleware/error.middleware');

// @desc    Get all loans (with filters)
// @route   GET /api/loans
// @access  Private/Admin
exports.getLoans = asyncHandler(async (req, res, next) => {
  let query;
  
  // Copy req.query
  const reqQuery = { ...req.query };
  
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
  
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Finding resource
  query = Loan.find(JSON.parse(queryStr));
  
  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.or([
      { purpose: searchRegex },
      { purposeDetails: searchRegex },
      { status: searchRegex }
    ]);
  }
  
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-dateRequested');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Loan.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // If not admin, only show loans relevant to user
  if (req.user.role !== 'admin') {
    query = query.or([
      { borrower: req.user.id },
      { lender: req.user.id }
    ]);
  }
  
  // Populate related fields
  query = query.populate([
    { path: 'borrower', select: 'name email phone profilePicture' },
    { path: 'lender', select: 'name email phone profilePicture' },
    { path: 'community', select: 'name location' }
  ]);
  
  // Executing query
  const loans = await query;
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: loans.length,
    pagination,
    data: loans
  });
});

// @desc    Get loans for a community
// @route   GET /api/communities/:communityId/loans
// @access  Private
exports.getCommunityLoans = asyncHandler(async (req, res, next) => {
  // Check if community exists
  const community = await Community.findById(req.params.communityId);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.communityId}`, 404)
    );
  }
  
  // Check if user is member of the community
  const isMember = community.members.some(
    member => member.user.toString() === req.user.id
  );
  
  if (!isMember && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to view loans in this community`, 403)
    );
  }
  
  // Get loans
  let query = Loan.find({ community: req.params.communityId })
    .populate([
      { path: 'borrower', select: 'name email phone profilePicture' },
      { path: 'lender', select: 'name email phone profilePicture' }
    ])
    .sort('-dateRequested');
  
  // Apply pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const total = await Loan.countDocuments({ community: req.params.communityId });
  
  query = query.skip(startIndex).limit(limit);
  
  // Executing query
  const loans = await query;
  
  // Pagination result
  const pagination = {};
  
  if ((page * limit) < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: loans.length,
    pagination,
    data: loans
  });
});

// @desc    Get single loan
// @route   GET /api/loans/:id
// @access  Private
exports.getLoan = asyncHandler(async (req, res, next) => {
  const loan = await Loan.findById(req.params.id)
    .populate([
      { path: 'borrower', select: 'name email phone profilePicture address verificationStatus' },
      { path: 'lender', select: 'name email phone profilePicture' },
      { path: 'community', select: 'name location description' },
      { path: 'approvedBy', select: 'name' }
    ]);
  
  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if user is borrower, lender, or admin
  const isAuthorized = 
    loan.borrower._id.toString() === req.user.id ||
    (loan.lender && loan.lender._id.toString() === req.user.id) ||
    req.user.role === 'admin';
  
  // Check if user is community admin/moderator
  if (!isAuthorized) {
    const community = await Community.findById(loan.community._id);
    const isCommunityAdmin = community.members.some(
      member => member.user.toString() === req.user.id && 
        ['admin', 'moderator'].includes(member.role)
    );
    
    if (!isCommunityAdmin) {
      return next(
        new ErrorResponse(`User not authorized to view this loan`, 403)
      );
    }
  }
  
  res.status(200).json({
    success: true,
    data: loan
  });
});

// @desc    Create new loan request
// @route   POST /api/communities/:communityId/loans
// @access  Private
exports.createLoan = asyncHandler(async (req, res, next) => {
  // Check if community exists
  const community = await Community.findById(req.params.communityId);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.communityId}`, 404)
    );
  }
  
  // Check if user is member of the community
  const isMember = community.members.some(
    member => member.user.toString() === req.user.id
  );
  
  if (!isMember) {
    return next(
      new ErrorResponse(`User must be a member of the community to request a loan`, 403)
    );
  }
  
  // Add user to req.body as borrower
  req.body.borrower = req.user.id;
  req.body.community = req.params.communityId;
  req.body.dateRequested = Date.now();
  
  // Create loan
  const loan = await Loan.create(req.body);
  
  // Add loan to community's loans
  community.loans.push(loan._id);
  await community.save();
  
  // Add loan to user's loans
  await User.findByIdAndUpdate(req.user.id, {
    $push: { loans: loan._id }
  });
  
  res.status(201).json({
    success: true,
    data: loan
  });
});

// @desc    Update loan
// @route   PUT /api/loans/:id
// @access  Private
exports.updateLoan = asyncHandler(async (req, res, next) => {
  let loan = await Loan.findById(req.params.id);
  
  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if user is borrower or admin
  const isAdmin = req.user.role === 'admin';
  const isBorrower = loan.borrower.toString() === req.user.id;
  
  if (!isAdmin && !isBorrower) {
    return next(
      new ErrorResponse(`User not authorized to update this loan`, 403)
    );
  }
  
  // Only allow updates if loan is in 'pending' status
  if (loan.status !== 'pending' && !isAdmin) {
    return next(
      new ErrorResponse(`Cannot update loan that is not in pending status`, 400)
    );
  }
  
  // Remove fields that shouldn't be updateable
  if (!isAdmin) {
    delete req.body.status;
    delete req.body.lender;
    delete req.body.dateApproved;
    delete req.body.dateFunded;
    delete req.body.dateStarted;
    delete req.body.dateCompleted;
    delete req.body.approvedBy;
  }
  
  // Update loan
  loan = await Loan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: loan
  });
});

// @desc    Process loan (approve, reject, fund, etc.)
// @route   PUT /api/loans/:id/process
// @access  Private
exports.processLoan = asyncHandler(async (req, res, next) => {
  const { action } = req.body;
  
  if (!action || !['approve', 'reject', 'fund', 'cancel', 'complete'].includes(action)) {
    return next(
      new ErrorResponse(`Please provide a valid action`, 400)
    );
  }
  
  let loan = await Loan.findById(req.params.id);
  
  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Handle different actions
  switch (action) {
    case 'approve':
      // Only community admin/moderator can approve
      const community = await Community.findById(loan.community);
      const isCommunityAdmin = community.members.some(
        member => member.user.toString() === req.user.id && 
          ['admin', 'moderator'].includes(member.role)
      );
      
      if (!isCommunityAdmin && req.user.role !== 'admin') {
        return next(
          new ErrorResponse(`User not authorized to approve loans`, 403)
        );
      }
      
      if (loan.status !== 'pending') {
        return next(
          new ErrorResponse(`Can only approve loans in pending status`, 400)
        );
      }
      
      loan.status = 'approved';
      loan.dateApproved = Date.now();
      loan.approvedBy = req.user.id;
      break;
      
    case 'reject':
      // Only community admin/moderator can reject
      const comm = await Community.findById(loan.community);
      const isCommAdmin = comm.members.some(
        member => member.user.toString() === req.user.id && 
          ['admin', 'moderator'].includes(member.role)
      );
      
      if (!isCommAdmin && req.user.role !== 'admin') {
        return next(
          new ErrorResponse(`User not authorized to reject loans`, 403)
        );
      }
      
      if (loan.status !== 'pending') {
        return next(
          new ErrorResponse(`Can only reject loans in pending status`, 400)
        );
      }
      
      loan.status = 'rejected';
      break;
      
    case 'fund':
      // Any member can fund an approved loan
      if (loan.status !== 'approved') {
        return next(
          new ErrorResponse(`Can only fund loans in approved status`, 400)
        );
      }
      
      // Check if borrower is trying to fund their own loan
      if (loan.borrower.toString() === req.user.id) {
        return next(
          new ErrorResponse(`Cannot fund your own loan`, 400)
        );
      }
      
      loan.lender = req.user.id;
      loan.status = 'funded';
      loan.dateFunded = Date.now();
      loan.dateStarted = Date.now();
      
      // Generate payment schedule
      loan.paymentSchedule = loan.generatePaymentSchedule();
      
      // Add loan to lender's loans
      await User.findByIdAndUpdate(req.user.id, {
        $push: { loans: loan._id }
      });
      break;
      
    case 'cancel':
      // Only borrower or admin can cancel
      if (loan.borrower.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
          new ErrorResponse(`User not authorized to cancel this loan`, 403)
        );
      }
      
      if (!['pending', 'approved'].includes(loan.status)) {
        return next(
          new ErrorResponse(`Can only cancel loans in pending or approved status`, 400)
        );
      }
      
      loan.status = 'cancelled';
      break;
      
    case 'complete':
      // Only admin can manually complete a loan
      if (req.user.role !== 'admin') {
        return next(
          new ErrorResponse(`Only admin can manually complete a loan`, 403)
        );
      }
      
      if (loan.status !== 'active') {
        return next(
          new ErrorResponse(`Can only complete loans in active status`, 400)
        );
      }
      
      loan.status = 'completed';
      loan.dateCompleted = Date.now();
      break;
  }
  
  await loan.save();
  
  res.status(200).json({
    success: true,
    data: loan
  });
});

// @desc    Record loan payment
// @route   POST /api/loans/:id/payments
// @access  Private
exports.recordPayment = asyncHandler(async (req, res, next) => {
  const { amount, paymentMethod, transactionId } = req.body;
  
  if (!amount || amount <= 0) {
    return next(
      new ErrorResponse(`Please provide a valid payment amount`, 400)
    );
  }
  
  let loan = await Loan.findById(req.params.id);
  
  if (!loan) {
    return next(
      new ErrorResponse(`Loan not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if loan is in active status
  if (loan.status !== 'funded' && loan.status !== 'active') {
    return next(
      new ErrorResponse(`Can only record payments for funded or active loans`, 400)
    );
  }
  
  // Check if user is borrower or admin
  if (loan.borrower.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to record payments for this loan`, 403)
    );
  }
  
  // Add payment
  const payment = {
    amount,
    date: Date.now(),
    paymentMethod: paymentMethod || 'cash',
    transactionId: transactionId || '',
    status: 'completed'
  };
  
  loan.payments.push(payment);
  
  // Update loan totals
  loan.totalAmountPaid += amount;
  
  // Calculate distribution of payment (principal vs. interest)
  const interestRate = loan.interestRate / 100 / 12; // Monthly interest rate
  const interestDue = ((loan.amount - loan.principalAmountPaid) * interestRate);
  
  if (amount <= interestDue) {
    loan.interestAmountPaid += amount;
  } else {
    loan.interestAmountPaid += interestDue;
    loan.principalAmountPaid += (amount - interestDue);
  }
  
  // Update loan status if needed
  if (loan.status === 'funded') {
    loan.status = 'active';
  }
  
  // Check if loan is fully paid
  if (loan.totalAmountPaid >= loan.amount + (loan.amount * loan.interestRate / 100)) {
    loan.status = 'completed';
    loan.dateCompleted = Date.now();
  }
  
  await loan.save();
  
  res.status(201).json({
    success: true,
    data: loan
  });
});

// @desc    Get user's loans
// @route   GET /api/users/:userId/loans
// @access  Private
exports.getUserLoans = asyncHandler(async (req, res, next) => {
  // Check if user exists
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }
  
  // Check if user is requesting their own loans or is admin
  if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to view these loans`, 403)
    );
  }
  
  // Get loans where user is borrower or lender
  const query = Loan.find({
    $or: [
      { borrower: req.params.userId },
      { lender: req.params.userId }
    ]
  })
  .populate([
    { path: 'borrower', select: 'name email phone profilePicture' },
    { path: 'lender', select: 'name email phone profilePicture' },
    { path: 'community', select: 'name location' }
  ])
  .sort('-dateRequested');
  
  // Apply pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const total = await Loan.countDocuments({
    $or: [
      { borrower: req.params.userId },
      { lender: req.params.userId }
    ]
  });
  
  const loans = await query.skip(startIndex).limit(limit);
  
  // Pagination result
  const pagination = {};
  
  if ((page * limit) < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: loans.length,
    pagination,
    data: loans
  });
}); 