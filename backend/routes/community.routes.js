const express = require('express');
const {
  getCommunities,
  getCommunity,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  processJoinRequest,
  leaveCommunity,
  updateMemberRole,
  removeMember,
  createAnnouncement,
  getNearbyCommunities
} = require('../controllers/community.controller');

const { authMiddleware, roleMiddleware, communityRoleMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getCommunities);
router.get('/nearby', getNearbyCommunities);
router.get('/:id', getCommunity);

// Protected routes
router.use(authMiddleware);

// Routes that all authenticated users can access
router.post('/', roleMiddleware('borrower', 'lender'), createCommunity);
router.post('/:id/join', joinCommunity);
router.delete('/:id/leave', leaveCommunity);

// Routes that require community admin/moderator role
router.put('/:id', communityRoleMiddleware('admin'), updateCommunity);
router.delete('/:id', communityRoleMiddleware('admin'), deleteCommunity);
router.put('/:id/requests/:requestId', communityRoleMiddleware('admin', 'moderator'), processJoinRequest);
router.put('/:id/members/:userId', communityRoleMiddleware('admin'), updateMemberRole);
router.delete('/:id/members/:userId', communityRoleMiddleware('admin', 'moderator'), removeMember);
router.post('/:id/announcements', communityRoleMiddleware('admin', 'moderator'), createAnnouncement);

module.exports = router; 