'use client'

import React, { useState, useEffect } from 'react'
import { 
  Upload, RefreshCw, FileText, Clock, 
  TrendingUp, Users, Calendar, Activity,
  CheckCircle, AlertCircle, Archive
} from 'lucide-react'
import { formatEgyptDateTime, getCurrentEgyptTime } from '@/lib/date-utils'

interface Statistics {
  totalCVs: number
  newToday: number
  updatedToday: number
  newThisWeek: number
  updatedThisWeek: number
  newThisMonth: number
  updatedThisMonth: number
  statusBreakdown: {
    available: number
    booked: number
    hired: number
    returned: number
    archived: number
  }
  lastUpdate: string
}

export default function CVStatisticsCard() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(getCurrentEgyptTime())

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentEgyptTime())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // جلب الإحصائيات
  useEffect(() => {
    fetchStatistics()
    const interval = setInterval(fetchStatistics, 60000) // كل دقيقة
    return () => clearInterval(interval)
  }, [])

  const fetchStatistics = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/cvs/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6 mb-6 bg-gradient-to-br from-primary/10 to-purple-600/10 border-primary/30">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-primary/10 to-purple-600/10 border-primary/30">
      {/* رأس البطاقة مع الوقت الحالي */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">إحصائيات السير الذاتية</h3>
            <p className="text-sm text-muted-foreground">تحديث مباشر للبيانات</p>
          </div>
        </div>
        
        <div className="text-left">
          <div className="text-sm text-muted-foreground">التوقيت الحالي - مصر</div>
          <div className="text-lg font-bold text-primary">{currentTime}</div>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* إجمالي السير */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{statistics?.totalCVs || 0}</span>
          </div>
          <div className="text-sm text-muted-foreground">إجمالي السير الذاتية</div>
        </div>

        {/* جديد اليوم */}
        <div className="bg-green-50 dark:bg-green-900/20 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <Upload className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
              {statistics?.newToday || 0}
            </span>
          </div>
          <div className="text-sm text-green-700 dark:text-green-400">مرفوع اليوم</div>
          <div className="text-xs text-muted-foreground mt-1">جديد كلياً</div>
        </div>

        {/* محدث اليوم */}
        <div className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {statistics?.updatedToday || 0}
            </span>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-400">محدث اليوم</div>
          <div className="text-xs text-muted-foreground mt-1">تم تعديلها</div>
        </div>

        {/* نسبة النشاط */}
        <div className="bg-purple-50 dark:bg-purple-900/20 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {statistics ? Math.round(((statistics.newToday + statistics.updatedToday) / statistics.totalCVs) * 100) : 0}%
            </span>
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-400">نشاط اليوم</div>
          <div className="text-xs text-muted-foreground mt-1">من الإجمالي</div>
        </div>
      </div>

      {/* إحصائيات الأسبوع والشهر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* إحصائيات الأسبوع */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-lg p-4 border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-cyan-600" />
            <span className="font-bold text-foreground">هذا الأسبوع</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                {statistics?.newThisWeek || 0}
              </div>
              <div className="text-xs text-muted-foreground">سيرة جديدة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                {statistics?.updatedThisWeek || 0}
              </div>
              <div className="text-xs text-muted-foreground">سيرة محدثة</div>
            </div>
          </div>
        </div>

        {/* إحصائيات الشهر */}
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-lg p-4 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span className="font-bold text-foreground">هذا الشهر</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {statistics?.newThisMonth || 0}
              </div>
              <div className="text-xs text-muted-foreground">سيرة جديدة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {statistics?.updatedThisMonth || 0}
              </div>
              <div className="text-xs text-muted-foreground">سيرة محدثة</div>
            </div>
          </div>
        </div>
      </div>

      {/* توزيع الحالات */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-4">
        <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          توزيع الحالات
        </h4>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              {statistics?.statusBreakdown.available || 0}
            </div>
            <div className="text-xs">متاح</div>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {statistics?.statusBreakdown.booked || 0}
            </div>
            <div className="text-xs">محجوز</div>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2">
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
              {statistics?.statusBreakdown.hired || 0}
            </div>
            <div className="text-xs">متعاقد</div>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
            <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
              {statistics?.statusBreakdown.returned || 0}
            </div>
            <div className="text-xs">معاد</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
            <div className="text-lg font-bold text-gray-700 dark:text-gray-400">
              {statistics?.statusBreakdown.archived || 0}
            </div>
            <div className="text-xs">مؤرشف</div>
          </div>
        </div>
      </div>

      {/* آخر تحديث */}
      <div className="mt-4 text-center">
        <span className="text-xs text-muted-foreground">
          آخر تحديث: {statistics?.lastUpdate ? formatEgyptDateTime(statistics.lastUpdate) : 'غير متاح'}
        </span>
      </div>
    </div>
  )
}
