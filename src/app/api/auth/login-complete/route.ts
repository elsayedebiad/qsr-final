import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { UserActivityLogger } from '@/lib/activity-logger'
import { verifyActivationCode } from '@/lib/activation-auth'
import { UserSessionTracker } from '@/lib/user-session-tracker'

export async function POST(request: NextRequest) {
  try {
    const { userId, activationCode } = await request.json()

    if (!userId || !activationCode) {
      return NextResponse.json(
        { error: 'معرف المستخدم وكود التفعيل مطلوبان' },
        { status: 400 }
      )
    }

    // Verify activation code
    const verificationResult = await verifyActivationCode(activationCode, parseInt(userId))
    
    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error },
        { status: 401 }
      )
    }

    // Get user data
    const { db } = await import('@/lib/db')
    const user = await db.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود أو معطل' },
        { status: 401 }
      )
    }

    // Create session and generate token (using existing AuthService logic)
    const jwt = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-2024'
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '30d' } // شهر كامل
    )

    // Create session
    const session = await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم
      }
    })

    // Get IP address and user agent for session tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    const ipAddress = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown Browser'

    // Log login activity
    try {
      await UserActivityLogger.login(user.id)
      // Track user session with IP and user agent
      await UserSessionTracker.recordLogin(
        user.id, 
        user.name, 
        user.email, 
        session.id.toString(),
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      token,
      session: session.id
    })

    // Set token as httpOnly cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 يوم (شهر كامل)
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login completion error:', error)
    
    return NextResponse.json(
      { error: 'حدث خطأ في إكمال تسجيل الدخول' },
      { status: 500 }
    )
  }
}