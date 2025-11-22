import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - تحديث حالة الرسالة (messageSent)
// يدعم: JSON عادي + Beacon API
export async function POST(request: NextRequest) {
  try {
    // قراءة البيانات (يدعم JSON و Beacon)
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Beacon API يرسل text/plain
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = { clickId: null, messageSent: true };
      }
    }
    
    const { clickId, messageSent } = body;

    console.log('📝 طلب تحديث حالة الرسالة:', { clickId, messageSent, source: contentType });

    if (!clickId) {
      return NextResponse.json(
        { error: 'clickId is required' },
        { status: 400 }
      )
    }

    // تحديث حالة الرسالة
    const updatedClick = await db.bookingClick.update({
      where: { id: parseInt(clickId) },
      data: { messageSent: messageSent }
    })

    console.log('✅ تم تحديث حالة الرسالة بنجاح!', updatedClick);

    return NextResponse.json({ 
      success: true, 
      click: updatedClick 
    })
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الرسالة:', error)
    return NextResponse.json(
      { error: 'Failed to update message status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
