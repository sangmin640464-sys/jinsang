import React, { useState, useEffect, useRef } from 'react';
import { Camera, Megaphone, MessageSquareText, ShieldAlert, UsersRound, Send, Clock, CheckCircle2, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { 
  ClassNotice, 
  GalleryImage, 
  QaMessage,
  getNotices, 
  getGallery, 
  getQaMessages,
  sendQaMessage,
  subscribeToUpdates 
} from '../utils/communicationService';

export const ParentCommunicationView = ({ currentUser, triggerToast }: { currentUser: any; triggerToast: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'gallery' | 'qa'>('notices');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const studentClass = Number(currentUser.studentClass) || 4;
  const studentName = currentUser.studentName || '강승엽';
  const isClass4 = studentClass === 4;

  const [notices, setNotices] = useState<ClassNotice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // 1:1 QA Chat state
  const [qaMessages, setQaMessages] = useState<QaMessage[]>([]);
  const [qaInput, setQaInput] = useState('');
  const [isSendingQa, setIsSendingQa] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch notices
  const fetchNotices = async () => {
    try {
      const data = await getNotices(studentClass);
      setNotices(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch gallery
  const fetchGallery = async () => {
    try {
      const data = await getGallery(studentClass);
      setGalleryImages(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch QA Messages
  const fetchQa = async () => {
    try {
      const msgs = await getQaMessages(studentClass, studentName);
      setQaMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoadingNotices(true);
    setLoadingGallery(true);
    fetchNotices().finally(() => setLoadingNotices(false));
    fetchGallery().finally(() => setLoadingGallery(false));
    fetchQa();

    // Subscribe to broadcast & auto-poll every 4s for cross-device sync
    const unsubscribe = subscribeToUpdates((type) => {
      if (type === 'notices' || type === 'poll') fetchNotices();
      if (type === 'gallery' || type === 'poll') fetchGallery();
      if (type === 'qa' || type === 'poll') fetchQa();
    });

    return () => unsubscribe();
  }, [studentClass, studentName]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaMessages]);

  // Send Parent QA Message
  const handleSendQaMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInput.trim() || isSendingQa) return;

    setIsSendingQa(true);
    try {
      const sent = await sendQaMessage({
        class_no: studentClass,
        student_name: studentName,
        sender_role: 'parent',
        sender_name: `${studentName} 학부모`,
        content: qaInput.trim()
      });

      setQaMessages((prev) => [...prev, sent]);
      setQaInput('');
      triggerToast('담임 선생님께 메시지가 실시간으로 전송되었습니다.');
    } catch (error) {
      console.error(error);
      triggerToast('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingQa(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-pink-600 to-rose-700 text-white shadow-soft">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full bg-pink-900/30 text-pink-100 border border-pink-400/30">
              <UsersRound className="w-3.5 h-3.5" />
              <span>진장중학교 2학년 {studentClass}반 학부모 소통방</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              {isClass4 ? '이헤레나 선생님의 학급 소통방' : `${studentClass}반 학급 소통방`}
            </h2>
            <p className="text-pink-100 text-xs sm:text-sm">
              {studentName} 학생 학부모님, 환영합니다. 담임선생님의 실시간 공지사항과 활동 사진, 1:1 상담을 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {!isClass4 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-sm flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p>
              <b>안내:</b> 현재 실시간 학부모 소통방 기능은 <b>2학년 4반 (이헤레나 선생님)</b>에서 시범 운영 중입니다.
            </p>
            <p className="text-xs text-amber-800 mt-1">
              * 원활한 테스트를 위해 4반 시범 공지 및 사진도 함께 열람하실 수 있도록 제공됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'notices', label: `공지사항 (${notices.length}건)`, icon: Megaphone },
          { id: 'gallery', label: `활동 사진첩 (${galleryImages.length}장)`, icon: Camera },
          { id: 'qa', label: '선생님께 1:1 문의', icon: MessageSquareText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-sm font-bold transition-all shrink-0 ${
              activeTab === t.id
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* Notices Tab */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-bold text-slate-500">선생님이 등록하신 실시간 공지사항</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>클라우드 실시간 동기화</span>
              </span>
            </div>

            {loadingNotices ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : notices.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">등록된 공지사항이 없습니다.</p>
              </div>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-pink-200 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                          {n.class_no === 0 ? '전체' : `${n.class_no}반`}
                        </span>
                        <h3 className="font-black text-slate-900 text-base group-hover:text-pink-600 transition-colors">
                          {n.title}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 block">발송: {n.author}</span>
                    </div>
                    <span className="text-[10px] flex items-center space-x-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{n.date}</span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                    {n.content}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-700">실시간 활동 사진첩</span>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-md font-black">
                총 {galleryImages.length}장
              </span>
            </div>
            
            {loadingGallery ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                <Camera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">아직 등록된 사진이 없습니다.</p>
                <p className="text-xs text-slate-400 mt-1">선생님께서 사진을 업로드하시면 이곳에 실시간으로 표시됩니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {galleryImages.map((img) => (
                  <div 
                    key={img.id} 
                    onClick={() => setSelectedImage(img.url)}
                    className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm group cursor-pointer relative bg-slate-100"
                  >
                    <img 
                      src={img.url} 
                      alt="학급 사진" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                      <span className="text-white text-[10px] font-bold">크게 보기</span>
                      <span className="text-pink-200 text-[10px] font-bold">{img.class_no}반</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'qa' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[560px]">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200">
                  <span className="text-pink-600 font-black text-sm">헤레나</span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    {isClass4 ? '이헤레나 담임선생님' : `${studentClass}반 담임 선생님`}
                  </h4>
                  <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>1:1 비공개 상담 (본인 외 열람 불가 · 실시간 연동)</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3">
              {/* Teacher Welcome Message */}
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-pink-100 shrink-0 flex items-center justify-center border border-pink-200">
                  <span className="text-pink-600 font-bold text-xs">헤</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs text-xs text-slate-700 leading-relaxed">
                  학부모님 안녕하세요! {studentName} 학생 담임입니다. <br/>
                  수학여행 중 궁금하신 점이나 급한 용무가 있으시면 이곳에 남겨주세요. 실시간으로 확인하여 답변 드리겠습니다. 🌸
                </div>
              </div>

              {qaMessages.map((msg) => {
                const isParent = msg.sender_role === 'parent';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-end space-x-2 max-w-[85%] ${isParent ? 'ml-auto justify-end' : ''}`}
                  >
                    {!isParent && (
                      <div className="w-8 h-8 rounded-full bg-pink-100 shrink-0 flex items-center justify-center border border-pink-200">
                        <span className="text-pink-600 font-bold text-xs">헤</span>
                      </div>
                    )}
                    <div className={`p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed ${
                      isParent 
                        ? 'bg-pink-500 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                      <div className="text-[10px] opacity-75 mb-1 font-bold">
                        {isParent ? `${studentName} 학부모` : '담임교사'} · {msg.time}
                      </div>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <form 
                className="flex items-center space-x-2"
                onSubmit={handleSendQaMessage}
              >
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="선생님께 보낼 메시지를 입력하세요 (실시간 전송)..."
                  className="flex-1 bg-slate-100 border-transparent focus:border-pink-300 focus:bg-white px-4 py-2.5 rounded-full text-xs transition-all outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!qaInput.trim() || isSendingQa}
                  className="w-10 h-10 rounded-full bg-pink-500 disabled:bg-slate-300 text-white flex items-center justify-center shrink-0 transition-all shadow-sm hover:bg-pink-600"
                >
                  {isSendingQa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal for Fullscreen View */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="확대 사진" 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" 
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
