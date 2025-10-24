import { NextRequest, NextResponse } from 'next/server'
import { UserSessionTracker } from '@/lib/user-session-tracker'
import { validateAuthFromRequest } from '@/lib/middleware-auth'

/**
 * Heartbeat endpoint to keep user session alive
 * Called periodically from the frontend
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Update user activity
    await UserSessionTracker.updateActivity(sessionId)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}
