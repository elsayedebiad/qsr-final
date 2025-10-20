'use client'

import { useEffect, useState } from 'react'

interface CV {
  experience?: string | null
  fullName: string
  referenceCode: string
}

export default function TestExperience() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cvs')
      .then(res => res.json())
      .then(data => {
        setCvs(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading CVs:', err)
        setLoading(false)
      })
  }, [])

  function getCountForFilter(filterValue: string): number {
    return cvs.filter(cv => {
      const exp = (cv.experience || '').trim().toLowerCase()
      const nums = exp.match(/\d+/g)
      const yrs = nums && nums.length > 0 ? parseInt(nums[0]) : 0
      
      if (filterValue === 'NO_EXPERIENCE') {
        return exp === 'لا يوجد' || exp === '' || exp === 'no' || exp === 'none' || yrs === 0
      }
      if (filterValue === '1-2') return yrs >= 1 && yrs <= 2
      if (filterValue === '3-5') return yrs >= 3 && yrs <= 5
      if (filterValue === '6-10') return yrs >= 6 && yrs <= 10
      if (filterValue === 'MORE_10') return yrs > 10
      return false
    }).length
  }

  if (loading) {
    return <div className="p-8 text-center">جاري التحميل...</div>
  }

  // عينات من البيانات بخبرة
  const samplesWithExp = cvs.filter(cv => 
    cv.experience && 
    cv.experience.trim() !== '' && 
    cv.experience.trim().toLowerCase() !== 'لا يوجد' && 
    cv.experience.trim().toLowerCase() !== 'غير محدد'
  ).slice(0, 10)

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">اختبار فلتر الخبرة</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">إحصائيات الخبرة</h2>
        <div className="space-y-2">
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span>إجمالي السير:</span>
            <span className="font-bold">{cvs.length}</span>
          </div>
          <div className="flex justify-between p-2 bg-blue-50 rounded">
            <span>بدون خبرة:</span>
            <span className="font-bold text-blue-600">
              {getCountForFilter('NO_EXPERIENCE')}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-green-50 rounded">
            <span>1-2 سنة:</span>
            <span className="font-bold text-green-600">
              {getCountForFilter('1-2')}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-yellow-50 rounded">
            <span>3-5 سنوات:</span>
            <span className="font-bold text-yellow-600">
              {getCountForFilter('3-5')}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-orange-50 rounded">
            <span>6-10 سنوات:</span>
            <span className="font-bold text-orange-600">
              {getCountForFilter('6-10')}
            </span>
          </div>
          <div className="flex justify-between p-2 bg-red-50 rounded">
            <span>أكثر من 10 سنوات:</span>
            <span className="font-bold text-red-600">
              {getCountForFilter('MORE_10')}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">نماذج من السير بخبرة</h2>
        {samplesWithExp.length > 0 ? (
          <div className="space-y-2">
            {samplesWithExp.map((cv, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <span className="font-medium">{cv.fullName}</span>
                <span className="text-gray-500 mx-2">({cv.referenceCode})</span>
                <span className="text-green-600">"{cv.experience}"</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">لا توجد سير بخبرة محددة</p>
        )}
      </div>
    </div>
  )
}
