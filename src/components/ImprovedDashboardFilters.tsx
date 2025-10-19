'use client'

import React, { useState } from 'react'
import {
  Search, X, Filter, ChevronDown, ChevronUp, Star, Heart,
  Globe, Users, Calendar, BookOpen, DollarSign, Award,
  Briefcase, Timer, MapPin, Baby, Ruler, Scale, Languages,
  RefreshCw, XCircle
} from 'lucide-react'

interface FilterProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  religionFilter: string
  setReligionFilter: (value: string) => void
  nationalityFilter: string
  setNationalityFilter: (value: string) => void
  ageFilter: string
  setAgeFilter: (value: string) => void
  skillFilter: string
  setSkillFilter: (value: string) => void
  maritalStatusFilter: string
  setMaritalStatusFilter: (value: string) => void
  experienceFilter: string
  setExperienceFilter: (value: string) => void
  languageFilter: string
  setLanguageFilter: (value: string) => void
  educationFilter: string
  setEducationFilter: (value: string) => void
  salaryFilter: string
  setSalaryFilter: (value: string) => void
  contractPeriodFilter: string
  setContractPeriodFilter: (value: string) => void
  passportStatusFilter: string
  setPassportStatusFilter: (value: string) => void
  heightFilter: string
  setHeightFilter: (value: string) => void
  weightFilter: string
  setWeightFilter: (value: string) => void
  childrenFilter: string
  setChildrenFilter: (value: string) => void
  locationFilter: string
  setLocationFilter: (value: string) => void
}

export default function ImprovedDashboardFilters(props: FilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null)
  
  // عد الفلاتر النشطة
  const activeFiltersCount = [
    props.religionFilter !== 'ALL',
    props.nationalityFilter !== 'ALL',
    props.ageFilter !== 'ALL',
    props.skillFilter !== 'ALL',
    props.maritalStatusFilter !== 'ALL',
    props.experienceFilter !== 'ALL',
    props.languageFilter !== 'ALL',
    props.educationFilter !== 'ALL',
    props.salaryFilter !== 'ALL',
    props.contractPeriodFilter !== 'ALL',
    props.passportStatusFilter !== 'ALL',
    props.heightFilter !== 'ALL',
    props.weightFilter !== 'ALL',
    props.childrenFilter !== 'ALL',
    props.locationFilter !== 'ALL',
    props.searchTerm !== ''
  ].filter(Boolean).length

  const clearAllFilters = () => {
    props.setSearchTerm('')
    props.setReligionFilter('ALL')
    props.setNationalityFilter('ALL')
    props.setAgeFilter('ALL')
    props.setSkillFilter('ALL')
    props.setMaritalStatusFilter('ALL')
    props.setExperienceFilter('ALL')
    props.setLanguageFilter('ALL')
    props.setEducationFilter('ALL')
    props.setSalaryFilter('ALL')
    props.setContractPeriodFilter('ALL')
    props.setPassportStatusFilter('ALL')
    props.setHeightFilter('ALL')
    props.setWeightFilter('ALL')
    props.setChildrenFilter('ALL')
    props.setLocationFilter('ALL')
  }

  return (
    <div className="card p-6 mb-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              البحث والتصفية الذكية
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {activeFiltersCount > 0 ? (
                <span className="text-primary font-bold">
                  {activeFiltersCount} فلتر نشط
                </span>
              ) : (
                'ابحث وصفي السير الذاتية بسهولة'
              )}
            </p>
          </div>
        </div>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-bold hover:bg-destructive/20 transition-all flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            مسح كل الفلاتر
          </button>
        )}
      </div>

      {/* شريط البحث المحسن */}
      <div className="mb-6">
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="🔍 ابحث بالاسم، الجنسية، الوظيفة، الكود المرجعي..."
            className="form-input w-full pr-14 pl-6 py-5 text-lg border-2 hover:border-primary/50 focus:border-primary"
            value={props.searchTerm}
            onChange={(e) => props.setSearchTerm(e.target.value)}
            dir="rtl"
          />
          {props.searchTerm && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                {props.searchTerm.length} حرف
              </span>
              <button
                onClick={() => props.setSearchTerm('')}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* اقتراحات بحث سريعة */}
        {!props.searchTerm && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground">جرب البحث عن:</span>
            {['فلبينية', 'سائق', 'طباخة', 'رعاية أطفال', 'خبرة 5 سنوات'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => props.setSearchTerm(suggestion)}
                className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* الفلاتر السريعة بتصميم محسن */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* فلتر الديانة */}
        <div className="relative">
          <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
            <Heart className="h-3 w-3" /> الديانة
          </label>
          <select
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
              props.religionFilter !== 'ALL' 
                ? 'bg-purple-50 border-purple-300 text-purple-700' 
                : 'bg-muted border-border text-foreground hover:border-purple-200'
            }`}
            value={props.religionFilter}
            onChange={(e) => props.setReligionFilter(e.target.value)}
          >
            <option value="ALL">جميع الديانات</option>
            <option value="مسلمة">مسلمة</option>
            <option value="مسيحية">مسيحية</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        {/* فلتر الجنسية */}
        <div className="relative">
          <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
            <Globe className="h-3 w-3" /> الجنسية
          </label>
          <select
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
              props.nationalityFilter !== 'ALL' 
                ? 'bg-green-50 border-green-300 text-green-700' 
                : 'bg-muted border-border text-foreground hover:border-green-200'
            }`}
            value={props.nationalityFilter}
            onChange={(e) => props.setNationalityFilter(e.target.value)}
          >
            <option value="ALL">جميع الجنسيات</option>
            <option value="فلبينية">🇵🇭 فلبينية</option>
            <option value="هندية">🇮🇳 هندية</option>
            <option value="بنغلاديشية">🇧🇩 بنغلاديشية</option>
            <option value="إثيوبية">🇪🇹 إثيوبية</option>
            <option value="كينية">🇰🇪 كينية</option>
            <option value="أوغندية">🇺🇬 أوغندية</option>
            <option value="نيبالية">🇳🇵 نيبالية</option>
            <option value="سريلانكية">🇱🇰 سريلانكية</option>
            <option value="إندونيسية">🇮🇩 إندونيسية</option>
          </select>
        </div>

        {/* فلتر العمر */}
        <div className="relative">
          <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> الفئة العمرية
          </label>
          <select
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
              props.ageFilter !== 'ALL' 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-muted border-border text-foreground hover:border-blue-200'
            }`}
            value={props.ageFilter}
            onChange={(e) => props.setAgeFilter(e.target.value)}
          >
            <option value="ALL">جميع الأعمار</option>
            <option value="21-30">👶 21-30 سنة</option>
            <option value="30-40">👩 30-40 سنة</option>
            <option value="40-50">👩‍💼 40-50 سنة</option>
          </select>
        </div>

        {/* زر الفلاتر المتقدمة */}
        <div className="relative flex items-end">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`w-full px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 border-2 flex items-center justify-center gap-2 ${
              showAdvanced
                ? 'bg-gradient-to-r from-primary to-purple-600 text-white border-primary shadow-lg'
                : 'bg-background text-foreground border-border hover:bg-muted hover:border-primary/50'
            }`}
          >
            <Filter className="h-4 w-4" />
            {showAdvanced ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}
            {!showAdvanced && activeFiltersCount > 3 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                +{activeFiltersCount - 3}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* الفلاتر المتقدمة بتصميم أفضل */}
      {showAdvanced && (
        <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-xl border-2 border-primary/20">
          {/* تبويبات الفئات */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'personal', label: 'شخصي', icon: Users },
              { id: 'skills', label: 'المهارات', icon: Star },
              { id: 'experience', label: 'الخبرة', icon: Briefcase },
              { id: 'physical', label: 'المواصفات', icon: Ruler },
              { id: 'financial', label: 'مالي', icon: DollarSign }
            ].map(category => (
              <button
                key={category.id}
                onClick={() => setActiveFilterCategory(activeFilterCategory === category.id ? null : category.id)}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeFilterCategory === category.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-foreground hover:bg-primary/10'
                }`}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </button>
            ))}
          </div>

          {/* محتوى الفلاتر حسب الفئة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* فلاتر شخصية */}
            {(!activeFilterCategory || activeFilterCategory === 'personal') && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    الحالة الاجتماعية
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.maritalStatusFilter}
                    onChange={(e) => props.setMaritalStatusFilter(e.target.value)}
                  >
                    <option value="ALL">الكل</option>
                    <option value="SINGLE">أعزب</option>
                    <option value="MARRIED">متزوج</option>
                    <option value="DIVORCED">مطلق</option>
                    <option value="WIDOWED">أرمل</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Baby className="h-4 w-4 text-blue-500" />
                    عدد الأطفال
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.childrenFilter}
                    onChange={(e) => props.setChildrenFilter(e.target.value)}
                  >
                    <option value="ALL">الكل</option>
                    <option value="NONE">بدون أطفال</option>
                    <option value="FEW">1-2 أطفال</option>
                    <option value="MANY">أكثر من 2</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    الموقع
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل المدينة أو البلد..."
                    className="form-input w-full rounded-xl"
                    value={props.locationFilter}
                    onChange={(e) => props.setLocationFilter(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* فلاتر المهارات */}
            {(!activeFilterCategory || activeFilterCategory === 'skills') && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    المهارات
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.skillFilter}
                    onChange={(e) => props.setSkillFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المهارات</option>
                    <option value="babySitting">👶 رعاية أطفال</option>
                    <option value="childrenCare">👧 عناية بالأطفال</option>
                    <option value="cleaning">🧹 تنظيف</option>
                    <option value="arabicCooking">🍲 طبخ عربي</option>
                    <option value="driving">🚗 قيادة</option>
                    <option value="washing">🧺 غسيل</option>
                    <option value="ironing">👔 كي</option>
                    <option value="tutoring">📚 تدريس</option>
                    <option value="disabledCare">👴 رعاية كبار السن</option>
                    <option value="sewing">🧵 خياطة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Languages className="h-4 w-4 text-indigo-500" />
                    مستوى اللغة
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.languageFilter}
                    onChange={(e) => props.setLanguageFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="YES">ممتاز</option>
                    <option value="WILLING">جيد</option>
                    <option value="WEAK">ضعيف</option>
                    <option value="NO">لا</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    المستوى التعليمي
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.educationFilter}
                    onChange={(e) => props.setEducationFilter(e.target.value)}
                  >
                    <option value="ALL">جميع المستويات</option>
                    <option value="PRIMARY">ابتدائي</option>
                    <option value="SECONDARY">ثانوي</option>
                    <option value="DIPLOMA">دبلوم</option>
                    <option value="BACHELOR">بكالوريوس</option>
                  </select>
                </div>
              </>
            )}

            {/* فلاتر الخبرة */}
            {(!activeFilterCategory || activeFilterCategory === 'experience') && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Timer className="h-4 w-4 text-orange-500" />
                    سنوات الخبرة
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.experienceFilter}
                    onChange={(e) => props.setExperienceFilter(e.target.value)}
                  >
                    <option value="ALL">جميع مستويات الخبرة</option>
                    <option value="0-1">بدون خبرة - سنة</option>
                    <option value="1-3">1-3 سنوات</option>
                    <option value="3-5">3-5 سنوات</option>
                    <option value="5+">أكثر من 5 سنوات</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Award className="h-4 w-4 text-teal-500" />
                    حالة الجواز
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.passportStatusFilter}
                    onChange={(e) => props.setPassportStatusFilter(e.target.value)}
                  >
                    <option value="ALL">الكل</option>
                    <option value="VALID">ساري</option>
                    <option value="EXPIRED">منتهي</option>
                    <option value="MISSING">غير موجود</option>
                  </select>
                </div>
              </>
            )}

            {/* فلاتر المواصفات الجسدية */}
            {(!activeFilterCategory || activeFilterCategory === 'physical') && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-cyan-500" />
                    الطول
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.heightFilter}
                    onChange={(e) => props.setHeightFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الأطوال</option>
                    <option value="SHORT">قصير (أقل من 160)</option>
                    <option value="MEDIUM">متوسط (160-170)</option>
                    <option value="TALL">طويل (أكثر من 170)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Scale className="h-4 w-4 text-lime-500" />
                    الوزن
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.weightFilter}
                    onChange={(e) => props.setWeightFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الأوزان</option>
                    <option value="LIGHT">خفيف (أقل من 60)</option>
                    <option value="MEDIUM">متوسط (60-80)</option>
                    <option value="HEAVY">ثقيل (أكثر من 80)</option>
                  </select>
                </div>
              </>
            )}

            {/* فلاتر مالية */}
            {(!activeFilterCategory || activeFilterCategory === 'financial') && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    الراتب الشهري
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.salaryFilter}
                    onChange={(e) => props.setSalaryFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الرواتب</option>
                    <option value="LOW">أقل من 1000</option>
                    <option value="MEDIUM">1000-2000</option>
                    <option value="HIGH">أكثر من 2000</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    فترة العقد
                  </label>
                  <select
                    className="form-input w-full rounded-xl"
                    value={props.contractPeriodFilter}
                    onChange={(e) => props.setContractPeriodFilter(e.target.value)}
                  >
                    <option value="ALL">جميع الفترات</option>
                    <option value="1_YEAR">سنة واحدة</option>
                    <option value="2_YEARS">سنتان</option>
                    <option value="3_YEARS">3 سنوات</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* زر إعادة تعيين متقدم */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              إعادة تعيين كل الفلاتر
            </button>
          </div>
        </div>
      )}

      {/* شريط الفلاتر النشطة */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">الفلاتر النشطة:</span>
            
            {props.searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                بحث: {props.searchTerm}
                <button onClick={() => props.setSearchTerm('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {props.nationalityFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {props.nationalityFilter}
                <button onClick={() => props.setNationalityFilter('ALL')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {props.ageFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {props.ageFilter} سنة
                <button onClick={() => props.setAgeFilter('ALL')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {/* يمكن إضافة المزيد من الفلاتر النشطة هنا */}
          </div>
        </div>
      )}
    </div>
  )
}
