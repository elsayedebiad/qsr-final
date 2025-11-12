'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X, Clock, FileWarning, ChevronDown, ChevronUp } from 'lucide-react'

interface ContractAlert {
  id: number
  contractNumber: string
  clientName: string
  salesRepName: string
  status: string
  hasCVIssue: boolean
  cvIssueType: string | null
  daysSinceUpdate: number
  lastStatusUpdate: Date
  createdBy?: {
    name: string
    email: string
  }
}

interface AlertStats {
  total: number
  withIssues: number
  stale: number
}

export default function ContractAlertsNotification() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<ContractAlert[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [previousCount, setPreviousCount] = useState(0)

  useEffect(() => {
    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    fetchAlerts()
    
    // تحديث كل 5 دقائق
    const interval = setInterval(() => {
      fetchAlerts()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const playNotificationSound = () => {
    try {
      // صوت تنبيه بسيط
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBxxx0fPTgjMGHm7A7+OZSA0PVa/m7rJjHAU7k9jywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0OVK7l7bJhHAU5kdXywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0OVK7l7bJhHAU5kdXywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0OVK7l7bJhHAU5kdXywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0OVK7l7bJhHAU5kdXywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0OVK7l7bJhHAU5kdXywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0OVK7l7bJhHAU5kdXywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0OVK7l7bJhHAU5kdXywnYpBSV9zvLaizsIGGS76OihUxMLTKXh8bllHgU2jdTyxnkrBShzy/DVgzEGHm2/7uGYRg0O')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Ignore if audio can't play
      })
    } catch (error) {
      // Ignore audio errors
    }
  }

  const showBrowserNotification = (count: number) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ تنبيه عقود مهمة', {
          body: `يوجد ${count} عقد يحتاج إلى متابعة فورية`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'contract-alert',
          requireInteraction: false,
          silent: false
        })
      }
    } catch (error) {
      // Ignore notification errors
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/contracts-alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.contracts)
        setStats(data.stats)
        
        // تشغيل الصوت وإشعار المتصفح إذا زاد عدد التنبيهات
        if (data.stats.total > previousCount && previousCount > 0) {
          playNotificationSound()
          showBrowserNotification(data.stats.total)
        }
        setPreviousCount(data.stats.total)
        
        // إظهار الإشعار إذا كان هناك تنبيهات ولم يتم إغلاقه
        if (data.stats.total > 0 && !isDismissed) {
          setIsVisible(true)
        }
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    
    // إعادة الإظهار بعد 30 دقيقة
    setTimeout(() => {
      setIsDismissed(false)
      if (stats && stats.total > 0) {
        setIsVisible(true)
      }
    }, 30 * 60 * 1000)
  }

  const handleViewContract = (contractId: number) => {
    router.push(`/dashboard/add-contracts`)
    setIsVisible(false)
  }

  const handleViewIssues = () => {
    router.push('/dashboard/add-contracts?filter=issues')
    setIsVisible(false)
  }

  const handleViewStale = () => {
    router.push('/dashboard/add-contracts?filter=stale')
    setIsVisible(false)
  }

  if (!isVisible || !stats || stats.total === 0) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full">
      <div className="bg-card/95 backdrop-blur-xl border-2 border-border shadow-2xl overflow-hidden animate-slide-in rounded-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-destructive/10 to-orange-500/10">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-destructive/20 p-2.5 rounded-xl animate-pulse border border-destructive/30">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
                  ⚠️ تنبيه عقود مهمة
                  <span className="bg-destructive/20 text-destructive px-2 py-0.5 rounded-full text-xs font-bold border border-destructive/30">
                    {stats.total}
                  </span>
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  يوجد عقود تحتاج إلى متابعة فورية
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
              title="إخفاء مؤقتاً"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-4 bg-muted/30 grid grid-cols-2 gap-3">
          <button
            onClick={handleViewIssues}
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 rounded-xl p-3 border border-orange-500/30 transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileWarning className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-muted-foreground text-xs font-medium group-hover:text-foreground transition-colors">عقود بها مشاكل</span>
            </div>
            <p className="text-foreground text-2xl font-bold">{stats.withIssues}</p>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-orange-600 transition-colors">اضغط للعرض →</p>
          </button>
          <button
            onClick={handleViewStale}
            className="bg-gradient-to-br from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 rounded-xl p-3 border border-red-500/30 transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-muted-foreground text-xs font-medium group-hover:text-foreground transition-colors">متأخرة ≥40 يوم</span>
            </div>
            <p className="text-foreground text-2xl font-bold">{stats.stale}</p>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-red-600 transition-colors">اضغط للعرض →</p>
          </button>
        </div>

        {/* Expandable List */}
        <div className="border-t border-border">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex items-center justify-between text-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-semibold">
              {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>

          {isExpanded && (
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              <div className="p-4 pt-0 space-y-2">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleViewContract(alert.id)}
                    className="bg-card hover:bg-muted/50 rounded-lg p-3 border border-border cursor-pointer transition-all hover:scale-[1.02] group hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-foreground font-semibold text-sm truncate">
                            {alert.contractNumber}
                          </span>
                          {alert.hasCVIssue && (
                            <FileWarning className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs truncate">
                          {alert.clientName}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">
                            {alert.daysSinceUpdate} يوم منذ التحديث
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        عرض →
                      </div>
                    </div>
                  </div>
                ))}
                
                {alerts.length > 5 && (
                  <button
                    onClick={() => router.push('/dashboard/add-contracts')}
                    className="w-full p-3 bg-muted hover:bg-muted/70 rounded-lg border border-border text-foreground text-sm font-semibold transition-all hover:shadow-md"
                  >
                    عرض جميع العقود ({alerts.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-muted/30 border-t border-border">
          <button
            onClick={() => router.push('/dashboard/add-contracts')}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            الانتقال إلى صفحة العقود
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}
