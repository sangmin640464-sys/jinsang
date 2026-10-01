// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Users, PhoneCall, CalendarRange, Bus, ShieldAlert, Sparkles,
  Search, CheckCircle2, AlertTriangle, ExternalLink, MapPin,
  Utensils, Hotel, Hospital, CheckSquare, Square, RotateCcw,
  Navigation, Camera, Phone, ShieldCheck, Clock, Bookmark, Info
} from 'lucide-react';
import { ITINERARY, LOTTE_COUPON_STORES, PREP_CHECKLIST, EMERGENCY_CONTACTS, TEACHERS } from '../data/tripData';
import { OPEN_KAKAO_URL } from '../data/mapImages';

interface StudentGuideViewProps {
  students: any[];
  currentUser?: any;
  onBoardingToggle?: (studentId: number, currentStatus: boolean) => void;
  triggerToast: (msg: string) => void;
}

export const StudentGuideView: React.FC<StudentGuideViewProps> = ({
  students,
  currentUser,
  onBoardingToggle,
  triggerToast,
}) => {
  const [guideTab, setGuideTab] = useState('t1'); // t1~t8
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Teacher phone local storage
  const [phoneData, setPhoneData] = useState<Record<string, string>>({});
  const [myClassPhone, setMyClassPhone] = useState('');

  // Prep checklist local storage
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [safetyFilter, setSafetyFilter] = useState('all');

  useEffect(() => {
    try {
      const savedPhones = localStorage.getItem('jj_stu_phone_v1');
      if (savedPhones) setPhoneData(JSON.parse(savedPhones));

      const savedPrep = localStorage.getItem('jj_stu_prep_v1');
      if (savedPrep) setCheckedItems(JSON.parse(savedPrep));

      const savedClass = localStorage.getItem('jj_stu_class_v1');
      if (savedClass) setMyClassPhone(savedClass);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handlePhoneChange = (classNum: string, val: string) => {
    setPhoneData((prev) => ({ ...prev, [classNum]: val }));
  };

  const handleSavePhones = () => {
    try {
      localStorage.setItem('jj_stu_phone_v1', JSON.stringify(phoneData));
      triggerToast('입력한 담임선생님 번호가 기기에 저장되었습니다.');
    } catch (e) {
      triggerToast('저장 중 오류가 발생했습니다.');
    }
  };

  const handleClearPhones = () => {
    if (confirm('저장된 담임선생님 번호를 모두 삭제하시겠습니까?')) {
      setPhoneData({});
      localStorage.removeItem('jj_stu_phone_v1');
      triggerToast('저장된 번호가 삭제되었습니다.');
    }
  };

  const handleToggleCheck = (itemKey: string) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [itemKey]: !prev[itemKey] };
      try {
        localStorage.setItem('jj_stu_prep_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearChecklist = () => {
    if (confirm('체크리스트를 초기화하시겠습니까?')) {
      setCheckedItems({});
      localStorage.removeItem('jj_stu_prep_v1');
      triggerToast('준비물 체크가 초기화되었습니다.');
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesClass = filterClass === 'all' || String(s.class_no) === String(filterClass);
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q || s.name.toLowerCase().includes(q) || String(s.code).includes(q);
    return matchesClass && matchesQuery;
  });

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const isStudent = currentUser?.role === 'student';
  const currentStudentObj = isStudent ? students.find((s) => s.id === currentUser.id) : null;

  return (
    <div className="space-y-6 pb-16">
      {/* Student Personal Banner (If logged in as student) */}
      {isStudent && currentStudentObj && (
        <div className="clean-card p-5 bg-gradient-to-r from-emerald-600 to-teal-800 text-white rounded-3xl shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-white/20 text-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-bold">
              <span>2학년 {currentStudentObj.class_no}반 {currentStudentObj.student_no}번</span>
              <span>·</span>
              <span>{currentStudentObj.bus_no}호차 탑승</span>
            </div>
            <h3 className="text-xl font-black">
              {currentStudentObj.name} 학생, 즐겁고 안전한 수학여행 되세요!
            </h3>
            <p className="text-xs text-emerald-200">
              담임: {TEACHERS.find(t => t.classNo === currentStudentObj.class_no)?.name} 선생님 · 호차 인솔: {currentStudentObj.bus_no}호차
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => onBoardingToggle && onBoardingToggle(currentStudentObj.id, currentStudentObj.bus_status)}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center space-x-2 ${
                currentStudentObj.bus_status
                  ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                  : 'bg-amber-400 text-amber-950 hover:bg-amber-300 animate-pulse'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentStudentObj.bus_status ? '✓ 버스 탑승완료 됨' : '지금 버스 탑승 완료하기'}</span>
            </button>
            <a
              href={OPEN_KAKAO_URL}
              target="_blank"
              rel="noreferrer"
              className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-2xl transition-all"
              title="사진 미션 제출 오픈카톡"
            >
              <Camera className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Top Action Quick Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <a
          href={OPEN_KAKAO_URL}
          target="_blank"
          rel="noreferrer"
          className="clean-card p-3.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-sm transition-all"
        >
          <Camera className="w-4 h-4 text-amber-900" />
          <span>사진 미션 제출 (오픈카톡)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
        <a
          href="tel:052-289-6481"
          className="clean-card p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-sm transition-all"
        >
          <PhoneCall className="w-4 h-4" />
          <span>학교 052-289-6481 통화</span>
        </a>
      </div>

      {/* Navigation Sub-tabs (Horizontal scroll for mobile) */}
      <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        <div className="flex space-x-1.5 min-w-max bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/50">
          {[
            { id: 't1', label: '참가학생', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 't2', label: '담임 연락처', icon: <PhoneCall className="w-3.5 h-3.5" /> },
            { id: 't3', label: '일정표', icon: <CalendarRange className="w-3.5 h-3.5" /> },
            { id: 't4', label: '버스배정', icon: <Bus className="w-3.5 h-3.5" /> },
            { id: 't5', label: '안전교육', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: 't6', label: '롯데월드', icon: <Utensils className="w-3.5 h-3.5" /> },
            { id: 't7', label: '경복궁·형무소', icon: <MapPin className="w-3.5 h-3.5" /> },
            { id: 't8', label: '사진 미션', icon: <Camera className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setGuideTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                guideTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===================== TAB 1: 참가학생 ===================== */}
      {guideTab === 't1' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="clean-card p-3.5 text-center">
              <span className="block text-2xl font-black text-blue-600">140</span>
              <span className="text-[11px] font-bold text-slate-500">참가 학생</span>
            </div>
            <div className="clean-card p-3.5 text-center">
              <span className="block text-2xl font-black text-emerald-600">6</span>
              <span className="text-[11px] font-bold text-slate-500">학급 · 버스</span>
            </div>
            <div className="clean-card p-3.5 text-center">
              <span className="block text-lg sm:text-2xl font-black text-amber-600 pt-1">2박 3일</span>
              <span className="text-[11px] font-bold text-slate-500">10.14~10.16</span>
            </div>
          </div>

          {/* Search & Class Filter */}
          <div className="clean-card p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름 또는 학번 검색 (예: 김규빈 / 2113)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-blue-500 bg-slate-50"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['all', '1', '2', '3', '4', '5', '6'].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterClass(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterClass === c
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c === 'all' ? '전체' : `2-${c}반`}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 flex justify-between items-center">
              <span>{searchQuery || filterClass !== 'all' ? `검색 결과: ${filteredStudents.length}명` : '전체 140명 참가'}</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-blue-600 font-bold hover:underline">
                  검색 초기화
                </button>
              )}
            </div>
          </div>

          {/* Student Class Boxes */}
          {[1, 2, 3, 4, 5, 6].map((classNum) => {
            const classStudents = filteredStudents.filter((s) => s.class_no === classNum);
            if (classStudents.length === 0) return null;
            const teacher = TEACHERS.find((t) => t.classNo === classNum);

            return (
              <div key={classNum} className="clean-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-slate-900">2학년 {classNum}반</span>
                    <span className="text-xs text-slate-500 font-bold">({classStudents.length}명)</span>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      {classNum}호차
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    인솔: {teacher?.name} {teacher?.coTeacher ? `, ${teacher.coTeacher}` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {classStudents.map((st) => {
                    const isMe = currentUser?.id === st.id;
                    return (
                      <div
                        key={st.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isMe
                            ? 'bg-emerald-50 border-emerald-400 font-black text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">{st.code}</span>
                          <span className="font-bold">{st.name}</span>
                        </div>
                        {st.bus_status ? (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                            탑승
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                            미탑승
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Non-participating Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-black flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>잔류 학생 안내</span>
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed pl-5">
              수학여행에 참가하지 않는 학생 6명은 10월 14일(수)~16일(금) <b>1층 도서관</b>에서 학습합니다. 개인정보 보호를 위해 명단은 표시하지 않습니다. 해당 학생은 조·종례와 출결 안내를 담임 선생님께 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: 담임 연락처 ===================== */}
      {guideTab === 't2' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <p className="font-black text-sm text-blue-800">내 휴대폰에 직접 저장하세요</p>
            <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5">
              <li>아래 칸에 담임 선생님께 안내받은 번호를 입력하고 <b>저장</b>을 누르세요.</li>
              <li>저장한 번호는 이 기기에만 보관되며, 다른 사람에게 전송되지 않습니다.</li>
              <li>저장 후 <b>전화 걸기</b> 버튼을 누르면 바로 연결됩니다.</li>
            </ul>
            <p className="text-[10px] text-blue-600 pt-1">
              안전 실천 1번: "담임선생님 연락처를 휴대폰에 저장하고, 단톡방을 수시로 확인한다."
            </p>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-700">인솔 및 담임 선생님 연락처</span>
            <button
              onClick={handleClearPhones}
              className="text-[11px] text-red-500 hover:text-red-700 font-bold"
            >
              저장 내용 초기화
            </button>
          </div>

          <div className="space-y-3">
            {['1', '2', '3', '4', '5', '6'].map((c) => {
              const teacher = TEACHERS.find((t) => t.classNo === Number(c));
              const currentVal = phoneData[c] || '';
              const hasPhone = currentVal.replace(/[^0-9]/g, '').length >= 8;

              return (
                <div key={c} className="clean-card p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        2학년 {c}반 · {teacher?.name} 선생님
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {c}호차 인솔 {teacher?.coTeacher ? `(${teacher.coTeacher})` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      {c}호차
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="tel"
                      value={currentVal}
                      onChange={(e) => handlePhoneChange(c, e.target.value)}
                      placeholder="010-0000-0000 입력 후 저장"
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50"
                    />
                    <a
                      href={hasPhone ? `tel:${currentVal.replace(/[^0-9]/g, '')}` : '#'}
                      onClick={(e) => {
                        if (!hasPhone) {
                          e.preventDefault();
                          triggerToast('선생님 전화번호를 먼저 입력하고 저장하세요.');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1.5 transition-all ${
                        hasPhone
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{hasPhone ? `${currentVal} 전화 걸기` : '번호를 입력하세요'}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSavePhones}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-badge transition-all"
          >
            입력한 번호 기기에 저장하기
          </button>

          {/* Always Available Numbers */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-700 px-1">비상 시 항상 연결되는 번호</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EMERGENCY_CONTACTS.map((con, idx) => (
                <div key={idx} className="clean-card p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{con.label}</p>
                    <p className="text-[10px] text-slate-500">{con.note}</p>
                  </div>
                  <a
                    href={`tel:${con.tel.replace(/[^0-9]/g, '')}`}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{con.tel}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: 일정표 ===================== */}
      {guideTab === 't3' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-black text-sm text-blue-950">
              집결: 10월 14일(수) 오전 6시 40분 · 학교 운동장
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              도착 예정: 10월 16일(금) 17:00 평창르비에르 경유 → 17:10 학교 도착. 금요일 오후 교통 상황에 따라 늦어질 수 있습니다.
            </p>
          </div>

          {/* Days */}
          {ITINERARY.map((day) => (
            <div key={day.day} className="clean-card p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-blue-600 block">{day.date}</span>
                <h4 className="text-base font-black text-slate-900">{day.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{day.route}</p>
              </div>

              {/* Timeline list */}
              <div className="border-l-2 border-slate-200 ml-2 pl-4 space-y-4 text-xs">
                {day.events.map((ev, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle on timeline */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-blue-600">{ev.time}</span>
                      {ev.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-sm bg-amber-100 text-amber-800">
                          {ev.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{ev.title}</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{ev.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Meals Table */}
          <div className="clean-card p-5 space-y-3">
            <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-blue-600" />
              <span>식사 안내</span>
            </h4>
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <th className="py-2.5 pr-4 text-left font-bold text-slate-500 w-28 whitespace-nowrap">1일차 점심</th>
                    <td className="py-2.5 text-slate-800">덕평휴게소 <b>개별 식사</b> (개인 용돈 또는 도시락)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="py-2.5 pr-4 text-left font-bold text-slate-500 whitespace-nowrap">1일차 저녁</th>
                    <td className="py-2.5 text-slate-800">나인트리 호텔 식당 (비빔밥 또는 돈가스)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="py-2.5 pr-4 text-left font-bold text-slate-500 whitespace-nowrap">2·3일차 아침</th>
                    <td className="py-2.5 text-slate-800">호텔 조식 뷔페 식사</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="py-2.5 pr-4 text-left font-bold text-slate-500 whitespace-nowrap">2일차 점심·저녁</th>
                    <td className="py-2.5 text-slate-800">롯데월드 <b>밀쿠폰</b> (1인 10,000원권, 지정 14개 업장)</td>
                  </tr>
                  <tr>
                    <th className="py-2.5 pr-4 text-left font-bold text-slate-500 whitespace-nowrap">3일차 점심</th>
                    <td className="py-2.5 text-slate-800">과천과학관 식당 (불고기 덮밥)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: 버스배정 ===================== */}
      {guideTab === 't4' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-black text-sm text-blue-950">학생 140명 · 인솔자 12명 · 총 6대 운행</p>
            <p className="text-[11px] text-blue-800">
              반별로 호차가 정해져 있습니다. <b>지정된 차가 아닌 다른 차로 옮겨 타지 않습니다.</b> 좌석은 학급별로 정합니다.
            </p>
          </div>

          {/* Bus 1~6 List */}
          {[1, 2, 3, 4, 5, 6].map((busNo) => {
            const busStudents = students.filter((s) => s.class_no === busNo);
            const teacher = TEACHERS.find((t) => t.classNo === busNo);

            return (
              <div key={busNo} className="clean-card p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-slate-900">{busNo}호차</span>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                      2학년 {busNo}반
                    </span>
                    <span className="text-xs text-slate-500">({busStudents.length}명)</span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-bold">
                    인솔: {teacher?.name} {teacher?.coTeacher ? `, ${teacher.coTeacher}` : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  {busStudents.map((st) => (
                    <span
                      key={st.id}
                      className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px]"
                    >
                      <b className="font-mono text-slate-400 mr-1">{st.student_no}</b>
                      {st.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 5 Rules */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <h4 className="font-black text-sm text-amber-950">승하차할 때 꼭 지킬 것 5가지</h4>
            <ol className="list-decimal list-inside text-[11px] space-y-0.5 pl-1">
              <li>내리기 전에 <b>출발 시각 · 차량 번호 · 차량 위치</b>를 확인합니다.</li>
              <li>버스가 <b>완전히 멈춘 뒤</b> 차례대로 타고 내립니다.</li>
              <li>탑승하면 <b>옆 좌석 친구가 탔는지 확인</b>하고, 안전벨트를 반드시 맵니다.</li>
              <li>내릴 때 휴대폰, 지갑 등 소지품을 반드시 챙깁니다.</li>
              <li>집합 시간에 늦으면 전체가 기다립니다. 약속 시간을 꼭 지킵니다.</li>
            </ol>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: 안전교육 & 준비물 ===================== */}
      {guideTab === 't5' && (
        <div className="space-y-4">
          {/* Section Filter */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: '전체' },
              { id: 'prep', label: '준비물' },
              { id: 'car', label: '차량' },
              { id: 'act', label: '활동 중' },
              { id: 'hotel', label: '숙소' },
              { id: 'place', label: '장소별' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSafetyFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  safetyFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Prep checklist */}
          {(safetyFilter === 'all' || safetyFilter === 'prep') && (
            <div className="clean-card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900">준비물 체크리스트</h4>
                  <p className="text-[11px] text-slate-500">체크한 내용은 기기에 자동 보관됩니다.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    {checkedCount} / {PREP_CHECKLIST.length}
                  </span>
                  <button
                    onClick={handleClearChecklist}
                    className="text-[11px] text-slate-400 hover:text-slate-700"
                    title="초기화"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {PREP_CHECKLIST.map((item, idx) => {
                  const key = `${item.category}_${item.item}`;
                  const isChecked = Boolean(checkedItems[key]);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleCheck(key)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center space-x-2.5 transition-all ${
                        isChecked
                          ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="text-[10px] text-slate-400 font-bold w-14 shrink-0">
                        {item.category}
                      </span>
                      <span className="flex-1 font-semibold">{item.item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Forbidden Items */}
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <p className="font-black flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>가져오면 안 되는 물품</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-red-800 pl-4 space-y-0.5">
                  <li>술, 담배, 라이터 등 유해 물품</li>
                  <li>화투, 카드 등 도박 관련 물품</li>
                  <li>고데기, 헤어드라이어 등 전열기구 (화재 및 화상 위험)</li>
                  <li>귀중품, 고가품, 고액의 현금 (분실 시 개인 책임)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Vehicle Safety */}
          {(safetyFilter === 'all' || safetyFilter === 'car') && (
            <div className="clean-card p-5 space-y-3">
              <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
                <Bus className="w-4 h-4 text-blue-600" />
                <span>차량 이동 시 안전수칙</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                <li>안전띠를 반드시 착용하고, 운행 중 절대 일어서지 않습니다.</li>
                <li>버스가 완전히 멈춘 후 하차하며, 임의로 다른 차량으로 이동하지 않습니다.</li>
                <li>차창 밖으로 머리나 손을 절대 내밀지 않습니다. (사고 발생 위험)</li>
                <li>멀미를 하는 학생은 미리 멀미약을 복용하고 비닐봉지를 준비합니다.</li>
                <li>화재 발생 시 탈출구가 막히면 비상탈출 망치로 유리창 모서리를 깨고 탈출합니다.</li>
              </ul>
            </div>
          )}

          {/* Activity Rules */}
          {(safetyFilter === 'all' || safetyFilter === 'act') && (
            <div className="clean-card p-5 space-y-3">
              <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>활동 중 안전 및 폭력·성폭력 예방</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                <li>집결 시간을 꼭 지키고, 개인 행동 및 무단 이탈은 절대 금지합니다.</li>
                <li>반드시 <b>조별로 함께</b> 다니고, 위험지역이나 통제구역에 들어가지 않습니다.</li>
                <li>공중화장실을 이용할 때는 반드시 친구와 함께 갑니다.</li>
                <li>상대방이 불쾌감을 느끼는 장난이나 신체 접촉은 절대 금지입니다.</li>
                <li><b>일행을 놓쳤을 때:</b> 그 자리에 멈춰 서서 담임 선생님께 전화합니다.</li>
              </ul>
            </div>
          )}

          {/* Hotel Rules */}
          {(safetyFilter === 'all' || safetyFilter === 'hotel') && (
            <div className="clean-card p-5 space-y-3">
              <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
                <Hotel className="w-4 h-4 text-purple-600" />
                <span>숙소(나인트리 호텔 판교) 생활 수칙</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                <li>밤 10시(22:00) 이후 다른 방 이동 및 외출은 엄격히 금지됩니다.</li>
                <li>남학생이 여학생 방에, 여학생이 남학생 방에 절대 출입하지 않습니다.</li>
                <li>22:00~06:00 야간 안전요원 4명이 복도를 순찰하며 안전을 지도합니다.</li>
                <li>객실 비품 및 시설물(TV, 드라이기, 침구 등) 파손 시 개인 변상 조치됩니다.</li>
                <li>배달 음식은 3층 로비에서 직접 받고, 먹은 후 쓰레기를 깨끗이 분리배출합니다.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 6: 롯데월드 ===================== */}
      {guideTab === 't6' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-black text-sm text-blue-950">2일차 10:00 ~ 19:00 자율 체험</p>
            <p className="text-[11px] text-blue-800">
              반드시 <b>조별로 함께</b> 다니고, <b>19:00 정문 게이트 집결 시간</b>을 꼭 지키세요!
            </p>
          </div>

          {/* Coupon Stores */}
          <div className="clean-card p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="font-black text-sm text-slate-900 flex items-center space-x-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span>밀쿠폰(1인 10,000원권) 사용 가능 14개 지정 업장</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-bold">14개소</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {LOTTE_COUPON_STORES.map((st, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{st.name}</span>
                    <span className="text-[10px] text-slate-400 block">{st.location}</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {st.floor}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Floor Attractions & Facilities */}
          <div className="clean-card p-5 space-y-3 text-xs">
            <h4 className="font-black text-sm text-slate-900">편의시설 및 의무실 위치</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900">
                <b>의무실</b>: 어드벤처 1F, 매직아일랜드 쪽 4F
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <b>물품보관함</b>: B1F, 1F, 2F, 3F, 4F
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <b>만남의 광장</b>: 1F (일행 분실 시 모임 장소)
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <b>미아/분실물센터</b>: 어드벤처 1F
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 7: 경복궁 & 서대문형무소 ===================== */}
      {guideTab === 't7' && (
        <div className="space-y-4">
          <div className="clean-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-black text-sm text-slate-900">경복궁 관람 (1일차 13:00~14:00)</h4>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm">단체 사진</span>
            </div>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              <li>광화문 → 흥례문 → 근정전 앞 단체 사진 촬영 후 조별 관람.</li>
              <li>경회루, 향원정 등 문화재에 올라가거나 손대지 않습니다.</li>
              <li>돌바닥과 문턱이 많으므로 절대 뛰지 않습니다.</li>
              <li>관람 시간이 1시간으로 한정되어 있으므로 집합 시간을 엄수합니다.</li>
            </ul>
          </div>

          <div className="clean-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-black text-sm text-slate-900">서대문형무소 역사관 (1일차 14:30~15:30)</h4>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm">경건한 관람</span>
            </div>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              <li>독립운동가들의 숭고한 희생을 기리는 추모 공간이므로 경건한 태도를 유지합니다.</li>
              <li>지하 전시실과 옥사는 어둡고 계단이 좁으므로 앞사람과 안전거리를 유지합니다.</li>
              <li>사형장, 시구문 앞에서는 장난을 치거나 큰 소리로 떠들지 않습니다.</li>
              <li>관람 종료 후 15:30까지 정문 앞으로 신속히 모입니다.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ===================== TAB 8: 사진 미션 ===================== */}
      {guideTab === 't8' && (
        <div className="space-y-4">
          <div className="clean-card p-5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-3xl space-y-3 shadow-soft">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-amber-900" />
              <h4 className="font-black text-base">사진은 오픈카톡방에 제출합니다</h4>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              아래 버튼을 누르면 사진 제출용 오픈채팅방으로 바로 연결됩니다. 사진과 함께 <b>반·번호·이름</b>을 작성하여 올려주세요.
            </p>
            <a
              href={OPEN_KAKAO_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center space-x-2 shadow-md transition-all"
            >
              <span>오픈카톡방 바로 열기</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="clean-card p-5 space-y-3 text-xs">
            <h4 className="font-black text-sm text-slate-900">제출 방법 및 양식</h4>
            <ol className="list-decimal list-inside text-slate-700 space-y-1 pl-1">
              <li>장소별 미션 사진을 촬영합니다.</li>
              <li>위 버튼으로 오픈카톡방에 들어갑니다.</li>
              <li>사진을 올리고 <b>"2-○반 ○○번 홍길동 [미션명]"</b> 형태로 입력합니다.</li>
              <li>조별 미션은 조에서 <b>대표 1명만</b> 올립니다.</li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
            <p className="font-black flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>사진 촬영 시 엄수 사항</span>
            </p>
            <ul className="list-disc list-inside text-[11px] text-red-800 pl-4 space-y-0.5">
              <li><b>친구의 동의 없이 사진이나 동영상을 촬영하지 않습니다.</b></li>
              <li>타인의 사진을 인터넷이나 SNS에 함부로 게시·유포하지 않습니다.</li>
              <li>촬영 금지 구역(공연장, 일부 전시실)에서는 촬영하지 않습니다.</li>
              <li>어트랙션 탑승 중에는 스마트폰을 꺼내지 않습니다. (낙하 및 파손 위험)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
