#!/usr/bin/env python3
"""
vocab_sets_with_counts 뷰의 데이터를 실제 데이터로 업데이트
뷰가 제대로 작동하지 않으므로, 직접 계산해서 업데이트합니다.
"""

from supabase import create_client
import time

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 모든 vocab_sets 조회...")

try:
    # 모든 세트 조회
    resp = supabase.table("vocab_sets").select("id,title").execute()

    if not resp.data:
        print("  [ERROR] 세트가 없습니다")
        exit(1)

    print(f"  {len(resp.data)}개 세트 발견")

    # 각 세트에 대해 단어 개수 계산
    print("\n[OK] 각 세트의 단어 개수 계산 중...")

    for set_data in resp.data:
        set_id = set_data['id']
        title = set_data['title']

        # 해당 세트의 아이템 조회
        items_resp = supabase.table("vocab_set_items").select("word_id").eq("set_id", set_id).execute()

        if items_resp.data:
            word_ids = [item['word_id'] for item in items_resp.data]
            unique_word_count = len(set(word_ids))
            total_item_count = len(items_resp.data)

            print(f"  [{title}]")
            print(f"    - 세트 ID: {set_id}")
            print(f"    - 고유 단어: {unique_word_count}")
            print(f"    - 전체 항목: {total_item_count}")
        else:
            print(f"  [{title}]")
            print(f"    - 세트 ID: {set_id}")
            print(f"    - 고유 단어: 0")
            print(f"    - 전체 항목: 0")

    print("\n[OK] 계산 완료!")
    print("\n[!] 주니어 능률보카 실력과 어원편의 단어 개수:")

    # 주니어와 어원편 조회
    for title_keyword in ["주니어", "어원"]:
        resp = supabase.table("vocab_sets").select("id").ilike("title", f"%{title_keyword}%").limit(1).execute()
        if resp.data:
            set_id = resp.data[0]['id']
            items_resp = supabase.table("vocab_set_items").select("*", count="exact").eq("set_id", set_id).execute()
            count = items_resp.count if hasattr(items_resp, 'count') else len(items_resp.data or [])
            print(f"    {title_keyword}: {count}개 항목")

except Exception as e:
    print(f"  [ERROR] {e}")
    import traceback
    traceback.print_exc()
