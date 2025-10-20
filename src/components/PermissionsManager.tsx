'use client'

import { useState } from 'react'
import { 
  Permission, 
  PERMISSION_LABELS, 
  PERMISSION_CATEGORIES, 
  PERMISSION_PRESETS 
} from '@/types/permissions'
import { 
  Shield, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Users,
  FileText,
  BookOpen,
  Settings,
  BarChart3,
  Lock,
  Unlock
} from 'lucide-react'

interface PermissionsManagerProps {
  selectedPermissions: Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
}

export default function PermissionsManager({ 
  selectedPermissions, 
  onChange, 
  disabled = false 
}: PermissionsManagerProps) {
  const [permissionMode, setPermissionMode] = useState<'full' | 'custom'>(
    selectedPermissions.length === Object.values(Permission).length ? 'full' : 'custom'
  )
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(PERMISSION_CATEGORIES)
  )
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // تحديث الوضع عند تغيير الصلاحيات
  const handleModeChange = (mode: 'full' | 'custom') => {
    setPermissionMode(mode)
    if (mode === 'full') {
      onChange(Object.values(Permission))
      setSelectedPreset('ADMIN')
    } else {
      // عند اختيار تخصيص، نبدأ بصلاحيات فارغة
      onChange([])
      setSelectedPreset(null)
    }
  }

  // أيقونات الفئات
  const categoryIcons: Record<string, any> = {
    'السير الذاتية': FileText,
    'العقود': BookOpen,
    'الحجوزات': BookOpen,
    'الإدارة': Users,
    'التقارير': BarChart3
  }

  // تبديل توسيع الفئة
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // تبديل الصلاحية
  const togglePermission = (permission: Permission) => {
    if (disabled) return

    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter(p => p !== permission)
      : [...selectedPermissions, permission]
    
    onChange(newPermissions)
    setSelectedPreset(null) // إلغاء اختيار القالب عند التعديل اليدوي
  }

  // تطبيق قالب صلاحيات
  const applyPreset = (presetKey: string) => {
    if (disabled) return
    
    const preset = PERMISSION_PRESETS[presetKey as keyof typeof PERMISSION_PRESETS]
    if (preset) {
      onChange(preset.permissions)
      setSelectedPreset(presetKey)
    }
  }

  // تحديد/إلغاء الكل
  const toggleAll = (select: boolean) => {
    if (disabled) return
    
    if (select) {
      onChange(Object.values(Permission))
    } else {
      onChange([])
    }
    setSelectedPreset(null)
  }

  // حساب عدد الصلاحيات المحددة في كل فئة
  const getCategorySelectionCount = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]
    return categoryPermissions.filter(p => selectedPermissions.includes(p)).length
  }

  return (
    <div className="space-y-6">
      {/* اختيار نوع الصلاحيات */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          نوع الصلاحيات
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleModeChange('full')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              permissionMode === 'full'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
            }`}
          >
            <Lock className="h-4 w-4 inline ml-2" />
            صلاحيات كاملة (دول)
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              permissionMode === 'custom'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
            }`}
          >
            <Settings className="h-4 w-4 inline ml-2" />
            تخصيص الصلاحيات
          </button>
        </div>
      </div>

      {/* القوالب الجاهزة - تظهر فقط في وضع التخصيص */}
      {permissionMode === 'custom' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            قوالب الصلاحيات الجاهزة
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                disabled={disabled}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                selectedPreset === key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium">{preset.name}</div>
              <div className="text-xs opacity-75 mt-1">
                {preset.permissions.length} صلاحية
              </div>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* أزرار التحكم السريع - تظهر فقط في وضع التخصيص */}
      {permissionMode === 'custom' && (
      <div className="flex gap-2">
        <button
          onClick={() => toggleAll(true)}
          disabled={disabled}
          className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Unlock className="h-4 w-4" />
          تحديد الكل
        </button>
        <button
          onClick={() => toggleAll(false)}
          disabled={disabled}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Lock className="h-4 w-4" />
          إلغاء الكل
        </button>
        <div className="mr-auto px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
          {selectedPermissions.length} من {Object.values(Permission).length} صلاحية محددة
        </div>
      </div>
      )}

      {/* الصلاحيات بالفئات - تظهر فقط في وضع التخصيص */}
      {permissionMode === 'custom' && (
      <div className="space-y-3">
        {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
          const Icon = categoryIcons[category] || Shield
          const isExpanded = expandedCategories.includes(category)
          const selectionCount = getCategorySelectionCount(category)
          const totalCount = permissions.length

          return (
            <div 
              key={category} 
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* رأس الفئة */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium text-foreground">
                      {category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectionCount} من {totalCount} محدد
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectionCount > 0 && (
                    <div className={`w-2 h-2 rounded-full ${
                      selectionCount === totalCount 
                        ? 'bg-green-500' 
                        : 'bg-yellow-500'
                    }`} />
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* قائمة الصلاحيات */}
              {isExpanded && (
                <div className="border-t border-border">
                  {permissions.map((permission) => {
                    const isSelected = selectedPermissions.includes(permission)

                    return (
                      <label
                        key={permission}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer ${
                          disabled ? 'opacity-50 cursor-not-allowed' : ''
                        } ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePermission(permission)}
                          disabled={disabled}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className={`text-sm flex-1 ${
                          isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>
                          {PERMISSION_LABELS[permission]}
                        </span>
                        {permission === Permission.ADMIN && (
                          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs rounded-md font-medium">
                            كامل
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}

      {/* ملاحظة - تظهر في وضع التخصيص فقط */}
      {permissionMode === 'custom' && selectedPermissions.includes(Permission.ADMIN) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <div className="font-medium mb-1">صلاحيات المدير الكاملة</div>
              <div className="text-xs opacity-90">
                هذا المستخدم لديه صلاحيات كاملة على جميع أجزاء النظام
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
