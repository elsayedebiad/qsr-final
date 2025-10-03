import { NextRequest, NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import path from 'path'

// GET - جلب التعاقدات مباشرة من SQLite (بدون Prisma)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 جلب التعاقدات من SQLite مباشرة...')

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    return new Promise((resolve) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err)
          resolve(NextResponse.json({ error: 'فشل في الاتصال بقاعدة البيانات' }, { status: 500 }))
          return
        }

        // جلب التعاقدات مع بيانات السير
        db.all(`
          SELECT 
            c.id,
            c.cvId,
            c.identityNumber,
            c.contractStartDate,
            c.contractEndDate,
            c.createdAt,
            c.updatedAt,
            cv.fullName,
            cv.fullNameArabic,
            cv.referenceCode,
            cv.nationality,
            cv.position,
            cv.profileImage,
            cv.status
          FROM contracts c
          LEFT JOIN cvs cv ON c.cvId = cv.id
          ORDER BY c.createdAt DESC
        `, (err, rows) => {
          db.close()

          if (err) {
            console.error('❌ خطأ في جلب التعاقدات:', err)
            resolve(NextResponse.json({ error: 'فشل في جلب التعاقدات' }, { status: 500 }))
            return
          }

          // تحويل البيانات لتطابق شكل Prisma
          const contracts = rows.map((row: any) => ({
            id: row.id,
            cvId: row.cvId,
            identityNumber: row.identityNumber,
            contractStartDate: row.contractStartDate,
            contractEndDate: row.contractEndDate,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            cv: {
              id: row.cvId,
              fullName: row.fullName,
              fullNameArabic: row.fullNameArabic,
              referenceCode: row.referenceCode,
              nationality: row.nationality,
              position: row.position,
              profileImage: row.profileImage,
              status: row.status
            }
          }))

          console.log(`✅ تم جلب ${contracts.length} تعاقد`)
          resolve(NextResponse.json(contracts))
        })
      })
    })

  } catch (error) {
    console.error('❌ خطأ عام:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
