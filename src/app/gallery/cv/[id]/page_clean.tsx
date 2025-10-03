'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CVStatus, Priority, SkillLevel } from '@prisma/client'
import { 
  ArrowLeft, 
  Download, 
  Share2,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Star,
  Award,
  Languages,
  GraduationCap,
  Briefcase,
  Heart,
  Baby,
  Car,
  Home,
  Shirt,
  BookOpen,
  Users,
  Globe
} from 'lucide-react'
import CountryFlag from '../../../../components/CountryFlag'
import html2canvas from 'html2canvas'

interface CV {
  id: string
  fullName: string
  fullNameArabic?: string
  email?: string
  phone?: string
  referenceCode?: string
  monthlySalary?: string
  contractPeriod?: string
  position?: string
  nationality?: string
  maritalStatus?: string
  age?: number
  profileImage?: string
  status: CVStatus
  priority: Priority
  babySitting?: SkillLevel
  childrenCare?: SkillLevel
  tutoring?: SkillLevel
  disabledCare?: SkillLevel
  cleaning?: SkillLevel
  washing?: SkillLevel
  ironing?: SkillLevel
  arabicCooking?: SkillLevel
  sewing?: SkillLevel
  driving?: SkillLevel
  experience?: string
  arabicLevel?: SkillLevel
  englishLevel?: SkillLevel
  religion?: string
  educationLevel?: string
  passportNumber?: string
  passportExpiryDate?: string
  height?: string
  weight?: string
  numberOfChildren?: number
  livingTown?: string
  placeOfBirth?: string
  dateOfBirth?: string
  previousEmployment?: string
}

export default function CVViewPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const cvRef = useRef<HTMLDivElement>(null)
  
  const [cv, setCv] = useState<CV | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  
  const cvId = params?.id as string
  const autoDownload = searchParams?.get('autoDownload') === 'true'
  const hideUI = searchParams?.get('hideUI') === 'true'

  // التحقق من حالة تسجيل الدخول
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            setIsLoggedIn(true)
          } else {
            localStorage.removeItem('token')
            setIsLoggedIn(false)
          }
        } catch (error) {
          localStorage.removeItem('token')
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
    }
    
    checkAuthStatus()
  }, [])

  // جلب رقم الواتساب
  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      try {
        const response = await fetch('/api/sales-config/sales1')
        if (response.ok) {
          const data = await response.json()
          setWhatsappNumber(data.whatsappNumber || '+201065201900')
        } else {
          setWhatsappNumber('+201065201900')
        }
      } catch (error) {
        setWhatsappNumber('+201065201900')
      }
    }
    
    fetchWhatsappNumber()
  }, [])

  // جلب بيانات السيرة الذاتية
  useEffect(() => {
    const fetchCV = async () => {
      if (!cvId) return
      
      try {
        const response = await fetch(`/api/cv/${cvId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch CV')
        }
        const data = await response.json()
        setCv(data)
      } catch (error) {
        console.error('Error fetching CV:', error)
        toast.error('فشل في تحميل السيرة الذاتية')
        router.push('/gallery')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCV()
  }, [cvId, router])

  // التحميل التلقائي
  useEffect(() => {
    if (autoDownload && cv && !isLoading && isLoggedIn) {
      setTimeout(() => {
        downloadCV()
      }, 2000)
    }
  }, [cv, isLoading, isLoggedIn, autoDownload])

  // وظيفة تحميل السيرة الذاتية
  const downloadCV = async () => {
    if (!cvRef.current || !cv) return

    try {
      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      })

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/png', 0.9)
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `AlQaeid_CV_${cv.fullName}_${cv.referenceCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('تم تحميل السيرة الذاتية بنجاح')
    } catch (error) {
      console.error('Error downloading CV:', error)
      toast.error('حدث خطأ أثناء تحميل السيرة الذاتية')
    }
  }

  // وظيفة إرسال رسالة واتساب
  const sendWhatsAppMessage = () => {
    if (!cv) return

    const message = `مرحباً، أريد الاستفسار عن السيرة الذاتية:

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🎂 العمر: ${cv.age || 'غير محدد'} سنة
🆔 الكود المرجعي: ${cv.referenceCode}

يرجى التواصل معي لإتمام عملية الطلب والحجز.`

    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = whatsappNumber.replace(/[^0-9]/g, '')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  // وظيفة المشاركة
  const shareCV = () => {
    if (!cv) return

    const shareText = `🔗 مشاركة سيرة ذاتية من الاسناد السريع

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🎂 العمر: ${cv.age || 'غير محدد'} سنة
🆔 الكود المرجعي: ${cv.referenceCode}

🌐 رابط السيرة: ${window.location.href}
📱 للحجز عبر واتساب: ${whatsappNumber}

#الاسناد_السريع #عمالة_منزلية`

    if (navigator.share) {
      navigator.share({
        title: `سيرة ذاتية - ${cv.fullName} | الاسناد السريع`,
        text: shareText,
        url: window.location.href
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success('تم نسخ معلومات السيرة الذاتية')
      }).catch(() => {
        toast.error('فشل في نسخ المعلومات')
      })
    }
  }

  // عرض الـ loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل السيرة الذاتية...</p>
        </div>
      </div>
    )
  }

  // إذا لم توجد السيرة الذاتية
  if (!cv) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">السيرة الذاتية غير موجودة</h2>
          <button
            onClick={() => router.push('/gallery')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة للمعرض
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header - مخفي في حالة hideUI */}
      {!hideUI && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/gallery')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>العودة للمعرض</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-bold text-gray-900">عرض السيرة الذاتية</h1>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={shareCV}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة
                </button>
                <button
                  onClick={downloadCV}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  تحميل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* محتوى السيرة الذاتية */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div 
          ref={cvRef}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ width: '794px', minHeight: '1123px', margin: '0 auto' }}
        >
          {/* رأس السيرة الذاتية */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
            <div className="flex items-start gap-6">
              {/* الصورة الشخصية */}
              <div className="flex-shrink-0">
                {cv.profileImage ? (
                  <img
                    src={cv.profileImage}
                    alt={cv.fullName}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>

              {/* المعلومات الأساسية */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{cv.fullName}</h1>
                {cv.fullNameArabic && (
                  <h2 className="text-xl mb-3 opacity-90">{cv.fullNameArabic}</h2>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CountryFlag nationality={cv.nationality || ''} size="md" />
                    <span className="text-lg">{cv.nationality}</span>
                  </div>
                  {cv.age && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>{cv.age} سنة</span>
                    </div>
                  )}
                </div>
                <p className="text-xl font-semibold mb-2">{cv.position || 'عاملة منزلية'}</p>
                <p className="text-sm opacity-90">كود مرجعي: {cv.referenceCode}</p>
              </div>
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              معلومات الاتصال
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {cv.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{cv.phone}</span>
                </div>
              )}
              {cv.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{cv.email}</span>
                </div>
              )}
              {cv.livingTown && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{cv.livingTown}</span>
                </div>
              )}
            </div>
          </div>

          {/* المهارات */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              المهارات
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {cv.babySitting && cv.babySitting !== SkillLevel.NO && (
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-pink-500" />
                  <span>رعاية الأطفال</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cv.babySitting === SkillLevel.YES ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cv.babySitting === SkillLevel.YES ? 'ممتاز' : 'مستعد للتعلم'}
                  </span>
                </div>
              )}
              {cv.cleaning && cv.cleaning !== SkillLevel.NO && (
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  <span>التنظيف</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cv.cleaning === SkillLevel.YES ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cv.cleaning === SkillLevel.YES ? 'ممتاز' : 'مستعد للتعلم'}
                  </span>
                </div>
              )}
              {cv.arabicCooking && cv.arabicCooking !== SkillLevel.NO && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>الطبخ العربي</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cv.arabicCooking === SkillLevel.YES ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cv.arabicCooking === SkillLevel.YES ? 'ممتاز' : 'مستعد للتعلم'}
                  </span>
                </div>
              )}
              {cv.driving && cv.driving !== SkillLevel.NO && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-red-500" />
                  <span>القيادة</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cv.driving === SkillLevel.YES ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cv.driving === SkillLevel.YES ? 'ممتاز' : 'مستعد للتعلم'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* المعلومات الشخصية */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              المعلومات الشخصية
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {cv.maritalStatus && (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-gray-500" />
                  <span>الحالة الاجتماعية: {cv.maritalStatus}</span>
                </div>
              )}
              {cv.religion && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  <span>الديانة: {cv.religion}</span>
                </div>
              )}
              {cv.educationLevel && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  <span>التعليم: {cv.educationLevel}</span>
                </div>
              )}
              {cv.numberOfChildren !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>عدد الأطفال: {cv.numberOfChildren}</span>
                </div>
              )}
            </div>
          </div>

          {/* اللغات */}
          {(cv.arabicLevel || cv.englishLevel) && (
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-600" />
                اللغات
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {cv.arabicLevel && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span>العربية: {cv.arabicLevel === SkillLevel.YES ? 'ممتاز' : 'متوسط'}</span>
                  </div>
                )}
                {cv.englishLevel && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span>الإنجليزية: {cv.englishLevel === SkillLevel.YES ? 'ممتاز' : 'متوسط'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* معلومات إضافية */}
          {(cv.experience || cv.monthlySalary) && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                معلومات إضافية
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {cv.experience && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span>الخبرة: {cv.experience}</span>
                  </div>
                )}
                {cv.monthlySalary && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span>الراتب المطلوب: {cv.monthlySalary} ريال</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* تذييل السيرة الذاتية */}
          <div className="bg-gray-50 p-6 text-center">
            <div className="text-blue-600 font-semibold text-lg mb-2">الاسناد السريع</div>
            <div className="text-gray-600 text-sm">للاستفسار والحجز: {whatsappNumber}</div>
          </div>
        </div>

        {/* أزرار العمل - مخفية في حالة hideUI */}
        {!hideUI && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={sendWhatsAppMessage}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              <MessageCircle className="w-5 h-5" />
              للحجز والطلب عبر واتساب
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
