import { db } from './db'

interface UserSessionData {
  userId: number
  userName: string
  userEmail: string
  loginTime: Date
  lastActivity: Date
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
  loginTime: Date
  logoutTime: Date | null
  lastActivity: Date
  duration: number | null
  isActive: boolean
  ipAddress: string | null
  userAgent: string | null
}

// In-memory store for user sessions and history (in production, use Redis)
const userSessions = new Map<string, UserSessionData>()
const sessionHistory = new Map<string, SessionHistory>()

export class UserSessionTracker {
  /**
   * Record user login with in-memory persistence
   */
  static async recordLogin(
    userId: number, 
    userName: string, 
    userEmail: string, 
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const now = new Date()
    
    // Store in memory for real-time access
    const sessionData: UserSessionData = {
      userId,
      userName,
      userEmail,
      loginTime: now,
      lastActivity: now,
      isOnline: true,
      sessionId,
      ipAddress,
      userAgent
    }
    
    userSessions.set(sessionId, sessionData)
    
    // Store in session history
    const historyEntry: SessionHistory = {
      id: `history_${sessionId}_${Date.now()}`,
      userId,
      userName,
      userEmail,
      sessionId,
      loginTime: now,
      logoutTime: null,
      lastActivity: now,
      duration: null,
      isActive: true,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    }
    
    sessionHistory.set(sessionId, historyEntry)

    try {
      // Notify admins about user login
      const { NotificationService } = await import('./notification-service')
      await NotificationService.notifyAllAdmins({
        title: '🟢 مستخدم متصل',
        message: `تسجيل دخول المستخدم "${userName}" (${userEmail})`,
        type: 'INFO',
        category: 'system',
        data: {
          userId,
          userName,
          userEmail,
          loginTime: now.toISOString(),
          ipAddress,
          action: 'login'
        }
      })
    } catch (error) {
      console.error('Error sending login notification:', error)
    }
  }

  /**
   * Record user logout with history update
   */
  static async recordLogout(sessionId: string) {
    const session = userSessions.get(sessionId)
    const historyEntry = sessionHistory.get(sessionId)
    
    if (session && historyEntry) {
      const now = new Date()
      const sessionDuration = Math.round((now.getTime() - session.loginTime.getTime()) / 1000 / 60) // minutes
      
      // Update history entry
      historyEntry.logoutTime = now
      historyEntry.isActive = false
      historyEntry.duration = sessionDuration
      historyEntry.lastActivity = now
      sessionHistory.set(sessionId, historyEntry)

      try {
        // Notify admins about user logout
        const { NotificationService } = await import('./notification-service')
        await NotificationService.notifyAllAdmins({
          title: '🔴 مستخدم غير متصل',
          message: `تسجيل خروج المستخدم "${session.userName}" بعد ${sessionDuration} دقيقة`,
          type: 'INFO',
          category: 'system',
          data: {
            userId: session.userId,
            userName: session.userName,
            userEmail: session.userEmail,
            loginTime: session.loginTime.toISOString(),
            logoutTime: now.toISOString(),
            sessionDuration,
            action: 'logout'
          }
        })
      } catch (error) {
        console.error('Error sending logout notification:', error)
      }

      userSessions.delete(sessionId)
    }
  }

  /**
   * Update user activity
   */
  static async updateActivity(sessionId: string) {
    const session = userSessions.get(sessionId)
    const historyEntry = sessionHistory.get(sessionId)
    
    if (session && historyEntry) {
      const now = new Date()
      session.lastActivity = now
      historyEntry.lastActivity = now
      
      userSessions.set(sessionId, session)
      sessionHistory.set(sessionId, historyEntry)
    }
  }

  /**
   * Get all online users for admin
   */
  static async getOnlineUsers(): Promise<UserSessionData[]> {
    const now = new Date()
    const activeUsers: UserSessionData[] = []

    for (const [sessionId, session] of userSessions.entries()) {
      // Consider user offline if no activity for 5 minutes
      const inactiveTime = now.getTime() - session.lastActivity.getTime()
      if (inactiveTime < 5 * 60 * 1000) {
        activeUsers.push(session)
      } else {
        // Auto-logout inactive users
        await this.recordLogout(sessionId)
      }
    }

    return activeUsers
  }

  /**
   * Get session history for admin
   */
  static async getSessionHistory(limit: number = 50): Promise<SessionHistory[]> {
    try {
      const allSessions = Array.from(sessionHistory.values())
      
      // Sort by login time (most recent first)
      allSessions.sort((a, b) => b.loginTime.getTime() - a.loginTime.getTime())
      
      // Return limited results
      return allSessions.slice(0, limit)
    } catch (error) {
      console.error('Error fetching session history:', error)
      return []
    }
  }

  /**
   * Get user session info
   */
  static getUserSession(sessionId: string): UserSessionData | null {
    return userSessions.get(sessionId) || null
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupSessions() {
    const now = new Date()
    const expiredSessions: string[] = []

    for (const [sessionId, session] of userSessions.entries()) {
      const inactiveTime = now.getTime() - session.lastActivity.getTime()
      if (inactiveTime > 5 * 60 * 1000) {
        expiredSessions.push(sessionId)
      }
    }

    // Logout expired sessions
    for (const sessionId of expiredSessions) {
      await this.recordLogout(sessionId)
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: number) {
    try {
      const userSessions = Array.from(sessionHistory.values())
        .filter(session => session.userId === userId)
      
      const totalSessions = userSessions.length
      const completedSessions = userSessions.filter(session => session.duration !== null)
      const totalDuration = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
      const averageDuration = completedSessions.length > 0 ? Math.round(totalDuration / completedSessions.length) : 0
      
      const lastSession = userSessions
        .sort((a, b) => b.loginTime.getTime() - a.loginTime.getTime())[0]
      
      const isCurrentlyOnline = Array.from(userSessions.values())
        .some(s => s.userId === userId)

      return {
        totalSessions,
        averageSessionDuration: averageDuration,
        totalTimeSpent: totalDuration,
        lastLoginTime: lastSession?.loginTime || null,
        isCurrentlyOnline
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return null
    }
  }

  /**
   * Get all users with their online status
   */
  static async getAllUsersStatus() {
    try {
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        },
        where: {
          isActive: true
        }
      })

      const onlineUserIds = new Set(Array.from(userSessions.values()).map(s => s.userId))
      
      return users.map(user => {
        const isOnline = onlineUserIds.has(user.id)
        const userSessionList = Array.from(sessionHistory.values())
          .filter(session => session.userId === user.id)
          .sort((a, b) => b.loginTime.getTime() - a.loginTime.getTime())
        
        const lastSession = userSessionList[0]
        
        return {
          ...user,
          isOnline,
          lastLoginTime: lastSession?.loginTime || null,
          lastLogoutTime: lastSession?.logoutTime || null,
          currentSessionDuration: isOnline && lastSession ? 
            Math.round((new Date().getTime() - lastSession.loginTime.getTime()) / 1000 / 60) : null
        }
      })
    } catch (error) {
      console.error('Error fetching all users status:', error)
      return []
    }
  }
}