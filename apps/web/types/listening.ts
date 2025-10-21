// apps/web/types/consume-play.ts

/** 모드(짧은 표기/긴 표기) */
export type ModeShort = 'p' | 't' | 'r';          // practice, test, review
export type ModeLong  = 'study' | 'test' | 'review';
export type Mode = ModeShort | ModeLong;

/** 1행(레코드) */
export type ConsumePlayRow = Readonly<{
  session_id: string;
  track_id: string | null;
  mode: Mode;

  /** 허용 재생 횟수 (0 이상) */
  plays_allowed: number;

  /** 사용된 재생 횟수 (0 이상) */
  plays_used: number;

  /**
   * 남은 재생 횟수.
   * 서버가 계산해 줄 수도 있고(optional), 없으면 클라이언트에서 계산합니다.
   * UI/로직에선 remainingPlays(row) 유틸을 사용하는 걸 권장합니다.
   */
  remaining?: number;
}>;

/** 성공 응답 (페이지네이션 가능) */
export type ConsumePlayOk = Readonly<{
  ok: true;
  data: ConsumePlayRow[];
  /** 필요 시 이어받을 커서 */
  cursor?: string | null;
}>;

/** 실패 응답 */
export type ConsumePlayErr = Readonly<{
  ok: false;
  error: string;
  /** 예: 'UNAUTHORIZED' | 'NOT_FOUND' | 'RATE_LIMITED' 등 */
  code?: string;
}>;

export type ConsumePlayResponse = ConsumePlayOk | ConsumePlayErr;

/* ───────────────────────── Helpers ───────────────────────── */

/**
 * 모드를 긴 표기('study' | 'test' | 'review')로 정규화
 */
export function canonicalMode(m: Mode): ModeLong {
  if (m === 'p') return 'study';
  if (m === 't' || m === 'test') return 'test';
  if (m === 'r' || m === 'review') return 'review';
  // 기본값: study
  return 'study';
}

/**
 * 남은 재생 횟수 계산 (음수/NaN 방지 포함)
 */
export function remainingPlays(row: ConsumePlayRow): number {
  const allow = Math.max(0, Math.trunc(row.plays_allowed ?? 0));
  const used  = Math.max(0, Math.trunc(row.plays_used ?? 0));
  const rem   = row.remaining ?? (allow - used);
  return Math.max(0, Math.trunc(rem));
}

/**
 * 재생 가능 여부
 */
export function canPlay(row: ConsumePlayRow): boolean {
  return remainingPlays(row) > 0;
}
