import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      salesPageId,
      searchTerm,
      nationality,
      position,
      ageFilter,
      experience,
      arabicLevel,
      englishLevel,
      maritalStatus,
      skills,
      religion,
      education,
      resultsCount,
      sessionId
    } = body

    // الحصول على IP و User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // تسجيل عملية البحث
    const analytics = await db.searchAnalytics.create({
      data: {
        salesPageId,
        searchTerm: searchTerm || null,
        nationality: nationality !== 'ALL' ? nationality : null,
        position: position !== 'ALL' ? position : null,
        ageFilter: ageFilter !== 'ALL' ? ageFilter : null,
        experience: experience !== 'ALL' ? experience : null,
        arabicLevel: arabicLevel !== 'ALL' ? arabicLevel : null,
        englishLevel: englishLevel !== 'ALL' ? englishLevel : null,
        maritalStatus: maritalStatus !== 'ALL' ? maritalStatus : null,
        skills: skills || [],
        religion: religion !== 'ALL' ? religion : null,
        education: education !== 'ALL' ? education : null,
        ipAddress,
        userAgent,
        sessionId,
        resultsCount
      }
    })

    return NextResponse.json({ success: true, id: analytics.id })
  } catch (error) {
    console.error('Error saving search analytics:', error)
    return NextResponse.json({ error: 'Failed to save analytics' }, { status: 500 })
  }
}

// الحصول على إحصائيات البحث
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const salesPageId = searchParams.get('salesPageId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    console.log('Analytics Request:', { salesPageId, startDate, endDate, limit })

    const where: any = {}
    
    if (salesPageId && salesPageId !== 'all') {
      where.salesPageId = salesPageId
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include the entire end day
      
      where.timestamp = {
        gte: start,
        lte: end
      }
    }

    console.log('Query where:', where)

    const analytics = await db.searchAnalytics.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    console.log(`Found ${analytics.length} analytics records`)

    // إحصائيات ملخصة
    const stats = {
      totalSearches: analytics.length,
      topSearchTerms: await getTopSearchTerms(where),
      topNationalities: await getTopNationalities(where),
      topPositions: await getTopPositions(where),
      topSkills: await getTopSkills(where),
      searchesByPage: await getSearchesByPage(where)
    }

    return NextResponse.json({ analytics, stats })
  } catch (error) {
    console.error('Error fetching search analytics:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// دوال مساعدة
async function getTopSearchTerms(where: any) {
  const searches = await db.searchAnalytics.groupBy({
    by: ['searchTerm'],
    where: {
      ...where,
      searchTerm: { not: null }
    },
    _count: true,
    orderBy: { _count: { searchTerm: 'desc' } },
    take: 10
  })
  
  return searches.map(s => ({
    term: s.searchTerm,
    count: s._count
  }))
}

async function getTopNationalities(where: any) {
  const nationalities = await db.searchAnalytics.groupBy({
    by: ['nationality'],
    where: {
      ...where,
      nationality: { not: null }
    },
    _count: true,
    orderBy: { _count: { nationality: 'desc' } },
    take: 10
  })
  
  return nationalities.map(n => ({
    nationality: n.nationality,
    count: n._count
  }))
}

async function getTopPositions(where: any) {
  const positions = await db.searchAnalytics.groupBy({
    by: ['position'],
    where: {
      ...where,
      position: { not: null }
    },
    _count: true,
    orderBy: { _count: { position: 'desc' } },
    take: 10
  })
  
  return positions.map(p => ({
    position: p.position,
    count: p._count
  }))
}

async function getTopSkills(where: any) {
  const allSearches = await db.searchAnalytics.findMany({
    where,
    select: { skills: true }
  })
  
  const skillCounts: { [key: string]: number } = {}
  allSearches.forEach(search => {
    search.skills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1
    })
  })
  
  return Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }))
}

async function getSearchesByPage(where: any) {
  const byPage = await db.searchAnalytics.groupBy({
    by: ['salesPageId'],
    where,
    _count: true,
    orderBy: { _count: { salesPageId: 'desc' } }
  })
  
  return byPage.map(p => ({
    salesPageId: p.salesPageId,
    count: p._count
  }))
}
