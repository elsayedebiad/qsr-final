'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import QSOTemplate from '../../../../components/cv-templates/qso-template'
import { ArrowLeft, Download, Edit, Printer, FileText, Image } from 'lucide-react'

// Interface للسيرة الذاتية
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
  // الحقول الإضافية
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

export default function ViewAlqaeidCV() {
  const router = useRouter()
  const params = useParams()
  const [cv, setCv] = useState<CV | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchCV(params.id as string)
    }
  }, [params.id])

  const fetchCV = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/cvs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCv(data.cv)
      } else if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else {
        toast.error('فشل في تحميل السيرة الذاتية')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    window.open(`/api/cvs/${params.id}/export-alqaeid`, '_blank')
  }

  const handleDownloadImage = async () => {
    try {
      // استيراد html2canvas بشكل ديناميكي
      const html2canvas = (await import('html2canvas')).default
      
      // العثور على عنصر السيرة الذاتية
      const cvElement = document.querySelector('.cv-container') as HTMLElement
      if (!cvElement) {
        toast.error('لم يتم العثور على السيرة الذاتية')
        return
      }

      // إنشاء canvas بالأبعاد المطلوبة
      const canvas = await html2canvas(cvElement, {
        width: 1459,
        height: 2048,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      // تحويل إلى صورة وتنزيلها
      const link = document.createElement('a')
      link.download = `${cv?.fullName || 'CV'}-QSO.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      toast.success('تم تنزيل السيرة الذاتية كصورة')
    } catch (error) {
      console.error('خطأ في تنزيل الصورة:', error)
      toast.error('فشل في تنزيل الصورة')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل السيرة الذاتية...</p>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">السيرة الذاتية غير موجودة</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden during print */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-purple-600 ml-3" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {cv.fullName} - قالب QSO
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/dashboard/cv/${cv.id}/edit`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </button>
              
              <button
                onClick={handlePrint}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </button>
              
              <button
                onClick={handleDownloadPDF}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 ml-2" />
                تحميل PDF
              </button>
              
              <button
                onClick={handleDownloadImage}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                <Image className="h-4 w-4 ml-2" />
                تحميل صورة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <QSOTemplate 
            cv={cv} 
            selectedVideo={selectedVideo}
            setSelectedVideo={setSelectedVideo}
          />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');
        
        .cv-container {
          font-family: 'Cairo', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', Arial, sans-serif !important;
        }
        
        /* Enhanced Emoji support */
        .emoji, [class*="emoji"] {
          font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', sans-serif !important;
          font-style: normal !important;
          font-variant: normal !important;
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          font-feature-settings: "liga" 1, "kern" 1 !important;
        }
        
        /* Specific flag emoji support */
        .flag-emoji {
          font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'EmojiOne Color', 'Android Emoji' !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-variant-emoji: emoji !important;
          text-rendering: optimizeLegibility !important;
        }
        
        /* Force emoji display */
        .flag-emoji * {
          font-family: inherit !important;
          font-size: inherit !important;
        }
        
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .bg-gray-50 { background: white !important; }
          .shadow-lg { box-shadow: none !important; }
          .rounded-lg { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  )
}

