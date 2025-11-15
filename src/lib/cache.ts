// ملف Cache بسيط للذاكرة لتحسين الأداء
// يقلل الاستعلامات المتكررة لقاعدة البيانات

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
    
    // تنظيف الذاكرة كل 5 دقائق
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  set<T>(key: string, data: T, ttl: number = 60000): void {
    // إذا وصلنا للحد الأقصى، احذف أقدم عنصر
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // تحقق من انتهاء الصلاحية
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // حذف جميع المفاتيح التي تبدأ بنمط معين
  deletePattern(pattern: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // تنظيف العناصر المنتهية
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // الحصول على حجم الذاكرة المستخدمة
  getSize(): number {
    return this.cache.size
  }

  // دالة مساعدة للحصول أو التعيين
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60000
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }
}

// إنشاء instance واحد يستخدم في كل التطبيق
export const cache = new MemoryCache(2000)

// مفاتيح Cache محددة مسبقاً
export const CACHE_KEYS = {
  // CVs
  ALL_CVS: 'cvs:all',
  CV_BY_ID: (id: number) => `cvs:${id}`,
  CV_STATISTICS: 'cvs:statistics',
  
  // Contracts
  ALL_CONTRACTS: 'contracts:all',
  CONTRACT_BY_ID: (id: number) => `contracts:${id}`,
  
  // New Contracts
  ALL_NEW_CONTRACTS: 'new-contracts:all',
  NEW_CONTRACT_BY_ID: (id: number) => `new-contracts:${id}`,
  
  // Users
  ALL_USERS: 'users:all',
  USER_BY_ID: (id: number) => `users:${id}`,
  
  // Sales Representatives
  SALES_REPS: 'sales-reps:all',
  
  // Statistics
  UPLOAD_STATS: 'stats:uploads',
  DISTRIBUTION_STATS: 'stats:distribution',
  
  // Banners
  SECONDARY_BANNERS: 'banners:secondary',
  
  // System
  SYSTEM_STATUS: 'system:status',
}

// أوقات الصلاحية المقترحة
export const CACHE_TTL = {
  SHORT: 30 * 1000,      // 30 ثانية - للبيانات المتغيرة باستمرار
  MEDIUM: 2 * 60 * 1000, // 2 دقيقة - للبيانات المتوسطة
  LONG: 5 * 60 * 1000,   // 5 دقائق - للبيانات شبه الثابتة
  VERY_LONG: 15 * 60 * 1000, // 15 دقيقة - للبيانات الثابتة
}

// دالات مساعدة لحذف Cache عند التحديث
export function invalidateCache(pattern: string) {
  cache.deletePattern(pattern)
}

export function invalidateCVCache() {
  cache.deletePattern('cvs:')
  cache.deletePattern('stats:')
}

export function invalidateContractCache() {
  cache.deletePattern('contracts:')
  cache.deletePattern('new-contracts:')
  cache.deletePattern('stats:')
}

export function invalidateUserCache() {
  cache.deletePattern('users:')
}

export function invalidateAllCache() {
  cache.clear()
}
