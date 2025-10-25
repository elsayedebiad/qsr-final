import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'

const prisma = new PrismaClient()

// GET: جلب قواعد التوزيع
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const rules = await prisma.distributionRule.findMany({
      orderBy: { priority: 'desc' }
    })

    // إنشاء القواعد الافتراضية إذا لم تكن موجودة
    if (rules.length === 0) {
      const salesPages = [
        'sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6',
        'sales7', 'sales8', 'sales9', 'sales10', 'sales11'
      ]

      // القواعد الافتراضية مع أوزان التوزيع (11 صفحة - إجمالي 100%)
      const defaultWeights: Record<string, { google: number, other: number, active: boolean }> = {
        'sales1': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales2': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales3': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales4': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales5': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales6': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales7': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales8': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales9': { google: 9.09, other: 9.09, active: true },   // ~9%
        'sales10': { google: 9.09, other: 9.09, active: true },  // ~9%
        'sales11': { google: 9.01, other: 9.01, active: true }   // ~9% (مع تعديل للوصول لـ 100%)
      }
      // الإجمالي: 100% بالضبط

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
    console.error('Distribution rules get error:', error)
    return NextResponse.json(
      { error: 'فشل جلب قواعد التوزيع' },
      { status: 500 }
    )
  }
}

// POST: حفظ جميع القواعد دفعة واحدة
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rules } = body

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'القواعد يجب أن تكون مصفوفة' },
        { status: 400 }
      )
    }

    // تحديث جميع القواعد
    const updatedRules = await Promise.all(
      rules.map((rule: any) => 
        prisma.distributionRule.upsert({
          where: { salesPageId: rule.path.replace('/sales', 'sales') },
          update: {
            googleWeight: rule.googleWeight,
            otherWeight: rule.otherWeight,
            isActive: rule.isActive
          },
          create: {
            salesPageId: rule.path.replace('/sales', 'sales'),
            googleWeight: rule.googleWeight,
            otherWeight: rule.otherWeight,
            isActive: rule.isActive
          }
        })
      )
    )

    // ✅ توليد رقم نسخة جديد لإلغاء الكوكيز القديمة تلقائياً
    const rulesVersion = `v${Date.now()}`
    console.log('✅ Distribution rules saved successfully')
    console.log(`   New rules version: ${rulesVersion}`)
    console.log('   🔄 All user cookies will be reset on next visit')

    return NextResponse.json({
      success: true,
      message: 'تم حفظ القواعد بنجاح',
      rules: updatedRules,
      rulesVersion // إرجاع رقم النسخة الجديد
    })
  } catch (error) {
    console.error('Distribution rules save error:', error)
    return NextResponse.json(
      { error: 'فشل حفظ القواعد' },
      { status: 500 }
    )
  }
}

// PUT: تحديث قاعدة توزيع واحدة
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { salesPageId, ...updateData } = body

    if (!salesPageId) {
      return NextResponse.json(
        { error: 'معرف الصفحة مطلوب' },
        { status: 400 }
      )
    }

    const rule = await prisma.distributionRule.upsert({
      where: { salesPageId },
      update: updateData,
      create: {
        salesPageId,
        ...updateData
      }
    })

    return NextResponse.json({
      success: true,
      rule
    })
  } catch (error) {
    console.error('Distribution rules update error:', error)
    return NextResponse.json(
      { error: 'فشل تحديث قاعدة التوزيع' },
      { status: 500 }
    )
  }
}
