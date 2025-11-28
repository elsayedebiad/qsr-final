'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle, X, Clock, Phone } from 'lucide-react'

interface ExpiredNotification {
  id: string
  phoneNumber: string
  message: string
  timestamp: Date
  type: 'warning' | 'expired'
  remainingTime?: number // بالدقائق
}

export default function GlobalNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<ExpiredNotification[]>([])

  // فحص الأرقام المنتهية كل 15 ثانية للحصول على تحذيرات دقيقة
  useEffect(() => {
    if (!user) return

    const checkExpiredNumbers = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // جلب الأرقام النشطة مع المؤقت
        const response = await fetch('/api/phone-numbers/list?showExpired=false', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          const now = new Date()
          const newNotifications: ExpiredNotification[] = []
          
          // فحص الأرقام المحولة للمستخدم الحالي فقط
          data.data?.forEach((phone: any) => {
            if (phone.isTransferred && phone.deadlineAt && !phone.isExpired && !phone.isContacted) {
              // التحقق من أن المستخدم الحالي هو المحول إليه
              const isCurrentUserRecipient = phone.transferredToUserId === user.id
              
              if (isCurrentUserRecipient) {
                const deadlineTime = new Date(phone.deadlineAt)
                const timeDiff = deadlineTime.getTime() - now.getTime()
                const minutesLeft = Math.floor(timeDiff / (1000 * 60))
                
                // تحذير عند 5 دقائق متبقية - تنبيه للتواصل
                if (minutesLeft <= 5 && minutesLeft > 0) {
                  const existingWarning = notifications.find(n => 
                    n.id.includes(`warning-${phone.id}`) && n.type === 'warning'
                  )
                  
                  if (!existingWarning) {
                    newNotifications.push({
                      id: `warning-${phone.id}-${Date.now()}`,
                      phoneNumber: phone.phoneNumber,
                      message: `تنبيه: تواصل مع الرقم ${phone.phoneNumber} خلال ${minutesLeft} دقائق وإلا سيتم سحبه منك`,
                      timestamp: new Date(),
                      type: 'warning',
                      remainingTime: minutesLeft
                    })
                  }
                }
                
                // إشعار انتهاء - تم السحب
                if (minutesLeft <= 0) {
                  const existingExpired = notifications.find(n => 
                    n.id.includes(`expired-${phone.id}`) && n.type === 'expired'
                  )
                  
                  if (!existingExpired) {
                    newNotifications.push({
                      id: `expired-${phone.id}-${Date.now()}`,
                      phoneNumber: phone.phoneNumber,
                      message: `تم سحب الرقم ${phone.phoneNumber} منك بسبب عدم التواصل في الوقت المحدد`,
                      timestamp: new Date(),
                      type: 'expired'
                    })
                  }
                }
              }
            }
          })
          
          if (newNotifications.length > 0) {
            setNotifications(prev => [...prev, ...newNotifications])
            
            // إزالة الإشعارات تلقائياً
            newNotifications.forEach((notification: ExpiredNotification) => {
              const timeout = notification.type === 'warning' ? 15000 : 10000 // تحذير 15 ثانية، انتهاء 10 ثوانٍ
              setTimeout(() => {
                removeNotification(notification.id)
              }, timeout)
            })
          }
        }
        
        // استدعاء API فحص الأرقام المنتهية لتحديث قاعدة البيانات
        await fetch('/api/phone-numbers/check-expired', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
      } catch (error) {
        console.error('Error checking expired numbers:', error)
      }
    }

    // فحص أولي
    checkExpiredNumbers()
    
    // فحص دوري كل 15 ثانية
    const interval = setInterval(checkExpiredNumbers, 15000)
    
    return () => clearInterval(interval)
  }, [user])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => {
          const isWarning = notification.type === 'warning'
          const bgClass = isWarning 
            ? "bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600" 
            : "bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600"
          const borderClass = isWarning
            ? "border-yellow-300 dark:border-yellow-700"
            : "border-red-300 dark:border-red-700"
          
          return (
            <div
              key={notification.id}
              className={`${bgClass} text-white rounded-lg shadow-2xl border ${borderClass} overflow-hidden animate-slide-in-right`}
            >
              {/* Header مع الأيقونة */}
              <div className="flex items-center gap-3 p-4 pb-2">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">
                    {isWarning ? 'تنبيه: تواصل مع الرقم' : 'تم سحب الرقم منك'}
                  </h4>
                  <div className="flex items-center gap-1 text-xs opacity-90">
                    <Clock className="w-3 h-3" />
                    <span>
                      {isWarning 
                        ? `${notification.remainingTime} دقائق متبقية للتواصل` 
                        : 'لم تتواصل في الوقت المحدد'
                      }
                    </span>
                  </div>
                </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* المحتوى */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <Phone className="w-4 h-4 text-white/80" />
                <span className="font-mono text-sm font-bold" dir="ltr">
                  {notification.phoneNumber}
                </span>
              </div>
              <p className="text-xs mt-2 opacity-90">
                {notification.message}
              </p>
            </div>

            {/* شريط التقدم */}
            <div className="h-1 bg-white/30 relative overflow-hidden">
              <div className="h-full bg-white/50 animate-progress-bar" />
            </div>
          </div>
          )
        })}
    </div>
  )
}
