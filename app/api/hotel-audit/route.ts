import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300
const CRAWL_LIMIT = 22

async function scrape(url: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=false`)
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}
function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>()
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1].trim())
      const walk = (n: any) => {
        if (!n || typeof n !== 'object') return
        if (Array.isArray(n)) return n.forEach(walk)
        if (n['@type']) (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]).forEach((t: string) => types.add(t))
        if (n['@graph']) walk(n['@graph'])
      }
      walk(json)
    } catch {}
  }
  return [...types]
}
function extractText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
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
async function fetchRobots(origin: string) {
  const bots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot']
  try {
    const res = await fetch(origin + '/robots.txt')
    if (!res.ok) return { found: false, blocked: [] as string[], allowed: bots }
    const txt = (await res.text()).toLowerCase()
    const blocked: string[] = []
    const groups = txt.split(/user-agent:/).slice(1)
    const blocksRoot = (g: string) => /disallow:\s*\/\s*(\n|$)/.test(g)
    const starBlocked = groups.some(g => g.trimStart().startsWith('*') && blocksRoot(g))
    for (const bot of bots) {
      const g = groups.find(x => x.trimStart().startsWith(bot.toLowerCase()))
      if ((g && blocksRoot(g)) || (!g && starBlocked)) blocked.push(bot)
    }
    return { found: true, blocked, allowed: bots.filter(b => !blocked.includes(b)) }
  } catch { return { found: false, blocked: [] as string[], allowed: bots } }
}

const PRIORITY: { key: string; label: string; kws: string[]; impact: string; cats: string[]; multi?: boolean }[] = [
  { key: 'homepage', label: 'Homepage', kws: [], impact: 'High', cats: ['overall'] },
  { key: 'rooms', label: 'Room pages', kws: ['room', 'suite', 'accommodation', 'chambre', 'zimmer'], impact: 'High', cats: ['luxury', 'family', 'romantic'], multi: true },
  { key: 'spa', label: 'Spa / Wellness page', kws: ['spa', 'wellness', 'bien-etre', 'bien-être'], impact: 'High', cats: ['wellness'] },
  { key: 'dining', label: 'Dining page', kws: ['restaurant', 'dining', 'gastro', 'cuisine'], impact: 'High', cats: ['dining'] },
  { key: 'location', label: 'Location page', kws: ['location', 'directions', 'getting-here', 'contact', 'access', 'map'], impact: 'High', cats: ['location'] },
  { key: 'meetings', label: 'Meetings & Events page', kws: ['meeting', 'event', 'conference', 'banquet', 'mice', 'seminaire'], impact: 'Medium', cats: ['business'] },
  { key: 'family', label: 'Family page', kws: ['family', 'kids', 'children', 'famille', 'enfant'], impact: 'High', cats: ['family'] },
  { key: 'romantic', label: 'Romantic page', kws: ['romantic', 'couple', 'honeymoon', 'romantique', 'lune-de-miel'], impact: 'High', cats: ['romantic'] },
  { key: 'business', label: 'Business page', kws: ['business', 'corporate', 'affaires', 'executive'], impact: 'Medium', cats: ['business'] },
  { key: 'luxury', label: 'Luxury / About page', kws: ['luxury', 'about', 'la-reserve', 'palace', 'histoire', 'story'], impact: 'Medium', cats: ['luxury', 'overall'] },
  { key: 'parking', label: 'Parking page', kws: ['parking', 'voiturier', 'stationnement', 'garage'], impact: 'Medium', cats: ['practical'] },
  { key: 'accessibility', label: 'Accessibility page', kws: ['accessib', 'wheelchair', 'pmr', 'mobilite', 'mobilité'], impact: 'Medium', cats: ['accessibility'] },
  { key: 'breakfast', label: 'Breakfast page', kws: ['breakfast', 'petit-dejeuner', 'petit-déjeuner', 'brunch'], impact: 'Low', cats: ['dining', 'practical'] },
  { key: 'pets', label: 'Pets page', kws: ['pet', 'dog', 'animaux', 'chien'], impact: 'Low', cats: ['practical'] },
  { key: 'airport', label: 'Airport transfer page', kws: ['airport-transfer', 'transfert', 'navette', 'shuttle', 'limousine'], impact: 'Medium', cats: ['location'] },
]

const EXPECTED: Record<string, { field: string; label: string }[]> = {
  homepage: [{ field: 'positioning', label: 'Clear positioning' }, { field: 'quickfacts', label: 'Quick Facts block' }, { field: 'aisummary', label: 'AI summary' }, { field: 'internallinks', label: 'Links to demand pages' }, { field: 'faq', label: 'FAQ section' }],
  rooms: [{ field: 'overview', label: 'Overview' }, { field: 'occupancy', label: 'Occupancy' }, { field: 'view', label: 'View info' }, { field: 'who', label: 'Who it’s for' }, { field: 'idealfor', label: 'Ideal-For' }, { field: 'comparison', label: 'Comparison' }, { field: 'faq', label: 'FAQ' }],
  spa: [{ field: 'services', label: 'Services' }, { field: 'facilities', label: 'Facilities' }, { field: 'hours', label: 'Opening hours' }, { field: 'nonresident', label: 'Non-resident policy' }, { field: 'quickfacts', label: 'Quick Facts' }, { field: 'faq', label: 'FAQ' }],
  dining: [{ field: 'descriptions', label: 'Restaurant descriptions' }, { field: 'cuisine', label: 'Cuisine' }, { field: 'who', label: 'Who it’s for' }, { field: 'why', label: 'Why choose it' }, { field: 'faq', label: 'FAQ' }],
  family: [{ field: 'positioning', label: 'Family positioning' }, { field: 'rooms', label: 'Family rooms' }, { field: 'childpolicy', label: 'Children policy' }, { field: 'amenities', label: 'Family amenities' }, { field: 'attractions', label: 'Nearby family attractions' }, { field: 'faq', label: 'FAQ' }],
  romantic: [{ field: 'positioning', label: 'Couples positioning' }, { field: 'experiences', label: 'Romantic experiences' }, { field: 'suites', label: 'Suites' }, { field: 'spa', label: 'Spa experiences' }, { field: 'dining', label: 'Dining experiences' }, { field: 'faq', label: 'FAQ' }],
  business: [{ field: 'facilities', label: 'Meeting facilities' }, { field: 'capacities', label: 'Capacities' }, { field: 'services', label: 'Corporate services' }, { field: 'airport', label: 'Airport access' }, { field: 'faq', label: 'FAQ' }],
  luxury: [{ field: 'positioning', label: 'Luxury positioning' }, { field: 'story', label: 'Story / heritage' }, { field: 'awards', label: 'Awards / recognition' }, { field: 'faq', label: 'FAQ' }],
  parking: [{ field: 'availability', label: 'Availability' }, { field: 'pricing', label: 'Pricing' }, { field: 'ev', label: 'EV charging' }, { field: 'policy', label: 'Reservation policy' }, { field: 'faq', label: 'FAQ' }],
  accessibility: [{ field: 'rooms', label: 'Accessible rooms' }, { field: 'stepfree', label: 'Step-free access' }, { field: 'lift', label: 'Lift access' }, { field: 'policy', label: 'Accessibility policies' }, { field: 'faq', label: 'FAQ' }],
  breakfast: [{ field: 'hours', label: 'Hours' }, { field: 'included', label: 'Included / price' }, { field: 'venue', label: 'Venue' }, { field: 'faq', label: 'FAQ' }],
  pets: [{ field: 'policy', label: 'Pet policy' }, { field: 'fee', label: 'Fees' }, { field: 'amenities', label: 'Pet amenities' }, { field: 'faq', label: 'FAQ' }],
  airport: [{ field: 'available', label: 'Transfer available' }, { field: 'pricing', label: 'Pricing' }, { field: 'distance', label: 'Distance / time' }, { field: 'booking', label: 'How to book' }, { field: 'faq', label: 'FAQ' }],
}

const REC_SYSTEM = `You are a strict, evidence-based hotel AI-recommendation auditor. Given crawled text from ONE hotel website and a list of recommendation prompts, decide for EACH prompt whether THIS WEBSITE provides enough evidence for an AI to CONFIDENTLY RECOMMEND this hotel for that prompt.

RULES:
- Use ONLY provided website text. NEVER use outside knowledge. Never guess.
- "readiness": "YES" (clear specific quotable evidence), "PARTIAL" (some but thin/incomplete), or "NO" (none).
- Every YES/PARTIAL MUST include a verbatim quote from the text. No quote = NO.
- "evidence": the verbatim quote, or "".
- "missing": short, concrete list of what content is absent that prevents confident recommendation.
- "confidence": integer 0-100 (NO 0-20, PARTIAL 21-60, YES 61-100), justified by the quote.
- "url": source URL of the quote; "".
- "pages": short list of which page TYPES are responsible for this prompt (e.g. "family page", "room pages", "FAQ", "spa page", "parking page").
Return STRICTLY the JSON schema, one entry per prompt in order.`

function recSchema() {
  return { type: 'object', additionalProperties: false, required: ['answers'], properties: { answers: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['index', 'readiness', 'evidence', 'missing', 'url', 'confidence', 'pages'],
    properties: {
      index: { type: 'integer' }, readiness: { type: 'string', enum: ['YES', 'PARTIAL', 'NO'] },
      evidence: { type: 'string' }, missing: { type: 'string' }, url: { type: 'string' }, confidence: { type: 'integer' },
      pages: { type: 'array', items: { type: 'string' } },
    },
  } } } }
}
async function runReadiness(prompts: any[], pages: any[], openaiKey: string) {
  if (!prompts.length || !pages.length) return []
  const corpus = pages.map(p => `URL: ${p.url}\nHEADINGS: ${(p.headings || []).slice(0, 12).join(' | ')}\nTEXT: ${(p.text || '').slice(0, 1400)}`).join('\n\n---\n\n')
  const pList = prompts.map((q, i) => `[${i}] ${q.question}`).join('\n')
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0, max_tokens: 4000,
        response_format: { type: 'json_schema', json_schema: { name: 'readiness', strict: true, schema: recSchema() } },
        messages: [{ role: 'system', content: REC_SYSTEM }, { role: 'user', content: `WEBSITE PAGES:\n\n${corpus}\n\n────────\nPROMPTS:\n${pList}` }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) throw new Error('empty')
    const parsed = JSON.parse(c)
    const byIdx = new Map<number, any>(); for (const a of (parsed.answers || [])) byIdx.set(a.index, a)
    return prompts.map((q, i) => {
      const a = byIdx.get(i) || {}; const ev = (a.evidence || '').trim()
      let readiness = a.readiness === 'YES' || a.readiness === 'PARTIAL' ? a.readiness : 'NO'
      if ((readiness === 'YES' || readiness === 'PARTIAL') && ev.length === 0) readiness = 'NO'
      let conf = Number.isFinite(a.confidence) ? Math.max(0, Math.min(100, a.confidence)) : 0
      if (readiness === 'NO') conf = Math.min(conf, 20)
      return { question: q.question, category: q.category || 'overall', priority: q.priority || 'medium', readiness, evidence: readiness === 'NO' ? '' : ev, missing: (a.missing || '').trim(), url: readiness === 'NO' ? '' : (a.url || ''), confidence: conf, pages: Array.isArray(a.pages) ? a.pages.slice(0, 5) : [] }
    })
  } catch {
    return prompts.map(q => ({ question: q.question, category: q.category || 'overall', priority: q.priority || 'medium', readiness: 'NO', evidence: '', missing: 'Not evaluated', url: '', confidence: 0, pages: [] }))
  }
}

function pageSchema(fields: string[]) {
  const props: any = { evidence: { type: 'string' } }
  for (const f of fields) props[f] = { type: 'boolean' }
  return { type: 'object', additionalProperties: false, required: [...fields, 'evidence'], properties: props }
}
async function auditPage(pg: any, typeKey: string, openaiKey: string) {
  const expected = EXPECTED[typeKey] || EXPECTED.homepage
  const fields = expected.map(e => e.field)
  const sys = `You are a strict evidence-based auditor checking ONE hotel ${typeKey} page for required elements. Use ONLY the provided text/headings. NEVER infer or use outside knowledge. For each element return true ONLY if it is genuinely present in the text. Provide one short verbatim quote as "evidence" (or "").
Elements: ${expected.map(e => `"${e.field}" = ${e.label}`).join('; ')}.`
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0, max_tokens: 600,
        response_format: { type: 'json_schema', json_schema: { name: 'page_audit', strict: true, schema: pageSchema(fields) } },
        messages: [{ role: 'system', content: sys }, { role: 'user', content: `URL: ${pg.url}\nHEADINGS: ${(pg.headings || []).join(' | ')}\nTEXT: ${(pg.text || '').slice(0, 4000)}` }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return null
    return JSON.parse(c)
  } catch { return null }
}

function pct(g: number, m: number) { return m ? Math.round((g / m) * 100) : 0 }

const CAT_MAP: Record<string, string> = { luxury: 'luxury', spa: 'wellness', romantic: 'romantic', family: 'family', business: 'business', lake: 'location', location: 'location', airport: 'location', parking: 'practical', pets: 'practical', dining: 'dining', accessibility: 'accessibility', positioning: 'overall', overall: 'overall' }
const CAT_LABEL: Record<string, string> = { luxury: 'Luxury', wellness: 'Wellness', romantic: 'Romantic', family: 'Family', business: 'Business', location: 'Location', practical: 'Practical (parking/pets)', dining: 'Dining', accessibility: 'Accessibility', overall: 'Overall / Brand' }

export async function POST(req: Request) {
  try {
    const { url, city, password, hotelId, hotelType, manualUrls } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!url) return NextResponse.json({ error: 'Enter a website URL' }, { status: 400 })
    const apiKey = process.env.SCRAPINGBEE_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    if (!apiKey || !openaiKey) return NextResponse.json({ error: 'API keys not set' }, { status: 500 })
    let origin = ''
    try { origin = new URL(url).origin } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let effCity = city || '', effType = hotelType || ''
    let overrides: Record<string, string> = {}
    if (hotelId && sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data: h } = await sb.from('hotels').select('region, location, category').eq('id', hotelId).single()
        if (h) { effCity = effCity || h.location || h.region || ''; effType = effType || h.category || '' }
        try {
          const { data: ov } = await sb.from('hotel_priority_pages').select('page_key, url').eq('hotel_id', hotelId)
          if (ov) for (const row of ov) if (row.page_key && row.url) overrides[row.page_key] = row.url
        } catch {}
      } catch {}
    }

    const homeHtml = await scrape(url, apiKey)
    if (!homeHtml) return NextResponse.json({ error: 'Could not load the website (it may block crawlers or be down).' }, { status: 502 })
    const homeLinks = extractLinks(homeHtml, origin)

    const matchLink = (kws: string[]) => homeLinks.find(l => kws.some(k => l.toLowerCase().includes(k)))
    const matchAll = (kws: string[]) => homeLinks.filter(l => kws.some(k => l.toLowerCase().includes(k)))
    type Slot = { key: string; label: string; impact: string; cats: string[]; url: string | null; source: string }
    const slots: Slot[] = []

    // classify a URL into a priority type by keyword (for picking its checklist)
    const classifyUrl = (u: string): { key: string; label: string; impact: string; cats: string[] } => {
      const lu = u.toLowerCase()
      for (const def of PRIORITY) { if (def.key === 'homepage') continue; if (def.kws.some(k => lu.includes(k))) return { key: def.key, label: def.label.replace(/ pages?$/i, '').replace(/s$/, ''), impact: def.impact, cats: def.cats } }
      return { key: 'homepage', label: 'Page', impact: 'Medium', cats: ['overall'] } // generic demand-page checklist
    }

    if (Array.isArray(manualUrls) && manualUrls.length) {
      // MANUAL MODE: audit exactly the URLs provided, in order
      manualUrls.forEach((u: string, i: number) => {
        const c = classifyUrl(u)
        const isHome = u.replace(/\/$/, '') === url.replace(/\/$/, '')
        slots.push({ key: isHome ? 'homepage' : c.key, label: isHome ? 'Homepage' : `${c.label} — ${(() => { try { return new URL(u).pathname } catch { return u } })()}`, impact: c.impact, cats: c.cats, url: u, source: 'manual' })
      })
    } else {
      // AUTO MODE
      for (const def of PRIORITY) {
        if (def.key === 'homepage') { slots.push({ key: 'homepage', label: 'Homepage', impact: def.impact, cats: def.cats, url, source: 'home' }); continue }
        if (overrides[def.key]) { slots.push({ key: def.key, label: def.label, impact: def.impact, cats: def.cats, url: overrides[def.key], source: 'override' }); continue }
        if (def.multi) {
          const all = matchAll(def.kws).slice(0, 4)
          if (all.length) { all.forEach((u, i) => slots.push({ key: def.key, label: `${def.label.replace(/s$/, '')} ${i + 1}`, impact: def.impact, cats: def.cats, url: u, source: 'auto' })); continue }
          slots.push({ key: def.key, label: def.label, impact: def.impact, cats: def.cats, url: null, source: 'missing' }); continue
        }
        const found = matchLink(def.kws)
        slots.push({ key: def.key, label: def.label, impact: def.impact, cats: def.cats, url: found || null, source: found ? 'auto' : 'missing' })
      }
    }

    const toScrape = Array.from(new Set(slots.filter(s => s.url).map(s => s.url as string))).slice(0, CRAWL_LIMIT)
    const pageCache: Record<string, any> = {}
    for (const u of toScrape) {
      const html = u === url ? homeHtml : await scrape(u, apiKey)
      if (!html) continue
      pageCache[u] = { url: u, schemaTypes: extractSchemaTypes(html), headings: extractHeadings(html), text: extractText(html), links: extractLinks(html, origin) }
    }
    const pages = Object.values(pageCache)
    if (pages.length === 0) return NextResponse.json({ error: 'Could not read any pages.' }, { status: 502 })
    const robots = await fetchRobots(origin)

    const allSchema = new Set<string>()
    for (const p of pages) for (const t of (p.schemaTypes || [])) allSchema.add(t)

    let prompts: any[] = []
    if (sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data } = await sb.from('audit_questions').select('question, city, hotel_type, category, priority').eq('active', true)
        const cityL = (effCity || '').toLowerCase(), typeL = (effType || '').toLowerCase()
        const soft = (a: string, b: string) => !a || !b || a.includes(b) || b.includes(a)
        prompts = (data || []).filter((r: any) => soft(cityL, (r.city || '').toLowerCase()) && soft(typeL, (r.hotel_type || '').toLowerCase()))
      } catch {}
    }
    const readiness = await runReadiness(prompts, pages, openaiKey)
    const yesN = readiness.filter((c: any) => c.readiness === 'YES').length
    const partialN = readiness.filter((c: any) => c.readiness === 'PARTIAL').length
    const noN = readiness.filter((c: any) => c.readiness === 'NO').length
    const recScore = readiness.length ? Math.round(((yesN + partialN * 0.5) / readiness.length) * 100) : 0

    const buckets: Record<string, { yes: number; partial: number; no: number; total: number }> = {}
    for (const r of readiness) {
      const cat = CAT_MAP[r.category] || 'overall'
      const b = (buckets[cat] ||= { yes: 0, partial: 0, no: 0, total: 0 })
      b.total++; if (r.readiness === 'YES') b.yes++; else if (r.readiness === 'PARTIAL') b.partial++; else b.no++
    }
    const demandCoverage = Object.entries(buckets).map(([cat, b]) => ({
      category: cat, label: CAT_LABEL[cat] || cat, coverage: b.total ? Math.round(((b.yes + b.partial * 0.5) / b.total) * 100) : 0,
      yes: b.yes, partial: b.partial, no: b.no, total: b.total,
    })).sort((a, b) => a.coverage - b.coverage)

    const promptsByCat = (cats: string[]) => readiness.filter((r: any) => cats.includes(CAT_MAP[r.category] || 'overall')).map((r: any) => r.question)
    const importantPages: any[] = []
    for (const s of slots) {
      const expected = EXPECTED[s.key] || []
      if (!s.url || !pageCache[s.url]) {
        importantPages.push({ key: s.key, label: s.label, status: 'Missing', impact: s.impact, source: s.source,
          reason: `No ${s.label.toLowerCase()} found in the crawl.`, affects: promptsByCat(s.cats).slice(0, 4) })
        continue
      }
      const a = await auditPage(pageCache[s.url], s.key, openaiKey)
      const present = expected.filter(e => a && a[e.field]).map(e => e.label)
      const missing = expected.filter(e => !a || !a[e.field]).map(e => e.label)
      importantPages.push({ key: s.key, label: s.label, status: 'Present', impact: s.impact, source: s.source,
        url: s.url, score: pct(present.length, expected.length), present, missing,
        evidence: a?.evidence || '', affects: missing.length ? promptsByCat(s.cats).slice(0, 4) : [] })
    }

    const factTopics = [
      { key: 'Parking', kws: ['parking', 'valet', 'voiturier', 'garage', 'stationnement'] },
      { key: 'Breakfast', kws: ['breakfast', 'petit-déjeuner', 'petit dejeuner', 'petit déjeuner', 'brunch'] },
      { key: 'Pets', kws: ['pet', 'dog', 'animal', 'animaux', 'chien'] },
      { key: 'Accessibility', kws: ['accessible', 'wheelchair', 'step-free', 'disabled', 'accessibilité', 'mobilité réduite', 'pmr'] },
      { key: 'Airport transfer', kws: ['airport transfer', 'transfert aéroport', 'shuttle', 'navette', 'limousine'] },
    ]
    const layer0 = factTopics.map(t => {
      const onPages = pages.filter((p: any) => t.kws.some(k => p.text.toLowerCase().includes(k)))
      const dedicated = slots.find(s => s.url && t.kws.some(k => s.url!.toLowerCase().includes(k)))
      let status: string, note: string
      if (onPages.length === 0) { status = 'Missing'; note = 'Not found on crawled pages.' }
      else if (dedicated) { status = 'Single source'; note = 'Dedicated page found.' }
      else if (onPages.length >= 3) { status = 'Scattered'; note = `Across ${onPages.length} pages, no dedicated page.` }
      else { status = 'Present'; note = `On ${onPages.length} page(s).` }
      return { topic: t.key, status, note }
    })
    const entityHits = (() => {
      const joined = pages.map((p: any) => p.text).join(' ')
      const re = /\b([A-Z][a-zà-ÿ]+(?:\s+(?:[A-Z][a-zà-ÿ]+|de|du|des|d'|la|le))*)\b/g
      const stop = new Set(['The', 'This', 'Our', 'We', 'You', 'Your', 'Hotel', 'Book', 'Home', 'Rooms', 'Spa', 'Dining', 'Contact', 'Welcome', 'Discover'])
      const found = new Set<string>(); let m
      while ((m = re.exec(joined)) !== null) { const tok = m[1].trim(); if (tok.length > 4 && tok.includes(' ') && !stop.has(tok.split(' ')[0])) found.add(tok) }
      return found.size
    })()
    const schemaDefs = ['Hotel', 'HotelRoom', 'FAQPage', 'Review', 'AggregateRating', 'Restaurant', 'Offer', 'Event', 'BreadcrumbList']
    const schemaFound = schemaDefs.filter(s => allSchema.has(s) || (s === 'Hotel' && allSchema.has('LodgingBusiness')))
    const trustText = pages.map((p: any) => p.text.toLowerCase()).join(' ')
    const trust = { reviewSchema: allSchema.has('AggregateRating') || allSchema.has('Review'), awards: /\b(forbes|michelin|award|recognition|voted|best hotel)\b/.test(trustText), ratings: /\b(rated|rating|stars|tripadvisor|5-star|five-star)\b/.test(trustText) }
    const presentSlots = slots.filter(s => s.url && pageCache[s.url])
    const coreKeys = ['homepage', 'rooms', 'dining', 'spa', 'location', 'meetings']
    const coreScore = pct(coreKeys.filter(k => presentSlots.some(s => s.key === k)).length, coreKeys.length)
    const intentKeys = ['family', 'romantic', 'business', 'spa', 'luxury', 'parking', 'accessibility', 'airport']
    const intentScore = pct(intentKeys.filter(k => presentSlots.some(s => s.key === k)).length, intentKeys.length)
    const schemaScore = pct(schemaFound.length, schemaDefs.length)
    const pf = (n: number) => n >= 75 ? 'PASS' : n >= 40 ? 'PARTIAL' : 'FAIL'
    const architecture = {
      layers: [
        { n: 0, layer: 'Knowledge consistency', result: layer0.every(l => l.status === 'Single source') ? 'PASS' : 'PARTIAL', detail: layer0 },
        { n: 1, layer: 'Core structure', result: pf(coreScore), score: coreScore },
        { n: 2, layer: 'AI intent hub', result: pf(intentScore), score: intentScore },
        { n: 7, layer: 'Entity coverage', result: entityHits >= 12 ? 'PASS' : entityHits >= 5 ? 'PARTIAL' : 'FAIL', note: `${entityHits} named entities across crawled pages.` },
        { n: 10, layer: 'Trust signals', result: (trust.reviewSchema && (trust.awards || trust.ratings)) ? 'PASS' : (trust.reviewSchema || trust.awards || trust.ratings) ? 'PARTIAL' : 'FAIL', note: `Review schema ${trust.reviewSchema ? 'present' : 'absent'}; awards ${trust.awards ? 'mentioned' : 'absent'}; ratings ${trust.ratings ? 'mentioned' : 'absent'}.` },
        { n: 12, layer: 'Schema', result: pf(schemaScore), score: schemaScore, present: schemaFound, missing: schemaDefs.filter(s => !schemaFound.includes(s)) },
      ],
      note: 'Architecture layers are supporting evidence, computed from crawled priority pages only.',
    }
    const architectureScore = Math.round(coreScore * 0.3 + intentScore * 0.25 + schemaScore * 0.25 + Math.min(100, entityHits * 8) * 0.1 + ((trust.reviewSchema ? 50 : 0) + (trust.awards ? 25 : 0) + (trust.ratings ? 25 : 0)) * 0.1)

    const result = {
      url, city: effCity || null, hotelType: effType || null,
      recommendation: { score: recScore, yes: yesN, partial: partialN, no: noN, total: readiness.length, results: readiness },
      demandCoverage, importantPages, architecture, architectureScore,
      robots, pagesScraped: pages.map((p: any) => p.url), crawlDepth: pages.length, crawlLimit: CRAWL_LIMIT,
    }

    if (hotelId && sbUrl && sbKey) {
      try { const sb = createClient(sbUrl, sbKey); await sb.from('hotel_audits').insert({ hotel_id: hotelId, url, overall: recScore, result }) } catch {}
    }
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Audit failed' }, { status: 500 })
  }
}