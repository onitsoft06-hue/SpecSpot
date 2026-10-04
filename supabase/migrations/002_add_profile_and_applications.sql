-- 002_add_profile_and_applications.sql

-- 기존 테이블이 서로 꼬여있는 문제를 완전히 해결하기 위해 초기화합니다.
DROP TABLE IF EXISTS public.saved_competitions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;

-- 1. profiles 테이블 생성 (유저의 암호화된 학교, 지역, 연락처 정보 저장)
CREATE TABLE public.profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    encrypted_school TEXT,
    encrypted_region TEXT,
    encrypted_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 활성화 및 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "자신의 프로필만 조회 가능" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "자신의 프로필만 삽입 가능" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "자신의 프로필만 수정 가능" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);


-- 2. applications 테이블 생성 (암호화된 대회 접수 내역 저장)
CREATE TABLE public.applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    competition_id TEXT NOT NULL,
    encrypted_name TEXT NOT NULL,
    encrypted_phone TEXT NOT NULL,
    encrypted_motivation TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 활성화 및 정책 설정
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "자신의 지원서만 조회 가능" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "자신의 지원서만 작성 가능" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "자신의 지원서만 삭제 가능" ON public.applications FOR DELETE USING (auth.uid() = user_id);


-- 3. saved_competitions 테이블 재설정 (관심 대회 보관함)
CREATE TABLE public.saved_competitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    competition_id TEXT NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, competition_id)
);

-- RLS 활성화 및 정책 설정
ALTER TABLE public.saved_competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "자기가 스크랩한 대회만 조회" ON public.saved_competitions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "자기가 스크랩한 대회만 삽입" ON public.saved_competitions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "자기가 스크랩한 대회만 삭제" ON public.saved_competitions FOR DELETE USING (auth.uid() = user_id);
