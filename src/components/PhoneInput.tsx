'use client'

import { useState, useEffect } from 'react'
import { Phone, ChevronDown } from 'lucide-react'

interface Country {
  name: string
  nameAr: string
  code: string
  dialCode: string
  flag: string
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// قائمة شاملة بدول العالم مع أكواد الهاتف
const countries: Country[] = [
  // الدول العربية
  { name: 'Saudi Arabia', nameAr: 'السعودية', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'United Arab Emirates', nameAr: 'الإمارات', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Kuwait', nameAr: 'الكويت', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Qatar', nameAr: 'قطر', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Bahrain', nameAr: 'البحرين', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Oman', nameAr: 'عمان', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Egypt', nameAr: 'مصر', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Jordan', nameAr: 'الأردن', code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { name: 'Lebanon', nameAr: 'لبنان', code: 'LB', dialCode: '+961', flag: '🇱🇧' },
  { name: 'Syria', nameAr: 'سوريا', code: 'SY', dialCode: '+963', flag: '🇸🇾' },
  { name: 'Iraq', nameAr: 'العراق', code: 'IQ', dialCode: '+964', flag: '🇮🇶' },
  { name: 'Morocco', nameAr: 'المغرب', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Algeria', nameAr: 'الجزائر', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Tunisia', nameAr: 'تونس', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Libya', nameAr: 'ليبيا', code: 'LY', dialCode: '+218', flag: '🇱🇾' },
  { name: 'Sudan', nameAr: 'السودان', code: 'SD', dialCode: '+249', flag: '🇸🇩' },
  { name: 'Palestine', nameAr: 'فلسطين', code: 'PS', dialCode: '+970', flag: '🇵🇸' },
  { name: 'Yemen', nameAr: 'اليمن', code: 'YE', dialCode: '+967', flag: '🇾🇪' },
  
  // دول آسيوية شائعة
  { name: 'India', nameAr: 'الهند', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Pakistan', nameAr: 'باكستان', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', nameAr: 'بنغلاديش', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', nameAr: 'سريلانكا', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Philippines', nameAr: 'الفلبين', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Indonesia', nameAr: 'إندونيسيا', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Nepal', nameAr: 'نيبال', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { name: 'Myanmar', nameAr: 'ميانمار', code: 'MM', dialCode: '+95', flag: '🇲🇲' },
  { name: 'Thailand', nameAr: 'تايلاند', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Vietnam', nameAr: 'فيتنام', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  
  // دول أفريقية شائعة
  { name: 'Ethiopia', nameAr: 'إثيوبيا', code: 'ET', dialCode: '+251', flag: '🇪🇹' },
  { name: 'Kenya', nameAr: 'كينيا', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Uganda', nameAr: 'أوغندا', code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { name: 'Tanzania', nameAr: 'تنزانيا', code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { name: 'Nigeria', nameAr: 'نيجيريا', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Ghana', nameAr: 'غانا', code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'South Africa', nameAr: 'جنوب أفريقيا', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  
  // دول أوروبية وأمريكية
  { name: 'United States', nameAr: 'الولايات المتحدة', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', nameAr: 'كندا', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', nameAr: 'المملكة المتحدة', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Germany', nameAr: 'ألمانيا', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', nameAr: 'فرنسا', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Italy', nameAr: 'إيطاليا', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', nameAr: 'إسبانيا', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Netherlands', nameAr: 'هولندا', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Australia', nameAr: 'أستراليا', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Turkey', nameAr: 'تركيا', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Iran', nameAr: 'إيران', code: 'IR', dialCode: '+98', flag: '🇮🇷' },
  { name: 'China', nameAr: 'الصين', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Japan', nameAr: 'اليابان', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', nameAr: 'كوريا الجنوبية', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Russia', nameAr: 'روسيا', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Brazil', nameAr: 'البرازيل', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', nameAr: 'المكسيك', code: 'MX', dialCode: '+52', flag: '🇲🇽' }
]

export default function PhoneInput({ value, onChange, placeholder, className = '' }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]) // السعودية افتراضياً
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // تحليل القيمة الحالية عند التحميل
  useEffect(() => {
    if (value) {
      // البحث عن الدولة المطابقة
      const matchingCountry = countries.find(country => 
        value.startsWith(country.dialCode)
      )
      
      if (matchingCountry) {
        setSelectedCountry(matchingCountry)
        setPhoneNumber(value.substring(matchingCountry.dialCode.length))
      } else {
        // إذا لم نجد دولة مطابقة، استخدم القيمة كما هي
        setPhoneNumber(value)
      }
    }
  }, [value])

  // تحديث القيمة عند تغيير الدولة أو الرقم
  const updateValue = (country: Country, number: string) => {
    const cleanNumber = number.replace(/\D/g, '') // إزالة كل شيء عدا الأرقام
    const fullNumber = cleanNumber ? `${country.dialCode}${cleanNumber}` : ''
    onChange(fullNumber)
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    updateValue(country, phoneNumber)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, '') // السماح بالأرقام فقط
    setPhoneNumber(number)
    updateValue(selectedCountry, number)
  }

  // فلترة الدول حسب البحث
  const filteredCountries = countries.filter(country =>
    country.nameAr.includes(searchTerm) ||
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  )

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* اختيار الدولة */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-3 border-2 border-r-0 border-gray-200 rounded-r-lg bg-gray-50 hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* قائمة الدول */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
              {/* شريط البحث */}
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="ابحث عن دولة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  dir="rtl"
                />
              </div>
              
              {/* قائمة الدول */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-right"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1 text-right">
                      <div className="text-sm font-medium text-gray-800">{country.nameAr}</div>
                      <div className="text-xs text-gray-500">{country.name}</div>
                    </div>
                    <span className="text-sm font-medium text-blue-600">{country.dialCode}</span>
                  </button>
                ))}
                
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    لا توجد دول مطابقة للبحث
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* إدخال رقم الهاتف */}
        <div className="flex-1 relative">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder={placeholder || "رقم الهاتف"}
            className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            dir="ltr"
          />
        </div>
      </div>

      {/* معاينة الرقم الكامل */}
      {value && (
        <div className="mt-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          <span className="font-medium">الرقم الكامل:</span> {value}
        </div>
      )}

      {/* نصائح */}
      <div className="mt-2 text-xs text-gray-500">
        💡 أدخل رقم الهاتف بدون رمز الدولة (سيتم إضافته تلقائياً)
      </div>
    </div>
  )
}

