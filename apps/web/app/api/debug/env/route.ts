import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // 蹂닿린 ?명븯寃???10湲?먮쭔
    urlPrefix: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 10),
    keyPrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').slice(0, 10),
  })
}

