#!/usr/bin/env python3
"""
트랙 정리 및 재연결
1. 중복 트랙 삭제 (0개 세트인 NEW 트랙들)
2. 세트를 기존 트랙에 재연결
"""

from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 트랙 정리 및 재연결 시작...\n")

# 모든 트랙 조회
resp = supabase.table("vocab_tracks").select("id,slug,title").execute()
all_tracks = resp.data

# 기존 트랙 찾기 (slug가 neungyul로 시작하지 않는 것)
origin_track = None
for track in all_tracks:
    if track['title'] == "능률보카 어원편" and not track['slug'].startswith("neungyul"):
        origin_track = track
        break

if not origin_track:
    print("[ERROR] 기존 '능률보카 어원편' 트랙을 찾을 수 없습니다!")
    exit(1)

origin_track_id = origin_track['id']
print(f"[OK] 기존 트랙 발견: {origin_track['title']} (ID: {origin_track_id})\n")

# 삭제할 트랙 (우리가 만든 것 중 중복)
tracks_to_delete = [
    "능률보카 어원편",  # neungyul-origin으로 시작하는 것
    "능률보카 어원편 (60 Days)",
    "능률보카-주니어"
]

# slug로 정확하게 찾기
delete_slugs = ["neungyul-origin", "neungyul-junior-origin"]

print("[OK] 중복 트랙 삭제...\n")

for track in all_tracks:
    if track['slug'] in delete_slugs or (track['title'] in tracks_to_delete and track['slug'].startswith("neungyul")):
        track_id = track['id']
        title = track['title']

        try:
            # 세트들의 track_id 기존 것으로 업데이트
            sets_resp = supabase.table("vocab_sets").select("id").eq("track_id", track_id).execute()

            if sets_resp.data:
                for set_data in sets_resp.data:
                    supabase.table("vocab_sets").update({"track_id": origin_track_id}).eq("id", set_data['id']).execute()
                print(f"  [OK] {title}: {len(sets_resp.data)}개 세트를 기존 트랙으로 이동")

            # 트랙 삭제
            supabase.table("vocab_tracks").delete().eq("id", track_id).execute()
            print(f"  [OK] {title} 트랙 삭제됨")
        except Exception as e:
            print(f"  [ERROR] {title} 처리 실패: {e}")

print(f"\n[OK] 정리 완료!")

# 최종 확인
print("\n[OK] 최종 상태...\n")

resp = supabase.table("vocab_tracks").select("id,title").order("title").execute()

print(f"남은 트랙 ({len(resp.data)}개):\n")

for i, track in enumerate(resp.data, 1):
    track_id = track['id']
    title = track['title']

    sets_resp = supabase.table("vocab_sets").select("*", count="exact").eq("track_id", track_id).execute()
    set_count = sets_resp.count if hasattr(sets_resp, 'count') else len(sets_resp.data or [])

    print(f"  {i}. {title:40s} ({set_count:3d}개 세트)")
