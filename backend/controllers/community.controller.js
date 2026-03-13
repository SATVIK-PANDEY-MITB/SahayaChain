const Community = require('../models/community.model');
const User = require('../models/user.model');
const { ErrorResponse, asyncHandler } = require('../middleware/error.middleware');

// @desc    Get all communities
// @route   GET /api/communities
// @access  Public
exports.getCommunities = asyncHandler(async (req, res, next) => {
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
  query = Community.find(JSON.parse(queryStr));
  
  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.or([
      { name: searchRegex },
      { 'location.city': searchRegex },
      { 'location.state': searchRegex },
      { 'location.country': searchRegex },
      { description: searchRegex }
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
    query = query.sort('-createdAt');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Community.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Filter by status if not admin
  if (!req.user || req.user.role !== 'admin') {
    query = query.find({ status: 'active' });
  }
  
  // Populate founder and members
  query = query.populate({
    path: 'founder',
    select: 'name email profilePicture'
  }).populate({
    path: 'members.user',
    select: 'name email profilePicture'
  });
  
  // Executing query
  const communities = await query;
  
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
    count: communities.length,
    pagination,
    data: communities
  });
});

// @desc    Get single community
// @route   GET /api/communities/:id
// @access  Public
exports.getCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id)
    .populate({
      path: 'founder',
      select: 'name email profilePicture'
    })
    .populate({
      path: 'members.user',
      select: 'name email profilePicture'
    });
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if community is active or user is admin/founder
  if (
    community.status !== 'active' && 
    (!req.user || 
      (req.user.role !== 'admin' && 
       community.founder._id.toString() !== req.user.id)
    )
  ) {
    return next(
      new ErrorResponse(`Community is not active`, 403)
    );
  }
  
  res.status(200).json({
    success: true,
    data: community
  });
});

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.founder = req.user.id;
  
  // Check if user is verified
  if (req.user.verificationStatus !== 'verified') {
    return next(
      new ErrorResponse(`User must be verified to create a community`, 403)
    );
  }
  
  // Create community
  const community = await Community.create(req.body);
  
  // Add user as a member with admin role
  community.members.push({
    user: req.user.id,
    role: 'admin',
    joinedAt: Date.now()
  });
  
  await community.save();
  
  // Add community to user's communities
  await User.findByIdAndUpdate(req.user.id, {
    $push: { communities: community._id }
  });
  
  res.status(201).json({
    success: true,
    data: community
  });
});

// @desc    Update community
// @route   PUT /api/communities/:id
// @access  Private
exports.updateCommunity = asyncHandler(async (req, res, next) => {
  let community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is community admin or site admin
  const isAdmin = req.user.role === 'admin';
  const isCommunityAdmin = community.members.some(
    member => member.user.toString() === req.user.id && member.role === 'admin'
  );
  
  if (!isAdmin && !isCommunityAdmin) {
    return next(
      new ErrorResponse(`User not authorized to update this community`, 403)
    );
  }
  
  // Remove fields that shouldn't be updateable by regular admins
  if (!isAdmin) {
    delete req.body.status;
    delete req.body.verificationStatus;
    delete req.body.founder;
  }
  
  // Update community
  community = await Community.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: community
  });
});

// @desc    Delete community
// @route   DELETE /api/communities/:id
// @access  Private
exports.deleteCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is founder or site admin
  if (
    community.founder.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(`User not authorized to delete this community`, 403)
    );
  }
  
  // Instead of real delete, mark as inactive
  community.status = 'inactive';
  await community.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Join community
// @route   POST /api/communities/:id/join
// @access  Private
exports.joinCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if community is active
  if (community.status !== 'active') {
    return next(
      new ErrorResponse(`Cannot join an inactive community`, 400)
    );
  }
  
  // Check if user is already a member
  const isMember = community.members.some(
    member => member.user.toString() === req.user.id
  );
  
  if (isMember) {
    return next(
      new ErrorResponse(`User is already a member of this community`, 400)
    );
  }
  
  // Check if there's a pending join request
  const hasPendingRequest = community.joinRequests.some(
    request => request.user.toString() === req.user.id && request.status === 'pending'
  );
  
  if (hasPendingRequest) {
    return next(
      new ErrorResponse(`User already has a pending join request`, 400)
    );
  }
  
  // Add join request
  community.joinRequests.push({
    user: req.user.id,
    requestedAt: Date.now(),
    message: req.body.message || '',
    status: 'pending'
  });
  
  await community.save();
  
  res.status(200).json({
    success: true,
    message: 'Join request submitted successfully',
    data: {}
  });
});

// @desc    Approve or reject join request
// @route   PUT /api/communities/:id/requests/:requestId
// @access  Private
exports.processJoinRequest = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(
      new ErrorResponse(`Please provide a valid status (approved or rejected)`, 400)
    );
  }
  
  const community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is community admin or moderator
  const isAdmin = req.user.role === 'admin';
  const isCommunityAdmin = community.members.some(
    member => member.user.toString() === req.user.id && 
    ['admin', 'moderator'].includes(member.role)
  );
  
  if (!isAdmin && !isCommunityAdmin) {
    return next(
      new ErrorResponse(`User not authorized to process join requests`, 403)
    );
  }
  
  // Find the join request
  const requestIndex = community.joinRequests.findIndex(
    request => request._id.toString() === req.params.requestId
  );
  
  if (requestIndex === -1) {
    return next(
      new ErrorResponse(`Join request not found`, 404)
    );
  }
  
  // Update join request status
  community.joinRequests[requestIndex].status = status;
  community.joinRequests[requestIndex].processedBy = req.user.id;
  community.joinRequests[requestIndex].processedAt = Date.now();
  
  // If approved, add user to members
  if (status === 'approved') {
    const userId = community.joinRequests[requestIndex].user;
    
    // Check if user is already a member (edge case)
    const isMember = community.members.some(
      member => member.user.toString() === userId.toString()
    );
    
    if (!isMember) {
      community.members.push({
        user: userId,
        role: 'member',
        joinedAt: Date.now()
      });
      
      // Add community to user's communities
      await User.findByIdAndUpdate(userId, {
        $push: { communities: community._id }
      });
    }
  }
  
  await community.save();
  
  res.status(200).json({
    success: true,
    message: `Join request ${status}`,
    data: {}
  });
});

// @desc    Leave community
// @route   DELETE /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check if user is a member
  const memberIndex = community.members.findIndex(
    member => member.user.toString() === req.user.id
  );
  
  if (memberIndex === -1) {
    return next(
      new ErrorResponse(`User is not a member of this community`, 400)
    );
  }
  
  // Check if user is the founder
  if (community.founder.toString() === req.user.id) {
    return next(
      new ErrorResponse(`Founder cannot leave the community. Transfer ownership first.`, 400)
    );
  }
  
  // Remove user from members
  community.members.splice(memberIndex, 1);
  await community.save();
  
  // Remove community from user's communities
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { communities: community._id }
  });
  
  res.status(200).json({
    success: true,
    message: 'Successfully left the community',
    data: {}
  });
});

// @desc    Update member role
// @route   PUT /api/communities/:id/members/:userId
// @access  Private
exports.updateMemberRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  
  if (!role || !['admin', 'moderator', 'member'].includes(role)) {
    return next(
      new ErrorResponse(`Please provide a valid role (admin, moderator, or member)`, 400)
    );
  }
  
  const community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is community admin
  const isAdmin = req.user.role === 'admin';
  const isCommunityAdmin = community.members.some(
    member => member.user.toString() === req.user.id && member.role === 'admin'
  );
  
  if (!isAdmin && !isCommunityAdmin) {
    return next(
      new ErrorResponse(`User not authorized to update member roles`, 403)
    );
  }
  
  // Find the member
  const memberIndex = community.members.findIndex(
    member => member.user.toString() === req.params.userId
  );
  
  if (memberIndex === -1) {
    return next(
      new ErrorResponse(`Member not found`, 404)
    );
  }
  
  // Prevent non-founders from changing founder's role
  if (
    community.founder.toString() === req.params.userId &&
    community.founder.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(`Only the founder can change their own role`, 403)
    );
  }
  
  // Update member role
  community.members[memberIndex].role = role;
  await community.save();
  
  res.status(200).json({
    success: true,
    message: `Member role updated to ${role}`,
    data: {}
  });
});

// @desc    Remove member from community
// @route   DELETE /api/communities/:id/members/:userId
// @access  Private
exports.removeMember = asyncHandler(async (req, res, next) => {
  const community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is community admin or moderator
  const isAdmin = req.user.role === 'admin';
  const isCommunityAdmin = community.members.some(
    member => member.user.toString() === req.user.id && 
    ['admin', 'moderator'].includes(member.role)
  );
  
  if (!isAdmin && !isCommunityAdmin) {
    return next(
      new ErrorResponse(`User not authorized to remove members`, 403)
    );
  }
  
  // Cannot remove founder
  if (community.founder.toString() === req.params.userId) {
    return next(
      new ErrorResponse(`Cannot remove the founder from the community`, 400)
    );
  }
  
  // Find the member
  const memberIndex = community.members.findIndex(
    member => member.user.toString() === req.params.userId
  );
  
  if (memberIndex === -1) {
    return next(
      new ErrorResponse(`Member not found`, 404)
    );
  }
  
  // Check if trying to remove admin (only admin can remove another admin)
  if (
    community.members[memberIndex].role === 'admin' &&
    !isAdmin &&
    community.members.find(
      m => m.user.toString() === req.user.id
    ).role !== 'admin'
  ) {
    return next(
      new ErrorResponse(`Only admins can remove other admins`, 403)
    );
  }
  
  // Remove member
  community.members.splice(memberIndex, 1);
  await community.save();
  
  // Remove community from user's communities
  await User.findByIdAndUpdate(req.params.userId, {
    $pull: { communities: community._id }
  });
  
  res.status(200).json({
    success: true,
    message: 'Member removed successfully',
    data: {}
  });
});

// @desc    Create community announcement
// @route   POST /api/communities/:id/announcements
// @access  Private
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, content, importance } = req.body;
  
  if (!title || !content) {
    return next(
      new ErrorResponse(`Please provide title and content for the announcement`, 400)
    );
  }
  
  const community = await Community.findById(req.params.id);
  
  if (!community) {
    return next(
      new ErrorResponse(`Community not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user is community admin or moderator
  const isAdmin = req.user.role === 'admin';
  const isCommunityAdmin = community.members.some(
    member => member.user.toString() === req.user.id && 
    ['admin', 'moderator'].includes(member.role)
  );
  
  if (!isAdmin && !isCommunityAdmin) {
    return next(
      new ErrorResponse(`User not authorized to create announcements`, 403)
    );
  }
  
  // Add announcement
  community.announcements.push({
    title,
    content,
    author: req.user.id,
    importance: importance || 'normal',
    date: Date.now()
  });
  
  await community.save();
  
  res.status(201).json({
    success: true,
    data: community.announcements[community.announcements.length - 1]
  });
});

// @desc    Get nearby communities
// @route   GET /api/communities/nearby
// @access  Public
exports.getNearbyCommunities = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, distance = 10 } = req.query;
  
  // Validate coordinates
  if (!latitude || !longitude) {
    return next(
      new ErrorResponse('Please provide latitude and longitude', 400)
    );
  }
  
  // Calculate radius using radians
  // Earth radius is approximately 6,378 kilometers
  const radius = distance / 6378;
  
  // Find communities within the radius
  const communities = await Community.find({
    'location.coordinates': {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radius]
      }
    },
    status: 'active'
  })
  .populate({
    path: 'founder',
    select: 'name email profilePicture'
  })
  .select('-members -joinRequests');
  
  res.status(200).json({
    success: true,
    count: communities.length,
    data: communities
  });
}); 