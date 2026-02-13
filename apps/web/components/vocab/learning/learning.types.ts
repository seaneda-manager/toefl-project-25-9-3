// apps/web/components/vocab/learning/learning.types.ts

export type LearningExample =
  | string
  | {
      en: string;
      ko?: string | null;
    };

export type LearningWord = {
  id: string;
  text: string;

  /** Korean meanings (primary for your current flow) */
  meanings_ko: string[];

  /** Optional: simple English meanings */
  meanings_en_simple?: string[];

  /** Optional: synonyms */
  synonyms_en_simple?: string[];

  /**
   * Examples can be:
   * - string[]
   * - { en, ko? }[]
   * - mixed
   * Keep flexible because DB / normalizers may differ.
   */
  examples?: LearningExample[];

  /** Optional notes */
  notes?: string | null;

  /** Optional POS / lemma (safe extras) */
  pos?: string | null;
  lemma?: string | null;
};
