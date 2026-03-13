const User = require('../models/user.model');
const Community = require('../models/community.model');
const { ErrorResponse, asyncHandler } = require('../middleware/error.middleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
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
  query = User.find(JSON.parse(queryStr));
  
  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.or([
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ]);
  }
  
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  } else {
    // Exclude password by default
    query = query.select('-password');
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Populate communities
  query = query.populate({
    path: 'communities',
    select: 'name location'
  });
  
  // Executing query
  const users = await query;
  
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
    count: users.length,
    pagination,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate([
      { path: 'communities', select: 'name location' },
      { path: 'loans', select: 'amount status dateRequested' }
    ]);
  
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  
  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Remove password from update - this should be handled separately
  delete req.body.password;
  
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');
  
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check all communities where user is founder and change status to inactive
  const communities = await Community.find({ founder: req.params.id });
  for (const community of communities) {
    community.status = 'inactive';
    await community.save();
  }
  
  // Remove user
  await user.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate([
      { path: 'communities', select: 'name location description' },
      { path: 'loans', select: 'amount status dateRequested community purpose' }
    ]);
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user's own profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  // Fields that user can update
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    profilePicture: req.body.profilePicture
  };
  
  // Filter out undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );
  
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Upload user verification documents
// @route   POST /api/users/verify
// @access  Private
exports.uploadVerificationDocuments = asyncHandler(async (req, res, next) => {
  const { aadharNumber, panNumber, documents } = req.body;
  
  if (!aadharNumber || !panNumber || !documents) {
    return next(
      new ErrorResponse('Please provide Aadhar number, PAN number, and documents', 400)
    );
  }
  
  // In a real application, we'd validate these numbers against govt. APIs
  // and handle document uploads separately
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      aadharNumber,
      panNumber,
      verificationStatus: 'pending',
      // In a real app, we'd save file paths or URLs to the documents
      verificationDocuments: documents
    },
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Approve or reject user verification
// @route   PUT /api/users/:id/verify
// @access  Private/Admin
exports.processVerification = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;
  
  if (!status || !['verified', 'rejected'].includes(status)) {
    return next(
      new ErrorResponse('Please provide a valid status (verified or rejected)', 400)
    );
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }
  
  if (user.verificationStatus !== 'pending') {
    return next(
      new ErrorResponse(`User verification status is not pending`, 400)
    );
  }
  
  user.verificationStatus = status;
  user.verificationNotes = notes || '';
  
  await user.save();
  
  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      verificationStatus: user.verificationStatus
    }
  });
});

// @desc    Get community members
// @route   GET /api/communities/:communityId/members
// @access  Private
exports.getCommunityMembers = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.communityId)
    .populate({
      path: 'members.user',
      select: 'name email phone profilePicture verificationStatus'
    });
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.communityId}`, 404)
    );
  }
  
  // Check if user is member of the community
  const isMember = community.members.some(
    member => member.user._id.toString() === req.user.id
  );
  
  if (!isMember && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorized to view community members`, 403)
    );
  }
  
  res.status(200).json({
    success: true,
    count: community.members.length,
    data: community.members
  });
}); 