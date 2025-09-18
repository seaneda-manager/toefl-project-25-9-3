'use server';

// TODO: ?섏쨷??DB/Supabase ?곌껐
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
