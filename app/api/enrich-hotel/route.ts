import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-api-secret')
  if (secret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { hotel_id, hotel_name, hotel_url, location } = await request.json()
  if (!hotel_id || !hotel_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  let websiteText = ''
  if (hotel_url) {
    try {
      const res = await fetch(hotel_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await res.text()
      websiteText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000)
    } catch {
      websiteText = 'Hotel: ' + hotel_name + ', Location: ' + location
    }
  }

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: 'You are enriching a hotel listing for ' + hotel_name + ' in ' + location + ', Switzerland. Use the website content below to write accurate information.\n\nWebsite content: ' + websiteText + '\n\nReturn ONLY this JSON with no other text:\n{\n  "description": "2-3 sentence compelling description of the hotel",\n  "amenities": ["Spa", "Pool", "Fine Dining", "Fitness Center", "Concierge"],\n  "best_for": ["Couples", "Wellness", "Ski Lovers"],\n  "faqs": [\n    {"question": "What makes ' + hotel_name + ' special?", "answer": "detailed answer"},\n    {"question": "Is ' + hotel_name + ' good for a honeymoon?", "answer": "detailed answer"},\n    {"question": "What are the best rooms at ' + hotel_name + '?", "answer": "detailed answer"},\n    {"question": "What dining options does ' + hotel_name + ' offer?", "answer": "detailed answer"},\n    {"question": "Where is ' + hotel_name + ' located?", "answer": "detailed answer"}\n  ],\n  "verdict": "One strong sentence about who this hotel is best for and why"\n}'
      }]
    })
  })

  const claudeData = await claudeRes.json()
  if (claudeData.error) return NextResponse.json({ error: claudeData.error.message }, { status: 500 })

  try {
    const content = claudeData.content[0].text.replace(/```json|```/g, '').trim()
    const enriched = JSON.parse(content)

    await supabase.from('hotels').update({
      description: enriched.description,
      amenities: enriched.amenities,
      best_for: enriched.best_for,
    }).eq('id', hotel_id)

    await supabase.from('hotel_content').upsert({
      hotel_id,
      verdict: enriched.verdict,
      faqs: enriched.faqs,
      best_for_extended: enriched.best_for,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'hotel_id' })

    return NextResponse.json({
      success: true,
      updates: {
        description: enriched.description,
        amenities: enriched.amenities,
        best_for: enriched.best_for,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 422 })
  }
}
