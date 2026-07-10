#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 능률 어원편 세트 조회
print("[OK] 능률 어원편 세트 조회...")
try:
    resp = supabase.table("vocab_sets").select("*").ilike("title", "%어원%").limit(1).execute()

    if resp.data:
        set_data = resp.data[0]
        set_id = set_data['id']

        print(f"  제목: {set_data['title']}")
        print(f"  ID: {set_id}")
        print(f"  전체 필드: {list(set_data.keys())}")
        print(f"  full data: {set_data}")

        # vocab_sets_with_counts 뷰 확인
        print("\n[OK] vocab_sets_with_counts 뷰 확인...")
        try:
            resp2 = supabase.table("vocab_sets_with_counts").select("*").eq("id", set_id).execute()
            if resp2.data:
                print(f"  뷰 데이터: {resp2.data[0]}")
            else:
                print(f"  뷰에서 데이터 없음")
        except Exception as e:
            print(f"  뷰 조회 실패: {e}")

    else:
        print("  세트를 찾을 수 없음")
except Exception as e:
    print(f"  [ERROR] {e}")
