import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { hotel_id, hotel_name } = await request.json()
    if (!hotel_id) return NextResponse.json({ error: 'No hotel_id' }, { status: 400 })

    const referrer = request.headers.get('referer') || null
    const userAgent = request.headers.get('user-agent') || null

    // Detect utm_source from referrer
    let utm_source = 'direct'
    if (referrer) {
      if (referrer.includes('google')) utm_source = 'google'
      else if (referrer.includes('bing')) utm_source = 'bing'
      else if (referrer.includes('perplexity')) utm_source = 'perplexity'
      else if (referrer.includes('chat.openai') || referrer.includes('chatgpt')) utm_source = 'chatgpt'
      else if (referrer.includes('claude')) utm_source = 'claude'
      else if (referrer.includes('gemini') || referrer.includes('bard')) utm_source = 'gemini'
      else utm_source = 'referral'
    }

    await supabase.from('hotel_views').insert({
      hotel_id,
      hotel_name,
      referrer,
      user_agent: userAgent,
      utm_source,
      viewed_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}