#!/usr/bin/env python3
"""
JSON 파일의 Day 정보를 활용해서 Day별로 정확하게 업로드
주니어 능률보카 + 어원편 모두 처리
"""

import json
from collections import defaultdict
from supabase import create_client

SUPABASE_URL = "https://efpghmqpitukeisugkmt.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_RtR-jhlAksUQ1AYIeHPsHg_GunVR2TJ"

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

def split_to_arr(v):
    """의미를 배열로 변환"""
    if not v:
        return []
    parts = [s.strip() for s in str(v).split(",") if s.strip()]
    return parts

def process_vocab_set(json_file, set_prefix, set_name_template):
    """
    JSON 파일을 읽어서 Day별로 분류하고 업로드

    Args:
        json_file: JSON 파일 경로
        set_prefix: 세트 이름 접두사 (예: "neungyul-junior")
        set_name_template: 세트 이름 템플릿 (예: "주니어 능률보카 Day {day}")
    """

    print(f"\n[OK] {json_file} 처리 중...")

    # 1. JSON 파일 읽기
    with open(json_file, "r", encoding="utf-8-sig") as f:
        data = json.load(f)

    # 2. Day별로 그룹핑
    day_words = defaultdict(list)
    for entry in data:
        text = entry.get("text", "").strip()
        if not text:
            continue

        unit = entry.get("unit", "").strip()  # "DAY 01" 형식
        # "DAY 01" -> "01"
        if unit.startswith("DAY "):
            day_num = unit.replace("DAY ", "").strip().lstrip("0") or "0"
            day_key = f"day{day_num.zfill(2)}"
        else:
            day_key = "unknown"

        word = {
            "text": text,
            "lemma": entry.get("lemma") or None,
            "pos": entry.get("pos") or None,
            "meanings_ko": split_to_arr(entry.get("meanings_ko")),
            "meanings_en_simple": split_to_arr(entry.get("meanings_en_simple")),
            "examples_easy": split_to_arr(entry.get("examples_easy")),
        }
        day_words[day_key].append(word)

    print(f"  발견된 Day: {sorted(day_words.keys())}")

    # 3. 각 Day별로 처리
    total_words = 0
    for day_key in sorted(day_words.keys()):
        words = day_words[day_key]

        # Day 번호 추출 (예: "day01" -> "01" -> "1")
        day_num = day_key.replace("day", "")

        # 세트 정보
        set_slug = f"{set_prefix}-{day_key}"
        set_title = set_name_template.format(day=day_num.lstrip("0") or "0")

        print(f"\n  [{day_key}] {set_title}")
        print(f"    단어 개수: {len(words)}")

        try:
            # 기존 세트 조회 또는 생성
            resp = supabase.table("vocab_sets").select("id").eq("title", set_title).limit(1).execute()

            if resp.data:
                set_id = resp.data[0]["id"]
                print(f"    기존 세트 사용: {set_id}")

                # 기존 항목 삭제
                supabase.table("vocab_set_items").delete().eq("set_id", set_id).execute()
                print(f"    기존 항목 {set_id} 삭제됨")
            else:
                # 새 세트 생성
                resp = supabase.table("vocab_sets").insert({
                    "title": set_title,
                    "description": f"{set_title}",
                }).execute()
                set_id = resp.data[0]["id"]
                print(f"    새 세트 생성: {set_id}")

            # 단어 삽입/조회
            inserted_count = 0
            existing_count = 0
            word_ids = []

            # 배치 처리 (200개씩)
            batch_size = 200
            for i in range(0, len(words), batch_size):
                batch = words[i:i+batch_size]

                # 존재하는 단어 확인
                texts = [w["text"] for w in batch]
                resp = supabase.table("words").select("id,text").in_("text", texts).execute()
                existing_map = {r["text"]: r["id"] for r in (resp.data or [])}

                # 새 단어 삽입
                new_words = [w for w in batch if w["text"] not in existing_map]
                if new_words:
                    supabase.table("words").insert(new_words).execute()
                    inserted_count += len(new_words)

                # 모든 단어의 ID 조회
                resp = supabase.table("words").select("id,text").in_("text", texts).execute()
                for w in batch:
                    for r in (resp.data or []):
                        if r["text"] == w["text"]:
                            word_ids.append(r["id"])
                            if w["text"] not in existing_map:
                                pass  # 이미 카운트됨
                            else:
                                existing_count += 1
                            break

            # 세트 항목 할당
            set_items = [
                {
                    "set_id": set_id,
                    "word_id": word_id,
                    "sort_order": i + 1
                }
                for i, word_id in enumerate(word_ids)
            ]

            # 배치 삽입
            for i in range(0, len(set_items), 200):
                batch = set_items[i:i+200]
                supabase.table("vocab_set_items").insert(batch).execute()

            print(f"    신규 단어: {inserted_count}, 기존 단어: {existing_count}")
            print(f"    세트 항목: {len(set_items)}개 할당")

            total_words += len(words)

        except Exception as e:
            print(f"    [ERROR] {e}")

    return total_words

# ─────────────────────────────────────────────────────────
# 실행
# ─────────────────────────────────────────────────────────

print("[OK] Day별 단어 업로드 시작...\n")

# 1. 주니어 능률보카
junior_total = process_vocab_set(
    r"C:\Users\user\Downloads\junior-vocab-final.json",
    "neungyul-junior",
    "주니어 능률보카 Day {day}"
)

# 2. 어원편
origin_total = process_vocab_set(
    r"C:\Users\user\Downloads\vocab-converted.json",
    "neungyul-origin",
    "능률보카 어원편 Day {day}"
)

print(f"\n[OK] 업로드 완료!")
print(f"  주니어 능률보카: {junior_total}개 단어")
print(f"  어원편: {origin_total}개 단어")
print(f"  총합: {junior_total + origin_total}개 단어")
