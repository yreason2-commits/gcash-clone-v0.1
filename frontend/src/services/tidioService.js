/**
 * Tidio Service for GCash Clone
 * Manages AI chatbot integration and customer support features
 */

class TidioService {
  constructor() {
    this.tidioApi = null;
    this.isInitialized = false;
    this.userContext = null;
  }

  /**
   * Initialize Tidio when the script loads
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      // Check if Tidio script is loaded
      const tidioScript = document.querySelector('script[src*="tidio.co"]');
      if (!tidioScript) {
        console.warn('Tidio script not found in page');
        reject(new Error('Tidio script not loaded'));
        return;
      }

      if (window.tidioChatApi) {
        this.tidioApi = window.tidioChatApi;
        this.isInitialized = true;
        this.setupGCashIntegration();
        resolve(true);
      } else {
        // Wait for Tidio to load with timeout
        const timeout = setTimeout(() => {
          console.warn('Tidio initialization timeout');
          reject(new Error('Tidio initialization timeout'));
        }, 10000); // 10 second timeout

        const checkTidio = () => {
          if (window.tidioChatApi) {
            clearTimeout(timeout);
            this.tidioApi = window.tidioChatApi;
            this.isInitialized = true;
            this.setupGCashIntegration();
            resolve(true);
          }
        };

        // Listen for Tidio ready event
        document.addEventListener('tidioChat-ready', checkTidio);
        
        // Also poll for the API to be available
        const pollInterval = setInterval(() => {
          if (window.tidioChatApi) {
            clearInterval(pollInterval);
            clearTimeout(timeout);
            checkTidio();
          }
        }, 500);
      }
    });
  }

  /**
   * Setup GCash-specific chatbot configuration
   */
  setupGCashIntegration() {
    if (!this.tidioApi) return;

    // Set visitor data for personalized support
    this.tidioApi.on('ready', () => {
      // Configure chatbot for GCash context
      this.configureChatbot();
    });

    // Handle custom GCash commands
    this.tidioApi.on('message', this.handleCustomCommands.bind(this));
  }

  /**
   * Configure chatbot with GCash-specific settings
   */
  configureChatbot() {
    // Set custom fields for GCash context
    this.tidioApi.setVisitorData({
      platform: 'GCash Clone',
      version: '1.0.0',
      userType: this.userContext?.isAuthenticated ? 'authenticated' : 'guest'
    });

    // Set predefined responses
    this.setPredefinedResponses();
  }

  /**
   * Set user context for personalized support
   */
  setUserContext(userInfo) {
    this.userContext = userInfo;
    
    if (this.tidioApi && this.isInitialized) {
      this.tidioApi.setVisitorData({
        email: userInfo.email || '',
        name: userInfo.name || 'GCash User',
        phone: userInfo.phoneNumber || '',
        userId: userInfo.userId || '',
        isAuthenticated: !!userInfo.isAuthenticated,
        accountBalance: userInfo.balance || 0,
        lastTransaction: userInfo.lastTransaction || null
      });
    }
  }

  /**
   * Handle custom GCash commands in chat
   */
  handleCustomCommands(data) {
    const message = data.message?.toLowerCase() || '';

    // Live agent escalation triggers
    if (message.includes('live agent') || 
        message.includes('human agent') || 
        message.includes('speak to someone') ||
        message.includes('talk to agent') ||
        message.includes('contact support')) {
      this.escalateToLiveAgent();
      return;
    }

    // GCash-specific command responses
    if (message.includes('balance')) {
      this.sendBalance();
    } else if (message.includes('transaction')) {
      this.sendTransactionHistory();
    } else if (message.includes('transfer') || message.includes('send money')) {
      this.provideTutorial('transfer');
    } else if (message.includes('problem') || message.includes('issue')) {
      this.handleProblemReport();
    }
  }

  /**
   * Send balance information via chatbot
   */
  sendBalance() {
    if (!this.userContext?.isAuthenticated) {
      this.sendMessage('Please log in to view your balance. You can do this by entering your phone number and following the verification steps.');
      return;
    }

    const balance = this.userContext.balance || 0;
    this.sendMessage(`Your current balance is ₱${balance.toFixed(2)}. Is there anything else I can help you with?`);
  }

  /**
   * Send transaction history information
   */
  sendTransactionHistory() {
    if (!this.userContext?.isAuthenticated) {
      this.sendMessage('Please log in to view your transaction history.');
      return;
    }

    this.sendMessage('I can help you with your transactions! You can view your complete transaction history in the app after logging in. Would you like me to guide you through the process?');
  }

  /**
   * Provide tutorials for common GCash features
   */
  provideTutorial(feature) {
    const tutorials = {
      transfer: `Here's how to send money:
1. Log in to your GCash account
2. Go to 'Send Money'
3. Enter recipient's phone number
4. Enter amount and verify
5. Confirm with your MPIN

Need help with any of these steps?`,
      
      deposit: `To add money to your account:
1. Visit any authorized GCash partner
2. Provide your phone number
3. Give cash to the agent
4. Wait for confirmation SMS

Would you like to know more about deposit options?`,
      
      withdraw: `To cash out:
1. Find a GCash partner outlet
2. Open your app and select 'Cash Out'
3. Enter amount and get reference code
4. Show code to agent and receive cash

Any questions about the cash out process?`
    };

    const tutorial = tutorials[feature];
    if (tutorial) {
      this.sendMessage(tutorial);
    }
  }

  /**
   * Handle problem reports
   */
  handleProblemReport() {
    this.sendMessage(`I'm here to help! Please describe your issue and I'll do my best to assist you. 

Common issues I can help with:
• Login problems
• Transaction failures
• Balance discrepancies
• App navigation

What specific problem are you experiencing?

💬 Need human help? Type "live agent" to connect with our support team.`);
  }

  /**
   * Escalate to live agent
   */
  escalateToLiveAgent() {
    if (this.tidioApi && this.isInitialized) {
      // Set visitor as needing human assistance
      this.tidioApi.setVisitorData({
        ...this.userContext,
        needsLiveAgent: true,
        escalationReason: 'User requested human assistance',
        timestamp: new Date().toISOString()
      });

      // Send escalation message
      this.sendMessage(`🔄 Connecting you to a live agent...

Our support team will assist you shortly. Please describe your issue and we'll get you the help you need.

⏰ Average response time: 2-5 minutes
📞 For urgent issues, you can also call our helpline.`);

      // Trigger Tidio's operator notification (if configured)
      if (this.tidioApi.trigger) {
        this.tidioApi.trigger('requestOperator');
      }
    } else {
      this.sendMessage(`I'd like to connect you with a live agent, but the feature isn't available right now. 

Please try these alternatives:
📧 Email: support@gcash-clone.com
📞 Phone: 1-800-GCASH-HELP
🕒 Live chat hours: 9 AM - 6 PM

Is there anything I can help you with in the meantime?`);
    }
  }

  /**
   * Send a message from the bot
   */
  sendMessage(message) {
    if (this.tidioApi && this.isInitialized) {
      this.tidioApi.messageFromVisitor(message);
    }
  }

  /**
   * Show/hide the chat widget
   */
  show() {
    if (this.tidioApi) {
      this.tidioApi.show();
    }
  }

  hide() {
    if (this.tidioApi) {
      this.tidioApi.hide();
    }
  }

  /**
   * Open chat with a specific message
   */
  openChat(message = '') {
    if (this.tidioApi) {
      this.tidioApi.open();
      if (message) {
        setTimeout(() => this.sendMessage(message), 500);
      }
    }
  }

  /**
   * Set predefined responses for common GCash queries
   */
  setPredefinedResponses() {
    // This would typically be configured in Tidio dashboard
    // but we can prepare the logic here for webhook integration
    this.commonResponses = {
      greeting: "Hello! Welcome to GCash Clone. I'm your AI assistant. How can I help you today?",
      
      help: `I can help you with:
• Account login and verification
• Balance inquiries
• Transaction support  
• Money transfer guidance
• Technical issues
• General questions about GCash features`,

      login_help: "To log in: Enter your registered phone number → Verify with OTP → Enter your MPIN. Need help with any of these steps?",
      
      forgot_mpin: "If you forgot your MPIN, you can reset it by clicking 'Forgot MPIN' on the login screen and following the verification process.",
      
      transaction_failed: "Transaction issues can happen due to insufficient balance, network problems, or verification errors. Let me help you troubleshoot this.",
      
      contact_support: "For urgent issues, you can contact our support team directly. I'm here 24/7 for immediate assistance with common questions!"
    };
  }

  /**
   * Get response for common queries
   */
  getCommonResponse(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('hello') || queryLower.includes('hi')) {
      return this.commonResponses.greeting;
    } else if (queryLower.includes('help')) {
      return this.commonResponses.help;
    } else if (queryLower.includes('login')) {
      return this.commonResponses.login_help;
    } else if (queryLower.includes('forgot') && queryLower.includes('mpin')) {
      return this.commonResponses.forgot_mpin;
    } else if (queryLower.includes('transaction') && queryLower.includes('failed')) {
      return this.commonResponses.transaction_failed;
    } else if (queryLower.includes('support') || queryLower.includes('contact')) {
      return this.commonResponses.contact_support;
    }
    
    return null;
  }
}

// Create singleton instance
const tidioService = new TidioService();

export default tidioService;
