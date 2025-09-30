import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: NextRequest) {
  const { passageId } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // user_id??湲곕낯媛?auth.uid()濡??먮룞 ?명똿??
  const { data, error } = await supabase
    .from('listening_sessions')
    .insert({ passage_id: passageId })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ sessionId: data.id }, { status: 201 })
}

