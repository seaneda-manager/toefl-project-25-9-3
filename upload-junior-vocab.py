#!/usr/bin/env python3
import csv
from supabase import create_client
import os

# Supabase 설정
SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

# CSV 파일 경로
CSV_FILE = r"C:\Users\user\Downloads\junior-vocab-wiseword-fixed.csv"

# 세트 정보
SET_SLUG = "neungyul-junior"
SET_TITLE = "주니어 능률보카"
SET_DESCRIPTION = "주니어 능률보카 실력"

def split_to_arr(v):
    """의미를 배열로 변환"""
    if not v:
        return None
    # 쉼표로 구분된 문자열을 배열로 변환
    parts = [s.strip() for s in str(v).split(",") if s.strip()]
    return parts if parts else None

def main():
    # Supabase 클라이언트 생성
    supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    print("[OK] Supabase 연결 중...")
    print(f"[OK] CSV 파일: {CSV_FILE}")
    print(f"[OK] 세트: {SET_SLUG} - {SET_TITLE}")

    # 1. 세트 생성/조회
    print("\n[OK] 세트 조회/생성 중...")
    try:
        resp = supabase.table("vocab_sets").select("id").eq("slug", SET_SLUG).execute()
        if resp.data:
            set_id = resp.data[0]["id"]
            print(f"[OK] 기존 세트 사용: {set_id}")
        else:
            # 새 세트 생성
            resp = supabase.table("vocab_sets").insert({
                "slug": SET_SLUG,
                "title": SET_TITLE,
                "description": SET_DESCRIPTION,
            }).execute()
            set_id = resp.data[0]["id"]
            print(f"[OK] 새 세트 생성: {set_id}")
    except Exception as e:
        print(f"[ERROR] 세트 생성 실패: {e}")
        return

    # 2. CSV 읽기
    print(f"\n[OK] CSV 파일 읽는 중...")
    words = []
    try:
        with open(CSV_FILE, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                word = {
                    "text": row.get("text", "").strip(),
                    "lemma": row.get("lemma", "").strip() or None,
                    "pos": row.get("pos", "").strip() or None,
                    "meanings_ko": split_to_arr(row.get("meanings_ko")),
                    "meanings_en_simple": split_to_arr(row.get("meanings_en_simple")),
                    "examples_easy": row.get("examples_easy", "").strip() or None,
                }
                if word["text"]:
                    words.append(word)
        print(f"[OK] {len(words)}개 단어 로드됨")
    except Exception as e:
        print(f"[ERROR] CSV 읽기 실패: {e}")
        return

    # 3. 단어 삽입
    print(f"\n[OK] 단어 삽입 중 ({len(words)}개)...")
    inserted_count = 0
    existing_count = 0

    # 배치 처리 (200개씩)
    batch_size = 200
    for i in range(0, len(words), batch_size):
        batch = words[i:i+batch_size]
        try:
            # 먼저 존재하는 단어 확인
            texts = [w["text"] for w in batch]
            resp = supabase.table("words").select("id,text").in_("text", texts).execute()
            existing_texts = {r["text"] for r in resp.data} if resp.data else set()

            # 새 단어만 삽입
            new_words = [w for w in batch if w["text"] not in existing_texts]
            if new_words:
                supabase.table("words").insert(new_words).execute()
                inserted_count += len(new_words)

            existing_count += len(existing_texts)
            print(f"  [{i+len(batch)}/{len(words)}] 진행 중... (+{len(new_words)}, ={len(existing_texts)})")
        except Exception as e:
            print(f"  [ERROR] 배치 {i//batch_size} 실패: {e}")

    print(f"[OK] 단어 삽입 완료: 신규 {inserted_count}, 기존 {existing_count}")

    # 4. 세트에 단어 할당
    print(f"\n[OK] 세트에 단어 할당 중...")
    try:
        # 모든 단어 조회
        resp = supabase.table("words").select("id,text").in_("text", [w["text"] for w in words]).execute()
        word_map = {r["text"]: r["id"] for r in resp.data} if resp.data else {}

        # 세트 항목 삽입
        set_items = [
            {
                "vocab_set_id": set_id,
                "word_id": word_map[w["text"]],
                "position": i
            }
            for i, w in enumerate(words)
            if w["text"] in word_map
        ]

        # 기존 세트 항목 삭제 후 새로 삽입
        supabase.table("vocab_set_items").delete().eq("vocab_set_id", set_id).execute()

        if set_items:
            # 배치 삽입
            for i in range(0, len(set_items), 200):
                batch = set_items[i:i+200]
                supabase.table("vocab_set_items").insert(batch).execute()
                print(f"  [{i+len(batch)}/{len(set_items)}] 진행 중...")

        print(f"[OK] 세트 항목 할당 완료: {len(set_items)}개")
    except Exception as e:
        print(f"[ERROR] 세트 할당 실패: {e}")
        return

    print(f"\n[✅] 업로드 완료!")
    print(f"    세트 ID: {set_id}")
    print(f"    세트 Slug: {SET_SLUG}")
    print(f"    신규 단어: {inserted_count}")
    print(f"    기존 단어: {existing_count}")
    print(f"    세트 항목: {len(set_items)}")

if __name__ == "__main__":
    main()
