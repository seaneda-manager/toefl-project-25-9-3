// apps/web/types/types-reading.ts
export interface RChoice {
  id: string;
  text: string;
  is_correct?: boolean;
  explain?: string | null;
  ord?: number;
  label?: string;
  meta?: unknown;
}

export interface RQuestion {
  id: string;
  passage_id?: string; // ?ë””???¨ê³„?ì„œ ë¹„ì–´?ˆì„ ???ˆìŒ
  number: number;
  type: string;
  stem: string;
  choices: RChoice[]; // ??ƒ ë°°ì—´ë¡?ì·¨ê¸‰?´ì„œ ?. ?¤ë¥˜ ?œê±°
  meta?: {
    summary?: {
      selectionCount?: number;
      candidates?: string[];   // ê°?ë³´ê¸° ?¼ë²¨/?ìŠ¤??
      correct?: number[];      // ?•ë‹µ ?¸ë±??ëª¨ìŒ (0-based)
    };
    insertion?: {
      anchors?: string[];
      correctIndex?: number;
    };
    pronoun_ref?: {
      pronoun?: string;
      referents?: string[];
      correctIndex?: number;
    };
    paragraph_highlight?: {
      paragraphs?: number[];
    };
  };
  explanation?: {
    clue_quote?: string;
    why_correct?: string;
    why_others?: Record<string, string>;
  };
  ord?: number;
}

export interface RPassage {
  id: string;
  set_id?: string; // ?ˆë¡œ ì¶”ê????ŒëŠ” ë¹„ì–´?ˆì„ ???ˆìŒ
  title: string;
  content: string;
  ui?: {
    paragraphSplit?: string;
  };
  questions: RQuestion[];
  ord?: number;
}

export interface RSet {
  id: string;
  label: string;
  source?: string;
  version?: number | string | null; // number ?ˆìš©
  passages: RPassage[];
}
