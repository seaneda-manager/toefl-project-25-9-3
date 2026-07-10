#!/usr/bin/env python3
import os
import json
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

# 직접 PostgreSQL 쿼리 실행 (RPC 사용)
supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print("[OK] 뷰 정의 조회...")
print("vocab_sets_with_counts 뷰의 정의를 SQL로 직접 확인해야 합니다.")
print()
print("대신, 현재 문제를 해결하기 위해 다음 방법을 시도합니다:")
print()

# 방법 1: 세트와 아이템의 직접 조회로 word_count 계산
set_title = "주니어 능률보카"
print(f"[OK] '{set_title}'의 실제 단어 개수 계산...")

try:
    # 세트 조회
    resp = supabase.table("vocab_sets").select("id,title").eq("title", set_title).execute()
    if resp.data:
        set_id = resp.data[0]['id']

        # 아이템 개수 조회
        items_resp = supabase.table("vocab_set_items").select("*", count="exact").eq("set_id", set_id).execute()
        item_count = items_resp.count if hasattr(items_resp, 'count') else len(items_resp.data or [])

        # 실제 단어 개수 (중복 제거)
        if items_resp.data:
            word_ids = set(item['word_id'] for item in items_resp.data)
            word_count = len(word_ids)
        else:
            word_count = 0

        print(f"  세트 ID: {set_id}")
        print(f"  세트 항목 개수: {item_count}")
        print(f"  고유 단어 개수: {word_count}")
        print()

        # 뷰를 직접 업데이트하는 SQL이 필요함
        print("[OK] 뷰를 업데이트하려면 다음 SQL을 실행해야 합니다:")
        print()
        print("-- vocab_sets_with_counts 뷰를 다시 생성하거나 refresh하는 SQL:")
        print("-- 또는 Supabase 콘솔에서 직접 실행")
        print()
        print("-- Option 1: Materialized View 새로고침")
        print("-- REFRESH MATERIALIZED VIEW public.vocab_sets_with_counts;")
        print()
        print("-- Option 2: 뷰 재생성 (뷰의 정의를 알아야 함)")
        print("-- DROP VIEW IF EXISTS public.vocab_sets_with_counts CASCADE;")
        print("-- CREATE VIEW public.vocab_sets_with_counts AS ...")
        print()
        print("[!] Supabase 대시보드에서 SQL 에디터를 열고 위 명령을 실행하세요.")

except Exception as e:
    print(f"  [ERROR] {e}")
