import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { UserSessionTracker } from '@/lib/user-session-tracker'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-middleware'

export async function POST(request: NextRequest) {
  try {
    // Get session info before logout for session tracking
    let sessionId: string | null = null
    
    // Try to get sessionId from request body first
    try {
      const body = await request.json()
      if (body.sessionId) {
        sessionId = body.sessionId
      }
    } catch (error) {
      // Body parsing failed, will try to get from token
    }
    
    // If no sessionId in body, try to get from token
    if (!sessionId) {
      try {
        const authHeader = request.headers.get('Authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          
          // Find session by token for tracking purposes
          const session = await db.session.findFirst({
            where: {
              token,
              expiresAt: { gt: new Date() }
            }
          })
          
          if (session) {
            sessionId = session.id.toString()
          }
        }
      } catch (error) {
        console.log('Could not get session info for logout tracking:', error)
      }
    }

    // Standard logout process
    const authHeader = request.headers.get('Authorization')
    let userId: number | undefined
    let userRole: string | undefined
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Get user info before logout for activity logging
      try {
        const session = await db.session.findFirst({
          where: { token, expiresAt: { gt: new Date() } },
          include: { user: true }
        })
        if (session?.user) {
          userId = session.user.id
          userRole = session.user.role
        }
      } catch (error) {
        console.log('Could not get user info for logout logging:', error)
      }
      
      await AuthService.logout(token)
    }

    // Log logout activity (استثناء المطور)
    if (userId && userRole !== 'DEVELOPER') {
      try {
        await logActivity({
          userId,
          userRole,
          action: 'USER_LOGOUT',
          description: 'تم تسجيل الخروج',
          targetType: 'SYSTEM',
          targetName: 'تسجيل الخروج',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Unknown'
        })
      } catch (error) {
        console.error('Failed to log logout activity:', error)
      }
    }

    // Track logout if we have session info
    if (sessionId) {
      try {
        await UserSessionTracker.recordLogout(sessionId)
      } catch (error) {
        console.error('Failed to track logout:', error)
        // Don't fail the logout if tracking fails
      }
    }

    // Clear cookie
    const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح' })
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Always return success for logout to prevent issues
    const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح' })
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })
    return response
  }
}

