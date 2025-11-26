'use client'

import { useState, useEffect } from 'react'
import { X, Phone, Send, Gift, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PhoneNumberPopupProps {
  salesPageId: string
  delaySeconds?: number // تأخير العرض بالثواني
  expiryDays?: number // عدد الأيام قبل إعادة العرض
}

// مصفوفة الرسائل العشوائية
const randomMessages = [
  "لا تفوت أفضل الكفاءات: أدخل رقم هاتفك لتلقي تنبيه فوري عبر الواتساب بمجرد إضافة سير ذاتية جديدة ومميزة ومطابقة لمعايير بحثك.",
  "لا تفوّت أفضل الكفاءات! أدخل رقم هاتفك لتصلك تنبيهات واتساب فور نزول سير جديدة مطابقة لطلبك.",
  "أفضل السير تنخطف بسرعة! أدخل رقم جوالك وخلك أول من يوصله تحديثات السير المناسبة لك على الواتساب",
  "علشان ما يروح عليك الأفضل، دخّل رقم جوالك وتوصلك سير جديدة ومناسبة أول بأول على الواتساب",
  "خلك أول من يلقّط أفضل السير! أدخل رقم جوالك وتجيك السير المناسبة لك قبل الكل",
  "السير المناسبة تختفي بسرعه ... أدخل رقم جوالك وخلك أوّل من توصله أفضل الخيارات",
  "اشترك برقم جوالك وخذ وصول خاص لأفضل السير قبل ما تنعرض للجميع",
  "لا تضيع وقتك في البحث ... أدخل رقم جوالك ونرسل لك الأنسب فور إضافتها",
  "بعض السير تُطلب خلال دقائق! أدخل جوالك وخلك تلحقها قبل غيرك",
  "أفضل السير تنزل ... وتروح! أدخل رقم جوالك ونعلمك أول بأول"
]

export default function PhoneNumberPopup({
  salesPageId,
  delaySeconds = 5,
  expiryDays = 7
}: PhoneNumberPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [randomMessage, setRandomMessage] = useState('')

  const STORAGE_KEY = `phone_popup_submitted_${salesPageId}`

  // اختيار رسالة عشوائية عند تحميل المكون
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * randomMessages.length)
    setRandomMessage(randomMessages[randomIndex])
  }, [])

  useEffect(() => {
    // التحقق إذا كان المستخدم قد أرسل رقمه من قبل
    const hasSubmitted = localStorage.getItem(STORAGE_KEY)

    if (hasSubmitted) {
      const submittedDate = new Date(hasSubmitted)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))

      // إذا مر أكثر من expiryDays يوم، أعد العرض
      if (daysDiff < expiryDays) {
        return
      }
    }

    // عرض النافذة بعد التأخير المحدد
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delaySeconds * 1000)

    return () => clearTimeout(timer)
  }, [salesPageId, delaySeconds, expiryDays, STORAGE_KEY])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
    }, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // التحقق من صحة رقم الهاتف
    const phoneRegex = /^[0-9+\s-()]{8,}$/
    if (!phoneRegex.test(phoneNumber.trim())) {
      toast.error('الرجاء إدخال رقم هاتف صحيح')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/phone-numbers/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          salesPageId,
          source: document.referrer || 'direct'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('شكراً لك! تم حفظ رقمك بنجاح 🎉')

        // حفظ تاريخ الإرسال في localStorage
        localStorage.setItem(STORAGE_KEY, new Date().toISOString())

        // إغلاق النافذة بعد ثانية
        setTimeout(() => {
          handleClose()
        }, 1000)
      } else {
        toast.error(data.message || 'حدث خطأ، الرجاء المحاولة لاحقاً')
      }
    } catch (error) {
      console.error('Error submitting phone number:', error)
      toast.error('حدث خطأ في الاتصال، الرجاء المحاولة لاحقاً')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[92%] sm:w-[90%] max-w-md transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
      >
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 text-slate-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-full active:scale-90"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-purple-500/10 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative px-5 py-6 sm:p-8">
            {/* Icon */}
            <div className="flex justify-center mb-5 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 sm:p-4 rounded-full shadow-lg">
                  <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-5 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center justify-center gap-1.5 sm:gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
              خليك VIP
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed px-2">
                {randomMessage}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 right-3 sm:right-4 flex items-center pointer-events-none">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 py-3 sm:px-4 sm:py-3.5 pr-10 sm:pr-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-base sm:text-lg font-medium tracking-wider"
                  disabled={isSubmitting}
                  required
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white font-bold py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-base sm:text-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>ارسال</span>
                  </>
                )}
              </button>
            </form>

            {/* Privacy Note */}
            <p className="text-xs sm:text-sm text-slate-400 text-center mt-3 sm:mt-4 px-2 leading-relaxed">
              🔒 معلوماتك آمنة ومحمية ولن يتم مشاركتها مع أطراف خارجية
            </p>

            {/* Skip Button */}
            <button
              onClick={handleClose}
              className="w-full text-slate-400 hover:text-white text-sm sm:text-base mt-2 sm:mt-3 py-2 transition-colors active:scale-95"
            >
              ربما لاحقاً
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
