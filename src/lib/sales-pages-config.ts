// تكوين أسماء صفحات المبيعات المخصصة
export interface SalesPageConfig {
  id: string // مثل: sales1, sales2
  path: string // مثل: /sales1
  defaultName: string // الاسم الافتراضي
  customName?: string // الاسم المخصص من المستخدم
}

// الأسماء الافتراضية
const defaultConfigs: SalesPageConfig[] = [
  { id: 'sales1', path: '/sales1', defaultName: 'صفحة المبيعات 1' },
  { id: 'sales2', path: '/sales2', defaultName: 'صفحة المبيعات 2' },
  { id: 'sales3', path: '/sales3', defaultName: 'صفحة المبيعات 3' },
  { id: 'sales4', path: '/sales4', defaultName: 'صفحة المبيعات 4' },
  { id: 'sales5', path: '/sales5', defaultName: 'صفحة المبيعات 5' },
  { id: 'sales6', path: '/sales6', defaultName: 'صفحة المبيعات 6' },
  { id: 'sales7', path: '/sales7', defaultName: 'صفحة المبيعات 7' },
  { id: 'sales8', path: '/sales8', defaultName: 'صفحة المبيعات 8' },
  { id: 'sales9', path: '/sales9', defaultName: 'صفحة المبيعات 9' },
  { id: 'sales10', path: '/sales10', defaultName: 'صفحة المبيعات 10' },
  { id: 'sales11', path: '/sales11', defaultName: 'صفحة المبيعات 11' },
]

const STORAGE_KEY = 'sales_pages_custom_names'

/**
 * جلب جميع تكوينات الصفحات مع الأسماء المخصصة
 */
export function getSalesPagesConfig(): SalesPageConfig[] {
  if (typeof window === 'undefined') return defaultConfigs

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultConfigs

    const customNames = JSON.parse(stored) as Record<string, string>
    
    return defaultConfigs.map(config => ({
      ...config,
      customName: customNames[config.id] || undefined
    }))
  } catch (error) {
    console.error('Error loading sales pages config:', error)
    return defaultConfigs
  }
}

/**
 * جلب اسم صفحة معينة (الاسم المخصص أو الافتراضي)
 */
export function getSalesPageName(pageId: string): string {
  const configs = getSalesPagesConfig()
  const config = configs.find(c => c.id === pageId || c.path === pageId)
  
  if (!config) return pageId
  
  return config.customName || config.defaultName
}

/**
 * تحديث اسم صفحة مخصص
 */
export function updateSalesPageName(pageId: string, customName: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    // جلب الأسماء الحالية
    const stored = localStorage.getItem(STORAGE_KEY)
    const customNames: Record<string, string> = stored ? JSON.parse(stored) : {}
    
    // تحديث الاسم
    if (customName.trim()) {
      customNames[pageId] = customName.trim()
    } else {
      // إذا كان الاسم فارغ، نحذف التخصيص
      delete customNames[pageId]
    }
    
    // حفظ التحديث
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customNames))
    
    // إطلاق حدث للإعلام عن التحديث
    window.dispatchEvent(new CustomEvent('salesPagesConfigUpdated', { 
      detail: { pageId, customName } 
    }))
    
    return true
  } catch (error) {
    console.error('Error updating sales page name:', error)
    return false
  }
}

/**
 * إعادة تعيين اسم صفحة للاسم الافتراضي
 */
export function resetSalesPageName(pageId: string): boolean {
  return updateSalesPageName(pageId, '')
}

/**
 * إعادة تعيين جميع الأسماء للافتراضية
 */
export function resetAllSalesPageNames(): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('salesPagesConfigUpdated', { 
      detail: { resetAll: true } 
    }))
    return true
  } catch (error) {
    console.error('Error resetting sales page names:', error)
    return false
  }
}

/**
 * تحويل من targetPage أو salesPageId إلى اسم معروض
 * يدعم صيغ مختلفة مثل: /sales1, sales1, SALES1
 */
export function formatSalesPageName(pageIdentifier: string): string {
  if (!pageIdentifier) return 'غير محدد'
  
  // تنظيف المدخل
  let cleanId = pageIdentifier.toLowerCase().trim()
  
  // إزالة / من البداية إن وجدت
  if (cleanId.startsWith('/')) {
    cleanId = cleanId.substring(1)
  }
  
  // جلب الاسم المخصص
  return getSalesPageName(cleanId)
}
