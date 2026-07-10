#!/usr/bin/env python3
"""
능률보카 어원편 정리
- "Day 1~9" 삭제
- "Day unknown" 삭제
- "Day 01~60"만 유지
"""

from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 능률보카 어원편 정리 시작...\n")

# 어원편 track의 모든 세트 조회
track_id = "67253d9c-1cfb-4de0-9fc7-90a4e988bbca"

resp = supabase.table("vocab_sets").select("id,title").eq("track_id", track_id).execute()

# 삭제할 패턴
delete_patterns = [
    "Day 1",   # Day 1~9
    "Day 2",
    "Day 3",
    "Day 4",
    "Day 5",
    "Day 6",
    "Day 7",
    "Day 8",
    "Day 9",
    "Day unknown"
]

sets_to_delete = []
sets_to_keep = []

for set_data in resp.data:
    title = set_data['title']

    # 삭제 패턴 확인
    should_delete = False
    for pattern in delete_patterns:
        if pattern in title and not pattern.replace(" ", "0") in title:
            # "Day 1"은 삭제하되, "Day 01"은 유지
            if pattern.endswith(("1", "2", "3", "4", "5", "6", "7", "8", "9", "unknown")):
                # "Day 1" "Day 2" ... "Day 9" "Day unknown" 체크
                if title == f"능률보카 어원편 {pattern}":
                    should_delete = True
                    break

    if should_delete:
        sets_to_delete.append(set_data)
    else:
        sets_to_keep.append(set_data)

print(f"[OK] 삭제 대상: {len(sets_to_delete)}개")
for s in sets_to_delete:
    print(f"  - {s['title']}")

print(f"\n[OK] 유지 대상: {len(sets_to_keep)}개")
print(f"  Day 01~60 등")

# 삭제
if sets_to_delete:
    print("\n[OK] 삭제 중...")
    for set_data in sets_to_delete:
        set_id = set_data['id']
        title = set_data['title']

        try:
            # 세트의 항목 먼저 삭제
            supabase.table("vocab_set_items").delete().eq("set_id", set_id).execute()

            # 세트 삭제
            supabase.table("vocab_sets").delete().eq("id", set_id).execute()

            print(f"  [OK] {title} 삭제됨")
        except Exception as e:
            print(f"  [ERROR] {title} 삭제 실패: {e}")

print(f"\n[OK] 정리 완료!")
print(f"  유지: {len(sets_to_keep)}개")
print(f"  삭제: {len(sets_to_delete)}개")
