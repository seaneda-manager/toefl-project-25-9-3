import json
import csv

# 1. 능률 어원편 JSON -> CSV (Wiseword 형식)
print("[OK] 능률 어원편 CSV 변환 중...\n")

with open(r"C:\Users\user\Downloads\vocab-converted.json", 'r', encoding='utf-8') as f:
    vocab_data = json.load(f)

rows = []

for entry in vocab_data:
    text = entry.get('text', '')
    meanings_ko = entry.get('meanings_ko', [])
    meanings_en_simple = entry.get('meanings_en_simple', [])

    if not text or not meanings_ko:
        continue

    # Wiseword 예상 형식으로 변환
    row = {
        'text': text,
        'lemma': text,  # 표제어와 동일
        'pos': 'other',  # 기본값
        'meanings_ko': ", ".join(meanings_ko),
        'meanings_en_simple': ", ".join(meanings_en_simple) if meanings_en_simple else "",
        'examples_easy': ""
    }
    rows.append(row)

    # 파생어도 추가
    derived_terms = entry.get('derived_terms', [])
    for derived in derived_terms:
        derived_text = derived.get('text', '')
        derived_meanings = derived.get('meanings_ko', [])

        if not derived_text or not derived_meanings:
            continue

        derived_row = {
            'text': derived_text,
            'lemma': derived_text,
            'pos': 'other',
            'meanings_ko': ", ".join(derived_meanings),
            'meanings_en_simple': "",
            'examples_easy': ""
        }
        rows.append(derived_row)

# CSV 저장
csv_path = r"C:\Users\user\Downloads\vocab-wiseword-fixed.csv"
with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['text', 'lemma', 'pos', 'meanings_ko', 'meanings_en_simple', 'examples_easy'])
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
    meanings_en_simple = entry.get('meanings_en_simple', [])

    if not text or not meanings_ko:
        continue

    row = {
        'text': text,
        'lemma': text,
        'pos': 'other',
        'meanings_ko': ", ".join(meanings_ko),
        'meanings_en_simple': ", ".join(meanings_en_simple) if meanings_en_simple else "",
        'examples_easy': ""
    }
    junior_rows.append(row)

# CSV 저장
junior_csv_path = r"C:\Users\user\Downloads\junior-vocab-wiseword-fixed.csv"
with open(junior_csv_path, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['text', 'lemma', 'pos', 'meanings_ko', 'meanings_en_simple', 'examples_easy'])
    writer.writeheader()
    writer.writerows(junior_rows)

print(f"[OK] 주니어 능률보카 CSV 저장 완료")
print(f"     파일: {junior_csv_path}")
print(f"     행 수: {len(junior_rows)}\n")

# 샘플 출력
print("=== 능률 어원편 CSV 샘플 (첫 10줄) ===")
for i, row in enumerate(rows[:10]):
    print(f"{row['text']} | {row['meanings_ko'][:30]}")

print("\n=== 주니어 능률보카 CSV 샘플 (첫 10줄) ===")
for i, row in enumerate(junior_rows[:10]):
    print(f"{row['text']} | {row['meanings_ko'][:30]}")

print(f"\n[OK] 모든 변환 완료!")
print(f"[OK] Wiseword 형식으로 수정된 CSV 생성됨")
