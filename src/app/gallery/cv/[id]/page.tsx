'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import QSOTemplate from '../../../../components/cv-templates/qso-template'
import { ArrowLeft, Download, Share2, MessageCircle, User, Calendar, Phone, Mail, MapPin, Star, Baby, Home, BookOpen, Car, Heart, GraduationCap, Users, Languages, Globe, Briefcase, Award, Play, X } from 'lucide-react'

// Enums
enum SkillLevel {
  YES = 'yes',
  NO = 'no',
  WILLING = 'willing'
}

// Component for Country Flag
const CountryFlag = ({ nationality, size = 'sm' }: { nationality: string, size?: 'sm' | 'md' | 'lg' }) => {
  const getCountryFlag = (nationality: string): string => {
    const country = nationality.toLowerCase().trim();
    
    if (country === 'إثيوبيا' || country === 'ethiopia' || country === 'ethiopian') return '🇪🇹';
    if (country === 'الفلبين' || country === 'philippines' || country === 'filipino' || country === 'filipina') return '🇵🇭';
    if (country === 'إندونيسيا' || country === 'indonesia' || country === 'indonesian') return '🇮🇩';
    if (country === 'بنغلاديش' || country === 'bangladesh' || country === 'bangladeshi') return '🇧🇩';
    if (country === 'سريلانكا' || country === 'sri lanka' || country === 'srilanka' || country === 'sri lankan') return '🇱🇰';
    if (country === 'نيبال' || country === 'nepal' || country === 'nepalese') return '🇳🇵';
    if (country === 'الهند' || country === 'india' || country === 'indian') return '🇮🇳';
    if (country === 'كينيا' || country === 'kenya' || country === 'kenyan') return '🇰🇪';
    if (country === 'أوغندا' || country === 'uganda' || country === 'ugandan') return '🇺🇬';
    if (country === 'غانا' || country === 'ghana' || country === 'ghanaian') return '🇬🇭';
    
    return '🌍';
  };

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl', 
    lg: 'text-2xl'
  };

  return (
    <span className={`${sizeClasses[size]} flag-emoji`}>
      {getCountryFlag(nationality)}
    </span>
  );
};

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

export default function CVViewPage() {
  const params = useParams()
  const router = useRouter()
  
  const { isLoggedIn } = useAuth()
  const [cv, setCv] = useState<CV | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [hideUI, setHideUI] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const cvRef = useRef<HTMLDivElement>(null)

  // جلب بيانات السيرة الذاتية
  useEffect(() => {
    const fetchCV = async () => {
      try {
        const response = await fetch(`/api/cv/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCv(data)
        } else {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 404) {
            toast.error('لم يتم العثور على السيرة الذاتية')
          } else if (response.status === 400) {
            toast.error('رقم السيرة الذاتية غير صحيح')
          } else {
            toast.error('حدث خطأ في تحميل السيرة الذاتية')
          }
          console.error('API Error:', response.status, errorData)
        }
      } catch (error) {
        console.error('Error fetching CV:', error)
        toast.error('حدث خطأ في تحميل السيرة الذاتية')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchCV()
    }
  }, [params.id])

  // جلب رقم الواتساب
  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      try {
        const response = await fetch('/api/sales-config/sales1')
        if (response.ok) {
          const data = await response.json()
          setWhatsappNumber(data.whatsappNumber || '+201065201900')
        }
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error)
        setWhatsappNumber('+201065201900')
      }
    }
    
    fetchWhatsappNumber()
  }, [])

  // حالة تسجيل الدخول تأتي من AuthContext

  // التحميل التلقائي
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('autoDownload') === 'true' && cv && !isLoading && isLoggedIn) {
      setHideUI(true)
      setTimeout(() => {
        downloadCV()
      }, 2000)
    }
  }, [cv, isLoading, isLoggedIn])

  // وظيفة التحميل المحسنة - حل دقيق بالأبعاد الصحيحة
  const downloadCV = async () => {
    if (!cv || !cvRef.current) return

    const toastId = toast.loading('جاري إنشاء صورة السيرة الذاتية بالأبعاد الصحيحة...')

    try {
      // استخدام puppeteer-like approach مع Canvas API
      const element = cvRef.current
      
      // إنشاء canvas بالأبعاد الدقيقة المطلوبة
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Canvas not supported')
      }

      // الأبعاد الأصلية: 1459px x 2048px
      canvas.width = 1459
      canvas.height = 2048
      
      // خلفية بيضاء
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      try {
        // استخدام html2canvas مع الأبعاد الصحيحة
        const { default: html2canvas } = await import('html2canvas')
        
        // إنشاء نسخة مؤقتة بالأبعاد المطلوبة
        const tempDiv = document.createElement('div')
        tempDiv.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: 1459px;
          height: 2048px;
          background-color: #ffffff;
          z-index: 9999;
          overflow: visible;
          padding: 40px;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          font-size: 16px;
        `
        
        // نسخ المحتوى مع تكبير النصوص
        tempDiv.innerHTML = element.innerHTML
        document.body.appendChild(tempDiv)

        // تحسين جميع العناصر للأبعاد الجديدة
        const allElements = tempDiv.querySelectorAll('*')
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            // تكبير الخطوط
            const currentFontSize = window.getComputedStyle(el).fontSize
            const fontSize = parseFloat(currentFontSize)
            if (fontSize > 0) {
              el.style.fontSize = `${fontSize * 1.3}px`
            }
            
            // تحسين المساحات
            el.style.padding = el.style.padding ? `calc(${el.style.padding} * 1.3)` : '8px'
            el.style.margin = el.style.margin ? `calc(${el.style.margin} * 1.3)` : '4px'
            
            // منع القطع
            el.style.overflow = 'visible'
            el.style.wordWrap = 'break-word'
            el.style.whiteSpace = 'normal'
            el.style.boxSizing = 'border-box'
          }
        })

        // انتظار تطبيق التغييرات
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 1000)
            })
          })
        })

        const tempCanvas = await html2canvas(tempDiv, {
          allowTaint: true,
          useCORS: true,
          backgroundColor: '#ffffff',
          scale: 1, // لا نحتاج scale إضافي مع الأبعاد الصحيحة
          logging: false,
          width: 1459,
          height: 2048,
          windowWidth: 1459,
          windowHeight: 2048,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          foreignObjectRendering: false,
          removeContainer: false,
          imageTimeout: 30000,
          onclone: (clonedDoc: Document) => {
            const body = clonedDoc.body
            if (body) {
              body.style.margin = '0'
              body.style.padding = '0'
              body.style.width = '1459px'
              body.style.height = '2048px'
              body.style.overflow = 'visible'
            }
          }
        })

        // نسخ المحتوى إلى الكانفاس الرئيسي
        ctx.drawImage(tempCanvas, 0, 0, 1459, 2048)

        // إزالة العنصر المؤقت
        document.body.removeChild(tempDiv)

        // تحميل الصورة
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `AlQaeid_CV_${cv.fullName || 'Unknown'}_${cv.referenceCode || 'NoRef'}_1459x2048.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success(`تم تحميل السيرة الذاتية بالأبعاد الصحيحة (1459x2048)`, { id: toastId })
          } else {
            throw new Error('Failed to create blob')
          }
        }, 'image/png', 1.0)

      } catch (canvasError) {
        console.error('Canvas capture failed:', canvasError)
        
        // fallback: استخدام الطريقة التقليدية
        const { default: html2canvas } = await import('html2canvas')
        
        const fallbackCanvas = await html2canvas(element, {
          allowTaint: true,
          useCORS: true,
          backgroundColor: '#ffffff',
          scale: 2, // تكبير للوصول للأبعاد المطلوبة
          logging: false,
          width: 1459,
          height: 2048,
          windowWidth: 1459,
          windowHeight: 2048
        })

        fallbackCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `AlQaeid_CV_${cv.fullName || 'Unknown'}_${cv.referenceCode || 'NoRef'}_fallback.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success('تم تحميل السيرة الذاتية (نسخة احتياطية)', { id: toastId })
          }
        }, 'image/png', 1.0)
      }

    } catch (error) {
      console.error('Error downloading CV:', error)
      toast.error('حدث خطأ أثناء تحميل السيرة الذاتية', { id: toastId })
    }
  }

  // وظيفة المشاركة
  const shareCV = async () => {
    if (!cv) return

    const shareText = `🔗 مشاركة سيرة ذاتية من معرض الاسناد السريع

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🎂 العمر: ${cv.age || 'غير محدد'} سنة
🆔 الكود المرجعي: ${cv.referenceCode || 'غير محدد'}

🔗 رابط السيرة الذاتية: ${window.location.href}
📱 للحجز عبر واتساب: ${whatsappNumber}

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

  // وظيفة إرسال رسالة واتساب
  const sendWhatsAppMessage = () => {
    if (!cv) return

    const message = `مرحباً، أريد الاستفسار عن هذه السيرة الذاتية:

👤 الاسم: ${cv.fullName}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🆔 الكود المرجعي: ${cv.referenceCode || 'غير محدد'}

من معرض الاسناد السريع`

    const encodedMessage = encodeURIComponent(message)
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
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
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
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
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
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
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة
                </button>
                <button
                  onClick={downloadCV}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
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
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div 
          ref={cvRef}
          data-cv-container="true"
          className="bg-white rounded-lg shadow-lg w-full max-w-[794px] mx-auto"
          style={{ 
            minHeight: '2700px', // ارتفاع يتناسب مع النسبة المطلوبة
            position: 'relative',
            overflow: 'visible',
            boxSizing: 'border-box',
            padding: '15px', // مساحة أقل للهاتف
            border: 'none',
            transform: 'none',
            transformOrigin: 'top left',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            lineHeight: '1.6',
            fontSize: '14px' // خط أصغر للهاتف
          }}
        >
          <QSOTemplate cv={cv} selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} />
        </div>

        {/* أزرار العمل - مخفية في حالة hideUI */}
        {!hideUI && (
          <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 px-2">
            <button
              onClick={sendWhatsAppMessage}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl hover:shadow-xl sm:hover:shadow-3xl transition-all duration-300 sm:duration-500 transform hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 text-sm sm:text-lg font-bold relative overflow-hidden group w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
              <span className="relative z-10">للحجز والطلب عبر واتساب</span>
            </button>
            
            {/* زر الفيديو التعريفي */}
            {cv?.videoLink && (
              <button
                onClick={() => setSelectedVideo(cv.videoLink!)}
                className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 hover:from-red-600 hover:via-pink-600 hover:to-rose-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl hover:shadow-xl sm:hover:shadow-3xl transition-all duration-300 sm:duration-500 transform hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 text-sm sm:text-lg font-bold relative overflow-hidden group w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Play className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                <span className="relative z-10">فيديو تعريفي</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">فيديو السيرة الذاتية</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-video w-full">
                {selectedVideo.includes('youtube.com') || selectedVideo.includes('youtu.be') ? (
                  <iframe
                    src={selectedVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allowFullScreen
                    title="فيديو السيرة الذاتية"
                  />
                ) : (
                  <video
                    src={selectedVideo}
                    controls
                    className="w-full h-full rounded-lg"
                    preload="metadata"
                  >
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
