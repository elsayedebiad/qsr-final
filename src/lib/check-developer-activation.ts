import { db } from './db'

/**
 * التحقق من تفعيل حساب المطور
 * إذا كان حساب المطور غير مفعل، يتم تعطيل النظام بالكامل
 */
export async function checkDeveloperActivation(): Promise<boolean> {
  try {
    // البحث عن حساب المطور بالبريد الإلكتروني
    const developer = await db.user.findFirst({
      where: {
        email: 'developer@system.local'
      },
      select: {
        isActive: true
      }
    })

    // إذا لم يوجد حساب مطور، السماح بالوصول
    if (!developer) {
      return true
    }

    // إرجاع حالة التفعيل
    return developer.isActive
  } catch (error) {
    console.error('Error checking developer activation:', error)
    // في حالة الخطأ، السماح بالوصول لتجنب تعطيل النظام
    return true
  }
}

/**
 * التحقق من أن المستخدم ليس مطور (لإخفاء المطور من القوائم)
 */
export function isNotDeveloper(userRole: string): boolean {
  return userRole !== 'DEVELOPER'
}
