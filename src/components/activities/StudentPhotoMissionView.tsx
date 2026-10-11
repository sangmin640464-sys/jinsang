import React, { useState, useEffect } from 'react';
import {
  Camera, CheckCircle2, Clock, Upload, Image as ImageIcon, Sparkles, RefreshCw, X
} from 'lucide-react';
import {
  TripMission, MissionSubmission, getMissions, getMissionSubmissions, submitMissionPhoto, subscribeToUpdates
} from '../../utils/communicationService';

interface StudentPhotoMissionViewProps {
  currentUser: any;
  triggerToast: (msg: string) => void;
}

// 70% canvas compression (from sports-day system)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

export const StudentPhotoMissionView: React.FC<StudentPhotoMissionViewProps> = ({
  currentUser,
  triggerToast
}) => {
  const [missions, setMissions] = useState<TripMission[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [selectedMission, setSelectedMission] = useState<TripMission | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const mList = await getMissions();
      setMissions(mList);
      const sList = await getMissionSubmissions();
      setSubmissions(sList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToUpdates((type) => {
      if (type === 'activities' || type === 'gallery' || type === 'poll') {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      const compressed = await compressImage(file);
      setPreviewImage(compressed);
    } catch (err) {
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitMission = async () => {
    if (!selectedMission || !previewImage || uploading) return;

    setUploading(true);
    try {
      await submitMissionPhoto({
        missionId: selectedMission.id,
        userId: currentUser?.id,
        userName: currentUser?.name || '학생',
        userClass: currentUser?.class_no || 0,
        imageUrl: previewImage,
        comment: commentInput.trim(),
        status: 'approved'
      });

      triggerToast(`🎉 [${selectedMission.title}] 미션 사진이 성공적으로 제출되었습니다!`);
      setSelectedMission(null);
      setPreviewImage(null);
      setCommentInput('');
      loadData();
    } catch (e) {
      triggerToast('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // Check if current student has completed a specific mission
  const isMissionCompleted = (missionId: string) => {
    return submissions.some(
      (s) => s.missionId === missionId && String(s.userId) === String(currentUser?.id)
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-500" />
        <span className="text-xs">미션 목록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-soft">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-xs">
            <Camera className="w-6 h-6 text-pink-200" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200">
              Photo Mission Quest
            </span>
            <h2 className="text-xl sm:text-2xl font-black">수학여행 사진 인증 미션</h2>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
          친구들과 함께 미션을 수행하고 즉석에서 카메라로 찍어 인증하세요! 등록된 사진은 학급 사진첩과 학부모 안심 갤러리에 자동으로 공유됩니다.
        </p>
      </div>

      {/* Mission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {missions.map((m) => {
          const completed = isMissionCompleted(m.id);
          const mySub = submissions.find(
            (s) => s.missionId === m.id && String(s.userId) === String(currentUser?.id)
          );

          return (
            <div
              key={m.id}
              className={`rounded-3xl p-5 border transition-all space-y-4 ${
                completed
                  ? 'bg-emerald-50/60 border-emerald-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-indigo-300 shadow-soft'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        completed
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {completed ? '✓ 인증 완료' : '진행 가능'}
                    </span>
                    <span className="text-[11px] font-black text-amber-600 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{m.points}점</span>
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 mt-1">
                    {m.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {m.description}
              </p>

              {completed && mySub ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-emerald-200">
                    <img
                      src={mySub.imageUrl}
                      alt="인증사진"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      완료됨
                    </div>
                  </div>
                  {mySub.comment && (
                    <p className="text-[11px] text-slate-500 italic">
                      "{mySub.comment}"
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedMission(m);
                    setPreviewImage(null);
                    setCommentInput('');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>사진 촬영 및 인증하기</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black text-indigo-600">미션 인증</span>
                <h3 className="font-black text-base text-slate-900">
                  {selectedMission.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMission(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {selectedMission.description}
            </p>

            {/* Photo preview or input */}
            <div className="space-y-3">
              {previewImage ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-200 bg-slate-100">
                  <img
                    src={previewImage}
                    alt="미리보기"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white p-1 rounded-full text-xs"
                    title="다시 선택"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-indigo-50/40">
                  <Camera className="w-8 h-8 text-indigo-500 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    카메라로 촬영하거나 사진 선택
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    (자동 70% 최적화 압축 업로드)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="한 줄 소감 남기기 (선택)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedMission(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                취소
              </button>
              <button
                disabled={!previewImage || uploading}
                onClick={handleSubmitMission}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? '업로드중...' : '인증 완료 제출'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
