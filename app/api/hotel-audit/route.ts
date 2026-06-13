import { NextResponse } from 'next/server'

export const maxDuration = 300

// ── crawl + parse helpers ─────────────────────────────────────────────
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
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000)
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
  // AI + search crawlers that matter; report whether each is blocked from the site root
  const bots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot']
  try {
    const res = await fetch(origin + '/robots.txt')
    if (!res.ok) return { found: false, blocked: [] as string[], allowed: bots }
    const txt = (await res.text()).toLowerCase()
    // crude but effective: a bot is "blocked" if its group (or *) has Disallow: /
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

// ── page classification (cheap, URL-keyword based) ────────────────────
const PAGE_KEYWORDS: Record<string, string[]> = {
  rooms: ['room', 'suite', 'accommodation', 'chambre', 'zimmer', 'stay'],
  dining: ['restaurant', 'dining', 'dine', 'bar', 'gastro', 'cuisine', 'food'],
  spa: ['spa', 'wellness', 'fitness', 'pool', 'bien-etre', 'bien-être'],
  location: ['location', 'directions', 'getting-here', 'map', 'area', 'contact', 'where'],
  offers: ['offer', 'package', 'special', 'deal', 'promotion'],
  family: ['family', 'kids', 'children', 'famille'],
  meetings: ['meeting', 'event', 'conference', 'banquet', 'wedding', 'mice'],
  faq: ['faq', 'questions', 'help'],
  experiences: ['experience', 'activities', 'things-to-do', 'discover'],
}
function classify(url: string): string {
  const p = url.toLowerCase()
  for (const [type, kws] of Object.entries(PAGE_KEYWORDS)) if (kws.some(k => p.includes(k))) return type
  return 'other'
}

// ── per-page AI detection (presence/absence + evidence only) ──────────
const CONTENT_CHECKS = [
  'room_detail', 'amenities_explained', 'parking', 'parking_detail', 'breakfast',
  'check_in_out', 'pets', 'family_suitability', 'accessibility', 'airport_transfer_or_distance',
  'location_nearby_attractions', 'languages', 'cancellation_policy', 'couples_intent',
  'family_intent', 'business_intent', 'wellness_spa_content', 'dining_content',
  'booking_cta', 'direct_booking_benefit',
  // facility presence — used to decide which categories FIT this hotel (not type-picked)
  'has_spa_facility', 'has_meeting_facility', 'has_kids_facility', 'has_notable_dining',
  'has_lakefront_or_view', 'is_luxury_or_5star',
]
const EXTRACT_SYSTEM = `You are a detection engine for hotel websites. For ONE page you report only what is literally present in the data given (visible text, headings, meta, JSON-LD). You NEVER infer or guess. For each content check return present true/false; if true, include a SHORT exact quote as evidence. "Intent" checks (couples_intent, family_intent, business_intent) mean the page has assembled content that directly addresses that traveller type — not just isolated facts. This is detection only — give NO advice.`
function extractSchemaSpec() {
  return {
    name: 'page_detection',
    schema: {
      type: 'object', additionalProperties: false,
      required: ['pageType', 'hasFAQ', 'metaTitlePresent', 'metaDescriptionPresent', 'checks'],
      properties: {
        pageType: { type: 'string' },
        hasFAQ: { type: 'boolean' },
        metaTitlePresent: { type: 'boolean' },
        metaDescriptionPresent: { type: 'boolean' },
        checks: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            required: ['key', 'present', 'evidence'],
            properties: {
              key: { type: 'string', enum: CONTENT_CHECKS },
              present: { type: 'boolean' },
              evidence: { type: 'string' },
            },
          },
        },
      },
    },
  }
}
async function detectPage(pg: any, apiKey: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o', temperature: 0.1, max_tokens: 4000,
      response_format: { type: 'json_schema', json_schema: { name: 'page_detection', strict: true, schema: extractSchemaSpec().schema } },
      messages: [
        { role: 'system', content: EXTRACT_SYSTEM },
        { role: 'user', content: `Check ALL of these keys for THIS page (return one entry per key): ${CONTENT_CHECKS.join(', ')}.\n\nPAGE:\n${JSON.stringify(pg, null, 2)}` },
      ],
    }),
  })
  const data = await res.json()
  const c = data?.choices?.[0]?.message?.content
  if (!c) return null
  try { return JSON.parse(c) } catch { return null }
}

// ── scoring (deterministic, in code) ──────────────────────────────────
function pct(got: number, max: number) { return max ? Math.round((got / max) * 100) : 0 }

export async function POST(req: Request) {
  try {
    const { url, city, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!url) return NextResponse.json({ error: 'Enter a website URL' }, { status: 400 })
    const apiKey = process.env.SCRAPINGBEE_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    if (!apiKey || !openaiKey) return NextResponse.json({ error: 'API keys not set' }, { status: 500 })

    let origin = ''
    try { origin = new URL(url).origin } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }

    // 1. crawl homepage, discover key pages
    const homeHtml = await scrape(url, apiKey)
    if (!homeHtml) return NextResponse.json({ error: 'Could not load the website (it may block crawlers or be down).' }, { status: 502 })
    const homeLinks = extractLinks(homeHtml, origin)
    const picked: Record<string, string> = {}
    for (const link of homeLinks) {
      const t = classify(link)
      if (t !== 'other' && !picked[t]) picked[t] = link
    }
    const priority = ['rooms', 'spa', 'dining', 'location', 'family', 'offers', 'meetings', 'faq', 'experiences']
    const toScrape = [url, ...priority.map(t => picked[t]).filter(Boolean)].slice(0, 7)

    // 2. scrape + parse each page
    const pages: any[] = []
    for (const pageUrl of toScrape) {
      const html = pageUrl === url ? homeHtml : await scrape(pageUrl, apiKey)
      if (!html) continue
      const meta = extractMeta(html)
      pages.push({
        url: pageUrl,
        schemaTypes: extractSchemaTypes(html),
        headings: extractHeadings(html),
        metaTitle: meta.title,
        metaDescription: meta.description,
        text: extractText(html),
      })
    }
    if (pages.length === 0) return NextResponse.json({ error: 'Could not read any pages.' }, { status: 502 })

    // 3. robots.txt
    const robots = await fetchRobots(origin)

    // 4. per-page detection
    const detected: any[] = []
    for (const pg of pages) {
      const d = await detectPage(pg, openaiKey)
      detected.push({ url: pg.url, schemaTypes: pg.schemaTypes, ...(d || { pageType: classify(pg.url), hasFAQ: false, metaTitlePresent: !!pg.metaTitle, metaDescriptionPresent: !!pg.metaDescription, checks: [] }) })
    }

    // 5. aggregate site-level signals (OR across pages)
    const has = (key: string) => detected.some(p => (p.checks || []).some((c: any) => c.key === key && c.present))
    const allSchemaTypes = new Set<string>()
    for (const p of detected) for (const t of (p.schemaTypes || [])) allSchemaTypes.add(t)
    const pageTypesFound = new Set(detected.map(p => classify(p.url)))
    const s = {
      // content
      room_detail: has('room_detail'), amenities_explained: has('amenities_explained'),
      parking: has('parking'), parking_detail: has('parking_detail'), breakfast: has('breakfast'),
      check_in_out: has('check_in_out'), pets: has('pets'), family_suitability: has('family_suitability'),
      accessibility: has('accessibility'), airport_transfer: has('airport_transfer_or_distance'),
      location_nearby: has('location_nearby_attractions'), languages: has('languages'),
      cancellation: has('cancellation_policy'), dining_content: has('dining_content'),
      wellness_spa: has('wellness_spa_content'),
      // intent
      couples_intent: has('couples_intent'), family_intent: has('family_intent'), business_intent: has('business_intent'),
      // ai readiness
      hasFAQ: detected.some(p => p.hasFAQ) || allSchemaTypes.has('FAQPage'),
      // schema
      hotelSchema: allSchemaTypes.has('Hotel') || allSchemaTypes.has('LodgingBusiness'),
      faqSchema: allSchemaTypes.has('FAQPage'), roomSchema: allSchemaTypes.has('HotelRoom'),
      breadcrumb: allSchemaTypes.has('BreadcrumbList'),
      ratingSchema: allSchemaTypes.has('AggregateRating') || allSchemaTypes.has('Review'),
      // technical
      robotsOk: robots.blocked.length === 0,
      metaTitles: pct(detected.filter(p => p.metaTitlePresent).length, detected.length) >= 80,
      metaDescs: pct(detected.filter(p => p.metaDescriptionPresent).length, detected.length) >= 80,
      internalLinking: ['rooms', 'spa', 'dining', 'location'].filter(t => picked[t]).length >= 3,
      multiPage: detected.length >= 4,
      // conversion
      booking_cta: has('booking_cta'), direct_benefit: has('direct_booking_benefit'),
      // page presence
      hasRoomsPage: pageTypesFound.has('rooms'), hasSpaPage: pageTypesFound.has('spa'),
      hasDiningPage: pageTypesFound.has('dining'), hasLocationPage: pageTypesFound.has('location'),
      hasFamilyPage: pageTypesFound.has('family'),
      // which categories this hotel genuinely FITS (detected, not picked)
      fitSpa: has('has_spa_facility') || has('wellness_spa_content') || pageTypesFound.has('spa'),
      fitFamily: has('has_kids_facility') || has('family_suitability'),
      fitBusiness: has('has_meeting_facility') || pageTypesFound.has('meetings'),
      fitDining: has('has_notable_dining') || has('dining_content'),
      fitCouples: has('has_lakefront_or_view') || has('has_spa_facility') || has('is_luxury_or_5star'),
      fitLuxury: has('is_luxury_or_5star'),
    }

    // 6. score the 5 weighted areas (each 0-100)
    const technical = pct(
      (s.robotsOk ? 40 : 0) + (s.metaTitles ? 15 : 0) + (s.metaDescs ? 15 : 0) + (s.internalLinking ? 20 : 0) + (s.multiPage ? 10 : 0), 100)
    const content = pct(
      (s.room_detail ? 15 : 0) + (s.amenities_explained ? 10 : 0) + (s.parking ? 5 : 0) + (s.parking_detail ? 5 : 0) +
      (s.breakfast ? 5 : 0) + (s.check_in_out ? 5 : 0) + (s.pets ? 5 : 0) + (s.accessibility ? 5 : 0) +
      (s.airport_transfer ? 5 : 0) + (s.location_nearby ? 10 : 0) + (s.languages ? 5 : 0) + (s.cancellation ? 5 : 0) +
      (s.dining_content ? 8 : 0) + (s.wellness_spa ? 7 : 0), 100)
    const aiReady = pct(
      (s.hasFAQ ? 30 : 0) + (s.couples_intent ? 18 : 0) + (s.family_intent ? 18 : 0) + (s.business_intent ? 18 : 0) + (s.location_nearby ? 16 : 0), 100)
    const schema = pct(
      (s.hotelSchema ? 35 : 0) + (s.faqSchema ? 25 : 0) + (s.roomSchema ? 15 : 0) + (s.breadcrumb ? 10 : 0) + (s.ratingSchema ? 15 : 0), 100)
    const conversion = pct(
      (s.booking_cta ? 55 : 0) + (s.direct_benefit ? 25 : 0) + (allSchemaTypes.has('Hotel') || s.booking_cta ? 20 : 0), 100)

    const overall = Math.round(technical * 0.20 + content * 0.30 + aiReady * 0.25 + schema * 0.15 + conversion * 0.10)
    const areas = [
      { key: 'technical', label: 'Technical & crawlability', score: technical, weight: 20 },
      { key: 'content', label: 'Hotel content completeness', score: content, weight: 30 },
      { key: 'aiReady', label: 'AI answer readiness', score: aiReady, weight: 25 },
      { key: 'schema', label: 'Schema & trust signals', score: schema, weight: 15 },
      { key: 'conversion', label: 'Conversion clarity', score: conversion, weight: 10 },
    ]

    // 7. fixed checklist for display (✓/✗ like SchemaTab)
    const checklist = [
      { area: 'Technical', item: 'AI & search crawlers allowed (robots.txt)', ok: s.robotsOk, detail: robots.blocked.length ? `Blocked: ${robots.blocked.join(', ')}` : 'All major bots allowed' },
      { area: 'Technical', item: 'Homepage links to key pages', ok: s.internalLinking, detail: '' },
      { area: 'Technical', item: 'Page titles & descriptions present', ok: s.metaTitles && s.metaDescs, detail: '' },
      { area: 'Content', item: 'Room types described', ok: s.room_detail, detail: '' },
      { area: 'Content', item: 'Amenities explained', ok: s.amenities_explained, detail: '' },
      { area: 'Content', item: 'Parking answered', ok: s.parking, detail: s.parking_detail ? 'With detail' : (s.parking ? 'Mentioned, no detail' : '') },
      { area: 'Content', item: 'Breakfast answered', ok: s.breakfast, detail: '' },
      { area: 'Content', item: 'Check-in / check-out times', ok: s.check_in_out, detail: '' },
      { area: 'Content', item: 'Pet policy', ok: s.pets, detail: '' },
      { area: 'Content', item: 'Accessibility', ok: s.accessibility, detail: '' },
      { area: 'Content', item: 'Airport transfer / distance', ok: s.airport_transfer, detail: '' },
      { area: 'Content', item: 'Location & nearby attractions', ok: s.location_nearby, detail: '' },
      { area: 'Content', item: 'Languages spoken', ok: s.languages, detail: '' },
      { area: 'Content', item: 'Cancellation policy', ok: s.cancellation, detail: '' },
      { area: 'AI readiness', item: 'FAQ content on site', ok: s.hasFAQ, detail: '' },
      { area: 'AI readiness', item: 'Couples / honeymoon content', ok: s.couples_intent, detail: '' },
      { area: 'AI readiness', item: 'Family content', ok: s.family_intent, detail: '' },
      { area: 'AI readiness', item: 'Business / meetings content', ok: s.business_intent, detail: '' },
      { area: 'Schema', item: 'Hotel schema', ok: s.hotelSchema, detail: '' },
      { area: 'Schema', item: 'FAQ schema', ok: s.faqSchema, detail: '' },
      { area: 'Schema', item: 'Room schema', ok: s.roomSchema, detail: '' },
      { area: 'Schema', item: 'Breadcrumb schema', ok: s.breadcrumb, detail: '' },
      { area: 'Schema', item: 'Rating / review schema', ok: s.ratingSchema, detail: '' },
      { area: 'Conversion', item: 'Clear booking CTA', ok: s.booking_cta, detail: '' },
      { area: 'Conversion', item: 'Direct-booking benefit stated', ok: s.direct_benefit, detail: '' },
    ]

    // 8. rule-based recommendations (deterministic IF/THEN; never invents values)
    const C = city || 'the city'
    const recs: any[] = []
    const add = (priority: string, area: string, title: string, why: string, include: string[]) => recs.push({ priority, area, title, why, include })

    if (!s.robotsOk) add('Critical', 'Technical', `Allow AI crawlers in robots.txt`, `${robots.blocked.join(', ')} are blocked — AI assistants literally cannot read the site, so nothing else can help until this is fixed.`, ['Remove the Disallow rules for these agents', 'Allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot'])
    if (!s.hotelSchema) add('Critical', 'Schema', `Add Hotel schema (JSON-LD)`, `Without Hotel schema, AI cannot reliably identify the property as a hotel entity in ${C}.`, ['name, description, address, geo', 'starRating, telephone, image', 'priceRange, amenityFeature'])
    if (!s.hasFAQ) add('Critical', 'AI readiness', `Add an FAQ section with FAQPage schema`, `FAQ content is the format AI most directly quotes when answering guest questions.`, ['Parking, check-in/out, breakfast, pets, cancellation', 'Couples, family and business suitability', 'Wrap in FAQPage schema'])
    if (!s.parking) add('High', 'Content', `Answer parking clearly` + (s.hasLocationPage ? '' : ` (add to a location page)`), `Parking is one of the most common hotel questions AI is asked and the site doesn't answer it.`, ['Whether parking is available', 'Price and reservation rules', 'Valet, EV charging, height limit', 'Nearby alternatives'])
    else if (!s.parking_detail) add('Medium', 'Content', `Expand parking detail`, `Parking is mentioned but lacks the specifics AI needs to answer confidently.`, ['Price', 'Valet / self', 'EV charging', 'Height limit'])
    if (!s.check_in_out) add('High', 'Content', `State check-in and check-out times`, `A top-asked factual question AI currently can't answer from the site.`, ['Check-in time', 'Check-out time', 'Early check-in / late check-out options'])
    if (s.fitCouples && !s.couples_intent) add('High', 'AI readiness', `Create couples / honeymoon content`, `This hotel has the ingredients for romantic searches ("romantic hotel ${C}", "honeymoon ${C}") but never assembles them into an answer AI can quote.`, ['A dedicated section or FAQ "Is [hotel] good for couples?"', 'Name the suites, dining and spa that support it', 'Target the romantic search phrasing'])
    if (s.fitFamily && !s.family_intent) add('High', 'AI readiness', `Create family content`, `The hotel has family facilities but no assembled answer for "family hotel ${C}" searches.`, ['Family rooms / connecting rooms', 'Kids facilities and activities', 'An "Is [hotel] family-friendly?" FAQ'])
    if (s.fitBusiness && !s.business_intent) add('Medium', 'AI readiness', `Create business-traveller content`, `Meeting facilities exist but business searches need them assembled with practical detail.`, ['Meeting room capacities', 'Distance to airport / station', 'Business amenities and rates'])
    if (s.fitSpa && !s.wellness_spa) add('High', 'Content', `Create a dedicated spa page targeting "hotel with spa in ${C}"`, `The hotel has a spa but the site lacks dedicated, extractable spa content.`, ['Treatments and signature experiences', 'Opening hours and prices', 'Pool / sauna / hammam', 'FAQs and booking CTA'])
    if (!s.location_nearby) add('High', 'Content', `Strengthen the location page`, `AI can't tie the hotel to ${C} landmarks and "near X" searches without explicit nearby-attraction content.`, ['Distance to airport / station / centre', 'Named nearby attractions', 'Getting-here directions'])
    if (!s.room_detail) add('High', 'Content', `Add detailed room pages`, `Room searches need each room type described for AI to match guests to the right room.`, ['Room types with size, bed, view', 'Per-room descriptions', 'HotelRoom schema'])
    if (!s.roomSchema && s.hasRoomsPage) add('Medium', 'Schema', `Add HotelRoom schema`, `Room pages exist but aren't marked up, so AI extracts them weakly.`, ['HotelRoom type per room', 'bed, occupancy, image'])
    if (!s.ratingSchema) add('Medium', 'Schema', `Add AggregateRating / Review schema`, `Rating signals build AI trust and are missing.`, ['aggregateRating with reviewCount', 'A few Review items'])
    if (!s.breadcrumb) add('Low', 'Schema', `Add BreadcrumbList schema`, `Helps AI understand site structure.`, ['Breadcrumb per page'])
    if (!s.pets) add('Medium', 'Content', `State the pet policy`, `Common AI question the site doesn't answer.`, ['Whether pets are allowed', 'Fees and restrictions'])
    if (!s.accessibility) add('Medium', 'Content', `Add accessibility information`, `A growing AI search category the site is silent on.`, ['Step-free access', 'Accessible rooms', 'Lift access'])
    if (!s.languages) add('Low', 'Content', `List languages spoken`, `Helps international-traveller searches.`, ['Languages the staff speak'])
    if (!s.cancellation) add('Medium', 'Content', `State the cancellation policy`, `Frequently asked; AI quotes it directly when present.`, ['Free-cancellation window', 'Deposit / penalty terms'])
    if (!s.booking_cta) add('High', 'Conversion', `Add a clear, consistent booking CTA`, `AI and guests need an obvious path to book direct on every key page.`, ['A "Book direct" button on homepage and room pages', 'Visible, repeated, above the fold'])
    if (!s.direct_benefit) add('Medium', 'Conversion', `State why to book direct`, `Gives AI a reason to send guests to the official site over OTAs.`, ['Best-rate guarantee', 'Direct-only perks', 'No booking fees'])

    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
    recs.sort((a, b) => order[a.priority] - order[b.priority])

    const verdict = overall >= 75 ? 'Strong AI foundation' : overall >= 50 ? 'A solid base with clear gaps' : 'Major gaps limiting AI visibility'

    return NextResponse.json({
      url, city: C, overall, verdict, areas, checklist,
      recommendations: recs, robots, pagesScraped: detected.map(p => p.url),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Audit failed' }, { status: 500 })
  }
}