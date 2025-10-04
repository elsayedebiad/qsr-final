'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Role } from '@prisma/client'
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck,
  UserX,
  Mail,
  Calendar
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface UserData {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}

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
    isActive: boolean
  }>({
    name: '',
    email: '',
    password: '',
    role: Role.USER,
    isActive: true
  })
  const router = useRouter()

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
    } catch (error) {
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
        setFormData({ name: '', email: '', password: '', role: Role.USER, isActive: true })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || 'حدث خطأ')
      }
    } catch (error) {
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
    } catch (error) {
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
        return 'bg-red-500 text-white'
      case Role.SUB_ADMIN:
        return 'bg-yellow-500 text-white'
      case Role.CUSTOMER_SERVICE:
        return 'bg-blue-500 text-white'
      case Role.USER:
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
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
              setFormData({ name: '', email: '', password: '', role: Role.USER, isActive: true })
              setIsModalOpen(true)
            }}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-colors flex items-center"
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
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الدور</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">تاريخ الإنشاء</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ml-3">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {user.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary hover:text-indigo-900 p-1"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-destructive hover:text-red-900 p-1"
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4 text-black">
              {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">الاسم</label>
                <input
                  type="text"
                  required
                  className="w-full border border-border rounded-md px-3 py-2 focus:ring-ring focus:border-ring"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  className="w-full border border-border rounded-md px-3 py-2 focus:ring-ring focus:border-ring"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  كلمة المرور {editingUser && '(اتركها فارغة للحفاظ على كلمة المرور الحالية)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  className="w-full border border-border rounded-md px-3 py-2 focus:ring-ring focus:border-ring"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">الدور</label>
                <select
                  className="w-full border border-border rounded-md px-3 py-2 focus:ring-ring focus:border-ring"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                >
                  <option value={Role.USER}>sales</option>
                  <option value={Role.CUSTOMER_SERVICE}>Customer Service</option>
                  <option value={Role.SUB_ADMIN}>Operation</option>
                  <option value={Role.ADMIN}>مدير عام</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary border-border rounded focus:ring-ring"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label className="mr-2 text-sm text-foreground">نشط</label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-foreground rounded-md hover:bg-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
                >
                  {editingUser ? 'تحديث' : 'إضافة'}
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

