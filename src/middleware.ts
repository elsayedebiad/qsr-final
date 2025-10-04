import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkDeveloperActivation } from './lib/check-developer-activation'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // السماح بالوصول لصفحات معينة دون فحص
  const publicPaths = [
    '/login',
    '/payment-required',
    '/setup-developer',
    '/developer-control',
    '/api/create-developer',
    '/api/developer',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/uploads'
  ]

  // التحقق من أن المسار ليس من المسارات العامة
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // التحقق من تفعيل حساب المطور (مع معالجة الأخطاء)
  try {
    const isDeveloperActive = await checkDeveloperActivation()

    if (!isDeveloperActive && pathname !== '/payment-required') {
      // إعادة توجيه إلى صفحة الدفع المطلوب
      return NextResponse.redirect(new URL('/payment-required', request.url))
    }

    // إذا كان المطور مفعل والمستخدم في صفحة الدفع، إعادة توجيه للداشبورد
    if (isDeveloperActive && pathname === '/payment-required') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    // في حالة الخطأ، السماح بالمرور (لتجنب تعطيل النظام)
    console.error('Middleware error:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
