import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateAuthFromRequest, requireAdmin } from '@/lib/middleware-auth'

const prisma = new PrismaClient()

// GET /api/user-sales-pages - Get all assignments or for a specific user
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuthFromRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get assignments for a specific user
      try {
        const assignments = await prisma.userSalesPage.findMany({
          where: { userId: parseInt(userId) },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return NextResponse.json({ assignments })
      } catch (prismaError: any) {
        // إذا كان الخطأ بسبب عدم وجود النموذج في Prisma Client
        if (prismaError?.message?.includes('userSalesPage') || 
            prismaError?.code === 'P2001' ||
            prismaError?.message?.includes('Unknown model') ||
            prismaError?.message?.includes('does not exist')) {
          return NextResponse.json({ 
            assignments: [],
            warning: 'Table not found. Please run: npx prisma migrate dev --name add_user_sales_pages'
          })
        }
        throw prismaError
      }
    } else {
      // Get all assignments (admin only)
      const adminCheck = await requireAdmin(request)
      if (!adminCheck.success) {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
      }

      try {
        const assignments = await prisma.userSalesPage.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return NextResponse.json({ assignments })
      } catch (prismaError: any) {
        // إذا كان الخطأ بسبب عدم وجود النموذج في Prisma Client
        if (prismaError?.message?.includes('userSalesPage') || 
            prismaError?.code === 'P2001' ||
            prismaError?.message?.includes('Unknown model') ||
            prismaError?.message?.includes('does not exist')) {
          return NextResponse.json({ 
            assignments: [],
            warning: 'Table not found. Please run: npx prisma migrate dev --name add_user_sales_pages'
          })
        }
        throw prismaError
      }
    }
  } catch (error) {
    console.error('Error fetching user sales pages:', error)
    
    // التحقق من أنواع الأخطاء المختلفة
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // إذا كان الخطأ بسبب عدم وجود الجدول أو النموذج
    if (errorMessage.includes('does not exist') || 
        errorMessage.includes('Unknown model') ||
        errorMessage.includes('model UserSalesPage')) {
      console.warn('UserSalesPage model not found. Please run migration.')
      return NextResponse.json({ 
        assignments: [],
        warning: 'Table not found. Please run: npx prisma migrate dev --name add_user_sales_pages'
      })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}

// POST /api/user-sales-pages - Assign a sales page to a user
export async function POST(request: NextRequest) {
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

    const { userId, salesPageId } = await request.json()

    // Validate required fields
    if (!userId || !salesPageId) {
      return NextResponse.json({ error: 'Missing required fields: userId and salesPageId' }, { status: 400 })
    }

    // Validate sales page ID
    const validSalesPages = ['sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6', 'sales7', 'sales8', 'sales9', 'sales10', 'sales11', 'gallery', 'transfer-services']
    if (!validSalesPages.includes(salesPageId)) {
      return NextResponse.json({ error: 'Invalid sales page ID' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if assignment already exists
    try {
      const existing = await prisma.userSalesPage.findUnique({
        where: {
          userId_salesPageId: {
            userId: parseInt(userId),
            salesPageId: salesPageId
          }
        }
      })

      if (existing) {
        return NextResponse.json({ error: 'This sales page is already assigned to this user' }, { status: 400 })
      }

      // Create assignment
      const assignment = await prisma.userSalesPage.create({
        data: {
          userId: parseInt(userId),
          salesPageId: salesPageId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      return NextResponse.json({ assignment }, { status: 201 })
    } catch (prismaError: any) {
      // إذا كان الخطأ بسبب عدم وجود النموذج في Prisma Client
      if (prismaError?.message?.includes('userSalesPage') || 
          prismaError?.message?.includes('Cannot read properties of undefined') ||
          prismaError?.message?.includes('Unknown model') ||
          prismaError?.code === 'P2001') {
        console.error('Prisma Client error - model not found:', prismaError)
        return NextResponse.json({ 
          error: 'Database model not found. Please run: npx prisma generate && npx prisma migrate dev --name add_user_sales_pages',
          details: 'The UserSalesPage model is not available in Prisma Client. You need to regenerate it.'
        }, { status: 500 })
      }
      throw prismaError
    }
  } catch (error) {
    console.error('Error creating user sales page assignment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // التحقق من أنواع الأخطاء المختلفة
    if (errorMessage.includes('userSalesPage') || 
        errorMessage.includes('Cannot read properties of undefined')) {
      return NextResponse.json({ 
        error: 'Database model not found. Please run: npx prisma generate && npx prisma migrate dev --name add_user_sales_pages',
        details: 'The UserSalesPage model is not available in Prisma Client.'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}

