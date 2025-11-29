'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  Lock
} from 'lucide-react'

const VALID_CODES = ['30211241501596', '24112002', '2592012']
const MAX_ATTEMPTS = 3

export default function ActivationPage() {
  const router = useRouter()
  const [activationCode, setActivationCode] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    // التحقق من حالة التفعيل والمحاولات المحفوظة
    const savedAttempts = localStorage.getItem('activation_attempts')
    const lastAttemptTime = localStorage.getItem('last_attempt_time')
    const isActivated = localStorage.getItem('system_activated')

    if (isActivated === 'true') {
      router.push('/dashboard')
      return
    }

    if (savedAttempts) {
      const attemptCount = parseInt(savedAttempts)
      setAttempts(attemptCount)
      
      if (attemptCount >= MAX_ATTEMPTS) {
        const lastTime = lastAttemptTime ? parseInt(lastAttemptTime) : 0
        const currentTime = Date.now()
        const timeDiff = currentTime - lastTime
        const oneHour = 60 * 60 * 1000 // ساعة واحدة بالميلي ثانية
        
        if (timeDiff < oneHour) {
          setIsBlocked(true)
        } else {
          // إعادة تعيين المحاولات بعد ساعة
          localStorage.removeItem('activation_attempts')
          localStorage.removeItem('last_attempt_time')
          setAttempts(0)
        }
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isBlocked) {
      toast.error('تم حظر النظام مؤقتاً. حاول مرة أخرى بعد ساعة.')
      return
    }

    if (!activationCode.trim()) {
      toast.error('يرجى إدخال كود التفعيل')
      return
    }

    setIsLoading(true)

    try {
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (VALID_CODES.includes(activationCode.trim())) {
        // كود صحيح
        localStorage.setItem('system_activated', 'true')
        localStorage.removeItem('activation_attempts')
        localStorage.removeItem('last_attempt_time')
        
        toast.success('تم تفعيل النظام بنجاح!')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        // كود خاطئ
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem('activation_attempts', newAttempts.toString())
        localStorage.setItem('last_attempt_time', Date.now().toString())

        if (newAttempts >= MAX_ATTEMPTS) {
          setIsBlocked(true)
          toast.error('تم استنفاد المحاولات المسموحة. سيتم إعادة توجيهك لتسجيل الدخول.')
          
          setTimeout(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            router.push('/login')
          }, 3000)
        } else {
          const remainingAttempts = MAX_ATTEMPTS - newAttempts
          toast.error(`كود التفعيل غير صحيح. المحاولات المتبقية: ${remainingAttempts}`)
        }
        
        setActivationCode('')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحقق من كود التفعيل')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const remainingAttempts = MAX_ATTEMPTS - attempts

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-primary to-success rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            تفعيل النظام
          </h1>
          <p className="text-muted-foreground">
            يرجى إدخال كود التفعيل للمتابعة
          </p>
        </div>

        {/* Activation Form */}
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {!isBlocked ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Instructions */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">تعليمات التفعيل</h3>
                    <p className="text-muted-foreground text-sm">
                      اطلب من المهندس السيد عبيد كود التفعيل
                    </p>
                    <p className="text-primary text-xs mt-1">
                      المحاولات المتبقية: {remainingAttempts}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activation Code Input */}
              <div>
                <label htmlFor="activationCode" className="block text-sm font-medium text-foreground mb-2">
                  كود التفعيل
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    id="activationCode"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    placeholder="أدخل كود التفعيل"
                    disabled={isLoading}
                    maxLength={20}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !activationCode.trim()}
                className="w-full bg-gradient-to-r from-primary to-success hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-5 h-5"></div>
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    تفعيل النظام
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Blocked State */
            <div className="text-center space-y-6">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="font-semibold text-destructive mb-2">تم حظر النظام مؤقتاً</h3>
                <p className="text-destructive text-sm mb-4">
                  تم استنفاد المحاولات المسموحة ({MAX_ATTEMPTS} محاولات)
                </p>
                <p className="text-destructive text-xs">
                  يمكنك المحاولة مرة أخرى بعد ساعة واحدة
                </p>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            نظام إدارة مكاتب الاستقدام - الاسناد السريع
          </p>
        </div>
      </div>
    </div>
  )
}
