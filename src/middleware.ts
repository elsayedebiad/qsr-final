import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOGIN_PATH = '/admin-qsr-mallah'
const LEGACY_LOGIN_PATH = '/login'

// Middleware مبسط لا يستخدم قاعدة البيانات
// لأن Edge Runtime لا يدعم Prisma Client
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === LEGACY_LOGIN_PATH) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  // السماح بالوصول لصفحات معينة دون فحص
  const publicPaths = [
    '/',
    '/home',
    '/cv/',
    '/sales',
    '/sales1',
    '/sales2',
    '/sales3',
    '/sales4',
    '/sales5',
    '/sales6',
    '/sales7',
    '/sales8',
    '/sales9',
    '/sales10',
    '/sales11',
    LOGIN_PATH,
    LEGACY_LOGIN_PATH,
    '/payment-required',
    '/setup-developer',
    '/developer-control',
    '/api/',
    '/_next',
    '/favicon.ico',
    '/uploads',
    '/banners'
  ]

  // التحقق من أن المسار ليس من المسارات العامة
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // التحقق من وجود token (فحص بسيط)
  const token = request.cookies.get('token')?.value
  
  // إذا لم يكن هناك token إعادة التوجيه لمسار تسجيل الدخول الجديد
  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  // التحقق من حالة النظام (عبر API)
  // ملاحظة: هذا الفحص يتم على مستوى الصفحات وليس في middleware
  // لأن Edge Runtime لا يدعم Prisma

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
