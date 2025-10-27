// apps/web/types/types-listening.ts
import type { RSet, RQuestion, RChoice, RPassage } from '@/models/reading/zod';
// ?ㅽ뻾 紐⑤뱶
export type Mode = 'study' | 'test';

/** Choice (怨쇨굅/?꾩옱 ?꾨뱶 ?명솚) */
export interface ListeningChoice {
  id: string;
  text: string;
  /** 怨쇨굅/?꾩옱 ?쇱슜???뺣떟 ?쒓린 */
  correct?: boolean;
  is_correct?: boolean;
}
/** ?щ꼫 肄붾뱶?먯꽌 湲곕??섎뒗 ?대쫫???④퍡 ?쒓났 */
export type LChoice = ListeningChoice;

/** Question (怨쇨굅/?꾩옱 ?꾨뱶 ?명솚) */
export interface ListeningQuestion {
  id: string;
  number?: number;

  /** 怨쇨굅 肄붾뱶?먯꽑 prompt/stem ?쇱슜 */
  prompt?: string;
  stem?: string;

  choices: ListeningChoice[];
  meta?: Record<string, unknown>;
}
/** ?щ꼫?먯꽌 ?곕뒗 蹂꾩묶 */
export type LQuestion = ListeningQuestion;

/** Track (怨쇨굅/?꾩옱 ?꾨뱶 ?명솚) */
export interface ListeningTrack {
  id: string;
  title?: string;

  /** ?ㅻ뵒??URL: 怨쇨굅 audio_url, ?꾩옱 audioUrl */
  audioUrl: string;     // ?꾩옱 ?쒖?
  audio_url?: string;   // 怨쇨굅 ?명솚

  /** ?쒓컙 愿???듭뀡 */
  timeLimitSec?: number;
  durationSec?: number;

  questions: ListeningQuestion[];
}

/* ===================== Helpers (?명솚/?몄쓽 ?좏떥) ===================== */

/** 吏덈Ц ?띿뒪???쇨큵 異붿텧 (怨듬갚 泥섎━ ?ы븿) */
export function getQuestionText(q: ListeningQuestion): string {
  const txt = q.prompt ?? q.stem ?? '';
  return typeof txt === 'string' ? txt.trim() : '';
}

/** ?ㅻ뵒??URL ?쇨큵 異붿텧 (audio_url ??audioUrl 留ㅽ븨 ?ы븿) */
export function getAudioUrl(t: ListeningTrack): string {
  return (t.audioUrl ?? t.audio_url ?? '').trim();
}

/** ?대떦 ?좏깮吏媛 ?뺣떟?몄? 寃??*/
export function isChoiceCorrect(q: ListeningQuestion, choiceId: string): boolean {
  const c = q.choices.find((x) => x.id === choiceId);
  return !!(c && (c.is_correct === true || c.correct === true));
}

/** ?섎굹?쇰룄 ?뺣떟???덈뒗吏(?곗씠??寃利앹슜) */
export function hasAnyCorrectChoice(q: ListeningQuestion): boolean {
  return q.choices.some((c) => c.is_correct === true || c.correct === true);
}

/* ===================== Normalizers (?뺢퇋?? ===================== */
/**
 * ?ㅼ뼱?ㅻ뒗 ?곗씠?곗쓽 ?ㅼ뫁?좎뫁?⑥쓣 ?≪닔?섍퀬,
 * UI/濡쒖쭅?먯꽌 ?곌린 ?ъ슫 "?꾩닔 ?꾨뱶 蹂댁옣" ?뺥깭濡?諛붽퓠?덈떎.
 */

export type NormalizedListeningChoice = Readonly<{
  id: string;
  text: string;
  /** ?뺢퇋?붾맂 ?뺣떟 ?뚮옒洹?湲곕낯媛?false) */
  is_correct: boolean;
}>;

export type NormalizedListeningQuestion = Readonly<{
  id: string;
  number: number;          // 蹂댁옣
  text: string;            // prompt/stem ?듯빀
  choices: NormalizedListeningChoice[];
  meta?: Record<string, unknown>;
}>;

export type NormalizedListeningTrack = Readonly<{
  id: string;
  title?: string;
  audioUrl: string;        // audio_url ?명솚 泥섎━ + 怨듬갚 ?쒓굅
  timeLimitSec?: number;
  durationSec?: number;
  questions: NormalizedListeningQuestion[];
}>;

/** ?좏깮吏 ?뺢퇋??*/
export function normalizeChoice(c: ListeningChoice): NormalizedListeningChoice {
  return {
    id: String(c.id),
    text: String(c.text ?? '').trim(),
    is_correct: c.is_correct === true || c.correct === true,
  };
}

/** 吏덈Ц ?뺢퇋?? number 蹂댁옣, text ?듯빀 */
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

/** ?몃옓 ?뺢퇋?? audioUrl 蹂댁옣(+audio_url), 吏덈Ц ?섎쾭 ?먮룞 蹂댁젙 */
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

/** ?щ윭 ?몃옓 ??踰덉뿉 ?뺢퇋??*/
export function normalizeTracks(ts: ListeningTrack[]): NormalizedListeningTrack[] {
  return (ts ?? []).map(normalizeTrack);
}

/* ============================================================
   ??Play Consume API ???諛??뺢퇋???⑥닔
   (listening-sample/page.tsx?먯꽌 import?섎뒗 ??ぉ??
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

/** ?쒕쾭 ?묐떟(snake_case ?ы븿)??camelCase濡??듭씪 */
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


