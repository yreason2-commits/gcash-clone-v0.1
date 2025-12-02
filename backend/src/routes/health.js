const express = require('express');
const router = express.Router();

// Store server start time
const serverStartTime = new Date();

/**
 * Health check endpoint for keep-alive pings
 * GET /api/health
 */
router.get('/', (req, res) => {
  const uptime = process.uptime();
  const uptimeFormatted = formatUptime(uptime);
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptimeFormatted,
    uptimeSeconds: Math.floor(uptime),
    serverStartTime: serverStartTime.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // You can add actual DB health check here
    message: 'GCash Backend is running smoothly'
  });
});

/**
 * Detailed system info endpoint
 * GET /api/health/detailed
 */
router.get('/detailed', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptime),
    uptimeSeconds: Math.floor(uptime),
    serverStartTime: serverStartTime.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    },
    database: 'connected', // Add actual DB status check if needed
    lastPing: new Date(),
    message: 'GCash Backend - Detailed System Information'
  });
});

/**
 * Simple ping endpoint
 * GET /api/health/ping
 */
router.get('/ping', (req, res) => {
  res.json({
    status: 'pong',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

module.exports = router;
