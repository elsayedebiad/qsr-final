import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { Permission, hasPermission } from '@/types/permissions'

interface DecodedToken {
  id: string
  email: string
  role: string
  permissions?: Permission[]
}

export async function checkPermission(
  request: NextRequest,
  requiredPermission: Permission
): Promise<{ authorized: boolean; user?: DecodedToken; message?: string }> {
  try {
    // الحصول على التوكن من الهيدر
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, message: 'لم يتم توفير رمز المصادقة' }
    }

    const token = authHeader.substring(7)
    
    // التحقق من التوكن
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as DecodedToken

    // التحقق من الصلاحية
    const userPermissions = decoded.permissions || []
    
    // المدير له كل الصلاحيات
    if (decoded.role === 'ADMIN') {
      return { authorized: true, user: decoded }
    }
    
    // التحقق من الصلاحية المطلوبة
    if (!hasPermission(userPermissions, requiredPermission)) {
      return { 
        authorized: false, 
        user: decoded,
        message: `ليس لديك صلاحية: ${requiredPermission}` 
      }
    }

    return { authorized: true, user: decoded }
  } catch (error) {
    return { 
      authorized: false, 
      message: error instanceof Error ? error.message : 'خطأ في المصادقة' 
    }
  }
}

export async function checkMultiplePermissions(
  request: NextRequest,
  requiredPermissions: Permission[],
  requireAll: boolean = false
): Promise<{ authorized: boolean; user?: DecodedToken; message?: string }> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, message: 'لم يتم توفير رمز المصادقة' }
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as DecodedToken

    const userPermissions = decoded.permissions || []
    
    // المدير له كل الصلاحيات
    if (decoded.role === 'ADMIN') {
      return { authorized: true, user: decoded }
    }
    
    // التحقق من الصلاحيات
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(p => hasPermission(userPermissions, p))
      : requiredPermissions.some(p => hasPermission(userPermissions, p))
    
    if (!hasRequiredPermissions) {
      return { 
        authorized: false, 
        user: decoded,
        message: `ليس لديك الصلاحيات المطلوبة` 
      }
    }

    return { authorized: true, user: decoded }
  } catch (error) {
    return { 
      authorized: false, 
      message: error instanceof Error ? error.message : 'خطأ في المصادقة' 
    }
  }
}
