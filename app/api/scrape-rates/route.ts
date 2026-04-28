import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { hotel_id, url } = await request.json()

  if (!hotel_id || !url) {
    return NextResponse.json({ error: 'hotel_id and url required' }, { status: 400 })
  }

  let text = ''

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    })
    const html = await res.text()
    text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)
  } catch {
    text = `Hotel website: ${url}`
  }

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Extract room types and nightly rates in CHF from this hotel website. If rates are in other currencies, convert to CHF approximately.

Website URL: ${url}
Website text: ${text}

Return ONLY this JSON, no other text:
{
  "rooms": [
    {"room_type": "Classic Room", "rate_chf": 450},
    {"room_type": "Deluxe Suite", "rate_chf": 780}
  ]
}

If no specific rates found, make reasonable estimates based on the hotel type and location. Always return at least 2-3 room types.`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    if (claudeData.error) {
      return NextResponse.json({ error: claudeData.error.message }, { status: 500 })
    }

    const content = claudeData.content[0].text
    const cleanJson = content.replace(/```json|```/g, '').trim()
    const { rooms } = JSON.parse(cleanJson)

    // Mark old rates as not current
    await supabase
      .from('room_rates')
      .update({ is_current: false })
      .eq('hotel_id', hotel_id)

    // Insert new rates
    const newRates = rooms.map((r: any) => ({
      hotel_id,
      room_type: r.room_type,
      rate_chf: r.rate_chf,
      source_url: url,
      is_current: true,
      scraped_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('room_rates')
      .insert(newRates)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

// Also update base_rate_chf in room_types for partner hotels
const { data: hotelData } = await supabase
  .from('hotels')
  .select('is_partner')
  .eq('id', hotel_id)
  .single()

if (hotelData?.is_partner && rooms.length > 0) {
  const lowestRate = Math.min(...rooms.map((r: any) => r.rate_chf))
  
  // Update nightly_rate_chf on the hotel itself
  await supabase
    .from('hotels')
    .update({ nightly_rate_chf: lowestRate })
    .eq('id', hotel_id)

  // Update base_rate_chf on existing room_types if names match
  for (const room of rooms) {
    await supabase
      .from('room_types')
      .update({ base_rate_chf: room.rate_chf })
      .eq('hotel_id', hotel_id)
      .ilike('name', `%${room.room_type.split(' ')[0]}%`)
  }
}

return NextResponse.json({ success: true, rooms: data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 422 })
  }
}