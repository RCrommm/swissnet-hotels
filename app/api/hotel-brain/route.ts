import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyFacts, summarizeClean } from '@/lib/clean-extraction'
import { buildInventory } from '@/lib/page-discovery'

export const maxDuration = 300
const CRAWL_LIMIT = 18

// ─── PAGE PRIORITIZATION: spend crawl budget on content pages, skip transactional ones ───
const EXCLUDE_PAGES = /(\/booking|\/reservation|\/check-rates?|\/my-reservation|\/thank-you|\/post-stay|\/careers?|\/cart|\/checkout|\/login|\/account|\/privacy|\/terms|\/cookie|\/sitemap|\/gift-?card|\/book-now|\/availability)/i
const PAGE_PRIORITY: { re: RegExp; rank: number }[] = [
  { re: /(about|story|heritage)/i, rank: 1 },
  { re: /(accommodation|rooms?|suites?)/i, rank: 2 },
  { re: /(restaurant|dining|\bbar\b|brasserie|afternoon-tea|tea)/i, rank: 3 },
  { re: /(spa|wellness)/i, rank: 4 },
  { re: /(meeting|event|conference|wedding|civil)/i, rank: 4 },
  { re: /(whats-on|experience|things-to-do)/i, rank: 5 },
  { re: /(location|neighbourhood|directions|getting-here)/i, rank: 5 },
  { re: /(offers?|packages?)/i, rank: 6 },
  { re: /(faq|policies|parking|accessibility|pets)/i, rank: 6 },
  { re: /(contact)/i, rank: 7 },
  { re: /(press|news|blog|journal)/i, rank: 9 },
]
function rankUrl(u: string, homepage: string): number {
  const hp = homepage.replace(/\/$/, '')
  if (u.replace(/\/$/, '') === hp) return 0
  let path = u
  try { path = new URL(u).pathname.replace(/\/$/, '') || '/' } catch {}
  for (const p of PAGE_PRIORITY) { if (p.re.test(path)) return p.rank }
  return 8
}
function selectPages(candidates: string[], homepage: string, limit: number): string[] {
  const kept = candidates.filter(u => !EXCLUDE_PAGES.test(u))
  const ranked = kept.map(u => ({ u, r: rankUrl(u, homepage) })).sort((a, b) => a.r - b.r || a.u.length - b.u.length)
  const seen = new Set<string>(); const out: string[] = []
  for (const { u } of ranked) { const k = u.replace(/\/$/, ''); if (seen.has(k)) continue; seen.add(k); out.push(u); if (out.length >= limit) break }
  return out
}

// ─── LAYERED CRAWLER: cheap first, ScrapingBee only as last resort ───
async function fetchCheap(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwissNetBrain/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const html = await res.text()
    if (!html || html.length < 500) return null
    return html
  } catch { return null }
}

async function fetchBee(url: string, apiKey: string, premium: boolean): Promise<string | null> {
  try {
    const pp = premium ? '&premium_proxy=true&country_code=gb' : ''
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=true&wait=1500${pp}`)
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

async function getPage(url: string, apiKey: string | undefined, state: { beeAllowed: boolean; premium: boolean; usedBee: boolean }): Promise<string | null> {
  const cheap = await fetchCheap(url)
  if (cheap) return cheap
  if (!apiKey || !state.beeAllowed) return null
  if (state.premium) { const prem = await fetchBee(url, apiKey, true); if (prem) { state.usedBee = true; return prem } return null }
  const basic = await fetchBee(url, apiKey, false)
  if (basic) { state.usedBee = true; return basic }
  const prem = await fetchBee(url, apiKey, true)
  if (prem) { state.usedBee = true; state.premium = true; return prem }
  return null
}

// Run async tasks with a concurrency limit — parallelizes without hammering the APIs
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let i = 0
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) { const idx = i++; results[idx] = await fn(items[idx]) }
  })
  await Promise.all(workers)
  return results
}

function extractText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
}
function extractHeadings(html: string): string[] {
  const out: string[] = []
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m
  while ((m = re.exec(html)) !== null) { const t = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); if (t) out.push(t) }
  return out.slice(0, 40)
}
function extractLinks(html: string, origin: string): string[] {
  const links = new Set<string>()
  const re = /href=["']([^"'#?]+)["']/gi
  const host = origin.replace(/^https?:\/\//, '')
  let m
  while ((m = re.exec(html)) !== null) {
    let href = m[1].trim()
    if (href.startsWith('/')) href = origin + href
    const clean = href.split('#')[0].split('?')[0].replace(/\/$/, '')
    if ((href.startsWith(origin) || href.includes(host)) && !/\.(woff2?|ttf|otf|eot|jpg|jpeg|png|gif|svg|webp|ico|css|js|pdf|mp4|webm|zip|xml|json)$/i.test(clean)) links.add(clean)
  }
  return [...links]
}

async function discoverSitemap(origin: string, apiKey?: string): Promise<string[]> {
  const host = origin.replace(/^https?:\/\//, '')
  const out = new Set<string>()
  const seen = new Set<string>()
  const queue: string[] = [origin + '/sitemap.xml', origin + '/sitemap_index.xml']
  try {
    const rb = await fetchCheap(origin + '/robots.txt')
    if (rb) { const re = /sitemap:\s*(\S+)/gi; let m; while ((m = re.exec(rb)) !== null) queue.push(m[1].trim()) }
  } catch {}
  let budget = 8
  while (queue.length && budget > 0) {
    const sm = queue.shift()!
    if (!sm || seen.has(sm)) continue
    seen.add(sm); budget--
    let xml = await fetchCheap(sm)
    if (!xml && apiKey) xml = await fetchBee(sm, apiKey, true)
    if (!xml) continue
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1].trim())
    for (const loc of locs) {
      if (/\.xml(\.gz)?$/i.test(loc)) { if (!seen.has(loc)) queue.push(loc); continue }
      const clean = loc.split('#')[0].split('?')[0].replace(/\/$/, '')
      if ((clean.startsWith(origin) || clean.includes(host)) && !/\.(woff2?|ttf|otf|eot|jpg|jpeg|png|gif|svg|webp|ico|css|js|pdf|mp4|webm|zip|json)$/i.test(clean)) out.add(clean)
    }
  }
  return [...out]
}

// ─── FACT EXTRACTION: knowledge only, every fact carries page + quote + confidence ───
const BRAIN_SYSTEM = `You are a hotel knowledge extractor. You read the text of ONE hotel website page and extract ONLY facts that are literally stated on it. You do NOT give advice, scores, or recommendations. You do NOT guess.

For every fact you extract, you MUST provide a verbatim quote from the page text that proves it. If you cannot quote it, do not extract it.

Use these categories: identity, location, rooms, dining, spa, wellness, family, romantic, business, meetings, weddings, parking, pets, accessibility, transport, policies, offers, awards, trust, amenities, entities.

For each fact:
- "category": one of the above
- "fact_key": a short stable snake_case key (e.g. "room_count", "afternoon_tea_available", "parking_available", "check_in_time", "pets_allowed")
- "fact_value": the concrete value as stated (e.g. "39 bedrooms", "Yes", "3pm")
- "evidence_quote": a SHORT verbatim quote from the page proving it (under 25 words)
- "confidence": integer 0-100; use 80+ ONLY when the page states it clearly and unambiguously.

Extract entities (neighbourhoods, landmarks, stations, named restaurants/bars/suites) as category "entities", fact_key "entity", fact_value = the entity name, with the quote that mentions it.
Return STRICTLY the JSON schema.`

function brainSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['facts'],
    properties: {
      facts: {
        type: 'array', items: {
          type: 'object', additionalProperties: false,
          required: ['category', 'fact_key', 'fact_value', 'evidence_quote', 'confidence'],
          properties: {
            category: { type: 'string' },
            fact_key: { type: 'string' },
            fact_value: { type: 'string' },
            evidence_quote: { type: 'string' },
            confidence: { type: 'integer' },
          },
        },
      },
    },
  }
}

async function extractFacts(page: { url: string; headings: string[]; text: string }, openaiKey: string): Promise<any[]> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0, max_tokens: 2500,
        response_format: { type: 'json_schema', json_schema: { name: 'brain', strict: true, schema: brainSchema() } },
        messages: [
          { role: 'system', content: BRAIN_SYSTEM },
          { role: 'user', content: `URL: ${page.url}\nHEADINGS: ${(page.headings || []).join(' | ')}\nTEXT: ${(page.text || '').slice(0, 5000)}` },
        ],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return []
    const parsed = JSON.parse(c)
    return (parsed.facts || []).map((f: any) => ({ ...f, page_url: page.url }))
  } catch { return [] }
}

function summarize(facts: any[]) {
  const byCat: Record<string, any[]> = {}
  for (const f of facts) { (byCat[f.category] ||= []).push({ key: f.fact_key, value: f.fact_value, quote: f.evidence_quote, page: f.page_url, confidence: f.confidence }) }
  const entities = Array.from(new Set(facts.filter(f => f.category === 'entities').map(f => f.fact_value)))
  return { categories: Object.keys(byCat), byCategory: byCat, entities, factCount: facts.length }
}

export async function POST(req: Request) {
  try {
    const { url, hotelId, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!url) return NextResponse.json({ error: 'Enter a website URL' }, { status: 400 })
    const openaiKey = process.env.OPENAI_API_KEY
    const apiKey = process.env.SCRAPINGBEE_API_KEY
    if (!openaiKey) return NextResponse.json({ error: 'OpenAI key not set' }, { status: 500 })
    let origin = ''
    try { origin = new URL(url).origin } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let hotelName = '', city = ''
    if (hotelId && sbUrl && sbKey) {
      try { const sb = createClient(sbUrl, sbKey); const { data: h } = await sb.from('hotels').select('name, location, region').eq('id', hotelId).single(); if (h) { hotelName = h.name || ''; city = h.location || h.region || '' } } catch {}
    }

    const state = { beeAllowed: !!apiKey, premium: false, usedBee: false }

    const homeHtml = await getPage(url, apiKey, state)
    if (!homeHtml) return NextResponse.json({ error: 'Could not load the website (all crawl layers failed).' }, { status: 502 })
    const sitemapUrls = await discoverSitemap(origin, apiKey)
    const homeLinks = extractLinks(homeHtml, origin)
    const candidates = Array.from(new Set([url, ...sitemapUrls, ...homeLinks]))
    // SHARED PAGE DISCOVERY: one canonical inventory for the whole website (Brain + Audit use the same selected list)
    const inventory = buildInventory(url, candidates, (() => { try { return new URL(url).pathname } catch { return '' } })())
    const toRead = inventory.selected

    const htmls = await pool(toRead, 5, async (u) => ({ url: u, html: u === url ? homeHtml : await getPage(u, apiKey, state) }))
    const pages = htmls.filter(h => h.html).map(h => ({ url: h.url, headings: extractHeadings(h.html as string), text: extractText(h.html as string) }))
    if (!pages.length) return NextResponse.json({ error: 'Could not read any pages.' }, { status: 502 })

    // INTERNAL LINK CAPTURE (2C): record Page A -> Page B for every crawled page.
    // Store-only, no analysis yet. Reuses extractLinks (same-origin, assets stripped).
    const linkEdges: { from_url: string; to_url: string }[] = []
    const seenEdge = new Set<string>()
    for (const h of htmls) {
      if (!h.html) continue
      for (const t of extractLinks(h.html as string, origin)) {
        if (t === h.url) continue
        const k = `${h.url} -> ${t}`
        if (seenEdge.has(k)) continue
        seenEdge.add(k)
        linkEdges.push({ from_url: h.url, to_url: t })
      }
    }

    const factBatches = await pool(pages, 5, async (p) => extractFacts(p, openaiKey))
    let allFacts: any[] = factBatches.flat()
    const confirmed = allFacts.filter(f => f && (f.evidence_quote || '').trim().length > 0 && Number(f.confidence) >= 80)

    // De-duplicate identical (category + fact_key + value)
    const seen = new Set<string>()
    const facts = confirmed.filter(f => { const k = `${f.category}|${f.fact_key}|${f.fact_value}`.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })

    // CLEAN EXTRACTION (2B): tag transient pages + conditionally down-weight so
    // utility pages don't become primary knowledge (contaminated-only topics preserved).
    classifyFacts(facts)
    const knowledge = summarizeClean(facts)

    let brainId: string | null = null
    if (sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data: brain } = await sb.from('hotel_brains').insert({
          hotel_id: hotelId || null, website_url: url, hotel_name: hotelName || null, city: city || null, knowledge,
        }).select('id').single()
        if (brain) {
          brainId = brain.id
          const rows = facts.map(f => ({ brain_id: brain.id, hotel_id: hotelId || null, category: f.category, fact_key: f.fact_key, fact_value: f.fact_value, page_url: f.page_url || '', evidence_quote: f.evidence_quote || '', confidence: f.confidence, transient: !!f.transient, down_weighted: !!f.down_weighted }))
          if (rows.length) for (let i = 0; i < rows.length; i += 100) await sb.from('hotel_facts').insert(rows.slice(i, i + 100))
          // store internal link graph (capture only)
          const linkRows = linkEdges.map(e => ({ brain_id: brain.id, hotel_id: hotelId || null, from_url: e.from_url, to_url: e.to_url }))
          if (linkRows.length) for (let i = 0; i < linkRows.length; i += 200) await sb.from('page_links').insert(linkRows.slice(i, i + 200))
        }
      } catch {}
    }

    return NextResponse.json({
      brainId, website_url: url, hotel_name: hotelName || null, city: city || null,
      pagesRead: pages.map(p => p.url), pagesReadCount: pages.length,
      crawlMethod: state.usedBee ? (state.premium ? 'scrapingbee_premium' : 'scrapingbee_basic') : 'free_fetch',
      factCount: facts.length, rawFactCount: allFacts.length, discardedLowConfidence: allFacts.length - facts.length,
      linkEdges: linkEdges.length,
      knowledge,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Hotel Brain failed' }, { status: 500 })
  }
}