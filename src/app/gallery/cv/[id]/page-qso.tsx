'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import QSOTemplate from '../../../../components/cv-templates/qso-template'
import { ArrowLeft, Download, Share2, MessageCircle } from 'lucide-react'

// Interface شامل للسيرة الذاتية
interface CV {
  id: string;
  fullName: string;
  fullNameArabic?: string;
  email?: string;
  phone?: string;
  referenceCode?: string;
  position?: string;
  nationality?: string;
  religion?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  livingTown?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  weight?: string;
  height?: string;
  complexion?: string;
  age?: number;
  monthlySalary?: string;
  contractPeriod?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  passportIssuePlace?: string;
  englishLevel?: string;
  arabicLevel?: string;
  educationLevel?: string;
  babySitting?: string;
  childrenCare?: string;
  tutoring?: string;
  disabledCare?: string;
  cleaning?: string;
  washing?: string;
  ironing?: string;
  arabicCooking?: string;
  sewing?: string;
  driving?: string;
  elderCare?: string;
  housekeeping?: string;
  experience?: string;
  education?: string;
  skills?: string;
  summary?: string;
  priority?: string;
  notes?: string;
  profileImage?: string;
  videoLink?: string;
  // الحقول الإضافية الـ 22
  previousEmployment?: string;
  workExperienceYears?: number;
  lastEmployer?: string;
  reasonForLeaving?: string;
  contractType?: string;
  expectedSalary?: string;
  workingHours?: string;
  languages?: string;
  medicalCondition?: string;
  hobbies?: string;
  personalityTraits?: string;
  foodPreferences?: string;
  specialNeeds?: string;
  currentLocation?: string;
  availability?: string;
  preferredCountry?: string;
  visaStatus?: string;
  workPermit?: string;
  certificates?: string;
  references?: string;
  emergencyContact?: string;
}

export default function CVViewPageQSO() {
  const params = useParams()
  const router = useRouter()
  
  const { isLoggedIn } = useAuth()
  const [cv, setCv] = useState<CV | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  // جلب بيانات السيرة الذاتية
  useEffect(() => {
    const fetchCV = async () => {
      try {
        const response = await fetch(`/api/cvs/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCv(data.cv)
        } else {
          toast.error('فشل في تحميل السيرة الذاتية')
        }
      } catch (error) {
        toast.error('حدث خطأ أثناء تحميل البيانات')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchCV()
    }
  }, [params.id])

  // مشاركة السيرة الذاتية
  const handleShare = async () => {
    if (!cv) return

    const shareText = `🔗 مشاركة سيرة ذاتية من معرض الاسناد السريع

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🎂 العمر: ${cv.age || 'غير محدد'} سنة
🆔 الكود المرجعي: ${cv.referenceCode || 'غير محدد'}

🔗 رابط السيرة الذاتية: ${window.location.href}

#الاسناد_السريع #عمالة_منزلية`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `سيرة ذاتية - ${cv.fullName}`,
          text: shareText,
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success('تم نسخ معلومات السيرة الذاتية')
      }).catch(() => {
        toast.error('فشل في نسخ المعلومات')
      })
    }
  }

  // إرسال رسالة واتساب
  const sendWhatsAppMessage = () => {
    if (!cv) return

    const message = `مرحباً، أريد الاستفسار عن هذه السيرة الذاتية:

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🆔 الكود المرجعي: ${cv.referenceCode || 'غير محدد'}

من معرض الاسناد السريع`

    const encodedMessage = encodeURIComponent(message)
    // يمكن إضافة رقم واتساب افتراضي هنا
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل السيرة الذاتية...</p>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">السيرة الذاتية غير موجودة</h1>
          <p className="text-gray-600 mb-6">الرابط الذي تحاول الوصول إليه غير صحيح أو تم حذف السيرة الذاتية</p>
          <button
            onClick={() => router.push('/gallery')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة إلى المعرض
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/gallery')}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {cv.fullName}
                </h1>
                <p className="text-gray-600">
                  {cv.position && `${cv.position} • `}
                  {cv.nationality && `${cv.nationality} • `}
                  {cv.referenceCode && `#${cv.referenceCode}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={handleShare}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Share2 className="h-4 w-4 ml-2" />
                مشاركة
              </button>
              
              <button
                onClick={sendWhatsAppMessage}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <MessageCircle className="h-4 w-4 ml-2" />
                واتساب
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QSOTemplate 
          cv={cv} 
          selectedVideo={selectedVideo}
          setSelectedVideo={setSelectedVideo}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-4">معرض الاسناد السريع - قالب QSO</p>
            <div className="flex justify-center space-x-6 space-x-reverse">
              <button
                onClick={handleShare}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Share2 className="h-4 w-4 ml-1" />
                مشاركة السيرة
              </button>
              <button
                onClick={sendWhatsAppMessage}
                className="text-green-600 hover:text-green-700 flex items-center"
              >
                <MessageCircle className="h-4 w-4 ml-1" />
                تواصل عبر واتساب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
