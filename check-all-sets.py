#!/usr/bin/env python3
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 모든 세트 조회
print("[OK] 모든 vocab_sets 조회...")
try:
    resp = supabase.table("vocab_sets").select("id,title,description").order("created_at", desc=True).limit(20).execute()

    for set_data in resp.data:
        set_id = set_data['id']
        title = set_data['title']

        # 각 세트의 항목 개수
        items_resp = supabase.table("vocab_set_items").select("*", count="exact").eq("set_id", set_id).execute()
        count = items_resp.count if hasattr(items_resp, 'count') else len(items_resp.data or [])

        print(f"\n  [{title}]")
        print(f"    ID: {set_id}")
        print(f"    항목 개수: {count}")

except Exception as e:
    print(f"  [ERROR] {e}")
