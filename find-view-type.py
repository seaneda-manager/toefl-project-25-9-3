#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# pg_views와 pg_matviews에서 뷰 찾기
print("[OK] 뷰 정의 찾는 중...")

views_to_check = [
    "vocab_sets_with_counts",
    "vocab_sets_with_count",
    "vocab_set_counts",
]

for view_name in views_to_check:
    print(f"\n[OK] '{view_name}' 찾는 중...")
    try:
        # 일반 뷰 확인
        resp = supabase.table("information_schema.views").select("*").eq("table_name", view_name).execute()
        if resp.data:
            print(f"  [FOUND] 일반 VIEW: {view_name}")
            print(f"  데이터: {resp.data[0]}")

        # Materialized 뷰 확인
        resp2 = supabase.table("information_schema.tables").select("*").eq("table_name", view_name).eq("table_type", "MATERIALIZED VIEW").execute()
        if resp2.data:
            print(f"  [FOUND] MATERIALIZED VIEW: {view_name}")
            print(f"  데이터: {resp2.data[0]}")

    except Exception as e:
        print(f"  조회 실패: {e}")

# 모든 vocab 관련 뷰/테이블 찾기
print("\n[OK] 모든 vocab 관련 객체 찾는 중...")
try:
    resp = supabase.table("information_schema.tables").select("table_name,table_type").ilike("table_name", "%vocab%").execute()
    if resp.data:
        for table in resp.data[:20]:
            print(f"  {table['table_name']}: {table['table_type']}")
except Exception as e:
    print(f"  조회 실패: {e}")

# word_count 컬럼이 있는 테이블 찾기
print("\n[OK] word_count 컬럼이 있는 객체 찾는 중...")
try:
    resp = supabase.table("information_schema.columns").select("table_name,column_name").ilike("column_name", "%word_count%").execute()
    if resp.data:
        for col in resp.data:
            print(f"  {col['table_name']}.{col['column_name']}")
    else:
        print("  word_count 컬럼 없음")
except Exception as e:
    print(f"  조회 실패: {e}")
