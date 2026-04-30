import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { hotel_id, hotel_name } = await request.json()
    if (!hotel_id) return NextResponse.json({ error: 'No hotel_id' }, { status: 400 })

    const referrer = request.headers.get('referer') || null

    let source = 'direct'
    if (referrer) {
      if (referrer.includes('google')) source = 'google'
      else if (referrer.includes('bing')) source = 'bing'
      else if (referrer.includes('perplexity')) source = 'perplexity'
      else if (referrer.includes('chat.openai') || referrer.includes('chatgpt')) source = 'chatgpt'
      else if (referrer.includes('claude')) source = 'claude'
      else if (referrer.includes('gemini')) source = 'gemini'
      else source = 'referral'
    }

    await supabase.from('hotel_views').insert({
      hotel_id,
      hotel_name,
      referrer,
      source,
      viewed_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}