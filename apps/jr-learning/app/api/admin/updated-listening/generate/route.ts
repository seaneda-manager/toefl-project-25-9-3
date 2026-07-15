import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 120;

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { conversationTopic, lectureTopic, campusTopic } = await req.json() as {
      conversationTopic: string;
      lectureTopic: string;
      campusTopic: string;
    };

    if (!conversationTopic?.trim() || !lectureTopic?.trim() || !campusTopic?.trim()) {
      return NextResponse.json({ ok: false, error: 'All 3 topics required' }, { status: 400 });
    }

    const prompt = `You are an expert Updated TOEFL iBT Listening content creator.
Generate a complete Updated TOEFL Listening test JSON with exactly 3 tracks (linear, not adaptive).

Track 1 — Conversation (topic: "${conversationTopic}"):
- taskKind: "conversation"
- Two speakers (student + professor, or 2 students), casual academic setting
- Natural spoken dialogue, ~120-160 words transcript
- Exactly 3 questions (types: main_topic, detail, inference or function)
- Each question: 4 choices, exactly 1 correct (mark isCorrect: true, rest false)
- audioSeconds: 60–90 (estimate)
- testingSeconds: 180

Track 2 — Academic Lecture (topic: "${lectureTopic}"):
- taskKind: "academic_lecture"
- Professor monologue on academic topic, ~200-250 words
- Exactly 4 questions (types: main_topic, detail, function, multi_select)
  ⚠ The multi_select question must have: selectCount: 2, exactly 2 correct choices (isCorrect: true), 2 wrong
- audioSeconds: 90–120
- testingSeconds: 300

Track 3 — Campus Audio Log (topic: "${campusTopic}"):
- taskKind: "campus_audio_log"
- Campus announcement, podcast, or radio-style audio, ~80-120 words
- Exactly 2 questions (types: detail, inference)
- Each question: 4 choices, exactly 1 correct
- audioSeconds: 30–50
- testingSeconds: 120

For each track:
- id: unique slug (e.g., "conv-1", "lec-1", "campus-1")
- title: short descriptive title
- audioUrl: "" (empty — will be uploaded separately)
- illustrationUrl: "" (empty)
- transcript: realistic spoken English

correctIndices: array of 0-based indices of correct choices.
  Single correct → [2]  (example: choice index 2 is correct)
  Multi correct → [0, 3] (example: choices 0 and 3 are correct)

Return ONLY valid JSON, no markdown, no explanation:

{
  "meta": {
    "id": "PLACEHOLDER",
    "label": "Updated Listening – [short descriptive label]",
    "examEra": "ibt_2026",
    "source": "ai-generated"
  },
  "tracks": [
    {
      "id": "conv-1",
      "taskKind": "conversation",
      "title": "...",
      "audioUrl": "",
      "illustrationUrl": "",
      "audioSeconds": 75,
      "transcript": "Professor Kim: ...\nStudent: ...",
      "testingSeconds": 180,
      "questions": [
        {
          "id": "conv-1-q1",
          "number": 1,
          "type": "main_topic",
          "stem": "What is the conversation mainly about?",
          "correctIndices": [1],
          "choices": [
            { "id": "conv-1-q1-a", "text": "...", "isCorrect": false },
            { "id": "conv-1-q1-b", "text": "...", "isCorrect": true },
            { "id": "conv-1-q1-c", "text": "...", "isCorrect": false },
            { "id": "conv-1-q1-d", "text": "...", "isCorrect": false }
          ]
        }
      ]
    },
    {
      "id": "lec-1",
      "taskKind": "academic_lecture",
      "title": "...",
      "audioUrl": "",
      "illustrationUrl": "",
      "audioSeconds": 105,
      "transcript": "Professor: Today we will ...",
      "testingSeconds": 300,
      "questions": [
        { "id": "lec-1-q1", "number": 1, "type": "main_topic", "stem": "...", "correctIndices": [0], "choices": [...4 choices...] },
        { "id": "lec-1-q2", "number": 2, "type": "detail", "stem": "...", "correctIndices": [2], "choices": [...4 choices...] },
        { "id": "lec-1-q3", "number": 3, "type": "function", "stem": "...", "correctIndices": [1], "choices": [...4 choices...] },
        { "id": "lec-1-q4", "number": 4, "type": "multi_select", "stem": "...", "selectCount": 2, "correctIndices": [0, 3],
          "choices": [
            { "id": "lec-1-q4-a", "text": "...", "isCorrect": true },
            { "id": "lec-1-q4-b", "text": "...", "isCorrect": false },
            { "id": "lec-1-q4-c", "text": "...", "isCorrect": false },
            { "id": "lec-1-q4-d", "text": "...", "isCorrect": true }
          ]
        }
      ]
    },
    {
      "id": "campus-1",
      "taskKind": "campus_audio_log",
      "title": "...",
      "audioUrl": "",
      "illustrationUrl": "",
      "audioSeconds": 40,
      "transcript": "Announcer: Attention students ...",
      "testingSeconds": 120,
      "questions": [
        { "id": "campus-1-q1", "number": 1, "type": "detail", "stem": "...", "correctIndices": [2], "choices": [...4 choices...] },
        { "id": "campus-1-q2", "number": 2, "type": "inference", "stem": "...", "correctIndices": [0], "choices": [...4 choices...] }
      ]
    }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    const id = randomUUID();
    payload.meta.id = id;

    return NextResponse.json({ ok: true, id, payload });
  } catch (err: any) {
    console.error('LISTENING GENERATE ERROR', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
