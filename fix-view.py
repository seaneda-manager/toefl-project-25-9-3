#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 뷰의 정의 확인 (information_schema 사용)
print("[OK] 뷰 정의 확인...")
try:
    resp = supabase.table("information_schema.views").select("*").eq("table_name", "vocab_sets_with_counts").execute()
    if resp.data:
        print(f"  뷰 정의: {resp.data}")
    else:
        print("  뷰 정보 없음")
except Exception as e:
    print(f"  [ERROR] {e}")

# materialized view refresh 시도
print("\n[OK] Materialized View Refresh 시도...")
try:
    # 직접 RPC 호출로 뷰 refresh
    resp = supabase.rpc("pg_sleep", {"seconds": 0.1}).execute()
    print(f"  pg_sleep 성공: {resp}")
except Exception as e:
    print(f"  pg_sleep 실패: {e}")

# REFRESH MATERIALIZED VIEW 시도 (함수 없이 직접)
print("\n[OK] 다른 방법 시도 - 뷰 정의 재생성...")

# vocab_sets_with_counts 뷰를 수동으로 업데이트 (뷰가 없는 경우 생성)
try:
    # 뷰가 제대로 작동하지 않을 수 있으니, set_id 직접 업데이트하기
    # 또는 word_count를 계산하는 테이블 추가

    # 먼저 뷰에서 계산을 잘못하고 있는지 확인
    print("\n[OK] word_count=0인 이유 확인...")
    resp = supabase.table("vocab_sets").select("*").eq("title", "주니어 능률보카").execute()
    if resp.data:
        set_id = resp.data[0]['id']

        # 수동으로 뷰의 통계 업데이트 (테이블에 열을 추가하거나 트리거 생성)
        # 또는 간단하게 track_id 설정해주기
        print(f"\n[OK] 세트의 track_id 확인: {resp.data[0].get('track_id')}")

        # 다른 세트와 비교 (track_id가 있는지 확인)
        resp2 = supabase.table("vocab_sets").select("id,title,track_id").limit(5).execute()
        print("\n[OK] 다른 세트들의 track_id:")
        for s in resp2.data:
            print(f"  {s['title']}: track_id={s.get('track_id')}")

except Exception as e:
    print(f"  [ERROR] {e}")
