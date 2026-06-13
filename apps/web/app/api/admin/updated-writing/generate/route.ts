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

    const prompt = `You are an expert Updated TOEFL Writing content creator. Generate a complete Updated TOEFL Writing test JSON with exactly 3 tasks.

Topic area: ${topic}

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:

{
  "meta": {
    "id": "auto",
    "label": "Updated Writing – [short topic label]",
    "examEra": "ibt_2026"
  },
  "items": [
    {
      "id": "task-fill-1",
      "taskKind": "fill_in_blank",
      "title": "Fill-in-Blank Writing",
      "promptHtml": "<p>Read the passage and fill in the blanks with appropriate words or phrases.</p><p>The topic sentence of the paragraph is: {{BLANK_1}}. This is important because {{BLANK_2}}. In conclusion, {{BLANK_3}}.</p>",
      "blanks": [
        { "id": "BLANK_1", "placeholder": "write the topic sentence", "sampleAnswer": "sample answer here", "minWords": 5 },
        { "id": "BLANK_2", "placeholder": "explain the reason", "sampleAnswer": "sample answer here", "minWords": 5 },
        { "id": "BLANK_3", "placeholder": "write a conclusion", "sampleAnswer": "sample answer here", "minWords": 5 }
      ],
      "recommendedTimeSeconds": 600
    },
    {
      "id": "task-email-1",
      "taskKind": "email",
      "situation": "You are a university student. [describe situation related to topic]",
      "prompt": "Write an email to [recipient] asking about / requesting [something related to topic]. Make sure to include a greeting, the purpose of your email, specific questions or requests, and a polite closing.",
      "hints": ["Introduce yourself briefly", "State your main request clearly", "Ask at least 2 specific questions", "Close politely"],
      "wordLimit": { "min": 100, "max": 150 },
      "recommendedTimeSeconds": 600
    },
    {
      "id": "task-acad-1",
      "taskKind": "academic_discussion",
      "context": "Your professor has posted a discussion question in an online class forum about [topic].",
      "professorPrompt": "This week we are discussing [topic-related question]. What is your view on this? Please share your perspective and explain your reasoning.",
      "studentPosts": [
        {
          "id": "post-1",
          "author": "Minjun",
          "content": "I think [student 1 perspective on topic]. This is because [reason 1] and [reason 2]."
        },
        {
          "id": "post-2",
          "author": "Sofia",
          "content": "In my opinion, [student 2 perspective, different from student 1]. For example, [specific example]."
        }
      ],
      "wordLimit": { "min": 100, "max": 200 },
      "recommendedTimeSeconds": 600
    }
  ]
}

Make all content specific and realistic for the topic: "${topic}". The fill-in-blank passage should have academic English with natural blanks. The email should have a clear, realistic scenario. The academic discussion should have a thought-provoking question with two contrasting student views.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    const id = randomUUID();
    payload.meta.id = id;

    return NextResponse.json({ ok: true, id, payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
