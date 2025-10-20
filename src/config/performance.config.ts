// Performance configuration for 5000+ concurrent users
export const PERFORMANCE_CONFIG = {
  // Database settings
  database: {
    // Connection pool
    connectionPool: {
      max: process.env.NODE_ENV === 'production' ? 100 : 20,
      min: process.env.NODE_ENV === 'production' ? 20 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      maxUses: 7500,
    },
    
    // Query optimization
    queryTimeout: 30000, // 30 seconds
    statementTimeout: 30000,
    slowQueryThreshold: 1000, // Log queries slower than 1 second
    
    // Batch operations
    batchSize: 100,
    maxBatchSize: 1000,
  },
  
  // Redis cache settings
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    connectionPoolSize: 50,
    
    // Cache TTL (in seconds)
    ttl: {
      default: 300, // 5 minutes
      user: 3600, // 1 hour
      cv: 60, // 1 minute
      statistics: 120, // 2 minutes
      session: 86400, // 24 hours
      image: 86400, // 24 hours
    },
    
    // Key prefixes
    keyPrefix: {
      cache: 'cache:',
      session: 'session:',
      rateLimit: 'rate:',
      queue: 'queue:',
      lock: 'lock:',
    },
  },
  
  // Rate limiting
  rateLimit: {
    // Global limits
    global: {
      windowMs: 60000, // 1 minute
      maxRequests: 1000,
    },
    
    // Per-endpoint limits
    endpoints: {
      auth: { requests: 5, window: 300 },
      api: { requests: 200, window: 60 },
      upload: { requests: 10, window: 300 },
      export: { requests: 5, window: 300 },
    },
    
    // User tiers
    tiers: {
      free: { multiplier: 1 },
      basic: { multiplier: 2 },
      pro: { multiplier: 5 },
      enterprise: { multiplier: 10 },
      admin: { multiplier: 100 },
    },
  },
  
  // Image optimization
  images: {
    maxWidth: 1920,
    maxHeight: 1080,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    
    quality: {
      jpeg: 85,
      webp: 80,
      png: 9,
    },
    
    sizes: {
      thumbnail: { width: 150, height: 150 },
      small: { width: 320 },
      medium: { width: 768 },
      large: { width: 1024 },
      xlarge: { width: 1920 },
    },
    
    formats: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'],
  },
  
  // Job queue
  queue: {
    // Processing intervals
    processInterval: 1000, // Check for jobs every second
    
    // Job settings
    maxAttempts: 3,
    retryDelay: 1000, // Base retry delay
    maxRetryDelay: 30000, // Maximum retry delay
    
    // Batch sizes per priority
    batchSizes: {
      urgent: 5,
      high: 3,
      normal: 2,
      low: 1,
    },
    
    // Concurrency limits
    concurrency: {
      imageProcessing: 5,
      export: 3,
      email: 10,
      import: 2,
    },
  },
  
  // Pagination
  pagination: {
    defaultLimit: 50,
    maxLimit: 200,
    cursorBased: true, // Use cursor-based pagination for large datasets
  },
  
  // Session management
  session: {
    ttl: 86400, // 24 hours
    maxSessions: 5, // Maximum sessions per user
    slidingExpiration: true,
    cookieSecure: process.env.NODE_ENV === 'production',
    cookieSameSite: 'lax' as const,
  },
  
  // API response
  api: {
    maxResponseSize: 10 * 1024 * 1024, // 10MB
    compression: true,
    compressionThreshold: 1024, // Compress responses > 1KB
    
    // CORS settings
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      maxAge: 86400,
    },
  },
  
  // Monitoring and logging
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60000, // Collect metrics every minute
    
    // Performance thresholds
    thresholds: {
      responseTime: 1000, // Warn if response > 1 second
      errorRate: 0.01, // Warn if error rate > 1%
      memoryUsage: 0.9, // Warn if memory > 90%
      cpuUsage: 0.8, // Warn if CPU > 80%
    },
    
    // Logging levels
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    logSlowQueries: true,
    logRateLimits: true,
  },
  
  // Clustering
  clustering: {
    enabled: process.env.NODE_ENV === 'production',
    workers: process.env.WORKER_COUNT ? parseInt(process.env.WORKER_COUNT) : 'auto',
    restartDelay: 3000,
    maxRestarts: 10,
  },
  
  // Load balancing
  loadBalancing: {
    enabled: process.env.NODE_ENV === 'production',
    strategy: 'round-robin' as const, // round-robin, least-connections, ip-hash
    healthCheckInterval: 30000,
    healthCheckTimeout: 5000,
  },
  
  // CDN configuration
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    url: process.env.CDN_URL || '',
    
    // Asset optimization
    assets: {
      minify: true,
      bundle: true,
      compress: true,
      cache: true,
    },
    
    // Cache headers
    cacheControl: {
      static: 'public, max-age=31536000, immutable', // 1 year
      images: 'public, max-age=86400, s-maxage=31536000', // 1 day client, 1 year CDN
      api: 'private, no-cache, no-store, must-revalidate',
    },
  },
  
  // Security
  security: {
    // DDOS protection
    ddosProtection: {
      enabled: true,
      maxRequestsPerIp: 1000,
      windowMs: 60000,
      blockDuration: 3600000, // 1 hour
    },
    
    // Request validation
    maxRequestSize: '10mb',
    maxUrlLength: 2048,
    maxParameterCount: 100,
    
    // Headers
    headers: {
      hsts: true,
      noSniff: true,
      xssProtection: true,
      frameOptions: 'DENY',
      contentSecurityPolicy: true,
    },
  },
  
  // Optimization flags
  features: {
    enableRedisCache: process.env.REDIS_ENABLED !== 'false',
    enableJobQueue: process.env.JOB_QUEUE_ENABLED !== 'false',
    enableRateLimiting: process.env.RATE_LIMIT_ENABLED !== 'false',
    enableCompression: process.env.COMPRESSION_ENABLED !== 'false',
    enableClustering: process.env.CLUSTERING_ENABLED === 'true',
    enableMetrics: process.env.METRICS_ENABLED !== 'false',
    enableProfiling: process.env.PROFILING_ENABLED === 'true',
  },
}

// Helper function to get nested config value
export function getConfig(path: string, defaultValue: any = undefined): any {
  const keys = path.split('.')
  let value: any = PERFORMANCE_CONFIG
  
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) {
      return defaultValue
    }
  }
  
  return value
}

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  PERFORMANCE_CONFIG.database.connectionPool.max = 200
  PERFORMANCE_CONFIG.redis.connectionPoolSize = 100
  PERFORMANCE_CONFIG.queue.concurrency.imageProcessing = 10
  PERFORMANCE_CONFIG.api.compression = true
  PERFORMANCE_CONFIG.cdn.enabled = true
} else if (process.env.NODE_ENV === 'test') {
  // Test environment settings
  PERFORMANCE_CONFIG.database.connectionPool.max = 5
  PERFORMANCE_CONFIG.redis.connectionPoolSize = 5
  PERFORMANCE_CONFIG.rateLimit.global.maxRequests = 10000
  PERFORMANCE_CONFIG.features.enableRateLimiting = false
}

export default PERFORMANCE_CONFIG
