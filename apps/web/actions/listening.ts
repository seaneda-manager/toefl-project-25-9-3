import type { ListeningTrack } from '@/types/types-listening' // 프로젝트 타입이 없으면 아래 로컬 타입 복사 사용


export async function startListeningSession(trackId: string): Promise<{ sessionId: string; track: ListeningTrack }> {
return {
sessionId: crypto.randomUUID(),
track: {
id: trackId,
title: 'Mock Track',
audioUrl: '/audio/mock.mp3',
durationSec: 600,
timeLimitSec: 600,
questions: [],
oneShot: true,
} as ListeningTrack,
}
}


export async function submitListeningAnswer(
sessionId: string,
questionId: string,
choiceId: string
): Promise<{ ok: boolean; correct?: boolean }> {
return { ok: true, correct: Math.random() > 0.5 }
}


export async function finishListeningSession(sessionId: string): Promise<{ ok: boolean }> {
return { ok: true }
}