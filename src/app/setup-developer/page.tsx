'use client'

import { useState } from 'react'
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function SetupDeveloperPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const createDeveloper = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/create-developer', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'فشل في إنشاء حساب المطور')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالسيرفر')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                <Shield className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              إعداد حساب المطور
            </h1>
            <p className="text-white/90">
              إنشاء حساب المطور للتحكم الكامل في النظام
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {!result && !error && (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  اضغط على الزر لإنشاء حساب المطور الآن
                </p>
                <button
                  onClick={createDeveloper}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      إنشاء حساب المطور
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success */}
            {result && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-900 mb-3">
                      {result.message}
                    </h3>
                    
                    <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                      <h4 className="font-bold text-gray-900 mb-3">بيانات الدخول:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">البريد الإلكتروني:</span>
                          <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                            {result.developer.email}
                          </code>
                        </div>
                        {result.developer.password && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">كلمة المرور:</span>
                            <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                              {result.developer.password}
                            </code>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">الحالة:</span>
                          <span className="text-green-600 font-bold">
                            {result.developer.isActive ? 'مفعل ✓' : 'غير مفعل'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {result.note && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          ℹ️ {result.note}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <a
                        href="/login"
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                        الذهاب لتسجيل الدخول
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-900 mb-2">
                      حدث خطأ
                    </h3>
                    <p className="text-red-700">{error}</p>
                    <button
                      onClick={() => {
                        setError(null)
                        createDeveloper()
                      }}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
