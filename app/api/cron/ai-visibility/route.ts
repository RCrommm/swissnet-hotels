import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

async function queryPerplexity(query: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
      max_tokens: 500,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function queryChatGPT(query: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
      max_tokens: 500,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function queryClaude(query: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: 'You are a helpful travel assistant. Answer questions about hotels by recommending specific properties by name.',
      messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}


const PLATFORMS = [
  { id: 'claude', name: 'Claude AI', queryFn: queryClaude },
  { id: 'chatgpt', name: 'ChatGPT', queryFn: queryChatGPT },
  { id: 'perplexity', name: 'Perplexity', queryFn: queryPerplexity },

]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const hotelIdParam = searchParams.get('hotel_id')
  const platformParam = searchParams.get('platform')

  // Check if cron is enabled (skip for manual runs)
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

  // Get hotels
  let hotelsQuery = supabase.from('hotels').select('id, name, region').eq('is_active', true).eq('is_partner', true)
  if (hotelIdParam) hotelsQuery = hotelsQuery.eq('id', hotelIdParam)
  const { data: hotels, error: hotelsError } = await hotelsQuery
  if (hotelsError) return NextResponse.json({ error: hotelsError.message })
  if (!hotels?.length) return NextResponse.json({ error: 'No partner hotels found' })

  const platformsToRun = platformParam
    ? PLATFORMS.filter(p => p.id === platformParam)
    : PLATFORMS

  const results: any[] = []
  const errors: any[] = []
  let totalAppearances = 0
  let estimatedCost = 0

  for (const hotel of hotels) {
    const { data: customQueries } = await supabase
      .from('ai_visibility_queries')
      .select('query')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)

    if (!customQueries?.length) continue
const queriesToRun = customQueries.map(q => q.query)

    for (const platform of platformsToRun) {
      for (const query of queriesToRun) {
        try {
          const responseText = await platform.queryFn(query)

          // Cost estimates
          if (platform.id === 'chatgpt') estimatedCost += 0.002
          else if (platform.id === 'perplexity') estimatedCost += 0.001
          else estimatedCost += 0.001

          const hotelNameLower = hotel.name.toLowerCase()
const responseLower = responseText.toLowerCase()
const noAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const words = hotelNameLower.split(' ').filter((w: string) => !['hotel', 'the', 'le', 'la', 'les', 'grand', 'de', 'du', 'au', 'aux', 'by', 'at', 'and', '&'].includes(w))
const lastTwo = hotel.name.split(' ').slice(-2).join(' ').toLowerCase()
const firstTwo = hotel.name.split(' ').slice(0, 2).join(' ').toLowerCase()
const keyWords = words.slice(0, 3).join(' ')
const shortName = words.slice(0, 2).join(' ')
const coreNameVariants = [
  'la réserve genève', 'la reserve geneve', 'la réserve geneva', 'la reserve geneva',
  'mont cervin', 'monte rosa zermatt', 'schweizerhof zermatt',
  'bellevue palace', 'alpengold', 'crans ambassador', 'hotel adula', 'adula hotel',
  'victoria-jungfrau', 'victoria jungfrau',
  'la réserve eden', 'la reserve eden', 'eden au lac', 'réserve eden au lac', 'reserve eden au lac',
]
const coreMatch = coreNameVariants.some(v => responseLower.includes(v))
const appeared = coreMatch ||
  responseLower.includes(hotelNameLower) ||
  responseLower.includes(noAccents(hotelNameLower)) ||
  responseLower.includes(lastTwo) ||
  responseLower.includes(noAccents(lastTwo)) ||
  responseLower.includes(firstTwo) ||
  responseLower.includes(noAccents(firstTwo)) ||
  responseLower.includes(keyWords) ||
  responseLower.includes(noAccents(keyWords)) ||
  responseLower.includes(shortName) ||
  responseLower.includes(noAccents(shortName))

          let snippet: string | null = null
          if (appeared) {
const matchTerm = responseLower.includes(hotelNameLower) ? hotelNameLower : lastTwo
            const idx = responseLower.indexOf(matchTerm)
            snippet = responseText.substring(Math.max(0, idx - 50), idx + 150).trim()
            totalAppearances++
          }

          await supabase.from('ai_visibility_scores').insert({
            hotel_id: hotel.id,
            hotel_name: hotel.name,
            query,
            appeared,
            platform: platform.id,
            response_snippet: snippet,
            checked_at: new Date().toISOString(),
          })

          results.push({ hotel: hotel.name, query, platform: platform.id, appeared })
          await new Promise(r => setTimeout(r, 100))

        } catch (err: any) {
  console.error(`[ERROR] ${platform.id} | ${query} | ${err.message}`)
  errors.push({ query, hotel: hotel.name, platform: platform.id, error: err.message })
}
      }
    }
  }

  // Log cost
  await supabase.from('cron_costs').insert({
    hotels_checked: hotels.length,
    queries_run: results.length,
    platforms_checked: platformsToRun.length,
    estimated_cost_usd: estimatedCost,
    triggered_by: hotelIdParam ? 'manual' : 'cron',
    run_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    queries_run: results.length,
    hotels_checked: hotels.length,
    platforms_checked: platformsToRun.length,
    total_appearances: totalAppearances,
    estimated_cost_usd: Number(estimatedCost.toFixed(4)),
    errors: errors.length ? errors : undefined,
    results: results.filter(r => r.appeared).slice(0, 10),
  })
}