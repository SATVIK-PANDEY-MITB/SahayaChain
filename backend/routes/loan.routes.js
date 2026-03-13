const express = require('express');
const {
  getLoans,
  getLoan,
  updateLoan,
  processLoan,
  recordPayment,
  getUserLoans,
  getCommunityLoans,
  createLoan
} = require('../controllers/loan.controller');

const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// Include mergeParams to allow access to params from parent router
const router = express.Router({ mergeParams: true });

// All loan routes require authentication
router.use(authMiddleware);

// Routes for /api/loans
router.route('/')
  .get(getLoans);

// Routes for /api/loans/:id
router.route('/:id')
  .get(getLoan)
  .put(updateLoan);

// Process loan (approve, reject, fund, etc.)
router.route('/:id/process')
  .put(processLoan);

// Record payments
router.route('/:id/payments')
  .post(recordPayment);

// Community loan routes - these will be used by the community router
// GET /api/communities/:communityId/loans
router.route('/')
  .post(createLoan);

module.exports = router; 