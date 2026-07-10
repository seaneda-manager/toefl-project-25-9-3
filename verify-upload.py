#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 세트 확인
print("[OK] vocab_sets 확인...")
try:
    resp = supabase.table("vocab_sets").select("*").eq("title", "주니어 능률보카").execute()
    if resp.data:
        set_data = resp.data[0]
        print(f"  세트 ID: {set_data['id']}")
        print(f"  제목: {set_data['title']}")
        print(f"  설명: {set_data.get('description')}")
        set_id = set_data['id']
    else:
        print("  [ERROR] 세트를 찾을 수 없음")
        exit(1)
except Exception as e:
    print(f"  [ERROR] {e}")
    exit(1)

# 세트 항목 개수 확인
print(f"\n[OK] vocab_set_items 확인 (set_id={set_id})...")
try:
    resp = supabase.table("vocab_set_items").select("*", count="exact").eq("set_id", set_id).execute()
    count = resp.count if hasattr(resp, 'count') else len(resp.data or [])
    print(f"  세트 항목 개수: {count}")
    if resp.data:
        print(f"  첫 5개 항목:")
        for item in resp.data[:5]:
            print(f"    - word_id: {item.get('word_id')}, sort_order: {item.get('sort_order')}")
except Exception as e:
    print(f"  [ERROR] {e}")

# 세트의 단어들 확인
print(f"\n[OK] 세트의 실제 단어 확인...")
try:
    resp = supabase.table("vocab_set_items").select("word_id").eq("set_id", set_id).limit(5).execute()
    if resp.data:
        word_ids = [item['word_id'] for item in resp.data]
        print(f"  조회된 word_ids: {word_ids}")

        # 각 단어 조회
        for wid in word_ids:
            wresp = supabase.table("words").select("text,meanings_ko").eq("id", wid).execute()
            if wresp.data:
                word = wresp.data[0]
                print(f"    {word['text']}: {word.get('meanings_ko')}")
except Exception as e:
    print(f"  [ERROR] {e}")

# 전체 words 테이블 단어 개수 (신규 추가된 것)
print(f"\n[OK] 신규 추가된 단어들 확인...")
try:
    # 최근 추가된 단어들 조회
    resp = supabase.table("words").select("*", count="exact").order("created_at", desc=True).limit(10).execute()
    print(f"  최근 추가된 단어들:")
    if resp.data:
        for word in resp.data:
            print(f"    - {word['text']}: {word.get('meanings_ko')}")
except Exception as e:
    print(f"  [ERROR] {e}")
