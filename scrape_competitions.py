import os
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from datetime import datetime

# Supabase 설정 (환경 변수 또는 직접 입력)
url = os.environ.get("SUPABASE_URL", "https://tumzcivoccuebtjtturv.supabase.co")
key = os.environ.get("SUPABASE_KEY", "여기에_서비스_역할(Service_Role)_키를_입력하세요")
supabase: Client = create_client(url, key)

def scrape_korea_competitions():
    print("대회 정보 수집을 시작합니다...")
    # 예시: 특정 대회 정보 사이트(예: 위비티, 씽굿 등)를 크롤링하는 로직
    # 실제 사이트의 구조(HTML)에 따라 선택자(Selector)를 변경해야 합니다.
    target_url = "https://www.example-competition-site.com/list"
    
    try:
        # 실제 환경에서는 headers(User-Agent 등)를 추가하여 봇 차단을 우회해야 할 수 있습니다.
        response = requests.get(target_url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # HTML에서 대회 목록 추출 (임시 선택자)
        items = soup.select('.competition-list-item')
        
        new_competitions = []
        for item in items:
            title = item.select_one('.title').text.strip()
            category = item.select_one('.category').text.strip()
            region = item.select_one('.region').text.strip()
            d_day_text = item.select_one('.d-day').text.strip()
            
            # DB에 넣을 객체 생성
            comp_data = {
                "title": title,
                "category": category,
                "region": region,
                "d_day": d_day_text,
                "description": f"{title}에 대한 상세 설명입니다.",
                "record_tip": "이 대회는 관련 교과 세특 및 진로 활동에 기재하기 좋습니다."
            }
            new_competitions.append(comp_data)
        
        # 수집한 데이터를 Supabase에 저장 (이미 있는 경우 등은 실제 환경에서 예외처리 필요)
        if new_competitions:
            data, count = supabase.table("competitions").insert(new_competitions).execute()
            print(f"성공적으로 {len(new_competitions)}개의 대회를 DB에 업데이트했습니다.")
        else:
            print("새로운 대회가 없거나 사이트 구조가 변경되었습니다.")
            
    except Exception as e:
        print(f"크롤링 중 에러 발생: {e}")

if __name__ == "__main__":
    scrape_korea_competitions()
