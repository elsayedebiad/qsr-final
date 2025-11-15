import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('filename');

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Missing url or filename' },
        { status: 400 }
      );
    }

    // تحميل الملف من Google Drive
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Google Drive');
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // إرسال الملف بالاسم المخصص
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

// تحديد الحد الأقصى للوقت (10 ثواني على Vercel Hobby)
export const maxDuration = 10;
