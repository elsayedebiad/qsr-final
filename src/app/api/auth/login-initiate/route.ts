import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { createLoginActivationCode } from '@/lib/activation-auth'
import { UserSessionTracker } from '@/lib/user-session-tracker'
import { UserActivityLogger } from '@/lib/activity-logger'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // First step: Verify credentials but don't create session yet
    try {
      // We need to check credentials without creating a session
      // Let's modify this to just verify user exists and password is correct
      const { db } = await import('@/lib/db')
      const bcrypt = await import('bcryptjs')

      const user = await db.user.findUnique({
        where: { email }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 }
        )
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'الحساب معطل، يرجى الاتصال بالمدير' },
          { status: 403 }
        )
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 }
        )
      }

      // Check if user is ADMIN or DEVELOPER - bypass activation for these roles
      if (user.role === 'ADMIN' || user.role === 'DEVELOPER') {
        // Direct login for privileged accounts
        try {
          const loginResult = await AuthService.login(email, password)
          
          // Log login activity and track session
          try {
            await UserActivityLogger.login(loginResult.user.id)
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
            console.error('Failed to log login activity for privileged user:', error)
            // Don't fail the login if activity logging fails
          }
          
          // Create response with cookie
          const response = NextResponse.json({
            message: 'تم تسجيل الدخول بنجاح',
            user: loginResult.user,
            token: loginResult.token,
            session: loginResult.session,
            directLogin: true // Flag to indicate direct login
          })

          // Set token as httpOnly cookie
          response.cookies.set('token', loginResult.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
          })

          return response
        } catch (loginError) {
          console.error('Direct login error:', loginError)
          return NextResponse.json(
            { error: 'حدث خطأ في تسجيل الدخول' },
            { status: 500 }
          )
        }
      }

      // For other users, require activation code
      const activationResult = await createLoginActivationCode(
        user.id,
        user.name,
        user.email
      )

      if (!activationResult.success) {
        return NextResponse.json(
          { error: 'فشل في إرسال كود التفعيل' },
          { status: 500 }
        )
      }

      // Return success but require activation
      return NextResponse.json({
        message: 'تم التحقق من بيانات الدخول. تم إرسال كود التفعيل للمدير في صفحة الإشعارات.',
        requiresActivation: true,
        userId: user.id,
        activationExpiry: activationResult.expiresAt
      })

    } catch (error) {
      console.error('Credential verification error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في التحقق من بيانات الدخول' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Login initiation error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    )
  }
}