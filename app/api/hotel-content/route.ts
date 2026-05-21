import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const body = await request.json()
  const { error } = await supabase.from('hotel_content').upsert(body, { onConflict: 'hotel_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}