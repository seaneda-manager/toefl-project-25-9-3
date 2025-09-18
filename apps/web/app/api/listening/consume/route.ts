import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  // 내가 소유한 세션만 RLS가 허용함
  const { data: s, error: selErr } = await supabase
    .from('listening_sessions')
    .select('id, consumed_at')
    .eq('id', sessionId)
    .single()

  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 400 })
  if (!s)     return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (s.consumed_at) return NextResponse.json({ error: 'already' }, { status: 409 })

  const { error: upErr } = await supabase
    .from('listening_sessions')
    .update({ consumed_at: new Date().toISOString(), has_played: true })
    .eq('id', sessionId)

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })
  return new NextResponse(null, { status: 204 })
}
