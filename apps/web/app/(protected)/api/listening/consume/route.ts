import { NextRequest, NextResponse } from 'next/server'
// import { db } from '@/lib/db'
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ ok:false, error:'no sessionId' }, { status:400 })
  // const row = await db.listening_sessions.findUnique({ where:{ id: sessionId } })
  // if (!row) return NextResponse.json({ ok:false }, { status:404 })
  // if (row.consumed) return NextResponse.json({ ok:false }, { status:409 })
  // await db.listening_sessions.update({ where:{ id: sessionId }, data:{ consumed:true, first_played_at:new Date() } })
  return NextResponse.json({ ok:true })
}
