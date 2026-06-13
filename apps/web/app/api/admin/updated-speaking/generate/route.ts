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

    const prompt = `You are an expert Updated TOEFL Speaking content creator. Generate a complete Speaking test JSON.

Topic area: ${topic}

Return ONLY valid JSON, no markdown. Use this exact structure:

{
  "id": "auto",
  "label": "Updated Speaking – [short topic label]",
  "tasks": [
    {
      "id": "task-repeat-1",
      "type": "repeat",
      "prompt": "A natural English sentence related to ${topic} that a student should repeat aloud (15-20 words).",
      "preparationSeconds": 5,
      "speakingSeconds": 15
    },
    {
      "id": "task-repeat-2",
      "type": "repeat",
      "prompt": "Another natural sentence related to ${topic} (15-20 words).",
      "preparationSeconds": 5,
      "speakingSeconds": 15
    },
    {
      "id": "task-independent-1",
      "type": "independent",
      "question": "Do you agree or disagree with the following statement? [Make a statement about ${topic}]. Use specific reasons and examples to support your answer.",
      "preparationSeconds": 15,
      "speakingSeconds": 45
    },
    {
      "id": "task-integrated-1",
      "type": "integrated",
      "readingText": "A short academic paragraph (80-100 words) about a concept related to ${topic}. Include a specific term or idea that the lecture will reference.",
      "listeningText": "Now listen to part of a lecture on the same topic. Professor: [Write a 80-100 word lecture excerpt that challenges or elaborates on the reading passage, introducing a contrasting perspective or additional example]",
      "question": "The professor discusses [topic concept]. Explain how the professor's points relate to what you read in the passage.",
      "preparationSeconds": 30,
      "speakingSeconds": 60
    }
  ]
}

Make all content specific and realistic for the topic: "${topic}". The repeat tasks should be natural conversational or academic sentences. The independent task should be a genuine opinion question. The integrated task should have a reading passage and lecture that clearly connect.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    const id = randomUUID();
    payload.id = id;

    return NextResponse.json({ ok: true, id, payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
