#!/usr/bin/env node

/**
 * Standalone Backend Keep-Alive Script
 * Run this script to prevent Render.com backend from sleeping
 * Usage: node scripts/keep-backend-alive.js
 */

const https = require('https');
const http = require('http');

class BackendKeepAlive {
  constructor(backendUrl) {
    this.backendUrl = backendUrl || 'https://your-backend-name.onrender.com';
    this.interval = 10 * 60 * 1000; // 10 minutes
    this.isRunning = false;
    this.timeoutId = null;
  }

  start() {
    console.log('🚀 Starting Backend Keep-Alive Service');
    console.log(`📡 Target: ${this.backendUrl}`);
    console.log(`⏰ Interval: Every 10 minutes`);
    console.log('─'.repeat(50));

    this.isRunning = true;
    this.ping(); // Immediate first ping
    this.scheduleNext();
  }

  stop() {
    console.log('\n🛑 Stopping Backend Keep-Alive Service');
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  ping() {
    const startTime = Date.now();
    const url = new URL(`${this.backendUrl}/api/health`);
    const client = url.protocol === 'https:' ? https : http;

    console.log(`📡 [${new Date().toLocaleTimeString()}] Pinging backend...`);

    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log(`✅ Success (${responseTime}ms) - Uptime: ${response.uptime || 'N/A'}`);
            
            if (responseTime > 5000) {
              console.log('🐌 Slow response - backend may have been sleeping');
            }
          } catch (e) {
            console.log(`✅ Success (${responseTime}ms) - Response received`);
          }
        } else {
          console.log(`⚠️  HTTP ${res.statusCode} (${responseTime}ms)`);
        }
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.log(`❌ Error (${responseTime}ms): ${error.message}`);
    });

    req.setTimeout(30000, () => {
      console.log('⏰ Request timeout (30s)');
      req.destroy();
    });
  }

  scheduleNext() {
    if (!this.isRunning) return;

    this.timeoutId = setTimeout(() => {
      this.ping();
      this.scheduleNext();
    }, this.interval);
  }
}

// Handle script execution
if (require.main === module) {
  const backendUrl = process.argv[2] || process.env.BACKEND_URL;
  
  if (!backendUrl) {
    console.error('❌ Backend URL required!');
    console.log('Usage: node keep-backend-alive.js <backend-url>');
    console.log('Example: node keep-backend-alive.js https://gcash-backend.onrender.com');
    process.exit(1);
  }

  const keepAlive = new BackendKeepAlive(backendUrl);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    keepAlive.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    keepAlive.stop();
    process.exit(0);
  });

  keepAlive.start();
}

module.exports = BackendKeepAlive;
