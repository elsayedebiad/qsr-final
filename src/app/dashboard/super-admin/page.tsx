'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Role } from '@prisma/client'
import { 
  User, 
  Plus, 
  Key, 
  Shield, 
  UserCheck,
  Mail,
  Lock,
  Crown,
  Settings,
  Copy,
  RefreshCw
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface UserData {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  createdAt: string
  activationCode?: string
}

const ACTIVATION_CODES = ['30211241501596', '24112002', '2592012']

export default function SuperAdminPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: Role
    isActive: boolean
    activationCode: string
  }>({
    name: '',
    email: '',
    password: '',
    role: Role.USER,
    isActive: true,
    activationCode: ''
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

  const generateActivationCode = () => {
    const randomCode = ACTIVATION_CODES[Math.floor(Math.random() * ACTIVATION_CODES.length)]
    setFormData(prev => ({ ...prev, activationCode: randomCode }))
  }

  const generateCustomCode = () => {
    const timestamp = Date.now().toString()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const customCode = timestamp.slice(-8) + randomNum
    setFormData(prev => ({ ...prev, activationCode: customCode }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('تم إنشاء المستخدم بنجاح')
        setIsModalOpen(false)
        setFormData({ 
          name: '', 
          email: '', 
          password: '', 
          role: Role.USER, 
          isActive: true,
          activationCode: ''
        })
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || 'حدث خطأ')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء المستخدم')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('تم نسخ الكود')
  }


  return (
    <DashboardLayout>
      {(user) => {
        if (!user || user.role !== 'ADMIN') {
          return (
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <div className="bg-destructive/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">غير مسموح بالوصول</h2>
                <p className="text-muted-foreground mb-6">هذه الصفحة متاحة للمدير العام فقط</p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  العودة للداشبورد
                </button>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-card/20 rounded-lg p-3">
                  <Crown className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">لوحة المدير العام</h1>
                  <p className="text-purple-100">إدارة المستخدمين وأكواد التفعيل</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-success hover:opacity-90 text-white p-4 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>إنشاء مستخدم جديد</span>
              </button>
              
              <button
                onClick={() => setIsCodeModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Key className="h-5 w-5" />
                <span>إدارة أكواد التفعيل</span>
              </button>
            </div>

            {/* Users List */}
            <div className="bg-card rounded-lg shadow-lg border border-border">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-info" />
                  المستخدمون المسجلون ({users.length})
                </h2>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">جاري تحميل المستخدمين...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          المستخدم
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          الدور
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          تاريخ الإنشاء
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200">
                      {users.map((userData) => (
                        <tr key={userData.id} className="hover:bg-background">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center ml-4">
                                <User className="h-5 w-5 text-info" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {userData.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {userData.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userData.role === 'ADMIN' 
                                ? 'bg-destructive/10 text-destructive' 
                                : userData.role === 'SUB_ADMIN'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-success/10 text-success'
                            }`}>
                              {userData.role === 'ADMIN' ? 'مدير عام' : 
                               userData.role === 'SUB_ADMIN' ? 'Operation' : 
                               userData.role === 'CUSTOMER_SERVICE' ? 'Customer Service' : 'مستخدم'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userData.isActive 
                                ? 'bg-success/10 text-success' 
                                : 'bg-destructive/10 text-destructive'
                            }`}>
                              {userData.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(userData.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">إنشاء مستخدم جديد</h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        الاسم
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        كلمة المرور
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        الدور
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={Role.USER}>مستخدم عادي</option>
                        <option value={Role.CUSTOMER_SERVICE}>Customer Service</option>
                        <option value={Role.SUB_ADMIN}>Operation</option>
                        <option value={Role.ADMIN}>مدير عام</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        كود التفعيل الخاص
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.activationCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, activationCode: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="كود التفعيل (اختياري)"
                        />
                        <button
                          type="button"
                          onClick={generateActivationCode}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="توليد كود من الأكواد الأساسية"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={generateCustomCode}
                          className="px-3 py-2 bg-success text-white rounded-lg hover:opacity-90 transition-colors"
                          title="توليد كود مخصص"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-border text-info focus:ring-blue-500"
                      />
                      <label htmlFor="isActive" className="text-sm text-foreground">
                        حساب نشط
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        إنشاء المستخدم
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-foreground py-2 px-4 rounded-lg transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Activation Codes Modal */}
            {isCodeModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">أكواد التفعيل الأساسية</h3>
                  
                  <div className="space-y-3">
                    {ACTIVATION_CODES.map((code, index) => (
                      <div key={index} className="flex items-center justify-between bg-background p-3 rounded-lg">
                        <span className="font-mono text-sm">{code}</span>
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="text-info hover:text-info transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => setIsCodeModalOpen(false)}
                      className="w-full bg-gray-300 hover:bg-gray-400 text-foreground py-2 px-4 rounded-lg transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }}
    </DashboardLayout>
  )
}
