import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const WEVITY_URLS = [
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=21', category: '과학/IT' }, // 게임/소프트웨어
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=22', category: '과학/IT' }, // 과학/공학
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=1', category: '인문/사회' },  // 기획/아이디어
  { url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=26', category: '예술/체육' }  // 예체능/미술/음악
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeWevity() {
  console.log('위비티 실시간 크롤링을 시작합니다... (서버 차단 방지를 위해 천천히 진행됩니다. 약 10초 소요)');
  let sqlContent = `-- 004_crawled_data.sql\n\n`;
  sqlContent += `-- 기존에 삽입한 데이터를 모두 지우고 새 크롤링 데이터로 채웁니다.\n`;
  sqlContent += `TRUNCATE TABLE public.competitions CASCADE;\n\n`;
  sqlContent += `INSERT INTO public.competitions (title, category, region, description, record_tip, d_day, image_url, organizer_url)\nVALUES \n`;

  const values = [];

  for (const target of WEVITY_URLS) {
    try {
      const response = await axios.get(target.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const $ = cheerio.load(response.data);
      
      $('ul.list > li').each((i, el) => {
        if ($(el).hasClass('top')) return; // 헤더 행 무시
        
        const titleRaw = $(el).find('.tit a').text().trim();
        // 불필요한 태그/공백 제거
        const title = titleRaw.replace(/SPECIAL/g, '').replace(/IDEA/g, '').trim();
        if (!title) return;

        const organizer = $(el).find('.organ').text().trim();
        const dDayRaw = $(el).find('.day').text().trim();
        
        // 날짜 파싱 (예: D-3 -> 오늘부터 3일 뒤)
        let dDayStr = '';
        if (dDayRaw.includes('D-')) {
          const days = parseInt(dDayRaw.split('D-')[1]);
          const d = new Date();
          d.setDate(d.getDate() + (isNaN(days) ? 0 : days));
          dDayStr = d.toISOString().split('T')[0];
        } else if (dDayRaw.includes('D+')) {
           const d = new Date();
           d.setDate(d.getDate() - 1);
           dDayStr = d.toISOString().split('T')[0]; // 이미 지난 것
        } else {
          // 마감이나 접수예정 등의 경우 대략 한달 뒤로 세팅 (모의 데이터)
          const d = new Date();
          d.setDate(d.getDate() + 30);
          dDayStr = d.toISOString().split('T')[0];
        }

        const linkRaw = $(el).find('.tit a').attr('href');
        const organizer_url = linkRaw ? `https://www.wevity.com/${linkRaw}` : 'https://www.wevity.com/';

        // 포스터 이미지 랜덤 지정
        const images = [
          'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&q=80',
          'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80',
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&q=80',
          'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=500&q=80'
        ];
        const image_url = images[Math.floor(Math.random() * images.length)];

        // 생기부 팁 자동 생성 로직
        const record_tip = `[주최: ${organizer}] ${target.category} 관련 진로 및 자율동아리 활동으로 생기부에 기재하기 좋은 최신 대회입니다.`;
        
        // SQL Injection 방지를 위한 이스케이프
        const safeTitle = title.replace(/'/g, "''");
        const safeDesc = `주최: ${organizer}`.replace(/'/g, "''");
        const safeTip = record_tip.replace(/'/g, "''");

        values.push(`('${safeTitle}', '${target.category}', '전국', '${safeDesc}', '${safeTip}', '${dDayStr}', '${image_url}', '${organizer_url}')`);
      });
      console.log(`${target.category} 분야 크롤링 완료`);
      await sleep(2000); // 다음 요청 전 2초 대기
    } catch (error) {
      console.error('크롤링 에러:', error.message);
    }
  }

  sqlContent += values.join(',\n') + ';\n';

  const outputPath = './supabase/migrations/004_crawled_data.sql';
  fs.writeFileSync(outputPath, sqlContent, 'utf-8');
  console.log(`\n✅ 크롤링 대성공! 총 ${values.length}개의 실제 대회를 위비티에서 긁어와 SQL 스크립트를 생성했습니다.`);
}

scrapeWevity();
