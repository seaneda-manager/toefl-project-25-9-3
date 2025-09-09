'use server';

// TODO: 나중에 DB/Supabase 연결
export async function startListeningSession(args: { trackId: string; mode: 'study'|'test' }) {
  return { sessionId: crypto.randomUUID() };
}

export async function submitListeningAnswer(args: {
  sessionId: string;
  questionId: string;
  choiceId: string;
  elapsedMs?: number;
}) {
  return { ok: true };
}

export async function finishListeningSession(args: { sessionId: string }) {
  return { ok: true };
}
