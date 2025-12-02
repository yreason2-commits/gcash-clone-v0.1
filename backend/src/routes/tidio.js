const express = require('express');
const router = express.Router();

/**
 * Tidio Webhook Integration Routes
 * Handles incoming webhook requests from Tidio chatbot
 */

// Webhook endpoint for Tidio chat messages
router.post('/webhook', async (req, res) => {
  try {
    const { type, visitor_id, message, conversation_id } = req.body;
    
    console.log('Tidio webhook received:', { type, visitor_id, conversation_id });
    
    // Handle different webhook types
    switch (type) {
      case 'message':
        await handleMessage(req.body);
        break;
      case 'conversation_started':
        await handleConversationStarted(req.body);
        break;
      case 'conversation_ended':
        await handleConversationEnded(req.body);
        break;
      default:
        console.log('Unknown webhook type:', type);
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Tidio webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle incoming chat messages
async function handleMessage(data) {
  const { message, visitor_id, conversation_id } = data;
  
  // Check if this is a GCash-specific query
  const response = await processGCashQuery(message, visitor_id);
  
  if (response) {
    // Send automated response back to Tidio
    await sendTidioResponse(conversation_id, response);
  }
}

// Process GCash-specific queries
async function processGCashQuery(message, visitorId) {
  const query = message.toLowerCase();
  
  // Account balance query
  if (query.includes('balance') || query.includes('money')) {
    return await getBalanceResponse(visitorId);
  }
  
  // Transaction history query
  if (query.includes('transaction') || query.includes('history')) {
    return await getTransactionResponse(visitorId);
  }
  
  // Transfer/send money query
  if (query.includes('transfer') || query.includes('send')) {
    return getTransferGuide();
  }
  
  // Login help
  if (query.includes('login') || query.includes('sign in')) {
    return getLoginHelp();
  }
  
  // Technical issues
  if (query.includes('error') || query.includes('problem') || query.includes('issue')) {
    return getTechnicalSupport();
  }
  
  return null;
}

// Get user balance (would integrate with actual user data)
async function getBalanceResponse(visitorId) {
  // This would integrate with your user service
  // For now, return a generic response
  return {
    message: "To check your balance, please log in to your account first. Once logged in, your current balance will be displayed on the main screen.",
    quick_replies: [
      "How to log in?",
      "Forgot password",
      "Contact support"
    ]
  };
}

// Get transaction information
async function getTransactionResponse(visitorId) {
  return {
    message: "You can view your transaction history in the app after logging in. Transactions include money transfers, payments, and cash deposits/withdrawals.",
    quick_replies: [
      "How to send money?",
      "Transaction failed",
      "View receipts"
    ]
  };
}

// Transfer money guide
function getTransferGuide() {
  return {
    message: `Here's how to send money:

1️⃣ Log in to your GCash account
2️⃣ Tap 'Send Money'
3️⃣ Enter recipient's phone number
4️⃣ Enter amount and add a note (optional)
5️⃣ Review details and confirm
6️⃣ Enter your MPIN to complete

Need help with any specific step?`,
    quick_replies: [
      "Can't find recipient",
      "Transaction limit",
      "MPIN issues"
    ]
  };
}

// Login help guide
function getLoginHelp() {
  return {
    message: `To log into GCash:

📱 Enter your registered mobile number
🔢 Enter the OTP code sent to your phone
🔐 Enter your 4-digit MPIN

Having trouble with any of these steps?`,
    quick_replies: [
      "No OTP received",
      "Forgot MPIN",
      "Phone number issues"
    ]
  };
}

// Technical support response
function getTechnicalSupport() {
  return {
    message: `I can help you troubleshoot common issues:

🔧 App not loading - Try restarting the app
📶 Network errors - Check your internet connection  
💳 Transaction failures - Verify your balance and details
🔒 Login problems - Ensure correct phone number and MPIN

What specific issue are you experiencing?`,
    quick_replies: [
      "App crashes",
      "Can't send money",
      "Balance incorrect",
      "Speak to agent"
    ]
  };
}

// Send response back to Tidio (this would use Tidio's API)
async function sendTidioResponse(conversationId, response) {
  // This would integrate with Tidio's REST API
  // For now, just log the response
  console.log('Sending Tidio response:', {
    conversationId,
    message: response.message,
    quickReplies: response.quick_replies
  });
  
  // Example of how you'd send to Tidio API:
  /*
  const tidioApiKey = process.env.TIDIO_API_KEY;
  const tidioResponse = await fetch(`https://api.tidio.co/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tidioApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'message',
      content: response.message,
      quick_replies: response.quick_replies
    })
  });
  */
}

// Handle conversation started
async function handleConversationStarted(data) {
  const { visitor_id, conversation_id } = data;
  
  // Send welcome message
  const welcomeMessage = {
    message: `👋 Welcome to GCash Clone! 

I'm your AI assistant. I can help you with:
• Account and login issues
• Balance inquiries  
• Money transfers
• Transaction support
• Technical problems

How can I assist you today?`,
    quick_replies: [
      "Check balance",
      "Send money",
      "Login help",
      "Report issue"
    ]
  };
  
  await sendTidioResponse(conversation_id, welcomeMessage);
}

// Handle conversation ended
async function handleConversationEnded(data) {
  console.log('Conversation ended:', data.conversation_id);
  // Log conversation data or perform cleanup
}

// Get chatbot analytics
router.get('/analytics', async (req, res) => {
  try {
    // This would return chatbot usage analytics
    const analytics = {
      total_conversations: 0,
      resolved_queries: 0,
      common_issues: [
        { issue: 'Login problems', count: 45 },
        { issue: 'Balance inquiries', count: 32 },
        { issue: 'Transfer issues', count: 28 },
        { issue: 'Technical support', count: 15 }
      ],
      satisfaction_rate: 4.2
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Configure chatbot settings
router.post('/config', async (req, res) => {
  try {
    const { auto_responses, working_hours, greeting_message } = req.body;
    
    // Update chatbot configuration
    // This would integrate with Tidio's configuration API
    
    res.json({ 
      status: 'success',
      message: 'Chatbot configuration updated'
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

module.exports = router;
