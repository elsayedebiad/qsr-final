'use client'

import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Role } from '@prisma/client'
import { 
  User, 
  Plus, 
  Trash2, 
  Shield, 
  Settings,
  Key,
  Lock,
  Unlock
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'
import PermissionsManager from '@/components/PermissionsManager'
import { Permission, hasPermission } from '@/types/permissions'

interface UserData {
  id: string
  email: string
  name: string
  role: Role
  permissions: Permission[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: Role
    permissions: Permission[]
    isActive: boolean
  }>({
    name: '',
    email: '',
    password: '',
    role: Role.USER,
    permissions: [],
    isActive: true
  })
  // const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const { users } = await response.json()
        setUsers(users || [])
      } else {
        toast.error('فشل في تحميل المستخدمين')
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل المستخدمين')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingUser ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح')
        setIsModalOpen(false)
        setEditingUser(null)
        setFormData({ name: '', email: '', password: '', role: Role.USER, permissions: [], isActive: true })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ المستخدم')
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.isActive
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('تم حذف المستخدم بنجاح')
        fetchUsers()
      } else {
        toast.error('فشل في حذف المستخدم')
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف المستخدم')
    }
  }

  const getRoleText = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'مدير عام'
      case Role.SUB_ADMIN:
        return 'Operation'
      case Role.CUSTOMER_SERVICE:
        return 'Customer Service'
      case Role.USER:
        return 'sales'
      default:
        return role
    }
  }

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
      case Role.SUB_ADMIN:
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
      case Role.CUSTOMER_SERVICE:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
      case Role.USER:
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-32 h-32"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      {(user) => {
        // Check if user is admin
        if (user?.role !== 'ADMIN') {
          return (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">ليس لديك صلاحية</h3>
              <p className="mt-1 text-sm text-muted-foreground">هذه الصفحة مخصصة للمديرين فقط</p>
            </div>
          )
        }
        
        return (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-primary ml-3" />
                <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
              </div>
            </div>
        {/* Add User Button */}
        <div className="mb-6">
              <button
                onClick={() => {
                  setEditingUser(null)
                  setFormData({ name: '', email: '', password: '', role: Role.USER, permissions: [], isActive: true })
                  setIsModalOpen(true)
                }}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-card shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-background">
              <tr>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">المستخدم</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الدور</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الصلاحيات</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الحالة</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">تاريخ الإنشاء</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ml-3">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-sm text-foreground">{user.email}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getRoleColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {user.permissions && user.permissions.length > 0 ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Key className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                              {user.permissions.length} صلاحية
                            </span>
                          </div>
                          {hasPermission(user.permissions, Permission.ADMIN) && (
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs rounded-md font-medium">
                              كامل
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">لا توجد صلاحيات</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <>
                          <Unlock className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">نشط</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">معطل</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="تعديل المستخدم والصلاحيات"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">لا توجد مستخدمين</h3>
            <p className="mt-1 text-sm text-muted-foreground">ابدأ بإضافة مستخدم جديد</p>
          </div>
        )}

            {/* Add/Edit User Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-primary/10">
                {editingUser ? (
                  <Settings className="h-6 w-6 text-primary" />
                ) : (
                  <Plus className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {editingUser ? 'تعديل المستخدم والصلاحيات' : 'إضافة مستخدم جديد'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingUser ? 'قم بتعديل بيانات وصلاحيات المستخدم' : 'أدخل بيانات المستخدم وحدد صلاحياته'}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* قسم البيانات الأساسية */}
              <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  البيانات الأساسية
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">الاسم</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      كلمة المرور {editingUser && '(اتركها فارغة للحفاظ على الحالية)'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">الدور الوظيفي</label>
                    <select
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    >
                      <option value={Role.USER}>Sales</option>
                      <option value={Role.CUSTOMER_SERVICE}>Customer Service</option>
                      <option value={Role.SUB_ADMIN}>Operation Manager</option>
                      <option value={Role.ADMIN}>مدير عام</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-foreground">حساب نشط</span>
                  </label>
                  {!formData.isActive && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      لن يتمكن المستخدم من تسجيل الدخول
                    </span>
                  )}
                </div>
              </div>
              
              {/* قسم الصلاحيات */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  الصلاحيات والأذونات
                </h4>
                <PermissionsManager
                  selectedPermissions={formData.permissions}
                  onChange={(permissions) => setFormData({ ...formData, permissions })}
                />
              </div>
              {/* الأزرار */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingUser(null)
                    setFormData({ name: '', email: '', password: '', role: Role.USER, permissions: [], isActive: true })
                  }}
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg text-primary-foreground rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                >
                  {editingUser ? (
                    <>
                      <Settings className="h-4 w-4" />
                      تحديث
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      إضافة مستخدم
                    </>
                  )}
                </button>
              </div>
            </form>
              </div>
              </div>
            )}
          </div>
        )
      }}
    </DashboardLayout>
  )
}

