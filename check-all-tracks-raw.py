#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 모든 vocab_tracks 원본 데이터\n")

resp = supabase.table("vocab_tracks").select("*").execute()

for i, track in enumerate(resp.data, 1):
    print(f"{i}. ID: {track['id']}")
    print(f"   title: {track['title']}")
    print(f"   slug: {track.get('slug', 'N/A')}")
    print(f"   total_days: {track.get('total_days', 'N/A')}")

    # 세트 개수
    sets_resp = supabase.table("vocab_sets").select("*", count="exact").eq("track_id", track['id']).execute()
    set_count = sets_resp.count if hasattr(sets_resp, 'count') else len(sets_resp.data or [])
    print(f"   vocab_sets: {set_count}개")
    print()
