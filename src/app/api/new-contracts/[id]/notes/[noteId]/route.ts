import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE - حذف ملاحظة متابعة
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const contractId = parseInt(params.id)
    const noteId = parseInt(params.noteId)

    if (isNaN(contractId) || isNaN(noteId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })
    }

    // التحقق من وجود الملاحظة
    const note = await prisma.followUpNote.findUnique({
      where: { id: noteId }
    })

    if (!note) {
      return NextResponse.json({ error: 'الملاحظة غير موجودة' }, { status: 404 })
    }

    if (note.contractId !== contractId) {
      return NextResponse.json({ error: 'الملاحظة لا تنتمي لهذا العقد' }, { status: 400 })
    }

    // حذف الملاحظة
    await prisma.followUpNote.delete({
      where: { id: noteId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف الملاحظة بنجاح'
    })

  } catch (error) {
    console.error('Error deleting follow-up note:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الملاحظة' },
      { status: 500 }
    )
  }
}

// PUT - تعديل ملاحظة متابعة
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const contractId = parseInt(params.id)
    const noteId = parseInt(params.noteId)
    const { note: newNote } = await request.json()

    if (isNaN(contractId) || isNaN(noteId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })
    }

    if (!newNote || newNote.trim() === '') {
      return NextResponse.json({ error: 'الملاحظة مطلوبة' }, { status: 400 })
    }

    // التحقق من وجود الملاحظة
    const existingNote = await prisma.followUpNote.findUnique({
      where: { id: noteId }
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'الملاحظة غير موجودة' }, { status: 404 })
    }

    if (existingNote.contractId !== contractId) {
      return NextResponse.json({ error: 'الملاحظة لا تنتمي لهذا العقد' }, { status: 400 })
    }

    // تعديل الملاحظة
    const updatedNote = await prisma.followUpNote.update({
      where: { id: noteId },
      data: { note: newNote.trim() },
      include: {
        createdBy: {
          select: {
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      note: updatedNote,
      message: 'تم تعديل الملاحظة بنجاح'
    })

  } catch (error) {
    console.error('Error updating follow-up note:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعديل الملاحظة' },
      { status: 500 }
    )
  }
}
