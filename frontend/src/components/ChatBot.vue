<template>
  <div class="chatbot-container">
    <!-- Floating Chat Button -->
    <div 
      v-if="!isOpen && showFloatingButton" 
      class="floating-chat-btn"
      @click="openChat"
    >
      <div class="chat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="white"/>
          <circle cx="12" cy="10" r="2" fill="white"/>
          <circle cx="8" cy="10" r="1" fill="white"/>
          <circle cx="16" cy="10" r="1" fill="white"/>
        </svg>
      </div>
      <div v-if="hasUnreadMessage" class="notification-badge"></div>
    </div>

    <!-- Inline Chat Widget -->
    <div v-if="displayMode === 'inline'" class="inline-chat-widget">
      <div class="chat-header">
        <h3>GCash Support</h3>
        <p>How can we help you today?</p>
      </div>
      
      <div class="quick-actions">
        <button 
          v-for="action in quickActions" 
          :key="action.id"
          @click="handleQuickAction(action)"
          class="quick-action-btn"
        >
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Custom Chat Interface -->
    <div 
      v-if="showCustomChat" 
      class="custom-chat-interface"
      :class="{ 'chat-open': isOpen }"
    >
      <div class="chat-window">
        <div class="chat-header">
          <div class="header-content">
            <h3>💬 GCash Live Support</h3>
            <span class="status-indicator online">● Live Agent Ready (Custom Interface)</span>
          </div>
          <button @click="closeChat" class="close-btn">×</button>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div 
            v-for="message in chatMessages" 
            :key="message.id"
            class="message"
            :class="{ 'user-message': message.isUser, 'bot-message': !message.isUser }"
          >
            <div class="message-content">
              <p>{{ message.text }}</p>
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
          </div>
        </div>

        <div class="quick-replies" v-if="currentQuickReplies.length > 0">
          <button 
            v-for="reply in currentQuickReplies"
            :key="reply"
            @click="sendQuickReply(reply)"
            class="quick-reply-btn"
          >
            {{ reply }}
          </button>
        </div>

        <div class="chat-input">
          <input 
            v-model="messageInput"
            @keyup.enter="sendMessage"
            placeholder="Type your message..."
            class="message-input"
          >
          <button @click="sendMessage" class="send-btn">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import tidioService from '../services/tidioService.js'

const props = defineProps({
  displayMode: {
    type: String,
    default: 'floating', // 'floating', 'inline', 'embedded'
  },
  showFloatingButton: {
    type: Boolean,
    default: true
  },
  userContext: {
    type: Object,
    default: () => ({})
  }
})

// Reactive state
const isOpen = ref(false)
const tidioAvailable = ref(false)
const showCustomChat = ref(false)
const hasUnreadMessage = ref(false)
const messageInput = ref('')
const messagesContainer = ref(null)

// Chat messages for custom interface
const chatMessages = ref([
  {
    id: 1,
    text: "Hi! I'm your GCash assistant. How can I help you today?",
    isUser: false,
    timestamp: new Date()
  }
])

// Quick actions for different contexts
const quickActions = ref([
  { id: 'balance', label: 'Check Balance', action: 'getBalance' },
  { id: 'transfer', label: 'Send Money', action: 'getTransferHelp' },
  { id: 'history', label: 'Transaction History', action: 'getHistory' },
  { id: 'support', label: 'Contact Support', action: 'getSupport' },
  { id: 'liveAgent', label: 'Talk to Agent', action: 'getLiveAgent' }
])

// Current quick replies
const currentQuickReplies = ref([
  'Check my balance',
  'How to send money?',
  'Login help',
  'Report a problem',
  'Talk to live agent'
])

// Initialize chatbot
onMounted(async () => {
  try {
    await tidioService.initialize()
    tidioAvailable.value = true
    console.log('ChatBot component initialized with Tidio')
    
    // Set user context if provided
    if (props.userContext && Object.keys(props.userContext).length > 0) {
      tidioService.setUserContext(props.userContext)
    }
  } catch (error) {
    console.error('Tidio not available, using custom chat interface')
    tidioAvailable.value = false
    showCustomChat.value = true
  }
  
  // Always enable custom chat as fallback
  showCustomChat.value = true
})

// Open chat interface
const openChat = () => {
  console.log('Opening chat - Tidio available:', tidioAvailable.value)
  
  if (tidioAvailable.value) {
    try {
      tidioService.openChat()
    } catch (error) {
      console.error('Error opening Tidio chat:', error)
      // Fallback to custom interface
      isOpen.value = true
      hasUnreadMessage.value = false
    }
  } else {
    isOpen.value = true
    hasUnreadMessage.value = false
    console.log('Opening custom chat interface')
  }
}

// Close chat interface
const closeChat = () => {
  console.log('Closing chat')
  
  if (tidioAvailable.value) {
    try {
      tidioService.hide()
    } catch (error) {
      console.error('Error closing Tidio chat:', error)
    }
  }
  
  // Always close custom interface
  isOpen.value = false
}

// Handle quick actions
const handleQuickAction = (action) => {
  switch (action.action) {
    case 'getBalance':
      if (tidioAvailable.value) {
        tidioService.openChat('I want to check my balance')
      } else {
        addBotMessage("To check your balance, please log in to your account first. Your balance will be displayed on the main dashboard.")
      }
      break
    
    case 'getTransferHelp':
      if (tidioAvailable.value) {
        tidioService.openChat('How do I send money?')
      } else {
        addBotMessage(`Here's how to send money:
        
1. Log in to your account
2. Tap 'Send Money'
3. Enter recipient's phone number
4. Enter amount and confirm
5. Complete with your MPIN`)
      }
      break
    
    case 'getHistory':
      if (tidioAvailable.value) {
        tidioService.openChat('Show me my transaction history')
      } else {
        addBotMessage("You can view your transaction history in the app after logging in. All your transfers, payments, and deposits will be listed there.")
      }
      break
    
    case 'getSupport':
      if (tidioAvailable.value) {
        tidioService.openChat('I need help with an issue')
      } else {
        addBotMessage("I'm here to help! Please describe the issue you're experiencing and I'll do my best to assist you.")
      }
      break
    
    case 'getLiveAgent':
      if (tidioAvailable.value) {
        tidioService.openChat('I need to speak with a live agent')
      } else {
        addBotMessage("I'd like to connect you with a live agent. Please describe your issue and our support team will assist you.")
      }
      break
  }
}

// Send message in custom chat
const sendMessage = () => {
  if (!messageInput.value.trim()) return
  
  // Add user message
  addUserMessage(messageInput.value)
  
  // Process message and respond
  setTimeout(() => {
    const response = processUserMessage(messageInput.value)
    addBotMessage(response.message)
    currentQuickReplies.value = response.quickReplies || []
  }, 500)
  
  messageInput.value = ''
}

// Send quick reply
const sendQuickReply = (reply) => {
  addUserMessage(reply)
  
  setTimeout(() => {
    const response = processUserMessage(reply)
    addBotMessage(response.message)
    currentQuickReplies.value = response.quickReplies || []
  }, 300)
}

// Add user message to chat
const addUserMessage = (text) => {
  chatMessages.value.push({
    id: Date.now(),
    text,
    isUser: true,
    timestamp: new Date()
  })
  scrollToBottom()
}

// Add bot message to chat
const addBotMessage = (text) => {
  chatMessages.value.push({
    id: Date.now(),
    text,
    isUser: false,
    timestamp: new Date()
  })
  scrollToBottom()
}

// Process user message and generate response
const processUserMessage = (message) => {
  const query = message.toLowerCase()
  
  if (query.includes('balance')) {
    return {
      message: "To check your balance, please ensure you're logged in. Your current balance will be displayed on your dashboard.",
      quickReplies: ['How to log in?', 'Account locked', 'Contact support']
    }
  } else if (query.includes('send') || query.includes('transfer')) {
    return {
      message: "To send money: Go to Send Money → Enter recipient's number → Enter amount → Confirm with MPIN",
      quickReplies: ['Transaction limits', 'Recipient not found', 'MPIN issues']
    }
  } else if (query.includes('login') || query.includes('sign in')) {
    return {
      message: "Login steps: Enter phone number → Verify OTP → Enter MPIN. Having trouble with any step?",
      quickReplies: ['No OTP received', 'Forgot MPIN', 'Wrong phone number']
    }
  } else if (query.includes('problem') || query.includes('issue') || query.includes('error')) {
    return {
      message: "I can help troubleshoot issues. Common problems include network errors, login issues, or transaction failures. What specific problem are you experiencing?",
      quickReplies: ['App not working', 'Transaction failed', 'Cannot login', 'Speak to agent']
    }
  } else if (query.includes('live agent') || query.includes('talk to agent') || query.includes('human help')) {
    return {
      message: "🔄 I'd like to connect you with a live agent. Our support team can provide personalized assistance with your GCash account.\n\nPlease describe your issue so our agent can better assist you when they join the chat.",
      quickReplies: ['Billing issue', 'Technical problem', 'Account security', 'General inquiry']
    }
  } else {
    return {
      message: "I can help you with account issues, transactions, login problems, and general support. What would you like assistance with?",
      quickReplies: ['Check balance', 'Send money help', 'Login issues', 'Talk to agent']
    }
  }
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Format timestamp
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.chatbot-container {
  position: relative;
}

/* Floating Chat Button */
.floating-chat-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #007DBA, #0056CC);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 125, 186, 0.5);
  transition: all 0.3s ease;
  z-index: 9999;
  
  /* Ensure visibility */
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.floating-chat-btn:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, #0056CC, #007DBA);
}

.chat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: #FF4444;
  border-radius: 50%;
  border: 2px solid white;
}

/* Inline Chat Widget */
.inline-chat-widget {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.chat-header h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
}

.chat-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.quick-action-btn {
  background: linear-gradient(135deg, #007DBA, #0056CC);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-action-btn:hover {
  background: linear-gradient(135deg, #0056CC, #007DBA);
  transform: translateY(-1px);
}

/* Custom Chat Interface */
.custom-chat-interface {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  z-index: 9998;
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
}

.custom-chat-interface.chat-open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  background: linear-gradient(135deg, #007DBA, #0056CC);
  color: white;
  padding: 15px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h3 {
  margin: 0;
  font-size: 16px;
}

.status-indicator {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-indicator.online::before {
  content: '';
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.message {
  margin-bottom: 15px;
}

.message.user-message {
  display: flex;
  justify-content: flex-end;
}

.message.bot-message {
  display: flex;
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 18px;
  position: relative;
}

.user-message .message-content {
  background: linear-gradient(135deg, #007DBA, #0056CC);
  color: white;
}

.bot-message .message-content {
  background: #F1F3F4;
  color: #333;
}

.message-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-line;
}

.timestamp {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  display: block;
}

.quick-replies {
  padding: 0 15px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-reply-btn {
  background: white;
  border: 1px solid #007DBA;
  color: #007DBA;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-reply-btn:hover {
  background: #007DBA;
  color: white;
}

.chat-input {
  padding: 15px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 10px;
}

.message-input {
  flex: 1;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  outline: none;
}

.message-input:focus {
  border-color: #007DBA;
}

.send-btn {
  background: linear-gradient(135deg, #007DBA, #0056CC);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover {
  background: linear-gradient(135deg, #0056CC, #007DBA);
}

/* Mobile Responsiveness */
@media (max-width: 480px) {
  .custom-chat-interface {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
    bottom: 20px;
    right: 20px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
