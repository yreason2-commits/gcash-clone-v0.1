<template>
  <div class="demo-container">
    <div class="demo-header">
      <h2>🤖 Tidio Chatbot Integration Demo</h2>
      <p>Test the GCash Clone chatbot features</p>
    </div>

    <div class="demo-grid">
      <!-- Status Panel -->
      <div class="demo-panel">
        <h3>📊 Status</h3>
        <div class="status-item">
          <span class="label">Tidio Available:</span>
          <span :class="['status', tidioStatus ? 'success' : 'error']">
            {{ tidioStatus ? '✅ Connected' : '❌ Not Available' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">User Authenticated:</span>
          <span :class="['status', isAuthenticated ? 'success' : 'warning']">
            {{ isAuthenticated ? '✅ Yes' : '⚠️ No' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">Chat Mode:</span>
          <span class="mode">{{ tidioStatus ? 'Tidio Widget' : 'Custom Interface' }}</span>
        </div>
      </div>

      <!-- User Context Panel -->
      <div class="demo-panel">
        <h3>👤 User Context</h3>
        <div v-if="isAuthenticated" class="user-info">
          <p><strong>Phone:</strong> {{ userContext.phoneNumber }}</p>
          <p><strong>Balance:</strong> ₱{{ userContext.balance?.toFixed(2) }}</p>
          <p><strong>User ID:</strong> {{ userContext.userId }}</p>
        </div>
        <div v-else class="no-auth">
          <p>🔒 Please authenticate to see user context</p>
        </div>
      </div>

      <!-- Quick Test Actions -->
      <div class="demo-panel">
        <h3>🧪 Quick Tests</h3>
        <div class="test-actions">
          <button @click="testBalance" class="test-btn balance">
            💰 Test Balance Query
          </button>
          <button @click="testTransfer" class="test-btn transfer">
            💸 Test Transfer Help
          </button>
          <button @click="testLogin" class="test-btn login">
            🔐 Test Login Help
          </button>
          <button @click="testProblem" class="test-btn problem">
            ⚠️ Test Problem Report
          </button>
        </div>
      </div>

      <!-- Authentication Simulator -->
      <div class="demo-panel">
        <h3>🔄 Authentication Simulator</h3>
        <div class="auth-controls">
          <div class="phone-input">
            <label>Phone Number:</label>
            <input 
              v-model="testPhone" 
              placeholder="+639123456789"
              type="tel"
            />
          </div>
          <div class="balance-input">
            <label>Test Balance:</label>
            <input 
              v-model="testBalance" 
              placeholder="1500.00"
              type="number"
              step="0.01"
            />
          </div>
          <div class="auth-buttons">
            <button @click="simulateLogin" class="auth-btn login">
              🔓 Simulate Login
            </button>
            <button @click="simulateLogout" class="auth-btn logout">
              🔒 Simulate Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Demo Messages -->
      <div class="demo-panel full-width">
        <h3>💬 Test Responses</h3>
        <div class="test-responses">
          <div v-for="response in testResponses" :key="response.id" class="response-item">
            <div class="response-header">
              <strong>{{ response.query }}</strong>
              <span class="timestamp">{{ formatTime(response.timestamp) }}</span>
            </div>
            <div class="response-content">{{ response.response }}</div>
          </div>
          <div v-if="testResponses.length === 0" class="no-responses">
            Click the test buttons above to see chatbot responses
          </div>
        </div>
      </div>
    </div>

    <!-- Integration with actual ChatBot component -->
    <ChatBot 
      :user-context="userContext"
      display-mode="floating"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import tidioService from '../services/tidioService.js'
import ChatBot from './ChatBot.vue'

// Reactive state
const tidioStatus = ref(false)
const testPhone = ref('+639123456789')
const testBalance = ref(1500.00)
const testResponses = ref([])
const userContext = ref({})

// Computed properties
const isAuthenticated = computed(() => userContext.value.isAuthenticated || false)

// Initialize demo
onMounted(async () => {
  try {
    await tidioService.initialize()
    tidioStatus.value = true
    console.log('Tidio demo initialized successfully')
  } catch (error) {
    console.error('Tidio not available for demo:', error)
    tidioStatus.value = false
  }
})

// Test functions
const testBalance = () => {
  const query = "What's my account balance?"
  const response = isAuthenticated.value 
    ? `Your current balance is ₱${userContext.value.balance?.toFixed(2) || '0.00'}. Is there anything else I can help you with?`
    : "Please log in to view your balance. You can do this by entering your phone number and following the verification steps."
  
  addTestResponse(query, response)
  
  if (tidioStatus.value) {
    tidioService.openChat(query)
  }
}

const testTransfer = () => {
  const query = "How do I send money?"
  const response = `Here's how to send money:
1. Log in to your GCash account
2. Go to 'Send Money'
3. Enter recipient's phone number
4. Enter amount and verify
5. Confirm with your MPIN

Need help with any of these steps?`
  
  addTestResponse(query, response)
  
  if (tidioStatus.value) {
    tidioService.openChat(query)
  }
}

const testLogin = () => {
  const query = "I can't log into my account"
  const response = `Here's how to log in:
1. Enter your registered phone number
2. Enter the OTP code sent to your phone
3. Enter your 4-digit MPIN

Having trouble with any of these steps?`
  
  addTestResponse(query, response)
  
  if (tidioStatus.value) {
    tidioService.openChat(query)
  }
}

const testProblem = () => {
  const query = "I'm having a problem with my transaction"
  const response = `I'm here to help! Please describe your issue and I'll do my best to assist you.

Common issues I can help with:
• Login problems
• Transaction failures
• Balance discrepancies
• App navigation

What specific problem are you experiencing?`
  
  addTestResponse(query, response)
  
  if (tidioStatus.value) {
    tidioService.openChat(query)
  }
}

// Authentication simulation
const simulateLogin = () => {
  const context = {
    phoneNumber: testPhone.value,
    isAuthenticated: true,
    userId: `user_${testPhone.value.replace('+', '')}`,
    name: 'Demo User',
    balance: parseFloat(testBalance.value) || 0,
    lastTransaction: 'Demo transaction'
  }
  
  userContext.value = context
  
  if (tidioStatus.value) {
    tidioService.setUserContext(context)
  }
  
  addTestResponse('🔓 Simulated Login', `User authenticated with phone ${testPhone.value}`)
}

const simulateLogout = () => {
  userContext.value = {}
  
  if (tidioStatus.value) {
    tidioService.setUserContext({})
  }
  
  addTestResponse('🔒 Simulated Logout', 'User logged out, context cleared')
}

// Helper functions
const addTestResponse = (query, response) => {
  testResponses.value.unshift({
    id: Date.now(),
    query,
    response,
    timestamp: new Date()
  })
  
  // Keep only last 10 responses
  if (testResponses.value.length > 10) {
    testResponses.value = testResponses.value.slice(0, 10)
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #007DBA, #0056CC);
  color: white;
  border-radius: 12px;
}

.demo-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.demo-header p {
  margin: 0;
  opacity: 0.9;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.demo-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #E0E0E0;
}

.demo-panel.full-width {
  grid-column: 1 / -1;
}

.demo-panel h3 {
  margin: 0 0 15px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.status.success {
  color: #4CAF50;
  font-weight: 500;
}

.status.error {
  color: #FF4444;
  font-weight: 500;
}

.status.warning {
  color: #FF9800;
  font-weight: 500;
}

.mode {
  color: #007DBA;
  font-weight: 500;
}

.user-info p {
  margin: 8px 0;
  color: #555;
}

.no-auth {
  color: #666;
  text-align: center;
  padding: 20px 0;
}

.test-actions {
  display: grid;
  gap: 10px;
}

.test-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.test-btn.balance {
  background: #E8F5E8;
  color: #2E7D2E;
}

.test-btn.balance:hover {
  background: #D4F4D4;
}

.test-btn.transfer {
  background: #E3F2FD;
  color: #1976D2;
}

.test-btn.transfer:hover {
  background: #BBDEFB;
}

.test-btn.login {
  background: #FFF3E0;
  color: #F57C00;
}

.test-btn.login:hover {
  background: #FFE0B2;
}

.test-btn.problem {
  background: #FFEBEE;
  color: #D32F2F;
}

.test-btn.problem:hover {
  background: #FFCDD2;
}

.auth-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.phone-input, .balance-input {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.phone-input label, .balance-input label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.phone-input input, .balance-input input {
  padding: 8px 12px;
  border: 1px solid #DDD;
  border-radius: 6px;
  font-size: 14px;
}

.phone-input input:focus, .balance-input input:focus {
  outline: none;
  border-color: #007DBA;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.auth-btn {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.auth-btn.login {
  background: #4CAF50;
  color: white;
}

.auth-btn.login:hover {
  background: #45A049;
}

.auth-btn.logout {
  background: #FF5252;
  color: white;
}

.auth-btn.logout:hover {
  background: #F44336;
}

.test-responses {
  max-height: 400px;
  overflow-y: auto;
}

.response-item {
  margin-bottom: 15px;
  padding: 15px;
  background: #F8F9FA;
  border-radius: 8px;
  border-left: 4px solid #007DBA;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.response-header strong {
  color: #333;
  flex: 1;
}

.timestamp {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  margin-left: 10px;
}

.response-content {
  color: #555;
  line-height: 1.5;
  white-space: pre-line;
}

.no-responses {
  text-align: center;
  color: #666;
  padding: 40px 20px;
  font-style: italic;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .demo-grid {
    grid-template-columns: 1fr;
  }
  
  .auth-buttons {
    flex-direction: column;
  }
  
  .demo-container {
    padding: 10px;
  }
  
  .response-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .timestamp {
    margin-left: 0;
  }
}
</style>
