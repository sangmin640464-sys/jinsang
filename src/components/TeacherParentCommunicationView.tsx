import React, { useState, useRef, useEffect } from 'react';
import { Camera, Megaphone, MessageSquareText, ShieldAlert, UsersRound, Send, Clock, CheckCircle2, UploadCloud, Plus, X, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { 
  ClassNotice, 
  GalleryImage, 
  getNotices, 
  createNotice, 
  deleteNotice, 
  getGallery, 
  uploadGalleryImage, 
  deleteGalleryImage,
  subscribeToUpdates 
} from '../utils/communicationService';

export const TeacherParentCommunicationView = ({ currentUser, triggerToast }: { currentUser: any; triggerToast: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'gallery' | 'qa'>('notices');
  const [qaInput, setQaInput] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeInput, setNoticeInput] = useState('');
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target class number (Head teacher defaults to 4 for demo or custom class)
  const isHead = currentUser.myClass === 'all';
  const [targetClass, setTargetClass] = useState<number>(isHead ? 4 : (Number(currentUser.myClass) || 4));
  const isClass4 = targetClass === 4;

  const [notices, setNotices] = useState<ClassNotice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch notices
  const fetchNotices = async () => {
    setLoadingNotices(true);
    try {
      const data = await getNotices(targetClass);
      setNotices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotices(false);
    }
  };

  // Fetch gallery
  const fetchGallery = async () => {
    setLoadingGallery(true);
    try {
      const data = await getGallery(targetClass);
      setGalleryImages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchGallery();

    const unsubscribe = subscribeToUpdates((type) => {
      if (type === 'notices') fetchNotices();
      if (type === 'gallery') fetchGallery();
    });

    return () => unsubscribe();
  }, [targetClass]);

  // Handle Notice Submit
  const handleNoticeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noticeInput.trim()) {
      triggerToast('공지 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingNotice(true);
    try {
      const title = noticeTitle.trim() || `${targetClass}반 공지사항`;
      const created = await createNotice({
        title,
        content: noticeInput.trim(),
        class_no: targetClass,
        author: currentUser.name || `${targetClass}반 담임교사`
      });

      setNotices((prev) => [created, ...prev]);
      setNoticeTitle('');
      setNoticeInput('');
      triggerToast('공지사항이 학부모님들께 성공적으로 발송되었습니다!');
    } catch (error) {
      console.error('Notice creation error:', error);
      triggerToast('공지사항 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  // Handle Notice Delete
  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) return;
    try {
      await deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      triggerToast('공지사항이 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      triggerToast('삭제 중 오류가 발생했습니다.');
    }
  };

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => 
        uploadGalleryImage(file, targetClass)
      );

      const uploaded = await Promise.all(uploadPromises);
      setGalleryImages((prev) => [...uploaded, ...prev]);
      triggerToast(`${files.length}장의 사진이 성공적으로 업로드 및 연동되었습니다!`);
    } catch (error) {
      console.error('Upload failed:', error);
      triggerToast('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove Image
  const handleRemoveImage = async (idToRemove: string) => {
    if (!window.confirm('이 사진을 사진첩에서 삭제하시겠습니까?')) return;
    try {
      await deleteGalleryImage(idToRemove);
      setGalleryImages((prev) => prev.filter((img) => img.id !== idToRemove));
      triggerToast('사진이 삭제되었습니다.');
    } catch (error) {
      console.error('Delete failed:', error);
      triggerToast('사진 삭제 중 오류가 발생했습니다.');
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
              <span>진장중학교 2학년 {targetClass}반 학부모 소통방 (교사용 관리)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              학부모 소통 관리 대시보드
            </h2>
            <p className="text-pink-100 text-xs sm:text-sm">
              선생님께서 공지사항을 등록하거나 사진을 올리면 학부모 화면에 실시간으로 즉시 연동됩니다.
            </p>
          </div>

          {/* If Head Teacher, allow switching classes */}
          {isHead && (
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex items-center space-x-2">
              <span className="text-xs font-bold text-pink-100">관리 학급:</span>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(Number(e.target.value))}
                className="bg-white text-slate-800 font-black text-xs px-3 py-1.5 rounded-xl outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((cls) => (
                  <option key={cls} value={cls}>
                    2학년 {cls}반 {cls === 4 ? '(시범)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {!isClass4 && !isHead && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-sm flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <b>알림:</b> 현재 이 학부모 소통 관리 기능은 <b>2학년 4반 (이헤레나 선생님)</b>에서 시범 운영 중입니다. {targetClass}반으로 등록하신 공지 및 사진도 정상 저장·연동됩니다.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: 'notices', label: `공지사항 (${notices.length}건)`, icon: Megaphone },
          { id: 'gallery', label: `사진첩 업로드 (${galleryImages.length}장)`, icon: Camera },
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
                <span>2학년 {targetClass}반 새 공지사항 작성</span>
              </h3>
              <input
                type="text"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="공지 제목 (예: 2일차 저녁 일정 및 숙소 복귀 안내)"
                className="w-full bg-slate-50 border border-slate-200 focus:border-pink-300 focus:bg-white px-4 py-2.5 rounded-xl text-sm transition-all outline-none font-bold"
              />
              <textarea
                value={noticeInput}
                onChange={(e) => setNoticeInput(e.target.value)}
                placeholder="학부모님들께 실시간으로 전달할 공지사항을 작성해주세요..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-pink-300 focus:bg-white px-4 py-3 rounded-2xl text-sm transition-all outline-none resize-none h-28 leading-relaxed"
              ></textarea>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-slate-400">
                  * 발송 즉시 학부모님 화면에 알림 및 목록이 실시간으로 동기화됩니다.
                </span>
                <button
                  onClick={handleNoticeSubmit}
                  disabled={isSubmittingNotice || !noticeInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-all flex items-center space-x-1.5"
                >
                  {isSubmittingNotice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>발송 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>학부모 전체 발송</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-bold text-slate-700 text-sm">기존 발송 내역</h3>
                <span className="text-xs text-slate-400">총 {notices.length}건 등록됨</span>
              </div>

              {loadingNotices ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-pink-500"></div>
                </div>
              ) : notices.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-pink-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                            {n.class_no === 0 ? '전체 학년' : `${n.class_no}반`}
                          </span>
                          <h3 className="font-black text-slate-900 text-base">{n.title}</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">작성자: {n.author}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] flex items-center space-x-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <Clock className="w-3 h-3" />
                          <span>{n.date}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteNotice(n.id)}
                          title="공지 삭제"
                          className="p-1 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>
                ))
              )}
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
            <div 
              className={`bg-white p-8 rounded-3xl border border-pink-100 shadow-sm border-dashed text-center space-y-3 transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-pink-50/50'
              }`}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
              </div>
              <h3 className="font-black text-pink-900">
                {uploading ? '사진을 업로드 및 연동하는 중입니다...' : `2학년 ${targetClass}반 활동 사진 업로드`}
              </h3>
              <p className="text-xs text-slate-500">
                클릭하여 사진을 선택하면 클라우드 및 학부모 화면에 즉시 등록됩니다 (여러 장 선택 가능)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-sm font-bold text-slate-700">현재 등록된 사진</span>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-md font-black">
                  총 {galleryImages.length}장
                </span>
              </div>
              
              {loadingGallery ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                  <span>아직 업로드된 사진이 없습니다. 위 영역을 클릭하여 첫 사진을 올려보세요!</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {galleryImages.map((img) => (
                    <div 
                      key={img.id} 
                      className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm group relative bg-slate-100 cursor-pointer"
                    >
                      <img 
                        src={img.url} 
                        alt="학급 사진" 
                        onClick={() => setSelectedImage(img.url)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(img.id);
                          }}
                          className="w-7 h-7 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors shadow-sm"
                          title="삭제"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div 
                        onClick={() => setSelectedImage(img.url)}
                        className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end text-white text-[10px]"
                      >
                        <span>크게 보기</span>
                        <span className="font-bold">{img.class_no}반</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Image Modal for Fullscreen View */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
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
