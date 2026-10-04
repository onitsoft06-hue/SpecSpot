-- 1. Users(회원) 테이블 생성
-- 학생들의 민감한 정보(이름, 이메일 등)를 안전하게 보관합니다.
-- 비밀번호는 Supabase Auth(인증) 시스템에서 자체적으로 강력하게 해시 암호화되어 관리됩니다.
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY, -- 인증된 유저의 고유 ID (외래키)
    email TEXT UNIQUE NOT NULL,                                      -- 암호화/해시 처리될 수 있는 이메일
    school_name TEXT,                                                -- 소속 학교
    interest_category TEXT,                                          -- 관심 분야 (과학, 인문 등)
    region TEXT,                                                     -- 지역 (서울, 경기 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Competitions(대회 정보) 테이블 생성
CREATE TABLE public.competitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,                                -- 대회명
    category TEXT NOT NULL,                             -- 종목 (과학, 인문, 예술 등)
    region TEXT NOT NULL,                               -- 개최 지역
    description TEXT,                                   -- 상세 설명
    record_tip TEXT,                                    -- 💡 생기부 활용 팁 (가장 중요한 부분)
    d_day DATE,                                         -- 마감일/개최일
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Saved_Competitions(관심 대회 보관함) 테이블 생성
CREATE TABLE public.saved_competitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, competition_id) -- 동일한 대회를 중복해서 스크랩하지 못하도록 제한
);

-- 4. [매우 중요] 강력한 보안을 위한 RLS (Row Level Security) 설정
-- 이 설정을 켜지 않으면 누구나 데이터를 읽고 쓸 수 있는 보안 취약점이 생깁니다.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_competitions ENABLE ROW LEVEL SECURITY;

-- 4-1. Profiles 정책: 오직 '자기 자신'의 프로필(개인정보)만 조회하고 수정할 수 있습니다.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4-2. Competitions 정책: 대회 정보는 누구나 조회할 수 있지만, 수정/삭제는 불가능합니다.
CREATE POLICY "Anyone can view competitions" ON public.competitions FOR SELECT USING (true);

-- 4-3. Saved_Competitions 정책: 자기가 스크랩한 대회 정보만 볼 수 있습니다.
CREATE POLICY "Users can view own saved competitions" ON public.saved_competitions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved competitions" ON public.saved_competitions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved competitions" ON public.saved_competitions FOR DELETE USING (auth.uid() = user_id);
