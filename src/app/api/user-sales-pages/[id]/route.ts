import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateAuthFromRequest, requireAdmin } from '@/lib/middleware-auth'

const prisma = new PrismaClient()

// DELETE /api/user-sales-pages/[id] - Remove an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const assignmentId = parseInt(id)

    // Check if assignment exists
    const assignment = await prisma.userSalesPage.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete assignment
    await prisma.userSalesPage.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({ message: 'Assignment removed successfully' })
  } catch (error) {
    console.error('Error deleting user sales page assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

