/**
 * Backend Keep-Alive Service
 * Prevents Render.com free tier from sleeping by pinging every 13 minutes
 * Persistent across page refreshes using localStorage
 */

class KeepAliveService {
  constructor() {
    this.backendUrl = import.meta.env.VITE_API_URL || 'https://gcash-clone-v0-1.onrender.com'
    this.interval = null
    this.pingInterval = 13 * 60 * 1000 // 13 minutes in milliseconds
    this.isActive = false
    this.lastPingTime = null
    this.consecutiveFailures = 0
    this.maxFailures = 3
    this.storageKey = 'gcash_keepalive_timer'
    
    // Load persistent state from localStorage
    this.loadState()
  }

  /**
   * Load persistent timer state from localStorage
   */
  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.lastPingTime = data.lastPingTime ? new Date(data.lastPingTime) : null
        this.consecutiveFailures = data.consecutiveFailures || 0
      }
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Save persistent timer state to localStorage
   */
  saveState() {
    try {
      const data = {
        lastPingTime: this.lastPingTime?.toISOString(),
        consecutiveFailures: this.consecutiveFailures
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Start the keep-alive service with intelligent timing
   */
  start() {
    if (this.isActive) {
      return // Already running
    }

    this.isActive = true
    
    // Calculate time since last ping
    const now = Date.now()
    const timeSinceLastPing = this.lastPingTime ? now - this.lastPingTime.getTime() : this.pingInterval + 1

    // Only ping if it's been more than 13 minutes since last ping
    if (timeSinceLastPing >= this.pingInterval) {
      // Time to ping immediately
      this.ping()
      this.scheduleNextPing()
    } else {
      // Schedule next ping based on remaining time
      const remainingTime = this.pingInterval - timeSinceLastPing
      
      setTimeout(() => {
        this.ping()
        this.scheduleNextPing()
      }, remainingTime)
    }
  }

  /**
   * Schedule the next ping interval
   */
  scheduleNextPing() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    
    this.interval = setInterval(() => {
      this.ping()
    }, this.pingInterval)
  }

  /**
   * Stop the keep-alive service
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isActive = false
    // Save final state
    this.saveState()
  }

  /**
   * Ping the backend to keep it alive (silent mode)
   */
  async ping() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(`${this.backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        this.lastPingTime = new Date()
        this.consecutiveFailures = 0
        this.saveState() // Save successful ping time
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      this.consecutiveFailures++
      this.saveState() // Save failure count
      
      // If too many failures, stop the service to avoid spam
      if (this.consecutiveFailures >= this.maxFailures) {
        this.stop()
      }
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      backendUrl: this.backendUrl,
      lastPingTime: this.lastPingTime,
      consecutiveFailures: this.consecutiveFailures,
      nextPingIn: this.isActive ? this.pingInterval - (Date.now() - (this.lastPingTime?.getTime() || 0)) : null
    }
  }

  /**
   * Manual ping (for testing) - shows debug info
   */
  async testPing() {
    console.log('🧪 Manual backend ping test')
    const startTime = Date.now()
    await this.ping()
    console.log(`Test ping completed in ${Date.now() - startTime}ms`)
    console.log('Status:', this.getStatus())
  }
}

// Create and export singleton instance
const keepAliveService = new KeepAliveService()

export default keepAliveService
