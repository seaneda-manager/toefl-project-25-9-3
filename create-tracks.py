#!/usr/bin/env python3
"""
새로운 vocab_tracks 생성 및 vocab_sets 연결
"""

from supabase import create_client
import uuid

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 생성할 tracks
tracks_to_create = [
    {
        "slug": "neungyul-junior",
        "title": "주니어 능률보카",
        "description": "주니어 학생을 위한 기초 영어 단어 (60일)",
        "total_days": 60,
        "set_prefix": "주니어 능률보카 Day"
    },
    {
        "slug": "neungyul-origin",
        "title": "능률보카 어원편",
        "description": "어원을 통한 심화 영어 단어 학습 (60일)",
        "total_days": 60,
        "set_prefix": "능률보카 어원편 Day"
    }
]

print("[OK] Track 생성 및 연결 시작...\n")

for track_info in tracks_to_create:
    print(f"[OK] '{track_info['title']}' 트랙 처리 중...")

    # 1. Track 조회 또는 생성
    resp = supabase.table("vocab_tracks").select("id").eq("title", track_info['title']).limit(1).execute()

    if resp.data:
        track_id = resp.data[0]['id']
        print(f"  기존 트랙 사용: {track_id}")
    else:
        # 새 track 생성
        resp = supabase.table("vocab_tracks").insert({
            "slug": track_info['slug'],
            "title": track_info['title'],
            "description": track_info['description'],
            "total_days": track_info['total_days'],
            "is_active": True,
        }).execute()

        if resp.data:
            track_id = resp.data[0]['id']
            print(f"  새 트랙 생성: {track_id}")
        else:
            print(f"  [ERROR] 트랙 생성 실패")
            continue

    # 2. 해당 track의 vocab_sets 모두 찾기
    print(f"  '{track_info['set_prefix']}'로 시작하는 세트 찾는 중...")

    resp = supabase.table("vocab_sets").select("id,title").ilike("title", f"{track_info['set_prefix']}%").execute()

    if not resp.data:
        print(f"    ❌ 매칭되는 세트가 없습니다!")
        continue

    print(f"    [OK] {len(resp.data)}개 세트 발견")

    # 3. 각 세트의 track_id 업데이트
    set_ids = [s['id'] for s in resp.data]

    for set_id in set_ids:
        try:
            supabase.table("vocab_sets").update({"track_id": track_id}).eq("id", set_id).execute()
        except Exception as e:
            print(f"    [ERROR] {set_id} 업데이트 실패: {e}")

    print(f"    {len(set_ids)}개 세트를 '{track_info['title']}'에 연결했습니다 [OK]")

print("\n[OK] Track 생성 및 연결 완료!")

# 최종 확인
print("\n[OK] 최종 상태 확인...")
resp = supabase.table("vocab_sets").select("title,track_id").ilike("title", "%주니어%").limit(3).execute()
print("  주니어 vocab_sets:")
for s in resp.data:
    print(f"    {s['title']}: track_id = {s['track_id']}")

resp = supabase.table("vocab_sets").select("title,track_id").ilike("title", "%어원%").limit(3).execute()
print("  어원편 vocab_sets:")
for s in resp.data:
    print(f"    {s['title']}: track_id = {s['track_id']}")
