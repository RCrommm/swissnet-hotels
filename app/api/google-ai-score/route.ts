import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const body = await request.json()
  const { hotel_id, hotel_name, query, appeared } = body

  console.log('Google AI score request:', { hotel_id, hotel_name, query, appeared })

  if (!hotel_id || !query || appeared === undefined) {
    return NextResponse.json({ error: 'Missing required fields', body }, { status: 400 })
  }

  const { error, data } = await supabase.from('ai_visibility_scores').insert({
    hotel_id,
    hotel_name,
    query,
    appeared,
    platform: 'google_ai',
    checked_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}