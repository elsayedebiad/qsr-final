import { NextRequest, NextResponse } from 'next/server'
import { UserSessionTracker } from '@/lib/user-session-tracker'
import { validateAuthFromRequest } from '@/lib/middleware-auth'

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view online users
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('Fetching online users for admin:', authResult.user.name)

    // Clean up expired sessions
    await UserSessionTracker.cleanupSessions()

    // Get online users and session history
    const onlineUsers = await UserSessionTracker.getOnlineUsers()
    const sessionHistory = await UserSessionTracker.getSessionHistory(20)

    console.log('Online users found:', onlineUsers.length)
    console.log('Session history found:', sessionHistory.length)

    // If no data, let's add the current admin as online for testing
    if (onlineUsers.length === 0) {
      console.log('No online users found, adding current admin session for testing')
      try {
        await UserSessionTracker.recordLogin(
          authResult.user.id,
          authResult.user.name || 'Admin User',
          authResult.user.email,
          `session_${Date.now()}`,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
          request.headers.get('user-agent') || 'Browser'
        )
        
        // Re-fetch after adding current session
        const updatedOnlineUsers = await UserSessionTracker.getOnlineUsers()
        const updatedSessionHistory = await UserSessionTracker.getSessionHistory(20)
        
        return NextResponse.json({
          onlineUsers: updatedOnlineUsers,
          sessionHistory: updatedSessionHistory,
          count: updatedOnlineUsers.length,
          debug: {
            addedCurrentAdmin: true,
            adminUser: authResult.user.name
          }
        })
      } catch (error) {
        console.error('Error adding admin session:', error)
      }
    }

    return NextResponse.json({
      onlineUsers,
      sessionHistory,
      count: onlineUsers.length
    })

  } catch (error) {
    console.error('Error fetching online users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    )
  }
}