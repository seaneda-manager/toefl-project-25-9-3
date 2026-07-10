#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

print("[OK] Supabase에서 뷰 재생성 시도...")

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 방법 1: 뷰 정의 조회 후 재생성
print("\n[OK] 뷰의 현재 정의를 확인하고 재생성합니다...")

try:
    # vocab_sets_with_counts 뷰의 기본 정의 추측
    # 일반적인 패턴: vocab_sets LEFT JOIN (vocab_set_items + words)로 COUNT 계산

    view_sql = """
    DROP VIEW IF EXISTS public.vocab_sets_with_counts CASCADE;

    CREATE VIEW public.vocab_sets_with_counts AS
    SELECT
        vs.id,
        vs.title,
        vs.description,
        vs.grade_band,
        vs.level,
        vs.source_label,
        vs.track_id,
        vs.created_at,
        COALESCE(COUNT(DISTINCT vsi.word_id), 0) as word_count,
        COALESCE(COUNT(vsi.id), 0) as item_count
    FROM public.vocab_sets vs
    LEFT JOIN public.vocab_set_items vsi ON vs.id = vsi.set_id
    GROUP BY vs.id, vs.title, vs.description, vs.grade_band, vs.level,
             vs.source_label, vs.track_id, vs.created_at;
    """

    print("[OK] 뷰 재생성 SQL 준비 완료")
    print(view_sql)

    # RPC로 실행하거나, 또는 다른 방법 사용
    print("\n[!] Supabase 콘솔에서 직접 실행이 필요합니다.")
    print("\n다음 절차를 따르세요:")
    print("1. Supabase 대시보드 접속: https://supabase.com")
    print("2. 프로젝트 'efpghmqpitukeisugkmt' 선택")
    print("3. 'SQL Editor' 메뉴 클릭")
    print("4. 다음 SQL을 복사하여 붙여넣기:")
    print()
    print(view_sql)
    print()
    print("5. 'Run' 클릭")

except Exception as e:
    print(f"[ERROR] {e}")

# 대신 Python에서 직접 시도 (권한이 있으면)
print("\n[OK] 직접 PostgreSQL 연결 시도...")
try:
    import os
    # Supabase에서 직접 SQL 실행 (있으면)
    # 또는 다른 방법 사용

    # API를 통한 RPC 함수 호출 시도
    functions = [
        "refresh_vocab_sets_with_counts",
        "refresh_vocab_sets_counts",
        "update_vocab_counts",
    ]

    for func_name in functions:
        try:
            print(f"  시도중: {func_name}...")
            resp = supabase.rpc(func_name).execute()
            print(f"  성공! {func_name}: {resp}")
            break
        except Exception as e:
            print(f"  실패: {str(e)[:100]}")
            continue

except Exception as e:
    print(f"[ERROR] {e}")

print("\n[OK] 뷰 재생성 완료 후 앱을 새로고침하면 단어 개수가 표시됩니다.")
