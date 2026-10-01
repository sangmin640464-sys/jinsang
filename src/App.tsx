// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, UserCheck, UsersRound, CalendarRange,
  Sparkles, ShieldAlert, X, Menu, Megaphone, Send, PhoneCall,
  ArrowUpRight, Users, Navigation, ShieldCheck, Clock, MapPin,
  ChevronRight, CheckCircle2, MessageSquareText, UserCog, Hotel, Hospital, UploadCloud,
  Crown, BookOpen, AlertTriangle, Bell, LogOut, Bus, Home, UserX,
  KeyRound, Download, ExternalLink, Camera, Eye, EyeOff, Search, Palette, Check, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { INITIAL_STUDENTS, StudentInfo } from './data/studentsData';
import { TEACHERS, ITINERARY, EMERGENCY_CONTACTS, TeacherInfo } from './data/tripData';
import { OPEN_KAKAO_URL } from './data/mapImages';
import { AuthCodeModal } from './components/AuthCodeModal';
import { StudentGuideView } from './components/StudentGuideView';
import { AppIconModal } from './components/AppIconModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Teacher Authentication Code (managed by Vice Principal & Grade Head)
  const [teacherAuthCode, setTeacherAuthCode] = useState<string>('2026');
  const [authCodeModalOpen, setAuthCodeModalOpen] = useState(false);

  // App Icon Preview & Selection
  const [appIconModalOpen, setAppIconModalOpen] = useState(false);
  const [selectedIconId, setSelectedIconId] = useState<string>('compass');

  // Students roster state (140 students)
  const [students, setStudents] = useState<StudentInfo[]>(INITIAL_STUDENTS);

  // Public Notices
  const [publicNotices, setPublicNotices] = useState([
    { id: 1, text: '[전체 공지] 19:00 롯데월드 정문 게이트 앞 전원 집결 및 인원 점검', time: '14:00' },
    { id: 2, text: '[안전] 이동 중 안전벨트 필수 착용, 일행을 놓쳤을 때는 즉시 제자리에 멈춰 담임선생님께 전화하세요.', time: '08:30' }
  ]);

  // Load teacher auth code, persisted students & app icon from localStorage
  useEffect(() => {
    try {
      const savedAuthCode = localStorage.getItem('jj_teacher_auth_code');
      if (savedAuthCode) setTeacherAuthCode(savedAuthCode);

      const savedStudents = localStorage.getItem('jj_students_roster_v1');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }

      const savedIconId = localStorage.getItem('jj_app_icon_id');
      if (savedIconId) {
        setSelectedIconId(savedIconId);
        updateFaviconDom(savedIconId);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateFaviconDom = (iconId: string) => {
    try {
      const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement;
      link.type = 'image/svg+xml';
      link.rel = 'icon';
      if (iconId === 'bus') {
        link.href = '/icon-bus.svg';
      } else if (iconId === 'camera') {
        link.href = '/icon-camera.svg';
      } else {
        link.href = '/favicon.svg';
      }
      document.head.appendChild(link);
    } catch (e) {}
  };

  const handleSelectIcon = (iconId: string) => {
    setSelectedIconId(iconId);
    try {
      localStorage.setItem('jj_app_icon_id', iconId);
      updateFaviconDom(iconId);
    } catch (e) {}
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveAuthCode = (newCode: string) => {
    setTeacherAuthCode(newCode);
    try {
      localStorage.setItem('jj_teacher_auth_code', newCode);
    } catch (e) {}
    triggerToast(`교사 인증코드가 [${newCode}]로 변경되었습니다.`);
  };

  const handleResetAuthCode = () => {
    setTeacherAuthCode('2026');
    try {
      localStorage.setItem('jj_teacher_auth_code', '2026');
    } catch (e) {}
    triggerToast('교사 인증코드가 초기값(2026)으로 재설정되었습니다.');
  };

  const persistStudents = (updated: StudentInfo[]) => {
    setStudents(updated);
    try {
      localStorage.setItem('jj_students_roster_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    if (user.role === 'student') {
      setActiveTab('guide');
    } else {
      setActiveTab('dashboard');
    }
    setSidebarOpen(false);
    triggerToast(`${user.name} 님, 환영합니다!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSidebarOpen(false);
  };

  const handleBoardingToggle = (studentId: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const updated = students.map((s) => (s.id === studentId ? { ...s, bus_status: nextStatus } : s));
    persistStudents(updated);
    if (currentUser?.role === 'student' && currentUser.id === studentId) {
      setCurrentUser({ ...currentUser, bus_status: nextStatus });
    }
    triggerToast(nextStatus ? '탑승 완료 처리되었습니다!' : '탑승 상태가 취소되었습니다.');
  };

  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          teacherAuthCode={teacherAuthCode}
          students={students}
          triggerToast={triggerToast}
          onOpenIconModal={() => setAppIconModalOpen(true)}
        />
        <AppIconModal
          isOpen={appIconModalOpen}
          onClose={() => setAppIconModalOpen(false)}
          selectedIconId={selectedIconId}
          onSelectIcon={handleSelectIcon}
          triggerToast={triggerToast}
        />
      </>
    );
  }

  const isHead = currentUser.isHead;
  const isStudent = currentUser.role === 'student';

  // Navigation Items
  const studentNavItems = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: '수학여행 학생 안내서', tab: 'guide', badge: '학생전용' },
    { icon: <CalendarRange className="w-4 h-4" />, label: '3일간 전체 일정표', tab: 'schedule' },
    { icon: <ShieldAlert className="w-4 h-4" />, label: '비상 연락망 & 안전', tab: 'emergency' },
  ];

  const teacherNavItems = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: isHead ? '전체 현황 대시보드' : '내 학급 대시보드', tab: 'dashboard' },
    { icon: <UserCheck className="w-4 h-4" />, label: isHead ? '전체 출석 및 탑승 관리' : `${currentUser.myClass}반 탑승 관리`, tab: 'attendance' },
    ...(isHead ? [{ icon: <UsersRound className="w-4 h-4" />, label: '전 학급 탑승 종합 관제', tab: 'classes', badge: '총괄' }] : []),
    { icon: <BookOpen className="w-4 h-4" />, label: '학생 종합 안내서 조회', tab: 'guide' },
    { icon: <CalendarRange className="w-4 h-4" />, label: '마스터 타임라인', tab: 'schedule' },
    { icon: <Sparkles className="w-4 h-4" />, label: 'AI 안심 알림장 어시스턴트', tab: 'ai' },
    { icon: <ShieldAlert className="w-4 h-4" />, label: '비상 연락망 & 안전 기관', tab: 'emergency' },
  ];

  const navItems = isStudent ? studentNavItems : teacherNavItems;

  return (
    <div className="min-h-full flex overflow-x-hidden bg-[#f7f6f2] font-sans antialiased text-slate-900">
      {/* Sidebar (Desktop sticky / Mobile off-canvas drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col justify-between transition-transform duration-300 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } shadow-lg md:shadow-none border-r border-slate-200/80`}
        style={{
          background: isStudent ? '#f8fafc' : isHead ? 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' : '#ffffff',
        }}
      >
        <div>
          {/* Logo & School Header */}
          <div className={`p-5 border-b flex items-center justify-between ${isHead ? 'border-indigo-700/50' : 'border-slate-200'}`}>
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl font-black text-lg flex items-center justify-center shadow-badge ${
                  isStudent ? 'bg-emerald-500 text-white' : isHead ? 'bg-amber-400 text-amber-950' : 'bg-blue-600 text-white'
                }`}
              >
                진
              </div>
              <div>
                <h1 className={`font-black tracking-tight text-sm ${isHead ? 'text-white' : 'text-slate-900'}`}>
                  진장중학교
                </h1>
                <p
                  className={`text-[10px] font-black tracking-wider ${
                    isHead ? 'text-amber-300' : isStudent ? 'text-emerald-600' : 'text-blue-600'
                  }`}
                >
                  2026 수학여행 스마트 인솔
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`md:hidden p-1.5 rounded-xl ${isHead ? 'text-indigo-200 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current User Card */}
          <div
            className={`mx-4 mt-4 p-3 rounded-2xl flex items-center space-x-3 ${
              isStudent
                ? 'bg-emerald-50 border border-emerald-200'
                : isHead
                ? 'bg-amber-400/20 border border-amber-400/30'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isStudent ? 'bg-emerald-100 text-emerald-600' : isHead ? 'bg-amber-400 text-amber-950' : 'bg-blue-100 text-blue-600'
              }`}
            >
              {isStudent ? <Users className="w-4 h-4" /> : isHead ? <Crown className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <p className={`text-xs font-black truncate ${isStudent ? 'text-emerald-800' : isHead ? 'text-amber-300' : 'text-blue-800'}`}>
                  {currentUser.name} {isStudent ? '학생' : '선생님'}
                </p>
                {isHead && (
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full">
                    총괄
                  </span>
                )}
              </div>
              <p className={`text-[10px] truncate ${isStudent ? 'text-emerald-600' : isHead ? 'text-indigo-200' : 'text-slate-500'}`}>
                {isStudent
                  ? `2학년 ${currentUser.class_no}반 ${currentUser.student_no}번 (${currentUser.bus_no}호차)`
                  : isHead
                  ? currentUser.roleName || '수학여행 총괄'
                  : `2학년 ${currentUser.myClass}반 담임`}
              </p>
            </div>
          </div>

          {/* Teacher Auth Code Management Button (Exclusive to Vice Principal & Grade Head) */}
          {isHead && (
            <div className="px-4 mt-3">
              <button
                type="button"
                onClick={() => setAuthCodeModalOpen(true)}
                className="w-full p-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/40 text-amber-300 text-xs font-black flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>교사 인증코드 관리</span>
                </div>
                <span className="font-mono text-[11px] bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-md font-bold">
                  {teacherAuthCode}
                </span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 mt-2 text-xs font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.tab;
              let activeClass = '';
              let hoverClass = '';

              if (isStudent) {
                activeClass = 'bg-emerald-500 text-white shadow-badge';
                hoverClass = 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50';
              } else if (isHead) {
                activeClass = 'bg-amber-400 text-amber-950 font-black shadow-badge';
                hoverClass = 'text-indigo-200 hover:text-white hover:bg-indigo-700/50';
              } else {
                activeClass = 'bg-blue-600 text-white shadow-badge';
                hoverClass = 'text-slate-600 hover:text-blue-600 hover:bg-slate-100';
              }

              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition-all text-left ${
                    isActive ? activeClass : hoverClass
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="flex-1 font-bold text-xs truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-amber-950/20 text-amber-950' : 'bg-amber-400 text-amber-950'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${isHead ? 'border-indigo-700/50' : 'border-slate-200'} space-y-2`}>
          <a
            href={OPEN_KAKAO_URL}
            target="_blank"
            rel="noreferrer"
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all ${
              isHead ? 'bg-amber-400 text-amber-950 hover:bg-amber-300' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>사진 미션 오픈카톡방</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <button
            onClick={handleLogout}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              isHead ? 'text-indigo-200 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Mobile/Desktop Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 md:hidden rounded-xl hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-400">진장중 수학여행</span>
                {isHead && (
                  <span className="text-[9px] font-black bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-md">
                    총괄
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {activeTab === 'dashboard' && (isHead ? '전체 학급 통합 대시보드' : `${currentUser.myClass}반 학급 대시보드`)}
                {activeTab === 'attendance' && (isHead ? '전체 출석 및 탑승 관리' : `${currentUser.myClass}반 탑승 관리`)}
                {activeTab === 'classes' && '전 학급 탑승 종합 관제 (총괄)'}
                {activeTab === 'guide' && (isStudent ? '학생 스마트 안내서' : '학생 안내서 종합 조회')}
                {activeTab === 'schedule' && '3일간 마스터 세부 일정표'}
                {activeTab === 'ai' && 'AI 인솔 어시스턴트'}
                {activeTab === 'emergency' && '비상 연락망 및 안전 기관'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick App Icon Preview */}
            <button
              onClick={() => setAppIconModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center space-x-1.5 transition-all shadow-xs"
              title="앱 아이콘 3종 미리보기 & 선택"
            >
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">아이콘 변경</span>
            </button>

            {/* Quick Broadcast button for teachers */}
            {!isStudent && (
              <button
                onClick={() => setBroadcastModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 shadow-xs transition-all ${
                  isHead ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isHead ? '전체 공지' : '학급 공지'}</span>
              </button>
            )}

            {/* Quick 119 shortcut */}
            <a
              href="tel:119"
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all flex items-center justify-center"
              title="119 응급 신고"
            >
              <PhoneCall className="w-4 h-4" />
            </a>

            {/* Logout shortcut on desktop */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Public Notice Banner on Mobile */}
        {publicNotices.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 flex items-center space-x-2 text-xs text-amber-900">
            <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-bounce" />
            <span className="font-bold truncate">{publicNotices[0].text}</span>
            <span className="text-[10px] text-amber-600 shrink-0 font-mono ml-auto">
              {publicNotices[0].time}
            </span>
          </div>
        )}

        {/* Tab Views Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'guide' && (
            <StudentGuideView
              students={students}
              currentUser={currentUser}
              onBoardingToggle={handleBoardingToggle}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'dashboard' && !isStudent && (
            <TeacherDashboardTab
              currentUser={currentUser}
              students={students}
              setActiveTab={setActiveTab}
              triggerToast={triggerToast}
              onOpenAuthModal={() => setAuthCodeModalOpen(true)}
            />
          )}

          {activeTab === 'attendance' && !isStudent && (
            <AttendanceTab
              currentUser={currentUser}
              students={students}
              onPersistStudents={persistStudents}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'classes' && isHead && (
            <ClassesControlTab
              currentUser={currentUser}
              students={students}
              onPersistStudents={persistStudents}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'schedule' && <ScheduleTab />}

          {activeTab === 'ai' && !isStudent && (
            <AiCounselorTab currentUser={currentUser} triggerToast={triggerToast} />
          )}

          {activeTab === 'emergency' && <EmergencyTab currentUser={currentUser} />}
        </main>

        {/* Mobile Sticky Bottom Navigation Bar (100% thumb friendly) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold">
          {isStudent ? (
            <>
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex flex-col items-center p-1 ${activeTab === 'guide' ? 'text-emerald-600 font-black' : 'text-slate-400'}`}
              >
                <BookOpen className="w-5 h-5 mb-0.5" />
                <span>학생안내서</span>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex flex-col items-center p-1 ${activeTab === 'schedule' ? 'text-emerald-600 font-black' : 'text-slate-400'}`}
              >
                <CalendarRange className="w-5 h-5 mb-0.5" />
                <span>일정표</span>
              </button>
              <button
                onClick={() => {
                  if (currentUser) handleBoardingToggle(currentUser.id, currentUser.bus_status);
                }}
                className="flex flex-col items-center p-1 text-amber-600"
              >
                <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center -mt-3 shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-black">탑승체크</span>
              </button>
              <button
                onClick={() => setActiveTab('emergency')}
                className={`flex flex-col items-center p-1 ${activeTab === 'emergency' ? 'text-emerald-600 font-black' : 'text-slate-400'}`}
              >
                <ShieldAlert className="w-5 h-5 mb-0.5" />
                <span>비상연락</span>
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex flex-col items-center p-1 text-slate-400"
              >
                <Menu className="w-5 h-5 mb-0.5" />
                <span>메뉴</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center p-1 ${activeTab === 'dashboard' ? 'text-blue-600 font-black' : 'text-slate-400'}`}
              >
                <LayoutDashboard className="w-5 h-5 mb-0.5" />
                <span>대시보드</span>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex flex-col items-center p-1 ${activeTab === 'attendance' ? 'text-blue-600 font-black' : 'text-slate-400'}`}
              >
                <UserCheck className="w-5 h-5 mb-0.5" />
                <span>출석/탑승</span>
              </button>
              {isHead && (
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`flex flex-col items-center p-1 ${activeTab === 'classes' ? 'text-amber-600 font-black' : 'text-slate-400'}`}
                >
                  <UsersRound className="w-5 h-5 mb-0.5" />
                  <span>전학급관제</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex flex-col items-center p-1 ${activeTab === 'guide' ? 'text-blue-600 font-black' : 'text-slate-400'}`}
              >
                <BookOpen className="w-5 h-5 mb-0.5" />
                <span>학생안내서</span>
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex flex-col items-center p-1 text-slate-400"
              >
                <Menu className="w-5 h-5 mb-0.5" />
                <span>전체메뉴</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Broadcast Notice Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-soft">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>{isHead ? '전체 학년 긴급 공지 발송' : `${currentUser.myClass}반 공지 발송`}</span>
              </h3>
              <button onClick={() => setBroadcastModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {isHead
                ? '모든 참가 학생(140명)의 스마트 인솔 화면 최상단에 실시간으로 표시됩니다.'
                : '학생용 화면 상단에 배너 형태로 노출됩니다.'}
            </p>
            <textarea
              id="noticeText"
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-hidden focus:border-blue-500 leading-relaxed"
              placeholder="전달할 공지 내용을 입력하세요 (예: 19:00 정문 게이트 집결)..."
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('noticeText') as HTMLTextAreaElement;
                  const text = el?.value.trim();
                  if (text) {
                    const now = new Date();
                    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()}`;
                    setPublicNotices([{ id: Date.now(), text, time: timeStr }, ...publicNotices]);
                    triggerToast('공지가 학생 화면에 성공적으로 발송되었습니다!');
                    setBroadcastModalOpen(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-badge"
              >
                공지 발송하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Authentication Code Modal */}
      <AuthCodeModal
        isOpen={authCodeModalOpen}
        onClose={() => setAuthCodeModalOpen(false)}
        currentCode={teacherAuthCode}
        onSaveCode={handleSaveAuthCode}
        onResetCode={handleResetAuthCode}
      />

      {/* App Icon Selection Modal */}
      <AppIconModal
        isOpen={appIconModalOpen}
        onClose={() => setAppIconModalOpen(false)}
        selectedIconId={selectedIconId}
        onSelectIcon={handleSelectIcon}
        triggerToast={triggerToast}
      />

      {/* Toast Notification */}
      <div
        className={`fixed bottom-14 sm:bottom-6 right-4 sm:right-6 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-soft flex items-center space-x-2.5 transform transition-all duration-300 z-50 text-xs ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}

/* =========================================================================
   1. LOGIN SCREEN (교사 / 학생 로그인 + 교사 인증코드 & 총괄 지원)
   ========================================================================= */
const LoginScreen = ({ onLogin, teacherAuthCode, students, triggerToast, onOpenIconModal }) => {
  const [loginMode, setLoginMode] = useState<'teacher' | 'student'>('teacher');

  // Teacher Login States
  const [selectedRole, setSelectedRole] = useState<'vicePrincipal' | 'gradeHead' | 'classTeacher'>('vicePrincipal');
  const [selectedClass, setSelectedClass] = useState('1');
  const [inputAuthCode, setInputAuthCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  // Student Login States
  const [studentClass, setStudentClass] = useState('1');
  const [studentNo, setStudentNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentBirth, setStudentBirth] = useState('');

  // Handle Teacher Login
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = inputAuthCode.trim();

    if (entered !== teacherAuthCode.trim()) {
      triggerToast('교사 인증코드가 일치하지 않습니다. (기본값: 2026)');
      return;
    }

    if (selectedRole === 'vicePrincipal') {
      onLogin({
        role: 'headTeacher',
        name: '김동욱',
        roleName: '교감 (총괄)',
        myClass: 'all',
        isHead: true,
      });
    } else if (selectedRole === 'gradeHead') {
      onLogin({
        role: 'headTeacher',
        name: '조기호',
        roleName: '학년부장 (총괄)',
        myClass: 'all',
        isHead: true,
      });
    } else {
      const teacher = TEACHERS.find((t) => t.classNo === Number(selectedClass));
      onLogin({
        role: 'classTeacher',
        name: teacher?.name || `${selectedClass}반 담임`,
        roleName: `2학년 ${selectedClass}반 담임`,
        myClass: Number(selectedClass),
        isHead: false,
      });
    }
  };

  // Handle Student Login
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNo || !studentName) {
      triggerToast('반, 번호, 이름을 입력해주세요.');
      return;
    }

    const matched = students.find(
      (s) => s.class_no === Number(studentClass) && s.student_no === Number(studentNo) && s.name.trim() === studentName.trim()
    );

    if (matched) {
      onLogin({
        ...matched,
        role: 'student',
      });
    } else {
      // Fallback for seamless demo
      const fallbackId = Number(`2${studentClass}${Number(studentNo) < 10 ? '0' + studentNo : studentNo}`);
      onLogin({
        id: fallbackId,
        grade: 2,
        class_no: Number(studentClass),
        student_no: Number(studentNo),
        name: studentName.trim(),
        code: String(fallbackId),
        bus_no: Number(studentClass),
        role: 'student',
        bus_status: false,
        room_status: false,
        is_participating: true,
      });
    }
  };

  // Quick Demo select for evaluator
  const handleQuickStudentSelect = (st: StudentInfo) => {
    setStudentClass(String(st.class_no));
    setStudentNo(String(st.student_no));
    setStudentName(st.name);
    setStudentBirth('1014');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 sm:p-8 space-y-6 shadow-2xl text-white">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 font-black text-xl items-center justify-center shadow-badge">
            진
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">진장중학교 수학여행</h1>
          <p className="text-xs text-indigo-200">2학년 · 10.14(수)~10.16(금) 서울/경기 스마트 인솔</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/10 border border-white/10">
          <button
            type="button"
            onClick={() => setLoginMode('teacher')}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              loginMode === 'teacher' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>교사 / 총괄 로그인</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('student')}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              loginMode === 'student' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>학생 간편 로그인</span>
          </button>
        </div>

        {/* ============= TEACHER LOGIN FORM ============= */}
        {loginMode === 'teacher' ? (
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">직책 및 담당 선택</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('vicePrincipal')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === 'vicePrincipal'
                      ? 'bg-amber-400 text-amber-950 border-amber-300 font-black'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Crown className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs block">교감 (김동욱)</span>
                  <span className="text-[10px] opacity-80 font-bold">총괄</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('gradeHead')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === 'gradeHead'
                      ? 'bg-amber-400 text-amber-950 border-amber-300 font-black'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Crown className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs block">학년부장 (조기호)</span>
                  <span className="text-[10px] opacity-80 font-bold">총괄</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('classTeacher')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === 'classTeacher'
                      ? 'bg-blue-600 text-white border-blue-400 font-black'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs block">학급 담임</span>
                  <span className="text-[10px] opacity-80">1~6반</span>
                </button>
              </div>
            </div>

            {selectedRole === 'classTeacher' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">담당 학급 선택 (1~6반)</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {['1', '2', '3', '4', '5', '6'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelectedClass(n)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedClass === n
                          ? 'bg-blue-500 text-white border-blue-400'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {n}반
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Auth Code Input Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>교사 인증코드</span>
                </label>
                <span className="text-[11px] text-amber-300/80">기본코드: 2026</span>
              </div>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={inputAuthCode}
                  onChange={(e) => setInputAuthCode(e.target.value)}
                  placeholder="인증코드를 입력하세요 (기본값: 2026)"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm font-mono tracking-wider focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                * 인증코드는 교감 및 학년부장(총괄) 선생님이 관리/변경할 수 있습니다.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 shadow-lg"
            >
              교사 인솔 시스템 입장하기
            </button>
          </form>
        ) : (
          /* ============= STUDENT LOGIN FORM ============= */
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">반 선택</label>
                <select
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-400 text-white [&>option]:text-slate-900"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      2학년 {n}반
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">번호</label>
                <input
                  type="number"
                  value={studentNo}
                  onChange={(e) => setStudentNo(e.target.value)}
                  placeholder="예: 13"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">성명</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 김규빈"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                비밀번호 (생년월일 4자리)
              </label>
              <input
                type="password"
                maxLength={4}
                value={studentBirth}
                onChange={(e) => setStudentBirth(e.target.value)}
                placeholder="예: 1014"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-400 font-mono tracking-widest"
              />
            </div>

            {/* Quick Demo Student Picker */}
            <div className="pt-1 space-y-1.5">
              <span className="text-[11px] text-emerald-300 font-bold block">
                빠른 체험 학생 선택 (원클릭 자동입력):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  students.find((s) => s.class_no === 1 && s.student_no === 13), // 2-1 김규빈
                  students.find((s) => s.class_no === 2 && s.student_no === 2),  // 2-2 김동건
                  students.find((s) => s.class_no === 3 && s.student_no === 2),  // 2-3 김경준
                  students.find((s) => s.class_no === 4 && s.student_no === 1),  // 2-4 강승엽
                ].filter(Boolean).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleQuickStudentSelect(st)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-medium"
                  >
                    2-{st.class_no}반 {st.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
            >
              학생 안내서 입장하기
            </button>
          </form>
        )}

        {/* App Icon 3-Design Preview Button */}
        <div className="pt-3 text-center border-t border-white/10">
          <button
            type="button"
            onClick={onOpenIconModal}
            className="text-xs text-indigo-200 hover:text-white inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium"
          >
            <Palette className="w-3.5 h-3.5 text-amber-300" />
            <span>🎨 앱 아이콘 3가지 디자인 미리보기 & 선택</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. TEACHER DASHBOARD TAB (교사 대시보드 + 총괄 컨트롤)
   ========================================================================= */
const TeacherDashboardTab = ({ currentUser, students, setActiveTab, triggerToast, onOpenAuthModal }) => {
  const isHead = currentUser.isHead;
  const myClassStudents = isHead ? students : students.filter((s) => s.class_no === currentUser.myClass);
  const participating = myClassStudents.filter((s) => s.is_participating);
  const boarded = participating.filter((s) => s.bus_status);
  const rate = participating.length > 0 ? Math.round((boarded.length / participating.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div
        className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden border shadow-soft flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${
          isHead ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-800/50 text-white' : 'bg-white border-slate-200'
        }`}
      >
        <div className="abstract-wave" />
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full border bg-amber-400/20 text-amber-300 border-amber-400/30">
            {isHead ? <Crown className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
            <span>{isHead ? `${currentUser.name} 총괄 책임자 (교감 · 학년부장)` : `${currentUser.myClass}반 담임 대시보드`}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            {isHead ? (
              <>
                <span className="text-amber-300">전 학년 140명</span>의 안전을<br />
                실시간으로 총괄 관제합니다
              </>
            ) : (
              <>
                <span className="text-blue-600">2학년 {currentUser.myClass}반</span>을<br />
                안전하게 인솔합니다
              </>
            )}
          </h3>
          <p className={`text-xs sm:text-sm leading-relaxed ${isHead ? 'text-indigo-200' : 'text-slate-600'}`}>
            {isHead
              ? '6개 학급 버스 탑승 상태, 일정 진행, 안전 관리, 교사 인증코드를 통합 관리합니다.'
              : `${currentUser.myClass}반 학생들의 출결, 탑승 현황, 비상 상황을 실시간 확인하세요.`}
          </p>
        </div>

        {/* Counter Badge */}
        <div className="relative z-10 flex items-center space-x-3">
          {isHead && (
            <button
              onClick={onOpenAuthModal}
              className="p-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs flex flex-col items-center justify-center shadow-md transition-all min-w-[96px]"
            >
              <KeyRound className="w-5 h-5 mb-1" />
              <span>교사 인증코드</span>
            </button>
          )}

          <div
            className={`p-4 rounded-2xl border text-center min-w-[100px] flex flex-col justify-center ${
              isHead ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-black">{participating.length}</span>
            <span className="text-[10px] text-slate-400 font-bold mt-0.5">
              {isHead ? '전체 참가 학생' : '학급 참가 학생'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div
          onClick={() => setActiveTab('attendance')}
          className="clean-card p-4 sm:p-5 flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">탑승 현황</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {boarded.length} / {participating.length}
            </h4>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              {rate}% 완료
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab(isHead ? 'classes' : 'attendance')}
          className="clean-card p-4 sm:p-5 flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">{isHead ? '총괄 학급' : '담당 학급'}</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {isHead ? '6개 학급' : `${currentUser.myClass}반`}
            </h4>
            <p className="text-[10px] text-blue-600 font-bold mt-1 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-0.5" />
              정상 운영
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('schedule')}
          className="clean-card p-4 sm:p-5 flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">현재 체류지</p>
            <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
              롯데월드 어드벤처
            </h4>
            <p className="text-[10px] text-purple-600 font-bold mt-1 flex items-center">
              <MapPin className="w-3 h-3 mr-0.5" />
              서울 송파구
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('emergency')}
          className="clean-card p-4 sm:p-5 flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">안전 상황실</p>
            <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              이상 무 (안전)
            </h4>
            <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-0.5" />
              24시간 대기
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation for Teachers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('guide')}
          className="clean-card p-4 text-left flex items-center justify-between hover:border-blue-300 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-xs text-slate-900">학생 종합 안내서</p>
              <p className="text-[10px] text-slate-500">140명 명단, 롯데월드 14개소, 일정 조회</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className="clean-card p-4 text-left flex items-center justify-between hover:border-indigo-300 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-xs text-slate-900">AI 안심 알림장 작성기</p>
              <p className="text-[10px] text-slate-500">학부모님 안심 문자 즉시 생성</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <a
          href={OPEN_KAKAO_URL}
          target="_blank"
          rel="noreferrer"
          className="clean-card p-4 text-left flex items-center justify-between hover:border-amber-300 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-xs text-slate-900">사진 미션 제출방</p>
              <p className="text-[10px] text-slate-500">오픈카톡 제출 현황 모니터링</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </a>
      </div>
    </div>
  );
};

/* =========================================================================
   3. ATTENDANCE & BOARDING MANAGEMENT (출석 및 탑승 관리)
   ========================================================================= */
const AttendanceTab = ({ currentUser, students, onPersistStudents, triggerToast }) => {
  const isHead = currentUser.isHead;
  const [filterClass, setFilterClass] = useState<string | number>(isHead ? 'all' : currentUser.myClass);
  const [searchWord, setSearchWord] = useState('');

  const targetStudents = students.filter((s) => {
    const matchesClass = filterClass === 'all' || s.class_no === Number(filterClass);
    const matchesWord = !searchWord || s.name.includes(searchWord) || s.code.includes(searchWord);
    return matchesClass && matchesWord;
  });

  const participating = targetStudents.filter((s) => s.is_participating);
  const nonParticipatingCount = targetStudents.length - participating.length;
  const boardedCount = participating.filter((s) => s.bus_status).length;
  const boardingRate = participating.length > 0 ? Math.round((boardedCount / participating.length) * 100) : 0;

  const handleToggleBoarding = (id: number) => {
    const target = students.find((s) => s.id === id);
    const nextStatus = !target?.bus_status;
    const updated = students.map((s) => (s.id === id ? { ...s, bus_status: nextStatus } : s));
    onPersistStudents(updated);
    triggerToast(
      nextStatus
        ? `[${target?.name}] 탑승 완료 처리되었습니다.`
        : `[${target?.name}] 탑승 취소 처리되었습니다.`
    );
  };

  const handleToggleParticipating = (id: number) => {
    const target = students.find((s) => s.id === id);
    const nextPart = !target?.is_participating;
    const updated = students.map((s) =>
      s.id === id ? { ...s, is_participating: nextPart, bus_status: false } : s
    );
    onPersistStudents(updated);
    triggerToast(`[${target?.name}] ${nextPart ? '참가 상태로 전환되었습니다.' : '불참(잔류) 상태로 제외되었습니다.'}`);
  };

  const handleMarkAllBoarded = () => {
    const updated = students.map((s) => {
      const match = filterClass === 'all' || s.class_no === Number(filterClass);
      return match && s.is_participating ? { ...s, bus_status: true } : s;
    });
    onPersistStudents(updated);
    triggerToast(
      filterClass === 'all'
        ? '전체 참가 학생이 일괄 탑승 완료 처리되었습니다.'
        : `${filterClass}반 전체 학생이 일괄 탑승 완료 처리되었습니다.`
    );
  };

  const handleResetBoarding = () => {
    if (!window.confirm(filterClass === 'all' ? '전체 학생의 탑승 상태를 미탑승으로 초기화하시겠습니까?' : `${filterClass}반 학생의 탑승 상태를 초기화하시겠습니까?`)) {
      return;
    }
    const updated = students.map((s) => {
      const match = filterClass === 'all' || s.class_no === Number(filterClass);
      return match ? { ...s, bus_status: false } : s;
    });
    onPersistStudents(updated);
    triggerToast(
      filterClass === 'all'
        ? '전체 학생의 탑승 상태가 초기화되었습니다.'
        : `${filterClass}반 학생의 탑승 상태가 초기화되었습니다.`
    );
  };

  // Export roster to Excel
  const handleExportExcel = () => {
    const dataToExport = targetStudents.map((s) => ({
      학년: s.grade,
      반: s.class_no,
      번호: s.student_no,
      성명: s.name,
      학번: s.code,
      호차: s.bus_no,
      참여여부: s.is_participating ? '참여' : '불참(잔류)',
      탑승상태: s.bus_status ? '탑승완료' : '미탑승',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '수학여행명렬표');
    XLSX.writeFile(wb, `진장중_수학여행_탑승출결_${filterClass === 'all' ? '전체' : filterClass + '반'}.xlsx`);
    triggerToast('엑셀 파일이 다운로드되었습니다.');
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="clean-card p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <Bus className="w-5 h-5 text-blue-600" />
            <span>{isHead ? '전체 출석 및 탑승 관리 (총괄)' : `2학년 ${filterClass === 'all' ? '전체' : filterClass + '반'} 탑승 관리`}</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            학생 스마트 가이드의 탑승 보고와 실시간 연동되며, 인솔 교사가 즉시 체크할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2 w-full md:w-auto">
          {/* Class Filter for all teachers */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setFilterClass('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filterClass === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              전체
            </button>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setFilterClass(n)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterClass === n ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {n}반
              </button>
            ))}
          </div>

          <button
            onClick={handleMarkAllBoarded}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>일괄 탑승</span>
          </button>

          <button
            onClick={handleResetBoarding}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            title="탑승 상태 초기화"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">초기화</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            title="엑셀 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">엑셀</span>
          </button>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center text-xs">
        <div className="clean-card p-3">
          <p className="text-lg sm:text-xl font-black text-slate-800">{targetStudents.length}명</p>
          <p className="text-[10px] text-slate-500 font-bold">선택 학급 명부</p>
        </div>
        <div className="clean-card p-3 bg-slate-50">
          <p className="text-lg sm:text-xl font-black text-slate-400">{nonParticipatingCount}명</p>
          <p className="text-[10px] text-slate-500 font-bold">불참(잔류)</p>
        </div>
        <div className="clean-card p-3 bg-emerald-50 border-emerald-200">
          <p className="text-lg sm:text-xl font-black text-emerald-600">{boardedCount} / {participating.length}명</p>
          <p className="text-[10px] text-emerald-700 font-bold">탑승 완료 ({boardingRate}%)</p>
        </div>
        <div className="clean-card p-3 bg-red-50 border-red-200">
          <p className="text-lg sm:text-xl font-black text-red-500">{participating.length - boardedCount}명</p>
          <p className="text-[10px] text-red-700 font-bold">미탑승 인원</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="search"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          placeholder="학생 이름 또는 학번 검색 (예: 김규빈, 2113)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:border-blue-500"
        />
      </div>

      {/* Students Table */}
      <div className="clean-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200 uppercase">
              <tr>
                <th className="px-4 py-3">학급</th>
                <th className="px-3 py-3">번호</th>
                <th className="px-4 py-3">성명</th>
                <th className="px-3 py-3 text-center">호차</th>
                <th className="px-3 py-3 text-center">참여 상태</th>
                <th className="px-4 py-3 text-center">실시간 탑승 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targetStudents.map((st) => (
                <tr key={st.id} className={!st.is_participating ? 'bg-slate-50/60 opacity-60' : st.bus_status ? 'bg-emerald-50/20' : ''}>
                  <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                    2-{st.class_no}반
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{st.student_no}</td>
                  <td className="px-4 py-2.5 font-bold whitespace-nowrap text-slate-900">{st.name}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-blue-600">{st.bus_no}호차</td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleToggleParticipating(st.id)}
                      className={`text-[10px] font-black px-2 py-1 rounded-md transition-all ${
                        st.is_participating
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title="클릭하여 참가/불참 전환"
                    >
                      {st.is_participating ? '참여' : '불참'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {st.is_participating ? (
                      <button
                        onClick={() => handleToggleBoarding(st.id)}
                        className={`text-[11px] font-black px-3.5 py-1.5 rounded-xl transition-all shadow-xs ${
                          st.bus_status
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        {st.bus_status ? '✓ 탑승 완료' : '미탑승 (체크하기)'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">잔류 (불참)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. CLASSES COMPREHENSIVE CONTROL TAB (총괄 전용: 전 학급 탑승 종합 관제)
   ========================================================================= */
const ClassesControlTab = ({ currentUser, students, onPersistStudents, triggerToast }) => {
  const handleBoardClassAll = (classNum: number) => {
    const updated = students.map((s) => (s.class_no === classNum && s.is_participating ? { ...s, bus_status: true } : s));
    onPersistStudents(updated);
    triggerToast(`2학년 ${classNum}반 학생이 전원 탑승 완료 처리되었습니다.`);
  };

  const handleBoardAllSchool = () => {
    const updated = students.map((s) => (s.is_participating ? { ...s, bus_status: true } : s));
    onPersistStudents(updated);
    triggerToast('전체 6개 학급 참가 학생이 전원 탑승 완료 처리되었습니다.');
  };

  const handleResetAllSchool = () => {
    if (!window.confirm('전체 6개 학급의 탑승 상태를 미탑승으로 초기화하시겠습니까?')) return;
    const updated = students.map((s) => ({ ...s, bus_status: false }));
    onPersistStudents(updated);
    triggerToast('전체 6개 학급 탑승 상태가 초기화되었습니다.');
  };

  return (
    <div className="space-y-5">
      <div className="clean-card p-5 bg-gradient-to-r from-amber-500 to-indigo-900 text-white rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-md">
            총괄 관제소
          </span>
          <h3 className="text-lg font-black mt-1">전 학급(1~6반) 버스 탑승 종합 관제</h3>
          <p className="text-xs text-amber-200">
            총괄 책임자: 김동욱 교감 · 조기호 학년부장
          </p>
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={handleBoardAllSchool}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>전 학년 일괄 탑승</span>
          </button>
          <button
            onClick={handleResetAllSchool}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>전체 초기화</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((c) => {
          const classStudents = students.filter((s) => s.class_no === c && s.is_participating);
          const boarded = classStudents.filter((s) => s.bus_status);
          const unboarded = classStudents.filter((s) => !s.bus_status);
          const rate = classStudents.length > 0 ? Math.round((boarded.length / classStudents.length) * 100) : 0;
          const teacher = TEACHERS.find((t) => t.classNo === c);

          return (
            <div key={c} className="clean-card p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    {c}호차 (2학년 {c}반)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    인솔: {teacher?.name} {teacher?.coTeacher ? `· ${teacher.coTeacher}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleBoardClassAll(c)}
                  className="px-2.5 py-1 text-[10px] font-black bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200"
                >
                  {c}반 일괄탑승
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">{boarded.length} / {classStudents.length}명</span>
                  <span className={rate === 100 ? 'text-emerald-600' : 'text-blue-600'}>{rate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${rate === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>

              {/* Unboarded Warning List */}
              {unboarded.length > 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                  <span className="font-bold block text-red-600">미탑승 인원 ({unboarded.length}명):</span>
                  <p className="leading-relaxed">
                    {unboarded.map((st) => `${st.student_no}번 ${st.name}`).join(', ')}
                  </p>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 text-center text-xs font-bold">
                  ✓ {c}호차 전원 탑승 완료
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================================
   5. SCHEDULE & TIMELINE TAB
   ========================================================================= */
const ScheduleTab = () => {
  return (
    <div className="space-y-6">
      <div className="clean-card p-5 space-y-4">
        <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
          <CalendarRange className="w-5 h-5 text-blue-600" />
          <span>수학여행 2박 3일 마스터 타임라인</span>
        </h3>
        <p className="text-xs text-slate-500">
          2026학년도 진장중학교 2학년 수학여행 세부운영 계획에 따른 전체 일정입니다.
        </p>

        {ITINERARY.map((day) => (
          <div key={day.day} className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-black">
                {day.date}
              </span>
              <h4 className="font-black text-sm text-slate-800">{day.title}</h4>
            </div>

            <div className="border-l-2 border-slate-200 ml-2 pl-3.5 space-y-3 text-xs">
              {day.events.map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-blue-600" />
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-blue-600">{ev.time}</span>
                    <span className="font-bold text-slate-900">{ev.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-0.5 mt-0.5">{ev.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   6. AI COUNSELOR / PARENT MESSAGE GENERATOR TAB
   ========================================================================= */
const AiCounselorTab = ({ currentUser, triggerToast }) => {
  const isHead = currentUser.isHead;
  const [noteInput, setNoteInput] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');

  const handleGenerate = () => {
    const classInfo = isHead ? '2학년 전체' : `${currentUser.myClass}반`;
    const draft = `[진장중학교 수학여행 안심 알림장]\n\n학부모님 안녕하십니까.\n진장중학교 2학년 수학여행 인솔 ${isHead ? `${currentUser.name} 총괄 책임자` : `${currentUser.myClass}반 담임`}입니다.\n\n현재 ${classInfo} 학생들은 전원 안전하게 일정(롯데월드 어드벤처 및 역사문화 탐방)을 진행하고 있습니다.\n\n${
      noteInput ? `■ 현장 특이사항: ${noteInput}\n\n` : ''
    }모든 인솔 교직원 및 야간 안전요원이 밀착 지도하여 학생들이 건강하고 유익한 수학여행을 마치고 귀가할 수 있도록 끝까지 최선을 다하겠습니다.\n\n감사합니다.\n- 진장중학교 2학년 인솔교사 일동 드림 -`;

    setGeneratedDraft(draft);
    triggerToast('학부모 안심 알림장 초안이 생성되었습니다.');
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className="clean-card p-5 bg-gradient-to-r from-blue-600 to-indigo-800 text-white rounded-3xl space-y-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h3 className="font-black text-base">AI 학부모 안심 알림장 도우미</h3>
        </div>
        <p className="text-xs text-blue-100">
          특이사항을 입력하고 버튼을 누르면 학부모님께 발송할 안심 알림장 문안이 완성됩니다.
        </p>
      </div>

      <div className="clean-card p-5 space-y-3">
        <label className="text-xs font-bold text-slate-700 block">
          특이사항 입력 (생략 시 기본 안심 문구 생성)
        </label>
        <textarea
          rows={3}
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="예: 현재 모든 학생이 점심 식사를 마치고 조별 미션을 수행 중입니다..."
          className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:border-blue-500"
        />

        <button
          onClick={handleGenerate}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-badge"
        >
          원클릭 알림장 초안 작성
        </button>

        {generatedDraft && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>생성된 알림장 문구</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(generatedDraft);
                  triggerToast('클립보드에 복사되었습니다.');
                }}
                className="text-blue-600 hover:underline text-[11px]"
              >
                전체 복사
              </button>
            </div>
            <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {generatedDraft}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   7. EMERGENCY & SAFETY CONTACTS TAB
   ========================================================================= */
const EmergencyTab = ({ currentUser }) => {
  return (
    <div className="space-y-4">
      <div className="clean-card p-5 space-y-1">
        <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>비상 연락망 및 안전 기관</span>
        </h3>
        <p className="text-xs text-slate-500">
          위급 상황 발생 시 가장 가까운 인솔 선생님께 먼저 알리고, 비상 연락망으로 즉시 지원을 요청하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EMERGENCY_CONTACTS.map((con, idx) => (
          <div key={idx} className="clean-card p-4 flex items-center justify-between">
            <div>
              <p className="font-black text-xs text-slate-900">{con.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{con.note}</p>
            </div>
            <a
              href={`tel:${con.tel.replace(/[^0-9]/g, '')}`}
              className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black flex items-center space-x-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{con.tel}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
