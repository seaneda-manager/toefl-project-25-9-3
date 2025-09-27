// apps/web/types/listening.ts
export type ConsumePlayRow = {
  session_id: string;      // ← 문자열로 고정
  plays_allowed: number;
  plays_used: number;
  remaining: number;
};

export type ConsumePlayResponse =
  | { ok: true; data: ConsumePlayRow[] }
  | { ok: false; error: string };
