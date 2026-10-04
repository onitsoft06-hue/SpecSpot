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
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=21', category: '과학/IT' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=22', category: '과학/IT' },
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=1', category: '인문/사회' },
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
        const regionsList = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
        let extractedRegion = '전국'; // 기본값
        for (const r of regionsList) {
          if (organizer.includes(r) || title.includes(r)) {
            extractedRegion = r;
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
