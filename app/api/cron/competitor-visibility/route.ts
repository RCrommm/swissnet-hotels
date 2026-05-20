import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

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
      model: 'gpt-4o-search-preview',
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

function checkAppeared(hotelName: string, responseText: string): boolean {
  const r = responseText.toLowerCase().replace(/[*#_`\[\]]/g, ' ')
  const n = hotelName.toLowerCase()
  const noAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const rn = noAccents(r)
  const nn = noAccents(n)
  const words = nn.split(' ').filter((w: string) => !['hotel','the','le','la','les','grand','de','du','au','aux','by','at','and','&'].includes(w))
  const lastTwo = noAccents(hotelName.split(' ').slice(-2).join(' ').toLowerCase())
  const firstTwo = noAccents(hotelName.split(' ').slice(0, 2).join(' ').toLowerCase())
  const keyWords = words.slice(0, 3).join(' ')
  return rn.includes(nn) || rn.includes(lastTwo) || rn.includes(firstTwo) || (words.length >= 2 && rn.includes(keyWords)) || r.includes('réserve') || r.includes('reserve')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
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
    const regionFilter = searchParams.get('region') || 'Geneva'

    let catQuery = supabase.from('category_queries').select('*').eq('is_active', true)
    if (categoryParam) catQuery = catQuery.eq('category', categoryParam)
    const { data: categoryQueries } = await catQuery

    if (!categoryQueries?.length) {
      return NextResponse.json({ error: 'No category queries found' })
    }

    // Get all active hotels in the region
    const { data: regionHotels } = await supabase
      .from('hotels')
      .select('id, name, region')
      .eq('is_active', true)
      .eq('region', regionFilter)

    if (!regionHotels?.length) {
      return NextResponse.json({ error: `No hotels found in region: ${regionFilter}` })
    }

    const hotelNames = regionHotels.map((h: any) => h.name)

    const categoriesMap: Record<string, string[]> = {}
    for (const q of categoryQueries) {
      if (!categoriesMap[q.category]) categoriesMap[q.category] = []
      // Append region to make queries region-specific
      categoriesMap[q.category].push(`${q.query} ${regionFilter}`)
    }

    let catCost = 0
    let totalAppearances = 0
    const results: any[] = []

    for (const [category, queries] of Object.entries(categoriesMap)) {
      for (const platform of PLATFORMS) {
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

        const rows: any[] = []
        for (const hotel of regionHotels) {
          const appearances = queries.filter(q => responseCache[q] && checkAppeared(hotel.name, responseCache[q])).length
          const score = queries.length > 0 ? Math.round((appearances / queries.length) * 100) : 0
          if (appearances > 0) totalAppearances++

          rows.push({
            competitor_name: hotel.name,
            region: regionFilter,
            category,
            platform: platform.id,
            visibility_score: score,
            appearances,
            total_queries: queries.length,
            month: currentMonth,
            checked_at: new Date().toISOString(),
          })

          if (appearances > 0) {
            results.push({ hotel: hotel.name, platform: platform.id, category, score })
          }
        }

        await supabase
          .from('competitor_visibility')
          .delete()
          .eq('category', category)
          .eq('platform', platform.id)
          .eq('month', currentMonth)
          .eq('region', regionFilter)

        await supabase.from('competitor_visibility').insert(rows)
      }
    }

    await supabase.from('cron_costs').insert({
      hotels_checked: regionHotels.length,
      queries_run: Object.values(categoriesMap).flat().length * PLATFORMS.length,
      platforms_checked: PLATFORMS.length,
      estimated_cost_usd: catCost,
      triggered_by: forceRun ? 'manual' : 'cron',
      run_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      region: regionFilter,
      hotels_checked: regionHotels.length,
      categories_checked: Object.keys(categoriesMap).length,
      total_appearances: totalAppearances,
      estimated_cost_usd: Number(catCost.toFixed(4)),
      month: currentMonth,
      results,
    })
  }

  // ── REGION MODE ──
  const { data: regionQueriesData } = await supabase
    .from('region_queries')
    .select('region, query')
    .eq('is_active', true)

  const QUERIES_PER_REGION: Record<string, string[]> = {}
  for (const row of regionQueriesData || []) {
    if (!QUERIES_PER_REGION[row.region]) QUERIES_PER_REGION[row.region] = []
    QUERIES_PER_REGION[row.region].push(row.query)
  }

  const regionParam = searchParams.get('region')
  let query = supabase.from('competitor_hotels').select('*').eq('is_active', true)
  if (regionParam) query = query.eq('region', regionParam)
  const { data: competitors } = await query

  if (!competitors?.length) {
    return NextResponse.json({ error: 'No competitors found' })
  }

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
        if (!responseCache[cacheKey]) {
          try {
            responseCache[cacheKey] = await platform.queryFn(q)
            estimatedCost += platform.id === 'chatgpt' ? 0.002 : 0.001
            await new Promise(r => setTimeout(r, 300))
          } catch (err: any) {
            console.error(`Error querying ${platform.id}:`, err.message)
            responseCache[cacheKey] = ''
          }
        }
      }

      for (const hotel of allHotels) {
        const appearances = queries.filter(q => {
          const text = responseCache[`${platform.id}:${q}`] || ''
          return checkAppeared(hotel.name, text)
        }).length

        const score = queries.length > 0 ? Math.round((appearances / queries.length) * 100) : 0

        if (appearances > 0) {
          results.push({ hotel: hotel.name, platform: platform.id, region })
        }

        await supabase.from('competitor_visibility').upsert({
          competitor_name: hotel.name,
          region,
          category: null,
          platform: platform.id,
          visibility_score: score,
          appearances,
          total_queries: queries.length,
          month: currentMonth,
          checked_at: new Date().toISOString(),
        }, { onConflict: 'competitor_name,platform,month,category' })
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