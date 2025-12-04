// apps/web/models/vocab.ts

// 🔸 학년/난이도 밴드 – 일단 느슨하게 정의 (나중에 정확히 제한해도 됨)
export type GradeBand =
  | "K1_2"
  | "K3_4"
  | "K5_6"
  | "M1_3"
  | "H1_3"
  | "TOEFL"
  | "LIFE"
  | string; // 임시로 string 허용

// 🔸 현재 demoVocabWords + voca-drill 페이지에서 공통으로 기대하는 코어 스키마
export type VocabWordCore = {
  id: string;

  /** 표제어 */
  text: string;
  lemma: string;
  pos: string; // 예: "v.", "n.", "adj." 등
  is_function_word: boolean;

  /** 기본 뜻/예문들 – 이미 voca-drill에서 쓰고 있는 필드들 */
  meanings_ko: string[];
  meanings_en_simple: string[];
  examples_easy: string[];
  examples_normal: string[];
  derived_terms: string[];

  difficulty: number;
  frequency_score: number | null;
  notes: string | null;

  created_at: string;
  updated_at: string;

  gradeBands: GradeBand[];

  // 아직 정확 타입 안 정해진 메타 – 일단 any[]로 완충
  sources: any[];
  semanticTags: any[];
  grammarHints: any[];

  // 🔹 나중에 확장할 수 있는 필드들 (옵셔널)
  // 발음 기호
  phoneticBrE?: string;
  phoneticNAm?: string;
};
