'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Shield, Lock, User, Key, Sparkles } from 'lucide-react'
import AnimatedIcon from '../../components/AnimatedIcon'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        toast.success(`أهلاً وسهلاً ${data.user.name}`)
        
        // التحقق من حالة تفعيل النظام
        const isActivated = localStorage.getItem('system_activated')
        if (isActivated === 'true') {
          // النظام مفعل، توجيه للداشبورد
          router.push('/dashboard')
        } else {
          // النظام غير مفعل، توجيه لصفحة التفعيل
          router.push('/activation')
        }
      } else {
        toast.error(data.error || 'فشل في تسجيل الدخول')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
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
            <h2 className="text-2xl font-semibold text-foreground mb-2">تسجيل الدخول</h2>
            <p className="text-muted-foreground">نظام إدارة السير الذاتية</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AnimatedIcon 
                icon={LogIn}
                size={20}
                animationType={loading ? "spin" : "pulse"}
                color="white"
              />
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
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
