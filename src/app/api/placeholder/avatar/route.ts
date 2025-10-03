import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // إنشاء صورة SVG افتراضية للأفاتار
    const svg = `
      <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="300" height="400" fill="url(#bg)"/>
        <circle cx="150" cy="120" r="40" fill="rgba(255,255,255,0.2)"/>
        <path d="M150 140 C 120 140, 100 160, 100 185 L 200 185 C 200 160, 180 140, 150 140 Z" fill="rgba(255,255,255,0.2)"/>
        <text x="150" y="250" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" font-weight="bold">لا توجد صورة</text>
        <text x="150" y="280" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" text-anchor="middle">No Image Available</text>
      </svg>
    `

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error generating placeholder avatar:', error)
    return NextResponse.json({ error: 'Failed to generate placeholder' }, { status: 500 })
  }
}
