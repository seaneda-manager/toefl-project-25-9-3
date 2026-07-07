import pdfplumber
import json
import re

pdf_path = r"C:\Users\user\Downloads\■ 주니어 능률보카 실력_2강씩_전체모음.pdf"

print("=== 주니어 능률보카 변환 시작 ===\n")

words_data = []

with pdfplumber.open(pdf_path) as pdf:
    total_pages = len(pdf.pages)
    print(f"총 페이지: {total_pages}\n")

    # 짝수 페이지(정답)만 처리
    for page_num in range(1, total_pages, 2):  # 1, 3, 5, 7, ... (0-indexed이므로 실제는 2, 4, 6, 8...)
        page = pdf.pages[page_num]
        text = page.extract_text()

        if not text:
            continue

        lines = text.split('\n')
        print(f"페이지 {page_num + 1} (정답) 처리 중...")

        # 텍스트에서 단어 추출
        for line in lines:
            # 패턴: "No. 영단어 한글뜻/영문뜻"
            # 예: "1 put effort into  21  ~~~~~ ~~~~, ~~~~~~~"
            # 또는: "1 put effort into ~~ ~~~~~ ~~~~~(~~~ ~~~~~)  21 support"

            line = line.strip()
            if not line or not line[0].isdigit():
                continue

            # 번호와 나머지 분리
            parts = line.split(maxsplit=1)
            if len(parts) < 2:
                continue

            try:
                num = int(parts[0])
            except:
                continue

            rest = parts[1]

            # 영단어 추출 (보통 2-3개 단어)
            # 정규표현식으로 첫 번째 단어(들) 추출
            words = rest.split()
            if len(words) < 2:
                continue

            # 영단어는 보통 처음 1-3개 단어
            eng_word = ""
            start_idx = 0

            for i, word in enumerate(words[:4]):
                if word[0].isupper() or word[0].isdigit() or i >= 3:
                    break
                eng_word += word + " "
                start_idx = i + 1

            eng_word = eng_word.strip()
            if not eng_word:
                continue

            # 뜻 추출 (영단어 이후)
            meaning_part = " ".join(words[start_idx:])

            # 정답이 숫자가 아닌 경우 (짝수 페이지)
            if meaning_part and not meaning_part[0].isdigit():
                # 한글/영문 뜻 구분
                if "/" in meaning_part:
                    ko_part, en_part = meaning_part.split("/", 1)
                    meanings_ko = [m.strip() for m in ko_part.split(",") if m.strip()]
                    meanings_en = [m.strip() for m in en_part.split(",") if m.strip()]
                else:
                    # 한글만 있는 경우
                    meanings_ko = [m.strip() for m in meaning_part.split(",") if m.strip()]
                    meanings_en = []

                if meanings_ko or meanings_en:
                    words_data.append({
                        "text": eng_word,
                        "meanings_ko": meanings_ko,
                        "meanings_en_simple": meanings_en if meanings_en else [],
                        "unit": f"Day {(page_num // 2) * 2 + 1}~{(page_num // 2) * 2 + 2}"
                    })

print(f"\n[OK] 추출 완료: {len(words_data)}개 단어\n")

# 샘플 출력
print("=== 샘플 데이터 (첫 10개) ===")
for i, word in enumerate(words_data[:10]):
    print(f"{i+1}. {word['text']}")
    print(f"   한글: {word['meanings_ko']}")
    print(f"   영문: {word['meanings_en_simple']}")
    print()

# JSON 파일 저장
output_path = r"C:\Users\user\Downloads\junior-vocab-converted.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print(f"[OK] JSON 저장 완료: {output_path}")
print(f"[OK] 총 {len(words_data)}개 단어")
