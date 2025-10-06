import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { UserSessionTracker } from '@/lib/user-session-tracker'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get session info before logout for session tracking
    let sessionId: string | null = null
    
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

    // Standard logout process
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      await AuthService.logout(token)
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

