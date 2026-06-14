import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300
const CRAWL_LIMIT = 18

// ── crawl + parse helpers ──────────────────────────────────────────────
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
  while ((m = re.exec(html)) !== null) {
    const t = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (t) out.push(t)
  }
  return out.slice(0, 40)
}
function extractMeta(html: string) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim()
  const description = (html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '').trim()
  return { title, description }
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
    if ((href.startsWith(origin) || href.includes(host)) && !/\.(woff2?|ttf|otf|eot|jpg|jpeg|png|gif|svg|webp|ico|css|js|pdf|mp4|webm|zip)$/i.test(clean)) links.add(clean)
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
    const groupBlocksRoot = (g: string) => /disallow:\s*\/\s*(\n|$)/.test(g)
    const starBlocked = groups.some(g => g.trimStart().startsWith('*') && groupBlocksRoot(g))
    for (const bot of bots) {
      const g = groups.find(x => x.trimStart().startsWith(bot.toLowerCase()))
      if ((g && groupBlocksRoot(g)) || (!g && starBlocked)) blocked.push(bot)
    }
    return { found: true, blocked, allowed: bots.filter(b => !blocked.includes(b)) }
  } catch { return { found: false, blocked: [] as string[], allowed: bots } }
}

// ── page classification ────────────────────────────────────────────────
const PAGE_KEYWORDS: Record<string, string[]> = {
  rooms: ['room', 'suite', 'accommodation', 'chambre', 'zimmer'],
  dining: ['restaurant', 'dining', 'dine', 'bar', 'gastro', 'cuisine'],
  spa: ['spa', 'wellness', 'fitness', 'pool', 'bien-etre', 'bien-être'],
  location: ['location', 'directions', 'getting-here', 'map', 'contact', 'access'],
  offers: ['offer', 'package', 'special', 'deal', 'promotion', 'offre'],
  family: ['family', 'kids', 'children', 'famille'],
  meetings: ['meeting', 'event', 'conference', 'banquet', 'wedding', 'mice'],
  faq: ['faq', 'questions', 'help'],
  experiences: ['experience', 'activities', 'things-to-do', 'discover', 'guide'],
  intent: ['why-stay', 'romantic', 'business-hotel', 'family-hotel', 'spa-hotel', 'luxury-hotel', 'pet-friendly', 'hotel-with', 'hotel-near'],
  knowledge: ['parking', 'breakfast', 'pets', 'accessibility', 'airport', 'check-in', 'checkin', 'cancellation', 'sustainability'],
}
function classify(url: string): string {
  const p = url.toLowerCase()
  for (const [type, kws] of Object.entries(PAGE_KEYWORDS)) if (kws.some(k => p.includes(k))) return type
  return 'homepage_or_other'
}

// ── SECTION 1: recommendation readiness (1 batched GPT call) ───────────
const REC_SYSTEM = `You are a strict, evidence-based hotel AI-recommendation auditor. You are given crawled text from ONE hotel website and a list of AI recommendation prompts. For EACH prompt, decide whether THIS WEBSITE provides enough evidence for an AI system to CONFIDENTLY RECOMMEND this hotel for that prompt.

ABSOLUTE RULES:
- Use ONLY the provided website text. NEVER use outside knowledge.
- Rate exactly one of: "YES", "PARTIAL", "NO".
  - YES: clear, specific, quotable evidence directly supports recommending for this prompt.
  - PARTIAL: some evidence exists but thin/generic/missing a key specific.
  - NO: no clear supporting evidence in the provided text.
- Every YES or PARTIAL MUST include a verbatim quote copied from the provided text. No quote = NO.
- "missing": one short line of what specific evidence is absent (for YES may be "").
- "confidence": integer 0-100 justified BY THE QUOTE. NO=0-20, PARTIAL=21-60, YES=61-100.
- If ambiguous, rate NO or PARTIAL. Never overstate or guess.
- "url": source page URL the quote came from; "" if none.
Return STRICTLY the JSON schema. One entry per prompt, same order.`

function recSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['answers'],
    properties: { answers: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['index', 'readiness', 'evidence', 'missing', 'url', 'confidence'],
      properties: {
        index: { type: 'integer' }, readiness: { type: 'string', enum: ['YES', 'PARTIAL', 'NO'] },
        evidence: { type: 'string' }, missing: { type: 'string' }, url: { type: 'string' }, confidence: { type: 'integer' },
      },
    } } },
  }
}
async function runReadiness(prompts: any[], pages: any[], openaiKey: string) {
  if (!prompts.length || !pages.length) return []
  const corpus = pages.map(p => `URL: ${p.url}\nHEADINGS: ${(p.headings || []).slice(0, 12).join(' | ')}\nTEXT: ${(p.text || '').slice(0, 1500)}`).join('\n\n---\n\n')
  const pList = prompts.map((q, i) => `[${i}] ${q.question}`).join('\n')
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
  const fb = () => prompts.map(q => ({ question: q.question, category: q.category || null, priority: q.priority || 'medium', readiness: 'NO', evidence: '', missing: 'Not evaluated', url: '', confidence: 0 }))
  if (!c) return fb()
  let parsed: any; try { parsed = JSON.parse(c) } catch { return fb() }
  const byIdx = new Map<number, any>(); for (const a of (parsed.answers || [])) byIdx.set(a.index, a)
  return prompts.map((q, i) => {
    const a = byIdx.get(i) || {}; const ev = (a.evidence || '').trim()
    let readiness = a.readiness === 'YES' || a.readiness === 'PARTIAL' ? a.readiness : 'NO'
    if ((readiness === 'YES' || readiness === 'PARTIAL') && ev.length === 0) readiness = 'NO'
    let conf = Number.isFinite(a.confidence) ? Math.max(0, Math.min(100, a.confidence)) : 0
    if (readiness === 'NO') conf = Math.min(conf, 20)
    return { question: q.question, category: q.category || null, priority: q.priority || 'medium', readiness, evidence: readiness === 'NO' ? '' : ev, missing: (a.missing || '').trim(), url: readiness === 'NO' ? '' : (a.url || ''), confidence: conf }
  })
}

// ── per-page bundled GPT (Layers 4+5+6) ────────────────────────────────
const PAGE_SYSTEM = `You are a strict evidence-based auditor analysing ONE hotel web page. Use ONLY the provided text/headings. NEVER infer or use outside knowledge. Report ONLY what is literally present.

Return, for this single page:
- "hasQuickFacts": true if the page contains a compact facts block (e.g. lines like "Parking: Yes", "Occupancy: 2", "View: Lake") — not just prose. Else false.
- "hasAiSummary": true if there is a concise passage stating what the hotel/room IS, WHO it is for, and WHY choose it. Else false.
- "q_what","q_who","q_how","q_why","q_comparison","q_faq": booleans — does the page clearly answer WHAT it is, WHO it's for, HOW it works/booking, WHY choose it, a COMPARISON vs alternatives, and an FAQ section. Only true if genuinely present.
- For room pages also: "room_overview","room_quickfacts","room_occupancy","room_view","room_idealfor","room_comparison","room_faq" booleans.
- "evidence": one short verbatim quote supporting the strongest finding, or "".
No quote-less true claims for hasAiSummary/q_why/room_idealfor — if you cannot find supporting text, mark false.`

function pageSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['hasQuickFacts', 'hasAiSummary', 'q_what', 'q_who', 'q_how', 'q_why', 'q_comparison', 'q_faq', 'room_overview', 'room_quickfacts', 'room_occupancy', 'room_view', 'room_idealfor', 'room_comparison', 'room_faq', 'evidence'],
    properties: {
      hasQuickFacts: { type: 'boolean' }, hasAiSummary: { type: 'boolean' },
      q_what: { type: 'boolean' }, q_who: { type: 'boolean' }, q_how: { type: 'boolean' }, q_why: { type: 'boolean' }, q_comparison: { type: 'boolean' }, q_faq: { type: 'boolean' },
      room_overview: { type: 'boolean' }, room_quickfacts: { type: 'boolean' }, room_occupancy: { type: 'boolean' }, room_view: { type: 'boolean' }, room_idealfor: { type: 'boolean' }, room_comparison: { type: 'boolean' }, room_faq: { type: 'boolean' },
      evidence: { type: 'string' },
    },
  }
}
async function analysePage(pg: any, openaiKey: string) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0, max_tokens: 700,
        response_format: { type: 'json_schema', json_schema: { name: 'page_analysis', strict: true, schema: pageSchema() } },
        messages: [
          { role: 'system', content: PAGE_SYSTEM },
          { role: 'user', content: `PAGE TYPE: ${pg.type}\nURL: ${pg.url}\nHEADINGS: ${(pg.headings || []).join(' | ')}\nTEXT: ${(pg.text || '').slice(0, 4000)}` },
        ],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return null
    return JSON.parse(c)
  } catch { return null }
}

function pct(got: number, max: number) { return max ? Math.round((got / max) * 100) : 0 }
const NA = 'Not assessed from crawled pages'

export async function POST(req: Request) {
  try {
    const { url, city, password, hotelId, hotelType } = await req.json()
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
    if (hotelId && sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data: h } = await sb.from('hotels').select('region, location, category').eq('id', hotelId).single()
        if (h) { effCity = effCity || h.location || h.region || ''; effType = effType || h.category || '' }
      } catch {}
    }

    // 1. crawl homepage + discover broadly
    const homeHtml = await scrape(url, apiKey)
    if (!homeHtml) return NextResponse.json({ error: 'Could not load the website (it may block crawlers or be down).' }, { status: 502 })
    const homeLinks = extractLinks(homeHtml, origin)
    const picked: string[] = [url]
    const seen = new Set([url.replace(/\/$/, '')])
    const byType: Record<string, string[]> = {}
    for (const link of homeLinks) { const t = classify(link); (byType[t] ||= []).push(link) }
    const typeOrder = ['rooms', 'spa', 'dining', 'location', 'knowledge', 'intent', 'family', 'offers', 'meetings', 'faq', 'experiences', 'homepage_or_other']
    let added = true
    while (picked.length < CRAWL_LIMIT && added) {
      added = false
      for (const t of typeOrder) {
        const arr = byType[t]
        if (arr && arr.length) { const next = arr.shift()!; const norm = next.replace(/\/$/, ''); if (!seen.has(norm)) { picked.push(next); seen.add(norm); added = true; if (picked.length >= CRAWL_LIMIT) break } }
      }
    }
    const toScrape = picked.slice(0, CRAWL_LIMIT)

    // 2. scrape + parse + store links per page (for link graph)
    const pages: any[] = []
    for (const pageUrl of toScrape) {
      const html = pageUrl === url ? homeHtml : await scrape(pageUrl, apiKey)
      if (!html) continue
      const meta = extractMeta(html)
      pages.push({
        url: pageUrl, type: classify(pageUrl), schemaTypes: extractSchemaTypes(html),
        headings: extractHeadings(html), metaTitle: meta.title, metaDescription: meta.description,
        text: extractText(html), links: extractLinks(html, origin),
      })
    }
    if (pages.length === 0) return NextResponse.json({ error: 'Could not read any pages.' }, { status: 502 })

    const robots = await fetchRobots(origin)

    // ── aggregate ─────────────────────────────────────────────────────
    const allSchema = new Set<string>()
    for (const p of pages) for (const t of (p.schemaTypes || [])) allSchema.add(t)
    const typesFound = new Set(pages.map(p => p.type))
    const hasType = (t: string) => typesFound.has(t)
    const urlHas = (kw: string) => pages.some(p => p.url.toLowerCase().includes(kw))
    const textHas = (re: RegExp) => pages.some(p => re.test(p.text.toLowerCase()))

    // ── SECTION 1: readiness (1 GPT call) ─────────────────────────────
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

    // ── per-page bundled GPT (Layers 4/5/6) ───────────────────────────
    const pageAnalyses: any[] = []
    for (const pg of pages) {
      const a = await analysePage(pg, openaiKey)
      pageAnalyses.push({ url: pg.url, type: pg.type, schemaTypes: pg.schemaTypes, a })
    }

    // ── LAYER 0: knowledge consistency ────────────────────────────────
    const factTopics = [
      { key: 'Parking', kws: ['parking', 'valet', 'voiturier', 'garage', 'stationnement'] },
      { key: 'Breakfast', kws: ['breakfast', 'petit-déjeuner', 'petit dejeuner', 'petit déjeuner', 'brunch'] },
      { key: 'Pets', kws: ['pet', 'dog', 'animal', 'animaux', 'chien'] },
      { key: 'Accessibility', kws: ['accessible', 'wheelchair', 'step-free', 'disabled', 'accessibilité', 'mobilité réduite', 'pmr'] },
      { key: 'Airport transfer', kws: ['airport transfer', 'transfert aéroport', 'shuttle', 'navette', 'limousine'] },
    ]
    const layer0 = factTopics.map(t => {
      const onPages = pages.filter(p => t.kws.some(k => p.text.toLowerCase().includes(k))).map(p => p.url)
      const dedicated = pages.find(p => t.kws.some(k => p.url.toLowerCase().includes(k)))
      let status: string, note: string
      if (onPages.length === 0) { status = 'Missing'; note = 'No mention found on crawled pages.' }
      else if (dedicated) { status = 'Single source'; note = `Dedicated page: ${(() => { try { return new URL(dedicated.url).pathname } catch { return dedicated.url } })()}` }
      else if (onPages.length >= 3) { status = 'Scattered'; note = `Mentioned across ${onPages.length} pages, no dedicated page.` }
      else { status = 'Present'; note = `Mentioned on ${onPages.length} page(s).` }
      return { topic: t.key, status, note }
    })

    // ── LAYER 1: core structure ───────────────────────────────────────
    const coreDefs = [
      { label: 'Homepage', present: true }, { label: 'Rooms', present: hasType('rooms') }, { label: 'Dining', present: hasType('dining') },
      { label: 'Spa', present: hasType('spa') }, { label: 'Location / Contact', present: hasType('location') },
      { label: 'Offers', present: hasType('offers') }, { label: 'Meetings & Events', present: hasType('meetings') },
    ]
    const coreScore = pct(coreDefs.filter(c => c.present).length, coreDefs.length)

    // ── LAYER 2: intent hub ───────────────────────────────────────────
    const intentDefs = ['family', 'romantic', 'business', 'spa', 'luxury', 'pet-friendly', 'accessible', 'parking', 'airport', 'view']
    const intentFound = intentDefs.filter(t => urlHas(t))
    const intentScore = pct(intentFound.length, intentDefs.length)

    // ── LAYER 3: knowledge center ─────────────────────────────────────
    const kcDefs = ['parking', 'breakfast', 'pets', 'accessibility', 'airport', 'check-in', 'cancellation', 'faq']
    const kcFound = kcDefs.filter(k => urlHas(k) || (k === 'faq' && hasType('faq')))
    const kcScore = pct(kcFound.length, kcDefs.length)

    // ── LAYER 4: room intelligence (only crawled room pages) ──────────
    const roomPages = pageAnalyses.filter(p => p.type === 'rooms' && p.a)
    const roomFields = ['room_overview', 'room_quickfacts', 'room_occupancy', 'room_view', 'room_idealfor', 'room_comparison', 'room_faq']
    const layer4 = {
      evaluated: roomPages.length,
      rooms: roomPages.map(p => {
        const present = roomFields.filter(f => p.a[f])
        return { url: p.url, score: pct(present.length, roomFields.length), present: present.map(f => f.replace('room_', '')), missing: roomFields.filter(f => !p.a[f]).map(f => f.replace('room_', '')) }
      }),
      note: roomPages.length ? `Evaluated ${roomPages.length} room page(s) reached during crawl.` : NA,
    }
    const layer4Score = roomPages.length ? Math.round(layer4.rooms.reduce((s, r) => s + r.score, 0) / roomPages.length) : null

    // ── LAYER 5: retrieval blocks (per crawled page) ──────────────────
    const withA = pageAnalyses.filter(p => p.a)
    const qfCount = withA.filter(p => p.a.hasQuickFacts).length
    const sumCount = withA.filter(p => p.a.hasAiSummary).length
    const layer5Score = withA.length ? pct(qfCount + sumCount, withA.length * 2) : null

    // ── LAYER 6: question architecture (per crawled page) ─────────────
    const qFields = ['q_what', 'q_who', 'q_how', 'q_why', 'q_comparison', 'q_faq']
    const layer6PerPage = withA.map(p => ({ url: p.url, type: p.type, present: qFields.filter(f => p.a[f]).map(f => f.replace('q_', '')), missing: qFields.filter(f => !p.a[f]).map(f => f.replace('q_', '')) }))
    const layer6Score = withA.length ? pct(withA.reduce((s, p) => s + qFields.filter(f => p.a[f]).length, 0), withA.length * qFields.length) : null

    // ── LAYER 7: entities ─────────────────────────────────────────────
    const entityHits = (() => {
      const joined = pages.map(p => p.text).join(' ')
      const re = /\b([A-Z][a-zà-ÿ]+(?:\s+(?:[A-Z][a-zà-ÿ]+|de|du|des|d'|la|le))*)\b/g
      const stop = new Set(['The', 'This', 'Our', 'We', 'You', 'Your', 'Hotel', 'Book', 'Home', 'Rooms', 'Spa', 'Dining', 'Contact', 'Welcome', 'Discover'])
      const found = new Set<string>(); let m
      while ((m = re.exec(joined)) !== null) { const tok = m[1].trim(); if (tok.length > 4 && tok.includes(' ') && !stop.has(tok.split(' ')[0])) found.add(tok) }
      return found.size
    })()
    const entityLevel = entityHits >= 12 ? 'Entity Rich' : entityHits >= 5 ? 'Entity Moderate' : 'Entity Weak'

    // ── LAYER 8: recommendation content ───────────────────────────────
    const recDefs = [
      { label: 'Best room for couples', present: textHas(/best.{0,20}(couple|romantic)|room for couples|romantic suite/) },
      { label: 'Best room for families', present: textHas(/family room|connecting room|room for families/) },
      { label: 'Best room for business', present: textHas(/business room|executive room|room for business/) },
      { label: 'Best spa experience', present: textHas(/signature treatment|spa experience|signature ritual/) },
      { label: 'Best lake-view room', present: textHas(/lake.?view|view room|panoramic view/) },
    ]
    const layer8Found = recDefs.filter(d => d.present).map(d => d.label)

    // ── LAYER 9: local expertise ──────────────────────────────────────
    const localDefs = [
      { label: 'Things to do', present: textHas(/things to do|what to do|discover geneva|explore/) || hasType('experiences') },
      { label: 'Local guide', present: textHas(/local guide|insider|neighbourhood guide|area guide/) },
      { label: 'Family activities', present: textHas(/family activities|for children|kids activities/) },
      { label: 'Romantic activities', present: textHas(/romantic experience|couples experience/) },
      { label: 'Business guide', present: textHas(/business guide|business travel/) },
      { label: 'Restaurant guide', present: textHas(/restaurant guide|where to eat|dining guide/) },
    ]
    const layer9Found = localDefs.filter(d => d.present).map(d => d.label)

    // ── LAYER 10: trust signals ───────────────────────────────────────
    const hasReviewSchema = allSchema.has('AggregateRating') || allSchema.has('Review')
    const trustText = pages.map(p => p.text.toLowerCase()).join(' ')
    const trust = {
      reviewSchema: hasReviewSchema,
      awards: /\b(forbes|michelin|award|recognition|voted|best hotel)\b/.test(trustText),
      ratings: /\b(rated|rating|stars|tripadvisor|5-star|five-star)\b/.test(trustText),
    }
    const layer10Score = (trust.reviewSchema ? 40 : 0) + (trust.awards ? 30 : 0) + (trust.ratings ? 30 : 0)

    // ── LAYER 11: internal link graph (real, among crawled pages) ─────
    const crawledNorm = new Set(pages.map(p => p.url.replace(/\/$/, '')))
    const clusterDefs: Record<string, string[]> = {
      Family: ['family', 'kids', 'children', 'famille'], Couples: ['romantic', 'couple', 'honeymoon'],
      Spa: ['spa', 'wellness'], Dining: ['restaurant', 'dining', 'gastro'], Business: ['meeting', 'business', 'conference', 'event'],
    }
    const linkGraph = Object.entries(clusterDefs).map(([name, kws]) => {
      const clusterPages = pages.filter(p => kws.some(k => p.url.toLowerCase().includes(k)))
      let internalEdges = 0
      for (const p of pages) {
        for (const l of (p.links || [])) {
          const ln = l.replace(/\/$/, '')
          if (crawledNorm.has(ln) && ln !== p.url.replace(/\/$/, '') && kws.some(k => ln.toLowerCase().includes(k))) internalEdges++
        }
      }
      const strength = clusterPages.length === 0 ? 'Weak' : internalEdges >= 4 ? 'Strong' : internalEdges >= 1 ? 'Moderate' : 'Weak'
      return { cluster: name, pages: clusterPages.length, internalEdges, strength }
    })

    // ── LAYER 12: schema ──────────────────────────────────────────────
    const schemaDefs = ['Hotel', 'HotelRoom', 'FAQPage', 'Review', 'AggregateRating', 'Restaurant', 'Offer', 'Event', 'BreadcrumbList']
    const schemaFound = schemaDefs.filter(s => allSchema.has(s) || (s === 'Hotel' && allSchema.has('LodgingBusiness')))
    const schemaScore = pct(schemaFound.length, schemaDefs.length)

    // ── LAYER 13: answer library (crawled only) ───────────────────────
    const faqSchemaCount = allSchema.has('FAQPage') ? 1 : 0
    const faqTextHits = pages.reduce((s, p) => s + (p.text.match(/\?/g) || []).length, 0)
    const answerableFacts = layer0.filter(l => l.status === 'Single source' || l.status === 'Present').length
    const libLevel = (faqSchemaCount && faqTextHits > 20) ? 'Strong' : (faqTextHits > 8 || faqSchemaCount) ? 'Moderate' : 'Weak'

    // ── PAGE-BY-PAGE ──────────────────────────────────────────────────
    const expectedByType: Record<string, string[]> = {
      rooms: roomFields, homepage_or_other: qFields, dining: qFields, spa: qFields, location: ['q_what', 'q_how'], faq: ['q_faq'], offers: ['q_what', 'q_why'], meetings: qFields, intent: qFields, knowledge: ['q_what', 'q_how'], family: qFields, experiences: ['q_what', 'q_who'],
    }
    const pageByPage = pageAnalyses.map(p => {
      const exp = expectedByType[p.type] || qFields
      const present = p.a ? exp.filter(f => p.a[f]) : []
      const missing = p.a ? exp.filter(f => !p.a[f]) : exp
      return {
        url: p.url, type: p.type, score: p.a ? pct(present.length, exp.length) : null,
        present: present.map(f => f.replace('q_', '').replace('room_', '')),
        missing: missing.map(f => f.replace('q_', '').replace('room_', '')),
        quickFacts: p.a ? p.a.hasQuickFacts : null, aiSummary: p.a ? p.a.hasAiSummary : null,
        schemaTypes: p.schemaTypes,
      }
    })

    const verdictPF = (n: number | null) => n === null ? NA : n >= 75 ? 'PASS' : n >= 40 ? 'PARTIAL' : 'FAIL'

    const architectureScore = Math.round(
      coreScore * 0.18 + kcScore * 0.14 + intentScore * 0.10 + schemaScore * 0.16 +
      Math.min(100, entityHits * 8) * 0.08 + layer10Score * 0.08 +
      (layer4Score ?? 0) * 0.08 + (layer5Score ?? 0) * 0.08 + (layer6Score ?? 0) * 0.10
    )
    const verdict = architectureScore >= 75 ? 'Strong AI architecture' : architectureScore >= 50 ? 'Partial AI architecture' : 'Weak AI architecture'

    const layers = [
      { n: 0, layer: 'Knowledge consistency', result: layer0.every(l => l.status === 'Single source') ? 'PASS' : layer0.some(l => l.status === 'Scattered' || l.status === 'Missing') ? 'PARTIAL' : 'PARTIAL', detail: layer0 },
      { n: 1, layer: 'Core structure', result: verdictPF(coreScore), score: coreScore, present: coreDefs.filter(c => c.present).map(c => c.label), missing: coreDefs.filter(c => !c.present).map(c => c.label) },
      { n: 2, layer: 'AI intent hub', result: verdictPF(intentScore), score: intentScore, present: intentFound, missing: intentDefs.filter(t => !intentFound.includes(t)) },
      { n: 3, layer: 'Knowledge center', result: verdictPF(kcScore), score: kcScore, present: kcFound, missing: kcDefs.filter(k => !kcFound.includes(k)) },
      { n: 4, layer: 'Room intelligence', result: layer4Score === null ? NA : verdictPF(layer4Score), score: layer4Score, detail: layer4 },
      { n: 5, layer: 'AI retrieval blocks', result: layer5Score === null ? NA : verdictPF(layer5Score), score: layer5Score, note: withA.length ? `${qfCount}/${withA.length} pages have a Quick-Facts block; ${sumCount}/${withA.length} have an AI summary.` : NA },
      { n: 6, layer: 'Question architecture', result: layer6Score === null ? NA : verdictPF(layer6Score), score: layer6Score, perPage: layer6PerPage },
      { n: 7, layer: 'Entity coverage', result: entityLevel === 'Entity Rich' ? 'PASS' : entityLevel === 'Entity Moderate' ? 'PARTIAL' : 'FAIL', level: entityLevel, count: entityHits },
      { n: 8, layer: 'Recommendation content', result: layer8Found.length >= 3 ? 'PASS' : layer8Found.length >= 1 ? 'PARTIAL' : 'FAIL', present: layer8Found, missing: recDefs.filter(d => !d.present).map(d => d.label) },
      { n: 9, layer: 'Local expertise', result: layer9Found.length >= 3 ? 'PASS' : layer9Found.length >= 1 ? 'PARTIAL' : 'FAIL', present: layer9Found, missing: localDefs.filter(d => !d.present).map(d => d.label) },
      { n: 10, layer: 'Trust signals', result: layer10Score >= 70 ? 'PASS' : layer10Score >= 30 ? 'PARTIAL' : 'FAIL', present: [trust.reviewSchema && 'Review/Rating schema', trust.awards && 'Awards/recognition', trust.ratings && 'Ratings mentioned'].filter(Boolean), missing: [!trust.reviewSchema && 'Review/AggregateRating schema', !trust.awards && 'Awards', !trust.ratings && 'Ratings'].filter(Boolean) },
      { n: 11, layer: 'Internal linking', result: linkGraph.some(c => c.strength === 'Strong') ? 'PASS' : linkGraph.some(c => c.strength === 'Moderate') ? 'PARTIAL' : 'FAIL', clusters: linkGraph, note: 'Clusters assessed among crawled pages only — a Weak verdict can mean the cluster pages were not reached in the crawl.' },
      { n: 12, layer: 'Schema', result: verdictPF(schemaScore), score: schemaScore, present: schemaFound, missing: schemaDefs.filter(s => !schemaFound.includes(s)) },
      { n: 13, layer: 'AI answer library', result: libLevel === 'Strong' ? 'PASS' : libLevel === 'Moderate' ? 'PARTIAL' : 'FAIL', level: libLevel, note: `Counted from crawled pages only: FAQ schema ${faqSchemaCount ? 'present' : 'absent'}, ${faqTextHits} question marks in text, ${answerableFacts} core facts answerable.` },
    ]

    const notAssessed: string[] = []
    if (layer4Score === null) notAssessed.push('Layer 4 Room intelligence — no room pages reached in crawl')
    notAssessed.push('Full-site coverage beyond the 18 crawled pages (uncrawled pages are never assumed)')

    const result = {
      url, city: effCity || null, hotelType: effType || null,
      recommendation: { score: recScore, yes: yesN, partial: partialN, no: noN, total: readiness.length, results: readiness },
      architectureScore, verdict,
      layers, pageByPage, linkGraph, notAssessed,
      robots, crawlDepth: pages.length, crawlLimit: CRAWL_LIMIT,
      pagesScraped: pages.map(p => ({ url: p.url, type: p.type })),
    }

    if (hotelId && sbUrl && sbKey) {
      try { const sb = createClient(sbUrl, sbKey); await sb.from('hotel_audits').insert({ hotel_id: hotelId, url, overall: architectureScore, result }) } catch {}
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Audit failed' }, { status: 500 })
  }
}