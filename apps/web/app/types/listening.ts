// apps/web/app/types/listening.ts

/** 모드 타입: 축약형(t/p/r)과 정규형(test/study/review) 모두 허용 */
export type CanonicalMode = 'test' | 'study' | 'review';
export type Mode = CanonicalMode | 't' | 'p' | 'r';

/** API에서 항상 정규형으로 쓰기 위한 노멀라이저 */
export function normalizeMode(m: Mode | undefined | null): CanonicalMode {
  switch (m) {
    case 't':
    case 'test':
      return 'test';
    case 'p':
    case 'study':
      return 'study';
    case 'r':
    case 'review':
      return 'review';
    default:
      // 기본값은 test로
      return 'test';
  }
}

/** 잔여 재생 정보 1행 */
export type ConsumePlayRow = {
  session_id: string;
  /** 전체(트랙 무관)인 경우 null */
  track_id: string | null;
  mode: CanonicalMode;            // ← 정규형만 사용
  plays_allowed: number;
  plays_used: number;
  remaining: number;
};

/** API 응답 유니언 */
export type ConsumePlayResponse =
  | { ok: true; data: ConsumePlayRow[] }
  | { ok: false; error: string };
