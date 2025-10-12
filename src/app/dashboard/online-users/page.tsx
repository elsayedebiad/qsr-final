'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '../../../components/DashboardLayout'
import { 
  Users,
  Clock,
  User,
  Mail,
  RefreshCw,
  Calendar,
  Wifi,
  WifiOff,
  History,
  Activity,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Timer,
  UserCheck,
  UserX
} from 'lucide-react'

interface OnlineUser {
  userId: number
  userName: string
  userEmail: string
  loginTime: string
  lastActivity: string
  isOnline: boolean
  sessionId: string
  ipAddress?: string
  userAgent?: string
}

interface SessionHistory {
  id: string
  userId: number
  userName: string
  userEmail: string
  sessionId: string
  loginTime: string
  logoutTime: string | null
  lastActivity: string
  duration: number | null
  isActive: boolean
  ipAddress: string | null
  userAgent: string | null
}

export default function OnlineUsersPage() {
  const router = useRouter()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'online' | 'history'>('online')
  const [showDetails, setShowDetails] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    fetchData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    if (typeof window === 'undefined') return // Skip on server-side
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      console.log('Fetching online users data...')
      
      const response = await fetch('/api/online-users', {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Online users data:', data)
        setOnlineUsers(data.onlineUsers || [])
        setSessionHistory(data.sessionHistory || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch data:', response.status, errorText)
        toast.error('فشل في تحميل بيانات المستخدمين')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSessionDuration = (loginTime: string, logoutTime?: string | null) => {
    const start = new Date(loginTime)
    const end = logoutTime ? new Date(logoutTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) {
      return `${diffMins} دقيقة`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours} ساعة${mins > 0 ? ` و ${mins} دقيقة` : ''}`
    }
  }

  const toggleDetails = (sessionId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }))
  }

  const getStatusColor = (isActive: boolean, isOnline?: boolean) => {
    if (isOnline !== undefined) {
      return isOnline ? 'text-green-500' : 'text-gray-400'
    }
    return isActive ? 'text-green-500' : 'text-red-500'
  }

  const getStatusIcon = (isActive: boolean, isOnline?: boolean) => {
    if (isOnline !== undefined) {
      return isOnline ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />
    }
    return isActive ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />
  }

  return (
    <DashboardLayout>
      {(user) => {
        if (!user || user.role !== 'ADMIN') {
          return (
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <div className="bg-destructive/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">غير مسموح بالوصول</h2>
                <p className="text-muted-foreground mb-6">هذه الصفحة متاحة للمدير العام فقط</p>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <Activity className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">مراقبة جلسات المستخدمين</h1>
                    <p className="text-green-100">متابعة حالة الاتصال وسجل الجلسات</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                    <div className="text-2xl font-bold">{onlineUsers.length}</div>
                    <div className="text-sm">متصل الآن</div>
                  </div>
                  <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                    <div className="text-2xl font-bold">{sessionHistory.length}</div>
                    <div className="text-sm">جلسات اليوم</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-card rounded-lg p-1 border border-border">
              <button
                onClick={() => setActiveTab('online')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'online'
                    ? 'bg-blue-600 text-white'
                    : 'text-muted-foreground hover:bg-background'
                }`}
              >
                <Wifi className="w-4 h-4" />
                المستخدمون المتصلون ({onlineUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-muted-foreground hover:bg-background'
                }`}
              >
                <History className="w-4 h-4" />
                سجل الجلسات ({sessionHistory.length})
              </button>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">
                {activeTab === 'online' ? 'المستخدمون النشطون' : 'سجل جلسات المستخدمين'}
              </h2>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </button>
            </div>

            {/* Content */}
            <div className="bg-card rounded-2xl shadow-xl border border-border">
              {isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-info mx-auto mb-4" />
                  <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                </div>
              ) : (
                <div>
                  {activeTab === 'online' ? (
                    // Online Users Tab
                    onlineUsers.length === 0 ? (
                      <div className="p-8 text-center">
                        <WifiOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-xl text-muted-foreground">لا يوجد مستخدمون متصلون</p>
                        <p className="text-muted-foreground">سيتم عرض المستخدمين النشطين هنا</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {onlineUsers.map((onlineUser) => (
                          <div key={onlineUser.sessionId} className="p-6 hover:bg-background transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="bg-success/10 rounded-full p-3">
                                    <User className="w-6 h-6 text-success" />
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white animate-pulse"></div>
                                </div>
                                
                                <div>
                                  <h3 className="font-semibold text-foreground text-lg">{onlineUser.userName}</h3>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{onlineUser.userEmail}</span>
                                  </div>
                                  {showDetails[onlineUser.sessionId] && (
                                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                      <div>معرف الجلسة: {onlineUser.sessionId}</div>
                                      {onlineUser.ipAddress && <div>عنوان IP: {onlineUser.ipAddress}</div>}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>تسجيل الدخول: {formatTime(onlineUser.loginTime)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-success mb-2">
                                  <Clock className="w-4 h-4" />
                                  <span>مدة الجلسة: {getSessionDuration(onlineUser.loginTime)}</span>
                                </div>
                                <button
                                  onClick={() => toggleDetails(onlineUser.sessionId)}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                >
                                  {showDetails[onlineUser.sessionId] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  {showDetails[onlineUser.sessionId] ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    // Session History Tab
                    sessionHistory.length === 0 ? (
                      <div className="p-8 text-center">
                        <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-xl text-muted-foreground">لا يوجد سجل جلسات</p>
                        <p className="text-muted-foreground">سيتم عرض سجل الجلسات هنا</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {sessionHistory.map((session) => (
                          <div key={session.id} className="p-6 hover:bg-background transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className={`${session.isActive ? 'bg-success/10' : 'bg-muted'} rounded-full p-3`}>
                                    <User className={`w-6 h-6 ${session.isActive ? 'text-success' : 'text-muted-foreground'}`} />
                                  </div>
                                  {session.isActive && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                
                                <div>
                                  <h3 className="font-semibold text-foreground text-lg">{session.userName}</h3>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{session.userEmail}</span>
                                  </div>
                                  <div className={`flex items-center gap-1 text-sm mt-1 ${getStatusColor(session.isActive)}`}>
                                    {getStatusIcon(session.isActive)}
                                    <span>{session.isActive ? 'متصل حالياً' : 'غير متصل'}</span>
                                  </div>
                                  {showDetails[session.id] && (
                                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                      <div>معرف الجلسة: {session.sessionId}</div>
                                      {session.ipAddress && <div>عنوان IP: {session.ipAddress}</div>}
                                      <div>آخر نشاط: {formatTime(session.lastActivity)}</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                  <LogIn className="w-4 h-4" />
                                  <span>دخول: {formatTime(session.loginTime)}</span>
                                </div>
                                {session.logoutTime && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                    <LogOut className="w-4 h-4" />
                                    <span>خروج: {formatTime(session.logoutTime)}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                                  <Timer className="w-4 h-4" />
                                  <span>
                                    المدة: {session.duration ? `${session.duration} دقيقة` : getSessionDuration(session.loginTime, session.logoutTime)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => toggleDetails(session.id)}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                >
                                  {showDetails[session.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  {showDetails[session.id] ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }}
    </DashboardLayout>
  )
}