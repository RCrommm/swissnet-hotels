import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

async function queryPerplexity(query: string): Promise<{ text: string; citations: string[] }> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: `${query}. Please list all relevant hotels by name.` }],
      max_tokens: 1000,
    }),
  })
  const data = await res.json()
  const citations = [
    ...(Array.isArray(data.citations) ? data.citations : []),
    ...((data.search_results || []).map((s: any) => s?.url).filter(Boolean)),
  ]
  return { text: data.choices?.[0]?.message?.content || '', citations }
}

async function queryChatGPT(query: string): Promise<{ text: string; citations: string[] }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-search-preview',
      messages: [{ role: 'user', content: `${query}. Please list all relevant hotels by name.` }],
      max_tokens: 500,
    }),
  })
  const data = await res.json()
  const annotations = data.choices?.[0]?.message?.annotations || []
  const citations = annotations
    .filter((a: any) => a?.type === 'url_citation' && a?.url_citation?.url)
    .map((a: any) => a.url_citation.url)
  return { text: data.choices?.[0]?.message?.content || '', citations }
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
  return rn.includes(nn) || rn.includes(lastTwo) || rn.includes(firstTwo) || (words.length >= 2 && rn.includes(keyWords))
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

async function saveCitations(rows: { query: string; platform: string; source_url: string; region: string | null }[], runDate: string) {
  try {
    const seen = new Set<string>()
    const deduped: any[] = []
    for (const r of rows) {
      if (!r.source_url) continue
      const key = `${r.query}|${r.platform}|${r.source_url}`
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push({
        query: r.query,
        platform: r.platform,
        source_url: r.source_url,
        source_domain: domainOf(r.source_url),
        region: r.region,
        run_date: runDate,
      })
    }
    if (deduped.length) {
      await supabase.from('ai_citations').upsert(deduped, {
        onConflict: 'query,platform,source_url,run_date',
        ignoreDuplicates: true,
      })
    }
  } catch (err: any) {
    console.error('saveCitations failed (non-fatal):', err?.message)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRun = searchParams.get('force') === 'true'
  const typeParam = searchParams.get('type')
  const categoryParam = searchParams.get('category')

  // Block unauthorized requests
  const authHeader = request.headers.get('authorization')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    // Check if already ran today
    const todayDate = new Date().toISOString().split('T')[0]
    const { data: alreadyRanCat } = await supabase
      .from('competitor_visibility')
      .select('id')
      .eq('region', regionFilter)
      .eq('category', categoryParam)
      .eq('run_date', todayDate)
      .limit(1)

    if (alreadyRanCat && alreadyRanCat.length > 0 && !forceRun) {
      return NextResponse.json({ message: `Already ran ${categoryParam} for ${regionFilter} on ${todayDate}. Pass ?force=true to override.` })
    }

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

        const citationRows: any[] = []
        for (const q of queries) {
          try {
            const { text, citations } = await platform.queryFn(q)
            responseCache[q] = text
            for (const url of citations) citationRows.push({ query: q, platform: platform.id, source_url: url, region: regionFilter })
            catCost += platform.id === 'chatgpt' ? 0.037 : 0.008
            await new Promise(r => setTimeout(r, 300))
          } catch (err: any) {
            console.error(`Error querying ${platform.id}:`, err.message)
            responseCache[q] = ''
          }
        }
        await saveCitations(citationRows, new Date().toISOString().split('T')[0])

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

        const today = new Date().toISOString().split('T')[0]
        const rowsWithDate = rows.map((r: any) => ({ ...r, run_date: today }))
        await supabase.from('competitor_visibility').upsert(rowsWithDate, {
          onConflict: 'competitor_name,platform,run_date,category',
          ignoreDuplicates: true
        })
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
const today = new Date().toISOString().split('T')[0]
const regionParam = searchParams.get('region')
const debugMode = searchParams.get('debug') === 'true'
const debugLog: any[] = []

const { data: alreadyRanRows } = await supabase
  .from('competitor_visibility')
  .select('id')
  .eq('region', regionParam || 'Geneva')
  .eq('run_date', today)
  .is('category', null)
  .limit(1)

if (alreadyRanRows && alreadyRanRows.length > 0 && !forceRun) {
  return NextResponse.json({ 
    message: `Already ran for ${regionParam || 'Geneva'} on ${today}. Pass ?force=true to override.` 
  })
}

const { data: regionQueriesData } = await supabase
    .from('region_queries')
    .select('region, query')
    .eq('is_active', true)

  const QUERIES_PER_REGION: Record<string, string[]> = {}
  for (const row of regionQueriesData || []) {
    if (!QUERIES_PER_REGION[row.region]) QUERIES_PER_REGION[row.region] = []
    QUERIES_PER_REGION[row.region].push(row.query)
  }

  
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

    const responseCache: Record<string, Record<string, string>> = {}

    await Promise.all(PLATFORMS.map(async (platform) => {
      responseCache[platform.id] = {}
      const citationRows: any[] = []
      for (const q of queries) {
        try {
          const { text, citations } = await platform.queryFn(q)
          responseCache[platform.id][q] = text
          for (const url of citations) citationRows.push({ query: q, platform: platform.id, source_url: url, region })
          estimatedCost += platform.id === 'chatgpt' ? 0.037 : 0.008
          await new Promise(r => setTimeout(r, 300))
        } catch (err: any) {
          console.error(`Error querying ${platform.id}:`, err.message)
          responseCache[platform.id][q] = ''
        }
      }
      await saveCitations(citationRows, new Date().toISOString().split('T')[0])

      for (const hotel of allHotels) {
        const appearances = queries.filter(q => checkAppeared(hotel.name, responseCache[platform.id][q] || '')).length
        const score = queries.length > 0 ? Math.round((appearances / queries.length) * 100) : 0
        if (appearances > 0) results.push({ hotel: hotel.name, platform: platform.id, region })
        const today = new Date().toISOString().split('T')[0]
        await supabase.from('competitor_visibility').upsert({
          competitor_name: hotel.name,
          region,
          category: null,
          platform: platform.id,
          visibility_score: score,
          appearances,
          total_queries: queries.length,
          month: currentMonth,
          run_date: today,
          checked_at: new Date().toISOString(),
        }, { onConflict: 'competitor_name,platform,run_date,category', ignoreDuplicates: true })
      }
    }))

    if (debugMode) {
      for (const q of queries) {
        debugLog.push({
          region,
          query: q,
          chatgpt_matched_la_reserve: checkAppeared('La Réserve Genève', responseCache['chatgpt']?.[q] || ''),
          chatgpt_response: (responseCache['chatgpt']?.[q] || '').slice(0, 300),
        })
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
    debug: debugMode ? debugLog : undefined,
  })
}