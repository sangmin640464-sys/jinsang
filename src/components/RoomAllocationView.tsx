import React, { useState, useMemo } from 'react';
import { 
  Hotel, Users, Bed, Check, Plus, Trash2, Edit3, Search, 
  Sparkles, RefreshCw, AlertCircle, Phone, MapPin, ShieldCheck, 
  UserCheck, ExternalLink, X, Info, DoorClosed
} from 'lucide-react';
import { StudentInfo, CLASS_4_ROOM_ASSIGNMENTS } from '../data/studentsData';
import { TEACHERS } from '../data/tripData';

interface RoomAllocationViewProps {
  students: StudentInfo[];
  currentUser?: any;
  onUpdateStudents?: (updatedStudents: StudentInfo[]) => void;
  triggerToast: (msg: string) => void;
}

interface RoomGroup {
  room_no: string;
  gender: '남' | '여';
  capacity: number;
  students: StudentInfo[];
}

export const RoomAllocationView: React.FC<RoomAllocationViewProps> = ({
  students,
  currentUser,
  onUpdateStudents,
  triggerToast
}) => {
  const isStudent = currentUser?.role === 'student';
  const isParent = currentUser?.role === 'parent';
  const isHead = currentUser?.isHead || currentUser?.role === 'headTeacher';
  const isTeacher = !isStudent && !isParent;

  // Determine current viewed class
  const defaultClass = isStudent 
    ? (currentUser?.class_no || 4) 
    : isParent 
      ? (currentUser?.studentClass || 4) 
      : (isHead ? 4 : (currentUser?.myClass || 4));

  const [selectedClass, setSelectedClass] = useState<number>(defaultClass);
  const [filterGender, setFilterGender] = useState<'all' | '남' | '여'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Teacher edit modal state
  const [editingRoom, setEditingRoom] = useState<{
    originalRoomNo: string;
    newRoomNo: string;
    gender: '남' | '여';
    capacity: number;
    selectedStudentIds: number[];
  } | null>(null);

  // New room modal state
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomNoInput, setNewRoomNoInput] = useState('');
  const [newRoomGender, setNewRoomGender] = useState<'남' | '여'>('남');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(2);

  // Filter students by selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.class_no === Number(selectedClass));
  }, [students, selectedClass]);

  // Current logged in student object (if student or parent)
  const myStudentObj = useMemo(() => {
    if (isStudent) {
      return students.find((s) => s.id === currentUser?.id || (s.class_no === currentUser?.class_no && s.student_no === currentUser?.student_no));
    }
    if (isParent) {
      const parentName = currentUser?.studentName?.trim();
      return students.find((s) => s.name?.trim() === parentName && s.class_no === (currentUser?.studentClass || 4)) 
        || students.find((s) => s.name?.trim() === parentName);
    }
    return null;
  }, [students, isStudent, isParent, currentUser]);

  // Group students by room_no
  const roomGroups = useMemo(() => {
    const map = new Map<string, RoomGroup>();

    classStudents.forEach((st) => {
      const roomKey = st.room_no?.trim() || '미배정';
      if (!map.has(roomKey)) {
        // Derive floor from room number (e.g. 5xx -> 남, 6xx -> 여)
        const isBoyRoom = roomKey.startsWith('5') || st.gender === '남';
        map.set(roomKey, {
          room_no: roomKey,
          gender: isBoyRoom ? '남' : '여',
          capacity: 3, // default
          students: []
        });
      }
      map.get(roomKey)!.students.push(st);
    });

    // For Class 4, reflect initial capacity accurately if standard room
    const list = Array.from(map.values()).map((rg) => {
      if (selectedClass === 4) {
        const foundPlan = CLASS_4_ROOM_ASSIGNMENTS.find((r) => r.room_no === rg.room_no);
        if (foundPlan) {
          rg.capacity = foundPlan.capacity;
          rg.gender = foundPlan.gender;
        }
      }
      return rg;
    });

    // Sort: 5층 남학생 먼저, 그 다음 6층 여학생, 방번호 오름차순, 미배정 맨 뒤
    return list.sort((a, b) => {
      if (a.room_no === '미배정') return 1;
      if (b.room_no === '미배정') return -1;
      return a.room_no.localeCompare(b.room_no, undefined, { numeric: true });
    });
  }, [classStudents, selectedClass]);

  // Filtered rooms by gender and search query
  const filteredRooms = useMemo(() => {
    return roomGroups.filter((rg) => {
      if (filterGender !== 'all' && rg.gender !== filterGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesRoom = rg.room_no.toLowerCase().includes(q);
        const matchesStudent = rg.students.some((s) => s.name.toLowerCase().includes(q) || s.code.includes(q));
        if (!matchesRoom && !matchesStudent) return false;
      }
      return true;
    });
  }, [roomGroups, filterGender, searchQuery]);

  // Roommates of current student
  const myRoommates = useMemo(() => {
    if (!myStudentObj || !myStudentObj.room_no || myStudentObj.room_no === '미배정') return [];
    return classStudents.filter((s) => s.room_no === myStudentObj.room_no && s.id !== myStudentObj.id);
  }, [myStudentObj, classStudents]);

  // Teacher action: Save Room Edit
  const handleSaveRoomEdit = () => {
    if (!editingRoom || !onUpdateStudents) return;
    const { originalRoomNo, newRoomNo, selectedStudentIds, gender } = editingRoom;
    const cleanNewRoom = newRoomNo.trim();

    if (!cleanNewRoom) {
      alert('방 번호를 입력해주세요 (예: 535호).');
      return;
    }

    const updated = students.map((s) => {
      if (s.class_no !== Number(selectedClass)) return s;

      // If selected for this room
      if (selectedStudentIds.includes(s.id)) {
        return {
          ...s,
          room_no: cleanNewRoom,
          gender: gender
        };
      }

      // If previously was in original room but now unselected -> set unassigned
      if (s.room_no === originalRoomNo && !selectedStudentIds.includes(s.id)) {
        return {
          ...s,
          room_no: '미배정'
        };
      }

      return s;
    });

    onUpdateStudents(updated);
    triggerToast(`${cleanNewRoom} 방 정보 및 학생 명단이 저장되었습니다.`);
    setEditingRoom(null);
  };

  // Teacher action: Create new empty room
  const handleCreateNewRoom = () => {
    if (!newRoomNoInput.trim()) {
      alert('방 번호를 입력해주세요 (예: 537호).');
      return;
    }
    const cleanRoom = newRoomNoInput.trim().endsWith('호') ? newRoomNoInput.trim() : `${newRoomNoInput.trim()}호`;

    // Open edit modal directly for this new room
    setEditingRoom({
      originalRoomNo: cleanRoom,
      newRoomNo: cleanRoom,
      gender: newRoomGender,
      capacity: newRoomCapacity,
      selectedStudentIds: []
    });
    setIsAddingRoom(false);
    setNewRoomNoInput('');
  };

  // Teacher action: Delete a room (unassign its students)
  const handleDeleteRoom = (roomNo: string) => {
    if (!onUpdateStudents) return;
    if (!confirm(`'${roomNo}' 객실을 삭제하시겠습니까?\n해당 방에 배정된 학생들은 '미배정'으로 전환됩니다.`)) return;

    const updated = students.map((s) => {
      if (s.class_no === Number(selectedClass) && s.room_no === roomNo) {
        return { ...s, room_no: '미배정' };
      }
      return s;
    });

    onUpdateStudents(updated);
    triggerToast(`${roomNo} 객실이 삭제되었습니다.`);
    if (editingRoom?.originalRoomNo === roomNo) setEditingRoom(null);
  };

  // Teacher action: Reset to Official Plan
  const handleResetToOfficialPlan = () => {
    if (!onUpdateStudents) return;
    if (!confirm(`2학년 ${selectedClass}반 방배치를 초기 원본(배치표 기준)으로 초기화하시겠습니까?`)) return;

    let updated = [...students];
    if (selectedClass === 4) {
      updated = students.map((s) => {
        if (s.class_no !== 4) return s;
        for (const alloc of CLASS_4_ROOM_ASSIGNMENTS) {
          if (alloc.student_nos.includes(s.student_no)) {
            return {
              ...s,
              room_no: alloc.room_no,
              gender: alloc.gender
            };
          }
        }
        return s;
      });
    } else {
      updated = students.map((s) => {
        if (s.class_no !== selectedClass) return s;
        const isBoy = s.student_no <= 12;
        const gender = isBoy ? '남' : '여';
        const floor = isBoy ? '5' : '6';
        const roomIdx = Math.floor((s.student_no - 1) / 3) + 1;
        return {
          ...s,
          room_no: `${floor}${selectedClass}${roomIdx < 10 ? '0' + roomIdx : roomIdx}호`,
          gender
        };
      });
    }

    onUpdateStudents(updated);
    triggerToast(`2학년 ${selectedClass}반 방배치가 원본 기준으로 복원되었습니다.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Accommodation Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-6 opacity-10 pointer-events-none">
          <Hotel className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-200 text-xs px-3 py-1 rounded-full border border-indigo-400/30 font-bold">
              <Hotel className="w-3.5 h-3.5 text-amber-300" />
              <span>2박 3일 학생 공식 숙소</span>
              <span>·</span>
              <span className="text-amber-300">나인트리 호텔 판교</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>수학여행 숙소 객실 방배치 현황</span>
            </h2>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
              위치: 경기 성남시 수정구 창업로 18 (파미어스몰) · 객실 배정: 5층(남학생), 6층(여학생)
              <br />
              야간 생활 지도 및 인솔교사 상주(23:00~06:00 정기 점호 및 사감 순찰 운영)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:031-5178-5000"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center space-x-1.5 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-300" />
              <span>호텔 031-5178-5000</span>
            </a>
            {isTeacher && onUpdateStudents && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 객실 추가</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToOfficialPlan}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold border border-white/20 flex items-center space-x-1.5 transition-all"
                  title="배치표 원본 기준으로 초기화"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>초기화</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Student Personal Room Highlight Card */}
      {isStudent && myStudentObj && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-2 border-emerald-500/30 p-5 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 bg-emerald-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                <Bed className="w-3 h-3" />
                <span>내 배정 객실</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {myStudentObj.name} 학생은 <span className="text-emerald-700 underline decoration-emerald-400">{myStudentObj.room_no || '미배정'}</span>에 배정되었습니다.
              </h3>
              <p className="text-xs text-slate-600">
                {myStudentObj.room_no?.startsWith('5') ? '5층 남학생 전용 층' : '6층 여학생 전용 층'} · 나인트리 호텔 판교
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xs space-y-1 min-w-[200px]">
              <span className="text-[11px] font-bold text-slate-500 block">함께 생활하는 룸메이트</span>
              {myRoommates.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {myRoommates.map((rm) => (
                    <span key={rm.id} className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">
                      {rm.code} {rm.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">배정된 룸메이트 없음 (1인실 또는 미배정)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Parent Personal Child Room Highlight Card */}
      {isParent && myStudentObj && (
        <div className="rounded-3xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 border-2 border-pink-400/40 p-5 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-pink-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                <span>자녀 객실 안심 안내</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                자녀({myStudentObj.name}) 배정 객실: <span className="text-pink-600 font-black">{myStudentObj.room_no || '미배정'}</span>
              </h3>
              <p className="text-xs text-slate-600">
                담임: {TEACHERS.find((t) => t.classNo === myStudentObj.class_no)?.name} 선생님 · {myStudentObj.gender === '남' ? '5층 남학생 층' : '6층 여학생 층'}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-pink-100 shadow-xs space-y-1 min-w-[220px]">
              <span className="text-[11px] font-bold text-slate-500 block">동실 룸메이트 (2학년 {myStudentObj.class_no}반 친구들)</span>
              {myRoommates.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {myRoommates.map((rm) => (
                    <span key={rm.id} className="text-xs font-black bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-lg">
                      {rm.name} ({rm.student_no}번)
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">룸메이트 정보 조회 중</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Class selector (for teacher) & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Class selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-black text-slate-700 shrink-0">학급 선택:</span>
          <div className="flex space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setSelectedClass(n)}
                disabled={!isHead && !isTeacher && selectedClass !== n}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedClass === n
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } ${(!isHead && !isTeacher && selectedClass !== n) ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                2-{n}반 {n === 4 ? '(이헤레나)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Floor/Gender Filter & Search */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setFilterGender('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterGender === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500'}`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterGender('남')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterGender === '남' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-500'}`}
            >
              5층 남(12)
            </button>
            <button
              onClick={() => setFilterGender('여')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterGender === '여' ? 'bg-pink-600 text-white shadow-xs font-black' : 'text-slate-500'}`}
            >
              6층 여(12)
            </button>
          </div>

          <div className="relative flex-1 md:w-48">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="호실 또는 학생 이름 검색..."
              className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="space-y-6">
        {/* 5층 남학생 객실 섹션 */}
        {(filterGender === 'all' || filterGender === '남') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-blue-900 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>5층 남학생 객실 (3인실 2개 · 2인실 3개)</span>
              </h3>
              <span className="text-xs text-blue-600 font-bold">
                남학생 {classStudents.filter((s) => s.gender === '남').length}명 배정
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {filteredRooms
                .filter((rg) => rg.gender === '남' && rg.room_no !== '미배정')
                .map((rg) => renderRoomCard(rg))}
            </div>
          </div>
        )}

        {/* 6층 여학생 객실 섹션 */}
        {(filterGender === 'all' || filterGender === '여') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-pink-900 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-600"></span>
                <span>6층 여학생 객실 (3인실 2개 · 2인실 3개)</span>
              </h3>
              <span className="text-xs text-pink-600 font-bold">
                여학생 {classStudents.filter((s) => s.gender === '여').length}명 배정
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {filteredRooms
                .filter((rg) => rg.gender === '여' && rg.room_no !== '미배정')
                .map((rg) => renderRoomCard(rg))}
            </div>
          </div>
        )}

        {/* 미배정 학생 섹션 (있을 경우) */}
        {filteredRooms.some((rg) => rg.room_no === '미배정') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-amber-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>미배정 학생 목록</span>
              </h3>
            </div>
            {filteredRooms
              .filter((rg) => rg.room_no === '미배정')
              .map((rg) => renderRoomCard(rg, true))}
          </div>
        )}
      </div>

      {/* =========================================================================
          TEACHER ROOM EDIT MODAL
          ========================================================================= */}
      {editingRoom && isTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    객실 정보 및 배정 학생 수정
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    2학년 {selectedClass}반 · {editingRoom.originalRoomNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Room Number & Capacity & Gender */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">방 번호</label>
                  <input
                    type="text"
                    value={editingRoom.newRoomNo}
                    onChange={(e) => setEditingRoom({ ...editingRoom, newRoomNo: e.target.value })}
                    placeholder="예: 535호"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">성별 구분</label>
                  <select
                    value={editingRoom.gender}
                    onChange={(e) => setEditingRoom({ ...editingRoom, gender: e.target.value as '남' | '여' })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="남">남학생 (5층)</option>
                    <option value="여">여학생 (6층)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">정원(인실)</label>
                  <select
                    value={editingRoom.capacity}
                    onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value={2}>2인실</option>
                    <option value={3}>3인실</option>
                    <option value={4}>4인실</option>
                  </select>
                </div>
              </div>

              {/* Student Assignment Multi-Select */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    배정할 학생 선택 ({editingRoom.selectedStudentIds.length}/{editingRoom.capacity}명)
                  </label>
                  <span className="text-[11px] text-indigo-600 font-bold">
                    클릭하여 추가/제외
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-56 overflow-y-auto space-y-1.5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {classStudents.map((st) => {
                      const isSelected = editingRoom.selectedStudentIds.includes(st.id);
                      const isAssignedElsewhere = st.room_no && st.room_no !== '미배정' && st.room_no !== editingRoom.originalRoomNo;

                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditingRoom({
                                ...editingRoom,
                                selectedStudentIds: editingRoom.selectedStudentIds.filter((id) => id !== st.id)
                              });
                            } else {
                              setEditingRoom({
                                ...editingRoom,
                                selectedStudentIds: [...editingRoom.selectedStudentIds, st.id]
                              });
                            }
                          }}
                          className={`p-2 rounded-xl text-left border transition-all text-xs flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                              : isAssignedElsewhere
                                ? 'bg-white text-slate-400 border-slate-200/80 hover:border-slate-300'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="truncate pr-1">
                            <span className="text-[10px] opacity-80 block">{st.student_no}번</span>
                            <span className="font-bold">{st.name}</span>
                          </div>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : isAssignedElsewhere ? (
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">{st.room_no}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteRoom(editingRoom.originalRoomNo)}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl border border-red-200 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>이 방 삭제</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoomEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>변경 저장 완료</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TEACHER ADD ROOM MODAL
          ========================================================================= */}
      {isAddingRoom && isTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>새 객실 추가</span>
              </h3>
              <button onClick={() => setIsAddingRoom(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">방 번호</label>
                <input
                  type="text"
                  value={newRoomNoInput}
                  onChange={(e) => setNewRoomNoInput(e.target.value)}
                  placeholder="예: 537호"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">구분</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoomGender('남')}
                    className={`py-2 rounded-xl text-xs font-bold border ${newRoomGender === '남' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600'}`}
                  >
                    5층 남학생
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomGender('여')}
                    className={`py-2 rounded-xl text-xs font-bold border ${newRoomGender === '여' ? 'bg-pink-600 text-white border-pink-600' : 'bg-slate-50 text-slate-600'}`}
                  >
                    6층 여학생
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">정원</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoomCapacity(2)}
                    className={`py-2 rounded-xl text-xs font-bold border ${newRoomCapacity === 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600'}`}
                  >
                    2인실
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomCapacity(3)}
                    className={`py-2 rounded-xl text-xs font-bold border ${newRoomCapacity === 3 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600'}`}
                  >
                    3인실
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingRoom(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateNewRoom}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md"
              >
                생성 및 학생 배정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper render for Room Card
  function renderRoomCard(rg: RoomGroup, isUnassigned = false) {
    const isMyRoom = myStudentObj && myStudentObj.room_no === rg.room_no && rg.room_no !== '미배정';
    const isBoy = rg.gender === '남';
    const currentCount = rg.students.length;
    const isFull = currentCount >= rg.capacity;

    return (
      <div
        key={rg.room_no}
        className={`rounded-3xl p-4 border transition-all relative flex flex-col justify-between ${
          isMyRoom
            ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
            : isUnassigned
              ? 'bg-amber-50/50 border-amber-200'
              : isBoy
                ? 'bg-white border-blue-100 hover:border-blue-300 shadow-xs'
                : 'bg-white border-pink-100 hover:border-pink-300 shadow-xs'
        }`}
      >
        <div>
          {/* Card Header */}
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className={`text-base font-black ${isBoy ? 'text-blue-950' : 'text-pink-950'}`}>
                  {rg.room_no}
                </span>
                {isMyRoom && (
                  <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-md">
                    내 객실
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-bold block">
                {isUnassigned ? '호실 미지정' : `${isBoy ? '5층 남학생' : '6층 여학생'} · ${rg.capacity}인실`}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <span
                className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                  isUnassigned
                    ? 'bg-amber-100 text-amber-800'
                    : isFull
                      ? isBoy ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {currentCount}/{rg.capacity}명
              </span>

              {isTeacher && onUpdateStudents && !isUnassigned && (
                <button
                  type="button"
                  onClick={() => setEditingRoom({
                    originalRoomNo: rg.room_no,
                    newRoomNo: rg.room_no,
                    gender: rg.gender,
                    capacity: rg.capacity,
                    selectedStudentIds: rg.students.map((s) => s.id)
                  })}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="방번호 및 학생 수정"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Student Chips */}
          <div className="space-y-1.5 mb-3">
            {rg.students.length === 0 ? (
              <span className="text-xs text-slate-400 italic block py-2 text-center">
                배정된 학생이 없습니다
              </span>
            ) : (
              rg.students.map((st) => (
                <div
                  key={st.id}
                  className={`p-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                    myStudentObj && myStudentObj.id === st.id
                      ? 'bg-emerald-600 text-white font-black shadow-2xs'
                      : isBoy
                        ? 'bg-blue-50/60 text-slate-800 border border-blue-100/60'
                        : 'bg-pink-50/60 text-slate-800 border border-pink-100/60'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className={`font-mono text-[11px] font-bold ${myStudentObj && myStudentObj.id === st.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {st.student_no < 10 ? `0${st.student_no}` : st.student_no}
                    </span>
                    <span className="font-bold truncate">{st.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${myStudentObj && myStudentObj.id === st.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {st.code}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Empty bed status */}
        {!isFull && !isUnassigned && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>빈 자리: {rg.capacity - currentCount}석</span>
            {isTeacher && (
              <span className="text-indigo-600 font-bold cursor-pointer" onClick={() => setEditingRoom({
                originalRoomNo: rg.room_no,
                newRoomNo: rg.room_no,
                gender: rg.gender,
                capacity: rg.capacity,
                selectedStudentIds: rg.students.map((s) => s.id)
              })}>
                + 추가 배정
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
};
