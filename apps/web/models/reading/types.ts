// apps/web/models/reading/types.ts

/** Choice */
export type RChoice = {
  id: string;
  label?: string;         // ?붾㈃ ?쒓린??(A/B/C/D ??
  text: string;           // 蹂닿린 蹂몃Ц
  isCorrect?: boolean;    // CMS/由щ럭 ?곸뿭?먯꽌留??ъ슜
};

/** Question Types */
export type RQType =
  | 'vocab' | 'detail' | 'negative_detail' | 'paraphrasing'
  | 'inference' | 'purpose' | 'pronoun_ref' | 'insertion'
  | 'summary' | 'organization';

/** Question */
export type RQuestion = {
  id: string;
  number: number;           // 臾몄젣 踰덊샇
  type: RQType;
  stem: string;             // 臾몄젣 臾몄옣
  choices: RChoice[];
  explanation?: string;     // ?댁꽕(援먯궗??
  clue_quote?: string;      // 洹쇨굅臾몄옣 ?먮Ц(異뺤빟 湲덉? 媛??洹쒖튃)
  meta?: Record<string, unknown>;
};

/** Passage */
export type RPassage = {
  id: string;
  setId?: string;
  title?: string;
  paragraphs: string[];     // ?⑤씫 諛곗뿴
  questions: RQuestion[];
};

/** Set */
export type RSet = {
  id: string;
  label: string;
  source?: string;
  version?: number | string | null;
  passages: RPassage[];
};


