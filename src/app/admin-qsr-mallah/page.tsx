'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Shield, Lock, User } from 'lucide-react'
import AnimatedIcon from '../../components/AnimatedIcon'

interface LoginState {
  email: string
  password: string
  loading: boolean
  showPassword: boolean
}

export default function LoginPage() {
  const [loginData, setLoginData] = useState<LoginState>({
    email: '',
    password: '',
    loading: false,
    showPassword: false
  })
  const router = useRouter()

  // التحقق إذا كان المستخدم مسجل دخوله بالفعل
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        // إعادة توجيه للوحة التحكم
        if (user.role === 'DEVELOPER') {
          router.push('/developer-control')
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginData(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch('/api/auth/login-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: loginData.email, 
          password: loginData.password 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token, session, and user data
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        if (data.session) {
          localStorage.setItem('sessionId', data.session.toString())
        }
        toast.success(`أهلاً وسهلاً ${data.user.name}`, {
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
      } else {
        toast.error(data.error || 'فشل في تسجيل الدخول')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setLoginData(prev => ({ ...prev, loading: false }))
    }
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
                icon={Shield}
                size={32}
                animationType="glow"
                color="white"
                duration={2}
              />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              تسجيل الدخول
            </h2>
            <p className="text-muted-foreground">
              نظام إدارة السير الذاتية
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label flex items-center gap-2">
                <AnimatedIcon 
                  icon={User}
                  size={16}
                  animationType="wiggle"
                  color="currentColor"
                />
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
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
              <div className="relative">
                <input
                  id="password"
                  type={loginData.showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="form-input pl-10"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setLoginData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {loginData.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginData.loading}
              className="btn btn-primary w-full py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AnimatedIcon 
                icon={LogIn}
                size={20}
                animationType={loginData.loading ? "spin" : "pulse"}
                color="white"
              />
              {loginData.loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
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
