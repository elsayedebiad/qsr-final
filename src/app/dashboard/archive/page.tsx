'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CVStatus, Priority } from '@prisma/client'
import { 
  Archive, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Edit,
  Download,
  ArrowLeft,
  RotateCcw,
  FileText,
  Eye,
  CheckCircle2,
  Undo2
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface CV {
  id: string
  fullName: string
  fullNameArabic?: string
  email?: string
  phone?: string
  referenceCode?: string
  position?: string
  nationality?: string
  age?: number
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

export default function ArchivePage() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CV[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCvs, setSelectedCvs] = useState<string[]>([])

  useEffect(() => {
    fetchArchivedCVs()
  }, [])

  useEffect(() => {
    filterCVs()
  }, [cvs, searchTerm])

  const fetchArchivedCVs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/cvs?status=ARCHIVED', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCvs(data.cvs || [])
      } else {
        toast.error('فشل في تحميل السير الذاتية المؤرشفة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const filterCVs = () => {
    let filtered = cvs

    if (searchTerm) {
      filtered = filtered.filter(cv =>
        cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.fullNameArabic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.phone?.includes(searchTerm) ||
        cv.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCvs(filtered)
  }

  const handleSelectCV = (cvId: string) => {
    setSelectedCvs(prev => 
      prev.includes(cvId) 
        ? prev.filter(id => id !== cvId)
        : [...prev, cvId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCvs.length === filteredCvs.length) {
      setSelectedCvs([])
    } else {
      setSelectedCvs(filteredCvs.map(cv => cv.id))
    }
  }

  const handleRestoreSelected = async () => {
    if (selectedCvs.length === 0) {
      toast.error('يرجى تحديد سير ذاتية لاستعادتها')
      return
    }

    try {
      const token = localStorage.getItem('token')
      for (const cvId of selectedCvs) {
        await fetch(`/api/cvs/${cvId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'NEW' })
        })
      }

      toast.success(`تم استعادة ${selectedCvs.length} سيرة ذاتية إلى قائمة الجديد`)
      setSelectedCvs([])
      fetchArchivedCVs()
    } catch (error) {
      toast.error('فشل في استعادة السير الذاتية')
    }
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

  if (isLoading) {
    return (
      <DashboardLayout>
        {() => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="spinner w-32 h-32 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل الأرشيف...</p>
            </div>
          </div>
        )}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {() => (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-muted-foreground ml-3" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">الأرشيف</h1>
                <p className="text-muted-foreground">السير الذاتية المؤرشفة</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-muted/50 text-foreground px-4 py-2 rounded-lg">
                <span className="font-medium">{filteredCvs.length} سيرة مؤرشفة</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="card p-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="البحث في الأرشيف..."
                className="w-full pr-10 pl-4 py-2 border border-border rounded-md focus:ring-ring focus:border-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>

          {/* Selection Banner */}
          {selectedCvs.length > 0 && (
            <div className="card p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-primary font-medium">
                    تم تحديد {selectedCvs.length} سيرة ذاتية
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCvs([])}
                    className="btn btn-secondary text-sm"
                  >
                    إلغاء التحديد
                  </button>
                  <button
                    onClick={handleRestoreSelected}
                    className="btn btn-primary text-sm flex items-center gap-2"
                  >
                    <Undo2 className="h-4 w-4" />
                    استعادة المحدد
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {filteredCvs.length === 0 ? (
            <div className="card p-12 text-center">
              <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'لا توجد نتائج' : 'الأرشيف فارغ'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'لم يتم العثور على سير ذاتية تطابق البحث' 
                  : 'لا توجد سير ذاتية مؤرشفة حالياً'
                }
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-4 text-right">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary bg-input border-2 border-border rounded focus:ring-2 focus:ring-primary"
                          checked={selectedCvs.length === filteredCvs.length && filteredCvs.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-4 font-semibold text-muted-foreground text-right">الاسم الكامل</th>
                      <th className="px-3 py-4 font-semibold text-muted-foreground text-center">الكود المرجعي</th>
                      <th className="px-3 py-4 font-semibold text-muted-foreground text-center">الجنسية</th>
                      <th className="px-3 py-4 font-semibold text-muted-foreground text-center">الوظيفة</th>
                      <th className="px-3 py-4 font-semibold text-muted-foreground text-center">العمر</th>
                      <th className="px-3 py-4 font-semibold text-muted-foreground text-center">تاريخ الأرشفة</th>
                      <th className="px-3 py-4 font-semibold text-muted-foreground text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCvs.map((cv) => (
                      <tr key={cv.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary bg-input border-2 border-border rounded focus:ring-2 focus:ring-primary"
                            checked={selectedCvs.includes(cv.id)}
                            onChange={() => handleSelectCV(cv.id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {cv.fullName}
                              </p>
                              {cv.fullNameArabic && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {cv.fullNameArabic}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-sm font-mono text-foreground">
                            {cv.referenceCode || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-sm text-foreground">
                            {cv.nationality || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-sm text-foreground">
                            {cv.position || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-sm font-semibold text-foreground">
                            {cv.age || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-sm text-muted-foreground">
                            {new Date(cv.updatedAt).toLocaleDateString('ar-SA')}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => router.push(`/cv/${cv.id}`)}
                              className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                              title="عرض السيرة الذاتية"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token')
                                  await fetch(`/api/cvs/${cv.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ status: 'NEW' })
                                  })
                                  toast.success('تم استعادة السيرة الذاتية')
                                  fetchArchivedCVs()
                                } catch (error) {
                                  toast.error('فشل في استعادة السيرة الذاتية')
                                }
                              }}
                              className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                              title="استعادة من الأرشيف"
                            >
                              <Undo2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}