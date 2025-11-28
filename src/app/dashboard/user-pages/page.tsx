'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Link, Save, RefreshCw, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface User {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
  salesPages?: string[]
}

export default function UserPagesPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // حماية الصفحة - ADMIN فقط
  if (user && user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">غير مصرح</h1>
            <p className="text-muted-foreground">هذه الصفحة مخصصة للمدير العام فقط</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const salesPages = [
    { id: 'sales1', name: 'صفحة المبيعات 1' },
    { id: 'sales2', name: 'صفحة المبيعات 2' },
    { id: 'sales3', name: 'صفحة المبيعات 3' },
    { id: 'sales4', name: 'صفحة المبيعات 4' },
    { id: 'sales5', name: 'صفحة المبيعات 5' },
    { id: 'sales6', name: 'صفحة المبيعات 6' },
    { id: 'sales7', name: 'صفحة المبيعات 7' },
    { id: 'sales8', name: 'صفحة المبيعات 8' },
    { id: 'sales9', name: 'صفحة المبيعات 9' },
    { id: 'sales10', name: 'صفحة المبيعات 10' },
    { id: 'sales11', name: 'صفحة المبيعات 11' },
    { id: 'transfer-services', name: 'نقل الخدمات' }
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.users) {
        // جلب صفحات كل مستخدم
        const usersWithPages = await Promise.all(
          data.users
            .filter((u: User) => u.role !== 'DEVELOPER' && u.isActive)
            .map(async (u: User) => {
              const pagesResponse = await fetch(`/api/users/assign-pages?userId=${u.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              const pagesData = await pagesResponse.json()
              return {
                ...u,
                salesPages: pagesData.success ? pagesData.salesPages : []
              }
            })
        )
        setUsers(usersWithPages)
      } else {
        toast.error(data.error || 'حدث خطأ أثناء جلب المستخدمين')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('حدث خطأ أثناء جلب المستخدمين')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setSelectedPages(user.salesPages || [])
  }

  const togglePage = (pageId: string) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(p => p !== pageId)
        : [...prev, pageId]
    )
  }

  const selectAllPages = () => {
    setSelectedPages(salesPages.map(p => p.id))
  }

  const clearAllPages = () => {
    setSelectedPages([])
  }

  const handleSave = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/assign-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          salesPageIds: selectedPages
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchUsers()
        setSelectedUser(null)
        setSelectedPages([])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error saving pages:', error)
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card-gradient-primary rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Link className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ربط المستخدمين بالصفحات</h1>
                <p className="text-white/80 text-sm">تحديد صفحات المبيعات المخصصة لكل مستخدم</p>
              </div>
            </div>
            <button
              onClick={fetchUsers}
              className="btn-gradient-success px-4 py-2 rounded-lg flex items-center gap-2 hover-lift"
            >
              <RefreshCw className="w-5 h-5" />
              تحديث
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* قائمة المستخدمين */}
          <div className="card rounded-xl shadow-sm border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                المستخدمين
              </h2>
            </div>
            
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground">لا يوجد مستخدمين</p>
                </div>
              ) : (
                users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedUser?.id === u.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{u.name}</h3>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">الصفحات المخصصة</p>
                        <p className="text-2xl font-bold text-primary">
                          {u.salesPages?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* تحديد الصفحات */}
          <div className="card rounded-xl shadow-sm border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {selectedUser ? `صفحات ${selectedUser.name}` : 'اختر مستخدم'}
              </h2>
            </div>

            {selectedUser ? (
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPages}
                    className="flex-1 btn btn-secondary text-sm py-2"
                  >
                    <Check className="w-4 h-4 inline-block ml-1" />
                    تحديد الكل
                  </button>
                  <button
                    onClick={clearAllPages}
                    className="flex-1 btn bg-muted text-muted-foreground hover:bg-accent text-sm py-2"
                  >
                    <X className="w-4 h-4 inline-block ml-1" />
                    إلغاء الكل
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {salesPages.map(page => (
                    <div
                      key={page.id}
                      onClick={() => togglePage(page.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPages.includes(page.id)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{page.name}</span>
                        {selectedPages.includes(page.id) && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">
                    تم تحديد {selectedPages.length} من {salesPages.length} صفحة
                  </p>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="spinner w-4 h-4 inline-block ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 inline-block ml-2" />
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground text-lg mb-2">اختر مستخدم لتحديد صفحاته</p>
                <p className="text-sm text-muted-foreground">انقر على أحد المستخدمين من القائمة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
