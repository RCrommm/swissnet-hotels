import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const DEFAULT_QUERIES = [
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
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const hotelIdParam = searchParams.get('hotel_id')

  // Check if cron is enabled (skip for manual per-hotel runs)
  if (!hotelIdParam) {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ai_visibility_cron_enabled')
      .single()
    if (setting?.value !== 'true') {
      return NextResponse.json({ message: 'AI visibility cron is disabled' })
    }
  }

  // Get hotels to check
  let hotelsQuery = supabase.from('hotels').select('id, name, region').eq('is_active', true).eq('is_partner', true)
  if (hotelIdParam) hotelsQuery = hotelsQuery.eq('id', hotelIdParam)
  const { data: hotels, error: hotelsError } = await hotelsQuery

  if (hotelsError) return NextResponse.json({ error: hotelsError.message })
  if (!hotels?.length) return NextResponse.json({ error: 'No partner hotels found' })

  const results: any[] = []
  const errors: any[] = []
  let totalAppearances = 0

  for (const hotel of hotels) {
    // Get custom queries for this hotel, fallback to defaults
    const { data: customQueries } = await supabase
      .from('ai_visibility_queries')
      .select('query')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)

    const queriesToRun = customQueries?.length
      ? customQueries.map(q => q.query)
      : DEFAULT_QUERIES

    for (const query of queriesToRun) {
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

        const hotelNameLower = hotel.name.toLowerCase()
        const responseLower = responseText.toLowerCase()
        const lastTwoWords = hotel.name.split(' ').slice(-2).join(' ').toLowerCase()
        const appeared: boolean =
          responseLower.includes(hotelNameLower) ||
          responseLower.includes(lastTwoWords)

        let snippet: string | null = null
        if (appeared) {
          const matchTerm = responseLower.includes(hotelNameLower) ? hotelNameLower : lastTwoWords
          const idx = responseLower.indexOf(matchTerm)
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
        results.push({ hotel: hotel.name, query, appeared })

        await new Promise(r => setTimeout(r, 400))

      } catch (err: any) {
        errors.push({ query, hotel: hotel.name, error: err.message })
      }
    }
  }

  return NextResponse.json({
    success: true,
    queries_run: results.length,
    hotels_checked: hotels.length,
    total_appearances: totalAppearances,
    insert_errors: errors.length ? errors : undefined,
    sample_results: results.filter(r => r.appeared).slice(0, 5),
  })
}