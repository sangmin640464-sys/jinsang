export interface TeacherInfo {
  id: string;
  name: string;
  role: 'vicePrincipal' | 'gradeHead' | 'classTeacher';
  roleName: string;
  classNo?: number;
  coTeacher?: string;
  phone?: string;
  busNo: number;
  isHead: boolean;
}

export const TEACHERS: TeacherInfo[] = [
  {
    id: 'vicePrincipal',
    name: '김동욱',
    role: 'vicePrincipal',
    roleName: '교감 (총괄)',
    busNo: 1,
    isHead: true,
    phone: '052-289-6481',
  },
  {
    id: 'gradeHead',
    name: '조기호',
    role: 'gradeHead',
    roleName: '학년부장 (총괄)',
    classNo: 1,
    coTeacher: '김동욱 교감',
    busNo: 1,
    isHead: true,
    phone: '052-289-6481',
  },
  {
    id: 'class1',
    name: '조기호',
    role: 'classTeacher',
    roleName: '2-1 담임',
    classNo: 1,
    coTeacher: '김동욱 교감',
    busNo: 1,
    isHead: false,
    phone: '052-289-6481',
  },
  {
    id: 'class2',
    name: '고시영',
    role: 'classTeacher',
    roleName: '2-2 담임',
    classNo: 2,
    coTeacher: '최정원 선생님',
    busNo: 2,
    isHead: false,
    phone: '052-289-6481',
  },
  {
    id: 'class3',
    name: '고승빈',
    role: 'classTeacher',
    roleName: '2-3 담임',
    classNo: 3,
    coTeacher: '안성현 선생님',
    busNo: 3,
    isHead: false,
    phone: '052-289-6481',
  },
  {
    id: 'class4',
    name: '이헤레나',
    role: 'classTeacher',
    roleName: '2-4 담임',
    classNo: 4,
    coTeacher: '김보미 선생님',
    busNo: 4,
    isHead: false,
    phone: '052-289-6481',
  },
  {
    id: 'class5',
    name: '임우영',
    role: 'classTeacher',
    roleName: '2-5 담임',
    classNo: 5,
    coTeacher: '최두진 선생님',
    busNo: 5,
    isHead: false,
    phone: '052-289-6481',
  },
  {
    id: 'class6',
    name: '권소정',
    role: 'classTeacher',
    roleName: '2-6 담임',
    classNo: 6,
    coTeacher: '최윤선 선생님',
    busNo: 6,
    isHead: false,
    phone: '052-289-6481',
  },
];

export interface TimelineEvent {
  time: string;
  title: string;
  desc: string;
  badge?: string;
  color?: string;
}

export interface DayItinerary {
  day: number;
  date: string;
  title: string;
  route: string;
  events: TimelineEvent[];
}

export const ITINERARY: DayItinerary[] = [
  {
    day: 1,
    date: '10월 14일 (수)',
    title: '1일차: 경복궁 · 서대문형무소 · 대학로',
    route: '학교 → 덕평휴게소 → 경복궁 → 서대문형무소 → 대학로 서연아트홀 → 나인트리 호텔 판교',
    events: [
      { time: '06:40', title: '학교 운동장 집결', desc: '인원 점검, 건강 확인, 안전교육 실시' },
      { time: '07:00 ~ 10:30', title: '학교 출발 → 서울 방향 이동', desc: '2시간 간격 휴게소 정차 (20분 휴식)', badge: '이동', color: 'amber' },
      { time: '10:30 ~ 11:30', title: '덕평휴게소 중식', desc: '개별 점심 식사 (개인 용돈 또는 도시락)', badge: '중식', color: 'blue' },
      { time: '11:30 ~ 13:00', title: '경복궁으로 이동', desc: '서울 종로구 이동', badge: '이동', color: 'amber' },
      { time: '13:00 ~ 14:00', title: '경복궁 관람 및 단체 사진', desc: '근정전 일대 단체 사진 촬영 후 조별 관람', badge: '사진', color: 'emerald' },
      { time: '14:00 ~ 14:30', title: '서대문형무소로 이동', desc: '차량 이동', badge: '이동', color: 'amber' },
      { time: '14:30 ~ 15:30', title: '서대문형무소 역사관 관람', desc: '독립운동 추모관 및 옥사 견학 (경건한 관람 태도)', badge: '사진', color: 'emerald' },
      { time: '15:30 ~ 16:00', title: '대학로로 이동', desc: '소극장 서연아트홀 이동', badge: '이동', color: 'amber' },
      { time: '16:00 ~ 18:00', title: '공연 관람 <비누향기>', desc: '대학로 힐링 코믹 연극 관람 (촬영 및 음식물 금지)' },
      { time: '18:00 ~ 19:00', title: '나인트리 호텔 판교 이동', desc: '숙소 이동', badge: '이동', color: 'amber' },
      { time: '19:00 ~ 20:00', title: '저녁 식사 (호텔 석식)', desc: '호텔 식당 (비빔밥 또는 돈가스)', badge: '석식', color: 'blue' },
      { time: '20:00 ~ 20:30', title: '숙소 배정 및 짐 정리', desc: '객실 배정, 카드키 수령 및 비상구 위치 확인' },
      { time: '20:30 ~ 22:00', title: '자유시간 및 휴식', desc: '객실 및 파미어스몰 내 정숙' },
      { time: '22:00 ~ 06:00', title: '점호 및 취침', desc: '야간 안전요원 4명 순찰 근무, 타 객실 이동 엄금', badge: '취침', color: 'purple' },
    ],
  },
  {
    day: 2,
    date: '10월 15일 (목)',
    title: '2일차: 롯데월드 어드벤처 자율 관람',
    route: '호텔 → 롯데월드 어드벤처 (자율 관람) → 호텔',
    events: [
      { time: '07:00 ~ 09:00', title: '기상 및 아침 식사', desc: '호텔 조식 뷔페 이용', badge: '조식', color: 'blue' },
      { time: '09:00 ~ 10:00', title: '롯데월드로 이동', desc: '차량 탑승 후 서울 송파구 롯데월드 이동', badge: '이동', color: 'amber' },
      { time: '10:00 ~ 19:00', title: '롯데월드 어드벤처 자율 체험', desc: '조별 자율 관람 및 밀쿠폰 중식·석식 이용 (지정 14개 업장)', badge: '밀쿠폰', color: 'emerald' },
      { time: '19:00 ~ 20:00', title: '인원 점검 후 숙소로 이동', desc: '19:00 정문 게이트 집결 시간 엄수 및 탑승 체크' },
      { time: '20:00 ~ 22:00', title: '자유시간 및 휴식', desc: '배달음식은 3층 로비에서 수령 후 객실 정리' },
      { time: '22:00 ~ 06:00', title: '점호 및 취침', desc: '타 객실 방문 금지 및 야간 정숙', badge: '취침', color: 'purple' },
    ],
  },
  {
    day: 3,
    date: '10월 16일 (금)',
    title: '3일차: 과천과학관 봉사·관람 & 귀가',
    route: '호텔 → 국립과천과학관 (봉사활동) → 학교 도착',
    events: [
      { time: '07:00 ~ 09:30', title: '기상 및 아침 식사', desc: '호텔 조식 뷔페 식사', badge: '조식', color: 'blue' },
      { time: '09:30 ~ 10:00', title: '퇴실 및 분실물 점검', desc: '객실 짐 최종 점검 후 체크아웃' },
      { time: '10:00 ~ 10:30', title: '국립과천과학관 이동', desc: '경기 과천 이동', badge: '이동', color: 'amber' },
      { time: '10:30 ~ 11:30', title: '과학관 관람 & 환경정화 봉사', desc: '전시관 관람 및 환경정화 활동 (봉사 1시간 인정)', badge: '봉사', color: 'emerald' },
      { time: '11:30 ~ 12:30', title: '과천과학관 식당 중식', desc: '불고기 덮밥 식사', badge: '중식', color: 'blue' },
      { time: '12:30 ~ 17:00', title: '인원 점검 후 학교로 귀가', desc: '2시간 간격 고속도로 휴게소 정차', badge: '이동', color: 'amber' },
      { time: '17:00 ~ 17:30', title: '학교 도착 및 안전 귀가', desc: '평창르비에르 경유 후 학교 운동장 도착, 해산' },
    ],
  },
];

export const LOTTE_COUPON_STORES = [
  { floor: 'B1F 언더랜드', name: '롯데리아 언더랜드', location: '4D슈팅씨어터 옆' },
  { floor: 'B1F 언더랜드', name: '유브유부', location: '롯데리아 옆' },
  { floor: '1F 어드벤처', name: '카페 다쥬르', location: '키즈토리아 좌측' },
  { floor: '1F 어드벤처', name: '팝콘팩토리', location: '투썸플레이스 옆' },
  { floor: '1F 어드벤처', name: '스위티박스', location: '회전목마 앞' },
  { floor: '1F 어드벤처', name: '더쓰리위시스', location: '매직서클 앞 계단 위' },
  { floor: '2F 어드벤처', name: '김피라', location: '상하이 꼬치면관 근처' },
  { floor: '2F 어드벤처', name: '상하이 꼬치면관', location: '바르셀로나광장 앞' },
  { floor: '2F 어드벤처', name: '델리본', location: '게임장 근처' },
  { floor: '2F 어드벤처', name: '라인랜드 퀴즈노스', location: '후렌치레볼루션 앞' },
  { floor: '3F 어드벤처', name: '엠테이블', location: '에스컬레이터 근처' },
  { floor: '4F 어드벤처', name: '파라오스낵', location: '동굴 계단 옆' },
  { floor: '4F 어드벤처', name: '뉴욕핫도그', location: '파라오의 분노 입구 앞' },
  { floor: '4F 어드벤처', name: '오벨리스크', location: '슬릭스튜디오 앞' },
];

export const PREP_CHECKLIST = [
  { category: '기본 도구', item: '수학여행 안내서 및 필기도구' },
  { category: '기본 도구', item: '휴대폰 (비상연락망 저장 및 완충)' },
  { category: '기본 도구', item: '보건용 마스크 여분' },
  { category: '기본 도구', item: '개인 상비약' },
  { category: '기본 도구', item: '개인 물병 (텀블러)' },
  { category: '의류', item: '갈아입을 여벌 옷, 편한 잠옷' },
  { category: '의류', item: '따뜻한 겉옷 (10월 중순 아침/저녁 쌀쌀)' },
  { category: '의류', item: '속옷, 양말 2~3켤레' },
  { category: '의류', item: '접이식 우산 또는 우비' },
  { category: '의류', item: '활동하기 편한 운동화 착용' },
  { category: '위생 도구', item: '세면도구 (칫솔, 치약, 여분 수건)' },
  { category: '위생 도구', item: '휴대용 화장지 및 물티슈' },
  { category: '위생 도구', item: '비닐봉지 (오염된 옷, 쓰레기, 멀미 대비)' },
  { category: '위생 도구', item: '자외선 차단제, 로션' },
  { category: '기타', item: '멀미약 (멀미 심한 경우 출발 전 복용 + 여분 3개)' },
  { category: '기타', item: '소화제, 진통제 등 개인 의약품' },
  { category: '기타', item: '개인 용돈 (1일차 점심값 및 간식비)' },
];

export const EMERGENCY_CONTACTS = [
  { label: '진장중학교 2학년부', tel: '052-289-6481', note: '평일 주간 항상 연결' },
  { label: '응급 · 구급 (소방서)', tel: '119', note: '화재 및 응급환자 발생 시' },
  { label: '범죄 신고 (경찰서)', tel: '112', note: '위급 상황 시 신고' },
  { label: '나인트리 호텔 판교', tel: '031-5178-5000', note: '2박 3일 숙소' },
  { label: '울산광역시교육청 당직실', tel: '052-210-5400', note: '교육청 당직실' },
  { label: '인근 응급 의료기관 (한솔병원)', tel: '02-2147-6000', note: '야간 응급 진료' },
];
