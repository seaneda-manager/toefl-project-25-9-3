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

    const prompt = `You are an expert TOEFL iBT Listening content creator. Generate a complete Updated TOEFL Listening test in JSON format.

Topic area: ${topic}

Requirements:
- Stage 1: 2 tracks (1 conversation + 1 lecture), each with 3 questions
- Stage 2: 2 tracks (1 conversation + 1 lecture), each with 3 questions
- Each track has a realistic transcript (~150-200 words) in natural spoken English
- Conversation: two people (Student/Professor or two students), casual academic setting
- Lecture: professor speaking on an academic topic (biology, history, psychology, etc.)
- Question types: main_topic, detail, function, inference
- Each question has exactly 4 choices, exactly 1 correct (mark with isCorrect: true)
- taskKind: "conversation" or "academic_talk"

Return ONLY valid JSON (no markdown, no explanation):

{
  "meta": { "id": "PLACEHOLDER", "label": "string", "examEra": "ibt_2026", "source": "ai-generated" },
  "modules": [
    {
      "id": "L-stage1",
      "stage": 1,
      "isPretest": false,
      "items": [
        {
          "id": "s1-conv1",
          "taskKind": "conversation",
          "stage": 1,
          "difficulty": "core",
          "audioUrl": "",
          "title": "Conversation 1",
          "transcript": "Professor: ...\nStudent: ...",
          "questions": [
            {
              "id": "s1-c1-q1",
              "number": 1,
              "type": "main_topic",
              "stem": "What is the conversation mainly about?",
              "choices": [
                { "id": "s1-c1-q1-a", "text": "...", "is_correct": false },
                { "id": "s1-c1-q1-b", "text": "...", "is_correct": true },
                { "id": "s1-c1-q1-c", "text": "...", "is_correct": false },
                { "id": "s1-c1-q1-d", "text": "...", "is_correct": false }
              ]
            }
          ]
        },
        {
          "id": "s1-lec1",
          "taskKind": "academic_talk",
          "stage": 1,
          "difficulty": "core",
          "audioUrl": "",
          "title": "Lecture 1",
          "transcript": "Professor: Today we will discuss ...",
          "questions": [ /* 3 questions */ ]
        }
      ]
    },
    {
      "id": "L-stage2",
      "stage": 2,
      "isPretest": false,
      "items": [ /* same structure: 1 conversation + 1 lecture, 3 questions each */ ]
    }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as any).text as string;
    const jsonStr = raw.replace(/^```[a-z]*\n?/m, '').replace(/```$/m, '').trim();
    const payload = JSON.parse(jsonStr);

    const id = randomUUID();
    payload.meta.id = id;

    return NextResponse.json({ ok: true, id, payload });
  } catch (err: any) {
    console.error('LISTENING GENERATE ERROR', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
