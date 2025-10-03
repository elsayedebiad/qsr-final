'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CVStatus, Priority } from '@prisma/client'
import { 
  UserCheck, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Edit,
  Download,
  ArrowLeft,
  Trophy,
  CheckCircle2
} from 'lucide-react'

interface CV {
  id: string
  fullName: string
  email?: string
  phone?: string
  position?: string
  experience?: string
  status: CVStatus
  priority: Priority
  createdAt: string
  updatedAt: string
  createdBy: {
    name: string
    email: string
  }
}

export default function HiredCVsPage() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CV[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchHiredCVs()
  }, [])

  useEffect(() => {
    filterCVs()
  }, [cvs, searchTerm])

  const fetchHiredCVs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/cvs?status=HIRED', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCvs(data.cvs || []);
      } else {
        toast.error('فشل في تحميل السير الذاتية للمتعاقدين');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCVs = () => {
    let filtered = cvs

    if (searchTerm) {
      filtered = filtered.filter(cv =>
        cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.phone?.includes(searchTerm) ||
        cv.position?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCvs(filtered)
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'bg-muted text-foreground'
      case Priority.MEDIUM:
        return 'bg-info/10 text-info'
      case Priority.HIGH:
        return 'bg-orange-100 text-orange-800'
      case Priority.URGENT:
        return 'bg-destructive/10 text-destructive'
      default:
        return 'bg-muted text-foreground'
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

  // Calculate statistics
  const totalHired = filteredCvs.length
  const thisMonth = filteredCvs.filter(cv => {
    const cvDate = new Date(cv.updatedAt)
    const now = new Date()
    return cvDate.getMonth() === now.getMonth() && cvDate.getFullYear() === now.getFullYear()
  }).length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-32 h-32"></div>
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
                onClick={() => router.push('/dashboard')}
                className="ml-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Trophy className="h-8 w-8 text-success ml-3" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">المتعاقدون</h1>
                <p className="text-sm text-muted-foreground">المرشحون الذين تم التعاقد معهم</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-success/10 text-success px-4 py-2 rounded-lg">
                <span className="font-medium">{totalHired} متعاقد</span>
              </div>
              <div className="bg-info/10 text-info px-4 py-2 rounded-lg">
                <span className="font-medium">{thisMonth} هذا الشهر</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="البحث في المتعاقدين..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:ring-ring focus:border-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              dir="rtl"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-success" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">إجمالي المتعاقدين</dt>
                  <dd className="text-lg font-medium text-foreground">{totalHired}</dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-info" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">هذا الشهر</dt>
                  <dd className="text-lg font-medium text-foreground">{thisMonth}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">معدل النجاح</dt>
                  <dd className="text-lg font-medium text-foreground">
                    {totalHired > 0 ? '100%' : '0%'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">متوسط الخبرة</dt>
                  <dd className="text-lg font-medium text-foreground">
                    {filteredCvs.length > 0 ? '5+' : '0'} سنوات
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* CV Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCvs.map((cv) => (
            <div key={cv.id} className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-green-500">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <CheckCircle2 className="h-5 w-5 text-success ml-2" />
                      <h3 className="text-lg font-semibold text-foreground">{cv.fullName}</h3>
                    </div>
                    {cv.position && (
                      <p className="text-sm text-muted-foreground mb-2">{cv.position}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(cv.priority)}`}>
                    {getPriorityText(cv.priority)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {cv.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 ml-2" />
                      {cv.email}
                    </div>
                  )}
                  {cv.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 ml-2" />
                      {cv.phone}
                    </div>
                  )}
                  {cv.experience && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 ml-2" />
                      {cv.experience} سنوات خبرة
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/dashboard/cv/${cv.id}`)}
                      className="text-primary hover:text-indigo-800 transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="تصدير PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                    <Trophy className="h-3 w-3 ml-1" />
                    متعاقد
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  تاريخ التعاقد: {new Date(cv.updatedAt).toLocaleDateString('ar-SA')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCvs.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">لا يوجد متعاقدون</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? 'لا توجد نتائج تطابق البحث' : 'لم يتم التعاقد مع أي مرشحين بعد'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:opacity-90"
              >
                العودة للوحة التحكم
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
