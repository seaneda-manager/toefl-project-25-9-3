#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 주니어 능률보카 세트의 뷰 데이터 확인
print("[OK] vocab_sets_with_counts 뷰에서 주니어 능률보카 조회...")
try:
    resp = supabase.table("vocab_sets_with_counts").select("*").eq("title", "주니어 능률보카").execute()

    if resp.data:
        set_data = resp.data[0]
        print(f"  제목: {set_data['title']}")
        print(f"  ID: {set_data['id']}")
        print(f"  word_count: {set_data.get('word_count')}")
        print(f"  item_count: {set_data.get('item_count')}")
        print(f"  전체 필드: {list(set_data.keys())}")
    else:
        print("  [ERROR] 세트를 찾을 수 없음")

    # 직접 vocab_sets에서도 조회
    print("\n[OK] vocab_sets 직접 조회...")
    resp2 = supabase.table("vocab_sets").select("*").eq("title", "주니어 능률보카").execute()
    if resp2.data:
        set_id = resp2.data[0]['id']
        print(f"  세트 ID: {set_id}")

        # vocab_set_items 직접 카운트
        resp3 = supabase.table("vocab_set_items").select("*", count="exact").eq("set_id", set_id).execute()
        count = resp3.count if hasattr(resp3, 'count') else len(resp3.data or [])
        print(f"  실제 vocab_set_items 개수: {count}")

except Exception as e:
    print(f"  [ERROR] {e}")

# 뷰 함수 이름 확인 - 뷰가 언제 업데이트되는지 확인
print("\n[OK] 뷰 업데이트 시도...")
try:
    # Supabase의 refresh materialized view 시도
    resp = supabase.rpc("refresh_vocab_sets_with_counts_materialized_view").execute()
    print(f"  뷰 업데이트 결과: {resp}")
except Exception as e:
    print(f"  뷰 업데이트 함수 없음 또는 에러: {e}")

# 다른 이름의 함수 시도
try:
    resp = supabase.rpc("refresh_vocab_sets_with_counts").execute()
    print(f"  뷰 업데이트 (다른 이름): {resp}")
except Exception as e:
    print(f"  뷰 업데이트 (다른 이름) 실패: {e}")
