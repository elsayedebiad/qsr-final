# دليل استخدام الـAnimations للأرقام 🎬

## نظرة عامة

تم إضافة نظام animation احترافي للأرقام في صفحة **visits-report** وجاهز للاستخدام في أي مكان آخر!

## الميزات ✨

### 1. **الأرقام المتحركة** 🔢
- ✅ الأرقام تنتقل من القيمة القديمة إلى الجديدة بسلاسة (وليس من الصفر!)
- ✅ حركة سلسة ومريحة للعين
- ✅ تنسيق عربي تلقائي للأرقام
- ✅ تأخير تدريجي لكل بطاقة (Stagger effect)
- ✅ سرعة ذكية: 0.8 ثانية فقط للانتقال

### 2. **تأثيرات بصرية** 🎨
- ✅ تكبير عند Hover
- ✅ شريط متحرك في الأسفل
- ✅ خلفية متوهجة عند التمرير
- ✅ ظل ثلاثي الأبعاد

### 3. **الأداء** ⚡
- ✅ استخدام `requestAnimationFrame` للأداء الأمثل
- ✅ لا يؤثر على سرعة الصفحة
- ✅ متوافق مع جميع المتصفحات

## الملفات الجديدة 📁

```
src/
├── hooks/
│   └── useCountAnimation.ts        # Hook للتحكم في الanimation
├── components/
│   └── AnimatedNumber.tsx          # Components جاهزة للاستخدام
└── styles/
    └── animations.css              # CSS animations إضافية
```

## كيفية الاستخدام 🎯

### 1. استخدام `AnimatedStatCard` (الأسهل)

```tsx
import { AnimatedStatCard } from '@/components/AnimatedNumber'
import { Users } from 'lucide-react'

<AnimatedStatCard
  title="إجمالي المستخدمين"
  value={1234}
  icon={<Users className="h-8 w-8" />}
  gradient="bg-gradient-to-br from-blue-500 to-blue-600"
  delay={0}
  trend={{
    value: 12.5,
    isPositive: true
  }}
/>
```

**الخصائص:**
- `title` - العنوان
- `value` - الرقم المراد عرضه
- `icon` - أيقونة (من lucide-react)
- `gradient` - ألوان الخلفية
- `delay` - التأخير بالميلي ثانية (للتأثير التدريجي)
- `trend` (اختياري) - نسبة التغيير مع سهم

### 2. استخدام `AnimatedNumber` (مرن أكثر)

```tsx
import { AnimatedNumber } from '@/components/AnimatedNumber'

<AnimatedNumber 
  value={5678}
  duration={2000}
  prefix="$"
  suffix=" SR"
  easingType="elastic"
  className="text-4xl font-bold"
/>
```

**الخصائص:**
- `value` - الرقم
- `duration` - مدة الanimation (ميلي ثانية)
- `prefix` - نص قبل الرقم
- `suffix` - نص بعد الرقم
- `formatNumber` - تنسيق عربي (true بشكل افتراضي)
- `delay` - التأخير
- `easingType` - نوع الحركة
- `className` - CSS classes

### 3. استخدام Hook مباشرة

```tsx
import { useCountAnimation, easingFunctions } from '@/hooks/useCountAnimation'

function MyComponent({ totalVisits }: { totalVisits: number }) {
  // الرقم سيتحرك تلقائياً عند تغيير totalVisits
  const animatedCount = useCountAnimation({
    value: totalVisits,
    duration: 800,
    easingFunction: easingFunctions.easeOut
  })

  return <span>{animatedCount.toLocaleString('ar-SA')}</span>
}
```

## كيف يعمل؟ 🔍

عندما تتغير قيمة الرقم:
```
القيمة القديمة: 100
القيمة الجديدة: 150

❌ الطريقة القديمة (سيئة):
0 → 1 → 2 → ... → 150

✅ الطريقة الجديدة (ممتازة):
100 → 105 → 110 → ... → 150
```

**مثال عملي:**
```tsx
// عند تحديث البيانات من API
const [visits, setVisits] = useState(1000)

// بعد دقيقة، تحديث تلقائي
setVisits(1050)  // الرقم سيتحرك من 1000 إلى 1050 تلقائياً! ✨
```

## أنواع الحركة (Easing Functions) 🎭

```tsx
'linear'       // حركة ثابتة
'easeInOut'    // بطيء في البداية والنهاية
'easeIn'       // بطيء في البداية
'easeOut'      // بطيء في النهاية (موصى به! ⭐)
'elastic'      // حركة مرنة (ممتعة!)
'bounce'       // حركة ارتدادية
```

## أمثلة عملية 💡

### مثال 1: بطاقات إحصائيات متدرجة

```tsx
const stats = [
  { title: 'الزيارات', value: 1234, delay: 0 },
  { title: 'المشتركون', value: 567, delay: 100 },
  { title: 'المبيعات', value: 890, delay: 200 },
]

<div className="grid grid-cols-3 gap-4">
  {stats.map((stat, index) => (
    <AnimatedStatCard
      key={index}
      title={stat.title}
      value={stat.value}
      icon={<TrendingUp className="h-6 w-6" />}
      gradient="bg-gradient-to-br from-purple-500 to-pink-500"
      delay={stat.delay}
    />
  ))}
</div>
```

### مثال 2: رقم كبير في الصفحة الرئيسية

```tsx
<div className="text-center">
  <AnimatedNumber 
    value={999999}
    duration={3000}
    className="text-6xl font-extrabold text-primary"
    easingType="elastic"
  />
  <p className="text-gray-600 mt-2">عدد العملاء السعداء</p>
</div>
```

### مثال 3: جدول مع أرقام متحركة

```tsx
import { SmallAnimatedNumber } from '@/components/AnimatedNumber'

<table>
  <tbody>
    {data.map((row) => (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td>
          <SmallAnimatedNumber value={row.count} />
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## التخصيص 🎨

### تغيير الألوان

```tsx
// ألوان جاهزة
gradient="bg-gradient-to-br from-blue-500 to-blue-600"     // أزرق
gradient="bg-gradient-to-br from-green-500 to-green-600"   // أخضر
gradient="bg-gradient-to-br from-purple-500 to-purple-600" // بنفسجي
gradient="bg-gradient-to-br from-red-500 to-red-600"       // أحمر
gradient="bg-gradient-to-br from-orange-500 to-orange-600" // برتقالي

// أو ألوان مخصصة
gradient="bg-gradient-to-br from-pink-500 via-rose-500 to-red-500"
```

### تغيير السرعة

```tsx
duration={400}   // سريع جداً
duration={600}   // سريع (للأرقام الصغيرة)
duration={800}   // متوسط (افتراضي - موصى به! ⭐)
duration={1000}  // بطيء قليلاً
duration={1500}  // بطيء (للأرقام الكبيرة جداً)
```

**💡 نصيحة:** السرعة الافتراضية 800ms مثالية لمعظم الحالات!

### إضافة تأخير تدريجي

```tsx
{items.map((item, index) => (
  <AnimatedStatCard
    key={index}
    delay={index * 100}  // كل بطاقة تتأخر 100ms عن السابقة
    {...item}
  />
))}
```

## CSS Classes الجاهزة 🎯

يمكنك استخدام هذه الـclasses مباشرة:

```tsx
className="animate-count-up"         // تأثير الظهور
className="animate-slide-in-up"     // انزلاق من الأسفل
className="animate-pulse-slow"      // نبضة بطيئة
className="animate-glow"            // توهج
className="animate-fade-in-scale"   // ظهور مع تكبير
className="animate-quick-pulse"     // نبضة سريعة
className="hover-lift"              // رفع عند Hover
className="hover-glow"              // توهج عند Hover
className="premium-card"            // بطاقة فاخرة
```

## نصائح للأداء الأفضل ⚡

### 1. استخدم التأخير بذكاء
```tsx
// ✅ ممتاز - تأخير تدريجي خفيف
delay={index * 50}   // كل بطاقة بعد 50ms

// ✅ جيد - تأخير تدريجي عادي
delay={index * 100}  // كل بطاقة بعد 100ms

// ⚠️ مقبول - بدون تأخير (للبطاقة الأولى)
delay={0}
```

### 2. اختر المدة المناسبة
```tsx
// ✅ موصى به (افتراضي)
duration={800}

// للأرقام التي تتغير كثيراً
duration={600}

// للأرقام الكبيرة جداً فقط
duration={1000}
```

**💡 ملاحظة:** المدة الافتراضية 800ms مناسبة لجميع الأحجام!

### 3. استخدم Easing مناسب
```tsx
// ✅ الأفضل للإحصائيات (افتراضي)
easingType="easeOut"

// للأرقام المالية
easingType="easeInOut"

// للألعاب والترفيه فقط
easingType="bounce" 
easingType="elastic"
```

## الاستخدام في صفحات أخرى 🚀

### في Dashboard الرئيسي:

```tsx
// في src/app/dashboard/page.tsx
import { AnimatedStatCard } from '@/components/AnimatedNumber'

<div className="grid grid-cols-4 gap-4">
  <AnimatedStatCard
    title="إجمالي السير الذاتية"
    value={totalCVs}
    icon={<FileText className="h-8 w-8" />}
    gradient="bg-gradient-to-br from-blue-500 to-blue-600"
    delay={0}
  />
  {/* ... المزيد */}
</div>
```

### في صفحة الإحصائيات:

```tsx
// في أي صفحة إحصائيات
import { AnimatedNumber } from '@/components/AnimatedNumber'

<div className="stat-container">
  <h2>المبيعات اليومية</h2>
  <AnimatedNumber 
    value={dailySales}
    prefix="$"
    className="text-5xl font-bold text-green-600"
  />
</div>
```

## الدعم والمساعدة 💬

إذا واجهت أي مشاكل:
1. تأكد من استيراد الـcomponents بشكل صحيح
2. راجع console للأخطاء
3. تأكد من أن الـvalue رقم وليس string
4. جرب تقليل الـduration إذا كان بطيء

---

**ملاحظة:** كل التأثيرات تعمل تلقائياً! فقط استخدم الـcomponents وستحصل على animation احترافي 🎉
