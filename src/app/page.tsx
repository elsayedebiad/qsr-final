'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  FileText, 
  ArrowLeft, 
  Users, 
  Search, 
  Download, 
  Sparkles, 
  Heart,
  Eye,
  Briefcase,
  LayoutDashboard,
  LogOut
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // التحقق من حالة تسجيل الدخول
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    router.push('/login')
  }

  const handleDashboard = () => {
    if (user?.role === 'DEVELOPER') {
      router.push('/developer-control')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background animated-bg-theme relative">
      <div className="bg-aurora" />
      <div className="bg-grid" />
      {/* تأثيرات إضافية */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute top-20 right-20 w-2 h-2 bg-primary rounded-full animate-ping opacity-50" />
        <div className="absolute bottom-32 left-16 w-1 h-1 bg-green-500 rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce opacity-40" />
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-blue-500 rounded-full animate-ping opacity-50" />
      </div>
      
      {/* Header */}
      <header className="card-glass border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="bg-blue-600 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="text-sm sm:text-xl md:text-2xl font-bold text-foreground truncate">
                نظام إدارة السير الذاتية
              </h1>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => router.push('/home')}
                className="btn-gradient-success px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 hover-lift text-xs sm:text-sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">المعرض</span>
              </button>
              
              {isLoggedIn ? (
                <>
                  <button
                    onClick={handleDashboard}
                    className="btn-gradient-primary px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 hover-lift text-xs sm:text-sm"
                  >
                    <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">لوحة التحكم</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 hover-lift text-xs sm:text-sm"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">خروج</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="btn-gradient-primary px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 hover-lift text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">دخول</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-12">
        <div className="text-center mb-8 sm:mb-16 relative">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-full p-3 sm:p-4 w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-8 flex items-center justify-center ai-icon-glow">
            <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-white animate-spin-slow" />
          </div>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-6 px-2">
            مرحباً بك في
            <span className="block text-primary mt-1 sm:mt-2">
              نظام إدارة السير الذاتية
            </span>
          </h2>
          
          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            نظام شامل ومتطور لإدارة السير الذاتية مع إمكانيات البحث والفلترة المتقدمة، 
            والتحميل الجماعي، وعرض جميل للبيانات
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4">
            <button
              onClick={() => router.push('/home')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              استعراض المعرض
            </button>
            
            {isLoggedIn ? (
              <button
                onClick={handleDashboard}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                لوحة التحكم
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="bg-card hover:bg-muted text-foreground border-2 border-border hover:border-primary px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                تسجيل الدخول للإدارة
              </button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-16 px-3 sm:px-0">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 hover:scale-105 transition-transform duration-300">
            <div className="bg-blue-600 rounded-lg p-2 sm:p-3 w-fit mb-3 sm:mb-4">
              <Search className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-foreground mb-1 sm:mb-2">بحث متقدم</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ابحث في السير الذاتية بالاسم، الجنسية، المهارات، والمزيد من المعايير المتقدمة
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 hover:scale-105 transition-transform duration-300">
            <div className="bg-green-600 rounded-lg p-2 sm:p-3 w-fit mb-3 sm:mb-4">
              <Eye className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-foreground mb-1 sm:mb-2">عرض جميل</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              عرض السير الذاتية في تخطيطات جميلة مع إمكانية التبديل بين الشبكة والقائمة
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 hover:scale-105 transition-transform duration-300">
            <div className="bg-yellow-600 rounded-lg p-2 sm:p-3 w-fit mb-3 sm:mb-4">
              <Download className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-foreground mb-1 sm:mb-2">تحميل جماعي</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              حدد عدة سير ذاتية وحملها كملف ZIP واحد مع شريط تقدم جميل
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 hover:scale-105 transition-transform duration-300">
            <div className="bg-purple-600 rounded-lg p-2 sm:p-3 w-fit mb-3 sm:mb-4">
              <Briefcase className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-foreground mb-1 sm:mb-2">إدارة متقدمة</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              أدوات إدارة شاملة مع فلاتر متقدمة وإحصائيات مفصلة
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center text-white mx-3 sm:mx-0">
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2">
            ابدأ الآن في استعراض السير الذاتية
          </h3>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 px-4">
            اكتشف مجموعة واسعة من السير الذاتية المنظمة والمفصلة
          </p>
          <button
            onClick={() => router.push('/home')}
            className="bg-card text-primary hover:bg-muted px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto max-w-xs"
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            دخول المعرض
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted text-foreground py-6 sm:py-8 mt-8 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-red-600 rounded-lg p-1.5 sm:p-2">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-sm sm:text-base md:text-lg font-semibold">نظام إدارة السير الذاتية</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground px-4">
            نظام متطور وشامل لإدارة وعرض السير الذاتية بطريقة احترافية
          </p>
        </div>
      </footer>
    </div>
  )
}
