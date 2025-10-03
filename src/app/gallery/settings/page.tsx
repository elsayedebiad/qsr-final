'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Settings, MessageCircle } from 'lucide-react'

export default function GallerySettingsPage() {
  const router = useRouter()
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const salesPageId = 'gallery'

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/sales-config/${salesPageId}`)
      if (response.ok) {
        const data = await response.json()
        setWhatsappNumber(data.whatsappNumber || '')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('حدث خطأ في تحميل الإعدادات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!whatsappNumber.trim()) {
      toast.error('يرجى إدخال رقم الواتساب')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/sales-config/${salesPageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber.trim()
        })
      })

      if (response.ok) {
        toast.success('تم حفظ الإعدادات بنجاح')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('حدث خطأ في حفظ الإعدادات')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/gallery')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>العودة للمعرض</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">إعدادات المعرض الرئيسي</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">إعدادات الواتساب</h2>
            <p className="text-gray-600 text-sm">
              قم بتخصيص رقم الواتساب الذي سيظهر في المعرض الرئيسي للتواصل مع العملاء
            </p>
          </div>

          <div className="space-y-6">
            {/* رقم الواتساب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageCircle className="h-4 w-4 inline ml-1" />
                رقم الواتساب
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="مثال: +201234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                يرجى إدخال الرقم بالصيغة الدولية (مثال: +201234567890)
              </p>
            </div>

            {/* معاينة */}
            {whatsappNumber && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">معاينة</h3>
                <div className="bg-green-100 px-3 py-2 rounded-lg inline-block">
                  <span className="text-sm font-medium text-green-700">
                    واتساب: {whatsappNumber}
                  </span>
                </div>
              </div>
            )}

            {/* أزرار الحفظ */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving || !whatsappNumber.trim()}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    حفظ الإعدادات
                  </>
                )}
              </button>
              
              <button
                onClick={() => router.push('/gallery')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">ملاحظات مهمة:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• سيظهر رقم الواتساب في أعلى صفحة المعرض الرئيسي</li>
            <li>• سيتم استخدام هذا الرقم في جميع رسائل الواتساب من المعرض</li>
            <li>• تأكد من أن الرقم صحيح ونشط لاستقبال الرسائل</li>
            <li>• يمكنك تغيير الرقم في أي وقت من هذه الصفحة</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
