/**
 * تتبع نقرات زر الحجز والاستفسار
 */
export async function trackBookingClick(salesPageId: string, cv: {
  id?: number | string
  fullName?: string | null
  fullNameArabic?: string | null
}) {
  try {
    console.log('📊 تسجيل نقرة حجز...', { salesPageId, cvId: cv.id, cvName: cv.fullNameArabic || cv.fullName });
    
    const response = await fetch('/api/booking-clicks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        salesPageId: salesPageId,
        cvId: cv.id?.toString() || null,
        cvName: cv.fullNameArabic || cv.fullName || null,
        action: 'BOOKING_CLICK',
        messageSent: false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ فشل تسجيل النقرة:', response.status, errorData);
      return null;
    } else {
      const data = await response.json();
      console.log('✅ تم تسجيل النقرة بنجاح!', data);
      
      // حفظ معرف النقرة لتحديث حالة الإرسال لاحقاً
      const clickId = data.click?.id;
      if (clickId) {
        setupMessageSentTracking(clickId, salesPageId);
      }
      
      return data;
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل نقرة الحجز:', error);
    return null;
  }
}

/**
 * تتبع ذكي لمعرفة إذا تم إرسال الرسالة
 * نظام هجين: يجمع بين مراقبة الصفحة + فتح الرابط
 */
function setupMessageSentTracking(clickId: number, salesPageId: string) {
  let tabHidden = false;
  let startTime = Date.now();
  let whatsappOpened = false;
  
  const handleVisibilityChange = async () => {
    if (document.hidden) {
      // المستخدم غادر الصفحة (فتح الواتساب)
      tabHidden = true;
      whatsappOpened = true;
      startTime = Date.now();
      console.log('👋 المستخدم غادر الصفحة (فتح الواتساب)');
      
      // تسجيل فوري: المستخدم فتح الواتساب
      // نسجل كـ "محتمل" في localStorage
      try {
        localStorage.setItem(`whatsapp_opened_${clickId}`, Date.now().toString());
        console.log('💾 تم حفظ حالة فتح الواتساب محلياً');
      } catch (e) {
        console.warn('تعذر الحفظ في localStorage:', e);
      }
      
    } else if (tabHidden) {
      // المستخدم رجع للصفحة
      const timeAway = (Date.now() - startTime) / 1000; // بالثواني
      console.log(`🔙 المستخدم رجع بعد ${timeAway.toFixed(1)} ثانية`);
      
      // إذا كان بعيد أكثر من 5 ثواني، نفترض أنه أرسل الرسالة
      if (timeAway >= 5) {
        console.log('✉️ تحديث حالة الرسالة إلى "مُحتمل الإرسال" (لم يفتح الرابط بعد)');
        
        try {
          await fetch('/api/booking-clicks/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clickId: clickId,
              messageSent: true // سنسجلها كـ "تم الإرسال" افتراضياً
            })
          });
          
          console.log('✅ تم تحديث حالة الرسالة (افتراضياً)!');
          console.log('📌 ملاحظة: سيتم التأكيد النهائي عند فتح الرابط');
        } catch (error) {
          console.error('❌ فشل تحديث حالة الرسالة:', error);
        }
      }
      
      // إزالة المستمع بعد التحديث
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      tabHidden = false;
    }
  };
  
  // إضافة مستمع لتغيير رؤية الصفحة
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // استخدام Beacon API للتسجيل عند إغلاق الصفحة
  const handleBeforeUnload = () => {
    if (whatsappOpened) {
      console.log('🚪 المستخدم يغلق الصفحة - تسجيل نهائي');
      
      // Beacon API: يعمل حتى لو المستخدم أغلق الصفحة
      const data = JSON.stringify({
        clickId: clickId,
        messageSent: true,
        timestamp: Date.now()
      });
      
      // إرسال غير متزامن (يعمل حتى بعد إغلاق الصفحة)
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/booking-clicks/update-status', data);
        console.log('📡 تم إرسال Beacon للتأكيد');
      }
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // إزالة المستمعات بعد دقيقتين (تنظيف)
  setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    console.log('🧹 تم تنظيف المستمعات');
  }, 120000); // دقيقتين
}
