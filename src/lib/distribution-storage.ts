// حل بديل لحفظ قواعد التوزيع
// يمكن استخدام localStorage أو Supabase أو Firebase

interface DistributionRule {
  path: string
  googleWeight: number
  otherWeight: number
  isActive: boolean
  targetConversions?: number
}

class DistributionStorage {
  private readonly STORAGE_KEY = 'qsr_distribution_rules'
  private readonly BACKUP_KEY = 'qsr_distribution_rules_backup'
  
  // حفظ في localStorage
  saveToLocalStorage(rules: DistributionRule[]): boolean {
    try {
      // حفظ نسخة احتياطية
      const current = localStorage.getItem(this.STORAGE_KEY)
      if (current) {
        localStorage.setItem(this.BACKUP_KEY, current)
      }
      
      // حفظ القواعد الجديدة
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        rules,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }))
      
      console.log('✅ تم حفظ القواعد في localStorage')
      return true
    } catch (error) {
      console.error('❌ فشل حفظ القواعد في localStorage:', error)
      return false
    }
  }
  
  // قراءة من localStorage
  loadFromLocalStorage(): DistributionRule[] | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return null
      
      const parsed = JSON.parse(data)
      console.log('✅ تم تحميل القواعد من localStorage')
      return parsed.rules
    } catch (error) {
      console.error('❌ فشل تحميل القواعد من localStorage:', error)
      return null
    }
  }
  
  // استرجاع النسخة الاحتياطية
  restoreBackup(): DistributionRule[] | null {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY)
      if (!backup) return null
      
      const parsed = JSON.parse(backup)
      // استرجاع النسخة الاحتياطية كنسخة رئيسية
      localStorage.setItem(this.STORAGE_KEY, backup)
      console.log('✅ تم استرجاع النسخة الاحتياطية')
      return parsed.rules
    } catch (error) {
      console.error('❌ فشل استرجاع النسخة الاحتياطية:', error)
      return null
    }
  }
  
  // حذف البيانات
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.BACKUP_KEY)
    console.log('🗑️ تم حذف جميع القواعد المحفوظة')
  }
  
  // التحقق من وجود قواعد محفوظة
  hasStoredRules(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEY)
  }
  
  // الحصول على معلومات آخر حفظ
  getLastSaveInfo(): { timestamp: string; version: string } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return null
      
      const parsed = JSON.parse(data)
      return {
        timestamp: parsed.timestamp,
        version: parsed.version || '1.0'
      }
    } catch {
      return null
    }
  }
}

// إنشاء instance واحد فقط
const distributionStorage = new DistributionStorage()
export default distributionStorage

// دالة مساعدة للحفظ مع fallback
export async function saveDistributionRules(rules: DistributionRule[]): Promise<{
  success: boolean
  method: 'database' | 'localStorage' | 'failed'
  message: string
}> {
  // محاولة الحفظ في قاعدة البيانات أولاً
  try {
    const res = await fetch('/api/distribution/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules })
    })
    
    const data = await res.json()
    
    if (data.success) {
      // حفظ نسخة في localStorage أيضاً كـ backup
      distributionStorage.saveToLocalStorage(rules)
      return {
        success: true,
        method: 'database',
        message: 'تم الحفظ في قاعدة البيانات بنجاح'
      }
    }
  } catch (error) {
    console.error('فشل الحفظ في قاعدة البيانات:', error)
  }
  
  // إذا فشل الحفظ في قاعدة البيانات، احفظ في localStorage
  const localSaveSuccess = distributionStorage.saveToLocalStorage(rules)
  
  if (localSaveSuccess) {
    return {
      success: true,
      method: 'localStorage',
      message: 'تم الحفظ محلياً (قاعدة البيانات غير متاحة)'
    }
  }
  
  return {
    success: false,
    method: 'failed',
    message: 'فشل الحفظ في جميع الطرق'
  }
}

// دالة مساعدة للقراءة مع fallback
export async function loadDistributionRules(): Promise<{
  rules: DistributionRule[] | null
  source: 'database' | 'localStorage' | 'default'
}> {
  // محاولة القراءة من قاعدة البيانات أولاً
  try {
    const res = await fetch('/api/distribution/rules')
    const data = await res.json()
    
    if (data.success && data.rules && data.rules.length > 0) {
      const formattedRules = data.rules.map((rule: any) => ({
        path: `/sales${rule.salesPageId.replace('sales', '')}`,
        googleWeight: rule.googleWeight || 0,
        otherWeight: rule.otherWeight || 0,
        isActive: rule.isActive
      }))
      
      // حفظ نسخة في localStorage
      distributionStorage.saveToLocalStorage(formattedRules)
      
      return {
        rules: formattedRules,
        source: 'database'
      }
    }
  } catch (error) {
    console.error('فشل القراءة من قاعدة البيانات:', error)
  }
  
  // إذا فشلت قاعدة البيانات، اقرأ من localStorage
  const localRules = distributionStorage.loadFromLocalStorage()
  if (localRules) {
    return {
      rules: localRules,
      source: 'localStorage'
    }
  }
  
  // إذا لم توجد قواعد، أرجع القواعد الافتراضية
  const defaultRules: DistributionRule[] = [
    { path: '/sales1', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales2', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales3', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales4', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales5', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales6', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales7', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales8', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales9', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales10', googleWeight: 9.09, otherWeight: 9.09, isActive: true, targetConversions: 100 },
    { path: '/sales11', googleWeight: 9.01, otherWeight: 9.01, isActive: true, targetConversions: 100 },
  ]
  
  return {
    rules: defaultRules,
    source: 'default'
  }
}
