import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경변수 로드 (.env 또는 GitHub Secrets)
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // RLS를 우회하는 강력한 관리자 키 필수

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("🚨 에러: SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WEVITY_URLS = [
  // 과학/IT (IT, 소프트웨어, 게임)
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=21', category: '과학/IT' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=21&p=2', category: '과학/IT' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=21&p=3', category: '과학/IT' },
  
  // 인문/사회 (기획, 아이디어, 마케팅, 논문)
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=1', category: '인문/사회' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=1&p=2', category: '인문/사회' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=2', category: '인문/사회' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=2&p=2', category: '인문/사회' },

  // 예술/체육 (디자인, 캐릭터, 웹툰, 예체능)
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=14', category: '예술/체육' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=14&p=2', category: '예술/체육' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=26', category: '예술/체육' }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runAutoScraper() {
  console.log('🤖 서버 크롤링 봇 가동 시작...');
  const allCompetitions = [];

  for (const target of WEVITY_URLS) {
    try {
      const response = await axios.get(target.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const $ = cheerio.load(response.data);
      
      $('ul.list > li').each((i, el) => {
        if ($(el).hasClass('top')) return;
        
        const titleRaw = $(el).find('.tit a').text().trim();
        const title = titleRaw;
        if (!title) return;

        const organizer = $(el).find('.organ').text().trim();
        const dDayRaw = $(el).find('.day').text().trim();
        
        // 1. 마감된 대회 제외
        if (dDayRaw.includes('마감')) return;
        
        // 2. 중복 제거 (이미 동일한 제목이 배열에 있으면 무시)
        if (allCompetitions.some(c => c.title === title)) return;
        
        let dDayStr = '';
        if (dDayRaw.includes('D-')) {
          const days = parseInt(dDayRaw.split('D-')[1]);
          const d = new Date();
          d.setDate(d.getDate() + (isNaN(days) ? 0 : days));
          dDayStr = d.toISOString().split('T')[0];
        } else if (dDayRaw.includes('D+')) {
           const d = new Date();
           d.setDate(d.getDate() - 1);
           dDayStr = d.toISOString().split('T')[0];
        } else {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          dDayStr = d.toISOString().split('T')[0];
        }

        const linkRaw = $(el).find('.tit a').attr('href');
        const organizer_url = linkRaw ? `https://www.wevity.com/${linkRaw}` : 'https://www.wevity.com/';

        const images = [
          'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&q=80',
          'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80',
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=80',
          'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=500&q=80'
        ];
        const image_url = images[Math.floor(Math.random() * images.length)];
        // 3. 지능형 지역(도 단위) 추출 알고리즘
        const regionMap = [
          { keyword: ['서울', '강남', '종로', '서초', '송파', '여의도'], region: '서울' },
          { keyword: ['부산', '해운대', '서면', '광안리'], region: '부산' },
          { keyword: ['대구', '동성로', '수성구'], region: '대구' },
          { keyword: ['인천', '송도', '부평'], region: '인천' },
          { keyword: ['광주', '상무지구'], region: '광주' },
          { keyword: ['대전', '유성'], region: '대전' },
          { keyword: ['울산', '남구'], region: '울산' },
          { keyword: ['세종'], region: '세종' },
          { keyword: ['경기', '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주', '화성', '평택', '의정부', '파주', '시흥', '김포', '광명', '군포', '하남', '오산', '이천', '양주', '구리', '안성', '의왕', '포천', '양평', '여주', '동두천', '과천', '가평', '연천'], region: '경기' },
          { keyword: ['강원', '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척'], region: '강원' },
          { keyword: ['충북', '청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'], region: '충북' },
          { keyword: ['충남', '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '홍성', '예산', '태안'], region: '충남' },
          { keyword: ['전북', '전주', '군산', '익산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'], region: '전북' },
          { keyword: ['전남', '목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'], region: '전남' },
          { keyword: ['경북', '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'], region: '경북' },
          { keyword: ['경남', '창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산', '의령', '함안', '창녕', '고성', '남해', '하동', '산청', '함양', '거창', '합천'], region: '경남' },
          { keyword: ['제주', '서귀포'], region: '제주' }
        ];

        let extractedRegion = '전국'; // 기본값
        for (const entry of regionMap) {
          if (entry.keyword.some(k => organizer.includes(k) || title.includes(k))) {
            extractedRegion = entry.region;
            break;
          }
        }

        const record_tip = `[주최: ${organizer}] ${target.category} 관련 진로 및 자율동아리 활동으로 생기부에 기재하기 좋은 최신 대회입니다.`;

        allCompetitions.push({
          title,
          category: target.category,
          region: extractedRegion,
          description: `주최: ${organizer}`,
          record_tip,
          d_day: dDayStr,
          image_url,
          organizer_url
        });
      });
      console.log(`✅ ${target.category} 크롤링 완료 (${allCompetitions.length}개 누적)`);
      await sleep(2000);
    } catch (error) {
      console.error(`❌ 크롤링 에러 (${target.category}):`, error.message);
    }
  }

  // 1. 기존 데이터 전체 삭제 (최신 데이터로 덮어쓰기 위함)
  console.log('🧹 데이터베이스 초기화 중...');
  const { error: deleteError } = await supabase.from('competitions').delete().neq('title', 'dummy');
  if (deleteError) {
    console.error('❌ 삭제 실패:', deleteError);
  }

  // 2. 새 데이터 삽입
  console.log('🚀 새 크롤링 데이터 서버 전송 중...');
  const { error: insertError } = await supabase.from('competitions').insert(allCompetitions);
  
  if (insertError) {
    console.error('❌ 데이터베이스 저장 실패:', insertError);
  } else {
    console.log(`🎉 대성공! 총 ${allCompetitions.length}개의 대회가 24시간 무인 서버를 통해 성공적으로 업데이트 되었습니다.`);
  }
}

runAutoScraper();
