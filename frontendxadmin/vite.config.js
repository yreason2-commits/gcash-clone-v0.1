import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 5174 // Different port to avoid conflicts with main frontend
  }
})
