#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# vocab_sets 테이블 확인
print("[OK] vocab_sets 테이블 조회...")
try:
    resp = supabase.table("vocab_sets").select("*").limit(1).execute()
    if resp.data:
        print("컬럼들:", list(resp.data[0].keys()))
        print("샘플 데이터:", resp.data[0])
    else:
        print("데이터 없음")
except Exception as e:
    print(f"에러: {e}")

# words 테이블 확인
print("\n[OK] words 테이블 조회...")
try:
    resp = supabase.table("words").select("*").limit(1).execute()
    if resp.data:
        print("컬럼들:", list(resp.data[0].keys()))
        print("샘플 데이터:", resp.data[0])
    else:
        print("데이터 없음")
except Exception as e:
    print(f"에러: {e}")

# vocab_set_items 테이블 확인
print("\n[OK] vocab_set_items 테이블 조회...")
try:
    resp = supabase.table("vocab_set_items").select("*").limit(1).execute()
    if resp.data:
        print("컬럼들:", list(resp.data[0].keys()))
        print("샘플 데이터:", resp.data[0])
    else:
        print("데이터 없음")
except Exception as e:
    print(f"에러: {e}")
