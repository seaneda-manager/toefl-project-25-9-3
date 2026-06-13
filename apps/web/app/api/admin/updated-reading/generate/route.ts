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

    const prompt = `You are an expert TOEFL iBT content creator. Generate a complete Updated TOEFL Reading test in JSON format.

Topic: ${topic}

Requirements:
- Stage 1: One academic passage (~200 words) with 3 questions
- Stage 2: One academic passage (~200 words, different but related topic) with 3 questions
- Question types: use a mix of detail, vocab, inference, purpose
- Each question has exactly 4 choices (A/B/C/D), exactly 1 correct
- passageHtml: valid HTML with <h3> title and <p> paragraphs
- Academic, formal English suitable for TOEFL level

Return ONLY valid JSON matching this exact TypeScript type (no markdown, no explanation):

{
  "meta": { "id": "PLACEHOLDER", "label": "string", "examEra": "ibt_2026" },
  "modules": [
    {
      "id": "stage1-mod1",
      "stage": 1,
      "items": [{
        "id": "s1-p1",
        "taskKind": "academic_passage",
        "stage": 1,
        "difficulty": "core",
        "passageHtml": "<h3>Title</h3><p>...</p>",
        "questions": [
          {
            "id": "s1-q1", "number": 1, "type": "detail",
            "stem": "According to...",
            "choices": [
              { "id": "s1-q1-a", "text": "...", "isCorrect": false },
              { "id": "s1-q1-b", "text": "...", "isCorrect": true },
              { "id": "s1-q1-c", "text": "...", "isCorrect": false },
              { "id": "s1-q1-d", "text": "...", "isCorrect": false }
            ]
          }
        ]
      }]
    },
    {
      "id": "stage2-mod1",
      "stage": 2,
      "items": [{
        "id": "s2-p1",
        "taskKind": "academic_passage",
        "stage": 2,
        "difficulty": "core",
        "passageHtml": "<h3>Title</h3><p>...</p>",
        "questions": [ /* 3 questions same format */ ]
      }]
    }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as any).text as string;
    const jsonStr = raw.replace(/^```[a-z]*\n?/m, '').replace(/```$/m, '').trim();
    const payload = JSON.parse(jsonStr);

    // id 교체
    const id = randomUUID();
    payload.meta.id = id;

    return NextResponse.json({ ok: true, id, payload });
  } catch (err: any) {
    console.error('GENERATE ERROR', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
