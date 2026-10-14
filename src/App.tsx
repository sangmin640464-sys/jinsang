// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, UserCheck, UsersRound, CalendarRange,
  Sparkles, ShieldAlert, X, Menu, Megaphone, Send, PhoneCall,
  ArrowUpRight, Users, Navigation, ShieldCheck, Clock, MapPin,
  ChevronRight, CheckCircle2, MessageSquareText, UserCog, Hotel, Hospital, UploadCloud,
  Crown, BookOpen, AlertTriangle, Bell, LogOut, Bus, Home, UserX,
  KeyRound, Download, ExternalLink, Camera, Eye, EyeOff, Search, Palette, Check, RefreshCw, HelpCircle,
  Trash2, SlidersHorizontal, ArrowUp, ArrowDown, RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { INITIAL_STUDENTS, StudentInfo } from './data/studentsData';
import { TEACHERS, ITINERARY, EMERGENCY_CONTACTS, TeacherInfo } from './data/tripData';
import { OPEN_KAKAO_URL } from './data/mapImages';
import { AuthCodeModal } from './components/AuthCodeModal';
import { StudentGuideView } from './components/StudentGuideView';
import { ParentCommunicationView } from './components/ParentCommunicationView';
import { TeacherParentCommunicationView } from './components/TeacherParentCommunicationView';
import { StudentQuizView } from './components/activities/StudentQuizView';
import { StudentPhotoMissionView } from './components/activities/StudentPhotoMissionView';
import { TeacherActivityManagerView } from './components/activities/TeacherActivityManagerView';
import { ActivityAlertModal, ActivityAlertData } from './components/activities/ActivityAlertModal';
import { RoomAllocationView } from './components/RoomAllocationView';
import { alertSoundPlayer, showSystemNotification, requestNotificationPermission } from './utils/alertEffects';
import {
  getPublicNotices,
  sendPublicNotice,
  deleteNotice,
  deleteAllNotices,
  subscribeToUpdates,
  getQuizzes,
  getMissions,
  getNavConfig,
  saveNavConfig,
  NavConfig,
  DEFAULT_NAV_CONFIG,
  PublicNoticeItem,
  DEFAULT_PUBLIC_NOTICES
} from './utils/communicationService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Teacher Navigation Custom Order & Visibility State
  const DEFAULT_TEACHER_NAV_ORDER = DEFAULT_NAV_CONFIG.teacherOrder || [
    'dashboard',
    'attendance',
    'rooms_management',
    'classes',
    'activities_control',
    'parent_communication',
    'guide',
    'schedule',
    'ai',
    'emergency'
  ];
  const [teacherNavOrder, setTeacherNavOrder] = useState<string[]>(DEFAULT_TEACHER_NAV_ORDER);
  const [hiddenTeacherMenus, setHiddenTeacherMenus] = useState<string[]>([]);
  const [hiddenStudentMenus, setHiddenStudentMenus] = useState<string[]>([]);
  const [navOrderModalOpen, setNavOrderModalOpen] = useState(false);
  const [isNavInlineEdit, setIsNavInlineEdit] = useState(false);
  const [navModalActiveTab, setNavModalActiveTab] = useState<'teacher' | 'student'>('teacher');

  // Mapping from teacher menu tab to corresponding student menu tabs
  const TEACHER_TO_STUDENT_TAB_MAP: Record<string, string[]> = {
    rooms_management: ['student_rooms'],
    activities_control: ['quiz', 'photo_mission'],
    schedule: ['schedule'],
    guide: ['guide'],
    emergency: ['emergency'],
  };

  const moveTeacherNavItem = async (tabKey: string, direction: 'up' | 'down') => {
    const index = teacherNavOrder.indexOf(tabKey);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= teacherNavOrder.length) return;

    const next = [...teacherNavOrder];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    setTeacherNavOrder(next);
    await saveNavConfig(
      {
        teacherOrder: next,
        hiddenTeacherMenus,
        hiddenStudentMenus,
      },
      currentUser?.name || '담임교사'
    );
  };

  const toggleTeacherNavItemVisibility = async (tabKey: string) => {
    const isCurrentlyHidden = hiddenTeacherMenus.includes(tabKey);
    const nextHiddenTeachers = isCurrentlyHidden
      ? hiddenTeacherMenus.filter((k) => k !== tabKey)
      : [...hiddenTeacherMenus, tabKey];

    // Check linked student tabs and sync them too
    const linkedStudentTabs = TEACHER_TO_STUDENT_TAB_MAP[tabKey] || [];
    let nextHiddenStudents = [...hiddenStudentMenus];
    if (linkedStudentTabs.length > 0) {
      if (isCurrentlyHidden) {
        nextHiddenStudents = nextHiddenStudents.filter((k) => !linkedStudentTabs.includes(k));
      } else {
        linkedStudentTabs.forEach((sk) => {
          if (!nextHiddenStudents.includes(sk)) nextHiddenStudents.push(sk);
        });
      }
    }

    setHiddenTeacherMenus(nextHiddenTeachers);
    setHiddenStudentMenus(nextHiddenStudents);

    await saveNavConfig(
      {
        teacherOrder: teacherNavOrder,
        hiddenTeacherMenus: nextHiddenTeachers,
        hiddenStudentMenus: nextHiddenStudents,
      },
      currentUser?.name || '담임교사'
    );

    if (isCurrentlyHidden) {
      triggerToast(`'${tabKey}' 메뉴가 노출 상태로 변경되었습니다.`);
    } else {
      triggerToast(
        linkedStudentTabs.length > 0
          ? `'${tabKey}' 메뉴가 숨김 처리되었습니다. (학생 화면에서도 동시 숨김)`
          : `'${tabKey}' 메뉴가 교사 사이드바에서 숨김 처리되었습니다.`
      );
    }
  };

  const toggleStudentNavItemVisibility = async (studentTabKey: string) => {
    const isCurrentlyHidden = hiddenStudentMenus.includes(studentTabKey);
    const nextHiddenStudents = isCurrentlyHidden
      ? hiddenStudentMenus.filter((k) => k !== studentTabKey)
      : [...hiddenStudentMenus, studentTabKey];

    setHiddenStudentMenus(nextHiddenStudents);

    await saveNavConfig(
      {
        teacherOrder: teacherNavOrder,
        hiddenTeacherMenus,
        hiddenStudentMenus: nextHiddenStudents,
      },
      currentUser?.name || '담임교사'
    );

    const studentTabNames: Record<string, string> = {
      guide: '학생 종합 안내서',
      student_rooms: '학생 숙소 방배치',
      quiz: '실시간 돌발 퀴즈',
      photo_mission: '사진 인증 미션',
      schedule: '수학여행세부일정표',
      emergency: '비상 연락망 & 안전',
    };
    const tabName = studentTabNames[studentTabKey] || studentTabKey;

    if (isCurrentlyHidden) {
      triggerToast(`학생 메뉴 '${tabName}'이(가) 학생들에게 공개(노출)되었습니다.`);
    } else {
      triggerToast(`학생 메뉴 '${tabName}'이(가) 학생 화면에서 숨김 처리되었습니다.`);
    }
  };

  const setAllStudentMenusVisible = async () => {
    setHiddenStudentMenus([]);
    await saveNavConfig(
      {
        teacherOrder: teacherNavOrder,
        hiddenTeacherMenus,
        hiddenStudentMenus: [],
      },
      currentUser?.name || '담임교사'
    );
    triggerToast('모든 학생 메뉴가 학생들에게 공개되었습니다.');
  };

  const hideAllStudentActivityMenus = async () => {
    const activityKeys = ['quiz', 'photo_mission', 'student_rooms'];
    const nextHidden = Array.from(new Set([...hiddenStudentMenus, ...activityKeys]));
    setHiddenStudentMenus(nextHidden);
    await saveNavConfig(
      {
        teacherOrder: teacherNavOrder,
        hiddenTeacherMenus,
        hiddenStudentMenus: nextHidden,
      },
      currentUser?.name || '담임교사'
    );
    triggerToast('돌발 퀴즈, 사진 미션, 숙소 방배치 메뉴가 학생 화면에서 비공개 처리되었습니다.');
  };

  const resetTeacherNavOrder = async () => {
    setTeacherNavOrder(DEFAULT_TEACHER_NAV_ORDER);
    setHiddenTeacherMenus([]);
    setHiddenStudentMenus([]);
    await saveNavConfig(
      {
        teacherOrder: DEFAULT_TEACHER_NAV_ORDER,
        hiddenTeacherMenus: [],
        hiddenStudentMenus: [],
      },
      currentUser?.name || '담임교사'
    );
    triggerToast('메뉴 순서 및 숨김 설정이 모두 기본값으로 초기화되었습니다.');
  };

  // Teacher Authentication Code (managed by Vice Principal & Grade Head)
  const [teacherAuthCode, setTeacherAuthCode] = useState<string>('2026');
  const [authCodeModalOpen, setAuthCodeModalOpen] = useState(false);

  // App Icon (Unified to Yellow Bus)
  const [selectedIconId, setSelectedIconId] = useState<string>('bus');

  // Students roster state (140 students)
  const [students, setStudents] = useState<StudentInfo[]>(INITIAL_STUDENTS);

  // Public Notices (Synced via Supabase class_notices)
  const [publicNotices, setPublicNotices] = useState<PublicNoticeItem[]>(DEFAULT_PUBLIC_NOTICES);
  const [selectedNotice, setSelectedNotice] = useState<PublicNoticeItem | null>(null);
  const [broadcastTarget, setBroadcastTarget] = useState<'student' | 'parent'>('student');
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);

  // Load teacher auth code, persisted students, app icon & auto-login user from localStorage
  useEffect(() => {
    try {
      const savedAuthCode = localStorage.getItem('jj_teacher_auth_code');
      if (savedAuthCode) setTeacherAuthCode(savedAuthCode);

      getNavConfig().then((cfg) => {
        if (cfg.teacherOrder && cfg.teacherOrder.length > 0) {
          const fullOrder = [...cfg.teacherOrder];
          DEFAULT_TEACHER_NAV_ORDER.forEach((key) => {
            if (!fullOrder.includes(key)) fullOrder.push(key);
          });
          setTeacherNavOrder(fullOrder);
        }
        if (cfg.hiddenTeacherMenus) {
          setHiddenTeacherMenus(cfg.hiddenTeacherMenus);
        }
        if (cfg.hiddenStudentMenus) {
          setHiddenStudentMenus(cfg.hiddenStudentMenus);
        }
      });

      const savedStudents = localStorage.getItem('jj_students_roster_v1');
      if (savedStudents) {
        const parsed = JSON.parse(savedStudents) as StudentInfo[];
        const merged = parsed.map((s) => {
          const init = INITIAL_STUDENTS.find((i) => i.id === s.id);
          return {
            ...s,
            room_no: s.room_no || init?.room_no,
            gender: s.gender || init?.gender,
          };
        });
        setStudents(merged);
      }

      setSelectedIconId('bus');
      updateFaviconDom('bus');
      localStorage.setItem('jj_app_icon_id', 'bus');

      // Auto Login Restore
      const savedUserStr = localStorage.getItem('jj_logged_in_user_v1');
      if (savedUserStr) {
        const user = JSON.parse(savedUserStr);
        if (user) {
          if (user.role === 'parent' && user.studentName?.trim() === '강승엽' && user.studentClass !== 4) {
            user.studentClass = 4;
            localStorage.setItem('jj_logged_in_user_v1', JSON.stringify(user));
          }
          setCurrentUser(user);
          if (user.role === 'student') setActiveTab('guide');
          else if (user.role === 'parent') setActiveTab('communication');
          else setActiveTab('dashboard');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Real-time Activity Alert (Quiz & Photo Mission)
  const [activityAlert, setActivityAlert] = useState<ActivityAlertData | null>(null);

  // Sync public notices periodically and via realtime broadcast
  useEffect(() => {
    const userClass = currentUser?.class_no || currentUser?.studentClass || currentUser?.myClass || 0;
    const fetchNotices = async () => {
      try {
        const list = await getPublicNotices(userClass, currentUser?.role);
        if (list && list.length > 0) {
          setPublicNotices(list);
        }
      } catch (e) {
        console.error('Error fetching public notices:', e);
      }
    };

    fetchNotices();
    const unsubscribe = subscribeToUpdates((type) => {
      if (type === 'notices' || type === 'poll') {
        fetchNotices();
      }
      if (type === 'nav_config' || type === 'poll') {
        getNavConfig().then((cfg) => {
          if (cfg.teacherOrder && cfg.teacherOrder.length > 0) {
            const fullOrder = [...cfg.teacherOrder];
            DEFAULT_TEACHER_NAV_ORDER.forEach((key) => {
              if (!fullOrder.includes(key)) fullOrder.push(key);
            });
            setTeacherNavOrder(fullOrder);
          }
          if (cfg.hiddenTeacherMenus) {
            setHiddenTeacherMenus(cfg.hiddenTeacherMenus);
          }
          if (cfg.hiddenStudentMenus) {
            setHiddenStudentMenus(cfg.hiddenStudentMenus);
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Realtime Activity Monitor (Sudden Quiz & Photo Mission Alert with Sound & Vibration)
  useEffect(() => {
    if (!currentUser) return;
    const isStudentUser = currentUser.role === 'student';
    const isTeacherUser = currentUser.role === 'teacher' || currentUser.role === 'head_teacher' || currentUser.role === 'vice_principal';
    // We notify both students and teachers (teachers see when other teachers launch live events too)

    let isFirstCheck = true;
    let knownQuizIds = new Set<string>();
    let knownMissionIds = new Set<string>();

    const checkActivities = async () => {
      try {
        const [quizzes, missions] = await Promise.all([
          getQuizzes(),
          getMissions()
        ]);

        const currentClassNo = currentUser.studentClass || currentUser.myClass || currentUser.class_no || 0;

        if (isFirstCheck) {
          // Initialize known IDs so existing items don't trigger alerts on first load
          quizzes.forEach(q => knownQuizIds.add(String(q.id)));
          missions.forEach(m => knownMissionIds.add(String(m.id)));
          isFirstCheck = false;
          return;
        }

        // Check for new active quizzes
        for (const q of quizzes) {
          const qId = String(q.id);
          if (!knownQuizIds.has(qId)) {
            knownQuizIds.add(qId);
            if (q.status === 'active') {
              // Check class targeting
              const targetAudienceMatch = q.targetAudience === 'all' || (q.classNo === currentClassNo);
              if (targetAudienceMatch) {
                setActivityAlert({
                  type: 'quiz',
                  id: qId,
                  title: q.question,
                  description: q.hint ? `힌트: ${q.hint}` : undefined,
                  author: q.author || '총괄본부'
                });
                showSystemNotification('⚡ [돌발 퀴즈 발령] 지금 맞혀보세요!', {
                  body: q.question,
                  tag: `quiz-${qId}`
                });
                break; // Show one at a time
              }
            }
          }
        }

        // Check for new active photo missions
        for (const m of missions) {
          const mId = String(m.id);
          if (!knownMissionIds.has(mId)) {
            knownMissionIds.add(mId);
            if (m.status === 'active') {
              const targetClassMatch = !m.classNo || m.classNo === 0 || m.classNo === currentClassNo;
              if (targetClassMatch) {
                setActivityAlert({
                  type: 'mission',
                  id: mId,
                  title: m.title,
                  description: m.description,
                  points: m.points,
                  author: m.author || '총괄본부'
                });
                showSystemNotification('📸 [새 사진 미션 발령] 스탬프를 획득하세요!', {
                  body: m.title,
                  tag: `mission-${mId}`
                });
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Check activities error:', err);
      }
    };

    // Initial check
    checkActivities();

    // Listen for broadcast & polling
    const unsub = subscribeToUpdates((type) => {
      if (type === 'activities' || type === 'poll') {
        checkActivities();
      }
    });

    return () => {
      unsub();
    };
  }, [currentUser]);

  const updateFaviconDom = (iconId: string = 'bus') => {
    try {
      const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement;
      link.type = 'image/svg+xml';
      link.rel = 'icon';
      link.href = '/icon-bus.svg';
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
    try {
      localStorage.setItem('jj_logged_in_user_v1', JSON.stringify(user));
    } catch (e) {}
    if (user.role === 'student') {
      setActiveTab('guide');
    } else if (user.role === 'parent') {
      setActiveTab('communication');
    } else {
      setActiveTab('dashboard');
    }
    setSidebarOpen(false);
    triggerToast(`${user.name} 님, 환영합니다!`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('jj_logged_in_user_v1');
    } catch (e) {}
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSidebarOpen(false);
    triggerToast('로그아웃되었습니다.');
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

  const isHead = Boolean(currentUser?.isHead);
  const isStudent = currentUser?.role === 'student';
  const isParent = currentUser?.role === 'parent';
  const isTeacher = Boolean(currentUser && !isStudent && !isParent);

  // Find class teacher name for parent
  const parentTeacherInfo = isParent
    ? TEACHERS.find((t) => t.classNo === (currentUser?.studentClass || 4))
    : null;
  const parentTeacherName = parentTeacherInfo ? parentTeacherInfo.name : '담임';

  // Navigation Items
  const studentNavItems = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: '수학여행 학생 안내서', tab: 'guide', badge: '학생전용' },
    { icon: <Hotel className="w-4 h-4 text-indigo-500" />, label: '학생 숙소 방배치', tab: 'student_rooms', badge: '호실' },
    { icon: <HelpCircle className="w-4 h-4 text-amber-500" />, label: '실시간 돌발 퀴즈', tab: 'quiz', badge: '라이브' },
    { icon: <Camera className="w-4 h-4 text-pink-500" />, label: '사진 인증 미션', tab: 'photo_mission', badge: '스탬프' },
    { icon: <CalendarRange className="w-4 h-4" />, label: '수학여행세부일정표', tab: 'schedule' },
    { icon: <ShieldAlert className="w-4 h-4" />, label: '비상 연락망 & 안전', tab: 'emergency' },
  ];

  const teacherNavItems = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: isHead ? '전체 현황 대시보드' : '내 학급 대시보드', tab: 'dashboard' },
    { icon: <UserCheck className="w-4 h-4" />, label: isHead ? '전체 출석 및 탑승 관리' : `${currentUser?.myClass || ''}반 탑승 관리`, tab: 'attendance' },
    { icon: <Hotel className="w-4 h-4 text-indigo-500" />, label: isHead ? '전체 숙소 방배치 관리' : `${currentUser?.myClass || ''}반 숙소 방배치 관리`, tab: 'rooms_management', badge: '호실배정' },
    ...(isHead ? [{ icon: <UsersRound className="w-4 h-4" />, label: '전 학급 탑승 종합 관제', tab: 'classes', badge: '총괄' }] : []),
    { icon: <Sparkles className="w-4 h-4 text-amber-500" />, label: '돌발 퀴즈 & 사진 미션 관제', tab: 'activities_control', badge: '체육시스템이식' },
    { icon: <MessageSquareText className="w-4 h-4 text-pink-500" />, label: '학부모 소통 관리 (시범)', tab: 'parent_communication', badge: '신규' },
    { icon: <BookOpen className="w-4 h-4" />, label: '학생 종합 안내서 조회', tab: 'guide' },
    { icon: <CalendarRange className="w-4 h-4" />, label: '수학여행세부일정표', tab: 'schedule' },
    { icon: <Sparkles className="w-4 h-4" />, label: 'AI 안심 알림장 어시스턴트', tab: 'ai' },
    { icon: <ShieldAlert className="w-4 h-4" />, label: '비상 연락망 & 안전 기관', tab: 'emergency' },
  ];

  const parentNavItems = [
    { icon: <MessageSquareText className="w-4 h-4" />, label: `${currentUser?.studentClass || 4}반 ${parentTeacherName} 선생님 학급 소통`, tab: 'communication', badge: '학부모' },
    { icon: <Hotel className="w-4 h-4 text-indigo-500" />, label: '자녀 숙소 방배치', tab: 'parent_rooms', badge: '호실' },
    { icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, label: '학생 안전교육 & 준비물', tab: 'safety', badge: '안심' },
    { icon: <CalendarRange className="w-4 h-4" />, label: '수학여행세부일정표', tab: 'schedule' },
    { icon: <ShieldAlert className="w-4 h-4" />, label: '비상 연락망 & 안전', tab: 'emergency' },
  ];

  const sortedTeacherNavItems = [...teacherNavItems].sort((a, b) => {
    const idxA = teacherNavOrder.indexOf(a.tab);
    const idxB = teacherNavOrder.indexOf(b.tab);
    const posA = idxA === -1 ? 999 : idxA;
    const posB = idxB === -1 ? 999 : idxB;
    return posA - posB;
  });

  const visibleStudentNavItems = studentNavItems.filter((item) => !hiddenStudentMenus.includes(item.tab));

  const visibleTeacherNavItems = isNavInlineEdit
    ? sortedTeacherNavItems
    : sortedTeacherNavItems.filter((item) => !hiddenTeacherMenus.includes(item.tab));

  const navItems = isStudent ? visibleStudentNavItems : isParent ? parentNavItems : visibleTeacherNavItems;

  // Auto redirect student if current tab is hidden by teacher
  useEffect(() => {
    if (isStudent && hiddenStudentMenus.includes(activeTab)) {
      const remainingTabs = studentNavItems.filter((i) => !hiddenStudentMenus.includes(i.tab)).map((i) => i.tab);
      const nextTab = remainingTabs[0] || 'guide';
      setActiveTab(nextTab);
      triggerToast('담임선생님께서 해당 메뉴를 비공개 처리하셨습니다.');
    }
  }, [hiddenStudentMenus, isStudent, activeTab]);

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        teacherAuthCode={teacherAuthCode}
        students={students}
        triggerToast={triggerToast}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f6f2] font-sans antialiased text-slate-900 overflow-x-hidden">
      {/* Mobile Backdrop for Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar (Desktop sticky / Mobile off-canvas drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-lg md:shadow-none border-r border-slate-200/80 overflow-y-auto`}
        style={{
          background: isStudent ? '#f8fafc' : isParent ? '#fdf2f8' : isHead ? 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' : '#ffffff',
        }}
      >
        <div>
          {/* Logo & School Header */}
          <div className={`p-5 border-b flex items-center justify-between ${isHead ? 'border-indigo-700/50' : 'border-slate-200'}`}>
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl font-black text-lg flex items-center justify-center shadow-badge ${
                  isStudent ? 'bg-emerald-500 text-white' : isParent ? 'bg-pink-500 text-white' : isHead ? 'bg-amber-400 text-amber-950' : 'bg-blue-600 text-white'
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
                : isParent
                ? 'bg-pink-50 border border-pink-200'
                : isHead
                ? 'bg-amber-400/20 border border-amber-400/30'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isStudent ? 'bg-emerald-100 text-emerald-600' : isParent ? 'bg-pink-100 text-pink-600' : isHead ? 'bg-amber-400 text-amber-950' : 'bg-blue-100 text-blue-600'
              }`}
            >
              {isStudent ? <Users className="w-4 h-4" /> : isParent ? <UsersRound className="w-4 h-4" /> : isHead ? <Crown className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <p className={`text-xs font-black truncate ${isStudent ? 'text-emerald-800' : isParent ? 'text-pink-800' : isHead ? 'text-amber-300' : 'text-blue-800'}`}>
                  {currentUser.name} {isStudent ? '학생' : isParent ? '학부모님' : '선생님'}
                </p>
                {isHead && (
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded-full">
                    총괄
                  </span>
                )}
              </div>
              <p className={`text-[10px] truncate ${isStudent ? 'text-emerald-600' : isParent ? 'text-pink-600' : isHead ? 'text-indigo-200' : 'text-slate-500'}`}>
                {isStudent
                  ? `2학년 ${currentUser.class_no}반 ${currentUser.student_no}번 (${currentUser.bus_no}호차)`
                  : isParent
                  ? `2학년 ${currentUser.studentClass}반 ${currentUser.studentName} 학생 학부모`
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
            {!isStudent && !isParent && (
              <div className="px-1 pb-2 flex items-center justify-between border-b border-slate-100/50 mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isHead ? 'text-indigo-200' : 'text-slate-400'}`}>
                    교사 메뉴
                  </span>
                  {hiddenTeacherMenus.length > 0 && !isNavInlineEdit && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
                      {hiddenTeacherMenus.length}개 숨김
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setIsNavInlineEdit(!isNavInlineEdit)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      isNavInlineEdit
                        ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300/50'
                        : isHead
                        ? 'bg-white/10 text-indigo-200 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="사이드바에서 메뉴 순서 및 숨김/노출 빠르게 설정"
                  >
                    {isNavInlineEdit ? '✓ 완료' : '순서·숨김'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavOrderModalOpen(true)}
                    className={`p-1 rounded-md transition-all ${
                      isHead ? 'text-amber-300 hover:bg-white/10' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                    title="메뉴 순서 & 학생 메뉴 공개 상세 관리"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {navItems.map((item, index) => {
              const isActive = activeTab === item.tab;
              const isHidden = !isStudent && !isParent && hiddenTeacherMenus.includes(item.tab);
              let activeClass = '';
              let hoverClass = '';

              if (isStudent) {
                activeClass = 'bg-emerald-500 text-white shadow-badge';
                hoverClass = 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50';
              } else if (isParent) {
                activeClass = 'bg-pink-500 text-white shadow-badge';
                hoverClass = 'text-slate-600 hover:text-pink-700 hover:bg-pink-50';
              } else if (isHead) {
                activeClass = 'bg-amber-400 text-amber-950 font-black shadow-badge';
                hoverClass = 'text-indigo-200 hover:text-white hover:bg-indigo-700/50';
              } else {
                activeClass = 'bg-blue-600 text-white shadow-badge';
                hoverClass = 'text-slate-600 hover:text-blue-600 hover:bg-slate-100';
              }

              return (
                <div key={item.tab} className="relative group/nav flex items-center">
                  <button
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl transition-all text-left ${
                      isHidden ? 'opacity-40 hover:opacity-80 bg-slate-100/40 border border-dashed border-rose-300/60' : isActive ? activeClass : hoverClass
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className={`flex-1 font-bold text-xs truncate ${isHidden ? 'line-through text-slate-400' : ''}`}>
                      {item.label}
                    </span>
                    {isHidden && isNavInlineEdit && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        숨김
                      </span>
                    )}
                    {item.badge && !isNavInlineEdit && !isHidden && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-amber-950/20 text-amber-950' : 'bg-amber-400 text-amber-950'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Inline Reorder & Visibility Buttons (When isNavInlineEdit is active) */}
                  {!isStudent && !isParent && isNavInlineEdit && (
                    <div className="flex items-center space-x-0.5 pr-1 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveTeacherNavItem(item.tab, 'up')}
                        className={`p-1 rounded transition-colors ${
                          isHead
                            ? 'bg-indigo-900/80 text-indigo-200 hover:bg-amber-400 hover:text-amber-950 disabled:opacity-20'
                            : 'bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 disabled:opacity-25'
                        }`}
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === navItems.length - 1}
                        onClick={() => moveTeacherNavItem(item.tab, 'down')}
                        className={`p-1 rounded transition-colors ${
                          isHead
                            ? 'bg-indigo-900/80 text-indigo-200 hover:bg-amber-400 hover:text-amber-950 disabled:opacity-20'
                            : 'bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 disabled:opacity-25'
                        }`}
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleTeacherNavItemVisibility(item.tab)}
                        className={`p-1 rounded transition-colors ${
                          isHidden
                            ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-xs'
                            : isHead
                            ? 'bg-indigo-900/80 text-emerald-300 hover:bg-emerald-400 hover:text-emerald-950'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                        title={isHidden ? '숨김 해제 (다시 노출하기)' : '이 메뉴 숨기기 (학생 화면도 연동)'}
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${isHead ? 'border-indigo-700/50' : 'border-slate-200'} space-y-2`}>
          {!isParent && (
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
          )}

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
                {activeTab === 'rooms_management' && (isHead ? '전체 숙소 방배치 관리' : `${currentUser.myClass}반 숙소 방배치 관리`)}
                {activeTab === 'student_rooms' && '학생 숙소 방배치 현황'}
                {activeTab === 'parent_rooms' && '자녀 숙소 방배치 현황'}
                {activeTab === 'classes' && '전 학급 탑승 종합 관제 (총괄)'}
                {activeTab === 'activities_control' && '돌발 퀴즈 & 사진 미션 인솔 관제'}
                {activeTab === 'quiz' && '실시간 돌발 퀴즈 (라이브)'}
                {activeTab === 'photo_mission' && '수학여행 사진 인증 미션'}
                {activeTab === 'guide' && (isStudent ? '학생 스마트 안내서' : '학생 안내서 종합 조회')}
                {activeTab === 'schedule' && '수학여행세부일정표'}
                {activeTab === 'ai' && 'AI 인솔 어시스턴트'}
                {activeTab === 'emergency' && '비상 연락망 및 안전 기관'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Broadcast button for teachers ONLY (Students & Parents cannot write) */}
            {isTeacher && (
              <button
                onClick={() => {
                  setBroadcastTarget('student');
                  setBroadcastModalOpen(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 shadow-xs transition-all ${
                  isHead ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title="실시간 공지 작성 및 발송"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">공지 발송</span>
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

        {/* Public Notice Banner (Clickable to view detail modal for all roles: Student, Parent, Teacher) */}
        {publicNotices.length > 0 && (
          <div
            onClick={() => setSelectedNotice(publicNotices[0])}
            className="bg-amber-50 hover:bg-amber-100/90 border-b border-amber-200/90 px-4 py-2.5 flex items-center space-x-2.5 text-xs text-amber-950 cursor-pointer transition-colors shadow-2xs group"
            title="클릭하여 공지 전문 확인하기"
          >
            <div className="p-1 rounded-lg bg-amber-200/60 text-amber-800 shrink-0 group-hover:scale-105 transition-transform">
              <Megaphone className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="flex items-center space-x-2 truncate flex-1">
              <span className="font-extrabold truncate text-amber-950">{publicNotices[0].text}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[10px] text-amber-700 font-mono">
                {publicNotices[0].time}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-900 group-hover:bg-amber-300 transition-colors">
                상세보기
              </span>
            </div>
          </div>
        )}

        {/* Tab Views Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-32">
          {activeTab === 'guide' && (
            <StudentGuideView
              students={students}
              currentUser={currentUser}
              onBoardingToggle={handleBoardingToggle}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'quiz' && (
            <StudentQuizView currentUser={currentUser} triggerToast={triggerToast} />
          )}

          {activeTab === 'photo_mission' && (
            <StudentPhotoMissionView currentUser={currentUser} triggerToast={triggerToast} />
          )}

          {activeTab === 'activities_control' && !isStudent && !isParent && (
            <TeacherActivityManagerView currentUser={currentUser} triggerToast={triggerToast} />
          )}

          {activeTab === 'communication' && isParent && (
            <ParentCommunicationView currentUser={currentUser} triggerToast={triggerToast} initialTab="notices" students={students} />
          )}

          {activeTab === 'safety' && isParent && (
            <ParentCommunicationView currentUser={currentUser} triggerToast={triggerToast} initialTab="safety" students={students} />
          )}

          {activeTab === 'dashboard' && !isStudent && !isParent && (
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

          {activeTab === 'rooms_management' && !isStudent && !isParent && (
            <RoomAllocationView
              students={students}
              currentUser={currentUser}
              onUpdateStudents={persistStudents}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'student_rooms' && isStudent && (
            <RoomAllocationView
              students={students}
              currentUser={currentUser}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'parent_rooms' && isParent && (
            <RoomAllocationView
              students={students}
              currentUser={currentUser}
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

          {activeTab === 'parent_communication' && !isStudent && !isParent && (
            <TeacherParentCommunicationView currentUser={currentUser} triggerToast={triggerToast} />
          )}

          {activeTab === 'schedule' && <ScheduleTab />}

          {activeTab === 'ai' && !isStudent && (
            <AiCounselorTab currentUser={currentUser} triggerToast={triggerToast} />
          )}

          {activeTab === 'emergency' && <EmergencyTab currentUser={currentUser} />}
        </main>

        {/* Mobile Sticky Bottom Navigation Bar (100% thumb friendly) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] font-bold">
          {isParent ? (
            <>
              <button
                onClick={() => setActiveTab('communication')}
                className={`flex flex-col items-center p-1 ${activeTab === 'communication' ? 'text-pink-600 font-black' : 'text-slate-400'}`}
              >
                <MessageSquareText className="w-5 h-5 mb-0.5" />
                <span>소통방</span>
              </button>
              <button
                onClick={() => setActiveTab('safety')}
                className={`flex flex-col items-center p-1 ${activeTab === 'safety' ? 'text-pink-600 font-black' : 'text-slate-400'}`}
              >
                <ShieldCheck className="w-5 h-5 mb-0.5" />
                <span>안전교육</span>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex flex-col items-center p-1 ${activeTab === 'schedule' ? 'text-pink-600 font-black' : 'text-slate-400'}`}
              >
                <CalendarRange className="w-5 h-5 mb-0.5" />
                <span>일정표</span>
              </button>
              <button
                onClick={() => setActiveTab('emergency')}
                className={`flex flex-col items-center p-1 ${activeTab === 'emergency' ? 'text-pink-600 font-black' : 'text-slate-400'}`}
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
          ) : isStudent ? (
            <>
              {!hiddenStudentMenus.includes('guide') && (
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`flex flex-col items-center p-1 ${activeTab === 'guide' ? 'text-emerald-600 font-black' : 'text-slate-400'}`}
                >
                  <BookOpen className="w-5 h-5 mb-0.5" />
                  <span>안내서</span>
                </button>
              )}
              {!hiddenStudentMenus.includes('student_rooms') && (
                <button
                  onClick={() => setActiveTab('student_rooms')}
                  className={`flex flex-col items-center p-1 ${activeTab === 'student_rooms' ? 'text-indigo-600 font-black' : 'text-slate-400'}`}
                >
                  <Hotel className="w-5 h-5 mb-0.5" />
                  <span>방배치</span>
                </button>
              )}
              {!hiddenStudentMenus.includes('quiz') && (
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`flex flex-col items-center p-1 ${activeTab === 'quiz' ? 'text-amber-500 font-black' : 'text-slate-400'}`}
                >
                  <HelpCircle className="w-5 h-5 mb-0.5" />
                  <span>돌발퀴즈</span>
                </button>
              )}
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
              {!hiddenStudentMenus.includes('photo_mission') && (
                <button
                  onClick={() => setActiveTab('photo_mission')}
                  className={`flex flex-col items-center p-1 ${activeTab === 'photo_mission' ? 'text-pink-600 font-black' : 'text-slate-400'}`}
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>사진미션</span>
                </button>
              )}
              {!hiddenStudentMenus.includes('schedule') && hiddenStudentMenus.includes('quiz') && (
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex flex-col items-center p-1 ${activeTab === 'schedule' ? 'text-emerald-600 font-black' : 'text-slate-400'}`}
                >
                  <CalendarRange className="w-5 h-5 mb-0.5" />
                  <span>일정표</span>
                </button>
              )}
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

      {/* Broadcast Notice Modal (Available ONLY to Teachers & Head Teachers) */}
      {broadcastModalOpen && isTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    실시간 공지 작성 및 발송
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    작성자: {currentUser?.name} 선생님 ({isHead ? '총괄본부' : `${currentUser?.myClass}반 담임`})
                  </p>
                </div>
              </div>
              <button onClick={() => setBroadcastModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Selection: 2학년 4반 단독 활용 - 교사 본인학급(학생) vs 학부모 */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">발송 대상 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastTarget('student')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    broadcastTarget === 'student'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-black text-xs">
                    <span className={`w-2 h-2 rounded-full ${broadcastTarget === 'student' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <span>교사 본인학급</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 pl-4 leading-tight">
                    {currentUser?.myClass && currentUser.myClass !== 'all' ? `${currentUser.myClass}반` : '4반'} 학생 화면 상단에 배너 표시
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBroadcastTarget('parent')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    broadcastTarget === 'parent'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-black text-xs">
                    <span className={`w-2 h-2 rounded-full ${broadcastTarget === 'parent' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <span>학부모</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 pl-4 leading-tight">
                    {currentUser?.myClass && currentUser.myClass !== 'all' ? `${currentUser.myClass}반` : '4반'} 학부모 안심 화면 상단에 배너 표시
                  </p>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">공지 제목 (한 줄 요약)</label>
              <input
                id="noticeTitle"
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-blue-500"
                placeholder="예: 19:00 롯데월드 정문 게이트 앞 전원 집결"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">공지 상세 내용</label>
              <textarea
                id="noticeDetail"
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-hidden focus:border-blue-500 leading-relaxed"
                placeholder="학생 및 학부모님이 클릭했을 때 확인할 상세 내용을 입력하세요 (집결 위치, 준비물, 주의사항 등)..."
              />
            </div>

            <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              * 작성된 공지는 Supabase 클라우드를 통해 <b>{broadcastTarget === 'student' ? '교사 본인학급(학생)' : '학부모'} 기기에 실시간으로 즉각 전달</b>됩니다. 대상 사용자는 상단 배너를 클릭하여 상세 내용을 확인할 수 있습니다.
            </p>

            {/* Active Notices Management List (For Teachers to view and delete test notices) */}
            {publicNotices.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-700 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>현재 발송된 공지 ({publicNotices.length}건)</span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('발송된 모든 실시간 공지사항(테스트 발송 내역 포함)을 전체 삭제하시겠습니까?\n모든 학생 및 학부모 기기에서도 즉시 제거됩니다.')) return;
                      const targetClass = (currentUser?.myClass && currentUser.myClass !== 'all') ? Number(currentUser.myClass) : 4;
                      await deleteAllNotices(targetClass);
                      setPublicNotices([]);
                      triggerToast('모든 실시간 공지가 전체 삭제되었습니다.');
                    }}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors flex items-center space-x-1"
                    title="모든 실시간 공지 일괄 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>전체 일괄 삭제</span>
                  </button>
                </div>

                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-0.5">
                  {publicNotices.map((pn) => (
                    <div key={pn.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors">
                      <div className="truncate flex-1 mr-2">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{pn.time}</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate">{pn.text}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`'${pn.text}' 공지를 삭제하시겠습니까?`)) return;
                          await deleteNotice(String(pn.id));
                          setPublicNotices((prev) => prev.filter((p) => String(p.id) !== String(pn.id)));
                          triggerToast('공지가 삭제되었습니다.');
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors shrink-0"
                        title="개별 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingNotice}
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isSubmittingNotice}
                onClick={async () => {
                  const titleEl = document.getElementById('noticeTitle') as HTMLInputElement;
                  const detailEl = document.getElementById('noticeDetail') as HTMLTextAreaElement;
                  const titleText = titleEl?.value.trim();
                  const detailText = detailEl?.value.trim();

                  if (!titleText) {
                    alert('공지 내용을 입력해 주세요.');
                    return;
                  }

                  setIsSubmittingNotice(true);
                  try {
                    const authorLabel = `${currentUser?.name} 선생님${currentUser?.myClass ? ` (${currentUser.myClass}반)` : ''}`;
                    const targetClass = (currentUser?.myClass && currentUser.myClass !== 'all') ? Number(currentUser.myClass) : 4;

                    const newNotice = await sendPublicNotice({
                      target: broadcastTarget,
                      class_no: targetClass,
                      text: titleText,
                      detail: detailText || titleText,
                      author: authorLabel
                    });

                    setPublicNotices((prev) => [newNotice, ...prev]);
                    triggerToast(`공지가 성공적으로 발송되었습니다! (${broadcastTarget === 'student' ? '교사 본인학급' : '학부모'})`);
                    setBroadcastModalOpen(false);
                  } catch (e) {
                    console.error('Notice send error:', e);
                    triggerToast('공지 발송 중 오류가 발생했습니다.');
                  } finally {
                    setIsSubmittingNotice(false);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingNotice ? '발송 중...' : '공지 발송하기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Notice Detail Modal (For Students, Parents, Teachers to READ & Teachers to DELETE) */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {selectedNotice.class_no === 0 ? '전체 공지' : `${selectedNotice.class_no}반 학급 공지`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedNotice.time}
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 mt-1 leading-snug">
                    {selectedNotice.text}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap">
              {selectedNotice.content || selectedNotice.text}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-600">
                발송: {selectedNotice.author}
              </span>
              <div className="flex items-center space-x-2">
                {isTeacher && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`'${selectedNotice.text}' 공지를 삭제하시겠습니까?\n(모든 학생 및 학부모 기기에서도 즉시 삭제됩니다)`)) return;
                      await deleteNotice(String(selectedNotice.id));
                      setPublicNotices((prev) => prev.filter((p) => String(p.id) !== String(selectedNotice.id)));
                      setSelectedNotice(null);
                      triggerToast('공지사항이 삭제되었습니다.');
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center space-x-1"
                    title="이 공지 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>공지 삭제</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
                >
                  확인 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Navigation Customization & Student Menu Visibility Modal */}
      {navOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight">
                    네비게이션 메뉴 관리
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    교사 사이드바 순서/숨김 및 학생 화면 공개 실시간 제어
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNavOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex rounded-2xl bg-slate-100 p-1 space-x-1">
              <button
                type="button"
                onClick={() => setNavModalActiveTab('teacher')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  navModalActiveTab === 'teacher'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🧑‍🏫 교사 메뉴 순서 & 숨김</span>
                {hiddenTeacherMenus.length > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full font-bold">
                    {hiddenTeacherMenus.length}숨김
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setNavModalActiveTab('student')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  navModalActiveTab === 'student'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🎒 학생 메뉴 공개 제어</span>
                {hiddenStudentMenus.length > 0 ? (
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded-full font-bold">
                    {hiddenStudentMenus.length}숨김
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-700/80 text-emerald-100 px-1.5 py-0.2 rounded-full font-bold">
                    전체공개
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: 교사 메뉴 순서 & 숨김 설정 */}
            {navModalActiveTab === 'teacher' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>자주 쓰는 메뉴를 <b>▲·▼</b>로 이동하거나 <b>숨김(눈)</b> 처리하세요.</span>
                  <span className="text-[10px] text-slate-400">총 {sortedTeacherNavItems.length}개 메뉴</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {sortedTeacherNavItems.map((item, idx) => {
                    const isHidden = hiddenTeacherMenus.includes(item.tab);
                    const isLinkedToStudent = Boolean(TEACHER_TO_STUDENT_TAB_MAP[item.tab]);
                    return (
                      <div
                        key={item.tab}
                        className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                          isHidden
                            ? 'bg-slate-50/60 border-slate-200/60 opacity-60'
                            : 'bg-white border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                            isHidden ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5 truncate">
                              <p className={`font-bold text-xs truncate ${isHidden ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {item.label}
                              </p>
                              {isLinkedToStudent && (
                                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.2 rounded shrink-0" title="숨김 시 학생 화면 연동">
                                  학생연동
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 mt-0.5">
                              {isHidden ? (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 inline-block">
                                  🙈 숨김 상태
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 inline-block">
                                  👁️ 노출 중
                                </span>
                              )}
                              {item.badge && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 inline-block">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveTeacherNavItem(item.tab, 'up')}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-25 transition-colors"
                            title="위로 이동"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedTeacherNavItems.length - 1}
                            onClick={() => moveTeacherNavItem(item.tab, 'down')}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-25 transition-colors"
                            title="아래로 이동"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTeacherNavItemVisibility(item.tab)}
                            className={`p-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1 transition-all ${
                              isHidden
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={isHidden ? '숨김 해제 (다시 표시)' : '이 메뉴 숨기기'}
                          >
                            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span className="text-[10px]">{isHidden ? '숨김' : '노출'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                  💡 <b>학생 화면 연동 안내</b>: 숙소 방배치, 돌발퀴즈/사진미션, 일정표 등은 여기서 숨기면 학생 스마트폰/PC 화면에서도 자동으로 연동되어 함께 숨김 처리됩니다.
                </p>
              </div>
            )}

            {/* TAB 2: 학생 메뉴 공개/숨김 관리 (실시간 동기화) */}
            {navModalActiveTab === 'student' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-900 leading-tight">
                    학생들에게 보여줄 메뉴를 켜거나 끌 수 있습니다. (실시간 반영)
                  </span>
                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    <button
                      type="button"
                      onClick={setAllStudentMenusVisible}
                      className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      title="모든 학생 메뉴 노출"
                    >
                      전체 공개
                    </button>
                    <button
                      type="button"
                      onClick={hideAllStudentActivityMenus}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
                      title="돌발 퀴즈/사진 미션/숙소 방배치 일괄 숨김"
                    >
                      활동 외 잠금
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {[
                    { tab: 'student_rooms', label: '학생 숙소 방배치', desc: '호실 배정 현황 및 친구들 방 번호(539호 등) 조회', icon: <Hotel className="w-4 h-4 text-indigo-500" /> },
                    { tab: 'quiz', label: '실시간 돌발 퀴즈', desc: '인솔 교사가 발제한 퀴즈 실시간 정답 제출', icon: <HelpCircle className="w-4 h-4 text-amber-500" /> },
                    { tab: 'photo_mission', label: '사진 인증 미션', desc: '장소별 미션 스탬프 촬영 및 사진 업로드', icon: <Camera className="w-4 h-4 text-pink-500" /> },
                    { tab: 'schedule', label: '수학여행세부일정표', desc: '1~3일차 상세 타임라인 및 단체 식사 메뉴 안내', icon: <CalendarRange className="w-4 h-4 text-emerald-600" /> },
                    { tab: 'guide', label: '학생 스마트 종합 안내서', desc: '준비물 체크리스트 및 학급별 교사 연락망', icon: <LayoutDashboard className="w-4 h-4 text-blue-600" /> },
                    { tab: 'emergency', label: '비상 연락망 & 안전 기관', desc: '119, 경찰서, 인근 병원 비상 직통 전화', icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> },
                  ].map((sItem) => {
                    const isHidden = hiddenStudentMenus.includes(sItem.tab);
                    return (
                      <div
                        key={sItem.tab}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isHidden
                            ? 'bg-rose-50/40 border-rose-200/80'
                            : 'bg-white border-slate-200/80 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 mr-2">
                          <div className={`p-2 rounded-xl shrink-0 ${isHidden ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}>
                            {sItem.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <p className={`font-black text-xs ${isHidden ? 'text-rose-900 line-through' : 'text-slate-900'}`}>
                                {sItem.label}
                              </p>
                              {isHidden ? (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900">
                                  학생에게 숨김
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                  학생에게 공개
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              {sItem.desc}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStudentNavItemVisibility(sItem.tab)}
                          className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center space-x-1 shrink-0 ${
                            isHidden
                              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                          }`}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{isHidden ? '숨김 해제' : '숨기기'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  📡 <b>실시간 반영</b>: 교사가 여기서 숨김 버튼을 누르면 학생들의 스마트폰/PC 화면에서 해당 메뉴가 즉시 사라집니다. 만약 학생이 해당 메뉴를 보고 있었다면 메인 안내서 화면으로 안전하게 자동 전환됩니다.
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetTeacherNavOrder}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center space-x-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>기본값 초기화</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNavOrderModalOpen(false);
                  triggerToast('✅ 네비게이션 메뉴 설정이 저장 및 실시간 반영되었습니다.');
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all"
              >
                설정 완료
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


      {/* Real-time Activity Alert Modal (Sudden Quiz & Photo Mission) */}
      <ActivityAlertModal
        alert={activityAlert}
        onClose={() => setActivityAlert(null)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setActivityAlert(null);
        }}
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
const LoginScreen = ({ onLogin, teacherAuthCode, students, triggerToast }) => {
  const isTeacherRoute = window.location.pathname.includes('/teacher');
  const [loginMode, setLoginMode] = useState<'teacher' | 'student' | 'parent'>(
    isTeacherRoute ? 'teacher' : 'student'
  );

  // Teacher Login States
  const [selectedRole, setSelectedRole] = useState<'vicePrincipal' | 'gradeHead' | 'classTeacher'>('vicePrincipal');
  const [selectedClass, setSelectedClass] = useState('1');
  const [inputAuthCode, setInputAuthCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  // Student & Parent Login States (학번 + 이름 간편 로그인, 비번 없음)
  const [studentClass, setStudentClass] = useState('1');
  const [studentNo, setStudentNo] = useState('');
  const [studentName, setStudentName] = useState('');

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

  // Handle Parent Login (비번 없이 자녀 학번(반·번호) + 이름으로 간편 로그인)
  const handleParentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    if (!trimmedName) {
      triggerToast('자녀의 이름을 입력해주세요.');
      return;
    }

    const targetClass = Number(studentClass);
    const targetNo = Number(studentNo);

    const matched = students.find((s) => {
      const matchName = s.name.trim() === trimmedName;
      if (!matchName) return false;
      if (targetClass && targetNo && s.class_no === targetClass && s.student_no === targetNo) return true;
      if (targetClass && s.class_no === targetClass) return true;
      return false;
    }) || students.find(
      (s) => s.name.trim() === trimmedName
    );

    const actualClass = matched ? matched.class_no : (targetClass || 4);
    const actualNo = matched ? matched.student_no : (targetNo || 0);

    onLogin({
      role: 'parent',
      name: `${trimmedName} 학부모`,
      studentClass: actualClass,
      studentNo: actualNo,
      studentName: trimmedName,
    });
  };

  // Handle Student Login (비번 없이 학번(반·번호) + 이름으로 간편 로그인)
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    if (!studentNo || !trimmedName) {
      triggerToast('반, 번호, 이름을 모두 입력해주세요.');
      return;
    }

    const targetClass = Number(studentClass);
    const targetNo = Number(studentNo);
    const codeStr = `2${targetClass}${targetNo < 10 ? '0' + targetNo : targetNo}`;

    const matched = students.find((s) => {
      const matchName = s.name.trim() === trimmedName;
      if (!matchName) return false;
      if (s.class_no === targetClass && s.student_no === targetNo) return true;
      if (s.code === codeStr) return true;
      return false;
    }) || students.find(
      (s) => s.class_no === targetClass && s.name.trim() === trimmedName
    ) || students.find(
      (s) => s.name.trim() === trimmedName
    );

    if (matched) {
      onLogin({
        ...matched,
        role: 'student',
      });
    } else {
      // Fallback for seamless demo
      const fallbackId = Number(codeStr);
      onLogin({
        id: fallbackId,
        grade: 2,
        class_no: targetClass,
        student_no: targetNo,
        name: trimmedName,
        code: codeStr,
        bus_no: targetClass,
        role: 'student',
        bus_status: false,
        room_status: false,
        is_participating: true,
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 py-8 overflow-y-auto">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 sm:p-8 space-y-6 shadow-2xl text-white my-auto">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 font-black text-xl items-center justify-center shadow-badge">
            진
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">진장중학교 수학여행</h1>
          <p className="text-xs text-indigo-200">2학년 · 10.14(수)~10.16(금) 서울/경기 스마트 인솔</p>
        </div>

        {/* Mode Selector Indicator */}
        {!isTeacherRoute ? (
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/10 border border-white/10 mb-4">
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
            <button
              type="button"
              onClick={() => {
                setLoginMode('parent');
                setStudentClass('4');
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                loginMode === 'parent' ? 'bg-pink-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <UsersRound className="w-4 h-4" />
              <span>학부모 안심 로그인</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <span className="bg-amber-400 text-amber-950 px-4 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>교사 / 총괄 전용 로그인</span>
            </span>
          </div>
        )}

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
        ) : loginMode === 'parent' ? (
          /* ============= PARENT LOGIN FORM ============= */
          <form onSubmit={handleParentLogin} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200">자녀 학번 (반 / 번호)</label>
                <span className="text-[11px] text-pink-300 font-mono font-bold">
                  {studentClass && studentNo ? `학번: 2${studentClass}${Number(studentNo) < 10 ? '0' + Number(studentNo) : studentNo}` : `2학년 ${studentClass}반`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">반 선택</label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-pink-400 text-white [&>option]:text-slate-900"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        2학년 {n}반 {n === 4 ? '(시범 소통학급)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">번호</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={studentNo}
                    onChange={(e) => setStudentNo(e.target.value)}
                    placeholder="예: 1"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-pink-400 font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">자녀 성명</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  const val = e.target.value;
                  setStudentName(val);
                  const st = students.find((s) => s.name.trim() === val.trim());
                  if (st) {
                    setStudentClass(String(st.class_no));
                    setStudentNo(String(st.student_no));
                  }
                }}
                placeholder="예: 강승엽"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-pink-400 font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs text-pink-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
              <span>별도 비밀번호 없이 <b>자녀 학번(반·번호)과 이름</b>만으로 바로 접속됩니다.</span>
            </div>


            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
            >
              학부모 안심 페이지 입장하기
            </button>
          </form>
        ) : (
          /* ============= STUDENT LOGIN FORM ============= */
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200">학번 (반 / 번호)</label>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">
                  {studentClass && studentNo ? `학번: 2${studentClass}${Number(studentNo) < 10 ? '0' + Number(studentNo) : studentNo}` : `2학년 ${studentClass}반`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">반 선택</label>
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
                  <label className="text-[10px] text-slate-400 block mb-1">번호</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={studentNo}
                    onChange={(e) => setStudentNo(e.target.value)}
                    placeholder="예: 13"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">성명 (이름)</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 김규빈"
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-400 font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>별도 비밀번호 없이 <b>학번(반·번호)과 이름</b>만으로 즉시 로그인됩니다.</span>
            </div>


            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
            >
              학생 안내서 입장하기
            </button>
          </form>
        )}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('rooms_management')}
          className="clean-card p-4 text-left flex items-center justify-between hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-xs text-slate-900">숙소 방배치 관리</p>
              <p className="text-[10px] text-slate-500">{isHead ? '전체 학급 호실 배정' : `${currentUser.myClass}반 호실·인원 수정`}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </button>

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
   5. SCHEDULE & TIMELINE TAB (수학여행 세부일정표)
   ========================================================================= */
const ScheduleTab = () => {
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const displayedDays = ITINERARY.filter((d) => d.day === selectedDay);

  return (
    <div className="space-y-6">
      <div className="clean-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
              <CalendarRange className="w-5 h-5 text-blue-600" />
              <span>수학여행 세부일정표</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              2026학년도 진장중학교 2학년 수학여행 세부운영 계획에 따른 3일간 세부 일정표입니다.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDay(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedDay === 1 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1일차 (10.14)
            </button>
            <button
              onClick={() => setSelectedDay(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedDay === 2 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2일차 (10.15)
            </button>
            <button
              onClick={() => setSelectedDay(3)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedDay === 3 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3일차 (10.16)
            </button>
          </div>
        </div>

        {displayedDays.map((day) => (
          <div key={day.day} className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-black">
                  {day.date} ({day.day}일차)
                </span>
                <h4 className="font-black text-sm text-slate-800">{day.title}</h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">{day.route}</span>
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
