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
  AlertCircle
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import PhoneInput from '../../../components/PhoneInput'

interface SalesConfig {
  whatsappNumber: string
}

interface SalesConfigs {
  gallery: SalesConfig
  sales1: SalesConfig
  sales2: SalesConfig
  sales3: SalesConfig
  sales4: SalesConfig
  sales5: SalesConfig
}

export default function SalesConfigPage() {
  const [configs, setConfigs] = useState<SalesConfigs>({
    gallery: { whatsappNumber: '' },
    sales1: { whatsappNumber: '' },
    sales2: { whatsappNumber: '' },
    sales3: { whatsappNumber: '' },
    sales4: { whatsappNumber: '' },
    sales5: { whatsappNumber: '' }
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
      [salesId]: { whatsappNumber: number }
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
    { id: 'gallery', name: 'المعرض الرئيسي', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-info/10', borderColor: 'border-info/30' },
    { id: 'sales1', name: 'Sales 1', color: 'from-green-500 to-blue-500', bgColor: 'bg-success/10', borderColor: 'border-success/30' },
    { id: 'sales2', name: 'Sales 2', color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { id: 'sales3', name: 'Sales 3', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { id: 'sales4', name: 'Sales 4', color: 'from-indigo-500 to-blue-500', bgColor: 'bg-primary/10', borderColor: 'border-indigo-200' },
    { id: 'sales5', name: 'Sales 5', color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' }
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
        <div className="bg-card rounded-lg shadow-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg">
                <Settings className="h-6 w-6 text-info" />
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
                <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-2 rounded-lg">
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
                        <h3 className="text-lg font-semibold text-foreground">{page.name}</h3>
                        <p className="text-sm text-muted-foreground">صفحة معرض السير الذاتية</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => openSalesPage(page.id)}
                      className="bg-card hover:bg-background text-foreground p-2 rounded-lg transition-colors border border-border"
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
                      <div className="flex items-center gap-2 mt-2 text-sm text-success">
                        <CheckCircle className="h-4 w-4" />
                        رقم صحيح ✓
                      </div>
                    )}
                    
                    {!isValidNumber && config.whatsappNumber && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        رقم غير صحيح
                      </div>
                    )}
                  </div>

                  <div className="bg-background p-3 rounded-lg">
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
        <div className="bg-info/10 border border-info/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-info/10 p-2 rounded-lg flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-info" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-info mb-2">تعليمات الاستخدام</h3>
              <div className="space-y-2 text-sm text-info">
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
