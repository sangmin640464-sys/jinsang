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

const STORAGE_KEY_NOTICES = 'jj_class_notices_v1';
const STORAGE_KEY_GALLERY = 'jj_class_galleries_v1';

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

// BroadcastChannel for instant cross-tab real-time sync
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
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) channel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
};

// ----------------- NOTICES -----------------
export const getNotices = async (classNo?: number | 'all'): Promise<ClassNotice[]> => {
  const targetClass = typeof classNo === 'number' ? classNo : (classNo === 'all' ? 0 : 4);
  let remoteNotices: ClassNotice[] = [];

  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('class_notices')
      .select('*')
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
    // Supabase table not created yet or offline
  }

  // Get local notices
  let localNotices: ClassNotice[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTICES);
    if (saved) {
      localNotices = JSON.parse(saved);
    }
  } catch (e) {}

  // Merge unique notices (local + remote + defaults)
  const map = new Map<string, ClassNotice>();
  DEFAULT_NOTICES.forEach((n) => map.set(n.id, n));
  remoteNotices.forEach((n) => map.set(n.id, n));
  localNotices.forEach((n) => map.set(n.id, n));

  const allList = Array.from(map.values());

  // Filter for class (include class 0 or demo 4 if looking for 4)
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

  // 1. Try Supabase
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
    // If Supabase table isn't created, continue with local storage
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
  // 1. Try Supabase
  try {
    await supabase.from('class_notices').delete().eq('id', noticeId);
  } catch (e) {}

  // 2. Local Storage
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

// ----------------- GALLERY -----------------
export const getGallery = async (classNo?: number | 'all'): Promise<GalleryImage[]> => {
  const targetClass = typeof classNo === 'number' ? classNo : 4;
  let remoteImages: GalleryImage[] = [];

  try {
    let query = supabase.from('class_galleries').select('*').order('created_at', { ascending: false });
    
    // If specific class, check for that class or general (class_no = 0 or 4 for demo)
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

  // Merge unique
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

  // 2. If Supabase failed, convert file to base64 DataURL fallback
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

  // 3. Save to localStorage cache
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GALLERY);
    const list: GalleryImage[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify([newImage, ...list]));
  } catch (e) {}

  // 4. Broadcast
  broadcastUpdate('gallery');

  return newImage;
};

export const deleteGalleryImage = async (id: string): Promise<void> => {
  // 1. Try Supabase
  try {
    await supabase.from('class_galleries').delete().eq('id', id);
  } catch (e) {}

  // 2. Local storage
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GALLERY);
    if (saved) {
      const list: GalleryImage[] = JSON.parse(saved);
      localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify(list.filter((img) => img.id !== id)));
    }
  } catch (e) {}

  broadcastUpdate('gallery');
};
