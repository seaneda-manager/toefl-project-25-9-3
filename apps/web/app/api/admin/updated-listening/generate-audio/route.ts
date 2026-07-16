import { NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 120;

const elevenlabs = new ElevenLabsClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface TrackAudio {
  trackId: string;
  transcript: string;
}

export async function POST(req: Request) {
  try {
    const { testId, tracks } = await req.json() as {
      testId: string;
      tracks: TrackAudio[];
    };

    if (!testId || !tracks || tracks.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'testId and tracks required' },
        { status: 400 }
      );
    }

    const results: Record<string, string> = {};

    for (const track of tracks) {
      try {
        const audio = await elevenlabs.generate({
          voice: 'Rachel',
          text: track.transcript,
          model_id: 'eleven_monolingual_v1',
        });

        const audioBuffer = await audio.arrayBuffer();
        const fileName = `listening/${testId}/${track.trackId}.mp3`;

        const { error } = await supabase.storage
          .from('content')
          .upload(fileName, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from('content')
          .getPublicUrl(fileName);

        results[track.trackId] = data.publicUrl;
      } catch (err) {
        console.error(`Audio generation failed for track ${track.trackId}:`, err);
        results[track.trackId] = '';
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error('AUDIO GENERATION ERROR', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
