import React, { useState, useEffect } from 'react';
import {
  HelpCircle, CheckCircle2, Clock, Trophy, Send, AlertCircle, Sparkles, RefreshCw
} from 'lucide-react';
import {
  Quiz, QuizSubmission, getQuizzes, getQuizSubmissions, submitQuizAnswer, subscribeToUpdates
} from '../../utils/communicationService';

interface StudentQuizViewProps {
  currentUser: any;
  triggerToast: (msg: string) => void;
}

export const StudentQuizView: React.FC<StudentQuizViewProps> = ({ currentUser, triggerToast }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const qList = await getQuizzes();
      setQuizzes(qList);
      const sList = await getQuizSubmissions();
      setSubmissions(sList);
      setSelectedQuizId((prevId) => {
        if (prevId && qList.some((q: Quiz) => q.id === prevId)) {
          return prevId;
        }
        const active = qList.find((q: Quiz) => q.status === 'active');
        return active ? active.id : (qList.length > 0 ? qList[0].id : '');
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToUpdates((type: string) => {
      if (type === 'activities' || type === 'poll') {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const currentQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];
  const mySub = currentQuiz
    ? submissions.find((s) => s.quizId === currentQuiz.id && String(s.userId) === String(currentUser?.id))
    : null;

  const correctSubs = currentQuiz
    ? submissions
        .filter((s) => s.quizId === currentQuiz.id && s.isCorrect)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuiz || !answerInput.trim() || submitting || mySub) return;

    setSubmitting(true);
    try {
      const cleanAnswer = answerInput.trim().replace(/\s+/g, '').toLowerCase();
      const correctAnswer = currentQuiz.answer.trim().replace(/\s+/g, '').toLowerCase();
      const isCorrect = cleanAnswer === correctAnswer;

      await submitQuizAnswer({
        quizId: currentQuiz.id,
        userId: currentUser?.id,
        userName: currentUser?.name || '학생',
        userClass: currentUser?.class_no || 0,
        answer: answerInput.trim(),
        isCorrect
      });

      if (isCorrect) {
        triggerToast('🎉 정답입니다! 축하합니다!');
      } else {
        triggerToast('아쉽습니다! 오답입니다.');
      }
      setAnswerInput('');
      loadData();
    } catch (e) {
      triggerToast('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-amber-500" />
        <span className="text-xs">퀴즈 데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-soft">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-xs">
            <HelpCircle className="w-6 h-6 text-yellow-200" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
              Surprise Live Quiz
            </span>
            <h2 className="text-xl sm:text-2xl font-black">수학여행 실시간 돌발 퀴즈</h2>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-amber-50 max-w-xl leading-relaxed">
          선생님이 이동 중이나 자유시간에 깜짝 출제하는 돌발 퀴즈입니다! 정답을 가장 빠르게 맞히는 학생은 선착순 명예의 전당에 등록됩니다.
        </p>
      </div>

      {/* Quiz Selector Pills */}
      {quizzes.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {quizzes.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setSelectedQuizId(q.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedQuizId === q.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Q{idx + 1}. {q.question.slice(0, 15)}...
              {q.status === 'active' && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] animate-pulse">
                  진행중
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {currentQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Quiz Box */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-5">
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                  currentQuiz.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {currentQuiz.status === 'active' ? '● 실시간 퀴즈 진행중' : '마감된 퀴즈'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                출제: {currentQuiz.author}
              </span>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentQuiz.question}
              </h3>
              {currentQuiz.hint && (
                <div className="mt-3 flex items-center space-x-1.5 text-xs text-amber-800 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>힌트: {currentQuiz.hint}</span>
                </div>
              )}
            </div>

            {/* Answer submission state */}
            {mySub ? (
              <div
                className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                  mySub.isCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {mySub.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-black text-sm">
                    {mySub.isCorrect ? '정답을 맞히셨습니다!' : '아쉽지만 오답입니다!'}
                  </h4>
                  <p className="text-xs mt-1">
                    제출한 답안: <b>{mySub.answer}</b> {mySub.isCorrect && `(정답: ${currentQuiz.answer})`}
                  </p>
                </div>
              </div>
            ) : currentQuiz.status === 'active' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  정답 입력 (띄어쓰기 무관)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="정답을 정확히 입력하세요..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-hidden focus:border-amber-500 font-bold"
                  />
                  <button
                    type="submit"
                    disabled={!answerInput.trim() || submitting}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? '제출중...' : '정답 제출'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                마감된 퀴즈입니다. 정답은 <b>{currentQuiz.answer}</b> 입니다.
              </div>
            )}
          </div>

          {/* Leaderboard / Correct Answerers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>선착순 정답자 ({correctSubs.length}명)</span>
              </h4>
            </div>

            {correctSubs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                아직 정답자가 없습니다.<br />가장 먼저 정답을 맞혀보세요!
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                {correctSubs.map((sub, index) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                          index === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : index === 1
                            ? 'bg-slate-300 text-slate-800'
                            : index === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-black text-slate-800">{sub.userName}</span>
                      <span className="text-[10px] text-slate-400">({sub.userClass}반)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(sub.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-sm">
          현재 등록된 퀴즈가 없습니다.
        </div>
      )}
    </div>
  );
};
