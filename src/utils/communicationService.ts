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

export const broadcastUpdate = (type: 'notices' | 'gallery' | 'qa') => {
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

  // Merge unique notices
  const map = new Map<string, ClassNotice>();
  DEFAULT_NOTICES.forEach((n) => map.set(n.id, n));
  localNotices.forEach((n) => map.set(n.id, n));
  remoteNotices.forEach((n) => map.set(n.id, n)); // remote takes priority

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

export const deleteNotice = async (noticeId: string): Promise<void> => {
  try {
    await supabase.from('class_notices').delete().eq('id', noticeId);
  } catch (e) {}

  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
    if (saved) {
      const list: ClassNotice[] = JSON.parse(saved);
      const updated = list.filter((n) => n.id !== noticeId);
      localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(updated));
    }
  } catch (e) {}

  broadcastUpdate('notices');
};

// ----------------- PUBLIC NOTICES (전체 공지 & 학급 상단 배너) -----------------
export interface PublicNoticeItem {
  id: string | number;
  class_no: number; // 0: 전체 공지, 1~6: 특정 학급 공지
  text: string;
  time: string;
  author: string;
  content?: string;
  created_at?: string;
}

const STORAGE_KEY_PUBLIC_NOTICES = 'jj_public_notices_v2';

export const getPublicNotices = async (myClass?: number): Promise<PublicNoticeItem[]> => {
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
        const prefix = Number(item.class_no) === 0 ? '[전체 공지]' : `[${item.class_no}반 공지]`;
        const titleText = item.title?.startsWith('[') ? item.title : `${prefix} ${item.title}`;
        return {
          id: String(item.id),
          class_no: Number(item.class_no),
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

  // 합치기 (중복 id 제거)
  const map = new Map<string, PublicNoticeItem>();
  DEFAULT_PUBLIC_NOTICES.forEach((n) => map.set(String(n.id), n as PublicNoticeItem));
  localList.forEach((n) => map.set(String(n.id), n));
  remoteList.forEach((n) => map.set(String(n.id), n));

  const allItems = Array.from(map.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // 필터링: 전체공지(0)는 모두에게 보이고, 학급 공지는 해당 학급 사용자에게 표시
  if (myClass && myClass > 0) {
    return allItems.filter((n) => n.class_no === 0 || n.class_no === myClass);
  }
  return allItems;
};

export const sendPublicNotice = async (noticeData: {
  target: 'all' | 'class';
  class_no?: number;
  text: string;
  author: string;
  detail?: string;
}): Promise<PublicNoticeItem> => {
  const isAll = noticeData.target === 'all';
  const targetClassNo = isAll ? 0 : (noticeData.class_no || 0);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const prefix = isAll ? '[전체 공지]' : `[${targetClassNo}반 공지]`;
  
  let cleanText = noticeData.text.trim();
  if (!cleanText.startsWith('[')) {
    cleanText = `${prefix} ${cleanText}`;
  }

  const newItem: PublicNoticeItem = {
    id: `pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    class_no: targetClassNo,
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
