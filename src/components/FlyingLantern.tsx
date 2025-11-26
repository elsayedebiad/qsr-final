'use client'

export default function FlyingLantern() {
  return (
    <>
      <style jsx>{`
        @keyframes float1 {
          0% {
            left: -15%;
            top: 8%;
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
          100% {
            left: 115%;
            top: 8%;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes float2 {
          0% {
            left: -18%;
            top: 30%;
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.08);
          }
          100% {
            left: 118%;
            top: 30%;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes float3 {
          0% {
            left: -20%;
            top: 50%;
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-25px) scale(1.12);
          }
          100% {
            left: 120%;
            top: 50%;
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes swing {
          0%, 100% { 
            transform: rotate(-5deg);
          }
          50% { 
            transform: rotate(5deg);
          }
        }

        @keyframes glow {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(255, 200, 50, 0.7)) 
                    drop-shadow(0 0 15px rgba(255, 150, 0, 0.5));
          }
          50% { 
            filter: drop-shadow(0 0 12px rgba(255, 220, 80, 0.9)) 
                    drop-shadow(0 0 20px rgba(255, 180, 0, 0.6));
          }
        }

        @keyframes glowRed {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(255, 50, 80, 0.7)) 
                    drop-shadow(0 0 15px rgba(255, 0, 100, 0.5));
          }
          50% { 
            filter: drop-shadow(0 0 12px rgba(255, 80, 120, 0.9)) 
                    drop-shadow(0 0 20px rgba(255, 50, 120, 0.6));
          }
        }

        @keyframes glowGreen {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(50, 255, 150, 0.7)) 
                    drop-shadow(0 0 15px rgba(0, 255, 100, 0.5));
          }
          50% { 
            filter: drop-shadow(0 0 12px rgba(80, 255, 180, 0.9)) 
                    drop-shadow(0 0 20px rgba(50, 255, 150, 0.6));
          }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }

        @keyframes sparkle {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% { 
            transform: scale(1.3) rotate(180deg);
            opacity: 0.7;
          }
        }

        .lantern1 { 
          animation: float1 45s linear infinite; 
        }
        .lantern2 { 
          animation: float2 55s linear infinite 8s; 
        }
        .lantern3 { 
          animation: float3 50s linear infinite 16s; 
        }
        
        .swing { 
          animation: swing 3s ease-in-out infinite; 
        }
        .glow-effect { 
          animation: glow 3s ease-in-out infinite; 
        }
        .glow-red { 
          animation: glowRed 3.5s ease-in-out infinite; 
        }
        .glow-green { 
          animation: glowGreen 3.2s ease-in-out infinite; 
        }

        @media (max-width: 768px) {
          .lantern1, .lantern2, .lantern3 {
            transform: scale(0.6);
          }
          
          .lantern1 {
            top: 5% !important;
          }
          
          .lantern2 {
            top: 25% !important;
          }
          
          .lantern3 {
            top: 45% !important;
          }
        }

        @media (max-width: 480px) {
          .lantern1, .lantern2, .lantern3 {
            transform: scale(0.4);
          }
        }
      `}</style>

      {/* فانوس 1 - ذهبي */}
      <div className="lantern1 fixed z-50 pointer-events-none">
        <div className="swing relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-0.5 h-6 bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 rounded-full shadow-md"></div>

          <div className="glow-effect relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 rounded-t-full border border-amber-900 shadow-md"></div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gradient-to-b from-yellow-300 via-yellow-400 to-amber-500 rounded-full shadow-sm animate-pulse"></div>

            <div className="relative w-10 h-14">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 rounded-2xl border-2 border-amber-900 shadow-xl overflow-hidden">
                <div className="absolute inset-1 bg-gradient-to-br from-yellow-100 via-yellow-300 to-orange-400 rounded-xl opacity-95" style={{ animation: 'flicker 2.5s ease-in-out infinite' }}></div>
                <div className="absolute inset-1.5 bg-gradient-to-br from-yellow-50 via-yellow-200 to-transparent rounded-lg animate-pulse"></div>

                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-900 rounded-full"></div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-900 rounded-full"></div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-900 rounded-full"></div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-900 rounded-full"></div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm opacity-80 drop-shadow-md">🌙</div>
              </div>
            </div>

            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-gradient-to-t from-amber-900 via-amber-800 to-amber-700 rounded-b-full border border-amber-900 shadow-md"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-sm" style={{ animation: 'flicker 2s ease-in-out infinite' }}>🔥</div>
          </div>

          <div className="absolute -top-1 -left-4 text-yellow-300 text-xs" style={{ animation: 'sparkle 2s ease-in-out infinite' }}>✨</div>
          <div className="absolute top-2 -right-4 text-amber-400 text-xs" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.5s' }}>⭐</div>

          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gradient-to-r from-amber-50 via-yellow-100 to-orange-50 border border-amber-400 rounded-lg px-2 py-1 shadow-lg backdrop-blur-sm">
              <div className="text-xs font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 bg-clip-text text-transparent flex items-center gap-1">
                <span className="text-sm">🌙</span>
                <span>رمضان يجمعنا</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فانوس 2 - أحمر */}
      <div className="lantern2 fixed z-50 pointer-events-none">
        <div className="swing relative" style={{ animationDelay: '1s' }}>
          <div className="absolute left-1/2 -translate-x-1/2 -top-5.5 w-0.5 h-5.5 bg-gradient-to-b from-red-900 via-red-800 to-red-700 rounded-full shadow-md"></div>

          <div className="glow-red relative" style={{ animationDelay: '1.2s' }}>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4.5 h-2 bg-gradient-to-b from-red-500 via-red-600 to-red-800 rounded-t-full border border-red-900 shadow-md"></div>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-b from-pink-300 via-pink-400 to-red-500 rounded-full shadow-sm animate-pulse"></div>

            <div className="relative w-9 h-13">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-2xl border-2 border-red-900 shadow-xl overflow-hidden">
                <div className="absolute inset-1 bg-gradient-to-br from-pink-100 via-pink-300 to-red-400 rounded-xl opacity-95" style={{ animation: 'flicker 2.8s ease-in-out infinite' }}></div>
                <div className="absolute inset-1.5 bg-gradient-to-br from-pink-50 via-pink-200 to-transparent rounded-lg animate-pulse"></div>

                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5.5 h-0.5 bg-red-900 rounded-full"></div>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5.5 h-0.5 bg-red-900 rounded-full"></div>
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-0.5 h-5.5 bg-red-900 rounded-full"></div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-0.5 h-5.5 bg-red-900 rounded-full"></div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm opacity-80 drop-shadow-md">⭐</div>
              </div>
            </div>

            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-2 bg-gradient-to-t from-red-900 via-red-800 to-red-700 rounded-b-full border border-red-900 shadow-md"></div>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-sm" style={{ animation: 'flicker 2.3s ease-in-out infinite' }}>🔥</div>
          </div>

          <div className="absolute -top-0.5 -left-3.5 text-pink-300 text-xs" style={{ animation: 'sparkle 2.2s ease-in-out infinite' }}>⭐</div>
          <div className="absolute top-2.5 -right-3.5 text-red-300 text-xs" style={{ animation: 'sparkle 2.6s ease-in-out infinite 0.6s' }}>✨</div>

          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gradient-to-r from-red-50 via-pink-100 to-rose-50 border border-red-400 rounded-lg px-2 py-1 shadow-lg backdrop-blur-sm">
              <div className="text-xs font-bold bg-gradient-to-r from-red-600 via-pink-600 to-red-800 bg-clip-text text-transparent flex items-center gap-1">
                <span className="text-sm">🌙</span>
                <span>كل عام وأنتم بخير</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فانوس 3 - أخضر */}
      <div className="lantern3 fixed z-50 pointer-events-none">
        <div className="swing relative" style={{ animationDelay: '2s' }}>
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 w-0.5 h-5 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-700 rounded-full shadow-md"></div>

          <div className="glow-green relative" style={{ animationDelay: '2.2s' }}>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-800 rounded-t-full border border-emerald-900 shadow-md"></div>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-b from-green-300 via-green-400 to-emerald-500 rounded-full shadow-sm animate-pulse"></div>

            <div className="relative w-8 h-12">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 rounded-2xl border-2 border-emerald-900 shadow-xl overflow-hidden">
                <div className="absolute inset-1 bg-gradient-to-br from-green-100 via-emerald-300 to-green-400 rounded-xl opacity-95" style={{ animation: 'flicker 3s ease-in-out infinite' }}></div>
                <div className="absolute inset-1.5 bg-gradient-to-br from-green-50 via-emerald-200 to-transparent rounded-lg animate-pulse"></div>

                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-900 rounded-full"></div>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-900 rounded-full"></div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs opacity-80 drop-shadow-md">✨</div>
              </div>
            </div>

            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-gradient-to-t from-emerald-900 via-emerald-800 to-emerald-700 rounded-b-full border border-emerald-900 shadow-md"></div>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-sm" style={{ animation: 'flicker 2.6s ease-in-out infinite' }}>🔥</div>
          </div>

          <div className="absolute top-0 -left-3 text-green-300 text-xs" style={{ animation: 'sparkle 2.4s ease-in-out infinite' }}>✨</div>
          <div className="absolute top-1.5 -right-3 text-emerald-400 text-xs" style={{ animation: 'sparkle 2.8s ease-in-out infinite 0.7s' }}>⭐</div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-gradient-to-r from-green-50 via-emerald-100 to-teal-50 border border-green-400 rounded-lg px-2 py-0.5 shadow-lg backdrop-blur-sm">
              <div className="text-xs font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 bg-clip-text text-transparent flex items-center gap-1">
                <span>رمضان كريم</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
