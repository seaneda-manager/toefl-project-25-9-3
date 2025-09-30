export type Mode = 'p' | 't' | 'r' | 'test' | 'study';

export type ConsumePlayRow = {
  session_id: string;
  track_id: string | null;
  mode: Mode;
  plays_allowed: number;
  plays_used: number;
  remaining: number;
};

export type ConsumePlayResponse = {
  ok: true;
  data: ConsumePlayRow[];
} | {
  ok: false;
  error: string;
};
