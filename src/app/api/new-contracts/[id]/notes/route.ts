import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// إضافة ملاحظة متابعة جديدة
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = parseInt(params.id)
    const body = await request.json()
    const { note, userId } = body

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: 'الملاحظة مطلوبة' },
        { status: 400 }
      )
    }

    // إضافة الملاحظة
    const addedNote = await prisma.followUpNote.create({
      data: {
        contractId: contractId,
        note: note.trim(),
        createdById: userId || 1
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      note: addedNote
    })
  } catch (error) {
    console.error('Error adding follow-up note:', error)
    return NextResponse.json(
      { error: 'فشل إضافة الملاحظة' },
      { status: 500 }
    )
  }
}

// جلب جميع ملاحظات العقد
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = parseInt(params.id)

    const notes = await prisma.followUpNote.findMany({
      where: {
        contractId: contractId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      notes: notes
    })
  } catch (error) {
    console.error('Error fetching follow-up notes:', error)
    return NextResponse.json(
      { error: 'فشل جلب الملاحظات' },
      { status: 500 }
    )
  }
}
