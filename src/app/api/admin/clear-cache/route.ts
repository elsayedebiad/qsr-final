import { NextRequest, NextResponse } from 'next/server'
import { cache, invalidateAllCache } from '@/lib/cache'

// POST - مسح كل الـcache
export async function POST(request: NextRequest) {
  try {
    // مسح كل الـcache
    invalidateAllCache()

    return NextResponse.json({ 
      success: true,
      message: 'تم مسح الـcache بنجاح',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ خطأ في مسح الـcache:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء مسح الـcache' },
      { status: 500 }
    )
  }
}

// GET - عرض معلومات الـcache
export async function GET(request: NextRequest) {
  try {
    const size = cache.getSize()

    return NextResponse.json({ 
      cacheSize: size,
      message: `يوجد ${size} عنصر في الـcache`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ خطأ في جلب معلومات الـcache:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب معلومات الـcache' },
      { status: 500 }
    )
  }
}
