import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// Optimized Prisma Configuration for High Performance
declare global {
  var prisma: PrismaClient | undefined
  var pgPool: Pool | undefined
}

// Connection pool configuration for 5000+ users
const CONNECTION_POOL_CONFIG = {
  // Maximum number of connections
  max: process.env.NODE_ENV === 'production' ? 100 : 20,
  
  // Minimum number of connections
  min: process.env.NODE_ENV === 'production' ? 20 : 5,
  
  // Connection timeout in milliseconds
  connectionTimeoutMillis: 10000,
  
  // Idle timeout before closing connection
  idleTimeoutMillis: 30000,
  
  // Maximum uses for a single connection
  maxUses: 7500,
  
  // Allow exit on idle
  allowExitOnIdle: true,
}

// PostgreSQL connection pool for raw queries
const createPgPool = () => {
  if (!global.pgPool) {
    global.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: CONNECTION_POOL_CONFIG.max,
      min: CONNECTION_POOL_CONFIG.min,
      idleTimeoutMillis: CONNECTION_POOL_CONFIG.idleTimeoutMillis,
      connectionTimeoutMillis: CONNECTION_POOL_CONFIG.connectionTimeoutMillis,
      
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      
      // Statement timeout to prevent long-running queries
      statement_timeout: 30000,
      
      // Query timeout
      query_timeout: 30000,
      
      // Keep alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
    
    // Pool event handlers
    global.pgPool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
    
    global.pgPool.on('connect', () => {
      console.log('New client connected to pool')
    })
    
    global.pgPool.on('acquire', () => {
      console.log('Client acquired from pool')
    })
    
    global.pgPool.on('remove', () => {
      console.log('Client removed from pool')
    })
  }
  
  return global.pgPool
}

// Create optimized Prisma client
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }
  
  // Parse and optimize connection string
  const url = new URL(databaseUrl)
  
  // Add connection pool parameters
  url.searchParams.set('connection_limit', String(CONNECTION_POOL_CONFIG.max))
  url.searchParams.set('pool_timeout', String(CONNECTION_POOL_CONFIG.connectionTimeoutMillis / 1000))
  url.searchParams.set('connect_timeout', String(CONNECTION_POOL_CONFIG.connectionTimeoutMillis / 1000))
  url.searchParams.set('statement_cache_size', '100')
  url.searchParams.set('pgbouncer', 'true')
  
  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    
    // Logging configuration for production
    log: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn']
      : ['query', 'error', 'warn'],
    
    // Error formatting
    errorFormat: 'minimal',
  })
}

// Singleton Prisma instance with connection management
class PrismaService {
  private static instance: PrismaClient | null = null
  private static connectPromise: Promise<void> | null = null
  
  static async getInstance(): Promise<PrismaClient> {
    if (!this.instance) {
      this.instance = createPrismaClient()
      
      // Ensure connection is established
      if (!this.connectPromise) {
        this.connectPromise = this.instance.$connect()
      }
      await this.connectPromise
      
      // Add middleware for query optimization
      this.instance.$use(async (params, next) => {
        const before = Date.now()
        const result = await next(params)
        const after = Date.now()
        
        // Log slow queries
        if (after - before > 1000) {
          console.warn(`Slow query detected: ${params.model}.${params.action} took ${after - before}ms`)
        }
        
        return result
      })
    }
    
    return this.instance
  }
  
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect()
      this.instance = null
      this.connectPromise = null
    }
  }
}

// Export optimized database connections
export const db = global.prisma || createPrismaClient()
export const pgPool = createPgPool()

// Connection health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  poolSize: number
  activeConnections: number
  idleConnections: number
  waitingClients: number
}> {
  try {
    // Test Prisma connection
    await db.$queryRaw`SELECT 1`
    
    // Get pool stats
    const poolStats = {
      poolSize: pgPool.totalCount,
      activeConnections: pgPool.totalCount - pgPool.idleCount,
      idleConnections: pgPool.idleCount,
      waitingClients: pgPool.waitingCount,
    }
    
    return {
      healthy: true,
      ...poolStats,
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      healthy: false,
      poolSize: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
    }
  }
}

// Query optimization utilities
export class QueryOptimizer {
  // Batch operations for better performance
  static async batchCreate<T>(
    model: any,
    data: T[],
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      await model.createMany({
        data: batch,
        skipDuplicates: true,
      })
    }
  }
  
  // Optimized pagination
  static async paginate<T>(
    model: any,
    options: {
      page: number
      limit: number
      where?: any
      orderBy?: any
      include?: any
    }
  ): Promise<{
    data: T[]
    total: number
    pages: number
    currentPage: number
  }> {
    const { page = 1, limit = 50, where = {}, orderBy = {}, include = {} } = options
    const skip = (page - 1) * limit
    
    // Execute count and data queries in parallel
    const [total, data] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        orderBy,
        include,
        skip,
        take: limit,
      }),
    ])
    
    return {
      data,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }
  
  // Cursor-based pagination for large datasets
  static async cursorPaginate<T>(
    model: any,
    options: {
      cursor?: any
      limit?: number
      where?: any
      orderBy?: any
    }
  ): Promise<{
    data: T[]
    nextCursor?: any
    hasMore: boolean
  }> {
    const { cursor, limit = 50, where = {}, orderBy = { id: 'desc' } } = options
    
    const queryOptions: any = {
      where,
      orderBy,
      take: limit + 1, // Fetch one extra to determine if there's more
    }
    
    if (cursor) {
      queryOptions.cursor = { id: cursor }
      queryOptions.skip = 1 // Skip the cursor item
    }
    
    const items = await model.findMany(queryOptions)
    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, -1) : items
    const nextCursor = hasMore ? data[data.length - 1].id : undefined
    
    return {
      data,
      nextCursor,
      hasMore,
    }
  }
}

// Transaction helper for complex operations
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.$transaction(callback, {
    maxWait: 5000, // Maximum time to wait for a transaction slot
    timeout: 30000, // Maximum time for the transaction to complete
    isolationLevel: 'ReadCommitted', // Isolation level for consistency
  })
}

// In development, preserve the global instance
if (process.env.NODE_ENV !== 'production') {
  global.prisma = db
}

// Export utilities
export { PrismaService }
export default db
