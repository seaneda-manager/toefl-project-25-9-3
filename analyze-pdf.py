import pdfplumber

pdf_path = r"C:\Users\user\Downloads\■ 주니어 능률보카 실력_2강씩_전체모음.pdf"

print("=== PDF 구조 분석 ===\n")

with pdfplumber.open(pdf_path) as pdf:
    print(f"총 페이지: {len(pdf.pages)}\n")

    # 처음 10페이지 분석
    for i in range(min(10, len(pdf.pages))):
        page = pdf.pages[i]
        text = page.extract_text()

        print(f"\n{'='*60}")
        print(f"페이지 {i+1}:")
        print(f"{'='*60}")
        if text:
            lines = text.split('\n')[:15]
            for line in lines:
                print(line)
        else:
            print("(텍스트 없음)")
