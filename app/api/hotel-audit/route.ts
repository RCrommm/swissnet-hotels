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
    if (href.startsWith(origin) || href.includes(host)) links.add(href.split('#')[0].split('?')[0].replace(/\/$/, ''))
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
  rooms: ['room', 'suite', 'accommodation', 'chambre', 'zimmer', 'stay'],
  dining: ['restaurant', 'dining', 'dine', 'bar', 'gastro', 'cuisine', 'food'],
  spa: ['spa', 'wellness', 'fitness', 'pool', 'bien-etre', 'bien-être'],
  location: ['location', 'directions', 'getting-here', 'map', 'area', 'contact', 'where', 'access'],
  offers: ['offer', 'package', 'special', 'deal', 'promotion', 'offre'],
  family: ['family', 'kids', 'children', 'famille'],
  meetings: ['meeting', 'event', 'conference', 'banquet', 'wedding', 'mice'],
  faq: ['faq', 'questions', 'help'],
  experiences: ['experience', 'activities', 'things-to-do', 'discover'],
  intent: ['why-stay', 'romantic', 'business-hotel', 'family-hotel', 'spa-hotel', 'luxury-hotel', 'pet-friendly', 'hotel-with', 'hotel-near'],
  knowledge: ['parking', 'breakfast', 'pets', 'accessibility', 'airport', 'check-in', 'checkin', 'cancellation', 'sustainability'],
}
function classify(url: string): string {
  const p = url.toLowerCase()
  for (const [type, kws] of Object.entries(PAGE_KEYWORDS)) if (kws.some(k => p.includes(k))) return type
  return 'other'
}

// ── PART B: recommendation-readiness (single batched GPT call) ──────────
const QB_SYSTEM = `You are a strict, evidence-based hotel AI-recommendation auditor. You are given the crawled text of pages from ONE hotel website and a list of AI recommendation prompts (e.g. "Best spa hotel in Geneva"). For EACH prompt, decide whether THIS WEBSITE provides enough evidence for an AI system to CONFIDENTLY RECOMMEND this hotel for that prompt.

ABSOLUTE RULES:
- Use ONLY the provided website text. NEVER use outside knowledge about the hotel, the city, competitors, or hotels in general.
- Rate recommendation-readiness as exactly one of: "YES", "PARTIAL", "NO".
  - "YES": the site contains clear, specific, quotable evidence that directly supports recommending the hotel for this prompt.
  - "PARTIAL": some supporting evidence exists but it is thin, generic, or missing a key specific (e.g. mentions a spa but no treatments/positioning; mentions families but no family rooms; says "near the lake" but no view detail).
  - "NO": no clear supporting evidence in the provided text.
- Every YES or PARTIAL MUST include at least one verbatim quote copied from the provided text. No quote = the rating MUST be "NO".
- "missing": one short line stating what specific evidence is absent that would raise the rating. For "YES" it may be "".
- "confidence": integer 0-100, justified BY THE QUOTED EVIDENCE only. NO = 0-20, PARTIAL = 21-60, YES = 61-100. Never report confidence the quote does not support.
- If evidence is ambiguous, rate "NO" or "PARTIAL" — never overstate. Do not guess or assume.
- "url": the source page URL the quote came from (from the provided page list); "" if none.

Return STRICTLY the requested JSON schema. One entry per prompt, in the same order.`

function qbSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['answers'],
    properties: {
      answers: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['index', 'readiness', 'evidence', 'missing', 'url', 'confidence'],
          properties: {
            index: { type: 'integer' },
            readiness: { type: 'string', enum: ['YES', 'PARTIAL', 'NO'] },
            evidence: { type: 'string' },
            missing: { type: 'string' },
            url: { type: 'string' },
            confidence: { type: 'integer' },
          },
        },
      },
    },
  }
}

async function runReadiness(prompts: any[], pages: any[], openaiKey: string) {
  if (!prompts.length || !pages.length) return []
  const corpus = pages.map(p => {
    const heads = (p.headings || []).slice(0, 12).join(' | ')
    const body = (p.text || '').slice(0, 1600)
    return `URL: ${p.url}\nHEADINGS: ${heads}\nTEXT: ${body}`
  }).join('\n\n---\n\n')
  const pList = prompts.map((q, i) => `[${i}] ${q.question}`).join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o', temperature: 0, max_tokens: 4000,
      response_format: { type: 'json_schema', json_schema: { name: 'recommendation_readiness', strict: true, schema: qbSchema() } },
      messages: [
        { role: 'system', content: QB_SYSTEM },
        { role: 'user', content: `WEBSITE PAGES:\n\n${corpus}\n\n────────\nRECOMMENDATION PROMPTS (rate each by index):\n${pList}` },
      ],
    }),
  })
  const data = await res.json()
  const c = data?.choices?.[0]?.message?.content
  const fallback = () => prompts.map(q => ({ question: q.question, category: q.category || null, priority: q.priority || 'medium', readiness: 'NO', evidence: '', missing: 'Not evaluated', url: '', confidence: 0 }))
  if (!c) return fallback()
  let parsed: any
  try { parsed = JSON.parse(c) } catch { return fallback() }
  const byIdx = new Map<number, any>()
  for (const a of (parsed.answers || [])) byIdx.set(a.index, a)
  return prompts.map((q, i) => {
    const a = byIdx.get(i) || {}
    const evidence = (a.evidence || '').trim()
    let readiness = a.readiness === 'YES' || a.readiness === 'PARTIAL' ? a.readiness : 'NO'
    // hard guard: YES/PARTIAL require a quote
    if ((readiness === 'YES' || readiness === 'PARTIAL') && evidence.length === 0) readiness = 'NO'
    let confidence = Number.isFinite(a.confidence) ? Math.max(0, Math.min(100, a.confidence)) : 0
    if (readiness === 'NO') confidence = Math.min(confidence, 20)
    return {
      question: q.question, category: q.category || null, priority: q.priority || 'medium',
      readiness, evidence: readiness === 'NO' ? '' : evidence,
      missing: (a.missing || '').trim(), url: readiness === 'NO' ? '' : (a.url || ''),
      confidence,
    }
  })
}

function pct(got: number, max: number) { return max ? Math.round((got / max) * 100) : 0 }

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

    let effCity = city || ''
    let effType = hotelType || ''
    if (hotelId && sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data: h } = await sb.from('hotels').select('region, location, category').eq('id', hotelId).single()
        if (h) { effCity = effCity || h.location || h.region || ''; effType = effType || h.category || '' }
      } catch {}
    }

    // 1. crawl homepage, discover key pages broadly
    const homeHtml = await scrape(url, apiKey)
    if (!homeHtml) return NextResponse.json({ error: 'Could not load the website (it may block crawlers or be down).' }, { status: 502 })
    const homeLinks = extractLinks(homeHtml, origin)
    const picked: string[] = [url]
    const seen = new Set([url.replace(/\/$/, '')])
    const byType: Record<string, string[]> = {}
    for (const link of homeLinks) { const t = classify(link); (byType[t] ||= []).push(link) }
    const typeOrder = ['rooms', 'spa', 'dining', 'location', 'knowledge', 'intent', 'family', 'offers', 'meetings', 'faq', 'experiences', 'other']
    let added = true
    while (picked.length < CRAWL_LIMIT && added) {
      added = false
      for (const t of typeOrder) {
        const arr = byType[t]
        if (arr && arr.length) {
          const next = arr.shift()!; const norm = next.replace(/\/$/, '')
          if (!seen.has(norm)) { picked.push(next); seen.add(norm); added = true; if (picked.length >= CRAWL_LIMIT) break }
        }
      }
    }
    const toScrape = picked.slice(0, CRAWL_LIMIT)

    // 2. scrape + parse
    const pages: any[] = []
    for (const pageUrl of toScrape) {
      const html = pageUrl === url ? homeHtml : await scrape(pageUrl, apiKey)
      if (!html) continue
      const meta = extractMeta(html)
      pages.push({ url: pageUrl, type: classify(pageUrl), schemaTypes: extractSchemaTypes(html), headings: extractHeadings(html), metaTitle: meta.title, metaDescription: meta.description, text: extractText(html) })
    }
    if (pages.length === 0) return NextResponse.json({ error: 'Could not read any pages.' }, { status: 502 })

    // 3. robots
    const robots = await fetchRobots(origin)

    // 4. aggregate
    const allSchema = new Set<string>()
    for (const p of pages) for (const t of (p.schemaTypes || [])) allSchema.add(t)
    const typesFound = new Set(pages.map(p => p.type))
    const hasType = (t: string) => typesFound.has(t)

    const entityHits = (() => {
      const joined = pages.map(p => p.text).join(' ')
      const re = /\b([A-Z][a-zà-ÿ]+(?:\s+(?:[A-Z][a-zà-ÿ]+|de|du|des|d'|la|le))*)\b/g
      const stop = new Set(['The', 'This', 'Our', 'We', 'You', 'Your', 'Hotel', 'Book', 'Home', 'Rooms', 'Spa', 'Dining', 'Contact', 'Welcome', 'Discover'])
      const found = new Set<string>(); let m
      while ((m = re.exec(joined)) !== null) { const tok = m[1].trim(); if (tok.length > 4 && tok.includes(' ') && !stop.has(tok.split(' ')[0])) found.add(tok) }
      return found.size
    })()
    const entityLevel = entityHits >= 12 ? 'Entity-rich' : entityHits >= 5 ? 'Entity-light' : 'Entity-poor'

    const trustText = pages.map(p => p.text.toLowerCase()).join(' ')
    const hasReviewSchema = allSchema.has('AggregateRating') || allSchema.has('Review')
    const trustMentions = /\b(tripadvisor|forbes|michelin|award|5-star|five-star|guest review|rated)\b/.test(trustText)

    const corePages = [
      { label: 'Homepage', present: true }, { label: 'Rooms / Accommodation', present: hasType('rooms') },
      { label: 'Dining', present: hasType('dining') }, { label: 'Spa / Wellness', present: hasType('spa') },
      { label: 'Location / Contact', present: hasType('location') }, { label: 'Offers', present: hasType('offers') },
      { label: 'Meetings & Events', present: hasType('meetings') },
    ]
    const coreScore = pct(corePages.filter(p => p.present).length, corePages.length)
    const knowledgePages = ['parking', 'breakfast', 'pets', 'accessibility', 'airport', 'check-in', 'cancellation', 'faq']
    const knowledgeFound = knowledgePages.filter(k => pages.some(p => p.url.toLowerCase().includes(k) || (k === 'faq' && p.type === 'faq')))
    const knowledgeScore = pct(knowledgeFound.length, knowledgePages.length)
    const intentTargets = ['family', 'romantic', 'business', 'spa', 'luxury', 'pet-friendly', 'parking', 'airport', 'lake-view']
    const intentFound = intentTargets.filter(t => pages.some(p => p.url.toLowerCase().includes(t)))
    const intentScore = pct(intentFound.length, intentTargets.length)
    const schemaChecks = [
      { key: 'Hotel', present: allSchema.has('Hotel') || allSchema.has('LodgingBusiness') },
      { key: 'HotelRoom', present: allSchema.has('HotelRoom') }, { key: 'FAQPage', present: allSchema.has('FAQPage') },
      { key: 'Restaurant', present: allSchema.has('Restaurant') }, { key: 'Review/AggregateRating', present: hasReviewSchema },
      { key: 'BreadcrumbList', present: allSchema.has('BreadcrumbList') },
    ]
    const schemaScore = pct(schemaChecks.filter(c => c.present).length, schemaChecks.length)
    const verdictPF = (n: number) => n >= 75 ? 'PASS' : n >= 40 ? 'PARTIAL' : 'FAIL'

    const partA = {
      layers: [
        { layer: 'Core website structure', result: verdictPF(coreScore), present: corePages.filter(p => p.present).map(p => p.label), missing: corePages.filter(p => !p.present).map(p => p.label), evidence: `Crawled ${pages.length} pages. Found ${corePages.filter(p => p.present).length}/${corePages.length} core page types.` },
        { layer: 'Knowledge center (single-source fact pages)', result: verdictPF(knowledgeScore), present: knowledgeFound, missing: knowledgePages.filter(k => !knowledgeFound.includes(k)), evidence: knowledgeFound.length ? `Dedicated pages detected for: ${knowledgeFound.join(', ')}.` : 'No dedicated single-topic fact pages detected in crawl.' },
        { layer: 'AI intent hub (recommendation-intent pages)', result: verdictPF(intentScore), present: intentFound, missing: intentTargets.filter(t => !intentFound.includes(t)), evidence: intentFound.length ? `Intent pages detected for: ${intentFound.join(', ')}.` : 'No dedicated intent pages (e.g. /family-hotel, /romantic-hotel) detected in crawl.' },
        { layer: 'Entity coverage', result: entityLevel === 'Entity-rich' ? 'PASS' : entityLevel === 'Entity-light' ? 'PARTIAL' : 'FAIL', present: [`${entityHits} named-entity candidates`], missing: [], evidence: `${entityLevel}: ${entityHits} distinct named entities detected across crawled pages.` },
        { layer: 'Trust signals', result: (hasReviewSchema && trustMentions) ? 'PASS' : (hasReviewSchema || trustMentions) ? 'PARTIAL' : 'FAIL', present: [hasReviewSchema && 'Review/Rating schema', trustMentions && 'Awards/reviews in text'].filter(Boolean) as string[], missing: [!hasReviewSchema && 'No Review/AggregateRating schema', !trustMentions && 'No awards/review mentions'].filter(Boolean) as string[], evidence: `Rating schema ${hasReviewSchema ? 'present' : 'absent'}; trust mentions ${trustMentions ? 'present' : 'absent'}.` },
        { layer: 'Schema markup', result: verdictPF(schemaScore), present: schemaChecks.filter(c => c.present).map(c => c.key), missing: schemaChecks.filter(c => !c.present).map(c => c.key), evidence: `JSON-LD types found: ${[...allSchema].join(', ') || 'none'}.` },
      ],
      notAssessed: [
        'Room intelligence (per-room Overview / Quick Facts / Ideal-For / Comparison)',
        'AI retrieval blocks (Quick Facts / AI-summary blocks per page)',
        'Question architecture (What/Who/How/Why/Comparison per page)',
        'Internal linking clusters (topic-cluster graph)',
        'AI answer library scale (200–500 Q&A coverage)',
        'Local expertise depth (guide pages)',
      ],
    }
    const architectureScore = Math.round(coreScore * 0.25 + knowledgeScore * 0.20 + intentScore * 0.15 + schemaScore * 0.20 + Math.min(100, entityHits * 8) * 0.10 + ((hasReviewSchema ? 60 : 0) + (trustMentions ? 40 : 0)) * 0.10)

    // ── PART B: load Geneva/type prompts, run readiness ─────────────────
    let prompts: any[] = []
    if (sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data } = await sb.from('audit_questions').select('question, city, hotel_type, category, priority, expected_answer_type').eq('active', true)
        const cityL = (effCity || '').toLowerCase(); const typeL = (effType || '').toLowerCase()
        prompts = (data || []).filter((r: any) => (!r.city || r.city.toLowerCase() === cityL) && (!r.hotel_type || r.hotel_type.toLowerCase() === typeL))
      } catch {}
    }
    const readiness = await runReadiness(prompts, pages, openaiKey)
    const yesN = readiness.filter((c: any) => c.readiness === 'YES').length
    const partialN = readiness.filter((c: any) => c.readiness === 'PARTIAL').length
    const noN = readiness.filter((c: any) => c.readiness === 'NO').length
    const totalP = readiness.length
    // weighted recommendation score: YES=1, PARTIAL=0.5, NO=0
    const recScore = totalP ? Math.round(((yesN + partialN * 0.5) / totalP) * 100) : 0

    const verdict = architectureScore >= 75 ? 'Strong AI architecture' : architectureScore >= 50 ? 'Partial AI architecture' : 'Weak AI architecture'

    const result = {
      url, city: effCity || null, hotelType: effType || null,
      architectureScore, verdict, partA,
      recommendation: { score: recScore, yes: yesN, partial: partialN, no: noN, total: totalP, results: readiness },
      robots, pagesScraped: pages.map(p => ({ url: p.url, type: p.type })),
      crawlDepth: pages.length, crawlLimit: CRAWL_LIMIT,
    }

    if (hotelId && sbUrl && sbKey) {
      try { const sb = createClient(sbUrl, sbKey); await sb.from('hotel_audits').insert({ hotel_id: hotelId, url, overall: architectureScore, result }) } catch {}
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Audit failed' }, { status: 500 })
  }
}