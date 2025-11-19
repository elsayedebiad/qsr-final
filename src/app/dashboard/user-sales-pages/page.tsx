'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  User, 
  Store, 
  Plus, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  ExternalLink
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface UserData {
  id: number
  name: string
  email: string
  role: string
}

interface Assignment {
  id: number
  userId: number
  salesPageId: string
  createdAt: string
  user: UserData
}

const SALES_PAGES = [
  { id: 'sales1', name: 'Sales 1', color: 'from-green-500 to-blue-500' },
  { id: 'sales2', name: 'Sales 2', color: 'from-purple-500 to-pink-500' },
  { id: 'sales3', name: 'Sales 3', color: 'from-orange-500 to-red-500' },
  { id: 'sales4', name: 'Sales 4', color: 'from-indigo-500 to-blue-500' },
  { id: 'sales5', name: 'Sales 5', color: 'from-pink-500 to-rose-500' },
  { id: 'sales6', name: 'Sales 6', color: 'from-teal-500 to-green-500' },
  { id: 'sales7', name: 'Sales 7', color: 'from-red-500 to-orange-500' },
  { id: 'sales8', name: 'Sales 8', color: 'from-yellow-500 to-amber-500' },
  { id: 'sales9', name: 'Sales 9', color: 'from-cyan-500 to-blue-500' },
  { id: 'sales10', name: 'Sales 10', color: 'from-lime-500 to-green-500' },
  { id: 'sales11', name: 'Sales 11', color: 'from-fuchsia-500 to-purple-500' },
  { id: 'gallery', name: 'المعرض الرئيسي', color: 'from-blue-500 to-cyan-500' },
  { id: 'transfer-services', name: 'معرض نقل الخدمات', color: 'from-amber-500 to-orange-600' }
]

export default function UserSalesPagesPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedSalesPageId, setSelectedSalesPageId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchAssignments()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      // Filter only SALES and USER roles
      const filteredUsers = data.users.filter((user: UserData) => 
        user.role === 'SALES' || user.role === 'USER'
      )
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('فشل في جلب المستخدمين')
    }
  }

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('يرجى تسجيل الدخول أولاً')
        return
      }

      const response = await fetch('/api/user-sales-pages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch assignments:', response.status, errorData)
        throw new Error(errorData.error || `Failed to fetch assignments: ${response.status}`)
      }

      const data = await response.json()
      setAssignments(data.assignments || [])
      
      // إذا كان هناك تحذير بخصوص الجدول
      if (data.warning) {
        toast.error('يرجى تشغيل migration أولاً: npx prisma migrate dev --name add_user_sales_pages', {
          duration: 6000
        })
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      const errorMessage = error instanceof Error ? error.message : 'فشل في جلب التخصيصات'
      toast.error(errorMessage)
      // في حالة عدم وجود الجدول، نعرض قائمة فارغة بدلاً من الخطأ
      setAssignments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId || !selectedSalesPageId) {
      toast.error('يرجى اختيار المستخدم والصفحة')
      return
    }

    try {
      setIsAssigning(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user-sales-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserId,
          salesPageId: selectedSalesPageId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign')
      }

      toast.success('تم تخصيص الصفحة بنجاح!')
      setSelectedUserId(null)
      setSelectedSalesPageId('')
      fetchAssignments()
    } catch (error) {
      console.error('Error assigning:', error)
      const errorMessage = error instanceof Error ? error.message : 'فشل في التخصيص'
      
      // إذا كان الخطأ بسبب عدم وجود النموذج
      if (errorMessage.includes('Database model not found') || 
          errorMessage.includes('Cannot read properties of undefined')) {
        toast.error('يرجى إيقاف الخادم ثم تشغيل: npx prisma generate && npx prisma migrate dev --name add_user_sales_pages', {
          duration: 8000
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDelete = async (assignmentId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التخصيص؟')) {
      return
    }

    try {
      setIsDeleting(assignmentId)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/user-sales-pages/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('تم حذف التخصيص بنجاح!')
      fetchAssignments()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('فشل في حذف التخصيص')
    } finally {
      setIsDeleting(null)
    }
  }

  const getSalesPageName = (salesPageId: string) => {
    return SALES_PAGES.find(p => p.id === salesPageId)?.name || salesPageId
  }

  const getSalesPageColor = (salesPageId: string) => {
    return SALES_PAGES.find(p => p.id === salesPageId)?.color || 'from-gray-500 to-gray-600'
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      assignment.user.name.toLowerCase().includes(search) ||
      assignment.user.email.toLowerCase().includes(search) ||
      getSalesPageName(assignment.salesPageId).toLowerCase().includes(search)
    )
  })

  const getUserAssignments = (userId: number) => {
    return assignments.filter(a => a.userId === userId)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-background rounded-lg shadow-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  تخصيص صفحات المبيعات للمستخدمين
                </h1>
                <p className="text-muted-foreground">إدارة صفحات المبيعات المخصصة لكل مستخدم</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Assignment Form */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            إضافة تخصيص جديد
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                المستخدم
              </label>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
              >
                <option value="">اختر المستخدم</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role === 'SALES' ? 'مبيعات' : 'مستخدم عادي'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                صفحة المبيعات
              </label>
              <select
                value={selectedSalesPageId}
                onChange={(e) => setSelectedSalesPageId(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
              >
                <option value="">اختر الصفحة</option>
                {SALES_PAGES.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAssign}
                disabled={isAssigning || !selectedUserId || !selectedSalesPageId}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    إضافة التخصيص
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن مستخدم أو صفحة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground"
            />
          </div>
        </div>

        {/* Assignments List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل التخصيصات...</p>
            </div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-card rounded-lg shadow-lg border border-border p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-foreground mb-2">لا توجد تخصيصات</p>
            <p className="text-muted-foreground">ابدأ بإضافة تخصيص جديد للمستخدمين</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users
              .filter(user => getUserAssignments(user.id).length > 0)
              .map(user => {
                const userAssignments = getUserAssignments(user.id).filter(a => 
                  !searchTerm || 
                  a.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  getSalesPageName(a.salesPageId).toLowerCase().includes(searchTerm.toLowerCase())
                )

                if (userAssignments.length === 0) return null

                return (
                  <div key={user.id} className="bg-card rounded-lg shadow-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-2 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {user.role === 'SALES' ? 'مبيعات' : 'مستخدم عادي'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userAssignments.length} صفحة مخصصة
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className={`bg-gradient-to-r ${getSalesPageColor(assignment.salesPageId)} rounded-lg p-4 text-white relative group`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{getSalesPageName(assignment.salesPageId)}</h4>
                              <p className="text-xs opacity-90">/{assignment.salesPageId}</p>
                            </div>
                            <button
                              onClick={() => handleDelete(assignment.id)}
                              disabled={isDeleting === assignment.id}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 p-2 rounded-lg disabled:opacity-50"
                              title="حذف التخصيص"
                            >
                              {isDeleting === assignment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <a
                            href={`/${assignment.salesPageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg"
                            title="فتح الصفحة"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

