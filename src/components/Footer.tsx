import React from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Globe, Heart, Shield, Award, Users } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="relative w-full overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Main Footer Content */}
      <div className="relative">
        {/* Top Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">الاسناد السريع للاستقدام</h3>
                  <p className="text-blue-200 text-sm">خبراء الاستقدام في المملكة</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-bold">+5 سنوات خبرة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  <span className="text-white font-bold">+10,000 عميل</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <img 
                    src="/logo-2.png" 
                    alt="الاسناد السريع" 
                    className="h-14 w-auto object-contain bg-white rounded-xl p-2 shadow-lg"
                  />
                  <div>
                    <h4 className="text-white font-bold text-lg">الاسناد السريع</h4>
                    <p className="text-blue-300 text-sm">للاستقدام</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  نحن شركة رائدة في مجال الاستقدام، نوفر لك أفضل العمالة المنزلية المدربة من جميع أنحاء العالم.
                </p>
                <div className="flex items-center gap-3 pt-4">
                  <a href="#" className="group p-2 bg-white/10 hover:bg-blue-500 rounded-lg transition-all">
                    <Facebook className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                  <a href="#" className="group p-2 bg-white/10 hover:bg-blue-400 rounded-lg transition-all">
                    <Twitter className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                  <a href="#" className="group p-2 bg-white/10 hover:bg-pink-500 rounded-lg transition-all">
                    <Instagram className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                  <a href="https://qsr.sa" className="group p-2 bg-white/10 hover:bg-green-500 rounded-lg transition-all">
                    <Globe className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  روابط سريعة
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-gray-300 hover:text-white hover:pr-2 transition-all flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                      الرئيسية
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-gray-300 hover:text-white hover:pr-2 transition-all flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                      من نحن
                    </Link>
                  </li>
                  <li>
                    <Link href="/services" className="text-gray-300 hover:text-white hover:pr-2 transition-all flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                      خدماتنا
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-300 hover:text-white hover:pr-2 transition-all flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                      تواصل معنا
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
                  خدماتنا
                </h4>
                <ul className="space-y-3">
                  <li className="text-gray-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                    استقدام عاملات منزليات
                  </li>
                  <li className="text-gray-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                    استقدام سائقين خاصين
                  </li>
                  <li className="text-gray-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                    نقل خدمات
                  </li>
                  <li className="text-gray-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                    ضمان ما بعد التعاقد
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  تواصل معنا
                </h4>
                <ul className="space-y-4">
                  <li>
                    <a href="tel:+966500000000" className="group text-gray-300 hover:text-white transition-all flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg group-hover:bg-green-500/20">
                        <Phone className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">اتصل بنا</p>
                        <p className="text-sm" dir="ltr">+966 50 000 0000</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a href="mailto:info@qsr.sa" className="group text-gray-300 hover:text-white transition-all flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-500/20">
                        <Mail className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">البريد الإلكتروني</p>
                        <p className="text-sm" dir="ltr">info@qsr.sa</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <div className="group text-gray-300 flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <MapPin className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">العنوان</p>
                        <p className="text-sm">الرياض، المملكة العربية السعودية</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="group text-gray-300 flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">ساعات العمل</p>
                        <p className="text-sm">السبت - الخميس: 9ص - 9م</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bg-black/50 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>© {currentYear} الاسناد السريع للاستقدام - جميع الحقوق محفوظة</span>
              </div>
              <div className="flex items-center gap-6 text-gray-400 text-sm">
                <Link href="/privacy" className="hover:text-white transition-colors">
                  سياسة الخصوصية
                </Link>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <Link href="/terms" className="hover:text-white transition-colors">
                  الشروط والأحكام
                </Link>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <div className="flex items-center gap-1">
                  <span>صنع بـ</span>
                  <Heart className="h-4 w-4 text-red-500 animate-pulse" />
                  <span>في السعودية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
