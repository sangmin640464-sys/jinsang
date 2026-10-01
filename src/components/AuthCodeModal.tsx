// @ts-nocheck
import React, { useState } from 'react';
import { KeyRound, Check, X, ShieldAlert, Eye, EyeOff, RotateCcw, Copy } from 'lucide-react';

interface AuthCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onSaveCode: (newCode: string) => void;
  onResetCode: () => void;
}

export const AuthCodeModal: React.FC<AuthCodeModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  onSaveCode,
  onResetCode,
}) => {
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = newCode.trim();
    if (!trimmed) {
      setErrorMsg('새로운 인증코드를 입력해주세요.');
      return;
    }
    if (trimmed.length < 4) {
      setErrorMsg('인증코드는 최소 4자리 이상이어야 합니다.');
      return;
    }
    if (trimmed !== confirmCode.trim()) {
      setErrorMsg('인증코드 확인이 일치하지 않습니다.');
      return;
    }

    onSaveCode(trimmed);
    setNewCode('');
    setConfirmCode('');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-base">교사 인증코드 관리</h3>
              <p className="text-[11px] text-amber-200">교감 · 학년부장(총괄) 전용 권한</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Code Info Card */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-amber-900">
              <span>현재 설정된 교사 인증코드</span>
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="text-[11px] text-blue-600 flex items-center space-x-1 hover:underline"
              >
                {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showCode ? '숨기기' : '코드 보기'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-amber-300">
              <span className="font-mono text-lg font-black tracking-widest text-slate-800">
                {showCode ? currentCode : '••••••••'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사됨' : '복사'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              교사 로그인 시 모든 인솔 교사(교감, 학년부장, 1~6반 담임)가 입력해야 하는 비밀번호입니다.
            </p>
          </div>

          {/* Change Code Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                새 인증코드 입력 (최소 4자리)
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="예: 2026 또는 원하는 코드"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-blue-500 font-mono tracking-wider"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                새 인증코드 재확인
              </label>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="새 인증코드를 다시 입력하세요"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-blue-500 font-mono tracking-wider"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-500 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm('인증코드를 초기 기본값(2026)으로 재설정하시겠습니까?')) {
                    onResetCode();
                    onClose();
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 p-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>기본값(2026) 복원</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-badge"
                >
                  인증코드 변경 저장
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
