import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

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

export async function GET() {
  const { data: hotels, error: hotelsError } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('is_active', true)

  if (hotelsError) return NextResponse.json({ error: hotelsError.message })
  if (!hotels?.length) return NextResponse.json({ error: 'No hotels found' })

  const results: any[] = []
  const errors: any[] = []
  let totalAppearances = 0

  for (const query of AI_QUERIES) {
    try {
      const message = await client.messages.create({
        model: 'claude-opus-4-5',
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

      for (const hotel of hotels) {
        const hotelNameLower = hotel.name.toLowerCase()
        const responseLower = responseText.toLowerCase()
        const nameParts: string[] = hotelNameLower.split(' ').filter((w: string) => w.length > 3)
        const appeared: boolean = nameParts.some((part: string) => responseLower.includes(part)) ||
          responseLower.includes(hotelNameLower)

        let snippet: string | null = null
        if (appeared) {
          const searchTerm: string = nameParts.find((part: string) => responseLower.includes(part)) || hotelNameLower
          const idx = responseLower.indexOf(searchTerm)
          snippet = responseText.substring(Math.max(0, idx - 50), idx + 150).trim()
          totalAppearances++
        }

        const { error: insertError } = await supabase.from('ai_visibility_scores').insert({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          query,
          appeared,
          response_snippet: snippet,
          checked_at: new Date().toISOString(),
        })

        if (insertError) errors.push({ hotel: hotel.name, error: insertError.message })
        results.push({ hotel: hotel.name, query, appeared, snippet })
      }

      await new Promise(r => setTimeout(r, 500))

    } catch (err: any) {
      errors.push({ query, error: err.message })
    }
  }

  return NextResponse.json({
    success: true,
    queries_run: AI_QUERIES.length,
    hotels_checked: hotels.length,
    total_appearances: totalAppearances,
    insert_errors: errors,
    sample_results: results.filter(r => r.appeared).slice(0, 10),
  })
}