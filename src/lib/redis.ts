import { Redis } from 'ioredis'

// Redis Configuration for High Performance
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  
  // Performance optimizations
  enableOfflineQueue: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Connection pool settings
  connectionPoolSize: 50,
  
  // Retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  }
}

class RedisClient {
  private static instance: Redis | null = null
  
  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(REDIS_CONFIG)
      
      this.instance.on('error', (error) => {
        console.error('Redis Client Error:', error)
      })
      
      this.instance.on('connect', () => {
        console.log('✅ Redis Connected Successfully')
      })
    }
    
    return this.instance
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance()

// Cache utilities
export class CacheManager {
  private static DEFAULT_TTL = 300 // 5 minutes
  
  // Generic cache getter with fallback
  static async get<T>(
    key: string, 
    fallback?: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      
      if (cached) {
        return JSON.parse(cached) as T
      }
      
      if (fallback) {
        const data = await fallback()
        await this.set(key, data, ttl)
        return data
      }
      
      return null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return fallback ? await fallback() : null
    }
  }
  
  // Generic cache setter
  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }
  
  // Delete cache
  static async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        await redis.del(...key)
      } else {
        await redis.del(key)
      }
    } catch (error) {
      console.error(`Cache delete error:`, error)
    }
  }
  
  // Clear cache by pattern
  static async clearByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error(`Cache clear by pattern error:`, error)
    }
  }
  
  // Cache for CV data
  static async getCVs(status?: string): Promise<any[]> {
    const key = `cvs:${status || 'all'}`
    return await this.get(key) || []
  }
  
  static async setCVs(cvs: any[], status?: string): Promise<void> {
    const key = `cvs:${status || 'all'}`
    await this.set(key, cvs, 60) // 1 minute cache for CVs
  }
  
  // Cache for user sessions
  static async getUserSession(userId: number): Promise<any> {
    const key = `session:user:${userId}`
    return await this.get(key)
  }
  
  static async setUserSession(userId: number, session: any): Promise<void> {
    const key = `session:user:${userId}`
    await this.set(key, session, 3600) // 1 hour cache for sessions
  }
  
  // Cache for statistics
  static async getStatistics(type: string): Promise<any> {
    const key = `stats:${type}`
    return await this.get(key)
  }
  
  static async setStatistics(type: string, stats: any): Promise<void> {
    const key = `stats:${type}`
    await this.set(key, stats, 120) // 2 minutes cache for stats
  }
}

// Rate limiting using Redis
export class RateLimiter {
  static async checkLimit(
    identifier: string, 
    maxRequests: number = 100, 
    windowSeconds: number = 60
  ): Promise<boolean> {
    const key = `rate_limit:${identifier}`
    
    try {
      const current = await redis.incr(key)
      
      if (current === 1) {
        await redis.expire(key, windowSeconds)
      }
      
      return current <= maxRequests
    } catch (error) {
      console.error('Rate limit check error:', error)
      return true // Allow on error to prevent blocking
    }
  }
  
  static async getRemainingRequests(
    identifier: string, 
    maxRequests: number = 100
  ): Promise<number> {
    const key = `rate_limit:${identifier}`
    
    try {
      const current = await redis.get(key)
      const used = current ? parseInt(current) : 0
      return Math.max(0, maxRequests - used)
    } catch (error) {
      console.error('Get remaining requests error:', error)
      return maxRequests
    }
  }
}

// Session manager using Redis
export class SessionManager {
  private static SESSION_TTL = 86400 // 24 hours
  
  static async createSession(userId: number, token: string, data: any): Promise<void> {
    const key = `session:${token}`
    const sessionData = {
      userId,
      ...data,
      createdAt: new Date().toISOString()
    }
    
    await redis.setex(key, this.SESSION_TTL, JSON.stringify(sessionData))
    
    // Also store user's active sessions
    const userSessionsKey = `user_sessions:${userId}`
    await redis.sadd(userSessionsKey, token)
    await redis.expire(userSessionsKey, this.SESSION_TTL)
  }
  
  static async getSession(token: string): Promise<any | null> {
    const key = `session:${token}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }
  
  static async deleteSession(token: string): Promise<void> {
    const session = await this.getSession(token)
    
    if (session) {
      await redis.del(`session:${token}`)
      
      // Remove from user's sessions
      const userSessionsKey = `user_sessions:${session.userId}`
      await redis.srem(userSessionsKey, token)
    }
  }
  
  static async getUserSessions(userId: number): Promise<string[]> {
    const key = `user_sessions:${userId}`
    return await redis.smembers(key)
  }
}

// Queue manager for heavy operations
export class QueueManager {
  static async addJob(queue: string, data: any): Promise<void> {
    const key = `queue:${queue}`
    await redis.rpush(key, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }))
  }
  
  static async getJob(queue: string): Promise<any | null> {
    const key = `queue:${queue}`
    const data = await redis.lpop(key)
    return data ? JSON.parse(data) : null
  }
  
  static async getQueueLength(queue: string): Promise<number> {
    const key = `queue:${queue}`
    return await redis.llen(key)
  }
}

export default redis
