import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { topic } = await req.json() as { topic: string };
    if (!topic?.trim()) {
      return NextResponse.json({ ok: false, error: 'topic required' }, { status: 400 });
    }

    const prompt = `You are an expert Updated TOEFL Speaking content creator. Generate a complete Speaking test JSON with exactly 2 tasks.

Topic area: ${topic}

Task 1 — Listen and Repeat (듣고 따라말하기):
- Pick a realistic everyday situation related to the topic (e.g. "laundry room", "computer lab", "campus bookstore", "welcome center employee training")
- Write 6 natural English sentences a person in that situation would say
- Each sentence: 12-20 words, natural spoken English, not too complex
- Student repeats each sentence immediately after hearing it (beep → speak → beep)
- speakingSeconds: 10 per sentence

Task 2 — Interview:
- Write 5 questions on varied topics (education, lifestyle, technology, society, personal experience, environment, etc.)
- Questions should be open-ended, inviting the student to share opinions or experiences
- speakingSeconds: 45 per question

Return ONLY valid JSON, no markdown, no explanation:

{
  "id": "auto",
  "label": "Updated Speaking – [short descriptive label]",
  "tasks": [
    {
      "id": "task-listen-repeat",
      "type": "listen_repeat",
      "situation": "[situation name, e.g. Laundry Room]",
      "situationDescription": "[1-2 sentences describing the scenario]",
      "sentences": [
        { "id": "s1", "text": "...", "speakingSeconds": 10 },
        { "id": "s2", "text": "...", "speakingSeconds": 10 },
        { "id": "s3", "text": "...", "speakingSeconds": 10 },
        { "id": "s4", "text": "...", "speakingSeconds": 10 },
        { "id": "s5", "text": "...", "speakingSeconds": 10 },
        { "id": "s6", "text": "...", "speakingSeconds": 10 }
      ]
    },
    {
      "id": "task-interview",
      "type": "interview",
      "questions": [
        { "id": "q1", "text": "...", "topic": "education", "speakingSeconds": 45 },
        { "id": "q2", "text": "...", "topic": "lifestyle", "speakingSeconds": 45 },
        { "id": "q3", "text": "...", "topic": "technology", "speakingSeconds": 45 },
        { "id": "q4", "text": "...", "topic": "society", "speakingSeconds": 45 },
        { "id": "q5", "text": "...", "topic": "personal experience", "speakingSeconds": 45 }
      ]
    }
  ]
}

Make all content specific and realistic for the topic area: "${topic}".`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    payload.id = randomUUID();

    return NextResponse.json({ ok: true, id: payload.id, payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
