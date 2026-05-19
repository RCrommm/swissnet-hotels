import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

const { data: regionQueriesData } = await supabase
  .from('region_queries')
  .select('region, query')
  .eq('is_active', true)

const QUERIES_PER_REGION: Record<string, string[]> = {}
for (const row of regionQueriesData || []) {
  if (!QUERIES_PER_REGION[row.region]) QUERIES_PER_REGION[row.region] = []
  QUERIES_PER_REGION[row.region].push(row.query)
}

async function queryPerplexity(query: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar-pro',
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

const PLATFORMS = [
  { id: 'chatgpt', queryFn: queryChatGPT },
  { id: 'perplexity', queryFn: queryPerplexity },
]

const CATEGORY_HOTELS: Record<string, string[]> = {
  spa: ['Bürgenstock Resort', 'The Dolder Grand', 'Six Senses Crans-Montana', 'Grand Resort Bad Ragaz', 'The Chedi Andermatt', 'Clinique La Prairie', 'La Réserve Genève', 'Le Grand Bellevue Gstaad', 'Suvretta House', 'Victoria-Jungfrau Grand Hotel Interlaken', 'Hotel Adula', 'Crans Ambassador', 'Alpengold Hotel', 'Mont Cervin Palace', 'Schweizerhof Zermatt'],
  ski: ["Badrutt's Palace Hotel", 'The Chedi Andermatt', 'The Alpina Gstaad', 'Kulm Hotel St. Moritz', 'Mont Cervin Palace', 'Suvretta House', 'Grand Hotel Kronenhof Pontresina', 'Palace Hotel Gstaad', 'Kempinski Grand Hotel des Bains St. Moritz', 'Crans Ambassador', 'Alpengold Hotel', 'Schweizerhof Zermatt', 'Monte Rosa Zermatt'],
  dining: ['Grand Resort Bad Ragaz', 'Les Trois Rois Basel', 'The Chedi Andermatt', 'Giardino Mountain St. Moritz', 'Carlton Hotel St. Moritz', 'Baur au Lac', 'La Réserve Genève', 'Victoria-Jungfrau Grand Hotel Interlaken', 'Beau-Rivage Palace Lausanne', 'Mont Cervin Palace', 'Bellevue Palace'],
  business: ['Baur au Lac', 'Four Seasons Hotel des Bergues Geneva', 'The Dolder Grand', 'Mandarin Oriental Geneva', 'Widder Hotel', 'La Réserve Genève', 'Park Hyatt Zurich', 'Bellevue Palace', 'La Réserve Eden au Lac Zurich', 'Alpengold Hotel'],
  romantic: ['The Alpina Gstaad', "Badrutt's Palace Hotel", 'La Réserve Genève', 'Mont Cervin Palace', 'Eden Roc Ascona', 'Castello del Sole', 'Beau-Rivage Palace Lausanne', 'Victoria-Jungfrau Grand Hotel Interlaken', 'The Chedi Andermatt', 'Schweizerhof Zermatt', 'Monte Rosa Zermatt', 'La Réserve Eden au Lac Zurich'],
  lake: ['Bürgenstock Resort', 'La Réserve Genève', 'Beau-Rivage Palace Lausanne', 'La Réserve Eden au Lac Zurich', 'Fairmont Le Montreux Palace', 'Eden Roc Ascona', 'Castello del Sole', 'Grand Hotel Villa Castagnola Lugano', 'Grand Hotel Vitznauerhof Lucerne', 'Beau-Rivage Geneva'],
}

function checkAppeared(hotelName: string, responseText: string): boolean {
  const r = responseText.toLowerCase()
  const n = hotelName.toLowerCase()
  const words = n.split(' ').filter((w: string) => !['hotel','the','le','la','les','grand','de','du','au','aux','by','at','and','&'].includes(w))
  const lastTwo = hotelName.split(' ').slice(-2).join(' ').toLowerCase()
  const firstTwo = hotelName.split(' ').slice(0, 2).join(' ').toLowerCase()
  const keyWords = words.slice(0, 3).join(' ')
  return r.includes(n) || r.includes(lastTwo) || r.includes(firstTwo) || (words.length >= 2 && r.includes(keyWords))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionParam = searchParams.get('region')
  const forceRun = searchParams.get('force') === 'true'
  const typeParam = searchParams.get('type')
  const categoryParam = searchParams.get('category')

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

  const currentMonth = new Date().toISOString().slice(0, 7)

  // ── CATEGORY MODE ──
  if (typeParam === 'category') {
    let catQuery = supabase.from('category_queries').select('*').eq('is_active', true)
    if (categoryParam) catQuery = catQuery.eq('category', categoryParam)
    const { data: categoryQueries } = await catQuery
    if (!categoryQueries?.length) return NextResponse.json({ error: 'No category queries found' })

    const categoriesMap: Record<string, string[]> = {}
    for (const q of categoryQueries) {
      if (!categoriesMap[q.category]) categoriesMap[q.category] = []
      categoriesMap[q.category].push(q.query)
    }

    let catCost = 0
    let totalAppearances = 0

    for (const [category, queries] of Object.entries(categoriesMap)) {
      const hotels = CATEGORY_HOTELS[category] || []
      if (!hotels.length) continue

      const { data: partnerHotels } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('is_partner', true)
        .in('name', hotels)

      const partnerMap: Record<string, string> = {}
      for (const p of partnerHotels || []) partnerMap[p.name] = p.id

      for (const platform of PLATFORMS) {
        // Fetch all responses first
        const responseCache: Record<string, string> = {}
        for (const q of queries) {
          try {
            responseCache[q] = await platform.queryFn(q)
            catCost += platform.id === 'chatgpt' ? 0.002 : 0.001
            await new Promise(r => setTimeout(r, 300))
          } catch (err: any) {
            console.error(`Error querying ${platform.id}:`, err.message)
            responseCache[q] = ''
          }
        }

        // Score all hotels and collect rows
        const rows: any[] = []
        for (const hotelName of hotels) {
          const appearances = queries.filter(q => responseCache[q] && checkAppeared(hotelName, responseCache[q])).length
          const score = queries.length > 0 ? Math.round((appearances / queries.length) * 100) : 0
          if (appearances > 0) totalAppearances++

          rows.push({
            competitor_id: partnerMap[hotelName] || null,
            competitor_name: hotelName,
            region: 'Switzerland',
            category,
            platform: platform.id,
            visibility_score: score,
            appearances,
            total_queries: queries.length,
            month: currentMonth,
            checked_at: new Date().toISOString(),
          })
        }

        // Delete old rows for this category+platform+month, then insert fresh
        await supabase.from('competitor_visibility')
  .delete()
  .eq('category', category)
  .eq('platform', platform.id)
  .eq('month', currentMonth)

await supabase.from('competitor_visibility').insert(rows)
      }
    }

    await supabase.from('cron_costs').insert({
      hotels_checked: Object.values(CATEGORY_HOTELS).flat().length,
      queries_run: Object.values(categoriesMap).flat().length * PLATFORMS.length,
      platforms_checked: PLATFORMS.length,
      estimated_cost_usd: catCost,
      triggered_by: forceRun ? 'manual' : 'cron',
      run_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      categories_checked: Object.keys(categoriesMap).length,
      total_appearances: totalAppearances,
      estimated_cost_usd: Number(catCost.toFixed(4)),
      month: currentMonth,
    })
  }
  // ── END CATEGORY MODE ──

  // ── REGION MODE ──
  let query = supabase.from('competitor_hotels').select('*').eq('is_active', true)
  if (regionParam) query = query.eq('region', regionParam)
  const { data: competitors } = await query

  if (!competitors?.length) return NextResponse.json({ error: 'No competitors found' })

  const regions = [...new Set(competitors.map((c: any) => c.region))]
  const results: any[] = []
  let estimatedCost = 0

  for (const region of regions) {
    const regionCompetitors = competitors.filter((c: any) => c.region === region)
    const queries = QUERIES_PER_REGION[region] || []
    if (!queries.length) continue

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

          for (const hotel of allHotels) {
            const hotelNameLower = hotel.name.toLowerCase()
            const words = hotelNameLower.split(' ').filter((w: string) => !['hotel','the','le','la','les','grand','de','du','au','aux','by','at','and','&'].includes(w))
            const lastTwoWords = hotel.name.split(' ').slice(-2).join(' ').toLowerCase()
            const firstTwoWords = hotel.name.split(' ').slice(0, 2).join(' ').toLowerCase()
            const keyWords = words.slice(0, 3).join(' ')
            const appeared = responseLower.includes(hotelNameLower) ||
              responseLower.includes(lastTwoWords) ||
              responseLower.includes(firstTwoWords) ||
              (words.length >= 2 && responseLower.includes(keyWords))

            if (appeared) {
              results.push({ hotel: hotel.name, platform: platform.id, query: q, region })
            }
          }
        } catch (err: any) {
          console.error(`Error querying ${platform.id}:`, err.message)
        }
      }

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

  await supabase.from('cron_costs').insert({
    hotels_checked: competitors.length,
    queries_run: results.length,
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