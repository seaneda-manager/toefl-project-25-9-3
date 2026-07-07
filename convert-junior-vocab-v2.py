import pdfplumber
import json
import re

pdf_path = r"C:\Users\user\Downloads\■ 주니어 능률보카 실력_2강씩_전체모음.pdf"

print("[OK] 주니어 능률보카 변환 시작\n")

words_data = []

with pdfplumber.open(pdf_path) as pdf:
    total_pages = len(pdf.pages)
    print(f"[OK] 총 페이지: {total_pages}\n")

    # 짝수 페이지(정답)만 처리
    for page_num in range(1, total_pages, 2):  # 1, 3, 5, ... (0-indexed)
        page = pdf.pages[page_num]

        # 테이블 추출 시도
        tables = page.extract_tables()

        if not tables:
            print(f"페이지 {page_num + 1} (정답) - 테이블 없음, 텍스트로 처리")
            text = page.extract_text()
            if not text:
                continue

            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line or len(line) < 5:
                    continue

                # 간단한 패턴: "숫자 단어 뜻"
                parts = line.split(maxsplit=2)
                if len(parts) >= 3:
                    try:
                        num = int(parts[0])
                        eng_word = parts[1]
                        meaning = parts[2]

                        # "/" 로 한글/영문 분리
                        if "/" in meaning:
                            ko, en = meaning.split("/", 1)
                            ko_list = [m.strip() for m in ko.split(",")]
                            en_list = [m.strip() for m in en.split(",")]
                        else:
                            ko_list = [m.strip() for m in meaning.split(",")]
                            en_list = []

                        words_data.append({
                            "text": eng_word,
                            "meanings_ko": ko_list,
                            "meanings_en_simple": en_list,
                            "unit": f"Day {(page_num // 2) * 2 + 1}~{(page_num // 2) * 2 + 2}"
                        })
                    except:
                        pass
            continue

        print(f"페이지 {page_num + 1} (정답) - 테이블 {len(tables)}개 발견")

        for table_idx, table in enumerate(tables):
            if not table or len(table) < 2:
                continue

            for row in table[1:]:  # 헤더 제외
                if not row or len(row) < 2:
                    continue

                # 각 셀 정리
                cells = [str(c).strip() for c in row if c]

                if len(cells) >= 2:
                    # 번호와 단어 추출
                    first_cell = cells[0]

                    # 숫자로 시작하는지 확인
                    match = re.match(r'(\d+)\s+(.+)', first_cell)
                    if match:
                        num, word_and_meaning = match.groups()

                        # 단어와 뜻 분리
                        if len(cells) >= 2:
                            eng_word = word_and_meaning.split()[0] if word_and_meaning else ""
                            meaning = " ".join(word_and_meaning.split()[1:]) if len(word_and_meaning.split()) > 1 else cells[1] if len(cells) > 1 else ""
                        else:
                            eng_word = word_and_meaning
                            meaning = ""

                        if not eng_word:
                            eng_word = cells[1] if len(cells) > 1 else ""
                            meaning = cells[2] if len(cells) > 2 else ""

                        # 뜻 정리
                        if "/" in meaning:
                            ko, en = meaning.split("/", 1)
                            ko_list = [m.strip() for m in ko.split(",") if m.strip()]
                            en_list = [m.strip() for m in en.split(",") if m.strip()]
                        else:
                            ko_list = [m.strip() for m in meaning.split(",") if m.strip()]
                            en_list = []

                        if eng_word and ko_list:
                            words_data.append({
                                "text": eng_word,
                                "meanings_ko": ko_list,
                                "meanings_en_simple": en_list,
                                "unit": f"Day {(page_num // 2) * 2 + 1}~{(page_num // 2) * 2 + 2}"
                            })

print(f"\n[OK] 추출 완료: {len(words_data)}개 단어\n")

# 샘플 출력
print("=== 샘플 데이터 (첫 20개) ===")
for i, word in enumerate(words_data[:20]):
    print(f"{i+1}. {word['text']}")
    print(f"   한글: {', '.join(word['meanings_ko'][:2])}")
    print()

# JSON 파일 저장
output_path = r"C:\Users\user\Downloads\junior-vocab-converted.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print(f"[OK] JSON 저장 완료: {output_path}")
print(f"[OK] 총 {len(words_data)}개 단어")
