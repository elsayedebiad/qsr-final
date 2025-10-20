import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '@/lib/redis'

// Rate limiting configuration for different endpoints
const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  '/api/auth/login': { requests: 5, window: 300 }, // 5 requests per 5 minutes
  '/api/auth/register': { requests: 3, window: 600 }, // 3 requests per 10 minutes
  '/api/auth/forgot-password': { requests: 3, window: 900 }, // 3 requests per 15 minutes
  
  // Data retrieval - moderate limits
  '/api/cvs': { requests: 100, window: 60 }, // 100 requests per minute
  '/api/contracts': { requests: 100, window: 60 },
  '/api/users': { requests: 50, window: 60 },
  '/api/activity-log': { requests: 30, window: 60 },
  
  // Data modification - stricter limits
  '/api/cvs/create': { requests: 20, window: 60 }, // 20 creates per minute
  '/api/cvs/update': { requests: 50, window: 60 },
  '/api/cvs/delete': { requests: 10, window: 60 },
  '/api/cvs/bulk': { requests: 5, window: 60 }, // 5 bulk operations per minute
  
  // File operations - very strict
  '/api/upload': { requests: 10, window: 300 }, // 10 uploads per 5 minutes
  '/api/export': { requests: 5, window: 300 },
  '/api/download': { requests: 20, window: 300 },
  
  // Search operations
  '/api/search': { requests: 60, window: 60 },
  
  // Statistics and analytics
  '/api/statistics': { requests: 30, window: 60 },
  '/api/analytics': { requests: 20, window: 60 },
  
  // Default for all other endpoints
  default: { requests: 200, window: 60 }, // 200 requests per minute
}

// IP-based rate limiting with user consideration
export async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    
    // Extract identifying information
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const pathname = new URL(request.url).pathname
    
    // Get user ID from token if authenticated
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      try {
        // Extract user ID from JWT token
        const token = authHeader.replace('Bearer ', '')
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        userId = payload.userId || payload.sub || null
      } catch (error) {
        // Invalid token, continue with IP-based limiting
      }
    }
    
    // Determine rate limit configuration
    let rateConfig = RATE_LIMITS.default
    
    // Find matching rate limit configuration
    for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
      if (pathname.startsWith(pattern)) {
        rateConfig = config
        break
      }
    }
    
    // Create identifier (user-based if authenticated, IP-based otherwise)
    const identifier = userId ? `user:${userId}` : `ip:${ip}`
    const key = `${pathname}:${identifier}`
    
    // Check rate limit
    const allowed = await RateLimiter.checkLimit(
      key,
      rateConfig.requests,
      rateConfig.window
    )
    
    if (!allowed) {
      // Get remaining time and requests
      const remaining = await RateLimiter.getRemainingRequests(
        key,
        rateConfig.requests
      )
      
      // Log rate limit violation
      console.warn(`Rate limit exceeded for ${identifier} on ${pathname}`)
      
      // Return rate limit error response
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateConfig.window,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateConfig.requests),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(Date.now() + (rateConfig.window * 1000)),
            'Retry-After': String(rateConfig.window),
          },
        }
      )
    }
    
    // Add rate limit headers to successful responses
    const remaining = await RateLimiter.getRemainingRequests(
      key,
      rateConfig.requests
    )
    
    // Continue with the request but add headers
    return null // null means continue processing
    
  } catch (error) {
    console.error('Rate limiting error:', error)
    // On error, allow the request to prevent blocking legitimate users
    return null
  }
}

// Advanced rate limiting with different tiers
export class TieredRateLimiter {
  private static tiers = {
    FREE: { multiplier: 1 },
    BASIC: { multiplier: 2 },
    PRO: { multiplier: 5 },
    ENTERPRISE: { multiplier: 10 },
    ADMIN: { multiplier: 100 },
  }
  
  static async checkTieredLimit(
    userId: string,
    userTier: keyof typeof TieredRateLimiter.tiers,
    endpoint: string
  ): Promise<boolean> {
    // Get base limit for endpoint
    let baseConfig = RATE_LIMITS.default
    for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
      if (endpoint.startsWith(pattern)) {
        baseConfig = config
        break
      }
    }
    
    // Apply tier multiplier
    const tierMultiplier = this.tiers[userTier]?.multiplier || 1
    const adjustedLimit = baseConfig.requests * tierMultiplier
    
    // Check limit with adjusted values
    const key = `tiered:${endpoint}:${userId}`
    return await RateLimiter.checkLimit(key, adjustedLimit, baseConfig.window)
  }
}

// Distributed rate limiting for microservices
export class DistributedRateLimiter {
  private static async getGlobalCount(key: string): Promise<number> {
    // This would connect to a central Redis cluster in production
    const count = await RateLimiter.getRemainingRequests(key, Number.MAX_SAFE_INTEGER)
    return Number.MAX_SAFE_INTEGER - count
  }
  
  static async checkGlobalLimit(
    service: string,
    identifier: string,
    limit: number,
    window: number
  ): Promise<boolean> {
    const key = `global:${service}:${identifier}`
    return await RateLimiter.checkLimit(key, limit, window)
  }
}

// Sliding window rate limiter for more accurate limiting
export class SlidingWindowRateLimiter {
  static async checkSlidingLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - windowMs
    const key = `sliding:${identifier}`
    
    // This would require a more complex Redis implementation
    // For now, using the basic rate limiter
    return await RateLimiter.checkLimit(key, limit, Math.floor(windowMs / 1000))
  }
}

// API key based rate limiting
export class ApiKeyRateLimiter {
  static async checkApiKeyLimit(apiKey: string, endpoint: string): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    // Get API key configuration from database
    // This is a simplified example
    const keyConfig = {
      limit: 1000,
      window: 3600, // 1 hour
    }
    
    const key = `apikey:${apiKey}:${endpoint}`
    const allowed = await RateLimiter.checkLimit(key, keyConfig.limit, keyConfig.window)
    const remaining = await RateLimiter.getRemainingRequests(key, keyConfig.limit)
    
    return {
      allowed,
      limit: keyConfig.limit,
      remaining,
      reset: Date.now() + (keyConfig.window * 1000),
    }
  }
}

// Export middleware function for Next.js
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  const response = await rateLimit(request)
  if (response) {
    return response
  }
  
  // Add rate limit headers to the response
  const headers = new Headers()
  headers.set('X-RateLimit-Policy', 'sliding-window')
  
  return undefined
}

export default rateLimit
