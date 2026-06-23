// scripts/run-visibility.mjs
// Standalone daily ChatGPT + Perplexity visibility engine for GitHub Actions.
// Ported from app/api/cron/competitor-visibility/route.ts  (REGION mode).
// Writes: competitor_visibility, query_appearances, ai_citations, cron_costs.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const REGION = process.env.REGION || 'Geneva'
const QUERY_CONCURRENCY = Number(process.env.QUERY_CONCURRENCY || 4)
const QUERY_TIMEOUT_MS = Number(process.env.QUERY_TIMEOUT_MS || 40000)
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3)

for (const [k, v] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PERPLEXITY_API_KEY,
  OPENAI_API_KEY,
})) {
  if (!v) { console.error(`FATAL: missing env var ${k}`); process.exit(1) }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const today = () => new Date().toISOString().split('T')[0]
const currentMonth = new Date().toISOString().slice(0, 7)

async function withRetry(fn, label = 'request') {
  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try { return await fn() }
    catch (e) {
      lastError = e
      const retryable = e?.status === 429 || (e?.status >= 500 && e?.status < 600)
      if (!retryable || attempt === MAX_RETRIES) throw e
      const backoff = Math.pow(2, attempt) * 1000
      console.warn(`[${label}] attempt ${attempt} failed (${e.status}), retry in ${backoff}ms`)
      await sleep(backoff)
    }
  }
  throw lastError
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)
  try { return await fetch(url, { ...options, signal: controller.signal }) }
  finally { clearTimeout(timer) }
}

async function queryPerplexity(query) {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PERPLEXITY_API_KEY}` },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: `${query}. Please list all relevant hotels by name.` }],
        max_tokens: 1000,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[PERPLEXITY ERROR] status=${res.status} body=${body.slice(0, 200)}`)
      const err = new Error(`Perplexity HTTP ${res.status}`); err.status = res.status; throw err
    }
    const data = await res.json()
    const citations = [
      ...(Array.isArray(data.citations) ? data.citations : []),
      ...((data.search_results || []).map((s) => s?.url).filter(Boolean)),
    ]
    return { text: data.choices?.[0]?.message?.content || '', citations }
  }, 'PERPLEXITY')
}

async function queryChatGPT(query) {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: `${query}. Search the web and list all relevant hotels by name.`,
        tools: [{ type: 'web_search_preview' }],
        tool_choice: { type: 'web_search_preview' },
        include: ['web_search_call.action.sources'],
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[CHATGPT ERROR] status=${res.status} body=${body.slice(0, 200)}`)
      const err = new Error(`ChatGPT HTTP ${res.status}`); err.status = res.status; throw err
    }
    const data = await res.json()
    let text = ''
    const cited = [], consulted = []
    for (const item of data.output || []) {
      if (item.type === 'message') {
        for (const c of item.content || []) {
          if (typeof c.text === 'string') text += c.text
          for (const a of c.annotations || []) {
            if (a.type === 'url_citation' && a.url) cited.push(a.url)
          }
        }
      }
      if (item.type === 'web_search_call') {
        for (const s of item.action?.sources || []) {
          const url = typeof s === 'string' ? s : s?.url
          if (url) consulted.push(url)
        }
      }
    }
    const citations = cited.length ? cited : consulted
    return { text, citations: [...new Set(citations)] }
  }, 'CHATGPT')
}

const PLATFORMS = [
  { id: 'chatgpt', queryFn: queryChatGPT, cost: 0.037 },
  { id: 'perplexity', queryFn: queryPerplexity, cost: 0.008 },
]

function checkAppeared(hotelName, responseText) {
  const r = responseText.toLowerCase().replace(/[*#_`\[\]\-–—]/g, ' ').replace(/\s+/g, ' ')
  const n = hotelName.toLowerCase().replace(/[-–—]/g, ' ').replace(/\s+/g, ' ')
  const noAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const rn = noAccents(r)
  const nn = noAccents(n)
  const CITIES = ['geneva','zurich','zermatt','lausanne','interlaken','gstaad','andermatt','lucerne','lugano','montreux','ascona','basel','bern','crans','montana','stmoritz','st moritz','pontresina','vitznau']
  const words = nn.split(' ').filter((w) => !['hotel','the','le','la','les','grand','de','du','au','aux','by','at','and','&'].includes(w))
  const nameWords = nn.split(' ').filter(Boolean)
  const coreWords = nameWords.filter((w) => !CITIES.includes(w))
  const core = coreWords.join(' ')
  const lastTwo = noAccents(hotelName.split(' ').slice(-2).join(' ').toLowerCase())
  const firstTwo = noAccents(hotelName.split(' ').slice(0, 2).join(' ').toLowerCase())
  const keyWords = words.slice(0, 3).join(' ')
  const coreDistinct = coreWords.length >= 2 || (coreWords.length === 1 && coreWords[0].length >= 6)
  return rn.includes(nn)
    || (coreDistinct && rn.includes(core))
    || rn.includes(lastTwo)
    || rn.includes(firstTwo)
    || (words.length >= 2 && rn.includes(keyWords))
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

async function saveCitations(rows, runDate) {
  try {
    const JUNK = ['google.com/maps', 'google.com/search', 'bing.com/search', 'duckduckgo.com']
    const seen = new Set(); const deduped = []
    for (const r of rows) {
      if (!r.source_url) continue
      if (JUNK.some((h) => r.source_url.includes(h))) continue
      const key = `${r.query}|${r.platform}|${r.source_url}`
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push({
        query: r.query, platform: r.platform, source_url: r.source_url,
        source_domain: domainOf(r.source_url), region: r.region, run_date: runDate,
      })
    }
    if (deduped.length) {
      await supabase.from('ai_citations').upsert(deduped, {
        onConflict: 'query,platform,source_url,run_date', ignoreDuplicates: true,
      })
    }
  } catch (err) { console.error('saveCitations failed (non-fatal):', err?.message) }
}

async function mapPool(items, concurrency, worker) {
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) { const idx = i++; await worker(items[idx]) }
    })
  )
}

const stats = { queries: 0, errors: 0, cost: 0, appearances: 0 }

async function main() {
  const startedAt = Date.now()
  const runDate = today()

  const { data: regionQueriesData } = await supabase
    .from('region_queries').select('query').eq('region', REGION).eq('is_active', true)
  const queries = (regionQueriesData || []).map((q) => q.query)
  if (!queries.length) { console.error(`No active region_queries for ${REGION}`); process.exit(1) }

  const { data: competitors } = await supabase
    .from('competitor_hotels').select('id, name, region').eq('is_active', true).eq('region', REGION)
  const { data: partnerHotels } = await supabase
    .from('hotels').select('id, name, region').eq('region', REGION).eq('is_partner', true).eq('is_active', true)

  const allHotels = [
    ...(competitors || []).map((c) => ({ id: c.id, name: c.name, isPartner: false })),
    ...(partnerHotels || []).map((h) => ({ id: h.id, name: h.name, isPartner: true })),
  ]
  if (!allHotels.length) { console.error(`No hotels for region ${REGION}`); process.exit(1) }

  console.log(`Region ${REGION}: ${queries.length} queries x ${PLATFORMS.length} platforms, ${allHotels.length} hotels`)

  await Promise.all(PLATFORMS.map(async (platform) => {
    const responseCache = {}
    const citationRows = []

    await mapPool(queries, QUERY_CONCURRENCY, async (q) => {
      try {
        const { text, citations } = await platform.queryFn(q)
        responseCache[q] = text
        for (const url of citations) citationRows.push({ query: q, platform: platform.id, source_url: url, region: REGION })
        stats.cost += platform.cost
        stats.queries++
      } catch (e) {
        stats.errors++
        responseCache[q] = ''
        console.error(`[QUERY FAIL] ${platform.id} "${q}": ${e?.message}`)
      }
    })

    await saveCitations(citationRows, runDate)

    const appearanceRows = []
    for (const hotel of allHotels) {
      const perQuery = queries.map((q) => ({ query: q, appeared: checkAppeared(hotel.name, responseCache[q] || '') }))
      const appearances = perQuery.filter((p) => p.appeared).length
      const score = queries.length ? Math.round((appearances / queries.length) * 100) : 0
      if (appearances > 0) stats.appearances++

      await supabase.from('competitor_visibility').upsert({
        competitor_name: hotel.name, region: REGION, category: null, platform: platform.id,
        visibility_score: score, appearances, total_queries: queries.length,
        month: currentMonth, run_date: runDate, checked_at: new Date().toISOString(),
      }, { onConflict: 'competitor_name,platform,run_date,category', ignoreDuplicates: true })

      if (hotel.isPartner) {
        const nowIso = new Date().toISOString()
        for (const p of perQuery) {
          appearanceRows.push({
            hotel_id: hotel.id, hotel_name: hotel.name, query: p.query, platform: platform.id,
            region: REGION, category: 'general', appeared: p.appeared, run_date: runDate, checked_at: nowIso,
          })
        }
      }
    }

    if (appearanceRows.length) {
      await supabase.from('query_appearances').upsert(appearanceRows, {
        onConflict: 'hotel_name,query,platform,run_date,category', ignoreDuplicates: false,
      })
    }
    console.log(`[${platform.id}] done — ${queries.length} queries, ${allHotels.length} hotels scored`)
  }))

  await supabase.from('cron_costs').insert({
    hotels_checked: allHotels.length,
    queries_run: stats.queries,
    platforms_checked: PLATFORMS.length,
    estimated_cost_usd: Number(stats.cost.toFixed(4)),
    triggered_by: 'github_actions',
    run_at: new Date().toISOString(),
  })

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
  console.log(`\n── SUMMARY ──`)
  console.log(`region:        ${REGION}`)
  console.log(`queries ok:    ${stats.queries}`)
  console.log(`query errors:  ${stats.errors}`)
  console.log(`hotels w/ hit: ${stats.appearances}`)
  console.log(`est. cost:     $${stats.cost.toFixed(4)}`)
  console.log(`duration:      ${mins} min`)
}

main().then(() => process.exit(0)).catch((e) => { console.error('UNCAUGHT:', e); process.exit(1) })
