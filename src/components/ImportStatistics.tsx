'use client'

import { 
  TrendingUp, 
  Users, 
  UserCheck, 
  UserX, 
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface ImportStats {
  totalRows: number
  newRecords: number
  updatedRecords: number
  skippedRecords: number
  errorRecords: number
  processingTime?: number
  duplicateReasons?: { [key: string]: number }
}

interface ImportStatisticsProps {
  stats: ImportStats
  isVisible: boolean
}

export default function ImportStatistics({ stats, isVisible }: ImportStatisticsProps) {
  if (!isVisible) return null

  const successRate = ((stats.newRecords + stats.updatedRecords) / stats.totalRows) * 100
  const duplicateRate = (stats.updatedRecords / stats.totalRows) * 100
  const errorRate = (stats.errorRecords / stats.totalRows) * 100

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'غير محدد'
    if (seconds < 60) return `${seconds.toFixed(1)} ثانية`
    return `${Math.floor(seconds / 60)} دقيقة ${Math.floor(seconds % 60)} ثانية`
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur rounded-full p-3">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">إحصائيات الاستيراد</h3>
            <p className="text-primary-foreground/80">تقرير مفصل عن عملية المعالجة</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Records */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">{stats.totalRows}</span>
            </div>
            <p className="text-muted-foreground font-medium">إجمالي السجلات</p>
          </div>

          {/* New Records */}
          <div className="bg-success/10 rounded-xl p-4 border border-success/20 hover:border-success/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="w-8 h-8 text-success" />
              <span className="text-2xl font-bold text-foreground">{stats.newRecords}</span>
            </div>
            <p className="text-muted-foreground font-medium">سجلات جديدة</p>
          </div>

          {/* Updated Records */}
          <div className="bg-warning/10 rounded-xl p-4 border border-warning/20 hover:border-warning/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-warning" />
              <span className="text-2xl font-bold text-foreground">{stats.updatedRecords}</span>
            </div>
            <p className="text-muted-foreground font-medium">سجلات محدثة</p>
          </div>

          {/* Error Records */}
          <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20 hover:border-destructive/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <span className="text-2xl font-bold text-foreground">{stats.errorRecords}</span>
            </div>
            <p className="text-muted-foreground font-medium">سجلات خاطئة</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Success Rate */}
          <div className="bg-muted/50 rounded-xl p-6 border border-border hover:border-success/40 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-success" />
              <h4 className="font-semibold text-foreground">معدل النجاح</h4>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                successRate >= 90 ? 'text-success' : 
                successRate >= 70 ? 'text-warning' : 'text-destructive'
              }`}>
                {successRate.toFixed(1)}%
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    successRate >= 90 ? 'bg-success' : 
                    successRate >= 70 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Duplicate Rate */}
          <div className="bg-muted/50 rounded-xl p-6 border border-border hover:border-primary/40 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-foreground">معدل التكرار</h4>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {duplicateRate.toFixed(1)}%
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${duplicateRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Processing Time */}
          <div className="bg-muted/50 rounded-xl p-6 border border-border hover:border-accent/40 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-accent-foreground" />
              <h4 className="font-semibold text-foreground">وقت المعالجة</h4>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-2">
                {formatTime(stats.processingTime)}
              </div>
              <p className="text-muted-foreground text-sm">
                {stats.totalRows > 0 && stats.processingTime ? 
                  `~${(stats.processingTime / stats.totalRows).toFixed(2)} ثانية/سجل` : 
                  'متوسط السرعة'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Duplicate Reasons Breakdown */}
        {stats.duplicateReasons && Object.keys(stats.duplicateReasons).length > 0 && (
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              أسباب التكرار
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stats.duplicateReasons).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border hover:border-primary/40 transition-all">
                  <span className="text-foreground">{reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                      {count}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({((count / stats.updatedRecords) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 p-4 bg-success/10 rounded-xl border border-success/30">
          <div className="flex items-start gap-3">
            <div className="bg-success/20 rounded-full p-2 flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-success" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">ملخص العملية</h4>
              <p className="text-muted-foreground leading-relaxed">
                تم معالجة <strong className="text-foreground">{stats.totalRows}</strong> سجل بنجاح. 
                أضيف <strong className="text-success">{stats.newRecords}</strong> سجل جديد، 
                وحُدث <strong className="text-warning">{stats.updatedRecords}</strong> سجل موجود، 
                وتُخطي <strong className="text-muted-foreground">{stats.skippedRecords}</strong> سجل، 
                مع <strong className="text-destructive">{stats.errorRecords}</strong> خطأ في المعالجة.
                معدل النجاح الإجمالي: <strong className={
                  successRate >= 90 ? 'text-success' : 
                  successRate >= 70 ? 'text-warning' : 'text-destructive'
                }>
                  {successRate.toFixed(1)}%
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
