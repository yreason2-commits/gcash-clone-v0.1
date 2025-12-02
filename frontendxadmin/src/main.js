import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Create and mount the admin dashboard app
const app = createApp(App)

// Global error handler for admin dashboard
app.config.errorHandler = (error, instance, info) => {
  console.error('Admin Dashboard Error:', error)
  console.error('Component:', instance)
  console.error('Info:', info)
  
  // You could send errors to a logging service here
}

// Global properties for admin dashboard
app.config.globalProperties.$adminVersion = '1.0.0'

app.mount('#app')
