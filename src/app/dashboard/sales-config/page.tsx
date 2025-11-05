'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Phone, 
  Save, 
  RefreshCw, 
  Settings, 
  MessageCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import PhoneInput from '../../../components/PhoneInput'

interface SalesConfig {
  whatsappNumber: string
  hideFilters?: boolean
}

interface SalesConfigs {
  gallery: SalesConfig
  sales1: SalesConfig
  sales2: SalesConfig
  sales3: SalesConfig
  sales4: SalesConfig
  sales5: SalesConfig
  sales6: SalesConfig
  sales7: SalesConfig
  sales8: SalesConfig
  sales9: SalesConfig
  sales10: SalesConfig
  sales11: SalesConfig
  'transfer-services': SalesConfig
}

export default function SalesConfigPage() {
  const [configs, setConfigs] = useState<SalesConfigs>({
    gallery: { whatsappNumber: '' },
    sales1: { whatsappNumber: '' },
    sales2: { whatsappNumber: '' },
    sales3: { whatsappNumber: '' },
    sales4: { whatsappNumber: '' },
    sales5: { whatsappNumber: '' },
    sales6: { whatsappNumber: '' },
    sales7: { whatsappNumber: '' },
    sales8: { whatsappNumber: '' },
    sales9: { whatsappNumber: '' },
    sales10: { whatsappNumber: '' },
    sales11: { whatsappNumber: '' },
    'transfer-services': { whatsappNumber: '' }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // جلب الإعدادات الحالية
  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setIsLoading(true)
      
      // جلب إعدادات كل صفحة على حدة
      const promises = Object.keys(configs).map(async (salesId) => {
        try {
          const response = await fetch(`/api/sales-config/${salesId}`)
          if (response.ok) {
            const data = await response.json()
            return { salesId, config: data }
          }
          return { salesId, config: { whatsappNumber: '' } }
        } catch (error) {
          console.error(`Error fetching ${salesId} config:`, error)
          return { salesId, config: { whatsappNumber: '' } }
        }
      })

      const results = await Promise.all(promises)
      
      const newConfigs = { ...configs }
      results.forEach(({ salesId, config }) => {
        newConfigs[salesId as keyof SalesConfigs] = config
      })
      
      setConfigs(newConfigs)
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast.error('فشل في جلب الإعدادات')
    } finally {
      setIsLoading(false)
    }
  }

  // تحديث رقم واتساب لصفحة محددة
  const updateWhatsappNumber = (salesId: keyof SalesConfigs, number: string) => {
    setConfigs(prev => ({
      ...prev,
      [salesId]: { ...prev[salesId], whatsappNumber: number }
    }))
  }

  // تحديث إخفاء الفلاتر
  const toggleHideFilters = (salesId: keyof SalesConfigs) => {
    setConfigs(prev => ({
      ...prev,
      [salesId]: { ...prev[salesId], hideFilters: !prev[salesId].hideFilters }
    }))
  }

  // حفظ جميع الإعدادات
  const saveAllConfigs = async () => {
    try {
      setIsSaving(true)
      
      // حفظ كل صفحة على حدة
      const promises = Object.entries(configs).map(async ([salesId, config]) => {
        const response = await fetch(`/api/sales-config/${salesId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config)
        })
        
        if (!response.ok) {
          throw new Error(`فشل في حفظ إعدادات ${salesId}`)
        }
        
        return response.json()
      })

      await Promise.all(promises)
      
      setLastSaved(new Date())
      toast.success('تم حفظ جميع الإعدادات بنجاح!')
    } catch (error) {
      console.error('Error saving configs:', error)
      toast.error('فشل في حفظ الإعدادات')
    } finally {
      setIsSaving(false)
    }
  }

  // التحقق من صحة رقم الواتساب
  const validateWhatsappNumber = (number: string): boolean => {
    if (!number) return true // السماح بالقيم الفارغة
    // رقم الواتساب يجب أن يبدأ بـ + ويحتوي على أرقام فقط
    const regex = /^\+[1-9]\d{1,14}$/
    return regex.test(number.replace(/\s/g, ''))
  }

  // فتح صفحة المبيعات
  const openSalesPage = (salesId: string) => {
    window.open(`/${salesId}`, '_blank')
  }

  const salesPages = [
    { id: 'gallery', name: 'المعرض الرئيسي', description: 'صفحة معرض السير الذاتية', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-100/50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-700', textColor: 'text-blue-900 dark:text-blue-100' },
    { id: 'transfer-services', name: 'معرض نقل الخدمات 🚚', description: 'سير نقل خدمات فقط - بدون بانر', color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-100/50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-700', textColor: 'text-amber-900 dark:text-amber-100' },
    { id: 'sales1', name: 'Sales 1', description: 'صفحة معرض السير الذاتية', color: 'from-green-500 to-blue-500', bgColor: 'bg-green-100/50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-700', textColor: 'text-green-900 dark:text-green-100' },
    { id: 'sales2', name: 'Sales 2', description: 'صفحة معرض السير الذاتية', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-100/50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-700', textColor: 'text-purple-900 dark:text-purple-100' },
    { id: 'sales3', name: 'Sales 3', description: 'صفحة معرض السير الذاتية', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-100/50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-700', textColor: 'text-orange-900 dark:text-orange-100' },
    { id: 'sales4', name: 'Sales 4', description: 'صفحة معرض السير الذاتية', color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-100/50 dark:bg-indigo-900/20', borderColor: 'border-indigo-200 dark:border-indigo-700', textColor: 'text-indigo-900 dark:text-indigo-100' },
    { id: 'sales5', name: 'Sales 5', description: 'صفحة معرض السير الذاتية', color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-100/50 dark:bg-pink-900/20', borderColor: 'border-pink-200 dark:border-pink-700', textColor: 'text-pink-900 dark:text-pink-100' },
    { id: 'sales6', name: 'Sales 6', description: 'صفحة معرض السير الذاتية', color: 'from-teal-500 to-green-500', bgColor: 'bg-teal-100/50 dark:bg-teal-900/20', borderColor: 'border-teal-200 dark:border-teal-700', textColor: 'text-teal-900 dark:text-teal-100' },
    { id: 'sales7', name: 'Sales 7', description: 'صفحة معرض السير الذاتية', color: 'from-red-500 to-orange-500', bgColor: 'bg-red-100/50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-700', textColor: 'text-red-900 dark:text-red-100' },
    { id: 'sales8', name: 'Sales 8', description: 'صفحة معرض السير الذاتية', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-100/50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-700', textColor: 'text-yellow-900 dark:text-yellow-100' },
    { id: 'sales9', name: 'Sales 9', description: 'صفحة معرض السير الذاتية', color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-100/50 dark:bg-cyan-900/20', borderColor: 'border-cyan-200 dark:border-cyan-700', textColor: 'text-cyan-900 dark:text-cyan-100' },
    { id: 'sales10', name: 'Sales 10', description: 'صفحة معرض السير الذاتية', color: 'from-lime-500 to-green-500', bgColor: 'bg-lime-100/50 dark:bg-lime-900/20', borderColor: 'border-lime-200 dark:border-lime-700', textColor: 'text-lime-900 dark:text-lime-100' },
    { id: 'sales11', name: 'Sales 11', description: 'صفحة معرض السير الذاتية', color: 'from-fuchsia-500 to-purple-500', bgColor: 'bg-fuchsia-100/50 dark:bg-fuchsia-900/20', borderColor: 'border-fuchsia-200 dark:border-fuchsia-700', textColor: 'text-fuchsia-900 dark:text-fuchsia-100' }
  ]

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-background rounded-lg shadow-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  إعدادات صفحات المبيعات
                </h1>
                <p className="text-muted-foreground">إدارة أرقام الواتساب لكل صفحة مبيعات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {lastSaved && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-100/50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
                </div>
              )}
              
              <button
                onClick={fetchConfigs}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              
              <button
                onClick={saveAllConfigs}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
              </button>
            </div>
          </div>
        </div>

        {/* Sales Pages Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesPages.map((page) => {
            const config = configs[page.id as keyof SalesConfigs]
            const isValidNumber = config.whatsappNumber ? validateWhatsappNumber(config.whatsappNumber) : true
            
            return (
              <div
                key={page.id}
                className={`bg-card rounded-lg shadow-lg border-2 ${page.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300`}
              >
                {/* Card Header */}
                <div className={`${page.bgColor} p-4 border-b ${page.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`bg-gradient-to-r ${page.color} p-2 rounded-lg`}>
                        <MessageCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${page.textColor}`}>{page.name}</h3>
                        <p className={`text-sm ${page.textColor} opacity-80`}>{page.description || 'صفحة معرض السير الذاتية'}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => openSalesPage(page.id)}
                      className="bg-background hover:bg-muted text-foreground p-2 rounded-lg transition-colors border border-border"
                      title="فتح الصفحة"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      رقم الواتساب
                    </label>
                    <PhoneInput
                      value={config.whatsappNumber}
                      onChange={(value) => updateWhatsappNumber(page.id as keyof SalesConfigs, value)}
                      placeholder="رقم الواتساب"
                    />
                    
                    {config.whatsappNumber && isValidNumber && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        رقم صحيح ✓
                      </div>
                    )}
                    
                    {!isValidNumber && config.whatsappNumber && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        رقم غير صحيح
                      </div>
                    )}
                  </div>

                  {/* خيار إخفاء الفلاتر - فقط لصفحة transfer-services */}
                  {page.id === 'transfer-services' && (
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="text-sm font-semibold text-foreground flex items-center gap-2 cursor-pointer">
                            <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                            إخفاء الفلاتر
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            إخفاء جميع الفلاتر في صفحة نقل الخدمات
                          </p>
                        </div>
                        <button
                          onClick={() => toggleHideFilters(page.id as keyof SalesConfigs)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                            config.hideFilters ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config.hideFilters ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {config.hideFilters && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                          <CheckCircle className="h-3 w-3" />
                          الفلاتر مخفية - سيتم عرض السير الذاتية فقط
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-muted/50 p-3 rounded-lg border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2">معلومات الصفحة:</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>• الرابط: /{page.id}</p>
                      <p>• نفس السير الذاتية للجميع</p>
                      <p>• رقم واتساب مخصص لكل صفحة</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">تعليمات الاستخدام</h3>
              <div className="space-y-2 text-sm text-primary/80">
                <p>• <strong>رقم الواتساب:</strong> يجب إدخال الرقم مع رمز الدولة (مثال: 966501234567 للسعودية)</p>
                <p>• <strong>صفحات المبيعات:</strong> كل صفحة تعرض نفس السير الذاتية ولكن برقم واتساب مختلف</p>
                <p>• <strong>الروابط:</strong> يمكن مشاركة رابط كل صفحة مع فريق مبيعات مختلف</p>
                <p>• <strong>الحفظ:</strong> لا تنس حفظ الإعدادات بعد التعديل</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
