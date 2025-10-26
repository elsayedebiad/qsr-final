'use client'

import React, { useState, useEffect } from 'react'
import { 
  Network, Settings, Save, Zap, TrendingUp, Globe, 
  RefreshCw, AlertTriangle, CheckCircle, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { saveDistributionRules, loadDistributionRules } from '@/lib/distribution-storage'

interface DistributionRule {
  path: string
  googleWeight: number
  otherWeight: number
  isActive: boolean
}

export default function DistributionPageClean() {
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<DistributionRule[]>([
    { path: '/sales1', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales2', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales3', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales4', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales5', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales6', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales7', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales8', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales9', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales10', googleWeight: 9.09, otherWeight: 9.09, isActive: true },
    { path: '/sales11', googleWeight: 9.01, otherWeight: 9.01, isActive: true },
  ])
  const [hasChanges, setHasChanges] = useState(false)
  const [distributing, setDistributing] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const result = await loadDistributionRules()
      if (result.rules && result.rules.length > 0) {
        setRules(result.rules)
      }
    } catch (error) {
      console.error('Failed to load rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const result = await saveDistributionRules(rules)
      if (result.success) {
        toast.success('✅ تم حفظ الإعدادات بنجاح')
        setHasChanges(false)
      } else {
        toast.error('❌ فشل الحفظ')
      }
    } catch (error) {
      toast.error('❌ حدث خطأ أثناء الحفظ')
    }
  }

  const handleDistribute = async (strategy: 'WEIGHTED' | 'EQUAL', source: 'google' | 'other') => {
    if (hasChanges) {
      toast.error('⚠️ احفظ التغييرات أولاً!')
      return
    }

    setDistributing(true)
    try {
      const res = await fetch('/api/distribution/auto-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 100, strategy, source })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`✅ ${data.message}`)
      } else {
        toast.error(`❌ ${data.error}`)
      }
    } catch (error) {
      toast.error('❌ فشل التوزيع')
    } finally {
      setDistributing(false)
    }
  }

  const updateWeight = (index: number, field: 'googleWeight' | 'otherWeight', value: number) => {
    const newRules = [...rules]
    newRules[index][field] = value
    setRules(newRules)
    setHasChanges(true)
  }

  const toggleActive = (index: number) => {
    const newRules = [...rules]
    newRules[index].isActive = !newRules[index].isActive
    setRules(newRules)
    setHasChanges(true)
  }

  const totalGoogle = rules.filter(r => r.isActive).reduce((s, r) => s + r.googleWeight, 0)
  const totalOther = rules.filter(r => r.isActive).reduce((s, r) => s + r.otherWeight, 0)

  if (loading) {
    return (
      <DashboardLayout>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {() => (
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Network className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    نظام التوزيع
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    إدارة توزيع الزيارات على صفحات المبيعات
                  </p>
                </div>
              </div>

              {hasChanges && (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium animate-pulse">
                    ⚠️ تغييرات غير محفوظة
                  </span>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <Save className="h-5 w-5" />
                    حفظ التغييرات
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* توزيع سريع */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              توزيع تلقائي سريع
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleDistribute('WEIGHTED', 'google')}
                disabled={distributing || hasChanges}
                className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <TrendingUp className="h-5 w-5" />
                Google مرجح
              </button>
              <button
                onClick={() => handleDistribute('WEIGHTED', 'other')}
                disabled={distributing || hasChanges}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Globe className="h-5 w-5" />
                Other مرجح
              </button>
              <button
                onClick={() => handleDistribute('EQUAL', 'google')}
                disabled={distributing || hasChanges}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                Google متساوي
              </button>
              <button
                onClick={() => handleDistribute('EQUAL', 'other')}
                disabled={distributing || hasChanges}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                Other متساوي
              </button>
            </div>
          </div>

          {/* جدول التوزيع */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              إعدادات التوزيع
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-right py-3 px-4 text-sm font-bold">الصفحة</th>
                    <th className="text-center py-3 px-4 text-sm font-bold">
                      <div className="flex flex-col items-center">
                        <TrendingUp className="h-4 w-4 text-red-500 mb-1" />
                        Google
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-bold">
                      <div className="flex flex-col items-center">
                        <Globe className="h-4 w-4 text-blue-500 mb-1" />
                        Other
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rules.map((rule, index) => (
                    <tr key={rule.path} className={!rule.isActive ? 'opacity-50' : ''}>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {rule.path}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={rule.googleWeight}
                          onChange={(e) => updateWeight(index, 'googleWeight', parseFloat(e.target.value) || 0)}
                          disabled={!rule.isActive}
                          className="w-20 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={rule.otherWeight}
                          onChange={(e) => updateWeight(index, 'otherWeight', parseFloat(e.target.value) || 0)}
                          disabled={!rule.isActive}
                          className="w-20 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleActive(index)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            rule.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {rule.isActive ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              نشط
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <X className="h-3 w-3" />
                              معطل
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* الإجمالي */}
                  <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                    <td className="py-3 px-4">الإجمالي</td>
                    <td className="py-3 px-4 text-center text-blue-700 dark:text-blue-400">
                      {totalGoogle.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-center text-blue-700 dark:text-blue-400">
                      {totalOther.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">
                        {rules.filter(r => r.isActive).length} نشط
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ملاحظات */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">ملاحظات مهمة:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>النسب لا يجب أن تساوي 100% - النظام يحسب النسب النسبية تلقائياً</li>
                    <li>الوزن = 0 يعني الصفحة لن تحصل على أي زيارات</li>
                    <li>الصفحة المعطلة لن تستقبل زيارات حتى لو كان لها وزن</li>
                    <li>✨ التوزيع المرجح يستخدم خوارزمية دقة 100%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  )
}

