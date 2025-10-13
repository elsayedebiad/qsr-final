'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CVStatus, Priority } from '@prisma/client'
import { 
  UserCheck, 
  Search, 
  Filter, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  ArrowLeft,
  X,
  AlertTriangle,
  Eye
} from 'lucide-react'
import DashboardLayout from '../../../components/DashboardLayout'

interface Booking {
  id: number
  cvId: number
  identityNumber: string
  bookedAt: string
  notes?: string
  status: string
  cv: {
    id: number
    fullName: string
    fullNameArabic?: string
    referenceCode?: string
    nationality?: string
    position?: string
    profileImage?: string
    status: string
    email?: string
    phone?: string
    priority: Priority
  }
  bookedBy: {
    id: number
    name: string
    email: string
  }
}

export default function BookedCVsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userRole, setUserRole] = useState<string>('')
  
  // حالة مودال التعاقد
  const [showContractModal, setShowContractModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [contractIdentityNumber, setContractIdentityNumber] = useState('')
  const [isCreatingContract, setIsCreatingContract] = useState(false)
  
  // حالة مودال الحذف
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    // جلب معلومات المستخدم
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserRole(user.role)
    }
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data || [])
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else {
        toast.error('فشل في تحميل الحجوزات')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.cv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.cv.phone?.includes(searchTerm) ||
        booking.cv.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.identityNumber.includes(searchTerm)
      )
    }

    setFilteredBookings(filtered)
  }

  // فتح مودال التعاقد
  const openContractModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setContractIdentityNumber(booking.identityNumber) // تعبئة رقم الهوية من الحجز
    setShowContractModal(true)
  }

  // إغلاق مودال التعاقد
  const closeContractModal = () => {
    setShowContractModal(false)
    setSelectedBooking(null)
    setContractIdentityNumber('')
    setIsCreatingContract(false)
  }

  // تأكيد إنشاء التعاقد
  const confirmCreateContract = async () => {
    if (!selectedBooking || !contractIdentityNumber.trim()) {
      toast.error('يرجى إدخال رقم الهوية')
      return
    }

    setIsCreatingContract(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${selectedBooking.id}/contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          identityNumber: contractIdentityNumber.trim(),
          contractDate: new Date().toISOString(),
          notes: null
        })
      })

      if (response.ok) {
        toast.success('تم إنشاء التعاقد بنجاح')
        closeContractModal()
        fetchBookings() // تحديث قائمة الحجوزات
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إنشاء التعاقد')
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      toast.error(error instanceof Error ? error.message : 'فشل في إنشاء التعاقد')
    } finally {
      setIsCreatingContract(false)
    }
  }

  const handleStatusChange = async (cvId: string, newStatus: CVStatus) => {
    try {
      const response = await fetch(`/api/cvs/${cvId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('تم تحديث الحالة بنجاح')
        fetchBookings() // Refresh the list
      } else {
        toast.error('فشل في تحديث الحالة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الحالة')
    }
  }

  // فتح مودال الحذف
  const openDeleteModal = (booking: Booking) => {
    setBookingToDelete(booking)
    setShowDeleteModal(true)
  }

  // إغلاق مودال الحذف
  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setBookingToDelete(null)
    setIsDeleting(false)
  }

  // حذف الحجز
  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return

    setIsDeleting(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('تم حذف الحجز بنجاح وإعادة السيرة إلى قائمة الجديد')
        closeDeleteModal()
        fetchBookings() // تحديث القائمة
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في حذف الحجز')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error(error instanceof Error ? error.message : 'فشل في حذف الحجز')
    } finally {
      setIsDeleting(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-32 h-32"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      {(user) => (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserCheck className="h-8 w-8 text-warning" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">السير الذاتية المحجوزة</h1>
                <p className="text-sm text-muted-foreground">المرشحون الذين تم حجزهم للمقابلات</p>
              </div>
            </div>
            <div className="bg-warning/10 text-warning px-4 py-2 rounded-lg">
              <span className="font-medium">{filteredBookings.length} حجز نشط</span>
            </div>
          </div>
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
            <input
              type="text"
              placeholder="البحث في السير الذاتية المحجوزة..."
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              dir="rtl"
            />
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow border-r-4 border-r-warning">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{booking.cv.fullName}</h3>
                    {booking.cv.fullNameArabic && (
                      <p className="text-sm text-muted-foreground mb-1">{booking.cv.fullNameArabic}</p>
                    )}
                    {booking.cv.position && (
                      <p className="text-sm text-muted-foreground mb-2">{booking.cv.position}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(booking.cv.priority)}`}>
                    {getPriorityText(booking.cv.priority)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 ml-2" />
                    رقم الهوية: {booking.identityNumber}
                  </div>
                  {booking.cv.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 ml-2" />
                      {booking.cv.email}
                    </div>
                  )}
                  {booking.cv.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 ml-2" />
                      {booking.cv.phone}
                    </div>
                  )}
                  {booking.notes && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 ml-2" />
                      ملاحظات: {booking.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => router.push(`/dashboard/cv/${booking.cv.id}`)}
                      className="text-primary hover:opacity-80 transition-colors"
                      title="عرض/تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="تصدير PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {/* حذف الحجز - متاح للمدراء فقط (ليس للمبيعات) */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                      <button
                        onClick={() => openDeleteModal(booking)}
                        className="text-destructive hover:opacity-80 transition-colors"
                        title="حذف الحجز"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {/* زر التعاقد - متاح للمدراء فقط (ليس للمبيعات) */}
                  {(user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') && (
                    <button
                      onClick={() => openContractModal(booking)}
                      className="btn-success inline-flex items-center px-3 py-1 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 ml-1" />
                      تعاقد
                    </button>
                  )}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  تم الحجز: {new Date(booking.bookedAt).toLocaleDateString('ar-SA')} بواسطة {booking.bookedBy.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">لا توجد سير ذاتية محجوزة</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? 'لا توجد نتائج تطابق البحث' : 'لم يتم حجز أي مرشحين بعد'}
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

        {/* مودال تأكيد الحذف */}
        {showDeleteModal && bookingToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  تأكيد حذف الحجز
                </h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isDeleting}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-foreground mb-2">معلومات الحجز:</h4>
                  <div className="text-sm text-foreground space-y-1">
                    <p><span className="font-medium">الاسم:</span> {bookingToDelete.cv.fullName}</p>
                    <p><span className="font-medium">الوظيفة:</span> {bookingToDelete.cv.position}</p>
                    <p><span className="font-medium">رقم الهوية:</span> {bookingToDelete.identityNumber}</p>
                    <p><span className="font-medium">الكود المرجعي:</span> {bookingToDelete.cv.referenceCode}</p>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-warning">
                    <strong>تحذير:</strong> عند الحذف سيتم:
                  </p>
                  <ul className="text-xs text-warning mt-1 space-y-1">
                    <li>• حذف الحجز نهائياً من النظام</li>
                    <li>• إعادة السيرة الذاتية إلى قائمة "الجديد"</li>
                    <li>• تسجيل هذه العملية في سجل الأنشطة</li>
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground">
                  هذه العملية متاحة للأدمن العام فقط ولا يمكن التراجع عنها.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={isDeleting}
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteBooking}
                  className="flex-1 bg-destructive hover:opacity-90 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      تأكيد الحذف
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* مودال تأكيد التعاقد */}
        {showContractModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">تأكيد التعاقد</h3>
              <button
                onClick={closeContractModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isCreatingContract}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-foreground mb-2">معلومات السيرة الذاتية:</h4>
                <div className="text-sm text-foreground space-y-1">
                  <p><span className="font-medium">الاسم:</span> {selectedBooking.cv.fullName}</p>
                  <p><span className="font-medium">الوظيفة:</span> {selectedBooking.cv.position}</p>
                  <p><span className="font-medium">الكود المرجعي:</span> {selectedBooking.cv.referenceCode}</p>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="identityNumber" className="block text-sm font-medium text-foreground mb-2">
                  رقم الهوية للتعاقد:
                </label>
                <input
                  type="text"
                  id="identityNumber"
                  value={contractIdentityNumber}
                  onChange={(e) => setContractIdentityNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="أدخل رقم الهوية"
                  disabled={isCreatingContract}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  رقم الهوية المحفوظ من الحجز: {selectedBooking.identityNumber}
                </p>
              </div>

              <div className="bg-info/10 border border-info/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-info">
                  <strong>تنبيه:</strong> عند التأكيد سيتم:
                </p>
                <ul className="text-xs text-info mt-1 space-y-1">
                  <li>• إنشاء تعاقد جديد برقم الهوية المحدد</li>
                  <li>• تحويل حالة السيرة الذاتية إلى "متعاقد"</li>
                  <li>• حذف الحجز الحالي</li>
                  <li>• حذف أي حجوزات أخرى لنفس السيرة الذاتية</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeContractModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-foreground py-2 px-4 rounded-lg font-medium transition-colors"
                disabled={isCreatingContract}
              >
                إلغاء
              </button>
              <button
                onClick={confirmCreateContract}
                className="flex-1 bg-success hover:opacity-90 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                disabled={isCreatingContract || !contractIdentityNumber.trim()}
              >
                {isCreatingContract ? (
                  <>
                    <div className="spinner w-4 h-4"></div>
                    جاري التعاقد...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    تأكيد التعاقد
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </DashboardLayout>
  )
}
