<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  phoneNumber: {
    type: String,
    default: '+63998****941',
  },
})

const emit = defineEmits(['verify', 'resend'])

const code = ref(['', '', '', '', '', ''])
const inputRefs = ref([])
const isSubmitting = ref(false)
const message = ref('')
const DEMO_OTP = '123456'

const maskPhoneNumber = (phone) => {
  if (!phone) return '+63998****941'
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  let phoneDigits = cleaned
  let dialCode = '+63'
  
  // If it starts with country code (63), extract it
  if (cleaned.startsWith('63') && cleaned.length >= 12) {
    phoneDigits = cleaned.slice(2) // Remove '63' prefix, leaving 10 digits
  } else if (cleaned.length === 10) {
    // If it's just 10 digits, assume +63 prefix
    phoneDigits = cleaned
  } else {
    // Fallback: try to extract if format is different
    return phone
  }
  
  // Extract first 3 digits and last 3 digits
  const first3 = phoneDigits.slice(0, 3)
  const last3 = phoneDigits.slice(-3)
  
  return `${dialCode}${first3}****${last3}`
}

const maskedPhone = computed(() => maskPhoneNumber(props.phoneNumber))

const handleInput = (index, event) => {
  const value = event.target.value.replace(/\D/g, '').slice(0, 1)
  code.value[index] = value

  if (value && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }

  if (code.value.every((digit) => digit !== '')) {
    handleVerify()
  }
}

const handleKeydown = (index, event) => {
  if (event.key === 'Backspace' && !code.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (event) => {
  event.preventDefault()
  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  pasted.split('').forEach((digit, i) => {
    if (i < 6) {
      code.value[i] = digit
    }
  })
  if (pasted.length === 6) {
    inputRefs.value[5]?.focus()
    handleVerify()
  } else if (pasted.length > 0) {
    inputRefs.value[Math.min(pasted.length, 5)]?.focus()
  }
}

const handleVerify = () => {
  const otpCode = code.value.join('')
  if (otpCode.length === 6 && !isSubmitting.value) {
    isSubmitting.value = true

    if (otpCode !== DEMO_OTP) {
      message.value = 'Incorrect demo code. Please try 123456.'
      isSubmitting.value = false
      return
    }

    message.value = ''
    emit('verify')
    isSubmitting.value = false
  }
}

const handleResend = () => {
  code.value = ['', '', '', '', '', '']
  message.value = `Demo code: ${DEMO_OTP}. No SMS is sent.`
  inputRefs.value[0]?.focus()
  emit('resend')
}

onMounted(() => {
  inputRefs.value[0]?.focus()
})
</script>

<template>
  <div class="otp-screen">
    <header class="auth-header">
      <h1>Authentication</h1>
    </header>

    <div class="otp-card">
      <h2 class="verify-title">Verify with Text Message</h2>

      <div class="instruction-text">
        <p>Demo mode: no text message is sent.</p>
        <p>Enter the test code shown below.</p>
      </div>

      <div class="phone-display">{{ maskedPhone }}</div>

      <p class="demo-code">Demo code: <strong>123456</strong></p>
      <p class="input-prompt">Please enter the authentication code</p>

      <div class="otp-inputs" @paste="handlePaste">
        <input
          v-for="(digit, index) in code"
          :key="index"
          ref="inputRefs"
          v-model="code[index]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="otp-input"
          :class="{ filled: code[index] }"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
        />
      </div>

      <div class="resend-section">
        <p v-if="message" class="demo-message" role="status">{{ message }}</p>
        <button type="button" class="resend-link" @click="handleResend">Show demo code again</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.otp-screen {
  min-height: 100vh;
  background: #007bff;
  display: flex;
  flex-direction: column;
  font-family: 'Nunito Sans', 'Poppins', 'Helvetica Neue', Arial, sans-serif;
}

.auth-header {
  background: #007bff;
  padding: 1.25rem 1rem;
  text-align: center;
}

.auth-header h1 {
  margin: 0;
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.otp-card {
  flex: 1;
  background: #ffffff;
  margin-top: 0;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.verify-title {
  margin: 0;
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
}

.instruction-text {
  text-align: center;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.instruction-text p {
  margin: 0;
}

.phone-display {
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.05em;
  margin: 0.5rem 0;
}

.input-prompt {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
}

.demo-code,
.demo-message {
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
  text-align: center;
}

.otp-inputs {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  width: 100%;
  max-width: 320px;
}

.otp-input {
  width: 48px;
  height: 56px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  transition: all 0.2s ease;
  outline: none;
}

.otp-input:focus {
  border-color: #1f7bff;
  box-shadow: 0 0 0 3px rgba(31, 123, 255, 0.1);
}

.otp-input.filled {
  border-color: #1f7bff;
  background: #f8fafc;
}

.resend-section {
  text-align: center;
  margin-top: 0.5rem;
}

.resend-text {
  color: #475569;
  font-size: 0.9rem;
}

.resend-link {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: color 0.2s ease;
}

.resend-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.resend-link:active {
  color: #1d4ed8;
}

@media (max-width: 420px) {
  .otp-card {
    padding: 2rem 1.25rem;
    gap: 1.25rem;
  }

  .verify-title {
    font-size: 1.35rem;
  }

  .phone-display {
    font-size: 1.25rem;
  }

  .otp-inputs {
    gap: 0.6rem;
  }

  .otp-input {
    width: 44px;
    height: 52px;
    font-size: 1.4rem;
  }
}
</style>

