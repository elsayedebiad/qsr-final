'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Power, PowerOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function DeveloperControlPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isActive, setIsActive] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        router.push('/login')
        return
      }

      const data = await response.json()
      
      // التحقق من أن المستخدم هو المطور
      if (data.user.email !== 'developer@system.local' && data.user.role !== 'DEVELOPER') {
        toast.error('غير مصرح لك بالوصول لهذه الصفحة')
        router.push('/dashboard')
        return
      }

      setUser(data.user)
      
      // جلب حالة النظام من API منفصل
      const statusResponse = await fetch('/api/system-status')
      const statusData = await statusResponse.json()
      setIsActive(statusData.isActive)
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const toggleSystemStatus = async () => {
    setUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/developer/toggle-system', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة النظام')
      }

      const data = await response.json()
      setIsActive(data.isActive)
      
      if (data.isActive) {
        toast.success('✅ تم تفعيل النظام بنجاح')
      } else {
        toast.error('⚠️ تم تعطيل النظام - جميع المستخدمين لن يتمكنوا من الوصول')
      }
    } catch (error) {
      toast.error('حدث خطأ في تحديث حالة النظام')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                <Shield className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              لوحة تحكم المطور
            </h1>
            <p className="text-white/90">
              التحكم الكامل في النظام
            </p>
          </div>

          <div className="p-8">
            {/* معلومات المستخدم */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات الحساب</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">الاسم:</span>
                  <span className="font-semibold">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">البريد:</span>
                  <span className="font-semibold">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الدور:</span>
                  <span className="font-semibold text-purple-600">DEVELOPER</span>
                </div>
              </div>
            </div>

            {/* حالة النظام */}
            <div className={`rounded-xl p-6 mb-6 border-2 ${
              isActive 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <h3 className={`text-xl font-bold ${
                      isActive ? 'text-green-900' : 'text-red-900'
                    }`}>
                      حالة النظام: {isActive ? 'مفعل' : 'معطل'}
                    </h3>
                    <p className={`text-sm ${
                      isActive ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isActive 
                        ? 'النظام يعمل بشكل طبيعي وجميع المستخدمين يمكنهم الوصول'
                        : 'النظام معطل - جميع المستخدمين سيتم توجيههم لصفحة الدفع'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={toggleSystemStatus}
                disabled={updating}
                className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
                  isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري التحديث...
                  </>
                ) : isActive ? (
                  <>
                    <PowerOff className="h-5 w-5" />
                    تعطيل النظام
                  </>
                ) : (
                  <>
                    <Power className="h-5 w-5" />
                    تفعيل النظام
                  </>
                )}
              </button>
            </div>

            {/* تحذير */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ تحذير:</strong> عند تعطيل النظام، سيتم منع جميع المستخدمين (بما فيهم المدير العام) من الوصول إلى أي صفحة في النظام. فقط أنت كمطور يمكنك تسجيل الدخول وإعادة تفعيل النظام.
              </p>
            </div>

            {/* أزرار إضافية */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                الذهاب للداشبورد
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  router.push('/login')
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
