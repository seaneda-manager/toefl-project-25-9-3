#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 현재 모든 vocab_tracks...\n")

resp = supabase.table("vocab_tracks").select("id,title,total_days").execute()

print(f"총 {len(resp.data)}개 트랙:\n")

for i, track in enumerate(resp.data, 1):
    track_id = track['id']
    title = track['title']
    total_days = track['total_days']

    # 이 트랙의 세트 개수
    sets_resp = supabase.table("vocab_sets").select("*", count="exact").eq("track_id", track_id).execute()
    set_count = sets_resp.count if hasattr(sets_resp, 'count') else len(sets_resp.data or [])

    status = "OK" if set_count > 0 else "EMPTY"
    print(f"  {i}. [{status}] {title:45s} ({set_count:3d}개 세트, {total_days:2d}일)")
