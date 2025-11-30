import React from 'react'
import ReactCountryFlag from 'react-country-flag'
import { getCountryInfo } from '../lib/country-utils'

interface CountryFlagProps {
  nationality: string
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// خريطة الجنسيات إلى أكواد الدول (بالعربي والإنجليزي)
const nationalityToCountryCode: Record<string, string> = {
  // عربي
  'مصر': 'EG',
  'السعودية': 'SA',
  'الإمارات': 'AE',
  'الكويت': 'KW',
  'قطر': 'QA',
  'البحرين': 'BH',
  'عمان': 'OM',
  'الأردن': 'JO',
  'لبنان': 'LB',
  'سوريا': 'SY',
  'العراق': 'IQ',
  'المغرب': 'MA',
  'الجزائر': 'DZ',
  'تونس': 'TN',
  'ليبيا': 'LY',
  'السودان': 'SD',
  'فلسطين': 'PS',
  'اليمن': 'YE',
  'الهند': 'IN',
  'باكستان': 'PK',
  'بنجلاديش': 'BD',
  'سريلانكا': 'LK',
  'الفلبين': 'PH',
  'إندونيسيا': 'ID',
  'نيبال': 'NP',
  'إثيوبيا': 'ET',
  'كينيا': 'KE',
  'أوغندا': 'UG',
  'نيجيريا': 'NG',
  'غانا': 'GH',
  'الكاميرون': 'CM',
  'تايلاند': 'TH',
  'فيتنام': 'VN',
  'ميانمار': 'MM',
  'كمبوديا': 'KH',
  // إنجليزي
  'EGYPTIAN': 'EG',
  'FILIPINO': 'PH',
  'INDIAN': 'IN',
  'BANGLADESHI': 'BD',
  'ETHIOPIAN': 'ET',
  'KENYAN': 'KE',
  'UGANDAN': 'UG',
  'PAKISTANI': 'PK',
  'SRI_LANKAN': 'LK',
  'NEPALESE': 'NP',
  'INDONESIAN': 'ID',
  'THAI': 'TH',
  'VIETNAMESE': 'VN',
  'BURMESE': 'MM',
  'CAMBODIAN': 'KH',
  'NIGERIAN': 'NG',
  'GHANAIAN': 'GH',
  'CAMEROONIAN': 'CM'
}

// خريطة تحويل الجنسيات من الإنجليزية إلى العربية
const nationalityToArabic: Record<string, string> = {
  'FILIPINO': 'فلبينية',
  'INDIAN': 'هندية',
  'BANGLADESHI': 'بنغلاديشية',
  'ETHIOPIAN': 'إثيوبية',
  'KENYAN': 'كينية',
  'UGANDAN': 'أوغندية',
  'PAKISTANI': 'باكستانية',
  'SRI_LANKAN': 'سريلانكية',
  'NEPALESE': 'نيبالية',
  'INDONESIAN': 'إندونيسية',
  'THAI': 'تايلاندية',
  'VIETNAMESE': 'فيتنامية',
  'BURMESE': 'ميانمارية',
  'CAMBODIAN': 'كمبودية',
  'NIGERIAN': 'نيجيرية',
  'GHANAIAN': 'غانية',
  'CAMEROONIAN': 'كاميرونية',
  'EGYPTIAN': 'مصرية',
  'SUDANESE': 'سودانية',
  'MOROCCAN': 'مغربية',
  'ALGERIAN': 'جزائرية',
  'TUNISIAN': 'تونسية'
}

const CountryFlag: React.FC<CountryFlagProps> = ({ 
  nationality, 
  showName = true, 
  size = 'md',
  className = '' 
}) => {
  // تحويل الجنسية للعربية إذا كانت بالإنجليزية
  const displayNationality = nationalityToArabic[nationality] || nationality
  
  const countryInfo = getCountryInfo(displayNationality)
  const countryCode = nationalityToCountryCode[nationality] || nationalityToCountryCode[displayNationality] || 'UN' // UN للدول غير المعروفة
  
  const sizeClasses = {
    sm: 16,
    md: 20, 
    lg: 28
  }
  
  const flagSize = sizeClasses[size]
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        style={{
          width: `${flagSize}px`,
          height: `${flagSize * 0.75}px`,
          borderRadius: '2px'
        }}
        title={nationality}
      />
      {showName && (
        <span className="font-medium text-foreground">
          {displayNationality}
        </span>
      )}
    </div>
  )
}

export default CountryFlag
