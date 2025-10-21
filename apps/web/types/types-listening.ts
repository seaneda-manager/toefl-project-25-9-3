// apps/web/types/types-listening.ts
import type { RSet, RQuestion, RChoice, RPassage } from '@/lib/readingSchemas';
// 실행 모드
export type Mode = 'study' | 'test';

/** Choice (과거/현재 필드 호환) */
export interface ListeningChoice {
  id: string;
  text: string;
  /** 과거/현재 혼용된 정답 표기 */
  correct?: boolean;
  is_correct?: boolean;
}
/** 러너 코드에서 기대하는 이름도 함께 제공 */
export type LChoice = ListeningChoice;

/** Question (과거/현재 필드 호환) */
export interface ListeningQuestion {
  id: string;
  number?: number;

  /** 과거 코드에선 prompt/stem 혼용 */
  prompt?: string;
  stem?: string;

  choices: ListeningChoice[];
  meta?: Record<string, unknown>;
}
/** 러너에서 쓰는 별칭 */
export type LQuestion = ListeningQuestion;

/** Track (과거/현재 필드 호환) */
export interface ListeningTrack {
  id: string;
  title?: string;

  /** 오디오 URL: 과거 audio_url, 현재 audioUrl */
  audioUrl: string;     // 현재 표준
  audio_url?: string;   // 과거 호환

  /** 시간 관련 옵션 */
  timeLimitSec?: number;
  durationSec?: number;

  questions: ListeningQuestion[];
}

/* ===================== Helpers (호환/편의 유틸) ===================== */

/** 질문 텍스트 일괄 추출 (공백 처리 포함) */
export function getQuestionText(q: ListeningQuestion): string {
  const txt = q.prompt ?? q.stem ?? '';
  return typeof txt === 'string' ? txt.trim() : '';
}

/** 오디오 URL 일괄 추출 (audio_url → audioUrl 매핑 포함) */
export function getAudioUrl(t: ListeningTrack): string {
  return (t.audioUrl ?? t.audio_url ?? '').trim();
}

/** 해당 선택지가 정답인지 검사 */
export function isChoiceCorrect(q: ListeningQuestion, choiceId: string): boolean {
  const c = q.choices.find((x) => x.id === choiceId);
  return !!(c && (c.is_correct === true || c.correct === true));
}

/** 하나라도 정답이 있는지(데이터 검증용) */
export function hasAnyCorrectChoice(q: ListeningQuestion): boolean {
  return q.choices.some((c) => c.is_correct === true || c.correct === true);
}

/* ===================== Normalizers (정규화) ===================== */
/**
 * 들어오는 데이터의 들쑥날쑥함을 흡수하고,
 * UI/로직에서 쓰기 쉬운 "필수 필드 보장" 형태로 바꿉니다.
 */

export type NormalizedListeningChoice = Readonly<{
  id: string;
  text: string;
  /** 정규화된 정답 플래그(기본값 false) */
  is_correct: boolean;
}>;

export type NormalizedListeningQuestion = Readonly<{
  id: string;
  number: number;          // 보장
  text: string;            // prompt/stem 통합
  choices: NormalizedListeningChoice[];
  meta?: Record<string, unknown>;
}>;

export type NormalizedListeningTrack = Readonly<{
  id: string;
  title?: string;
  audioUrl: string;        // audio_url 호환 처리 + 공백 제거
  timeLimitSec?: number;
  durationSec?: number;
  questions: NormalizedListeningQuestion[];
}>;

/** 선택지 정규화 */
export function normalizeChoice(c: ListeningChoice): NormalizedListeningChoice {
  return {
    id: String(c.id),
    text: String(c.text ?? '').trim(),
    is_correct: c.is_correct === true || c.correct === true,
  };
}

/** 질문 정규화: number 보장, text 통합 */
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

/** 트랙 정규화: audioUrl 보장(+audio_url), 질문 넘버 자동 보정 */
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

/** 여러 트랙 한 번에 정규화 */
export function normalizeTracks(ts: ListeningTrack[]): NormalizedListeningTrack[] {
  return (ts ?? []).map(normalizeTrack);
}

/* ============================================================
   ✅ Play Consume API 타입 및 정규화 함수
   (listening-sample/page.tsx에서 import하는 항목들)
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

/** 서버 응답(snake_case 포함)을 camelCase로 통일 */
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
