'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Lock, CreditCard } from 'lucide-react'

export default function PaymentRequiredPage() {
  const router = useRouter()

  useEffect(() => {
    // منع الرجوع للخلف
    window.history.pushState(null, '', window.location.href)
    window.onpopstate = function() {
      window.history.pushState(null, '', window.location.href)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* البطاقة الرئيسية */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-red-500">
          {/* الهيدر */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
                <Lock className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              النظام معطل مؤقتاً
            </h1>
            <p className="text-white/90 text-lg">
              يرجى الاتصال بالمطور لتفعيل النظام
            </p>
          </div>

          {/* المحتوى */}
          <div className="p-8">
            {/* رسالة التنبيه */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-900 mb-2">
                    يجب دفع حساب السيستم للمطور
                  </h3>
                  <p className="text-red-700 leading-relaxed">
                    لقد تم تعطيل النظام بسبب عدم تفعيل حساب المطور. للمتابعة في استخدام النظام، يرجى التواصل مع المطور لإتمام عملية الدفع والتفعيل.
                  </p>
                </div>
              </div>
            </div>

            {/* معلومات الاتصال */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                للتفعيل والدفع
              </h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-gray-600 mb-1">تواصل مع المطور</p>
                  <p className="text-lg font-semibold text-gray-900">
                    يرجى الاتصال بفريق التطوير
                  </p>
                </div>
              </div>
            </div>

            {/* ملاحظة */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 text-center">
                <strong>ملاحظة:</strong> لن تتمكن من الوصول إلى أي صفحة في النظام حتى يتم التفعيل
              </p>
            </div>
          </div>

          {/* الفوتر */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              © 2025 نظام إدارة السير الذاتية - جميع الحقوق محفوظة
            </p>
          </div>
        </div>

        {/* رسالة إضافية */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            هذه الرسالة تظهر فقط عندما يكون حساب المطور غير مفعل
          </p>
        </div>
      </div>
    </div>
  )
}
