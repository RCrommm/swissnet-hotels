import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { hotel_id, hotel_name, query, appeared } = await request.json()

  const { error } = await supabase.from('ai_visibility_scores').upsert({
    hotel_id,
    hotel_name,
    query,
    appeared,
    platform: 'google_ai',
    checked_at: new Date().toISOString(),
  }, { onConflict: 'hotel_id,query,platform' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
