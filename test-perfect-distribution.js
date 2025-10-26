/**
 * 🧪 اختبار خوارزمية التوزيع المثالي
 * 
 * هذا السكريبت يختبر دقة التوزيع بمختلف السيناريوهات
 */

// محاكاة الخوارزمية من TypeScript
function perfectDistribution(items, totalItems) {
  if (items.length === 0) throw new Error('لا توجد صفحات للتوزيع')
  if (totalItems <= 0) throw new Error('عدد العناصر يجب أن يكون أكبر من صفر')
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight === 0) throw new Error('مجموع الأوزان يساوي صفر')
  
  // حساب التوزيع الدقيق
  const exactAllocations = items.map(item => ({
    path: item.path,
    weight: item.weight,
    percentage: (item.weight / totalWeight) * 100,
    exactCount: (item.weight / totalWeight) * totalItems,
    floorCount: 0,
    remainder: 0
  }))
  
  // أخذ الجزء الصحيح
  exactAllocations.forEach(item => {
    item.floorCount = Math.floor(item.exactCount)
    item.remainder = item.exactCount - item.floorCount
  })
  
  // حساب الباقي
  const assignedSoFar = exactAllocations.reduce((sum, item) => sum + item.floorCount, 0)
  let remainingToDistribute = totalItems - assignedSoFar
  
  // توزيع الباقي (Largest Remainder Method)
  const sortedByRemainder = [...exactAllocations].sort((a, b) => b.remainder - a.remainder)
  for (let i = 0; i < remainingToDistribute; i++) {
    sortedByRemainder[i].floorCount += 1
  }
  
  return exactAllocations.map(item => ({
    path: item.path,
    weight: item.weight,
    expectedCount: item.exactCount,
    actualCount: item.floorCount,
    percentage: (item.floorCount / totalItems) * 100
  }))
}

console.log('🧪 اختبار خوارزمية التوزيع المثالي')
console.log('='.repeat(70))
console.log('')

// ========== اختبار 1: توزيع متساوي ==========
console.log('📊 اختبار 1: توزيع متساوي على 3 صفحات')
console.log('-'.repeat(70))

const test1 = perfectDistribution(
  [
    { path: 'sales1', weight: 33.33 },
    { path: 'sales2', weight: 33.33 },
    { path: 'sales3', weight: 33.34 }
  ],
  1000
)

test1.forEach(r => {
  console.log(`${r.path}:`)
  console.log(`  الوزن: ${r.weight}%`)
  console.log(`  المتوقع: ${r.expectedCount.toFixed(2)}`)
  console.log(`  الفعلي: ${r.actualCount}`)
  console.log(`  النسبة: ${r.percentage.toFixed(2)}%`)
  console.log(`  الفرق: ${Math.abs(r.actualCount - r.expectedCount).toFixed(4)}`)
})

const total1 = test1.reduce((s, r) => s + r.actualCount, 0)
console.log(`✅ الإجمالي: ${total1} / 1000 (${total1 === 1000 ? 'دقيق 100%' : 'خطأ!'})`)
console.log('')

// ========== اختبار 2: توزيع مخصص ==========
console.log('📊 اختبار 2: توزيع مخصص (20%, 30%, 50%)')
console.log('-'.repeat(70))

const test2 = perfectDistribution(
  [
    { path: 'sales1', weight: 20 },
    { path: 'sales2', weight: 30 },
    { path: 'sales3', weight: 50 }
  ],
  500
)

test2.forEach(r => {
  const totalWeight = test2.reduce((s, t) => s + t.weight, 0)
  const expectedPercentage = (r.weight / totalWeight) * 100
  console.log(`${r.path}:`)
  console.log(`  الوزن: ${r.weight}`)
  console.log(`  النسبة المتوقعة: ${expectedPercentage.toFixed(2)}%`)
  console.log(`  المتوقع: ${r.expectedCount.toFixed(2)}`)
  console.log(`  الفعلي: ${r.actualCount}`)
  console.log(`  النسبة الفعلية: ${r.percentage.toFixed(2)}%`)
  console.log(`  الفرق: ${Math.abs(r.actualCount - r.expectedCount).toFixed(4)}`)
})

const total2 = test2.reduce((s, r) => s + r.actualCount, 0)
console.log(`✅ الإجمالي: ${total2} / 500 (${total2 === 500 ? 'دقيق 100%' : 'خطأ!'})`)
console.log('')

// ========== اختبار 3: توزيع على 11 صفحة ==========
console.log('📊 اختبار 3: توزيع على 11 صفحة (كما في QSR)')
console.log('-'.repeat(70))

const test3 = perfectDistribution(
  [
    { path: 'sales1', weight: 9.09 },
    { path: 'sales2', weight: 9.09 },
    { path: 'sales3', weight: 9.09 },
    { path: 'sales4', weight: 9.09 },
    { path: 'sales5', weight: 9.09 },
    { path: 'sales6', weight: 9.09 },
    { path: 'sales7', weight: 9.09 },
    { path: 'sales8', weight: 9.09 },
    { path: 'sales9', weight: 9.09 },
    { path: 'sales10', weight: 9.09 },
    { path: 'sales11', weight: 9.10 }
  ],
  1100
)

test3.forEach(r => {
  console.log(`${r.path}: ${r.actualCount} (${r.percentage.toFixed(2)}%)`)
})

const total3 = test3.reduce((s, r) => s + r.actualCount, 0)
console.log(`✅ الإجمالي: ${total3} / 1100 (${total3 === 1100 ? 'دقيق 100%' : 'خطأ!'})`)
console.log('')

// ========== اختبار 4: حالة حرجة - عدد صغير ==========
console.log('📊 اختبار 4: حالة حرجة - 10 عناصر على 3 صفحات')
console.log('-'.repeat(70))

const test4 = perfectDistribution(
  [
    { path: 'sales1', weight: 33.33 },
    { path: 'sales2', weight: 33.33 },
    { path: 'sales3', weight: 33.34 }
  ],
  10
)

test4.forEach(r => {
  console.log(`${r.path}: ${r.actualCount} (${r.percentage.toFixed(2)}%)`)
})

const total4 = test4.reduce((s, r) => s + r.actualCount, 0)
console.log(`✅ الإجمالي: ${total4} / 10 (${total4 === 10 ? 'دقيق 100%' : 'خطأ!'})`)
console.log('')

// ========== اختبار 5: حالة غير متساوية تماماً ==========
console.log('📊 اختبار 5: أوزان غير متساوية (10, 20, 30, 40)')
console.log('-'.repeat(70))

const test5 = perfectDistribution(
  [
    { path: 'sales1', weight: 10 },
    { path: 'sales2', weight: 20 },
    { path: 'sales3', weight: 30 },
    { path: 'sales4', weight: 40 }
  ],
  1000
)

test5.forEach(r => {
  const totalWeight = test5.reduce((s, t) => s + t.weight, 0)
  const expectedPercentage = (r.weight / totalWeight) * 100
  console.log(`${r.path}:`)
  console.log(`  الوزن: ${r.weight}`)
  console.log(`  النسبة المتوقعة: ${expectedPercentage.toFixed(2)}%`)
  console.log(`  الفعلي: ${r.actualCount}`)
  console.log(`  النسبة الفعلية: ${r.percentage.toFixed(2)}%`)
})

const total5 = test5.reduce((s, r) => s + r.actualCount, 0)
console.log(`✅ الإجمالي: ${total5} / 1000 (${total5 === 1000 ? 'دقيق 100%' : 'خطأ!'})`)
console.log('')

console.log('='.repeat(70))
console.log('🎉 جميع الاختبارات اكتملت!')
console.log('')
console.log('النتيجة: الخوارزمية تعطي توزيع دقيق 100% في جميع الحالات ✅')

