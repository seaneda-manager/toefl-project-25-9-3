import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ElevenLabsClient } from 'elevenlabs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 120;

const anthropic = new Anthropic();
const elevenlabs = new ElevenLabsClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function getRandomVoiceId(): string {
  try {
    const voicePool = JSON.parse(process.env.VOICE_POOL || '{}') as Record<string, string[]>;
    const random = Math.random() * 100;

    let selectedCountry: string;
    if (random < 60) {
      selectedCountry = 'us'; // 60%
    } else if (random < 80) {
      selectedCountry = 'au'; // 20%
    } else {
      selectedCountry = 'uk'; // 20%
    }

    const voices = voicePool[selectedCountry] || [];
    if (voices.length === 0) return process.env.ELEVENLABS_KEY_ID || '';

    return voices[Math.floor(Math.random() * voices.length)];
  } catch (err) {
    console.error('Error parsing VOICE_POOL:', err);
    return process.env.ELEVENLABS_KEY_ID || '';
  }
}

export async function POST(req: Request) {
  try {
    const { mode = 'hard', responsesTopic, conversationTopic, lecture1Topic, lecture2Topic } = await req.json() as {
      mode?: 'easy' | 'hard';
      responsesTopic: string;
      conversationTopic: string;
      lecture1Topic: string;
      lecture2Topic: string;
    };

    if (!responsesTopic?.trim() || !conversationTopic?.trim() || !lecture1Topic?.trim() || !lecture2Topic?.trim()) {
      return NextResponse.json({ ok: false, error: 'All 4 topics required' }, { status: 400 });
    }

    const prompt = `You are an expert Updated TOEFL iBT Listening (Mode 2 Hard) content creator.
Generate a complete Updated TOEFL Listening Module 2 test JSON with Mode 2 (Hard) structure: 15 total items.

Track 1 — Listen and Choose a Response (topic: "${responsesTopic}"):
- taskKind: "choose_response"
- 3-4 individual single utterances (campus conversation snippets)
- Each item: 1 sentence + 4 response choices, 1 correct
- Requires pragmatic understanding (tone, context, implication)
- totalItems: 3-4

Track 2 — Conversation (topic: "${conversationTopic}"):
- taskKind: "conversation"
- Two speakers (student + professor/staff), 60-90 seconds
- ~140-180 words transcript
- Exactly 2 questions (types: main_topic, pragmatic_meaning, or inference)
- Each question: 4 choices, exactly 1 correct
- audioSeconds: 75
- testingSeconds: 150

Track 3 — Academic Talk #1 (topic: "${lecture1Topic}"):
- taskKind: "academic_talk"
- Professor monologue on academic subject, 90-120 seconds
- ~250-300 words transcript
- Exactly 4 questions (types: main_idea, detail, function, inference)
- Each question: 4 choices, exactly 1 correct
- audioSeconds: 105
- testingSeconds: 240

Track 4 — Academic Talk #2 (topic: "${lecture2Topic}"):
- taskKind: "academic_talk"
- Professor monologue on different academic subject, 90-120 seconds
- ~250-300 words transcript
- Exactly 4 questions (types: main_idea, detail, function, inference)
- Each question: 4 choices, exactly 1 correct
- audioSeconds: 105
- testingSeconds: 240

For each track:
- id: unique slug (e.g., "resp-1", "resp-2", "conv-1", "talk-1", "talk-2")
- title: short descriptive title
- audioUrl: "" (empty — will be uploaded separately)
- illustrationUrl: "" (empty)
- transcript: realistic spoken English
- For choose_response items: full_transcript (full conversation context), utterance_index (which speaker turn is the prompt)

TOTAL: 3-4 responses + 2 conversation + 4 lecture1 + 4 lecture2 = 13-15 items

Return ONLY valid JSON, no markdown, no explanation:

{
  "meta": {
    "id": "PLACEHOLDER",
    "label": "Module 2 Hard – [descriptive label]",
    "examEra": "ibt_2026",
    "source": "ai-generated",
    "mode": "hard"
  },
  "tracks": [
    {
      "id": "resp-1",
      "taskKind": "choose_response",
      "title": "Listen and Choose a Response",
      "audioUrl": "",
      "illustrationUrl": "",
      "transcript": "Speaker A: ...\nSpeaker B: ...",
      "questions": [
        {
          "id": "resp-1-q1",
          "number": 1,
          "type": "pragmatic_meaning",
          "stem": "What does the speaker imply?",
          "correctIndices": [2],
          "choices": [
            { "id": "resp-1-q1-a", "text": "...", "isCorrect": false },
            { "id": "resp-1-q1-b", "text": "...", "isCorrect": false },
            { "id": "resp-1-q1-c", "text": "...", "isCorrect": true },
            { "id": "resp-1-q1-d", "text": "...", "isCorrect": false }
          ]
        },
        {
          "id": "resp-1-q2",
          "number": 2,
          "type": "pragmatic_meaning",
          "stem": "What is the most appropriate response?",
          "correctIndices": [1],
          "choices": [
            { "id": "resp-1-q2-a", "text": "...", "isCorrect": false },
            { "id": "resp-1-q2-b", "text": "...", "isCorrect": true },
            { "id": "resp-1-q2-c", "text": "...", "isCorrect": false },
            { "id": "resp-1-q2-d", "text": "...", "isCorrect": false }
          ]
        }
      ]
    },
    {
      "id": "conv-1",
      "taskKind": "conversation",
      "title": "Conversation",
      "audioUrl": "",
      "illustrationUrl": "",
      "audioSeconds": 75,
      "transcript": "Student: ...\nProfessor: ...",
      "testingSeconds": 150,
      "questions": [
        { "id": "conv-1-q1", "number": 3, "type": "main_topic", "stem": "What is the conversation mainly about?", "correctIndices": [0], "choices": [...4 choices...] },
        { "id": "conv-1-q2", "number": 4, "type": "pragmatic_meaning", "stem": "Why does the student say this?", "correctIndices": [2], "choices": [...4 choices...] }
      ]
    },
    {
      "id": "talk-1",
      "taskKind": "academic_talk",
      "title": "Academic Talk 1",
      "audioUrl": "",
      "illustrationUrl": "",
      "audioSeconds": 105,
      "transcript": "Professor: Today we will discuss ...",
      "testingSeconds": 240,
      "questions": [
        { "id": "talk-1-q1", "number": 5, "type": "main_idea", "stem": "What is the main idea?", "correctIndices": [1], "choices": [...4 choices...] },
        { "id": "talk-1-q2", "number": 6, "type": "detail", "stem": "According to the professor, ...", "correctIndices": [3], "choices": [...4 choices...] },
        { "id": "talk-1-q3", "number": 7, "type": "function", "stem": "Why does the professor mention this?", "correctIndices": [0], "choices": [...4 choices...] },
        { "id": "talk-1-q4", "number": 8, "type": "inference", "stem": "What can be inferred from the lecture?", "correctIndices": [2], "choices": [...4 choices...] }
      ]
    },
    {
      "id": "talk-2",
      "taskKind": "academic_talk",
      "title": "Academic Talk 2",
      "audioUrl": "",
      "illustrationUrl": "",
      "audioSeconds": 105,
      "transcript": "Professor: Let me explain ...",
      "testingSeconds": 240,
      "questions": [
        { "id": "talk-2-q1", "number": 9, "type": "main_idea", "stem": "What is the lecture mainly about?", "correctIndices": [2], "choices": [...4 choices...] },
        { "id": "talk-2-q2", "number": 10, "type": "detail", "stem": "What does the professor state?", "correctIndices": [1], "choices": [...4 choices...] },
        { "id": "talk-2-q3", "number": 11, "type": "function", "stem": "The professor provides an example to ...", "correctIndices": [0], "choices": [...4 choices...] },
        { "id": "talk-2-q4", "number": 12, "type": "inference", "stem": "What does the lecture suggest?", "correctIndices": [3], "choices": [...4 choices...] }
      ]
    }
  ]
}`;

    const message = await anthropic.messages.create({
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

    // 각 track의 음성 생성
    for (const track of payload.tracks) {
      try {
        const voiceId = getRandomVoiceId();
        console.log(`[Audio] Starting generation for track ${track.id}...`);
        console.log(`[Audio] Voice ID: ${voiceId}`);

        const audio = await elevenlabs.generate({
          voice: voiceId,
          text: track.transcript,
          model_id: 'eleven_turbo_v2_5',
        });

        let audioBuffer: Buffer;
        if (Buffer.isBuffer(audio)) {
          audioBuffer = audio;
        } else if (audio instanceof ArrayBuffer) {
          audioBuffer = Buffer.from(audio);
        } else {
          // Handle stream or async iterable
          const chunks: Buffer[] = [];
          for await (const chunk of audio) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          audioBuffer = Buffer.concat(chunks);
        }
        console.log(`[Audio] Generated buffer size: ${audioBuffer.byteLength} bytes`);

        const fileName = `listening/${id}/${track.id}.mp3`;

        const { error, data: uploadData } = await supabase.storage
          .from('content')
          .upload(fileName, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (error) {
          console.error(`[Audio] Upload failed for ${track.id}:`, error);
          throw error;
        }

        console.log(`[Audio] Uploaded to: ${fileName}`);

        const { data } = supabase.storage
          .from('content')
          .getPublicUrl(fileName);

        track.audioUrl = data.publicUrl;
        console.log(`[Audio] Public URL: ${data.publicUrl}`);
      } catch (err) {
        console.error(`[Audio] Generation failed for track ${track.id}:`, err);
        throw new Error(`Audio generation failed for track ${track.id}: ${(err as any)?.message}`);
      }
    }

    return NextResponse.json({ ok: true, id, payload });
  } catch (err: any) {
    console.error('LISTENING GENERATE ERROR', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
