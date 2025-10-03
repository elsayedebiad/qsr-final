import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET /api/uploads/images/filename.jpg - Serve uploaded images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }

    // بناء المسار الكامل للملف
    const filePath = join(process.cwd(), 'public', 'uploads', ...path)
    
    // التحقق من وجود الملف
    if (!existsSync(filePath)) {
      console.error(`❌ ملف غير موجود: ${filePath}`)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // قراءة الملف
    const fileBuffer = await readFile(filePath)
    
    // تحديد نوع المحتوى بناءً على امتداد الملف
    const ext = path[path.length - 1].split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
    }

    // إرجاع الملف مع headers مناسبة
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Error serving uploaded file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

