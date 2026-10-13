import { supabase } from './supabase';

export interface ClassNotice {
  id: string;
  class_no: number;
  title: string;
  content: string;
  date: string;
  author: string;
  created_at?: string;
}

export interface GalleryImage {
  id: string;
  class_no: number;
  url: string;
  created_at?: string;
}

export interface QaMessage {
  id: string;
  class_no: number;
  student_name: string;
  sender_role: 'teacher' | 'parent';
  sender_name: string;
  content: string;
  time: string;
  created_at?: string;
}

const STORAGE_KEY_NOTICES = 'jj_class_notices_v1';
const STORAGE_KEY_GALLERY = 'jj_class_galleries_v1';
const STORAGE_KEY_QA = 'jj_qa_messages_v1';
export const STORAGE_KEY_NAV_CONFIG = 'jj_nav_config_v2';

export interface NavConfig {
  teacherOrder?: string[];
  hiddenTeacherMenus?: string[];
  hiddenStudentMenus?: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_NAV_CONFIG: NavConfig = {
  teacherOrder: [
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
  ],
  hiddenTeacherMenus: [],
  hiddenStudentMenus: []
};

export const DEFAULT_NOTICES: ClassNotice[] = [
  {
    id: 'notice-sample-1',
    class_no: 4,
    title: '2일차 롯데월드 안내 및 하원 시간',
    date: '10.15 (목) 08:30',
    content: '학부모님들 안녕하십니까! 오늘 2학년 4반 학생들은 롯데월드 자율 체험을 진행합니다. 아이들이 저녁 7시까지 정문 게이트에 무사히 집결할 수 있도록 당부 부탁드립니다. 특이사항 발생 시 언제든 연락주세요. - 담임 이헤레나 올림',
    author: '이헤레나 담임교사'
  },
  {
    id: 'notice-sample-2',
    class_no: 4,
    title: '수학여행 출발 전 안전교육 안내',
    date: '10.13 (화) 16:00',
    content: '내일 출발하는 수학여행과 관련하여 안전교육을 모두 마쳤습니다. 우리 4반 아이들 모두 건강하게 잘 다녀올 수 있도록 꼼꼼히 챙기겠습니다.',
    author: '이헤레나 담임교사'
  }
];

export const DEFAULT_PUBLIC_NOTICES = [
  {
    id: 'pub-notice-1',
    class_no: 0,
    text: '[전체 공지] 19:00 롯데월드 정문 게이트 앞 전원 집결 및 인원 점검',
    time: '14:00',
    author: '본부(조기호/김동욱 선생님)',
    content: '모든 학생 및 인솔교사 선생님들께서는 19:00까지 롯데월드 정문 게이트 앞 광장으로 집결해 주시기 바랍니다. 학급별 인원 점검 및 버스 탑승 준비를 진행합니다.'
  },
  {
    id: 'pub-notice-2',
    class_no: 0,
    text: '[안전 수칙] 이동 중 안전벨트 필수 착용 및 지정 동선 준수 안내',
    time: '08:30',
    author: '본부(안전총괄)',
    content: '버스 이동 중에는 반드시 안전벨트를 착용하고 자리에서 일어나지 마세요. 일행을 놓쳤을 때는 당황하지 말고 제자리에 멈춰 서서 담임선생님께 즉시 전화하세요.'
  }
];

// BroadcastChannel for instant cross-tab sync on same device
const getBroadcastChannel = () => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    return new BroadcastChannel('jj_communication_channel');
  }
  return null;
};

export const broadcastUpdate = (type: 'notices' | 'gallery' | 'qa' | 'activities' | 'nav_config') => {
  try {
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type, timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Broadcast failed:', e);
  }
};

export const subscribeToUpdates = (callback: (type: string) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const channel = getBroadcastChannel();
  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type) {
      callback(e.data.type);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_NOTICES) callback('notices');
    if (e.key === STORAGE_KEY_GALLERY) callback('gallery');
    if (e.key === STORAGE_KEY_QA) callback('qa');
    if (e.key?.startsWith('jj_quiz') || e.key?.startsWith('jj_mission')) callback('activities');
    if (e.key === STORAGE_KEY_NAV_CONFIG) callback('nav_config');
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);

  // Auto poll every 4 seconds for cross-device sync
  const pollInterval = setInterval(() => {
    callback('poll');
  }, 4000);

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    clearInterval(pollInterval);
  };
};

export const getNavConfig = async (): Promise<NavConfig> => {
  let config: NavConfig = { ...DEFAULT_NAV_CONFIG };
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NAV_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      config = { ...config, ...parsed };
    }
  } catch (e) {}

  try {
    const { data, error } = await supabase
      .from('class_notices')
      .select('content')
      .eq('title', '__NAV_CONFIG__')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0 && data[0]?.content) {
      const remoteConfig = JSON.parse(data[0].content);
      config = { ...config, ...remoteConfig };
      try {
        localStorage.setItem(STORAGE_KEY_NAV_CONFIG, JSON.stringify(config));
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Supabase getNavConfig error:', e);
  }

  return config;
};

export const saveNavConfig = async (newConfig: Partial<NavConfig>, authorName: string = '담임교사'): Promise<NavConfig> => {
  const current = await getNavConfig();
  const merged: NavConfig = {
    ...current,
    ...newConfig,
    updatedAt: new Date().toISOString(),
    updatedBy: authorName
  };

  try {
    localStorage.setItem(STORAGE_KEY_NAV_CONFIG, JSON.stringify(merged));
  } catch (e) {}

  broadcastUpdate('nav_config');

  try {
    const { data } = await supabase
      .from('class_notices')
      .select('id')
      .eq('title', '__NAV_CONFIG__')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      await supabase
        .from('class_notices')
        .update({
          content: JSON.stringify(merged),
          date: '네비설정',
          author: authorName
        })
        .eq('id', data[0].id);
    } else {
      await supabase
        .from('class_notices')
        .insert([
          {
            class_no: 0,
            title: '__NAV_CONFIG__',
            content: JSON.stringify(merged),
            date: '네비설정',
            author: authorName
          }
        ]);
    }
  } catch (e) {
    console.warn('Supabase saveNavConfig error:', e);
  }

  return merged;
};

// ----------------- NOTICES -----------------
export const getNotices = async (classNo?: number | 'all'): Promise<ClassNotice[]> => {
  const targetClass = typeof classNo === 'number' ? classNo : (classNo === 'all' ? 0 : 4);
  let remoteNotices: ClassNotice[] = [];

  try {
    // Supabase query (exclude QA messages that start with __QA__:)
    const { data, error } = await supabase
      .from('class_notices')
      .select('*')
      .not('title', 'like', '__QA__:%')
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      remoteNotices = data.map((item) => ({
        id: String(item.id),
        class_no: Number(item.class_no),
        title: item.title,
        content: item.content,
        date: item.date || item.created_at,
        author: item.author || '담임교사',
        created_at: item.created_at
      }));
    }
  } catch (e) {
    console.warn('Supabase notice fetch error:', e);
  }

  // Local storage notices
  let localNotices: ClassNotice[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
    if (saved) {
      localNotices = JSON.parse(saved).filter((n: ClassNotice) => !n.title.startsWith('__QA__:'));
    }
  } catch (e) {}

  // Merge unique notices (filtering out deleted ones)
  const deletedIds = new Set(getDeletedNoticeIds());
  const map = new Map<string, ClassNotice>();
  DEFAULT_NOTICES.filter((n) => !deletedIds.has(String(n.id))).forEach((n) => map.set(n.id, n));
  localNotices.filter((n) => !deletedIds.has(String(n.id))).forEach((n) => map.set(n.id, n));
  remoteNotices.filter((n) => !deletedIds.has(String(n.id))).forEach((n) => map.set(n.id, n)); // remote takes priority

  const allList = Array.from(map.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  if (!classNo || classNo === 'all') {
    return allList;
  }

  const filtered = allList.filter((n) => n.class_no === targetClass || n.class_no === 0 || n.class_no === 4);
  return filtered.length > 0 ? filtered : allList;
};

export const createNotice = async (
  noticeData: { title: string; content: string; class_no: number; author: string }
): Promise<ClassNotice> => {
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}.${now.getDate()} (${['일', '월', '화', '수', '목', '금', '토'][now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newNotice: ClassNotice = {
    id: `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    class_no: noticeData.class_no || 4,
    title: noticeData.title.trim(),
    content: noticeData.content.trim(),
    date: dateStr,
    author: noticeData.author || '담임교사',
    created_at: now.toISOString()
  };

  // 1. Try Supabase Insert
  try {
    const { data, error } = await supabase
      .from('class_notices')
      .insert([
        {
          class_no: newNotice.class_no,
          title: newNotice.title,
          content: newNotice.content,
          date: newNotice.date,
          author: newNotice.author
        }
      ])
      .select();

    if (!error && data && data[0]) {
      newNotice.id = String(data[0].id);
    }
  } catch (e) {
    console.warn('Supabase notice insert error:', e);
  }

  // 2. Local Storage save
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
    const list: ClassNotice[] = saved ? JSON.parse(saved) : [];
    const updated = [newNotice, ...list];
    localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(updated));
  } catch (e) {}

  // 3. Broadcast
  broadcastUpdate('notices');

  return newNotice;
};

const STORAGE_KEY_DELETED_NOTICES = 'jj_deleted_notices_v1';

export const getDeletedNoticeIds = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DELETED_NOTICES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const markNoticeAsDeleted = (noticeId: string | number) => {
  try {
    const strId = String(noticeId);
    const list = getDeletedNoticeIds();
    if (!list.includes(strId)) {
      list.push(strId);
      localStorage.setItem(STORAGE_KEY_DELETED_NOTICES, JSON.stringify(list));
    }
  } catch {}
};

export const deleteNotice = async (noticeId: string | number): Promise<void> => {
  const strId = String(noticeId);
  markNoticeAsDeleted(strId);

  // 1. Supabase delete
  try {
    await supabase.from('class_notices').delete().eq('id', strId);
  } catch (e) {
    console.warn('Supabase notice delete error:', e);
  }

  // 2. Local storage delete from both regular notices & public notices
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
    if (saved) {
      const list: ClassNotice[] = JSON.parse(saved);
      const updated = list.filter((n) => String(n.id) !== strId);
      localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(updated));
    }
  } catch (e) {}

  try {
    const savedPub = localStorage.getItem(STORAGE_KEY_PUBLIC_NOTICES);
    if (savedPub) {
      const list: PublicNoticeItem[] = JSON.parse(savedPub);
      const updated = list.filter((n) => String(n.id) !== strId);
      localStorage.setItem(STORAGE_KEY_PUBLIC_NOTICES, JSON.stringify(updated));
    }
  } catch (e) {}

  // 3. Realtime Broadcast
  broadcastUpdate('notices');
};

export const deleteAllNotices = async (classNo?: number): Promise<void> => {
  const targetClass = classNo || 4;

  // 1. Supabase batch delete (delete non-QA notices for this class or general)
  try {
    await supabase
      .from('class_notices')
      .delete()
      .in('class_no', [targetClass, 0])
      .not('title', 'like', '__QA__:%');
  } catch (e) {
    console.warn('Supabase deleteAllNotices error:', e);
  }

  // 2. Mark default sample notices as deleted so they do not reappear
  DEFAULT_NOTICES.forEach((n) => markNoticeAsDeleted(n.id));
  DEFAULT_PUBLIC_NOTICES.forEach((n) => markNoticeAsDeleted(String(n.id)));

  // 3. Clear local storage notice caches
  try {
    localStorage.removeItem(STORAGE_KEY_NOTICES);
    localStorage.removeItem(STORAGE_KEY_PUBLIC_NOTICES);
  } catch (e) {}

  // 4. Realtime broadcast
  broadcastUpdate('notices');
};

// ----------------- PUBLIC NOTICES (전체 공지 & 학급 상단 배너) -----------------
export interface PublicNoticeItem {
  id: string | number;
  class_no: number; // 0: 전체 공지, 1~6: 특정 학급 공지
  target?: 'all' | 'class' | 'student' | 'parent';
  text: string;
  time: string;
  author: string;
  content?: string;
  created_at?: string;
}

const STORAGE_KEY_PUBLIC_NOTICES = 'jj_public_notices_v2';

export const getPublicNotices = async (myClass?: number, userRole?: string): Promise<PublicNoticeItem[]> => {
  let remoteList: PublicNoticeItem[] = [];

  try {
    // Supabase class_notices 조회 (전체 공지 class_no=0 또는 해당 학급 공지)
    const { data, error } = await supabase
      .from('class_notices')
      .select('*')
      .not('title', 'like', '__QA__:%')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data && Array.isArray(data)) {
      remoteList = data.map((item) => {
        const timeStr = item.created_at
          ? new Date(item.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
          : '최근';
        const isParentNotice = item.title?.includes('학부모');
        const isStudentNotice = item.title?.includes('학생');
        const inferredTarget: 'all' | 'class' | 'student' | 'parent' = 
          Number(item.class_no) === 0 
            ? 'all' 
            : isParentNotice 
              ? 'parent' 
              : isStudentNotice 
                ? 'student' 
                : 'class';
        const defaultPrefix = Number(item.class_no) === 0 
          ? '[전체 공지]' 
          : isParentNotice 
            ? `[${item.class_no}반 학부모]` 
            : `[${item.class_no}반 학생]`;
        const titleText = item.title?.startsWith('[') ? item.title : `${defaultPrefix} ${item.title}`;
        return {
          id: String(item.id),
          class_no: Number(item.class_no),
          target: inferredTarget,
          text: titleText,
          time: timeStr,
          author: item.author || '본부/선생님',
          content: item.content || item.title,
          created_at: item.created_at
        };
      });
    }
  } catch (e) {
    console.warn('Supabase public notices fetch error:', e);
  }

  // Local Storage 저장본
  let localList: PublicNoticeItem[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PUBLIC_NOTICES);
    if (saved) {
      localList = JSON.parse(saved);
    }
  } catch (e) {}

  // 합치기 (중복 id 제거 및 삭제된 공지 제외)
  const deletedIds = new Set(getDeletedNoticeIds());
  const map = new Map<string, PublicNoticeItem>();
  DEFAULT_PUBLIC_NOTICES.filter((n) => !deletedIds.has(String(n.id))).forEach((n) => map.set(String(n.id), n as PublicNoticeItem));
  localList.filter((n) => !deletedIds.has(String(n.id))).forEach((n) => map.set(String(n.id), n));
  remoteList.filter((n) => !deletedIds.has(String(n.id))).forEach((n) => map.set(String(n.id), n));

  const allItems = Array.from(map.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // 1. 학급 필터링: 전체공지(0)는 모두에게 보이고, 학급 공지는 해당 학급 사용자에게 표시
  let filtered = allItems;
  if (myClass && myClass > 0) {
    filtered = filtered.filter((n) => n.class_no === 0 || n.class_no === myClass);
  }

  // 2. 대상 역할(학생 vs 학부모) 필터링
  if (userRole === 'student') {
    filtered = filtered.filter((n) => {
      // 학부모 전용 공지는 학생 화면에서 제외
      if (n.target === 'parent' || n.text.includes('학부모]')) {
        return false;
      }
      return true;
    });
  } else if (userRole === 'parent') {
    filtered = filtered.filter((n) => {
      // 본인학급(학생) 전용 공지는 학부모 화면에서 제외
      if (n.target === 'student' || n.text.includes('학생]')) {
        return false;
      }
      return true;
    });
  }
  // 교사는 모든 공지 확인 가능 (userRole === 'classTeacher' || userRole === 'headTeacher' 등)

  return filtered;
};

export const sendPublicNotice = async (noticeData: {
  target: 'all' | 'class' | 'student' | 'parent';
  class_no?: number;
  text: string;
  author: string;
  detail?: string;
}): Promise<PublicNoticeItem> => {
  const isAll = noticeData.target === 'all';
  const isParent = noticeData.target === 'parent';
  const targetClassNo = isAll ? 0 : (noticeData.class_no || 4);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const prefix = isAll 
    ? '[전체 공지]' 
    : isParent 
      ? `[${targetClassNo}반 학부모]` 
      : `[${targetClassNo}반 학생]`;
  
  let cleanText = noticeData.text.trim();
  if (!cleanText.startsWith('[')) {
    cleanText = `${prefix} ${cleanText}`;
  }

  const newItem: PublicNoticeItem = {
    id: `pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    class_no: targetClassNo,
    target: noticeData.target,
    text: cleanText,
    time: timeStr,
    author: noticeData.author || '선생님',
    content: noticeData.detail?.trim() || cleanText,
    created_at: now.toISOString()
  };

  // 1. Supabase insert
  try {
    const { data, error } = await supabase
      .from('class_notices')
      .insert([
        {
          class_no: newItem.class_no,
          title: newItem.text,
          content: newItem.content,
          date: `${now.getMonth() + 1}.${now.getDate()} ${timeStr}`,
          author: newItem.author
        }
      ])
      .select();

    if (!error && data && data[0]) {
      newItem.id = String(data[0].id);
    }
  } catch (e) {
    console.warn('Supabase public notice insert error:', e);
  }

  // 2. Local storage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PUBLIC_NOTICES);
    const list: PublicNoticeItem[] = saved ? JSON.parse(saved) : [];
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEY_PUBLIC_NOTICES, JSON.stringify(updated));
  } catch (e) {}

  // 3. 실시간 Broadcast
  broadcastUpdate('notices');

  return newItem;
};

// ----------------- GALLERY -----------------
export const getGallery = async (classNo?: number | 'all'): Promise<GalleryImage[]> => {
  const targetClass = typeof classNo === 'number' ? classNo : 4;
  let remoteImages: GalleryImage[] = [];

  try {
    let query = supabase.from('class_galleries').select('*').order('created_at', { ascending: false });
    
    if (typeof classNo === 'number') {
      query = query.in('class_no', [targetClass, 0, 4]);
    }

    const { data, error } = await query;
    if (!error && data && Array.isArray(data)) {
      remoteImages = data.map((item) => ({
        id: String(item.id),
        class_no: Number(item.class_no),
        url: item.image_url,
        created_at: item.created_at
      }));
    }
  } catch (e) {
    console.error('Supabase gallery fetch error:', e);
  }

  // Local storage gallery
  let localImages: GalleryImage[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GALLERY);
    if (saved) {
      localImages = JSON.parse(saved);
    }
  } catch (e) {}

  const map = new Map<string, GalleryImage>();
  remoteImages.forEach((img) => map.set(img.id, img));
  localImages.forEach((img) => map.set(img.id, img));

  const all = Array.from(map.values());
  if (!classNo || classNo === 'all') return all;

  const filtered = all.filter((img) => img.class_no === targetClass || img.class_no === 0 || img.class_no === 4);
  return filtered.length > 0 ? filtered : all;
};

export const uploadGalleryImage = async (
  file: File,
  classNo: number | 'all'
): Promise<GalleryImage> => {
  const numericClass = typeof classNo === 'number' ? classNo : 4;
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}.${fileExt}`;
  const filePath = `class_${numericClass}/${fileName}`;

  let finalUrl = '';
  let finalId = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Try Supabase Storage Upload
  try {
    const { error: uploadError } = await supabase.storage
      .from('gallery_images')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('gallery_images')
        .getPublicUrl(filePath);
      finalUrl = publicUrl;

      // Insert DB
      const { data: dbData, error: dbError } = await supabase
        .from('class_galleries')
        .insert([{ class_no: numericClass, image_url: finalUrl }])
        .select();

      if (!dbError && dbData && dbData[0]) {
        finalId = String(dbData[0].id);
      }
    }
  } catch (e) {
    console.warn('Supabase upload failed, falling back to local storage URL:', e);
  }

  // 2. Base64 fallback if storage failed
  if (!finalUrl) {
    finalUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const newImage: GalleryImage = {
    id: finalId,
    class_no: numericClass,
    url: finalUrl,
    created_at: new Date().toISOString()
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY_GALLERY);
    const list: GalleryImage[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify([newImage, ...list]));
  } catch (e) {}

  broadcastUpdate('gallery');
  return newImage;
};

export const deleteGalleryImage = async (id: string): Promise<void> => {
  try {
    await supabase.from('class_galleries').delete().eq('id', id);
  } catch (e) {}

  try {
    const saved = localStorage.getItem(STORAGE_KEY_GALLERY);
    if (saved) {
      const list: GalleryImage[] = JSON.parse(saved);
      localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify(list.filter((img) => img.id !== id)));
    }
  } catch (e) {}

  broadcastUpdate('gallery');
};

// ----------------- 1:1 Q&A CHAT -----------------
const parseQaTitle = (title: string) => {
  // format: __QA__:{studentName}:{senderRole}:{senderName}
  const parts = title.split(':');
  if (parts.length >= 4 && parts[0] === '__QA__') {
    return {
      student_name: parts[1],
      sender_role: parts[2] as 'teacher' | 'parent',
      sender_name: parts[3]
    };
  }
  return null;
};

export const getQaMessages = async (classNo: number, studentName: string): Promise<QaMessage[]> => {
  let remoteMessages: QaMessage[] = [];

  try {
    const { data, error } = await supabase
      .from('class_notices')
      .select('*')
      .like('title', `__QA__:${studentName}:%`)
      .order('created_at', { ascending: true });

    if (!error && data && Array.isArray(data)) {
      remoteMessages = data.map((item) => {
        const meta = parseQaTitle(item.title);
        return {
          id: String(item.id),
          class_no: Number(item.class_no),
          student_name: meta?.student_name || studentName,
          sender_role: meta?.sender_role || (item.author?.includes('학부모') ? 'parent' : 'teacher'),
          sender_name: meta?.sender_name || item.author,
          content: item.content,
          time: item.date || '오늘',
          created_at: item.created_at
        };
      });
    }
  } catch (e) {
    console.warn('Supabase QA fetch error:', e);
  }

  // Local messages
  let localMessages: QaMessage[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QA);
    if (saved) {
      localMessages = JSON.parse(saved).filter((m: QaMessage) => m.student_name === studentName);
    }
  } catch (e) {}

  // Merge unique
  const map = new Map<string, QaMessage>();
  localMessages.forEach((m) => map.set(m.id, m));
  remoteMessages.forEach((m) => map.set(m.id, m));

  const list = Array.from(map.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });

  return list;
};

export const getAllQaStudents = async (classNo: number): Promise<{ student_name: string; last_message: string; time: string; unread: boolean }[]> => {
  let messages: QaMessage[] = [];

  try {
    const { data, error } = await supabase
      .from('class_notices')
      .select('*')
      .like('title', '__QA__:%')
      .order('created_at', { ascending: true });

    if (!error && data && Array.isArray(data)) {
      messages = data.map((item) => {
        const meta = parseQaTitle(item.title);
        return {
          id: String(item.id),
          class_no: Number(item.class_no),
          student_name: meta?.student_name || '학생',
          sender_role: meta?.sender_role || 'parent',
          sender_name: meta?.sender_name || item.author,
          content: item.content,
          time: item.date || '',
          created_at: item.created_at
        };
      });
    }
  } catch (e) {}

  // Local storage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QA);
    if (saved) {
      const local: QaMessage[] = JSON.parse(saved);
      local.forEach((m) => {
        if (!messages.some((msg) => msg.id === m.id)) {
          messages.push(m);
        }
      });
    }
  } catch (e) {}

  // Group by student_name
  const studentMap = new Map<string, { student_name: string; last_message: string; time: string; unread: boolean }>();
  
  // Default sample student conversations
  studentMap.set('강승엽', {
    student_name: '강승엽',
    last_message: '선생님, 우리 승엽이가 평소에 멀미가 좀 있어서요...',
    time: '10.14',
    unread: true
  });
  studentMap.set('김규빈', {
    student_name: '김규빈',
    last_message: '사진 예쁘게 찍어주셔서 감사합니다!',
    time: '10.14',
    unread: false
  });

  messages.forEach((m) => {
    studentMap.set(m.student_name, {
      student_name: m.student_name,
      last_message: m.content,
      time: m.time,
      unread: m.sender_role === 'parent'
    });
  });

  return Array.from(studentMap.values());
};

export const sendQaMessage = async (msg: {
  class_no: number;
  student_name: string;
  sender_role: 'teacher' | 'parent';
  sender_name: string;
  content: string;
}): Promise<QaMessage> => {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const title = `__QA__:${msg.student_name}:${msg.sender_role}:${msg.sender_name}`;
  const newMsg: QaMessage = {
    id: `qa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    class_no: msg.class_no,
    student_name: msg.student_name,
    sender_role: msg.sender_role,
    sender_name: msg.sender_name,
    content: msg.content.trim(),
    time: timeStr,
    created_at: now.toISOString()
  };

  // 1. Supabase Insert
  try {
    const { data, error } = await supabase
      .from('class_notices')
      .insert([
        {
          class_no: msg.class_no,
          title: title,
          content: newMsg.content,
          date: timeStr,
          author: msg.sender_name
        }
      ])
      .select();

    if (!error && data && data[0]) {
      newMsg.id = String(data[0].id);
    }
  } catch (e) {
    console.warn('Supabase QA insert error:', e);
  }

  // 2. Local Storage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QA);
    const list: QaMessage[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY_QA, JSON.stringify([...list, newMsg]));
  } catch (e) {}

  broadcastUpdate('qa');
  return newMsg;
};

// ----------------- 돌발 퀴즈 (SURPRISE QUIZ) -----------------
export interface Quiz {
  id: string;
  question: string;
  answer: string;
  status: 'active' | 'closed' | 'pending';
  targetAudience: 'all' | 'class';
  classNo?: number;
  author: string;
  timestamp: string;
  hint?: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string | number;
  userName: string;
  userClass: number;
  answer: string;
  isCorrect: boolean;
  timestamp: string;
}

const STORAGE_KEY_QUIZZES = 'jj_quizzes_v1';
const STORAGE_KEY_QUIZ_SUBMISSIONS = 'jj_quiz_submissions_v1';
const STORAGE_KEY_DELETED_QUIZZES = 'jj_deleted_quizzes_v1';

export const getDeletedQuizIds = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DELETED_QUIZZES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'quiz-init-1',
    question: '우리가 2일차에 방문할 테마파크의 상징이자 대표 놀이기구인 성(Castle)이 있는 곳의 이름은 무엇일까요?',
    answer: '매직아일랜드',
    status: 'active',
    targetAudience: 'all',
    author: '총괄본부',
    timestamp: new Date().toISOString(),
    hint: '매직○○○ (힌트: 4글자)'
  }
];

export const getQuizzes = async (): Promise<Quiz[]> => {
  let remoteQuizzes: Quiz[] = [];
  try {
    // 1. 전용 테이블 trip_quizzes 조회
    const { data, error } = await supabase
      .from('trip_quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      remoteQuizzes = data.map((item) => ({
        id: String(item.id),
        question: item.question,
        answer: item.answer,
        hint: item.hint,
        status: item.status || 'active',
        targetAudience: item.target_audience || 'all',
        classNo: item.class_no || 0,
        author: item.author || '총괄본부',
        timestamp: item.created_at
      }));
    } else {
      // 2. Fallback: 기존 class_notices 테이블 조회
      const { data: fallbackData } = await supabase
        .from('class_notices')
        .select('*')
        .like('title', '__QUIZ__:%')
        .order('created_at', { ascending: false });

      if (fallbackData && Array.isArray(fallbackData)) {
        remoteQuizzes = fallbackData.map((item) => {
          try {
            const parsed = JSON.parse(item.content);
            return {
              id: String(item.id),
              ...parsed,
              timestamp: item.created_at || parsed.timestamp
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean) as Quiz[];
      }
    }
  } catch (e) {
    console.warn('Supabase quiz fetch error:', e);
  }

  let localQuizzes: Quiz[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (saved) localQuizzes = JSON.parse(saved);
  } catch (e) {}

  const deletedIds = new Set(getDeletedQuizIds());
  const map = new Map<string, Quiz>();
  DEFAULT_QUIZZES.filter((q) => !deletedIds.has(String(q.id))).forEach((q) => map.set(q.id, q));
  localQuizzes.filter((q) => !deletedIds.has(String(q.id))).forEach((q) => map.set(q.id, q));
  remoteQuizzes.filter((q) => !deletedIds.has(String(q.id))).forEach((q) => map.set(q.id, q));

  return Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const createQuiz = async (quiz: Omit<Quiz, 'id' | 'timestamp'>): Promise<Quiz> => {
  const newQuiz: Quiz = {
    ...quiz,
    id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. 전용 테이블 trip_quizzes 에 insert
    const { data, error } = await supabase
      .from('trip_quizzes')
      .insert([
        {
          question: newQuiz.question,
          answer: newQuiz.answer,
          hint: newQuiz.hint || null,
          status: newQuiz.status,
          target_audience: newQuiz.targetAudience,
          class_no: newQuiz.classNo || 0,
          author: newQuiz.author
        }
      ])
      .select();

    if (!error && data && data[0]) {
      newQuiz.id = String(data[0].id);
    } else {
      // 2. Fallback: class_notices 에 insert
      await supabase.from('class_notices').insert([
        {
          class_no: newQuiz.classNo || 0,
          title: `__QUIZ__:${newQuiz.targetAudience}:${newQuiz.status}`,
          content: JSON.stringify(newQuiz),
          date: '돌발퀴즈',
          author: newQuiz.author
        }
      ]);
    }
  } catch (e) {
    console.warn('Supabase quiz insert error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    const list: Quiz[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify([newQuiz, ...list]));
  } catch (e) {}

  broadcastUpdate('activities');
  return newQuiz;
};

export const updateQuiz = async (quizId: string, updatedData: Partial<Quiz>): Promise<void> => {
  try {
    const payload: any = {};
    if (updatedData.question !== undefined) payload.question = updatedData.question;
    if (updatedData.answer !== undefined) payload.answer = updatedData.answer;
    if (updatedData.hint !== undefined) payload.hint = updatedData.hint || null;
    if (updatedData.status !== undefined) payload.status = updatedData.status;
    if (updatedData.targetAudience !== undefined) payload.target_audience = updatedData.targetAudience;
    if (updatedData.classNo !== undefined) payload.class_no = updatedData.classNo;

    await supabase.from('trip_quizzes').update(payload).eq('id', quizId);
  } catch (e) {
    console.warn('Supabase update quiz error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (saved) {
      const list: Quiz[] = JSON.parse(saved);
      const updated = list.map((q) => (q.id === quizId ? { ...q, ...updatedData } : q));
      localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(updated));
    }
  } catch (e) {}

  broadcastUpdate('activities');
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  const strId = String(quizId);
  try {
    await supabase.from('trip_quizzes').delete().eq('id', quizId);
    await supabase.from('class_notices').delete().eq('id', quizId);
  } catch (e) {
    console.warn('Supabase delete quiz error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (saved) {
      const list: Quiz[] = JSON.parse(saved);
      const filtered = list.filter((q) => String(q.id) !== strId);
      localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(filtered));
    }
  } catch (e) {}

  try {
    const deletedList = getDeletedQuizIds();
    if (!deletedList.includes(strId)) {
      deletedList.push(strId);
      localStorage.setItem(STORAGE_KEY_DELETED_QUIZZES, JSON.stringify(deletedList));
    }
  } catch (e) {}

  broadcastUpdate('activities');
};

export const updateQuizStatus = async (quizId: string, status: 'active' | 'closed'): Promise<void> => {
  try {
    await supabase.from('trip_quizzes').update({ status }).eq('id', quizId);
  } catch (e) {}

  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (saved) {
      const list: Quiz[] = JSON.parse(saved);
      const updated = list.map((q) => (q.id === quizId ? { ...q, status } : q));
      localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(updated));
    }
  } catch (e) {}

  broadcastUpdate('activities');
};

export const getQuizSubmissions = async (quizId?: string): Promise<QuizSubmission[]> => {
  let remoteSubmissions: QuizSubmission[] = [];
  try {
    // 1. 전용 테이블 trip_quiz_submissions
    let query = supabase
      .from('trip_quiz_submissions')
      .select('*')
      .order('created_at', { ascending: true });

    if (quizId) {
      query = query.eq('quiz_id', quizId);
    }

    const { data, error } = await query;
    if (!error && data && Array.isArray(data)) {
      remoteSubmissions = data.map((item) => ({
        id: String(item.id),
        quizId: String(item.quiz_id),
        userId: String(item.user_id),
        userName: item.user_name,
        userClass: Number(item.user_class),
        answer: item.answer,
        isCorrect: Boolean(item.is_correct),
        timestamp: item.created_at
      }));
    } else {
      // 2. Fallback class_notices
      const { data: fallbackData } = await supabase
        .from('class_notices')
        .select('*')
        .like('title', '__QUIZ_SUB__:%')
        .order('created_at', { ascending: true });

      if (fallbackData && Array.isArray(fallbackData)) {
        remoteSubmissions = fallbackData.map((item) => {
          try {
            const parsed = JSON.parse(item.content);
            return {
              id: String(item.id),
              ...parsed,
              timestamp: item.created_at || parsed.timestamp
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean) as QuizSubmission[];
      }
    }
  } catch (e) {
    console.warn('Supabase quiz sub fetch error:', e);
  }

  let localSubmissions: QuizSubmission[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZ_SUBMISSIONS);
    if (saved) localSubmissions = JSON.parse(saved);
  } catch (e) {}

  const map = new Map<string, QuizSubmission>();
  localSubmissions.forEach((s) => map.set(s.id, s));
  remoteSubmissions.forEach((s) => map.set(s.id, s));

  const all = Array.from(map.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (quizId) {
    return all.filter((s) => s.quizId === quizId);
  }
  return all;
};

export const submitQuizAnswer = async (sub: Omit<QuizSubmission, 'id' | 'timestamp'>): Promise<QuizSubmission> => {
  const newSub: QuizSubmission = {
    ...sub,
    id: `qsub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. 전용 테이블 trip_quiz_submissions
    const { data, error } = await supabase
      .from('trip_quiz_submissions')
      .insert([
        {
          quiz_id: String(newSub.quizId),
          user_id: String(newSub.userId),
          user_name: newSub.userName,
          user_class: Number(newSub.userClass || 0),
          answer: newSub.answer,
          is_correct: newSub.isCorrect
        }
      ])
      .select();

    if (!error && data && data[0]) {
      newSub.id = String(data[0].id);
    } else {
      // 2. Fallback
      await supabase.from('class_notices').insert([
        {
          class_no: newSub.userClass || 0,
          title: `__QUIZ_SUB__:${newSub.quizId}:${newSub.isCorrect ? 'O' : 'X'}`,
          content: JSON.stringify(newSub),
          date: '답안제출',
          author: newSub.userName
        }
      ]);
    }
  } catch (e) {
    console.warn('Supabase quiz sub error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUIZ_SUBMISSIONS);
    const list: QuizSubmission[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY_QUIZ_SUBMISSIONS, JSON.stringify([...list, newSub]));
  } catch (e) {}

  broadcastUpdate('activities');
  return newSub;
};

// ----------------- 사진 미션 (PHOTO MISSION) -----------------
export interface TripMission {
  id: string;
  title: string;
  description: string;
  points: number; // 미션 완료 스탬프 점수
  status: 'active' | 'closed';
  classNo?: number; // 0: 전체, 1~6: 특정 반
  author: string;
  timestamp: string;
}

export interface MissionSubmission {
  id: string;
  missionId: string;
  userId: string | number;
  userName: string;
  userClass: number;
  imageUrl: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

const STORAGE_KEY_MISSIONS = 'jj_missions_v1';
const STORAGE_KEY_MISSION_SUBMISSIONS = 'jj_mission_submissions_v1';
const STORAGE_KEY_DELETED_MISSIONS = 'jj_deleted_missions_v1';

export const getDeletedMissionIds = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DELETED_MISSIONS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const DEFAULT_MISSIONS: TripMission[] = [
  {
    id: 'mission-sample-1',
    title: '롯데월드 회전목마 앞 인증샷 🎠',
    description: '친구들과 함께 롯데월드 대표 포토존인 회전목마 앞에서 밝은 미소로 인증 사진을 찍어 올려주세요!',
    points: 100,
    status: 'active',
    classNo: 0,
    author: '총괄본부',
    timestamp: new Date().toISOString()
  },
  {
    id: 'mission-sample-2',
    title: '버스 이동 중 안전벨트 착용 인증 🚌',
    description: '안전하고 즐거운 이동을 위해 안전벨트를 단정히 착용한 모습을 찍어 제출하세요.',
    points: 50,
    status: 'active',
    classNo: 0,
    author: '총괄본부',
    timestamp: new Date().toISOString()
  }
];

export const getMissions = async (): Promise<TripMission[]> => {
  let remoteMissions: TripMission[] = [];
  try {
    // 1. 전용 테이블 trip_missions
    const { data, error } = await supabase
      .from('trip_missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      remoteMissions = data.map((item) => ({
        id: String(item.id),
        title: item.title,
        description: item.description,
        points: item.points || 100,
        status: item.status || 'active',
        classNo: item.class_no || 0,
        author: item.author || '총괄본부',
        timestamp: item.created_at
      }));
    } else {
      // 2. Fallback
      const { data: fallbackData } = await supabase
        .from('class_notices')
        .select('*')
        .like('title', '__MISSION__:%')
        .order('created_at', { ascending: false });

      if (fallbackData && Array.isArray(fallbackData)) {
        remoteMissions = fallbackData.map((item) => {
          try {
            const parsed = JSON.parse(item.content);
            return {
              id: String(item.id),
              ...parsed,
              timestamp: item.created_at || parsed.timestamp
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean) as TripMission[];
      }
    }
  } catch (e) {
    console.warn('Supabase mission fetch error:', e);
  }

  let localMissions: TripMission[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MISSIONS);
    if (saved) localMissions = JSON.parse(saved);
  } catch (e) {}

  const deletedIds = new Set(getDeletedMissionIds());
  const map = new Map<string, TripMission>();
  DEFAULT_MISSIONS.filter((m) => !deletedIds.has(String(m.id))).forEach((m) => map.set(m.id, m));
  localMissions.filter((m) => !deletedIds.has(String(m.id))).forEach((m) => map.set(m.id, m));
  remoteMissions.filter((m) => !deletedIds.has(String(m.id))).forEach((m) => map.set(m.id, m));

  return Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const createMission = async (mission: Omit<TripMission, 'id' | 'timestamp'>): Promise<TripMission> => {
  const newMission: TripMission = {
    ...mission,
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. 전용 테이블 trip_missions
    const { data, error } = await supabase
      .from('trip_missions')
      .insert([
        {
          title: newMission.title,
          description: newMission.description,
          points: newMission.points,
          status: newMission.status,
          class_no: newMission.classNo || 0,
          author: newMission.author
        }
      ])
      .select();

    if (!error && data && data[0]) {
      newMission.id = String(data[0].id);
    } else {
      // 2. Fallback
      await supabase.from('class_notices').insert([
        {
          class_no: newMission.classNo || 0,
          title: `__MISSION__:${newMission.status}`,
          content: JSON.stringify(newMission),
          date: '사진미션',
          author: newMission.author
        }
      ]);
    }
  } catch (e) {
    console.warn('Supabase mission insert error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_MISSIONS);
    const list: TripMission[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify([newMission, ...list]));
  } catch (e) {}

  broadcastUpdate('activities');
  return newMission;
};

export const updateMission = async (missionId: string, updatedData: Partial<TripMission>): Promise<void> => {
  try {
    const payload: any = {};
    if (updatedData.title !== undefined) payload.title = updatedData.title;
    if (updatedData.description !== undefined) payload.description = updatedData.description;
    if (updatedData.points !== undefined) payload.points = updatedData.points;
    if (updatedData.status !== undefined) payload.status = updatedData.status;
    if (updatedData.classNo !== undefined) payload.class_no = updatedData.classNo;

    await supabase.from('trip_missions').update(payload).eq('id', missionId);
  } catch (e) {
    console.warn('Supabase update mission error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_MISSIONS);
    if (saved) {
      const list: TripMission[] = JSON.parse(saved);
      const updated = list.map((m) => (m.id === missionId ? { ...m, ...updatedData } : m));
      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(updated));
    }
  } catch (e) {}

  broadcastUpdate('activities');
};

export const deleteMission = async (missionId: string): Promise<void> => {
  const strId = String(missionId);
  try {
    await supabase.from('trip_missions').delete().eq('id', missionId);
    await supabase.from('class_notices').delete().eq('id', missionId);
  } catch (e) {
    console.warn('Supabase delete mission error:', e);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_MISSIONS);
    if (saved) {
      const list: TripMission[] = JSON.parse(saved);
      const filtered = list.filter((m) => String(m.id) !== strId);
      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(filtered));
    }
  } catch (e) {}

  try {
    const deletedList = getDeletedMissionIds();
    if (!deletedList.includes(strId)) {
      deletedList.push(strId);
      localStorage.setItem(STORAGE_KEY_DELETED_MISSIONS, JSON.stringify(deletedList));
    }
  } catch (e) {}

  broadcastUpdate('activities');
};

export const getMissionSubmissions = async (missionId?: string): Promise<MissionSubmission[]> => {
  let remoteSubmissions: MissionSubmission[] = [];
  try {
    // 1. 전용 테이블 trip_mission_submissions
    let query = supabase
      .from('trip_mission_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (missionId) {
      query = query.eq('mission_id', missionId);
    }

    const { data, error } = await query;
    if (!error && data && Array.isArray(data)) {
      remoteSubmissions = data.map((item) => ({
        id: String(item.id),
        missionId: String(item.mission_id),
        userId: String(item.user_id),
        userName: item.user_name,
        userClass: Number(item.user_class),
        imageUrl: item.image_url,
        comment: item.comment,
        status: item.status || 'approved',
        timestamp: item.created_at
      }));
    } else {
      // 2. Fallback
      const { data: fallbackData } = await supabase
        .from('class_notices')
        .select('*')
        .like('title', '__MSUB__:%')
        .order('created_at', { ascending: false });

      if (fallbackData && Array.isArray(fallbackData)) {
        remoteSubmissions = fallbackData.map((item) => {
          try {
            const parsed = JSON.parse(item.content);
            return {
              id: String(item.id),
              ...parsed,
              timestamp: item.created_at || parsed.timestamp
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean) as MissionSubmission[];
      }
    }
  } catch (e) {
    console.warn('Supabase mission submission fetch error:', e);
  }

  let localSubmissions: MissionSubmission[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MISSION_SUBMISSIONS);
    if (saved) localSubmissions = JSON.parse(saved);
  } catch (e) {}

  const map = new Map<string, MissionSubmission>();
  localSubmissions.forEach((s) => map.set(s.id, s));
  remoteSubmissions.forEach((s) => map.set(s.id, s));

  const all = Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (missionId) {
    return all.filter((s) => s.missionId === missionId);
  }
  return all;
};

export const submitMissionPhoto = async (sub: Omit<MissionSubmission, 'id' | 'timestamp'>): Promise<MissionSubmission> => {
  const newSub: MissionSubmission = {
    ...sub,
    id: `msub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. 전용 테이블 trip_mission_submissions
    const { data, error } = await supabase
      .from('trip_mission_submissions')
      .insert([
        {
          mission_id: String(newSub.missionId),
          user_id: String(newSub.userId),
          user_name: newSub.userName,
          user_class: Number(newSub.userClass || 0),
          image_url: newSub.imageUrl,
          comment: newSub.comment || null,
          status: newSub.status
        }
      ])
      .select();

    if (!error && data && data[0]) {
      newSub.id = String(data[0].id);
    } else {
      // 2. Fallback
      await supabase.from('class_notices').insert([
        {
          class_no: newSub.userClass || 0,
          title: `__MSUB__:${newSub.missionId}:${newSub.status}`,
          content: JSON.stringify(newSub),
          date: '사진미션제출',
          author: newSub.userName
        }
      ]);
    }
  } catch (e) {
    console.warn('Supabase mission sub insert error:', e);
  }

  // 3. 학부모 사진첩(class_galleries)에도 자동 동시 등록
  try {
    await supabase.from('class_galleries').insert([
      {
        class_no: newSub.userClass || 0,
        image_url: newSub.imageUrl,
        author: `${newSub.userName} 학생 (미션인증)`
      }
    ]);
  } catch (e) {}

  try {
    const saved = localStorage.getItem(STORAGE_KEY_MISSION_SUBMISSIONS);
    const list: MissionSubmission[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY_MISSION_SUBMISSIONS, JSON.stringify([newSub, ...list]));
  } catch (e) {}

  broadcastUpdate('activities');
  broadcastUpdate('gallery');
  return newSub;
};
