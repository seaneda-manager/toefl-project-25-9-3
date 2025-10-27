// apps/web/types/types-listening.ts
import type { RSet, RQuestion, RChoice, RPassage } from '@/models/reading/zod';
// ??쎈뻬 筌뤴뫀諭?
export type Mode = 'study' | 'test';

/** Choice (?⑥눊援??袁⑹삺 ?袁⑤굡 ?紐낆넎) */
export interface ListeningChoice {
  id: string;
  text: string;
  /** ?⑥눊援??袁⑹삺 ??깆뒠???類ｋ뼗 ??볥┛ */
  correct?: boolean;
  is_correct?: boolean;
}
/** ??瑗??꾨뗀諭?癒?퐣 疫꿸퀡???롫뮉 ??已????ｍ뜞 ??볥궗 */
export type LChoice = ListeningChoice;

/** Question (?⑥눊援??袁⑹삺 ?袁⑤굡 ?紐낆넎) */
export interface ListeningQuestion {
  id: string;
  number?: number;

  /** ?⑥눊援??꾨뗀諭?癒?퐨 prompt/stem ??깆뒠 */
  prompt?: string;
  stem?: string;

  choices: ListeningChoice[];
  meta?: Record<string, unknown>;
}
/** ??瑗?癒?퐣 ?怨뺣뮉 癰귢쑴臾?*/
export type LQuestion = ListeningQuestion;

/** Track (?⑥눊援??袁⑹삺 ?袁⑤굡 ?紐낆넎) */
export interface ListeningTrack {
  id: string;
  title?: string;

  /** ??삳탵??URL: ?⑥눊援?audio_url, ?袁⑹삺 audioUrl */
  audioUrl: string;     // ?袁⑹삺 ???
  audio_url?: string;   // ?⑥눊援??紐낆넎

  /** ??볦퍢 ?온??????*/
  timeLimitSec?: number;
  durationSec?: number;

  questions: ListeningQuestion[];
}

/* ===================== Helpers (?紐낆넎/?紐꾩벥 ?醫뤿뼢) ===================== */

/** 筌욌뜄揆 ??용뮞????⑦겣 ?곕뗄??(?⑤벉媛?筌ｌ꼶????釉? */
export function getQuestionText(q: ListeningQuestion): string {
  const txt = q.prompt ?? q.stem ?? '';
  return typeof txt === 'string' ? txt.trim() : '';
}

/** ??삳탵??URL ??⑦겣 ?곕뗄??(audio_url ??audioUrl 筌띲끋釉???釉? */
export function getAudioUrl(t: ListeningTrack): string {
  return (t.audioUrl ?? t.audio_url ?? '').trim();
}

/** ?????醫뤾문筌왖揶쎛 ?類ｋ뼗?紐? 野꺜??*/
export function isChoiceCorrect(q: ListeningQuestion, choiceId: string): boolean {
  const c = q.choices.find((x) => x.id === choiceId);
  return !!(c && (c.is_correct === true || c.correct === true));
}

/** ??롪돌??곕즲 ?類ｋ뼗????덈뮉筌왖(?怨쀬뵠??野꺜筌앹빘?? */
export function hasAnyCorrectChoice(q: ListeningQuestion): boolean {
  return q.choices.some((c) => c.is_correct === true || c.correct === true);
}

/* ===================== Normalizers (?類?뇣?? ===================== */
/**
 * ??쇰선??삳뮉 ?怨쀬뵠?怨쀬벥 ??쇰쳛?醫롫쳛??μ뱽 ??る땾??랁?
 * UI/嚥≪뮇彛?癒?퐣 ?怨뚮┛ ????"?袁⑸땾 ?袁⑤굡 癰귣똻?? ?類κ묶嚥?獄쏅떽???덈뼄.
 */

export type NormalizedListeningChoice = Readonly<{
  id: string;
  text: string;
  /** ?類?뇣?遺얜쭆 ?類ｋ뼗 ???삋域?疫꿸퀡??첎?false) */
  is_correct: boolean;
}>;

export type NormalizedListeningQuestion = Readonly<{
  id: string;
  number: number;          // 癰귣똻??
  text: string;            // prompt/stem ????
  choices: NormalizedListeningChoice[];
  meta?: Record<string, unknown>;
}>;

export type NormalizedListeningTrack = Readonly<{
  id: string;
  title?: string;
  audioUrl: string;        // audio_url ?紐낆넎 筌ｌ꼶??+ ?⑤벉媛???볤탢
  timeLimitSec?: number;
  durationSec?: number;
  questions: NormalizedListeningQuestion[];
}>;

/** ?醫뤾문筌왖 ?類?뇣??*/
export function normalizeChoice(c: ListeningChoice): NormalizedListeningChoice {
  return {
    id: String(c.id),
    text: String(c.text ?? '').trim(),
    is_correct: c.is_correct === true || c.correct === true,
  };
}

/** 筌욌뜄揆 ?類?뇣?? number 癰귣똻?? text ???? */
export function normalizeQuestion(
  q: ListeningQuestion,
  fallbackNumber?: number
): NormalizedListeningQuestion {
  const number =
    typeof q.number === 'number' && Number.isFinite(q.number) && q.number > 0
      ? Math.trunc(q.number)
      : Math.max(1, Math.trunc(fallbackNumber ?? 0));

  const text = getQuestionText(q);

  return {
    id: String(q.id),
    number,
    text,
    choices: (q.choices ?? []).map(normalizeChoice),
    meta: q.meta,
  };
}

/** ?紐껋삌 ?類?뇣?? audioUrl 癰귣똻??+audio_url), 筌욌뜄揆 ??롮쒔 ?癒?짗 癰귣똻??*/
export function normalizeTrack(t: ListeningTrack): NormalizedListeningTrack {
  const audio = getAudioUrl(t);
  const qs = (t.questions ?? []).map((qq, i) =>
    normalizeQuestion(qq, typeof qq.number === 'number' ? qq.number : i + 1)
  );

  return {
    id: String(t.id),
    title: t.title,
    audioUrl: audio,
    timeLimitSec: t.timeLimitSec,
    durationSec: t.durationSec,
    questions: qs,
  };
}

/** ?????紐껋삌 ??甕곕뜆肉??類?뇣??*/
export function normalizeTracks(ts: ListeningTrack[]): NormalizedListeningTrack[] {
  return (ts ?? []).map(normalizeTrack);
}

/* ============================================================
   ??Play Consume API ????獄??類?뇣????λ땾
   (listening-sample/page.tsx?癒?퐣 import??롫뮉 ?????
============================================================ */

export type ConsumePlayRow = Readonly<{
  id?: string;
  sessionId: string;
  playsAllowed: number;
  playsUsed: number;
  remaining: number;
}>;

export type ConsumePlayResponse =
  | { ok: true; data: ConsumePlayRow }
  | { ok: false; error: string };

/** ??뺤쒔 ?臾먮뼗(snake_case ??釉???camelCase嚥????뵬 */
export function normalizeConsumePlayRow(input: any): ConsumePlayRow {
  if (!input) {
    return { sessionId: '', playsAllowed: 0, playsUsed: 0, remaining: 0 };
  }

  const sessionId = input.sessionId ?? input.session_id ?? '';
  const playsAllowed = input.playsAllowed ?? input.plays_allowed ?? 0;
  const playsUsed = input.playsUsed ?? input.plays_used ?? 0;
  const remaining =
    input.remaining ??
    Math.max(0, Number(playsAllowed) - Number(playsUsed));

  return {
    id: input.id ? String(input.id) : undefined,
    sessionId: String(sessionId),
    playsAllowed: Number(playsAllowed),
    playsUsed: Number(playsUsed),
    remaining: Number(remaining),
  };
}




