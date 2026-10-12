import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Camera, Plus, CheckCircle2, Trophy, Clock, X, Trash2, Send, Eye, RefreshCw, Sparkles,
  MessageSquare, ExternalLink, Copy, Share2
} from 'lucide-react';
import {
  Quiz, QuizSubmission, TripMission, MissionSubmission,
  getQuizzes, createQuiz, updateQuizStatus, getQuizSubmissions,
  getMissions, createMission, getMissionSubmissions, subscribeToUpdates
} from '../../utils/communicationService';
import { alertSoundPlayer } from '../../utils/alertEffects';
import { OPEN_KAKAO_URL } from '../../data/mapImages';

interface TeacherActivityManagerViewProps {
  currentUser: any;
  triggerToast: (msg: string) => void;
}

export const TeacherActivityManagerView: React.FC<TeacherActivityManagerViewProps> = ({
  currentUser,
  triggerToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'quiz' | 'mission'>('quiz');

  // Quiz State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [newQuizQuestion, setNewQuizQuestion] = useState('');
  const [newQuizAnswer, setNewQuizAnswer] = useState('');
  const [newQuizHint, setNewQuizHint] = useState('');
  const [newQuizTarget, setNewQuizTarget] = useState<'all' | 'class'>('all');
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);

  // Mission State
  const [missions, setMissions] = useState<TripMission[]>([]);
  const [missionSubmissions, setMissionSubmissions] = useState<MissionSubmission[]>([]);
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionDesc, setNewMissionDesc] = useState('');
  const [newMissionPoints, setNewMissionPoints] = useState(100);
  const [showNewMissionModal, setShowNewMissionModal] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const qList = await getQuizzes();
      setQuizzes(qList);
      setSelectedQuizId((prevId) => {
        if (prevId && qList.some((q) => q.id === prevId)) {
          return prevId;
        }
        return qList.length > 0 ? qList[0].id : '';
      });
      const qSubs = await getQuizSubmissions();
      setQuizSubmissions(qSubs);

      const mList = await getMissions();
      setMissions(mList);
      const mSubs = await getMissionSubmissions();
      setMissionSubmissions(mSubs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const unsub = subscribeToUpdates((type) => {
      if (type === 'activities' || type === 'poll') {
        loadAll();
      }
    });
    return () => unsub();
  }, []);

  // Copy Kakao message & Open Kakao Talk room
  const handleShareToKakao = (type: 'quiz' | 'mission', title: string, hintOrDesc?: string, points?: number) => {
    const appUrl = 'https://jinjang.vercel.app';
    let text = '';
    if (type === 'quiz') {
      text = `[진장중 수학여행 ⚡ 돌발 퀴즈 발령!]\n\nQ: ${title}\n${hintOrDesc ? `💡 힌트: ${hintOrDesc}\n` : ''}\n👉 지금 앱에서 선착순 정답을 제출하세요!\n${appUrl}`;
    } else {
      text = `[진장중 수학여행 📸 새로운 사진 미션!]\n\n미션: ${title}\n내용: ${hintOrDesc || ''}\n⭐ 스탬프 배점: +${points || 100}점\n\n👉 지금 미션 사진을 찍어 앱에 인증하세요!\n${appUrl}`;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch (e) {}

    // Try Web Share API (native KakaoTalk picker on mobile)
    if (navigator.share) {
      navigator.share({
        title: type === 'quiz' ? '진장중 돌발 퀴즈 발령' : '진장중 사진 미션 발령',
        text: text,
        url: appUrl
      }).catch(() => {
        window.open(OPEN_KAKAO_URL, '_blank');
      });
    } else {
      window.open(OPEN_KAKAO_URL, '_blank');
    }
    triggerToast('💬 카톡 안내 문구가 복사되었으며 오픈채팅방으로 이동합니다.');
  };

  // Handle New Quiz
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizQuestion.trim() || !newQuizAnswer.trim()) {
      alert('퀴즈 문제와 정답을 입력하세요.');
      return;
    }

    const questionText = newQuizQuestion.trim();
    const hintText = newQuizHint.trim();

    try {
      await createQuiz({
        question: questionText,
        answer: newQuizAnswer.trim(),
        hint: hintText,
        status: 'active',
        targetAudience: newQuizTarget,
        classNo: newQuizTarget === 'all' ? 0 : (currentUser?.myClass || 0),
        author: `${currentUser?.name} 선생님`
      });

      triggerToast('🎉 돌발 퀴즈가 학생들에게 실시간 출제되었습니다!');
      setNewQuizQuestion('');
      setNewQuizAnswer('');
      setNewQuizHint('');
      setShowNewQuizModal(false);
      loadAll();

      // Offer instant Kakao Talk broadcast
      if (confirm('📢 [카카오톡 공지 알림]\n\n학생들 휴대폰이 꺼져 있어도 알 수 있도록,\n오픈 카카오톡방에 퀴즈 알림 문구를 바로 전송하시겠습니까?')) {
        handleShareToKakao('quiz', questionText, hintText);
      }
    } catch (e) {
      triggerToast('퀴즈 출제 중 오류가 발생했습니다.');
    }
  };

  // Handle New Mission
  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim() || !newMissionDesc.trim()) {
      alert('미션 제목과 내용을 입력하세요.');
      return;
    }

    const titleText = newMissionTitle.trim();
    const descText = newMissionDesc.trim();
    const pts = newMissionPoints;

    try {
      await createMission({
        title: titleText,
        description: descText,
        points: pts,
        status: 'active',
        classNo: 0,
        author: `${currentUser?.name} 선생님`
      });

      triggerToast('📸 새로운 사진 미션이 등록되었습니다!');
      setNewMissionTitle('');
      setNewMissionDesc('');
      setShowNewMissionModal(false);
      loadAll();

      // Offer instant Kakao Talk broadcast
      if (confirm('📢 [카카오톡 공지 알림]\n\n학생들 휴대폰이 꺼져 있어도 알 수 있도록,\n오픈 카카오톡방에 새 사진 미션 공지를 바로 전송하시겠습니까?')) {
        handleShareToKakao('mission', titleText, descText, pts);
      }
    } catch (e) {
      triggerToast('미션 등록 중 오류가 발생했습니다.');
    }
  };

  const currentQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];
  const currentQuizSubs = currentQuiz
    ? quizSubmissions.filter((s) => s.quizId === currentQuiz.id)
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 text-white shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-200">
            Activity Operation Control
          </span>
          <h2 className="text-xl sm:text-2xl font-black">
            돌발 퀴즈 & 사진 미션 인솔 관제
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
            수학여행 중 학생들의 흥미와 참여도를 높이기 위해 실시간 퀴즈를 출제하고, 학생들이 업로드한 미션 사진을 확인·관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              alertSoundPlayer.playMissionAlert();
              alertSoundPlayer.triggerVibrate();
              triggerToast('🔔 학생 스마트폰 알림음 및 진동 테스트를 실행했습니다.');
            }}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-3.5 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 backdrop-blur-xs transition-all shrink-0"
            title="학생 폰에 울릴 알림음과 진동을 미리 들어봅니다."
          >
            <span>🔔 알림음·진동 테스트</span>
          </button>

          {activeSubTab === 'quiz' ? (
            <button
              onClick={() => setShowNewQuizModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>새 돌발 퀴즈 출제</span>
            </button>
          ) : (
            <button
              onClick={() => setShowNewMissionModal(true)}
              className="bg-pink-400 hover:bg-pink-300 text-pink-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>새 사진 미션 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveSubTab('quiz')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 text-sm font-black transition-all ${
            activeSubTab === 'quiz'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>돌발 퀴즈 관리 ({quizzes.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('mission')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 text-sm font-black transition-all ${
            activeSubTab === 'mission'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>사진 미션 관리 & 인증 갤러리 ({missions.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: QUIZ MANAGEMENT */}
      {activeSubTab === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft space-y-3">
            <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>출제된 퀴즈 목록</span>
              <span className="text-xs text-slate-400 font-normal">{quizzes.length}건</span>
            </h3>

            <div className="space-y-2">
              {quizzes.map((q, idx) => {
                const subCount = quizSubmissions.filter((s) => s.quizId === q.id).length;
                const correctCount = quizSubmissions.filter((s) => s.quizId === q.id && s.isCorrect).length;

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuizId(q.id)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all space-y-1.5 ${
                      selectedQuizId === q.id
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        Q{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {q.status === 'active' ? '진행중' : '마감'}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-800 line-clamp-2">
                      {q.question}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>정답: {q.answer}</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        정답 {correctCount} / 응답 {subCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiz Details & Live Submissions */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-5">
            {currentQuiz ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      선택된 퀴즈 상세
                    </span>
                    <h3 className="font-black text-base text-slate-900 mt-1">
                      {currentQuiz.question}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleShareToKakao('quiz', currentQuiz.question, currentQuiz.hint)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition-all flex items-center space-x-1 shadow-xs"
                      title="카톡 오픈채팅방에 퀴즈 알림을 바로 공유합니다."
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>카톡방 알림 전송</span>
                    </button>

                    {currentQuiz.status === 'active' ? (
                      <button
                        onClick={async () => {
                          await updateQuizStatus(currentQuiz.id, 'closed');
                          triggerToast('퀴즈가 마감 처리되었습니다.');
                          loadAll();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                      >
                        퀴즈 마감하기
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await updateQuizStatus(currentQuiz.id, 'active');
                          triggerToast('퀴즈가 다시 활성화되었습니다.');
                          loadAll();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                      >
                        퀴즈 재개하기
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">설정 정답</span>
                    <span className="font-black text-slate-800">{currentQuiz.answer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">힌트</span>
                    <span className="font-bold text-slate-700">{currentQuiz.hint || '없음'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">출제자</span>
                    <span className="font-bold text-slate-700">{currentQuiz.author}</span>
                  </div>
                </div>

                {/* Submissions Table */}
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center justify-between">
                    <span>학생 실시간 응답 현황 ({currentQuizSubs.length}건)</span>
                    <span className="text-xs text-emerald-600 font-bold">
                      정답 {currentQuizSubs.filter((s) => s.isCorrect).length}명
                    </span>
                  </h4>

                  {currentQuizSubs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-2xl">
                      아직 제출된 학생 답안이 없습니다.
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto no-scrollbar border border-slate-100 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3">순번</th>
                            <th className="p-3">학급/학생</th>
                            <th className="p-3">제출 답안</th>
                            <th className="p-3">결과</th>
                            <th className="p-3">제출 시각</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentQuizSubs.map((sub, idx) => (
                            <tr key={sub.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-black text-slate-800">
                                {sub.userClass}반 {sub.userName}
                              </td>
                              <td className="p-3 font-mono font-bold">{sub.answer}</td>
                              <td className="p-3">
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    sub.isCorrect
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {sub.isCorrect ? '정답 (O)' : '오답 (X)'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 font-mono text-[11px]">
                                {new Date(sub.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                등록된 퀴즈가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: MISSION MANAGEMENT & GALLERY */}
      {activeSubTab === 'mission' && (
        <div className="space-y-6">
          {/* Mission list cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((m) => {
              const subs = missionSubmissions.filter((s) => s.missionId === m.id);
              return (
                <div key={m.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      인증 미션
                    </span>
                    <span className="text-xs font-black text-amber-600">
                      ★ {m.points}점
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {m.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>출제: {m.author}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShareToKakao('mission', m.title, m.description, m.points)}
                        className="px-2.5 py-1 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 text-[11px] font-black transition-colors flex items-center space-x-1"
                        title="카톡 오픈채팅방에 미션 알림을 바로 공유합니다."
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>카톡 공유</span>
                      </button>
                      <span className="font-bold text-indigo-600">제출 {subs.length}장</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submissions Photo Feed */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center justify-between">
              <span>학생 실시간 인증 사진 피드 ({missionSubmissions.length}장)</span>
              <span className="text-xs text-slate-400 font-normal">
                학부모 사진첩과 실시간 자동 연동
              </span>
            </h3>

            {missionSubmissions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl">
                아직 제출된 인증 사진이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {missionSubmissions.map((s) => {
                  const m = missions.find((item) => item.id === s.missionId);
                  return (
                    <div key={s.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 space-y-2 group">
                      <div className="relative aspect-square overflow-hidden bg-slate-200">
                        <img
                          src={s.imageUrl}
                          alt="인증샷"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {s.userClass}반 {s.userName}
                        </div>
                      </div>
                      <div className="p-2.5 space-y-1">
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          {m?.title || '미션'}
                        </p>
                        {s.comment && (
                          <p className="text-[10px] text-slate-500 italic truncate">
                            "{s.comment}"
                          </p>
                        )}
                        <p className="text-[9px] text-slate-400 font-mono">
                          {new Date(s.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Quiz */}
      {showNewQuizModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <span>새 실시간 돌발 퀴즈 출제</span>
              </h3>
              <button onClick={() => setShowNewQuizModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  퀴즈 문제 내용
                </label>
                <textarea
                  rows={3}
                  value={newQuizQuestion}
                  onChange={(e) => setNewQuizQuestion(e.target.value)}
                  placeholder="예: 2일차 롯데월드에서 우리가 탑승할 대표 롤러코스터의 이름은?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  정답 (띄어쓰기 무관하게 자동 채점됨)
                </label>
                <input
                  type="text"
                  value={newQuizAnswer}
                  onChange={(e) => setNewQuizAnswer(e.target.value)}
                  placeholder="예: 아틀란티스"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  힌트 (선택)
                </label>
                <input
                  type="text"
                  value={newQuizHint}
                  onChange={(e) => setNewQuizHint(e.target.value)}
                  placeholder="예: ㅇㅌㄹㅌㅅ (초성 힌트)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewQuizModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md"
                >
                  퀴즈 즉시 출제
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Mission */}
      {showNewMissionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <span>새 사진 미션 등록</span>
              </h3>
              <button onClick={() => setShowNewMissionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMission} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  미션 제목
                </label>
                <input
                  type="text"
                  value={newMissionTitle}
                  onChange={(e) => setNewMissionTitle(e.target.value)}
                  placeholder="예: 롯데월드 매직캐슬 야경 인증샷"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  미션 수행 가이드 및 설명
                </label>
                <textarea
                  rows={3}
                  value={newMissionDesc}
                  onChange={(e) => setNewMissionDesc(e.target.value)}
                  placeholder="예: 매직캐슬 불빛이 잘 보이도록 같은 조 친구들과 함께 포즈를 취해 촬영하세요."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  스탬프 배점 (점)
                </label>
                <input
                  type="number"
                  value={newMissionPoints}
                  onChange={(e) => setNewMissionPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-hidden focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMissionModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md"
                >
                  미션 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
