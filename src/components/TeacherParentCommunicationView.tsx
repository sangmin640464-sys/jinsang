import React, { useState, useRef } from 'react';
import { Camera, Megaphone, MessageSquareText, ShieldAlert, UsersRound, Send, Clock, CheckCircle2, UploadCloud, Plus, X } from 'lucide-react';

export const TeacherParentCommunicationView = ({ currentUser, triggerToast }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'gallery' | 'qa'>('notices');
  const [qaInput, setQaInput] = useState('');
  const [noticeInput, setNoticeInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isClass4 = currentUser.myClass === 4;

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

  const [galleryImages, setGalleryImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=400',
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length + galleryImages.length > 10) {
      triggerToast('사진은 최대 10장까지만 업로드 가능합니다.');
      return;
    }

    const newImages: string[] = [];
    let loadedCount = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          setGalleryImages((prev) => [...newImages, ...prev]);
          triggerToast(`${files.length}장의 사진이 성공적으로 업로드되었습니다!`);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setGalleryImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    triggerToast('사진이 삭제되었습니다.');
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
              <span>진장중학교 2학년 {currentUser.myClass}반 학부모 소통방 (교사용)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              학부모 소통 관리 대시보드
            </h2>
            <p className="text-pink-100 text-xs sm:text-sm">
              선생님, 학부모님들께 공지사항을 전달하고 우리 반 아이들의 사진을 공유해보세요.
            </p>
          </div>
        </div>
      </div>

      {!isClass4 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-sm flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <b>알림:</b> 현재 이 학부모 소통 관리 기능은 <b>2학년 4반 (이헤레나 선생님)</b>에서 시범 운영 중입니다. 선생님의 반에서는 아직 테스트 발송만 가능합니다.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'notices', label: '공지사항 작성', icon: Megaphone },
          { id: 'gallery', label: '사진첩 업로드', icon: Camera },
          { id: 'qa', label: '학부모 1:1 문의 답변', icon: MessageSquareText },
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
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm space-y-4">
              <h3 className="font-black text-pink-900 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-pink-500" />
                <span>새 공지사항 작성</span>
              </h3>
              <textarea
                value={noticeInput}
                onChange={(e) => setNoticeInput(e.target.value)}
                placeholder="학부모님들께 전달할 공지사항을 작성해주세요..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-pink-300 focus:bg-white px-4 py-3 rounded-2xl text-sm transition-all outline-none resize-none h-32"
              ></textarea>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if(noticeInput.trim()) {
                      triggerToast('공지사항이 등록되었습니다.');
                      setNoticeInput('');
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm shadow-sm transition-all"
                >
                  학부모 전체 발송
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 text-sm px-2">기존 발송 내역</h3>
              {notices.map((n) => (
                <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-slate-900 text-base">{n.title}</h3>
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
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-sm border-dashed text-center space-y-3 cursor-pointer hover:bg-pink-50 transition-colors"
                 onClick={() => fileInputRef.current?.click()}>
              <div className="w-14 h-14 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-black text-pink-900">학급 활동 사진 업로드</h3>
              <p className="text-xs text-slate-500">클릭하여 스마트폰 앨범에서 사진을 선택하세요 (최대 10장)</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-sm font-bold text-slate-700">현재 업로드된 사진</span>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-md font-black">총 {galleryImages.length}장</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {galleryImages.map((src, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm group relative">
                    <img src={src} alt="학급 사진" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2">
                      <button 
                        onClick={() => removeImage(idx)}
                        className="w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors shadow-sm">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'qa' && (
          <div className="grid md:grid-cols-3 gap-6 h-[500px]">
            {/* Parent List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-1">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-black text-sm text-slate-800">새로운 문의 (1건)</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <button className="w-full text-left p-3 rounded-2xl bg-pink-50 border border-pink-200 transition-colors flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center shrink-0">강</div>
                  <div>
                    <h4 className="font-bold text-sm text-pink-900">강승엽 학부모님</h4>
                    <p className="text-xs text-slate-600 truncate max-w-[150px]">선생님, 우리 승엽이가...</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-pink-500 ml-auto mt-2 shrink-0"></div>
                </button>
                <button className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-start space-x-3 mt-1">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center shrink-0">김</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-700">김규빈 학부모님</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">사진 예쁘게 찍어주셔서...</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Chat Room */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-2">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900">
                  강승엽 학부모님과의 1:1 대화
                </h4>
              </div>

              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                <div className="flex flex-col space-y-2 max-w-[80%] mx-auto text-center my-6">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 py-1 px-3 rounded-full self-center">
                    10월 14일 수요일
                  </span>
                </div>
                
                {/* Sample Teacher Welcome Message */}
                <div className="flex items-end justify-end space-x-2 max-w-[85%] ml-auto">
                  <div className="bg-slate-200 p-3 rounded-2xl rounded-tr-none shadow-sm text-slate-700">
                    <p className="text-xs leading-relaxed">
                      학부모님 안녕하세요! 강승엽 학생 담임입니다. <br/>
                      수학여행 중 궁금하신 점이나 급한 용무가 있으시면 이곳에 남겨주세요. 아이들을 인솔하는 중간중간 틈틈이 확인하여 답변 드리겠습니다. 🌸
                    </p>
                  </div>
                </div>

                {/* Sample User Message */}
                <div className="flex items-start space-x-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-pink-100 shrink-0 flex items-center justify-center border border-pink-200">
                    <span className="text-pink-600 font-bold text-xs">강</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      선생님, 우리 승엽이가 평소에 멀미가 좀 있어서요. 혹시 버스 앞자리에 앉을 수 있도록 배려 부탁드려도 될까요?
                    </p>
                  </div>
                </div>

                {/* Sample Teacher Reply */}
                <div className="flex items-end justify-end space-x-2 max-w-[85%] ml-auto">
                  <div className="bg-pink-500 p-3 rounded-2xl rounded-tr-none shadow-sm text-white">
                    <p className="text-xs leading-relaxed">
                      네 어머님! 승엽이 버스 멀미약 챙겨먹었는지 확인하고, 가장 앞자리 창가 쪽으로 짝꿍과 함께 앉도록 조치했습니다. 너무 걱정 마세요~ ^^
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border-t border-slate-200">
                <form 
                  className="flex items-center space-x-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if(qaInput.trim()) {
                      triggerToast('답변이 성공적으로 전송되었습니다.');
                      setQaInput('');
                    }
                  }}
                >
                  <input
                    type="text"
                    value={qaInput}
                    onChange={(e) => setQaInput(e.target.value)}
                    placeholder="답변을 입력하세요..."
                    className="flex-1 bg-slate-100 border-transparent focus:border-pink-300 focus:bg-white px-4 py-2.5 rounded-full text-xs transition-all outline-none"
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
          </div>
        )}
      </div>
    </div>
  );
};
