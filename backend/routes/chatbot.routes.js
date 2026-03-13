const express = require('express');
const {
  processMessage,
  getSuggestions
} = require('../controllers/chatbot.controller');

const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// All chatbot routes require authentication
router.use(authMiddleware);

// Process chatbot message
router.post('/message', processMessage);

// Get suggested questions
router.get('/suggestions', getSuggestions);

module.exports = router; 