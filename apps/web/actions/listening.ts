// apps/web/actions/listening.ts
'use client';

export type StartListeningSessionArgs = {
  trackId: string;                // 텍스트/식별자
  mode: 'study' | 'test' | 'p' | 't' | 'r';
};
export type SubmitListeningAnswerArgs = {
  sessionId: string;              // UUID
  questionId: number;             // BIGINT
  choiceId: string;
  elapsedMs?: number;
};
export type FinishListeningSessionArgs = {
  sessionId: string;              // UUID
};

export async function startListeningSession(args: StartListeningSessionArgs) {
  const res = await fetch('/api/listening/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`startListeningSession failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; sessionId: string }>;
}

export async function submitListeningAnswer(args: SubmitListeningAnswerArgs) {
  const res = await fetch('/api/listening/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`submitListeningAnswer failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean }>;
}

export async function finishListeningSession(args: FinishListeningSessionArgs) {
  const res = await fetch('/api/listening/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`finishListeningSession failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean }>;
}
