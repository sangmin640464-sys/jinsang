import React, { useState, useEffect } from 'react';
import { Camera, Megaphone, MessageSquareText, ShieldAlert, UsersRound, Send, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabase';

export const ParentCommunicationView = ({ currentUser, triggerToast }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'gallery' | 'qa'>('notices');
  const [qaInput, setQaInput] = useState('');

  const isClass4 = currentUser.studentClass === 4;

  const notices = [
    {
      id: 1,
      title: '2일차 롯데월드 안내 및 하원 시간',
      date: '10.15 (목) 08:30',
      content: '학부모님들 안녕하십니까! 오늘 2학년 4반 학생들은 롯데월드 자율 체험을 진행합니다. 아이들이 저녁 7시까지 정문 게이트에 무사히 집결할 수 있도록 당부 부탁드립니다. 특이사항 발생 시 언제든 연락주세요. - 담임 이헤레나 올림'
    },
    {
      id: 2,
      title: '수학여행 출발 전 안전교육 안내',
      date: '10.13 (화) 16:00',
      content: '내일 출발하는 수학여행과 관련하여 안전교육을 모두 마쳤습니다. 우리 4반 아이들 모두 건강하게 잘 다녀올 수 있도록 꼼꼼히 챙기겠습니다.'
    }
  ];

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGalleryImages();
    }
  }, [activeTab]);

  const fetchGalleryImages = async () => {
    setLoadingGallery(true);
    try {
      const { data, error } = await supabase
        .from('class_galleries')
        .select('image_url')
        .eq('class_no', currentUser.studentClass)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery:', error);
      } else if (data) {
        setGalleryImages(data.map(item => item.image_url));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGallery(false);
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
              <span>진장중학교 2학년 {currentUser.studentClass}반 학부모 소통방</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              {currentUser.studentClass === 4 ? '이헤레나 선생님의 학급 소통방' : `${currentUser.studentClass}반 학급 소통방`}
            </h2>
            <p className="text-pink-100 text-xs sm:text-sm">
              {currentUser.studentName} 학생 학부모님, 환영합니다. 안전하고 즐거운 수학여행이 되도록 최선을 다하겠습니다.
            </p>
          </div>
        </div>
      </div>

      {!isClass4 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-sm flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <b>알림:</b> 현재 이 학부모 소통방 기능은 <b>2학년 4반 (이헤레나 선생님)</b>에서 시범 운영 중입니다. 다른 반의 경우 기능이 제한적으로 작동할 수 있습니다.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'notices', label: '공지사항', icon: Megaphone },
          { id: 'gallery', label: '활동 사진첩', icon: Camera },
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
            {notices.map((n) => (
              <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-pink-200 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-slate-900 text-base group-hover:text-pink-600 transition-colors">
                    {n.title}
                  </h3>
                  <span className="text-[10px] flex items-center space-x-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Clock className="w-3 h-3" />
                    <span>{n.date}</span>
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-sm font-bold text-slate-700">실시간 사진첩</span>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-md font-black">총 {galleryImages.length}장</span>
            </div>
            
            {loadingGallery ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                <Camera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">아직 등록된 사진이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {galleryImages.map((src, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm group cursor-pointer relative">
                    <img src={src} alt="학급 사진" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-[10px] font-bold">크게 보기</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'qa' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200">
                  <span className="text-pink-600 font-black text-sm">헤레나</span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    {isClass4 ? '이헤레나 담임선생님' : '담임 선생님'}
                  </h4>
                  <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>1:1 비공개 상담 (본인 외 열람 불가)</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
              <div className="flex flex-col space-y-2 max-w-[80%] mx-auto text-center my-6">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 py-1 px-3 rounded-full self-center">
                  10월 14일 수요일
                </span>
              </div>
              
              {/* Teacher Welcome Message */}
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-pink-100 shrink-0 flex items-center justify-center border border-pink-200">
                  <span className="text-pink-600 font-bold text-xs">헤</span>
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    학부모님 안녕하세요! {currentUser.studentName} 학생 담임입니다. <br/>
                    수학여행 중 궁금하신 점이나 급한 용무가 있으시면 이곳에 남겨주세요. 아이들을 인솔하는 중간중간 틈틈이 확인하여 답변 드리겠습니다. 🌸
                  </p>
                </div>
              </div>

              {/* Sample User Message */}
              <div className="flex items-end justify-end space-x-2 max-w-[85%] ml-auto">
                <div className="bg-pink-500 p-3 rounded-2xl rounded-tr-none shadow-sm text-white">
                  <p className="text-xs leading-relaxed">
                    선생님, 우리 {currentUser.studentName}이가 평소에 멀미가 좀 있어서요. 혹시 버스 앞자리에 앉을 수 있도록 배려 부탁드려도 될까요?
                  </p>
                </div>
              </div>

              {/* Sample Teacher Reply */}
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-pink-100 shrink-0 flex items-center justify-center border border-pink-200">
                  <span className="text-pink-600 font-bold text-xs">헤</span>
                </div>
                <div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      네 어머님! {currentUser.studentName}이 버스 멀미약 챙겨먹었는지 확인하고, 가장 앞자리 창가 쪽으로 짝꿍과 함께 앉도록 조치했습니다. 너무 걱정 마세요~ ^^
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 ml-1 mt-1 block">읽음</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <form 
                className="flex items-center space-x-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if(qaInput.trim()) {
                    triggerToast('메시지가 성공적으로 전송되었습니다.');
                    setQaInput('');
                  }
                }}
              >
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="선생님께 보낼 메시지를 입력하세요..."
                  className="flex-1 bg-slate-100 border-transparent focus:border-pink-300 focus:bg-white px-4 py-2.5 rounded-full text-xs transition-all outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!qaInput.trim()}
                  className="w-10 h-10 rounded-full bg-pink-500 disabled:bg-slate-300 text-white flex items-center justify-center shrink-0 transition-all shadow-sm hover:bg-pink-600"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
