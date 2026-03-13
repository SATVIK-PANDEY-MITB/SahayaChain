const User = require('../models/user.model');
const { ErrorResponse, asyncHandler } = require('../middleware/error.middleware');

// In a real application, we'd use an actual AI model or API like OpenAI
// For now, we'll just implement a simple rule-based system

exports.generateResponse = (message, userData) => {
  const lowerMessage = message.toLowerCase();
  
  // Check for loan-related questions
  if (lowerMessage.includes('loan') && lowerMessage.includes('apply')) {
    return {
      text: "To apply for a loan, you need to join a community first. Once you're a member, go to the community page and click on 'Request Loan'. Fill in the required details about the loan amount, purpose, and repayment schedule.",
      actions: [{
        type: 'NAVIGATE',
        text: 'Browse Communities',
        destination: '/communities'
      }]
    };
  }
  
  if (lowerMessage.includes('loan') && lowerMessage.includes('status')) {
    if (userData && userData.loans && userData.loans.length > 0) {
      return {
        text: `You have ${userData.loans.length} loan(s). Your most recent loan is ${userData.loans[0].status}.`,
        actions: [{
          type: 'NAVIGATE',
          text: 'View Loans',
          destination: '/dashboard/loans'
        }]
      };
    } else {
      return {
        text: "You don't have any active loans. Would you like to apply for one?",
        actions: [{
          type: 'NAVIGATE',
          text: 'Apply for Loan',
          destination: '/communities'
        }]
      };
    }
  }
  
  // Check for community-related questions
  if (lowerMessage.includes('community') && (lowerMessage.includes('join') || lowerMessage.includes('find'))) {
    return {
      text: "You can find and join communities based on your location or interests. Browse the available communities and send a join request.",
      actions: [{
        type: 'NAVIGATE',
        text: 'Find Communities',
        destination: '/communities'
      }]
    };
  }
  
  if (lowerMessage.includes('community') && lowerMessage.includes('create')) {
    return {
      text: "To create a community, you need to be a verified user. Once verified, you can start a new community by providing details like name, location, and purpose.",
      actions: [{
        type: 'NAVIGATE',
        text: 'Create Community',
        destination: '/communities/create'
      }]
    };
  }
  
  // Check for verification-related questions
  if (lowerMessage.includes('verif')) {
    if (userData && userData.verificationStatus === 'verified') {
      return {
        text: "Your account is already verified. You have full access to all features.",
        actions: []
      };
    } else if (userData && userData.verificationStatus === 'pending') {
      return {
        text: "Your verification is pending. Our team is reviewing your documents. This usually takes 1-2 business days.",
        actions: []
      };
    } else {
      return {
        text: "To verify your account, you need to provide your Aadhar and PAN card details. Verification gives you access to more features like creating communities and applying for larger loans.",
        actions: [{
          type: 'NAVIGATE',
          text: 'Start Verification',
          destination: '/profile/verify'
        }]
      };
    }
  }
  
  // Check for payment-related questions
  if (lowerMessage.includes('pay') && (lowerMessage.includes('loan') || lowerMessage.includes('emi'))) {
    return {
      text: "You can make loan payments through multiple methods including UPI, bank transfer, or cash to the community admin. All payments are recorded and reflected in your loan status.",
      actions: [{
        type: 'NAVIGATE',
        text: 'View Payment Methods',
        destination: '/dashboard/loans'
      }]
    };
  }
  
  // Check for help with financial planning
  if (lowerMessage.includes('budget') || lowerMessage.includes('save') || lowerMessage.includes('financial plan')) {
    return {
      text: "I can help you create a budget plan based on your income and expenses. Would you like me to guide you through creating a simple budget?",
      actions: [{
        type: 'QUICK_REPLY',
        text: 'Yes, help me budget',
        value: 'start_budget_planning'
      },
      {
        type: 'QUICK_REPLY',
        text: 'No, thanks',
        value: 'decline_budget_help'
      }]
    };
  }
  
  // Check for interest rate questions
  if (lowerMessage.includes('interest') && lowerMessage.includes('rate')) {
    return {
      text: "Interest rates on loans typically range from 5% to 15% depending on the community, loan amount, and your credit score. Community-based loans often have lower interest rates compared to traditional banks.",
      actions: []
    };
  }
  
  // Default fallback response
  return {
    text: "I'm your financial assistant. I can help you with information about loans, communities, verification, payments, and financial planning. What would you like to know more about?",
    actions: [
      {
        type: 'QUICK_REPLY',
        text: 'Loan Information',
        value: 'tell me about loans'
      },
      {
        type: 'QUICK_REPLY',
        text: 'Communities',
        value: 'how do communities work'
      },
      {
        type: 'QUICK_REPLY',
        text: 'Verification',
        value: 'how to get verified'
      },
      {
        type: 'QUICK_REPLY',
        text: 'Financial Planning',
        value: 'help with financial planning'
      }
    ]
  };
};

// @desc    Process chatbot message
// @route   POST /api/chatbot/message
// @access  Private
exports.processMessage = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  
  if (!message) {
    return next(
      new ErrorResponse('Please provide a message', 400)
    );
  }
  
  // Get user data to provide personalized responses
  const user = await User.findById(req.user.id)
    .select('name verificationStatus loans communities')
    .populate('loans', 'amount status dateRequested')
    .populate('communities', 'name');
  
  // Generate response based on message and user data
  const response = exports.generateResponse(message, user);
  
  // Save chat history - in a real application, we'd store this in a separate collection
  
  res.status(200).json({
    success: true,
    data: {
      response: response.text,
      actions: response.actions,
      timestamp: Date.now()
    }
  });
});

// @desc    Get suggested questions
// @route   GET /api/chatbot/suggestions
// @access  Private
exports.getSuggestions = asyncHandler(async (req, res, next) => {
  // Get user data to personalize suggestions
  const user = await User.findById(req.user.id)
    .select('verificationStatus loans communities');
  
  let suggestions = [
    "How do I apply for a loan?",
    "How do communities work?",
    "What are the interest rates?"
  ];
  
  // Add personalized suggestions based on user status
  if (user.verificationStatus !== 'verified') {
    suggestions.push("How do I verify my account?");
  }
  
  if (user.loans && user.loans.length > 0) {
    suggestions.push("What is my loan status?");
    suggestions.push("How do I make a loan payment?");
  } else {
    suggestions.push("Am I eligible for a loan?");
  }
  
  if (user.communities && user.communities.length === 0) {
    suggestions.push("How do I join a community?");
  } else {
    suggestions.push("How do I create a community?");
  }
  
  res.status(200).json({
    success: true,
    data: suggestions
  });
}); 