/**
 * 🎯 خوارزمية التوزيع المثالي - دقة 100%
 * 
 * هذه الخوارزمية تضمن توزيع دقيق تماماً بدون أي فروق
 * باستخدام Largest Remainder Method (طريقة الباقي الأكبر)
 */

export interface WeightedItem {
  path: string
  weight: number
}

export interface DistributionResult {
  path: string
  weight: number
  expectedCount: number
  actualCount: number
  percentage: number
}

/**
 * توزيع مثالي بدقة 100% - بدون أي فروق
 * 
 * @param items - قائمة الصفحات مع أوزانها
 * @param totalItems - إجمالي عدد العناصر للتوزيع
 * @returns قائمة بالتوزيع الدقيق لكل صفحة
 */
export function perfectDistribution(
  items: WeightedItem[],
  totalItems: number
): DistributionResult[] {
  
  // التحقق من المدخلات
  if (items.length === 0) {
    throw new Error('لا توجد صفحات للتوزيع')
  }
  
  if (totalItems <= 0) {
    throw new Error('عدد العناصر يجب أن يكون أكبر من صفر')
  }
  
  // حساب مجموع الأوزان
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  
  if (totalWeight === 0) {
    throw new Error('مجموع الأوزان يساوي صفر')
  }
  
  // الخطوة 1: حساب النسبة الدقيقة لكل صفحة
  const exactAllocations = items.map(item => ({
    path: item.path,
    weight: item.weight,
    percentage: (item.weight / totalWeight) * 100,
    exactCount: (item.weight / totalWeight) * totalItems, // العدد الدقيق (بالكسور)
    floorCount: 0, // الجزء الصحيح (سنحسبه بعد قليل)
    remainder: 0    // الباقي (الكسور)
  }))
  
  // الخطوة 2: أخذ الجزء الصحيح من كل رقم
  exactAllocations.forEach(item => {
    item.floorCount = Math.floor(item.exactCount)
    item.remainder = item.exactCount - item.floorCount
  })
  
  // الخطوة 3: حساب الباقي الإجمالي
  const assignedSoFar = exactAllocations.reduce((sum, item) => sum + item.floorCount, 0)
  let remainingToDistribute = totalItems - assignedSoFar
  
  // الخطوة 4: توزيع الباقي على الصفحات ذات أكبر باقي (Largest Remainder)
  // ترتيب تنازلي حسب الباقي
  const sortedByRemainder = [...exactAllocations].sort((a, b) => b.remainder - a.remainder)
  
  for (let i = 0; i < remainingToDistribute; i++) {
    sortedByRemainder[i].floorCount += 1
  }
  
  // الخطوة 5: إنشاء النتيجة النهائية
  const results: DistributionResult[] = exactAllocations.map(item => ({
    path: item.path,
    weight: item.weight,
    expectedCount: item.exactCount,
    actualCount: item.floorCount,
    percentage: (item.floorCount / totalItems) * 100
  }))
  
  // التحقق من صحة التوزيع
  const totalDistributed = results.reduce((sum, r) => sum + r.actualCount, 0)
  if (totalDistributed !== totalItems) {
    throw new Error(`خطأ في التوزيع: توزيع ${totalDistributed} من أصل ${totalItems}`)
  }
  
  return results
}

/**
 * إنشاء قائمة بالصفحات مكررة حسب التوزيع المثالي
 * هذه القائمة يمكن استخدامها للتوزيع المباشر
 * 
 * @param items - قائمة الصفحات مع أوزانها
 * @param totalItems - إجمالي عدد العناصر
 * @returns قائمة الصفحات مكررة بالضبط حسب النسب
 */
export function createDistributionArray(
  items: WeightedItem[],
  totalItems: number
): string[] {
  
  const distribution = perfectDistribution(items, totalItems)
  
  // إنشاء مصفوفة بالترتيب
  const result: string[] = []
  
  for (const item of distribution) {
    for (let i = 0; i < item.actualCount; i++) {
      result.push(item.path)
    }
  }
  
  // خلط المصفوفة بشكل عشوائي (Fisher-Yates shuffle)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  
  return result
}

/**
 * اختبار التوزيع وطباعة النتائج
 */
export function testDistribution(
  items: WeightedItem[],
  totalItems: number
): void {
  console.log('🎯 اختبار التوزيع المثالي')
  console.log('=' .repeat(60))
  
  const results = perfectDistribution(items, totalItems)
  
  console.log(`إجمالي العناصر: ${totalItems}`)
  console.log(`عدد الصفحات: ${items.length}`)
  console.log('')
  
  console.log('النتائج:')
  console.log('-'.repeat(60))
  
  let totalDistributed = 0
  
  results.forEach(r => {
    console.log(`${r.path}:`)
    console.log(`  الوزن: ${r.weight}`)
    console.log(`  النسبة المتوقعة: ${r.expectedCount.toFixed(2)} (${((r.weight / items.reduce((s, i) => s + i.weight, 0)) * 100).toFixed(2)}%)`)
    console.log(`  العدد الفعلي: ${r.actualCount}`)
    console.log(`  النسبة الفعلية: ${r.percentage.toFixed(2)}%`)
    console.log(`  الفرق: ${Math.abs(r.actualCount - r.expectedCount).toFixed(2)}`)
    totalDistributed += r.actualCount
  })
  
  console.log('-'.repeat(60))
  console.log(`✅ إجمالي الموزع: ${totalDistributed} من ${totalItems}`)
  console.log(`✅ دقة التوزيع: ${totalDistributed === totalItems ? '100%' : 'خطأ!'}`)
}

