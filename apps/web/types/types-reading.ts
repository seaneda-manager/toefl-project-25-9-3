export type RChoice = {
  id: string;
  text: string;
  is_correct?: boolean;
  explain?: string;
};

export type RQType =
  | 'vocab'
  | 'detail'
  | 'negative_detail'
  | 'paraphrasing'
  | 'inference'
  | 'purpose'
  | 'pronoun_ref'
  | 'insertion'
  | 'summary'
  | 'organization';

export type RQuestion = {
  id: string;
  number: number;
  type: RQType;
  stem: string;
  choices: RChoice[];
  meta?: {
    insertion?: { anchors: string[]; correctIndex: number };
    summary?: { candidates: string[]; correct: number[]; selectionCount: number };
    pronoun_ref?: { pronoun: string; referents: string[]; correctIndex: number };
    organization?: { labels: string[]; correct?: number[] };
    vocab?: { target: string; sentence?: string };
    paragraph_highlight?: { paragraphs: number[] };
  };
  explanation?: {
    clue_quote?: string;
    why_correct?: string;
    why_others?: Record<string, string>;
  };
};

export type RPassage = {
  id: string;
  title: string;
  content: string;
  questions: RQuestion[];
  ui?: { paragraphSplit?: 'auto' | 'blankline' | 'html' };
};

export type RSet = {
  id: string;
  label: string;
  source?: string;
  version?: number;
  passages: RPassage[];
};
// ---- backward-compat aliases (legacy names still work) ----
export type Choice = RChoice;
export type Question = RQuestion;
export type Passage = RPassage;