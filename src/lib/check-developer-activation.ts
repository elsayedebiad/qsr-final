import { db } from './db'

/**
 * التحقق من تفعيل حساب المطور
 * إذا كان حساب المطور غير مفعل، يتم تعطيل النظام بالكامل
 */
export async function checkDeveloperActivation(): Promise<boolean> {
  // مؤقتاً: السماح بالوصول دائماً حتى يتم إنشاء حساب المطور وتشغيل migration
  return true
  
  /* سيتم تفعيل هذا الكود بعد تشغيل migration
  try {
    const developer = await db.user.findFirst({
      where: {
        role: 'DEVELOPER' as any
      },
      select: {
        isActive: true
      }
    })

    if (!developer) {
      return true
    }

    return developer.isActive
  } catch (error) {
    console.error('Error checking developer activation:', error)
    return true
  }
  */
}

/**
 * التحقق من أن المستخدم ليس مطور (لإخفاء المطور من القوائم)
 */
export function isNotDeveloper(userRole: string): boolean {
  return userRole !== 'DEVELOPER'
}
