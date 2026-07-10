#!/usr/bin/env python3
"""
빈 트랙 (0개 세트) 삭제
"""

from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 빈 트랙 삭제 시작...\n")

# 모든 트랙 조회
resp = supabase.table("vocab_tracks").select("id,title").execute()

tracks_to_delete = []

# 각 트랙의 세트 개수 확인
for track in resp.data:
    track_id = track['id']
    title = track['title']

    sets_resp = supabase.table("vocab_sets").select("*", count="exact").eq("track_id", track_id).execute()
    set_count = sets_resp.count if hasattr(sets_resp, 'count') else len(sets_resp.data or [])

    if set_count == 0:
        tracks_to_delete.append(track)

print(f"[OK] 삭제할 빈 트랙 ({len(tracks_to_delete)}개):\n")

for track in tracks_to_delete:
    track_id = track['id']
    title = track['title']

    try:
        supabase.table("vocab_tracks").delete().eq("id", track_id).execute()
        print(f"  [OK] {title} 삭제됨")
    except Exception as e:
        print(f"  [ERROR] {title} 삭제 실패: {e}")

print(f"\n[OK] 정리 완료!")

# 최종 확인
print("\n[OK] 최종 트랙 목록...\n")

resp = supabase.table("vocab_tracks").select("id,title").order("title").execute()

print(f"남은 트랙 ({len(resp.data)}개):\n")

for i, track in enumerate(resp.data, 1):
    track_id = track['id']
    title = track['title']

    sets_resp = supabase.table("vocab_sets").select("*", count="exact").eq("track_id", track_id).execute()
    set_count = sets_resp.count if hasattr(sets_resp, 'count') else len(sets_resp.data or [])

    print(f"  {i}. {title:40s} ({set_count:3d}개 세트)")
