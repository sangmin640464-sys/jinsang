import React, { useState } from 'react';
import { X, Check, Smartphone, Sparkles, Download, CheckCircle2 } from 'lucide-react';

export interface IconOption {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  themeColor: string;
  svgContent: (size?: number) => React.ReactNode;
}

export const APP_ICONS: IconOption[] = [
  {
    id: 'compass',
    name: '1. 스마트 나침반 & 핀 (Smart Compass & Pin)',
    subtitle: '모던 & 학교 공식 신뢰감 (추천 1순위)',
    badge: '추천 1위',
    description: '로열블루 그라데이션 바탕에 황금빛 나침반 바늘과 정밀한 화이트 위치 핀, 진장중(JJ) 이니셜이 조화된 세련된 공식 가이드 아이콘',
    themeColor: '#2563eb',
    svgContent: (size = 96) => (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-3xl shadow-lg">
        <defs>
          <linearGradient id="bg_compass" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e3a8a" />
            <stop offset="0.5" stopColor="#2563eb" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="gold_needle" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
          <filter id="shadow_compass" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* Rounded Squircle Background */}
        <rect width="120" height="120" rx="28" fill="url(#bg_compass)" />
        {/* Subtle grid concentric rings */}
        <circle cx="60" cy="60" r="44" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="60" cy="60" r="32" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        
        {/* Compass Cardinal ticks */}
        <line x1="60" y1="20" x2="60" y2="26" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
        <line x1="60" y1="94" x2="60" y2="100" stroke="white" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="60" x2="26" y2="60" stroke="white" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="94" y1="60" x2="100" y2="60" stroke="white" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />

        {/* 3D Pin & Compass Needle Symbol */}
        <g filter="url(#shadow_compass)">
          {/* Main Pin Shape */}
          <path
            d="M60 28C48.954 28 40 36.954 40 48C40 63 60 88 60 88C60 88 80 63 80 48C80 36.954 71.046 28 60 28Z"
            fill="white"
          />
          {/* Inner Compass Center */}
          <circle cx="60" cy="48" r="14" fill="#0f172a" />
          {/* North Golden Needle */}
          <polygon points="60,37 64,48 60,46" fill="url(#gold_needle)" />
          <polygon points="60,37 56,48 60,46" fill="#fef08a" />
          {/* South Silver Needle */}
          <polygon points="60,59 64,48 60,50" fill="#94a3b8" />
          <polygon points="60,59 56,48 60,50" fill="#cbd5e1" />
          {/* Center Pivot Point */}
          <circle cx="60" cy="48" r="2.5" fill="#f8fafc" />
        </g>

        {/* JJ School Badge */}
        <rect x="44" y="93" width="32" height="15" rx="7.5" fill="#0f172a" fillOpacity="0.6" />
        <text x="60" y="104" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="900" letterSpacing="1" fontFamily="sans-serif">
          JINJANG
        </text>
      </svg>
    ),
  },
  {
    id: 'bus',
    name: '2. 설레는 노란 버스 (Yellow Field Trip Bus)',
    subtitle: '친근하고 활기찬 수학여행 감성',
    badge: '인기 콘셉트',
    description: '청명한 하늘색 바탕에 귀여운 3D 옐로우 관광버스와 출발 깃발, 탑승 체크인을 상징하는 생동감 넘치는 아이콘',
    themeColor: '#eab308',
    svgContent: (size = 96) => (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-3xl shadow-lg">
        <defs>
          <linearGradient id="bg_bus" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="0.6" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="bus_body" x1="20" y1="35" x2="100" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.4" stopColor="#facc15" />
            <stop offset="1" stopColor="#eab308" />
          </linearGradient>
          <filter id="shadow_bus" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity="0.2" />
          </filter>
        </defs>
        {/* Rounded Squircle Background */}
        <rect width="120" height="120" rx="28" fill="url(#bg_bus)" />
        {/* Clouds / Sparkles */}
        <circle cx="28" cy="28" r="8" fill="white" fillOpacity="0.3" />
        <circle cx="95" cy="32" r="11" fill="white" fillOpacity="0.25" />

        {/* 3D Yellow Tour Bus */}
        <g filter="url(#shadow_bus)">
          {/* Bus Main Chassis */}
          <rect x="24" y="42" width="72" height="42" rx="12" fill="url(#bus_body)" stroke="#ca8a04" strokeWidth="1.5" />
          {/* Windshield & Windows */}
          <path d="M30 48 H52 V60 H30 C28 60 26 58 26 56 V52 C26 50 28 48 30 48Z" fill="#0f172a" />
          <rect x="56" y="48" width="16" height="12" rx="2" fill="#0f172a" />
          <path d="M76 48 H90 C92 48 94 50 94 52 V56 C94 58 92 60 90 60 H76 V48Z" fill="#0f172a" />
          {/* Window Glass Glare */}
          <line x1="33" y1="49" x2="40" y2="59" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
          <line x1="59" y1="49" x2="66" y2="59" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
          <line x1="79" y1="49" x2="86" y2="59" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
          {/* Grille / Headlights */}
          <circle cx="32" cy="72" r="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="88" cy="72" r="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="44" y="70" width="32" height="5" rx="2.5" fill="#713f12" fillOpacity="0.3" />
          {/* Wheels */}
          <rect x="34" y="80" width="14" height="10" rx="3" fill="#1e293b" />
          <rect x="72" y="80" width="14" height="10" rx="3" fill="#1e293b" />
          <circle cx="41" cy="85" r="2.5" fill="#94a3b8" />
          <circle cx="79" cy="85" r="2.5" fill="#94a3b8" />
        </g>

        {/* Departure Flag */}
        <path d="M72 26 L88 32 L72 38 Z" fill="#ef4444" />
        <line x1="72" y1="26" x2="72" y2="44" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

        {/* Text Ribbon */}
        <text x="60" y="105" textAnchor="middle" fill="#0369a1" fontSize="10" fontWeight="900" letterSpacing="0.5" fontFamily="sans-serif">
          진장 수학여행
        </text>
      </svg>
    ),
  },
  {
    id: 'camera',
    name: '3. 추억의 카메라 & 랜드마크 (Memories & Castle)',
    subtitle: '사진 미션과 롯데월드 테마파크 감성',
    badge: '미션 & 감성',
    description: '트렌디한 퍼플~코랄 선셋 그라데이션 바탕에 카메라 렌즈와 롯데월드 매직아일랜드 캐슬 실루엣이 담긴 추억 소장용 아이콘',
    themeColor: '#8b5cf6',
    svgContent: (size = 96) => (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-3xl shadow-lg">
        <defs>
          <linearGradient id="bg_camera" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4c1d95" />
            <stop offset="0.5" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#db2777" />
          </linearGradient>
          <linearGradient id="lens_reflect" x1="35" y1="35" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
          <filter id="shadow_camera" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Rounded Squircle Background */}
        <rect width="120" height="120" rx="28" fill="url(#bg_camera)" />

        {/* Night Stars / Fireworks */}
        <circle cx="25" cy="30" r="1.5" fill="#fde047" />
        <circle cx="95" cy="26" r="2" fill="#fde047" />
        <circle cx="85" cy="40" r="1" fill="#ffffff" />
        <polygon points="32,22 34,26 38,28 34,30 32,34 30,30 26,28 30,26" fill="#fef08a" opacity="0.8" />

        {/* Camera Body */}
        <g filter="url(#shadow_camera)">
          <path
            d="M32 44C32 40 35 37 39 37H46L50 33H70L74 37H81C85 37 88 40 88 44V78C88 82 85 85 81 85H39C35 85 32 82 32 78V44Z"
            fill="white"
          />
          {/* Flash light */}
          <circle cx="42" cy="45" r="3" fill="#f59e0b" />
          {/* Outer Lens Ring */}
          <circle cx="60" cy="61" r="21" fill="#1e1b4b" />
          <circle cx="60" cy="61" r="18" fill="url(#lens_reflect)" />

          {/* Castle Silhouette inside Lens (Theme park / Lotte World) */}
          <path
            d="M52 69 V61 L54 60 L56 61 V69 H58 V58 L60 55 L62 58 V69 H64 V61 L66 60 L68 61 V69 Z"
            fill="#ffffff"
          />
          {/* Sparkle on Lens */}
          <circle cx="67" cy="54" r="2.5" fill="#ffffff" opacity="0.9" />
        </g>

        {/* Bottom Banner */}
        <rect x="36" y="93" width="48" height="15" rx="7.5" fill="#ffffff" fillOpacity="0.2" />
        <text x="60" y="104" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" letterSpacing="0.8" fontFamily="sans-serif">
          진장 2026
        </text>
      </svg>
    ),
  },
];

interface AppIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIconId: string;
  onSelectIcon: (iconId: string) => void;
  triggerToast: (msg: string) => void;
}

export const AppIconModal: React.FC<AppIconModalProps> = ({
  isOpen,
  onClose,
  selectedIconId,
  onSelectIcon,
  triggerToast,
}) => {
  const [activePreviewId, setActivePreviewId] = useState<string>(selectedIconId || 'compass');

  if (!isOpen) return null;

  const currentIcon = APP_ICONS.find((i) => i.id === activePreviewId) || APP_ICONS[0];

  const handleApply = (id: string) => {
    onSelectIcon(id);
    triggerToast(`[${currentIcon.name}] 아이콘이 성공적으로 적용되었습니다!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 border border-slate-200 shadow-2xl space-y-6 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>앱 아이콘 디자인 선택 & 미리보기</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              어떤 앱 아이콘으로 적용할까요?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              진장중학교 2학년 수학여행 스마트 가이드의 성격에 맞게 기획된 3가지 디자인을 비교해 보세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smartphone Home Screen Simulation Preview */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 sm:p-6 rounded-3xl text-white shadow-inner flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="p-1 rounded-3xl ring-4 ring-white/20 bg-black/20">
              {currentIcon.svgContent(84)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-amber-950">
                  {currentIcon.badge}
                </span>
                <span className="text-xs text-slate-300 font-mono">홈 화면 추가 시</span>
              </div>
              <h4 className="font-black text-base sm:text-lg text-white">진장 수학여행</h4>
              <p className="text-xs text-indigo-200 line-clamp-2 max-w-xs">
                {currentIcon.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleApply(currentIcon.id)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>이 아이콘으로 즉시 적용</span>
          </button>
        </div>

        {/* 3 Icons Comparison Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            3가지 아이콘 디자인 비교 & 선택
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {APP_ICONS.map((opt) => {
              const isSelected = activePreviewId === opt.id;
              const isCurrentApplied = selectedIconId === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => setActivePreviewId(opt.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.badge}
                      </span>
                      {isCurrentApplied && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                          <Check className="w-3 h-3 mr-0.5" /> 현재 적용됨
                        </span>
                      )}
                    </div>

                    <div className="flex justify-center py-2">
                      {opt.svgContent(76)}
                    </div>

                    <div className="text-center">
                      <h4 className="font-black text-xs text-slate-900 leading-snug">
                        {opt.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {opt.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(opt.id);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isCurrentApplied ? '현재 적용 중' : '선택하기'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span className="text-[11px] leading-relaxed">
            💡 아이콘을 선택하시면 브라우저 탭 파비콘(Favicon)과 모바일 바로가기 아이콘에 즉시 반영됩니다.
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
