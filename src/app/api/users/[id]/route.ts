import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Role } from '@prisma/client'
import { validateAuthFromRequest, requireAdmin } from '@/lib/middleware-auth'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: idParam } = params
    const id = parseInt(idParam)
    const { name, email, password, role, permissions, isActive } = await request.json()

    // Validate ID
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    interface UpdateData {
      name: string
      email: string
      role: Role
      permissions: string[]
      isActive: boolean
      password?: string
    }
    
    const updateData: UpdateData = {
      name,
      email,
      role: role as Role,
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : true
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: idParam } = params
    const id = parseInt(idParam)

    // Validate ID
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (authResult.user && authResult.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete all related records first to avoid foreign key constraints
    // Use transaction to ensure all deletions happen together or none at all
    await prisma.$transaction(async (tx) => {
      // Delete activity logs
      await tx.activityLog.deleteMany({
        where: { userId: id }
      })
      
      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: id }
      })
      
      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: id }
      })
      
      // Try to delete user sessions if table exists
      try {
        await tx.userSession.deleteMany({
          where: { userId: id }
        })
      } catch {
        // Table might not exist, ignore
      }
      
      // Try to delete login activations if table exists  
      try {
        await tx.loginActivation.deleteMany({
          where: { userId: id }
        })
      } catch {
        // Table might not exist, ignore
      }
      
      // Finally delete the user
      await tx.user.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

