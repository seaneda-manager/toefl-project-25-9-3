#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 능률보카 어원편 Track에 연결된 세트들...\n")

# 어원편 track의 모든 세트 조회
track_id = "67253d9c-1cfb-4de0-9fc7-90a4e988bbca"

resp = supabase.table("vocab_sets").select("id,title").eq("track_id", track_id).order("title").execute()

print(f"총 {len(resp.data)}개 세트:\n")

# 단어 개수 조회
for i, set_data in enumerate(resp.data, 1):
    set_id = set_data['id']
    title = set_data['title']

    # 이 세트의 단어 개수
    items_resp = supabase.table("vocab_set_items").select("*", count="exact").eq("set_id", set_id).execute()
    count = items_resp.count if hasattr(items_resp, 'count') else len(items_resp.data or [])

    marker = "***" if count > 0 else "   "
    print(f"{marker} {i:2d}. {title:50s} ({count:3d}개)")

print("\n[분석]")
print("  *** = 데이터 있음 (실제 사용)")
print("      = 데이터 없음 (사용 안 함)")
