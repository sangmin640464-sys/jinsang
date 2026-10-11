import React, { useEffect, useState } from 'react';
import { HelpCircle, Camera, X, ArrowRight, Bell, Sparkles, Volume2 } from 'lucide-react';
import { alertSoundPlayer } from '../../utils/alertEffects';

export interface ActivityAlertData {
  type: 'quiz' | 'mission';
  id: string;
  title: string;
  description?: string;
  points?: number;
  classNo?: number;
  author?: string;
}

interface ActivityAlertModalProps {
  alert: ActivityAlertData | null;
  onClose: () => void;
  onNavigate: (tab: 'quiz' | 'photo_mission') => void;
}

export const ActivityAlertModal: React.FC<ActivityAlertModalProps> = ({
  alert,
  onClose,
  onNavigate
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      // Play exciting alert sound and trigger mobile vibration
      alertSoundPlayer.playMissionAlert();
      alertSoundPlayer.triggerVibrate();
    } else {
      setVisible(false);
    }
  }, [alert]);

  if (!alert || !visible) return null;

  const isQuiz = alert.type === 'quiz';

  const handleAction = () => {
    setVisible(false);
    onClose();
    onNavigate(isQuiz ? 'quiz' : 'photo_mission');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-amber-400 overflow-hidden transform transition-all animate-bounce-subtle"
        style={{
          boxShadow: isQuiz
            ? '0 20px 50px -10px rgba(245, 158, 11, 0.4)'
            : '0 20px 50px -10px rgba(236, 72, 153, 0.4)'
        }}
      >
        {/* Animated Top Bar */}
        <div
          className={`px-5 py-4 flex items-center justify-between text-white ${
            isQuiz
              ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500'
              : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
              {isQuiz ? <HelpCircle className="w-6 h-6 text-yellow-100" /> : <Camera className="w-6 h-6 text-pink-100" />}
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                  {isQuiz ? '⚡ 실시간 돌발 퀴즈 발령' : '📸 새로운 사진 미션 발령'}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {isQuiz ? '선착순 정답 타임어택!' : '미션 인증하고 스탬프 획득!'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold flex items-center gap-1 text-slate-600">
                <Bell className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                {alert.author || '진장중 수학여행 본부'}
              </span>
              {alert.points && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[11px]">
                  +{alert.points}점
                </span>
              )}
            </div>

            <h4 className="text-lg font-black text-slate-900 leading-snug">
              {alert.title}
            </h4>

            {alert.description && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {alert.description}
              </p>
            )}
          </div>

          {/* Sound & Vibrate notice pill */}
          <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold text-slate-400 bg-slate-100/70 py-1.5 rounded-xl">
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <span>실시간 알림음 및 스마트폰 진동이 작동 중입니다</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => {
                setVisible(false);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              나중에 볼래요
            </button>
            <button
              onClick={handleAction}
              className={`flex-2 py-3 px-4 rounded-xl font-black text-sm text-white flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95 ${
                isQuiz
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-amber-500/30'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-pink-500/30'
              }`}
            >
              <span>{isQuiz ? '지금 바로 정답 맞히기' : '사진 인증하러 가기'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
