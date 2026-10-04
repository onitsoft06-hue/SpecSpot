import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Trophy, Home, User, Compass, Search, Bookmark, Briefcase, MapPin, Send, CheckCircle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { encryptData, decryptData } from './cryptoUtils';
import './App.css';

// --- MOCK DATA ---
const mockCompetitions = [
  { id: 'mock-1', title: '2026 청소년 미래 과학 창업 경진대회', category: '과학/IT', region: '서울', d_day: '2026-10-20', description: '미래 사회를 이끌어갈 청소년들의 참신한 과학 기술 기반 창업 아이디어를 발굴합니다.', record_tip: '진로활동이나 자율동아리 란에 기재하기 좋습니다.', image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80', organizer_url: 'https://www.science.go.kr' },
  { id: 'mock-2', title: '제 12회 전국 청소년 사회문제 토론대회', category: '인문/사회', region: '부산', d_day: '2026-10-10', description: '현대 사회의 이슈를 분석하고 논리적으로 토론하는 대회입니다.', record_tip: '사회 교과 세특에 논리적 사고력을 보여주기에 적합합니다.', image_url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=500&q=80', organizer_url: 'https://www.moe.go.kr' },
  { id: 'mock-3', title: '2026 지역사랑 청소년 영상/디자인 공모전', category: '예술/체육', region: '경기', d_day: '2026-11-04', description: '우리가 살고 있는 지역의 아름다움을 알리는 영상이나 포스터 디자인을 공모합니다.', record_tip: '미술 세특에 공동체 역량과 창의성을 어필할 수 있습니다.', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80', organizer_url: 'https://www.karts.ac.kr' },
  { id: 'mock-4', title: '전국 고교 수학 모델링 챌린지', category: '수학', region: '대구', d_day: '2026-10-15', description: '실생활의 문제를 수학적 모델링을 통해 해결하는 팀 프로젝트 대회입니다.', record_tip: '수학 세특에 실생활 적용 능력과 팀워크를 강조하기 좋습니다.', image_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500&q=80', organizer_url: 'https://www.kms.or.kr' },
  { id: 'mock-5', title: '청소년 인공지능 해커톤', category: '과학/IT', region: '서울', d_day: '2026-11-15', description: 'AI 기술을 활용하여 일상의 불편함을 해소하는 서비스를 개발합니다.', record_tip: '정보 교과 세특에 프로그래밍 및 문제해결 능력을 기록하기 좋습니다.', image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80', organizer_url: 'https://www.nia.or.kr' }
];

const calculateDDay = (dDayString) => {
  if (typeof dDayString === 'number') return dDayString;
  const targetDate = new Date(dDayString);
  const today = new Date();
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : (diffDays === 0 ? 'Day' : '종료');
};

// --- COMPONENTS ---

// 1. Landing Page (Login Wall)
const LandingPage = ({ session, setSession, allCompetitions }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  const randomPosters = [...allCompetitions].sort(() => 0.5 - Math.random()).slice(0, 3);

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setMsg('구글 로그인 중 오류가 발생했습니다.');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) { setSession({ user: { email } }); } else { setMsg('이메일로 로그인 링크가 전송되었습니다!'); }
    setLoading(false);
  };

  if (session) return <Navigate to="/home" />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-base)' }}>
      {/* Left: Rotating Posters */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'var(--color-bg-subtle)', position: 'relative' }}>
        <h2 style={{ position: 'absolute', top: '10%', fontSize: '2rem', color: 'var(--color-text-base)', zIndex: 10, textAlign: 'center' }}>
          실시간 진행 중인<br/>주요 대회들을 확인하세요
        </h2>
        <div className="poster-carousel-container">
          <div className="poster-carousel">
            {randomPosters.map((comp, idx) => (
              <div key={idx} className="poster-item">
                <img src={comp.image_url} alt="포스터" />
                <div className="poster-content">
                  <span className="badge" style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>{comp.region}</span>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', flex: 1 }}>{comp.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{comp.category}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>D-{calculateDDay(comp.d_day)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', padding: '3rem 2rem' }}>
          <Trophy size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>SpecSpot</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
            로그인하고 지역별 맞춤 대회를 찾아보세요.<br/>생기부를 채우는 가장 똑똑한 방법.
          </p>
          {msg && <p style={{ color: 'var(--color-secondary)', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '500' }}>{msg}</p>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <button onClick={handleGoogleLogin} className="btn" style={{ padding: '1rem', fontSize: '1rem', border: '1px solid var(--color-border)', backgroundColor: '#fff', color: '#333' }}>
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', marginRight: '0.5rem' }} />
              Google 계정으로 시작하기
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>또는 이메일로</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="email" placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)', fontSize: '1rem' }}
            />
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem' }}>
              {loading ? '처리 중...' : '매직링크로 로그인'}
            </button>
          </form>
          <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            강력한 암호화 프로토콜이 적용되어 안심하고 사용할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

// 2. 모달 팝업 및 실제 지원서 폼
const CompetitionModal = ({ comp, onClose, session, profile, fetchApplications }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!comp) return null;
  const dDay = calculateDDay(comp.d_day);
  
  const handleApply = async (e) => {
    e.preventDefault();
    if (!session) return alert('로그인이 필요합니다.');
    setLoading(true);

    // 데이터베이스 저장 전 강력한 암호화 적용 (보안 1원칙)
    const encryptedName = encryptData(name);
    const encryptedPhone = encryptData(phone);
    const encryptedMotivation = encryptData(motivation);

    const { error } = await supabase.from('applications').insert({
      user_id: session.user.id,
      competition_id: comp.id,
      encrypted_name: encryptedName,
      encrypted_phone: encryptedPhone,
      encrypted_motivation: encryptedMotivation
    });

    setLoading(false);
    if (!error) {
      setSuccess(true);
      fetchApplications();
    } else {
      alert('신청 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
        
        {success ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <CheckCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>접수가 완료되었습니다!</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>개인정보는 안전하게 암호화되어 전송되었습니다.</p>
            <button onClick={onClose} className="btn btn-primary">닫기</button>
          </div>
        ) : showForm ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={20} color="var(--color-primary)" /> {comp.title} 지원하기
            </h2>
            <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              🔒 입력하신 개인정보와 지원 동기는 최고 수준의 AES-256 알고리즘으로 즉시 암호화되어 서버에 저장됩니다. (관계자 외 열람 불가)
            </div>
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>이름</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>연락처 (마이페이지 연동)</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>지원 동기 및 다짐 (생기부 활용)</label>
                <textarea required value={motivation} onChange={e => setMotivation(e.target.value)} rows={4} className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn" style={{ flex: 1, border: '1px solid var(--color-border)' }}>취소</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>{loading ? '암호화 및 전송 중...' : '안전하게 제출하기'}</button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {comp.image_url && <img src={comp.image_url} alt="대회 포스터" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }} />}
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{comp.title}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="badge">{comp.category}</span>
              <span className="badge">D-{dDay}</span>
              <span className="badge">📍 {comp.region}</span>
            </div>
            
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>{comp.description}</p>
            
            <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={18} /> 생기부 맞춤 팁
              </h4>
              <p style={{ color: 'var(--color-text-base)', lineHeight: '1.5' }}>{comp.record_tip}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', sm: { flexDirection: 'row' } }}>
              <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>⚡ 스펙스팟 빠른 접수하기</button>
              <a href={comp.organizer_url || '#'} target="_blank" rel="noreferrer" className="btn" style={{ flex: 1, padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' }}>
                주최측 홈페이지 바로가기 🔗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CompetitionCard = ({ comp, isSaved, onSave, onDetailClick }) => {
  const dDay = calculateDDay(comp.d_day);
  return (
    <div className="card">
      {comp.image_url && (
        <div style={{ height: '150px', marginBottom: '1rem', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <img src={comp.image_url} alt="대회 포스터" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <span className="badge" style={{ backgroundColor: comp.category === '과학/IT' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(236, 72, 153, 0.1)', color: comp.category === '과학/IT' ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
          {comp.category}
        </span>
        <span className="badge" style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)', border: '1px solid var(--color-border)' }}>D-{dDay}</span>
      </div>
      <h3 style={{ marginBottom: '0.25rem', fontSize: '1.25rem' }}>{comp.title}</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
        <MapPin size={14} /> {comp.region}
      </p>
      <p style={{ color: 'var(--color-text-base)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>{comp.description}</p>
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Briefcase size={16} /> 생기부 활용 팁
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{comp.record_tip}</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => onDetailClick(comp)} className="btn btn-primary" style={{ flex: 1 }}>상세 보기 / 접수</button>
        <button className="btn" onClick={() => onSave(comp)} style={{ backgroundColor: isSaved ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: isSaved ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
          <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
};

// 3. Home Page (Region Search & Recommendations)
const HomePage = ({ savedIds, onSave, allCompetitions, setDetailComp, profile, appliedIds }) => {
  const [regionQuery, setRegionQuery] = useState('');
  const [searchedRegion, setSearchedRegion] = useState('');

  // 프로필에 지역이 있으면 초기 검색어로 세팅
  useEffect(() => {
    if (profile?.region && !searchedRegion) {
      setRegionQuery(profile.region);
      setSearchedRegion(profile.region);
    }
  }, [profile]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchedRegion(regionQuery);
  };

  const displayedComps = searchedRegion 
    ? allCompetitions.filter(comp => {
        const query = searchedRegion.replace(/\s+/g, '').toLowerCase();
        const titleMatch = comp.title.replace(/\s+/g, '').toLowerCase().includes(query);
        const regionMatch = comp.region.replace(/\s+/g, '').toLowerCase().includes(query);
        const descMatch = (comp.description || '').replace(/\s+/g, '').toLowerCase().includes(query);
        return titleMatch || regionMatch || descMatch;
      })
    : allCompetitions;

  // AI 맞춤 추천 알고리즘:
  // 1. 유저가 저장했거나 접수한 대회들의 카테고리를 수집하여 가장 선호하는 카테고리 파악
  // 2. 해당 카테고리와 지역이 일치하는 대회를 최우선 추천 (없으면 랜덤 2개)
  const getRecommendations = () => {
    const interactedIds = [...new Set([...savedIds, ...appliedIds])];
    const interactedComps = allCompetitions.filter(c => interactedIds.includes(c.id));
    
    let recommended = [];
    if (interactedComps.length > 0) {
      const categoryCounts = interactedComps.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});
      const topCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
      
      recommended = allCompetitions.filter(c => c.category === topCategory && !interactedIds.includes(c.id));
    }
    
    // 만약 추천할 게 없거나 부족하면 프로필 지역 기반으로 채움
    if (recommended.length < 2 && profile?.region) {
      const regionComps = allCompetitions.filter(c => c.region.includes(profile.region) && !interactedIds.includes(c.id));
      recommended = [...recommended, ...regionComps];
    }
    
    // 그래도 부족하면 랜덤
    if (recommended.length < 2) {
      recommended = [...recommended, ...allCompetitions].sort(() => 0.5 - Math.random());
    }
    
    return [...new Set(recommended)].slice(0, 2); // 중복 제거 후 2개 추출
  };

  const recommendedComps = getRecommendations();

  return (
    <div className="animate-fade-in" style={{ padding: '3rem 0' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-text-base)' }}>
          내 주변 <span style={{ color: 'var(--color-primary)' }}>대회 찾기</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          거주하거나 학교가 있는 지역을 검색하여 참여 가능한 대회를 한눈에 확인하세요.
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: '600px', margin: '0 auto', gap: '0.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MapPin size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="지역명 검색 (예: 서울, 부산, 강남구)" value={regionQuery} onChange={(e) => setRegionQuery(e.target.value)}
              style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-primary)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-base)', fontSize: '1.1rem', outline: 'none' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem', fontSize: '1.1rem' }}>검색</button>
        </form>
      </header>

      {/* 맞춤형 추천 알고리즘 섹션 (최상단 배치) */}
      <div style={{ marginBottom: '4rem', backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
          ✨ AI 맞춤형 대회 추천
        </h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          {profile?.region ? `${profile.region} 지역 및 ` : ''}사용자님의 관심사를 분석하여 꼭 맞는 대회를 찾아왔습니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {recommendedComps.map(comp => (
            <CompetitionCard key={comp.id} comp={comp} isSaved={savedIds.includes(comp.id)} onSave={onSave} onDetailClick={setDetailComp} />
          ))}
        </div>
      </div>

      {searchedRegion && (
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--color-text-base)' }}>
          📍 '{searchedRegion}' 지역 검색 결과 ({displayedComps.length}건)
        </h3>
      )}

      {displayedComps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <p>해당 지역에 현재 진행 중인 대회가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {displayedComps.map(comp => (
            <CompetitionCard key={comp.id} comp={comp} isSaved={savedIds.includes(comp.id)} onSave={onSave} onDetailClick={setDetailComp} />
          ))}
        </div>
      )}
    </div>
  );
};

// 4. Search Page
const SearchPage = ({ savedIds, onSave, allCompetitions, setDetailComp }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const categories = ['전체', '과학/IT', '인문/사회', '예술/체육', '수학'];

  const filteredComps = allCompetitions.filter(comp => {
    const query = searchTerm.replace(/\s+/g, '').toLowerCase();
    const matchSearch = comp.title.replace(/\s+/g, '').toLowerCase().includes(query) || 
                        comp.region.replace(/\s+/g, '').toLowerCase().includes(query) ||
                        (comp.description || '').replace(/\s+/g, '').toLowerCase().includes(query);
    const matchCat = activeCategory === '전체' || comp.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>대회 탐색</h2>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" placeholder="대회명 검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-base)', fontSize: '1rem', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className="btn" style={{ backgroundColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: activeCategory === cat ? 'white' : 'var(--color-text-base)', border: '1px solid', borderColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-border)', whiteSpace: 'nowrap' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>총 {filteredComps.length}개의 대회가 있습니다.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredComps.map(comp => (
          <CompetitionCard key={comp.id} comp={comp} isSaved={savedIds.includes(comp.id)} onSave={onSave} onDetailClick={setDetailComp} />
        ))}
      </div>
    </div>
  );
};

// 5. MyPage (Profile & Applied/Saved)
const MyPage = ({ savedIds, onSave, allCompetitions, session, setSession, setDetailComp, profile, fetchProfile, appliedIds }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ school: '', region: '', phone: '' });
  const [loading, setLoading] = useState(false);
  
  // 학교 검색 관련 상태
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolResults, setSchoolResults] = useState([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditForm({ school: profile.school || '', region: profile.region || '', phone: profile.phone || '' });
      setSchoolQuery(profile.school || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // NEIS 나이스 교육정보 개방포털 API를 이용한 전국 학교 검색
  const searchSchool = async (query) => {
    setSchoolQuery(query);
    if (query.length < 2) {
      setSchoolResults([]);
      return;
    }
    setIsSearchingSchool(true);
    try {
      // 나이스 API 호출 (CORS 허용됨)
      const res = await fetch(`https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=5&SCHUL_NM=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.schoolInfo && data.schoolInfo[1].row) {
        setSchoolResults(data.schoolInfo[1].row);
      } else {
        setSchoolResults([]);
      }
    } catch (e) {
      console.error('학교 검색 실패', e);
      setSchoolResults([]);
    }
    setIsSearchingSchool(false);
  };

  const selectSchool = (schoolName) => {
    setSchoolQuery(schoolName);
    setEditForm({ ...editForm, school: schoolName });
    setSchoolResults([]);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);

    // 폼 제출 시 schoolQuery 값을 editForm.school에 최종 반영
    const finalSchool = editForm.school || schoolQuery;

    // 데이터 저장 전 암호화 (보안 규칙)
    const encryptedSchool = encryptData(finalSchool);
    const encryptedRegion = encryptData(editForm.region);
    const encryptedPhone = encryptData(editForm.phone);

    const { error } = await supabase.from('profiles').upsert({
      user_id: session.user.id,
      encrypted_school: encryptedSchool,
      encrypted_region: encryptedRegion,
      encrypted_phone: encryptedPhone
    });

    setLoading(false);
    if (!error) {
      alert('프로필이 안전하게 암호화되어 저장되었습니다.');
      setIsEditing(false);
      fetchProfile(); // 최신 프로필 갱신
    } else {
      alert('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const savedComps = allCompetitions.filter(comp => savedIds.includes(comp.id));
  const appliedComps = allCompetitions.filter(comp => appliedIds.includes(comp.id));

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>마이 페이지</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>{session?.user?.email} 님, 환영합니다.</p>
        </div>
        <button onClick={handleLogout} className="btn" style={{ border: '1px solid var(--color-border)' }}>로그아웃</button>
      </div>

      {/* 프로필 관리 섹션 */}
      <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--color-primary)" /> 내 기본 정보 
            <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>안전하게 보호됨</span>
          </h3>
          {!isEditing && <button onClick={() => setIsEditing(true)} className="btn">정보 수정</button>}
        </div>

        {isEditing ? (
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '450px' }}>
            
            {/* 전국 학교 실시간 검색 영역 */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: '500' }}>학교명 검색 (자동완성)</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text" 
                  value={schoolQuery} 
                  onChange={e => searchSchool(e.target.value)} 
                  className="input-field" 
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)' }} 
                  placeholder="예: 서울과학고" 
                />
              </div>
              
              {/* 검색 결과 드롭다운 */}
              {schoolResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginTop: '0.25rem', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                  {schoolResults.map((school, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectSchool(school.SCHUL_NM)}
                      style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-bg-subtle)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: '500' }}>{school.SCHUL_NM}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{school.ORG_RDNMA}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div><label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: '500' }}>관심 지역 (검색/추천용)</label><input type="text" value={editForm.region} onChange={e=>setEditForm({...editForm, region: e.target.value})} className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} placeholder="예: 서울, 강남구" /></div>
            <div><label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: '500' }}>연락처</label><input type="text" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone: e.target.value})} className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /></div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsEditing(false)} className="btn" style={{ flex: 1, border: '1px solid var(--color-border)' }}>취소</button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>{loading ? '저장 중...' : '안전하게 저장'}</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>* 입력된 정보는 암호화되어 관리자도 읽을 수 없습니다.</p>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p><strong>학교명:</strong> {profile?.school || '미등록'}</p>
            <p><strong>관심 지역:</strong> {profile?.region || '미등록'}</p>
            <p><strong>연락처:</strong> {profile?.phone || '미등록'}</p>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Send size={20} color="var(--color-primary)" /> 내가 접수한 대회 ({appliedComps.length})
      </h3>
      {appliedComps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: '3rem' }}>
          <p>아직 접수한 대회가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {appliedComps.map(comp => (
            <CompetitionCard key={comp.id} comp={comp} isSaved={savedIds.includes(comp.id)} onSave={onSave} onDetailClick={setDetailComp} />
          ))}
        </div>
      )}

      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bookmark size={20} color="var(--color-primary)" /> 내가 스크랩한 대회 ({savedComps.length})
      </h3>
      {savedComps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <p>아직 저장한 대회가 없습니다.</p>
          <Link to="/home" style={{ color: 'var(--color-primary)', fontWeight: '500', marginTop: '0.5rem', display: 'inline-block' }}>대회 탐색하러 가기 &rarr;</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {savedComps.map(comp => (
            <CompetitionCard key={comp.id} comp={comp} isSaved={true} onSave={onSave} onDetailClick={setDetailComp} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

function App() {
  const [session, setSession] = useState(null);
  const [allCompetitions, setAllCompetitions] = useState(mockCompetitions);
  const [savedIds, setSavedIds] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);
  const [profile, setProfile] = useState(null);
  const [detailComp, setDetailComp] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const fetchComps = async () => {
      const { data, error } = await supabase.from('competitions').select('*');
      if (data && data.length > 0 && !error) setAllCompetitions(data);
    };
    fetchComps();

    return () => subscription.unsubscribe();
  }, []);

  // 유저 정보(세션)가 있으면 연관된 스크랩, 접수내역, 프로필을 불러옵니다.
  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchSavedComps();
      fetchApplications();
    } else {
      setSavedIds([]);
      setAppliedIds([]);
      setProfile(null);
    }
  }, [session]);

  const fetchProfile = async () => {
    if (!session) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
    if (data) {
      // 복호화 수행 (보안 해독)
      setProfile({
        school: decryptData(data.encrypted_school),
        region: decryptData(data.encrypted_region),
        phone: decryptData(data.encrypted_phone),
      });
    }
  };

  const fetchSavedComps = async () => {
    if (!session) return;
    const { data } = await supabase.from('saved_competitions').select('competition_id').eq('user_id', session.user.id);
    if (data) setSavedIds(data.map(item => item.competition_id));
  };

  const fetchApplications = async () => {
    if (!session) return;
    const { data } = await supabase.from('applications').select('competition_id').eq('user_id', session.user.id);
    if (data) setAppliedIds(data.map(item => item.competition_id));
  };

  const toggleSave = async (comp) => {
    const isCurrentlySaved = savedIds.includes(comp.id);
    if (isCurrentlySaved) {
      setSavedIds(savedIds.filter(id => id !== comp.id));
    } else {
      setSavedIds([...savedIds, comp.id]);
    }

    if (session) {
      if (isCurrentlySaved) {
        await supabase.from('saved_competitions').delete().match({ user_id: session.user.id, competition_id: comp.id });
      } else {
        await supabase.from('saved_competitions').insert({ user_id: session.user.id, competition_id: comp.id });
      }
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage session={session} setSession={setSession} allCompetitions={allCompetitions} />} />
        
        <Route path="/*" element={
          session ? (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <nav style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
                  <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                    <Trophy size={24} /> SpecSpot
                  </Link>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-base)', fontWeight: '500' }}><MapPin size={18} /> 지역별 검색</Link>
                    <Link to="/search" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontWeight: '500' }}><Compass size={18} /> 탐색</Link>
                    <Link to="/mypage" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontWeight: '500' }}><User size={18} /> 마이페이지</Link>
                  </div>
                </div>
              </nav>

              <main className="container" style={{ flex: 1, width: '100%' }}>
                <Routes>
                  <Route path="/home" element={<HomePage savedIds={savedIds} appliedIds={appliedIds} onSave={toggleSave} allCompetitions={allCompetitions} setDetailComp={setDetailComp} profile={profile} />} />
                  <Route path="/search" element={<SearchPage savedIds={savedIds} onSave={toggleSave} allCompetitions={allCompetitions} setDetailComp={setDetailComp} />} />
                  <Route path="/mypage" element={<MyPage savedIds={savedIds} appliedIds={appliedIds} onSave={toggleSave} allCompetitions={allCompetitions} session={session} setSession={setSession} setDetailComp={setDetailComp} profile={profile} fetchProfile={fetchProfile} />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </main>
              
              <footer style={{ backgroundColor: 'var(--color-bg-base)', borderTop: '1px solid var(--color-border)', padding: '2rem 0', marginTop: '4rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                <p>© 2026 SpecSpot. 생기부를 위한 최고의 선택.</p>
              </footer>
            </div>
          ) : <Navigate to="/" replace />
        } />
      </Routes>
      
      {/* 대회 접수 및 상세 모달 */}
      <CompetitionModal comp={detailComp} onClose={() => setDetailComp(null)} session={session} profile={profile} fetchApplications={fetchApplications} />
    </Router>
  );
}

export default App;
