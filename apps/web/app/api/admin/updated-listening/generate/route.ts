import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ElevenLabsClient } from 'elevenlabs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 240;

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
      selectedCountry = 'us';
    } else if (random < 80) {
      selectedCountry = 'au';
    } else {
      selectedCountry = 'uk';
    }

    const voices = voicePool[selectedCountry] || [];
    if (voices.length === 0) return process.env.ELEVENLABS_KEY_ID || '';

    return voices[Math.floor(Math.random() * voices.length)];
  } catch (err) {
    console.error('Error parsing VOICE_POOL:', err);
    return process.env.ELEVENLABS_KEY_ID || '';
  }
}

async function generateModule(part: 'hard' | 'easy', conversationTopic: string, lectureTopic: string, campusTopic: string) {
  const prompt = part === 'hard'
    ? `You are an expert Updated TOEFL iBT Listening (Module 2 Hard) content creator.
Generate a complete Updated TOEFL Listening Module 2 test JSON with Hard structure: 15 total items.

Track 1 — Listen and Choose a Response:
- taskKind: "choose_response"
- 3-4 individual single utterances (campus conversation snippets)
- Each item: 1 sentence + 4 response choices, 1 correct
- Requires pragmatic understanding
- totalItems: 3-4

Track 2 — Conversation (topic: "${conversationTopic}"):
- taskKind: "conversation"
- Two speakers (student + professor/staff), 60-90 seconds, ~140-180 words
- Exactly 2 questions
- audioSeconds: 75

Track 3 — Academic Talk #1 (topic: "${lectureTopic}"):
- taskKind: "academic_talk"
- Professor monologue, 90-120 seconds, ~250-300 words
- Exactly 4 questions (main_idea, detail, function, inference)
- audioSeconds: 105

Track 4 — Academic Talk #2 (topic: "${lectureTopic}"):
- taskKind: "academic_talk"
- Different professor/topic, 90-120 seconds, ~250-300 words
- Exactly 4 questions
- audioSeconds: 105

For each track: id, taskKind, title, transcript, questions (with choices: text, correct flag)
Return ONLY valid JSON: { "items": [...] }`
    : `You are an expert Updated TOEFL iBT Listening (Module 2 Easy) content creator.
Generate a complete Updated TOEFL Listening Module 2 test JSON with Easy structure.

Track 1 — Listen and Choose a Response:
- taskKind: "choose_response"
- 3-4 individual utterances (easier, simpler pragmatics)
- Each: 1 sentence + 4 choices, 1 correct
- totalItems: 3-4

Track 2 — Conversation (topic: "${conversationTopic}"):
- taskKind: "conversation"
- Two speakers, 60-90 seconds, ~140-180 words (easier vocabulary)
- Exactly 2 questions
- audioSeconds: 75

Track 3 — Announcement (topic: "${campusTopic}"):
- taskKind: "announcement"
- Single-speaker campus announcement, 30-50 seconds, ~80-120 words (clear, direct)
- Exactly 2 questions (detail/purpose)
- audioSeconds: 40

Track 4 — Announcement #2 (topic: "${campusTopic}"):
- taskKind: "announcement"
- Different announcement, 30-50 seconds, ~80-120 words
- Exactly 2 questions
- audioSeconds: 40

For each track: id, taskKind, title, transcript, questions (with choices: text, correct flag)
Return ONLY valid JSON: { "items": [...] }`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as { items: any[] };

  return parsed.items;
}

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

    console.log('[Generate] Starting Hard + Easy generation...');

    // Generate both Hard and Easy in parallel
    const [hardItems, easyItems] = await Promise.all([
      generateModule('hard', conversationTopic, lectureTopic, campusTopic),
      generateModule('easy', conversationTopic, lectureTopic, campusTopic),
    ]);

    const testId = randomUUID();

    // Process Hard module with audio
    console.log('[Audio] Generating audio for Hard items...');
    const hardTracks = hardItems.map((item, i) => ({
      id: `h-${i}`,
      ...item,
      audioUrl: '',
      illustrationUrl: '',
    }));

    for (const track of hardTracks) {
      try {
        const voiceId = getRandomVoiceId();
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
          const chunks: Buffer[] = [];
          for await (const chunk of audio) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          audioBuffer = Buffer.concat(chunks);
        }

        const fileName = `listening/${testId}/${track.id}-hard.mp3`;
        const { error } = await supabase.storage.from('content').upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

        if (error) throw error;

        const { data } = supabase.storage.from('content').getPublicUrl(fileName);
        track.audioUrl = data.publicUrl;
      } catch (err) {
        console.error(`[Audio] Generation failed for hard ${track.id}:`, err);
        throw new Error(`Audio generation failed for hard ${track.id}: ${(err as any)?.message}`);
      }
    }

    // Process Easy module with audio
    console.log('[Audio] Generating audio for Easy items...');
    const easyTracks = easyItems.map((item, i) => ({
      id: `e-${i}`,
      ...item,
      audioUrl: '',
      illustrationUrl: '',
    }));

    for (const track of easyTracks) {
      try {
        const voiceId = getRandomVoiceId();
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
          const chunks: Buffer[] = [];
          for await (const chunk of audio) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          audioBuffer = Buffer.concat(chunks);
        }

        const fileName = `listening/${testId}/${track.id}-easy.mp3`;
        const { error } = await supabase.storage.from('content').upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

        if (error) throw error;

        const { data } = supabase.storage.from('content').getPublicUrl(fileName);
        track.audioUrl = data.publicUrl;
      } catch (err) {
        console.error(`[Audio] Generation failed for easy ${track.id}:`, err);
        throw new Error(`Audio generation failed for easy ${track.id}: ${(err as any)?.message}`);
      }
    }

    const payload = {
      meta: {
        id: testId,
        label: 'AI Generated Listening Test',
        examEra: 'ibt_2026',
        source: 'ai-generated',
      },
      hard: { tracks: hardTracks },
      easy: { tracks: easyTracks },
    };

    return NextResponse.json({ ok: true, id: testId, payload });
  } catch (err: any) {
    console.error('LISTENING GENERATE ERROR', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
