const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  uploadVerificationDocuments,
  processVerification,
  getCommunityMembers
} = require('../controllers/user.controller');

const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { getUserLoans } = require('../controllers/loan.controller');

const router = express.Router({ mergeParams: true });

// Public routes
// None - all user routes require authentication

// Protected routes for regular users
router.use(authMiddleware);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/verify', uploadVerificationDocuments);

// Get community members - this route is handled by both user and community routers
// GET /api/communities/:communityId/members
router.get('/', getCommunityMembers);

// Admin only routes
router.use(roleMiddleware('admin'));
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/verify')
  .put(processVerification);

// User loans route - will be handled by loan router
// GET /api/users/:userId/loans
router.get('/:userId/loans', getUserLoans);

module.exports = router; 