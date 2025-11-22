'use client'

export default function FlyingLantern() {
  return (
    <>
      <style jsx>{`
        @keyframes float1 {
          0% {
            left: -10%;
            top: 10%;
            transform: translateY(0px);
          }
          100% {
            left: 110%;
            top: 10%;
            transform: translateY(0px);
          }
        }

        @keyframes float2 {
          0% {
            left: -12%;
            top: 25%;
            transform: translateY(0px);
          }
          100% {
            left: 112%;
            top: 25%;
            transform: translateY(0px);
          }
        }

        @keyframes float3 {
          0% {
            left: -14%;
            top: 40%;
            transform: translateY(0px);
          }
          100% {
            left: 114%;
            top: 40%;
            transform: translateY(0px);
          }
        }

        @keyframes swing {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }

        @keyframes glow {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(255, 200, 50, 0.6)) 
                    drop-shadow(0 0 15px rgba(255, 150, 0, 0.4));
          }
          50% { 
            filter: drop-shadow(0 0 12px rgba(255, 200, 50, 0.8)) 
                    drop-shadow(0 0 20px rgba(255, 150, 0, 0.5));
          }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }

        .lantern1 { animation: float1 50s linear infinite; }
        .lantern2 { animation: float2 60s linear infinite 10s; }
        .lantern3 { animation: float3 55s linear infinite 20s; }
        
        .swing { animation: swing 2s ease-in-out infinite; }
        .glow-effect { animation: glow 2s ease-in-out infinite; }

        @media (max-width: 768px) {
          /* تصغير الفوانيس على الموبايل */
          .lantern1, .lantern2, .lantern3 {
            transform: scale(0.5);
          }
          
          .lantern1 {
            top: 8% !important;
          }
          
          .lantern2 {
            top: 20% !important;
          }
          
          .lantern3 {
            top: 32% !important;
          }
          
          /* إظهار النصوص تحت الفوانيس بحجم مناسب */
          .lantern1 .text-xs,
          .lantern2 .text-xs,
          .lantern3 .text-xs {
            font-size: 0.5rem !important;
          }
        }
      `}</style>

      {/* فانوس 1 - ذهبي */}
      <div className="lantern1 fixed z-50 pointer-events-none">
        <div className="swing relative">
          {/* حبل التعليق */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 w-0.5 h-8 bg-gradient-to-b from-amber-800 to-amber-700"></div>
          
          <div className="glow-effect relative">
            {/* القمة */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-3 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-full border border-amber-900"></div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-full"></div>

            {/* الجسم */}
            <div className="relative w-12 h-16">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 rounded-2xl border-2 border-amber-900 shadow-xl overflow-hidden">
                <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-400 rounded-xl opacity-90" style={{ animation: 'flicker 2s ease-in-out infinite' }}></div>
                <div className="absolute inset-2 bg-gradient-to-br from-yellow-100 via-yellow-200 to-transparent rounded-lg animate-pulse"></div>
                
                {/* الزخارف */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-amber-900 rounded-full"></div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-amber-900 rounded-full"></div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-amber-900 rounded-full"></div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-amber-900 rounded-full"></div>
                
                {/* الهلال */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm opacity-70">🌙</div>
              </div>
            </div>

            {/* القاعدة */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-gradient-to-t from-amber-800 to-amber-700 rounded-b-full border border-amber-900"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs" style={{ animation: 'flicker 1.5s ease-in-out infinite' }}>🔥</div>
          </div>

          {/* النجوم */}
          <div className="absolute top-0 -left-4 text-yellow-400 text-xs animate-ping" style={{ animationDuration: '1.5s' }}>✨</div>
          <div className="absolute top-2 -right-4 text-amber-300 text-xs animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>⭐</div>

          {/* النص */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-400 rounded-lg px-3 py-1.5 shadow-lg">
              <div className="text-xs font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-1">
                <span>🌙</span>
                <span>رمضان يجمعنا</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فانوس 2 - أحمر */}
      <div className="lantern2 fixed z-50 pointer-events-none">
        <div className="swing relative" style={{ animationDelay: '0.7s' }}>
          <div className="absolute left-1/2 -translate-x-1/2 -top-7 w-0.5 h-7 bg-gradient-to-b from-red-800 to-red-700"></div>
          
          <div className="glow-effect relative" style={{ animationDelay: '0.8s' }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-gradient-to-b from-red-600 to-red-700 rounded-t-full border border-red-900"></div>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-b from-pink-400 to-red-500 rounded-full"></div>

            <div className="relative w-10 h-14">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-xl border-2 border-red-900 shadow-xl overflow-hidden">
                <div className="absolute inset-1 bg-gradient-to-br from-pink-200 via-red-300 to-red-400 rounded-lg opacity-90" style={{ animation: 'flicker 2.2s ease-in-out infinite' }}></div>
                <div className="absolute inset-1.5 bg-gradient-to-br from-pink-100 via-pink-200 to-transparent rounded-lg animate-pulse"></div>
                
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-900 rounded-full"></div>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-900 rounded-full"></div>
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-red-900 rounded-full"></div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-red-900 rounded-full"></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs opacity-70">⭐</div>
              </div>
            </div>

            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-gradient-to-t from-red-800 to-red-700 rounded-b-full border border-red-900"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs" style={{ animation: 'flicker 1.7s ease-in-out infinite' }}>🔥</div>
          </div>

          <div className="absolute top-1 -left-3 text-red-400 text-xs animate-ping" style={{ animationDuration: '1.7s' }}>⭐</div>
          <div className="absolute top-3 -right-3 text-pink-300 text-xs animate-ping" style={{ animationDuration: '2.1s', animationDelay: '0.4s' }}>✨</div>

          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-300 rounded-lg px-3 py-1 shadow-lg">
              <div className="text-xs font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-1">
                <span>🌙</span>
                <span>كل عام وأنتم بخير</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فانوس 3 - أخضر */}
      <div className="lantern3 fixed z-50 pointer-events-none">
        <div className="swing relative" style={{ animationDelay: '1.3s' }}>
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-0.5 h-6 bg-gradient-to-b from-emerald-800 to-emerald-700"></div>
          
          <div className="glow-effect relative" style={{ animationDelay: '1.5s' }}>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-2 bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-t-full border border-emerald-900"></div>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"></div>

            <div className="relative w-9 h-12">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-xl border-2 border-emerald-900 shadow-xl overflow-hidden">
                <div className="absolute inset-1 bg-gradient-to-br from-green-200 via-emerald-300 to-green-400 rounded-lg opacity-90" style={{ animation: 'flicker 2.4s ease-in-out infinite' }}></div>
                <div className="absolute inset-1.5 bg-gradient-to-br from-green-100 via-emerald-200 to-transparent rounded-lg animate-pulse"></div>
                
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-900 rounded-full"></div>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-900 rounded-full"></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs opacity-70">✨</div>
              </div>
            </div>

            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-2 bg-gradient-to-t from-emerald-800 to-emerald-700 rounded-b-full border border-emerald-900"></div>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-xs" style={{ animation: 'flicker 1.9s ease-in-out infinite' }}>🔥</div>
          </div>

          <div className="absolute top-0.5 -left-3 text-green-400 text-xs animate-ping" style={{ animationDuration: '1.6s' }}>✨</div>
          <div className="absolute top-2 -right-3 text-emerald-300 text-xs animate-ping" style={{ animationDuration: '2.3s', animationDelay: '0.5s' }}>⭐</div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-md px-2.5 py-1 shadow-md">
              <div className="text-xs font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-1">
                <span>رمضان كريم</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
