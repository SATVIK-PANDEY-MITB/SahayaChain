const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware to protect routes that require authentication
 * Checks if the request has a valid JWT token and attaches the user to the request object
 */
exports.authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. No token provided.',
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user and attach to request
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User associated with this token no longer exists.',
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token, not authorized to access this route.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has the required role
 * Used after the authMiddleware to restrict access based on user roles
 */
exports.roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }
    
    // Check if user role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user is a community admin/moderator
 * Used for community-specific actions like approving loans
 */
exports.communityRoleMiddleware = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated.',
        });
      }
      
      const communityId = req.params.communityId || req.body.communityId;
      
      if (!communityId) {
        return res.status(400).json({
          success: false,
          message: 'Community ID is required.',
        });
      }
      
      // Find the community and check user's role
      const community = await require('../models/community.model').findById(communityId);
      
      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found.',
        });
      }
      
      // Check if user is a member with appropriate role
      const memberInfo = community.members.find(
        (member) => member.user.toString() === req.user._id.toString()
      );
      
      if (!memberInfo || !roles.includes(memberInfo.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to perform this action in this community.',
        });
      }
      
      // Attach community to request for later use
      req.community = community;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is the creator/owner of a resource
 * Used for user-specific actions like updating own profile
 */
exports.resourceOwnerMiddleware = (model, paramIdField) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated.',
        });
      }
      
      const resourceId = req.params[paramIdField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `${paramIdField} is required.`,
        });
      }
      
      // Find the resource
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.',
        });
      }
      
      // Check if user is the owner
      // This assumes resource has either a 'user', 'owner', or 'creator' field
      const ownerId = resource.user || resource.owner || resource.creator || resource.borrower;
      
      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        // Exception for admin users
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access this resource.',
          });
        }
      }
      
      // Attach resource to request for later use
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
}; 