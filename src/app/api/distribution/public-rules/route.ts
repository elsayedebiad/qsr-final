import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: جلب قواعد التوزيع للصفحة العامة (بدون authentication)
export async function GET() {
  try {
    const rules = await prisma.distributionRule.findMany({
      orderBy: { priority: 'desc' }
    })

    // إنشاء القواعد الافتراضية إذا لم تكن موجودة
    if (rules.length === 0) {
      const salesPages = [
        'sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6',
        'sales7', 'sales8', 'sales9', 'sales10', 'sales11'
      ]

      // القواعد الافتراضية: فقط sales1, sales2, sales3 نشطة
      const defaultWeights: Record<string, { google: number, other: number, active: boolean }> = {
        'sales1': { google: 33.33, other: 33.33, active: true },
        'sales2': { google: 33.33, other: 33.33, active: true },
        'sales3': { google: 33.34, other: 33.34, active: true },
        'sales4': { google: 0, other: 0, active: true },
        'sales5': { google: 0, other: 0, active: true },
        'sales6': { google: 0, other: 0, active: true },
        'sales7': { google: 0, other: 0, active: true },
        'sales8': { google: 0, other: 0, active: true },
        'sales9': { google: 0, other: 0, active: true },
        'sales10': { google: 0, other: 0, active: true },
        'sales11': { google: 0, other: 0, active: true }
      }

      const defaultRules = await Promise.all(
        salesPages.map((pageId, index) => 
          prisma.distributionRule.create({
            data: {
              salesPageId: pageId,
              dailyLimit: null,
              totalLimit: null,
              minCVs: 0,
              maxCVs: null,
              priority: salesPages.length - index,
              isActive: defaultWeights[pageId]?.active ?? false,
              autoDistribute: false,
              googleWeight: defaultWeights[pageId]?.google ?? 0,
              otherWeight: defaultWeights[pageId]?.other ?? 0
            }
          })
        )
      )

      return NextResponse.json({
        success: true,
        rules: defaultRules
      })
    }

    return NextResponse.json({
      success: true,
      rules
    })
  } catch (error) {
    console.error('Public distribution rules get error:', error)
    return NextResponse.json(
      { error: 'فشل جلب قواعد التوزيع' },
      { status: 500 }
    )
  }
}

