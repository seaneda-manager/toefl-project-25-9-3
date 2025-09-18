export async function startReadingSession({
passageId,
mode,
}: {
passageId: string
mode: 'study' | 'test'
}): Promise<{ passage: { id: string; title: string; content: string; questions: any[] } }> {
return {
passage: {
id: passageId,
title: 'Mock Passage',
content: 'Mock passage content for skimming. Replace with real content.',
questions: [],
},
}
}


export async function submitReadingAnswer(sessionId: string, questionId: string, choiceId: string) {
return { ok: true }
}


export async function finishReadingSession(sessionId: string) {
return { ok: true }
}