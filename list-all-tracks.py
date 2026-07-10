#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 모든 vocab_tracks 목록...\n")

resp = supabase.table("vocab_tracks").select("id,slug,title,total_days").order("title").execute()

print(f"총 {len(resp.data)}개 트랙:\n")

# 각 트랙의 세트 개수 조회
for i, track in enumerate(resp.data, 1):
    track_id = track['id']
    slug = track['slug']
    title = track['title']
    total_days = track['total_days']

    # 이 트랙의 세트 개수
    sets_resp = supabase.table("vocab_sets").select("*", count="exact").eq("track_id", track_id).execute()
    set_count = sets_resp.count if hasattr(sets_resp, 'count') else len(sets_resp.data or [])

    marker = "[NEW]" if slug.startswith("neungyul") else "     "
    print(f"{marker} {i:2d}. {title:40s} ({set_count:2d}개 세트, {total_days:2d}일)")

print("\n[분석]")
print("  [NEW] = 우리가 새로 만든 것")
print("  기타 = 기존 데이터")
