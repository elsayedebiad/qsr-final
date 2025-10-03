import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const cvId = parseInt(resolvedParams.id)
    
    if (isNaN(cvId)) {
      return NextResponse.json(
        { error: 'Invalid CV ID' },
        { status: 400 }
      )
    }

    const cv = await db.cV.findUnique({
      where: {
        id: cvId
      }
    })

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cv)
  } catch (error) {
    console.error('Error fetching CV:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
