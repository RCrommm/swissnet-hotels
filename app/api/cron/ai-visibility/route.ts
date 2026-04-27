import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// Real queries people ask AI about Swiss luxury hotels
const AI_QUERIES = [
  'best luxury hotel in Zermatt with Matterhorn view',
  'best 5 star hotel in Geneva Switzerland',
  'most romantic hotel in Zermatt Switzerland',
  'best luxury ski hotel Switzerland',
  'best spa hotel in Interlaken Switzerland',
  'top luxury hotels in Zurich Switzerland',
  'best hotel in Zermatt for honeymoon',
  'luxury wellness hotel Switzerland Alps',
  'best 5 star hotel St Moritz Switzerland',
  'top rated luxury hotels Geneva lake view',
  'best alpine luxury hotel Switzerland',
  'finest hotels in Swiss Alps',
  'best hotel Zermatt ski in ski out',
  'luxury hotel Interlaken Jungfrau view',
  'best boutique luxury hotel Switzerland',
]

export async function GET(request: Request) {
  // Verify this is called from Vercel cron or manually
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all active hotels
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('is_active', true)

  if (!hotels?.length) return NextResponse.json({ error: 'No hotels found' })

  const results = []
  let totalAppearances = 0

  for (const query of AI_QUERIES) {
    try {
      // Ask Claude the query
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `${query}. Please recommend 3-5 specific hotels by name.`
        }]
      })

      const responseText = message.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join(' ')

      // Check which hotels appear in the response
      for (const hotel of hotels) {
        const hotelNameLower = hotel.name.toLowerCase()
        const responseLower = responseText.toLowerCase()

        // Check for hotel name or common abbreviations
        const appeared = responseLower.includes(hotelNameLower) ||
          responseLower.includes(hotelNameLower.split(' ').slice(-2).join(' '))

        // Extract snippet if appeared
        let snippet = null
        if (appeared) {
          const idx = responseLower.indexOf(hotelNameLower.split(' ').slice(-2).join(' '))
          snippet = responseText.substring(Math.max(0, idx - 50), idx + 150).trim()
          totalAppearances++
        }

        // Log to database
        await supabase.from('ai_visibility_scores').insert({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          query,
          appeared,
          response_snippet: snippet,
          checked_at: new Date().toISOString(),
        })

        results.push({
          hotel: hotel.name,
          query,
          appeared,
          snippet,
        })
      }

      // Small delay between queries to avoid rate limiting
      await new Promise(r => setTimeout(r, 500))

    } catch (err: any) {
      console.error('Query failed:', query, err.message)
    }
  }

  return NextResponse.json({
    success: true,
    queries_run: AI_QUERIES.length,
    hotels_checked: hotels.length,
    total_appearances: totalAppearances,
    results,
  })
}