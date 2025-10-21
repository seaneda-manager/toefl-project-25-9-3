// 앱 전역에서 쓰는 리딩 타입
export type RChoice = {
  id: string;
  text: string;
  is_correct?: boolean;
  /** 선택지 해설(선택) */
  explain?: string | null;
};

export type RQType =
  | 'vocab' | 'detail' | 'negative_detail' | 'paraphrasing' | 'insertion'
  | 'inference' | 'purpose' | 'pronoun_ref' | 'summary' | 'organization';

export type RQuestion = {
  id: string;
  number: number;
  type: RQType;
  stem: string;
  choices: RChoice[];
  meta?: {
    paragraph_index?: number;
    insertion_markers?: ('A'|'B'|'C'|'D')[];
    [k: string]: any;
  };
  /** 문항 해설(선택) */
  explanation?: Record<string, any> | string | null;
};

export type RPassage = {
  id: string;
  title?: string;
  content: string; // 원문 전체(문단 구분은 UI에서)
  questions: RQuestion[];
};

export type RSet = {
  id: string;
  name?: string;
  passages: RPassage[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
};
