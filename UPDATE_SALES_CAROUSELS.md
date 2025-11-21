# ✅ تم تحديث الـ Carousel في صفحات المبيعات

## التعديلات المنجزة:

### 1. **SimpleImageCarousel Component** ✅
- إضافة `whatsappNumber` كـ prop اختياري
- إضافة دالة `handleImageClick` لفتح الواتساب عند النقر
- إضافة `cursor: pointer` للصور عند توفر رقم الواتساب
- إضافة `onClick={handleImageClick}` لجميع الصور (Desktop & Mobile)

### 2. **الصفحات المحدثة:**
✅ **sales1** - تم التحديث بنجاح
✅ **sales2** - تم التحديث بنجاح

### 3. **الصفحات المتبقية:**
يجب تحديث هذه الصفحات بنفس الطريقة:
- sales3
- sales4
- sales5
- sales6
- sales7
- sales8
- sales9
- sales10
- sales11

## 📝 التعديل المطلوب لكل صفحة:

في كل صفحة sales، ابحث عن `<SimpleImageCarousel` وأضف:
```tsx
whatsappNumber={whatsappNumber}
```

### مثال:
```tsx
// قبل:
<SimpleImageCarousel
  desktopImages={desktopBanners}
  mobileImages={mobileBanners}
  autoPlay={true}
  autoPlayInterval={4000}
  className=""
/>

// بعد:
<SimpleImageCarousel
  desktopImages={desktopBanners}
  mobileImages={mobileBanners}
  autoPlay={true}
  autoPlayInterval={4000}
  className=""
  whatsappNumber={whatsappNumber}
/>
```

## 🎯 النتيجة:
عند النقر على أي صورة في الـ Carousel (الأساسي أو الإضافي)، سيتم فتح الواتساب تلقائياً برقم الصفحة المخصص مع رسالة:
> "مرحباً، أود الاستفسار عن الخدمات"
