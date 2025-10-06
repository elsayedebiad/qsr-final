'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Shield, Lock, User, Key, Sparkles } from 'lucide-react'
import AnimatedIcon from '../../components/AnimatedIcon'

interface LoginStep1State {
  email: string
  password: string
  loading: boolean
}

interface LoginStep2State {
  userId: number
  activationCode: string
  loading: boolean
  expiresAt: Date
}

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<LoginStep1State>({
    email: '',
    password: '',
    loading: false
  })
  const [step2Data, setStep2Data] = useState<LoginStep2State>({
    userId: 0,
    activationCode: '',
    loading: false,
    expiresAt: new Date()
  })
  const router = useRouter()

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep1Data(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch('/api/auth/login-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: step1Data.email, 
          password: step1Data.password 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.directLogin || (!data.requiresActivation && data.token)) {
          // Direct login for ADMIN or DEVELOPER accounts
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          toast.success(`أهلاً وسهلاً ${data.user.name} - تم الدخول مباشرة`, {
            duration: 3000
          })
          
          // Redirect based on role
          setTimeout(() => {
            if (data.user.role === 'DEVELOPER') {
              router.push('/developer-control')
            } else {
              router.push('/dashboard')
            }
            router.refresh()
          }, 500)
        } else if (data.requiresActivation) {
          // Move to step 2 for other users
          setStep2Data({
            userId: data.userId,
            activationCode: '',
            loading: false,
            expiresAt: new Date(data.activationExpiry)
          })
          setStep(2)
          toast.success('تم إرسال طلب كود التفعيل للمدير. يرجى مراجعة صفحة الإشعارات.', {
            duration: 5000
          })
        }
      } else {
        toast.error(data.error || 'فشل في تسجيل الدخول')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setStep1Data(prev => ({ ...prev, loading: false }))
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep2Data(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch('/api/auth/login-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: step2Data.userId, 
          activationCode: step2Data.activationCode 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        toast.success(`أهلاً وسهلاً ${data.user.name}`)
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      } else {
        toast.error(data.error || 'كود التفعيل غير صحيح')
      }
    } catch (error) {
      toast.error('حدث خطأ في التحقق من كود التفعيل')
    } finally {
      setStep2Data(prev => ({ ...prev, loading: false }))
    }
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setStep1Data({ email: '', password: '', loading: false })
    setStep2Data({ userId: 0, activationCode: '', loading: false, expiresAt: new Date() })
  }

  const formatTimeRemaining = () => {
    const now = new Date()
    const remaining = step2Data.expiresAt.getTime() - now.getTime()
    if (remaining <= 0) return 'انتهت صلاحية الكود'
    
    const minutes = Math.floor(remaining / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animated-bg-theme relative">
      <div className="bg-aurora" />
      <div className="bg-grid" />
      {/* Floating Particles */}
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="max-w-md w-full space-y-6 relative z-10">
        <div className="card p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 card-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-6">
              <AnimatedIcon 
                icon={step === 1 ? Shield : Key}
                size={32}
                animationType="glow"
                color="white"
                duration={2}
              />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {step === 1 ? 'تسجيل الدخول' : 'كود التفعيل'}
            </h2>
            <p className="text-muted-foreground">
              {step === 1 ? 'نظام إدارة السير الذاتية' : 'يرجى إدخال كود التفعيل المرسل للمدير'}
            </p>
          </div>

          {/* Step 1: Login Form */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  value={step1Data.email}
                  onChange={(e) => setStep1Data(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="form-input"
                  placeholder="admin@cvmanagement.com"
                  dir="ltr"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label flex items-center gap-2">
                  <AnimatedIcon 
                    icon={Lock}
                    size={16}
                    animationType="wiggle"
                    color="currentColor"
                  />
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  value={step1Data.password}
                  onChange={(e) => setStep1Data(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="form-input"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={step1Data.loading}
                className="btn btn-primary w-full py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <AnimatedIcon 
                  icon={LogIn}
                  size={20}
                  animationType={step1Data.loading ? "spin" : "pulse"}
                  color="white"
                />
                {step1Data.loading ? 'جاري التحقق...' : 'التحقق من البيانات'}
              </button>
            </form>
          )}

          {/* Step 2: Activation Code Form */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              {/* Instructions */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">تعليمات التفعيل</h3>
                    <p className="text-muted-foreground text-sm">
                      تم إرسال كود التفعيل للمدير على البريد الإلكتروني
                    </p>
                    <p className="text-primary text-xs mt-1">
                      الوقت المتبقي: {formatTimeRemaining()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="activationCode" className="form-label">
                  كود التفعيل
                </label>
                <input
                  id="activationCode"
                  type="text"
                  value={step2Data.activationCode}
                  onChange={(e) => setStep2Data(prev => ({ ...prev, activationCode: e.target.value }))}
                  required
                  className="form-input text-center text-lg font-mono"
                  placeholder="123456"
                  maxLength={6}
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={step2Data.loading || !step2Data.activationCode.trim()}
                className="btn btn-primary w-full py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <AnimatedIcon 
                  icon={Key}
                  size={20}
                  animationType={step2Data.loading ? "spin" : "pulse"}
                  color="white"
                />
                {step2Data.loading ? 'جاري التحقق...' : 'تأكيد التفعيل'}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToStep1}
                className="w-full text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                ← العودة لتسجيل الدخول
              </button>
            </form>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            ← العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  )
}
