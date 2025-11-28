import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { UserSessionTracker } from '@/lib/user-session-tracker'
import { logActivity } from '@/lib/activity-middleware'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // Direct login for all users - no activation code required
    try {
      const loginResult = await AuthService.login(email, password)
      
      // Log login activity and track session (استثناء المطور)
      try {
        if (loginResult.user.role !== 'DEVELOPER') {
          await logActivity({
            userId: loginResult.user.id,
            userRole: loginResult.user.role,
            action: 'USER_LOGIN',
            description: 'تم تسجيل الدخول',
            targetType: 'SYSTEM',
            targetName: 'تسجيل الدخول',
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
            userAgent: request.headers.get('user-agent') || 'Unknown'
          })
        }
        // Track user session with request info
        const userAgent = request.headers.get('user-agent') || undefined
        const forwarded = request.headers.get('x-forwarded-for')
        const realIp = request.headers.get('x-real-ip')
        const ipAddress = forwarded || realIp || request.ip || undefined
        
        await UserSessionTracker.recordLogin(
          loginResult.user.id, 
          loginResult.user.name, 
          loginResult.user.email, 
          loginResult.session.toString(),
          ipAddress,
          userAgent
        )
      } catch (error) {
        console.error('Failed to log login activity:', error)
        // Don't fail the login if activity logging fails
      }
      
      // Create response with cookie
      const response = NextResponse.json({
        message: 'تم تسجيل الدخول بنجاح',
        user: loginResult.user,
        token: loginResult.token,
        session: loginResult.session,
        directLogin: true
      })

      // Set token as httpOnly cookie
      response.cookies.set('token', loginResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 يوم (شهر كامل)
        path: '/'
      })

      return response
    } catch (loginError) {
      console.error('Direct login error:', loginError)
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    )
  }
}