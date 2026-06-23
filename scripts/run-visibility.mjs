// scripts/run-visibility.mjs
// Standalone per-hotel AI visibility scorer for GitHub Actions.
// Runs on the GitHub runner (6h ceiling) — NOT a Vercel function.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const HOTEL_CONCURRENCY = Number(process.env.HOTEL_CONCURRENCY || 8)
const QUERY_TIMEOUT_MS = Number(process.env.QUERY_TIMEOUT_MS || 30000)
const DELAY_BETWEEN_QUERIES_MS = Number(process.env.DELAY_BETWEEN_QUERIES_MS || 500)
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3)

for (const [k, v] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PERPLEXITY_API_KEY,
  OPENAI_API_KEY,
})) {
  if (!v) {
    console.error(`FATAL: missing env var ${k}`)
    process.exit(1)
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function withRetry(fn, maxRetries = MAX_RETRIES, label = 'request') {
  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      const isRetryable = e?.status === 429 || (e?.status >= 500 && e?.status < 600)
      if (!isRetryable || attempt === maxRetries) throw e
      const backoff = Math.pow(2, attempt) * 1000
      console.warn(`[${label}] attempt ${attempt} failed (${e.status}), retrying in ${backoff}ms`)
      await sleep(backoff)
    }
  }
  throw lastError
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function queryPerplexity(query) {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
        max_tokens: 500,
        temperature: 0,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[PERPLEXITY ERROR] status=${res.status} body=${body.slice(0, 200)}`)
      const err = new Error(`Perplexity HTTP ${res.status}`)
      err.status = res.status
      throw err
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Perplexity returned empty content')
    return text
  }, MAX_RETRIES, 'PERPLEXITY')
}

async function queryChatGPT(query) {
  return withRetry(async () => {
    const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        messages: [{ role: 'user', content: `${query}. Please recommend 3-5 specific hotels by name.` }],
        max_tokens: 500,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[CHATGPT ERROR] status=${res.status} body=${body.slice(0, 200)}`)
      const err = new Error(`ChatGPT HTTP ${res.status}`)
      err.status = res.status
      throw err
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('ChatGPT returned empty content')
    return text
  }, MAX_RETRIES, 'CHATGPT')
}

const PLATFORMS = [
  { id: 'chatgpt', queryFn: queryChatGPT, cost: 0.01 },
  { id: 'perplexity', queryFn: queryPerplexity, cost: 0.001 },
]

const CORE_VARIANTS = [
  'la réserve genève', 'la reserve geneve', 'la réserve geneva', 'la reserve geneva',
  'mont cervin', 'monte rosa zermatt', 'schweizerhof zermatt',
  'bellevue palace', 'alpengold', 'crans ambassador', 'hotel adula', 'adula hotel',
  'victoria-jungfrau', 'victoria jungfrau',
  'la réserve eden', 'la reserve eden', 'eden au lac', 'réserve eden au lac', 'reserve eden au lac',
]

function checkAppeared(hotelName, responseText) {
  const r = responseText.toLowerCase()
  const n = hotelName.toLowerCase()
  const noAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = n.split(' ').filter((w) => !['hotel','the','le','la','les','grand','de','du','au','aux','by','at','and','&'].includes(w))
  const lastTwo = hotelName.split(' ').slice(-2).join(' ').toLowerCase()
  const firstTwo = hotelName.split(' ').slice(0, 2).join(' ').toLowerCase()
  const keyWords = words.slice(0, 3).join(' ')
  const shortName = words.slice(0, 2).join(' ')

  return CORE_VARIANTS.some((v) => r.includes(v)) ||
    r.includes(n) || r.includes(noAccents(n)) ||
    r.includes(lastTwo) || r.includes(noAccents(lastTwo)) ||
    r.includes(firstTwo) || r.includes(noAccents(firstTwo)) ||
    r.includes(keyWords) || r.includes(noAccents(keyWords)) ||
    r.includes(shortName) || r.includes(noAccents(shortName))
}

function snippetFor(hotelName, responseText) {
  const r = responseText.toLowerCase()
  const n = hotelName.toLowerCase()
  const idx = r.indexOf(n) !== -1 ? r.indexOf(n) : r.indexOf(hotelName.split(' ').slice(-2).join(' ').toLowerCase())
  if (idx === -1) return null
  return responseText.substring(Math.max(0, idx - 50), idx + 150).trim()
}

async function runPool(items, concurrency, worker) {
  let i = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      await worker(items[idx])
    }
  })
  await Promise.all(runners)
}

const stats = { hotels: 0, appearances: 0, queries: 0, errors: 0, cost: 0 }

async function processHotel(hotel) {
  try {
    const { data: customQueries } = await supabase
      .from('ai_visibility_queries')
      .select('query')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)

    if (!customQueries?.length) {
      console.log(`[skip] ${hotel.name} — no active queries`)
      return
    }
    const queriesToRun = customQueries.map((q) => q.query)

    for (const query of queriesToRun) {
      await Promise.all(PLATFORMS.map(async (platform) => {
        let responseText
        try {
          responseText = await platform.queryFn(query)
          stats.cost += platform.cost
          stats.queries++
        } catch (e) {
          stats.errors++
          console.error(`[SCORE SKIP] ${platform.id} failed for "${query}" (${hotel.name}): ${e?.message}`)
          return
        }

        const appeared = checkAppeared(hotel.name, responseText)
        const snippet = appeared ? snippetFor(hotel.name, responseText) : null
        if (appeared) stats.appearances++

        const { error: insErr } = await supabase.from('ai_visibility_scores').insert({
          hotel_id: hotel.id,
          hotel_name: hotel.name,
          query,
          appeared,
          platform: platform.id,
          response_snippet: snippet,
          checked_at: new Date().toISOString(),
        })
        if (insErr) console.error(`[DB] insert failed (${hotel.name}/${platform.id}): ${insErr.message}`)
      }))
      await sleep(DELAY_BETWEEN_QUERIES_MS)
    }

    stats.hotels++
    console.log(`[done] ${hotel.name} — ${queriesToRun.length} queries x ${PLATFORMS.length} platforms`)
  } catch (e) {
    stats.errors++
    console.error(`[HOTEL FAIL] ${hotel.name}: ${e?.message}`)
  }
}

async function main() {
  const startedAt = Date.now()

  const { data: setting } = await supabase
    .from('settings').select('value').eq('key', 'ai_visibility_cron_enabled').single()
  if (setting?.value === 'false') {
    console.log('ai_visibility_cron_enabled = false — exiting without running.')
    return
  }

  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('id, name, region')
    .eq('is_active', true)
    .eq('is_partner', true)
  if (error) { console.error('Failed to load hotels:', error.message); process.exit(1) }
  if (!hotels?.length) { console.log('No active partner hotels.'); return }

  console.log(`Starting: ${hotels.length} hotels, concurrency=${HOTEL_CONCURRENCY}, timeout=${QUERY_TIMEOUT_MS}ms/call`)

  await runPool(hotels, HOTEL_CONCURRENCY, processHotel)

  await supabase.from('cron_costs').insert({
    hotels_checked: stats.hotels,
    queries_run: stats.queries,
    platforms_checked: PLATFORMS.length,
    estimated_cost_usd: Number(stats.cost.toFixed(4)),
    triggered_by: 'github_actions',
    run_at: new Date().toISOString(),
  })

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1)
  console.log(`\n── SUMMARY ──`)
  console.log(`hotels ok:    ${stats.hotels}/${hotels.length}`)
  console.log(`queries ok:   ${stats.queries}`)
  console.log(`appearances:  ${stats.appearances}`)
  console.log(`errors:       ${stats.errors}`)
  console.log(`est. cost:    $${stats.cost.toFixed(4)}`)
  console.log(`duration:     ${mins} min`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('UNCAUGHT:', e); process.exit(1) })
