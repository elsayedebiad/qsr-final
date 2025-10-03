'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Priority, Role } from '@prisma/client'
import { ArrowLeft, Save, FileText, Shield } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: Role
}

export default function AddCVPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: '',
    fullNameArabic: '',
    email: '',
    phone: '',
    referenceCode: '',
    
    // Employment Details
    monthlySalary: '',
    contractPeriod: '',
    position: '',
    
    // Passport Information
    passportNumber: '',
    passportExpiryDate: '',
    passportIssuePlace: '',
    
    // Personal Information
    nationality: '',
    religion: '',
    dateOfBirth: '',
    placeOfBirth: '',
    livingTown: '',
    maritalStatus: 'SINGLE',
    numberOfChildren: 0,
    weight: '',
    height: '',
    complexion: '',
    age: 0,
    
    // Languages and Skills
    englishLevel: 'NO',
    arabicLevel: 'YES',
    babySitting: 'NO',
    childrenCare: 'NO',
    tutoring: 'NO',
    disabledCare: 'NO',
    cleaning: 'NO',
    washing: 'NO',
    ironing: 'NO',
    arabicCooking: 'NO',
    sewing: 'NO',
    driving: 'NO',
    
    // Previous Employment
    previousEmployment: '',
    
    // Legacy fields
    experience: '',
    education: '',
    skills: '',
    summary: '',
    priority: Priority.MEDIUM,
    notes: '',
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        if (data.user.role !== Role.ADMIN && data.user.role !== Role.SUB_ADMIN) {
          toast.error('عذراً، فقط المدير العام أو نائبه يمكنهم إضافة السير الذاتية')
          router.push('/dashboard')
          return
        }
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحقق من الصلاحيات')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fullName.trim()) {
      toast.error('الاسم الكامل مطلوب')
      return
    }

    if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUB_ADMIN)) {
      toast.error('عذراً، فقط المدير العام أو نائبه يمكنهم إضافة السير الذاتية')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/cvs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('تم إضافة السيرة الذاتية بنجاح')
        router.push(`/dashboard/cv/${data.cv.id}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'فشل في إضافة السيرة الذاتية')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة السيرة الذاتية')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityText = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'منخفضة'
      case Priority.MEDIUM:
        return 'متوسطة'
      case Priority.HIGH:
        return 'عالية'
      case Priority.URGENT:
        return 'عاجلة'
      default:
        return priority
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-32 h-32"></div>
      </div>
    )
  }

  if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUB_ADMIN)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">ليس لديك صلاحية</h3>
          <p className="mt-1 text-sm text-muted-foreground">هذه الصفحة مخصصة للمدراء فقط</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-primary hover:text-indigo-800"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="ml-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <FileText className="h-6 w-6 text-primary ml-3" />
              <h1 className="text-xl font-semibold text-foreground">إضافة سيرة ذاتية جديدة</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-card shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-4">المعلومات الشخصية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.fullName}
                    onChange={handleChange}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.email}
                    onChange={handleChange}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.phone}
                    onChange={handleChange}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-foreground mb-1">
                    المنصب المطلوب
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.position}
                    onChange={handleChange}
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-card shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-4">المعلومات المهنية</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-foreground mb-1">
                    سنوات الخبرة
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.experience}
                    onChange={handleChange}
                    dir="rtl"
                    placeholder="مثال: 3-5 سنوات"
                  />
                </div>
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-foreground mb-1">
                    المؤهل العلمي
                  </label>
                  <textarea
                    id="education"
                    name="education"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.education}
                    onChange={handleChange}
                    dir="rtl"
                    placeholder="بكالوريوس في علوم الحاسوب - جامعة..."
                  />
                </div>
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-foreground mb-1">
                    المهارات
                  </label>
                  <textarea
                    id="skills"
                    name="skills"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.skills}
                    onChange={handleChange}
                    dir="rtl"
                    placeholder="JavaScript, React, Node.js, إدارة المشاريع..."
                  />
                </div>
                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-foreground mb-1">
                    ملخص مهني
                  </label>
                  <textarea
                    id="summary"
                    name="summary"
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.summary}
                    onChange={handleChange}
                    dir="rtl"
                    placeholder="ملخص موجز عن الخبرات والإنجازات المهنية..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-card shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-foreground mb-4">معلومات إضافية</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-1">
                    الأولوية
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value={Priority.LOW}>{getPriorityText(Priority.LOW)}</option>
                    <option value={Priority.MEDIUM}>{getPriorityText(Priority.MEDIUM)}</option>
                    <option value={Priority.HIGH}>{getPriorityText(Priority.HIGH)}</option>
                    <option value={Priority.URGENT}>{getPriorityText(Priority.URGENT)}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
                    ملاحظات
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                    value={formData.notes}
                    onChange={handleChange}
                    dir="rtl"
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 ml-2" />
              {isLoading ? 'جاري الحفظ...' : 'حفظ السيرة الذاتية'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
