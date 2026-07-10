import json
import csv

# 1. 능률 어원편 JSON -> CSV
print("[OK] 능률 어원편 CSV 변환 중...\n")

with open(r"C:\Users\user\Downloads\vocab-converted.json", 'r', encoding='utf-8') as f:
    vocab_data = json.load(f)

rows = []

for entry in vocab_data:
    text = entry.get('text', '')
    meanings_ko = entry.get('meanings_ko', [])
    unit = entry.get('unit', 'unknown')

    # slug 생성 (DAY 01 -> day01)
    if unit.startswith('DAY'):
        day_num = unit.replace('DAY ', '').strip()
        slug = f"day{day_num.zfill(2)}"
    else:
        slug = "unknown"

    # 표제어 추가
    meaning_str = ", ".join(meanings_ko)
    rows.append({
        'slug': slug,
        'title': unit,
        'description': '능률 어원편',
        'word': text,
        'meaning': meaning_str
    })

    # 파생어 추가 (같은 day에 포함)
    derived_terms = entry.get('derived_terms', [])
    for derived in derived_terms:
        derived_text = derived.get('text', '')
        derived_meanings = derived.get('meanings_ko', [])
        derived_meaning_str = ", ".join(derived_meanings)

        rows.append({
            'slug': slug,
            'title': unit,
            'description': '능률 어원편',
            'word': derived_text,
            'meaning': derived_meaning_str
        })

# CSV 저장
csv_path = r"C:\Users\user\Downloads\vocab-wiseword.csv"
with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['slug', 'title', 'description', 'word', 'meaning'])
    writer.writeheader()
    writer.writerows(rows)

print(f"[OK] 능률 어원편 CSV 저장 완료")
print(f"     파일: {csv_path}")
print(f"     행 수: {len(rows)} (표제어 + 파생어)\n")

# 2. 주니어 능률보카 JSON -> CSV
print("[OK] 주니어 능률보카 CSV 변환 중...\n")

with open(r"C:\Users\user\Downloads\junior-vocab-final.json", 'r', encoding='utf-8') as f:
    junior_data = json.load(f)

junior_rows = []

for entry in junior_data:
    text = entry.get('text', '')
    meanings_ko = entry.get('meanings_ko', [])
    unit = entry.get('unit', 'unknown')

    # slug 생성 (DAY 01 -> day01)
    if unit.startswith('DAY'):
        day_num = unit.replace('DAY ', '').strip()
        slug = f"day{day_num.zfill(2)}"
    else:
        slug = "unknown"

    meaning_str = ", ".join(meanings_ko)
    junior_rows.append({
        'slug': slug,
        'title': unit,
        'description': '주니어 능률보카 실력',
        'word': text,
        'meaning': meaning_str
    })

# CSV 저장
junior_csv_path = r"C:\Users\user\Downloads\junior-vocab-wiseword.csv"
with open(junior_csv_path, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['slug', 'title', 'description', 'word', 'meaning'])
    writer.writeheader()
    writer.writerows(junior_rows)

print(f"[OK] 주니어 능률보카 CSV 저장 완료")
print(f"     파일: {junior_csv_path}")
print(f"     행 수: {len(junior_rows)}\n")

# 3. 샘플 출력
print("=== 능률 어원편 CSV 샘플 (첫 10줄) ===")
for i, row in enumerate(rows[:10]):
    print(f"{row['slug']} | {row['title']} | {row['word']} | {row['meaning'][:30]}")

print("\n=== 주니어 능률보카 CSV 샘플 (첫 10줄) ===")
for i, row in enumerate(junior_rows[:10]):
    print(f"{row['slug']} | {row['title']} | {row['word']} | {row['meaning'][:30]}")

print(f"\n[OK] 모든 변환 완료!")
print(f"[OK] 다운로드 폴더에 2개 CSV 파일 생성됨")
