'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Lock, CreditCard, ShieldAlert } from 'lucide-react'

export default function PaymentRequiredPage() {
  const router = useRouter()

  useEffect(() => {
    // منع الرجوع للخلف
    window.history.pushState(null, '', window.location.href)
    window.onpopstate = function() {
      window.history.pushState(null, '', window.location.href)
    }

    // التحقق المستمر من حالة النظام
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('/api/system-status')
        const data = await response.json()
        
        // إذا تم تفعيل النظام، السماح بالعودة للداشبورد
        if (data.isActive) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error checking system status:', error)
      }
    }

    // التحقق كل 3 ثواني
    const interval = setInterval(checkSystemStatus, 3000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* البطاقة الرئيسية */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          {/* الهيدر */}
          <div className="bg-destructive/10 border-b border-destructive/20 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full"></div>
                <div className="relative bg-destructive/10 backdrop-blur-sm rounded-full p-6 border-2 border-destructive/30">
                  <ShieldAlert className="h-16 w-16 text-destructive" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              النظام معطل مؤقتاً
            </h1>
            <p className="text-muted-foreground text-lg">
              يرجى الاتصال بالمطور لتفعيل النظام
            </p>
          </div>

          {/* المحتوى */}
          <div className="p-8 space-y-6">
            {/* رسالة التنبيه */}
            <div className="bg-destructive/5 border-2 border-destructive/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    يجب دفع حساب السيستم للمطور
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    لقد تم تعطيل النظام بسبب عدم تفعيل حساب المطور. للمتابعة في استخدام النظام، يرجى التواصل مع المطور لإتمام عملية الدفع والتفعيل.
                  </p>
                </div>
              </div>
            </div>

            {/* معلومات الاتصال */}
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                للتفعيل والدفع
              </h3>
              <div className="space-y-3">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">تواصل مع المطور</p>
                  <p className="text-lg font-semibold text-foreground">
                    يرجى الاتصال بفريق التطوير
                  </p>
                </div>
              </div>
            </div>

            {/* ملاحظة */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                <strong>ملاحظة:</strong> لن تتمكن من الوصول إلى أي صفحة في النظام حتى يتم التفعيل
              </p>
            </div>
          </div>

          {/* الفوتر */}
          <div className="bg-muted/30 px-8 py-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 نظام إدارة السير الذاتية - جميع الحقوق محفوظة
            </p>
          </div>
        </div>

        {/* رسالة إضافية */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            هذه الرسالة تظهر فقط عندما يكون النظام معطلاً من قبل المطور
          </p>
        </div>
      </div>
    </div>
  )
}
