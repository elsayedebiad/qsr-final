import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const now = new Date()
    const fortyDaysAgo = new Date(now.getTime() - (40 * 24 * 60 * 60 * 1000))

    // جلب العقود التي بها مشاكل أو مر عليها 40 يوم
    const problemContracts = await prisma.newContract.findMany({
      where: {
        OR: [
          // عقود بها مشكلة
          {
            hasCVIssue: true
          },
          // عقود مر عليها 40 يوم أو أكثر منذ آخر تحديث
          {
            lastStatusUpdate: {
              lte: fortyDaysAgo
            }
          }
        ]
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        lastStatusUpdate: 'asc'
      }
    })

    // حساب عدد الأيام لكل عقد
    const contractsWithDays = problemContracts.map(contract => {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(contract.lastStatusUpdate).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        clientName: contract.clientName,
        salesRepName: contract.salesRepName,
        status: contract.status,
        hasCVIssue: contract.hasCVIssue,
        cvIssueType: contract.cvIssueType,
        daysSinceUpdate,
        lastStatusUpdate: contract.lastStatusUpdate,
        createdBy: contract.createdBy
      }
    })

    // إحصائيات
    const stats = {
      total: contractsWithDays.length,
      withIssues: contractsWithDays.filter(c => c.hasCVIssue).length,
      stale: contractsWithDays.filter(c => c.daysSinceUpdate >= 40).length
    }

    return NextResponse.json({
      contracts: contractsWithDays,
      stats
    })
  } catch (error) {
    console.error('Error fetching contract alerts:', error)
    return NextResponse.json(
      { error: 'فشل في جلب تنبيهات العقود' },
      { status: 500 }
    )
  }
}
