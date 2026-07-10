#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] vocab_tracks 확인...")
try:
    resp = supabase.table("vocab_tracks").select("*").execute()
    print(f"  전체 track 개수: {len(resp.data)}")

    # 주니어/어원편 관련 track 찾기
    for track in resp.data:
        if "주니어" in track.get("title", "") or "어원" in track.get("title", ""):
            print(f"  ✓ {track['title']} (id: {track['id']})")

    # 없으면 전체 목록
    if not any("주니어" in t.get("title", "") or "어원" in t.get("title", "") for t in resp.data):
        print("\n  ❌ 주니어/어원편 track이 없습니다!")
        print("\n  전체 track 목록:")
        for track in resp.data[:10]:
            print(f"    - {track['title']}")

except Exception as e:
    print(f"  [ERROR] {e}")

print("\n[OK] vocab_sets의 track_id 확인...")
try:
    resp = supabase.table("vocab_sets").select("id,title,track_id").ilike("title", "%주니어%").limit(5).execute()

    for s in resp.data:
        print(f"  {s['title']}: track_id = {s.get('track_id')}")

    if not resp.data:
        print("  ❌ 주니어 vocab_sets도 없습니다!")

except Exception as e:
    print(f"  [ERROR] {e}")
