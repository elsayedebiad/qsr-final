import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // فحص الاتصال بقاعدة البيانات
    await prisma.$queryRaw`SELECT 1`
    
    // فحص عدد السير الذاتية
    const cvCount = await prisma.cV.count()
    
    // فحص عدد المستخدمين
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      data: {
        totalCVs: cvCount,
        totalUsers: userCount
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
    
  } catch (error: unknown) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development'
    }, { status: 500 })
    
  } finally {
    await prisma.$disconnect()
  }
}
