-- ========================================================
-- 진장중학교 수학여행 스마트 인솔 시스템 Supabase 테이블 & 스토리지 설정
-- (Supabase 대시보드 -> SQL Editor에 붙여넣고 실행(Run)하세요)
-- ========================================================

-- 1. 학부모 실시간 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS public.class_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_no INTEGER NOT NULL DEFAULT 4,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT,
    author TEXT DEFAULT '담임교사',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 익명(anon) 읽기/쓰기 허용 정책
ALTER TABLE public.class_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select class_notices" ON public.class_notices;
CREATE POLICY "Public select class_notices" 
ON public.class_notices FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public insert class_notices" ON public.class_notices;
CREATE POLICY "Public insert class_notices" 
ON public.class_notices FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete class_notices" ON public.class_notices;
CREATE POLICY "Public delete class_notices" 
ON public.class_notices FOR DELETE 
TO anon, authenticated 
USING (true);


-- 2. 학급 활동 사진첩 테이블 권한 보장
CREATE TABLE IF NOT EXISTS public.class_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_no INTEGER NOT NULL DEFAULT 4,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.class_galleries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select class_galleries" ON public.class_galleries;
CREATE POLICY "Public select class_galleries" 
ON public.class_galleries FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Public insert class_galleries" ON public.class_galleries;
CREATE POLICY "Public insert class_galleries" 
ON public.class_galleries FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete class_galleries" ON public.class_galleries;
CREATE POLICY "Public delete class_galleries" 
ON public.class_galleries FOR DELETE 
TO anon, authenticated 
USING (true);


-- 3. 사진 스토리지 버킷 생성 및 Public 설정
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery_images', 'gallery_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 스토리지 읽기 및 업로드 권한 허용
DROP POLICY IF EXISTS "Public Access gallery_images" ON storage.objects;
CREATE POLICY "Public Access gallery_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery_images');

DROP POLICY IF EXISTS "Public Upload gallery_images" ON storage.objects;
CREATE POLICY "Public Upload gallery_images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'gallery_images');
