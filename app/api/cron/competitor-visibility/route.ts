import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const QUERIES_PER_REGION: Record<string, string[]> = {
  'Geneva': [
    'best luxury hotel Geneva Switzerland',
    'top 5 star hotel Geneva lake view',
    'best spa hotel Geneva',
    'most romantic hotel Geneva',
    'best business hotel Geneva Switzerland',
  ],
  'Zurich': [
    'best luxury hotel Zurich Switzerland',
    'top 5 star hotel Zurich',
    'best boutique hotel Zurich',
    'most luxurious hotel Zurich',
    'best hotel Zurich city centre',
  ],
  'Zermatt': [
    'best luxury hotel Zermatt Matterhorn view',
    'top ski hotel Zermatt Switzerland',
    'most romantic hotel Zermatt',
    'best 5 star hotel Zermatt',
    'best hotel Zermatt for honeymoon',
  ],
  'Interlaken': [
    'best luxury hotel Interlaken Switzerland',
    'top hotel Interlaken Jungfrau view',
    'best wellness hotel Interlaken',
    'most luxurious hotel Interlaken',
    'best 5 star hotel Interlaken',
  ],
  'Bern': [
    'best luxury hotel Bern Switzerland',
    'top hotel Bern city centre',
    'best 5 star hotel Bern',
    'most prestigious hotel Bern',
    'best business hotel Bern',
  ],
  'Crans-Montana': [
    'best ski hotel Crans-Montana Switzerland',
    'top luxury hotel Crans-Montana',
    'best hotel Crans-Montana Alps',
    'most luxurious hotel Crans-Montana',
    'best wellness hotel Crans-Montana',
  ],
  'Davos': [
    'best ski hotel Davos Switzerland',
    'top luxury hotel Davos',
    'best 5 star hotel Davos',
    'most prestigious hotel Davos',
    'best hotel Davos Parsenn',
  ],
  'Flims': [
    'best wellness hotel Flims Switzerland',
    'top luxury hotel Flims Laax',
    'best hotel Flims Alps',
    'most luxurious hotel Flims',
    'best spa hotel Flims Switzerland',
  ],
  'St. Moritz': [
    'best luxury hotel St Moritz Switzerland',
    'top ski hotel St Moritz Engadin',
    'best 5 star hotel St Moritz',
    'most exclusive hotel St Moritz',
    'best hotel St Moritz winter',
  ],
  'Gstaad': [
    'best luxury hotel Gstaad Switzerland',
    'top ski hotel Gstaad Alps',
    'most exclusive hotel Gstaad',
    'best 5 star hotel Gstaad',
    'best chalet hotel Gstaad',
  ],
  'Verbier': [
    'best luxury ski hotel Verbier Switzerland',
    'top hotel Verbier Alps',
    'best 5 star hotel Verbier',
    'most exclusive hotel Verbier',
    'best chalet hotel Verbier',
  ],
  'Andermatt': [
    'best luxury hotel Andermatt Switzerland',
    'top ski hotel Andermatt Alps',
    'best 5 star hotel Andermatt',
    'most exclusive hotel Andermatt',
  ],
  'Lucerne': [
    'best luxury hotel Lucerne Switzerland',
    'top hotel Lucerne lake view',
    'best 5 star hotel Lucerne',
    'most romantic hotel Lucerne',
    'best hotel Lucerne city',
  ],
  'Lugano': [
    'best luxury hotel Lugano Switzerland',
    'top hotel Lugano lake view',
    'best 5 star hotel Lugano',
    'most romantic hotel Lugano',
  ],
  'Ascona': [
    'best luxury hotel Ascona Switzerland',
    'top hotel Ascona Lake Maggiore',
    'best 5 star hotel Ascona Ticino',
    'most romantic hotel Ascona',
  ],
  'Montreux': [
    'best luxury hotel Montreux Switzerland',
    'top hotel Montreux Lake Geneva',
    'best 5 star hotel Montreux',
    'most romantic hotel Montreux Swiss Riviera',
  ],
  'Grindelwald': [
    'best luxury hotel Grindelwald Switzerland',
    'top ski hotel Grindelwald Jungfrau',
    'best 5 star hotel Grindelwald',
    'best hotel Grindelwald Eiger view',
  ],
  'Engelberg': [
    'best luxury hotel Engelberg Switzerland',
    'top ski hotel Engelberg Alps',
    'best 5 star hotel Engelberg',
  ],
  'Basel': [
    'best luxury hotel Basel Switzerland',
    'top 5 star hotel Basel',
    'best hotel Basel Art Basel',
  ],
  'Lausanne': [
    'best luxury hotel Lausanne Switzerland',
    'top hotel Lausanne Lake Geneva',
    'best 5 star hotel Lausanne',
    'most romantic hotel Lausanne',
  ],
}

async function queryPerplexity(query: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
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
      messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

const PLATFORMS = [
  { id: 'chatgpt', queryFn: queryChatGPT },
  { id: 'perplexity', queryFn: queryPerplexity },
  { id: 'claude', queryFn: queryClaude },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionParam = searchParams.get('region')
  const forceRun = searchParams.get('force') === 'true'

  // Check if enabled
  if (!forceRun) {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'competitor_visibility_enabled')
      .single()
    if (setting?.value !== 'true') {
      return NextResponse.json({ message: 'Competitor visibility cron is disabled' })
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7) // e.g. "2026-04"

  // Get competitors
  let query = supabase.from('competitor_hotels').select('*').eq('is_active', true)
  if (regionParam) query = query.eq('region', regionParam)
  const { data: competitors } = await query

  if (!competitors?.length) return NextResponse.json({ error: 'No competitors found' })

  // Group by region
  const regions = [...new Set(competitors.map((c: any) => c.region))]
  const results: any[] = []
  let estimatedCost = 0

  for (const region of regions) {
    const regionCompetitors = competitors.filter((c: any) => c.region === region)
    const queries = QUERIES_PER_REGION[region] || []
    if (!queries.length) continue

    // Also include partner hotels in same region for comparison
    const { data: partnerHotels } = await supabase
      .from('hotels')
      .select('id, name, region')
      .eq('region', region)
      .eq('is_partner', true)
      .eq('is_active', true)

    const allHotels = [
      ...regionCompetitors.map((c: any) => ({ id: c.id, name: c.name, isPartner: false })),
      ...(partnerHotels || []).map((h: any) => ({ id: h.id, name: h.name, isPartner: true })),
    ]

    // Run each query on each platform
    const responseCache: Record<string, string> = {}

    for (const platform of PLATFORMS) {
      for (const q of queries) {
        const cacheKey = `${platform.id}:${q}`
        try {
          if (!responseCache[cacheKey]) {
            responseCache[cacheKey] = await platform.queryFn(q)
            if (platform.id === 'chatgpt') estimatedCost += 0.002
            else estimatedCost += 0.001
            await new Promise(r => setTimeout(r, 300))
          }

          const responseText = responseCache[cacheKey]
          const responseLower = responseText.toLowerCase()

          // Check each hotel
          for (const hotel of allHotels) {
            const hotelNameLower = hotel.name.toLowerCase()
            const lastTwoWords = hotel.name.split(' ').slice(-2).join(' ').toLowerCase()
            const appeared = responseLower.includes(hotelNameLower) || responseLower.includes(lastTwoWords)
            if (appeared) {
              results.push({ hotel: hotel.name, platform: platform.id, query: q, region })
            }
          }
        } catch (err: any) {
          console.error(`Error querying ${platform.id}:`, err.message)
        }
      }

      // Save scores per hotel per platform
      for (const hotel of allHotels) {
        const hotelResults = results.filter(r => r.hotel === hotel.name && r.platform === platform.id && r.region === region)
        const appearances = hotelResults.length
        const score = queries.length > 0 ? Math.round((appearances / queries.length) * 100) : 0

        await supabase.from('competitor_visibility').upsert({
          competitor_id: hotel.isPartner ? null : hotel.id,
          competitor_name: hotel.name,
          region,
          platform: platform.id,
          visibility_score: score,
          appearances,
          total_queries: queries.length,
          month: currentMonth,
          checked_at: new Date().toISOString(),
        }, { onConflict: 'competitor_name,platform,month' })
      }
    }
  }

  // Log cost
  await supabase.from('cron_costs').insert({
    hotels_checked: competitors.length,
    queries_run: Object.keys(results).length,
    platforms_checked: PLATFORMS.length,
    estimated_cost_usd: estimatedCost,
    triggered_by: forceRun ? 'manual' : 'cron',
    run_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    regions_checked: regions.length,
    competitors_checked: competitors.length,
    total_appearances: results.length,
    estimated_cost_usd: Number(estimatedCost.toFixed(4)),
    month: currentMonth,
  })
}