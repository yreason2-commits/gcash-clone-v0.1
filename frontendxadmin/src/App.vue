<script setup>
import AdminDashboard from './components/AdminDashboard.vue'
import { onMounted } from 'vue'

// Set document title for admin dashboard
onMounted(() => {
  document.title = 'GCash Clone Dashboard - Registration Monitor'
  
  // Add any admin-specific initialization here
  console.log('🔐 GCash Clone Dashboard v1.0.0 initialized')
  console.log('🌐 Backend API:', import.meta.env.VITE_API_URL || 'https://gcash-clone-v0-1.onrender.com')
})
</script>

<template>
  <div class="admin-app">
    <AdminDashboard />
  </div>
</template>

<style>
/* Import Inter font for better typography */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Global admin dashboard styles */
html, body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

*, *:before, *:after {
  box-sizing: inherit;
}

.admin-app {
  min-height: 100vh;
  width: 100%;
}
</style>
