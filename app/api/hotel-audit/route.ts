import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyGap, honestFindingTitle, inferTopic } from '@/lib/evidence'
import { buildInventory } from '@/lib/page-discovery'
import { buildDemandModel } from '@/lib/demand'
import { EXPERIENCE_BY_KEY } from '@/lib/experiences'
import { intentsToEvaluate, getCatalogueForArchetype } from '@/lib/intent-catalogue'


// ─── MEMORY LAYER: deterministic finding keys + store + diff vs previous run ───
function mlSlug(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}
function buildFindings(result: any): any[] {
  const out: any[] = []
  const seen = new Set<string>()
  const push = (f: any) => { if (!seen.has(f.finding_key)) { seen.add(f.finding_key); out.push(f) } }
  for (const p of (result.importantPages || [])) {
    if (p.status === 'Missing') {
      {
        const _topic = inferTopic(p.key, p.label, p.cats || [])
        const _ev = _topic ? classifyGap(_topic, result.pagesScraped || [], result.facts || []) : null
        if (!(_ev && _ev.evidence_state === 'confirmed')) {
          const _title = (_ev && _topic) ? honestFindingTitle(_topic, _ev, `Missing ${p.label}`) : `Missing ${p.label}`
          const _evidence = _ev ? _ev.why : (p.reason || `No ${(p.label || '').toLowerCase()} found in the crawl.`)
          const _rec = (_ev && _ev.reason === 'unseen')
            ? `We could not confirm a ${_topic} offering from your site. Verify whether you offer it; if so, ensure it has a dedicated page so AI can find it.`
            : `Create a ${p.label} page.`
          push({ finding_key: `page:${mlSlug(p.key)}:missing`, type: 'missing_page', title: _title, evidence: _evidence, recommendation: _rec, impact: p.impact || 'Medium', category: (p.cats && p.cats[0]) || 'overall', status: 'open', affected_queries: (p.affects || []).slice(0, 6), evidence_state: _ev?.evidence_state || 'unverified', evidence_reason: _ev?.reason || null })
        }
      }
    } else if (p.status === 'Present' && !p.notAssessed && typeof p.score === 'number' && p.score < 75) {
      for (const m of (p.missing || [])) {
        push({ finding_key: `page:${mlSlug(p.key)}:${mlSlug(m)}`, type: 'missing_element', title: `${p.displayName || p.label}: add ${m}`, evidence: p.evidence || '', recommendation: `Add ${m} to the ${p.displayName || p.label} page.`, impact: p.impact || 'Medium', category: (p.cats && p.cats[0]) || 'overall', status: 'open', affected_queries: (p.affects || []).slice(0, 6) })
      }
    }
  }
  for (const r of (result.recommendation?.results || [])) {
    if (r.readiness !== 'NO') continue
    // STABLE KEY: category:intent_id, NOT the question wording. A reworded question keeps
    // the same intent_id, so the key no longer churns across runs. Falls back to a question
    // slug only when intent_id is missing/"other" (rare — uncatalogued intents).
    const intentPart = (r.intent_id && r.intent_id !== 'other') ? mlSlug(r.intent_id) : mlSlug(r.question)
    push({ finding_key: `query:${mlSlug(r.category)}:${intentPart}`, type: 'unanswered_query', title: r.question, evidence: '', recommendation: (r.reasons && r.reasons[0]) ? `Address: ${r.reasons[0]}` : 'Add content answering this question.', impact: r.priority === 'high' ? 'High' : 'Medium', category: r.category || 'overall', status: 'open', affected_queries: [r.question] })
  }
  return out
}
function diffFindings(currentFindings: any[], previousKeys: string[]) {
  const curKeys = new Set(currentFindings.map(f => f.finding_key))
  const prevKeys = new Set(previousKeys)
  const stillOpen = currentFindings.filter(f => prevKeys.has(f.finding_key))
  const newlyFound = currentFindings.filter(f => !prevKeys.has(f.finding_key))
  const fixed = previousKeys.filter(k => !curKeys.has(k))
  return { isFirstRun: previousKeys.length === 0, stillOpen: stillOpen.map(f => ({ key: f.finding_key, title: f.title })), newlyFound: newlyFound.map(f => ({ key: f.finding_key, title: f.title })), fixed, counts: { stillOpen: stillOpen.length, new: newlyFound.length, fixed: fixed.length, total: currentFindings.length } }
}

export const maxDuration = 300
const CRAWL_LIMIT = 30

// ── SCRAPE (JS rendering ON so client-rendered FAQs/accordions are visible) ──
async function scrape(url: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=true&wait=1500`)
    if (!res.ok) {
      // fallback without JS if render fails (some sites block headless)
      const res2 = await fetch(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=false`)
      if (!res2.ok) return null
      return await res2.text()
    }
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

// ── EVIDENCE NORMALISER: accent/whitespace-insensitive so real quotes aren't wrongly rejected ──
function normEv(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── SITEMAP CRAWL: pull the whole site's URL set (sitemap.xml + index + robots-declared) ──
async function fetchSitemap(origin: string): Promise<string[]> {
  const host = origin.replace(/^https?:\/\//, '')
  const out = new Set<string>()
  const seen = new Set<string>()
  const queue: string[] = [origin + '/sitemap.xml', origin + '/sitemap_index.xml']
  try {
    const rb = await fetch(origin + '/robots.txt')
    if (rb.ok) { const t = await rb.text(); const re = /sitemap:\s*(\S+)/gi; let m; while ((m = re.exec(t)) !== null) queue.push(m[1].trim()) }
  } catch {}
  let budget = 8
  while (queue.length && budget > 0) {
    const sm = queue.shift()!
    if (!sm || seen.has(sm)) continue
    seen.add(sm); budget--
    try {
      const res = await fetch(sm)
      if (!res.ok) continue
      const xml = await res.text()
      const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1].trim())
      for (const loc of locs) {
        if (/\.xml(\.gz)?$/i.test(loc)) { if (!seen.has(loc)) queue.push(loc); continue }
        const clean = loc.split('#')[0].split('?')[0].replace(/\/$/, '')
        if ((clean.startsWith(origin) || clean.includes(host)) && !/\.(woff2?|ttf|otf|eot|jpg|jpeg|png|gif|svg|webp|ico|css|js|pdf|mp4|webm|zip|json)$/i.test(clean)) out.add(clean)
      }
    } catch {}
  }
  return [...out]
}

// ── AMENITY SIGNALS: what the hotel actually offers, read from crawled pages ──
function detectAmenities(pages: any[]): string[] {
  const joined = pages.map((p: any) => ((p.url || '') + ' ' + (p.headings || []).join(' ') + ' ' + (p.text || '').slice(0, 2500)).toLowerCase()).join(' ')
  const checks: [string, RegExp][] = [
    ['spa & wellness', /\b(spa|wellness|massage|sauna|hammam|treatment)\b/],
    ['afternoon tea', /afternoon tea/],
    ['fine dining', /\b(restaurant|fine dining|gastronom|michelin|tasting menu|brasserie)\b/],
    ['bar / lounge', /\b(bar|cocktail|lounge|speakeasy)\b/],
    ['meetings & events', /\b(meeting|conference|banquet|boardroom|private dining|event space)\b/],
    ['weddings', /\b(wedding|civil ceremony|marriage|reception)\b/],
    ['rooftop', /\broof ?top\b/],
    ['pool', /\b(swimming pool|indoor pool|outdoor pool)\b/],
    ['suites', /\bsuite/],
    ['family', /\b(family|children|kids|connecting room)\b/],
    ['pet friendly', /\b(pet|dog) ?(friendly|allowed|welcome)\b/],
  ]
  return checks.filter(([, re]) => re.test(joined)).map(([k]) => k)
}

// ── DYNAMIC QUESTION GENERATION: the real guest searches for THIS hotel/city ──
const QGEN_SYSTEM = `You are a hotel demand strategist. Generate the real questions a guest would type into an AI assistant (ChatGPT, Perplexity, Google AI) when looking for a hotel like this one — the questions whose answers decide whether AI recommends or rejects THIS specific hotel.

You are given a DEMAND MODEL for this hotel: its confirmed archetype (e.g. Luxury City Hotel, Mountain Resort), its PRIMARY and SECONDARY experiences, and the universal guest filters. You are ALSO given the real city, pages, and amenity signals. The demand model is the SOURCE OF TRUTH for what guests care about for this hotel — weight your questions toward its PRIMARY experiences, cover its SECONDARY ones, and always include the universal filters.

RULES:
- Generate 26 to 30 questions.
- Each question gets a "category" — use EXACTLY one of the allowed categories provided in the user message (these are derived from THIS hotel's confirmed experiences plus universal filters). Never use a category outside that list.
- Weight toward the PRIMARY experiences (more questions), then SECONDARY, then the universal filters. Do NOT invent demand for experiences not in the demand model — e.g. do not ask about a spa, ski, or beach unless that experience is listed.
- Phrase questions the way a guest writes to AI, naturally including the city/area/landmarks (e.g. "best luxury hotel near Covent Garden London", "afternoon tea with vegan options in London", "ski-in ski-out hotel in Zermatt"). Mix broad and specific. Use the provided question SEEDS as inspiration for phrasing, but write natural full questions, not the seed templates verbatim.
- ALWAYS include at least one question each for the universal filters (location, practical/parking/accessibility/pets, overall fit) — these are dealbreaker filters AI uses to shortlist whether or not the hotel markets them.
- "priority": "high" for the hotel's PRIMARY experiences and the universal dealbreakers; "medium" otherwise.
- Do NOT invent named amenities the signals don't support. Ask about guest NEEDS, not claimed features.
Return STRICTLY the JSON schema.`

// Deterministic intent catalogue per category. GPT SELECTS an intent_id from the allowed
// list (it cannot invent one) — same enum-locking we use for category. The finding key is
// then category:intent_id, which stays stable no matter how GPT rewords the visible question.
// "other" is the escape hatch for a question that fits no catalogued intent; those still get
// a stable key via a slug of the question (rare, and acceptable — they're the exception).
const INTENT_CATALOGUE: Record<string, string[]> = {
  luxury: ['luxury-positioning', 'luxury-amenities', 'boutique-character', 'what-makes-special', 'awards-recognition'],
  dining: ['restaurants-overview', 'afternoon-tea', 'bar-lounge', 'cuisine-type', 'fine-dining', 'private-dining', 'breakfast', 'dietary-options', 'reservations'],
  business: ['meeting-rooms', 'event-spaces', 'capacities', 'corporate-services', 'business-suitability'],
  romantic: ['couples-suitability', 'romantic-packages', 'honeymoon', 'anniversary', 'best-room-couples'],
  family: ['family-suitability', 'family-rooms', 'family-packages', 'childrens-facilities', 'connecting-rooms', 'babysitting'],
  spa: ['spa-overview', 'treatments', 'facilities', 'opening-hours', 'non-resident-access', 'pool'],
  location: ['nearby-attractions', 'airport-transfer', 'public-transport', 'neighbourhood', 'distance-to-centre', 'best-area'],
  accessibility: ['accessible-rooms', 'step-free-access', 'lift-access', 'accessibility-overview'],
  parking: ['parking-availability', 'parking-cost', 'valet', 'ev-charging'],
  pets: ['pet-policy', 'pet-fees', 'pet-amenities'],
  overall: ['rooms-overview', 'offers-packages', 'unique-experiences', 'check-in-out', 'cancellation', 'guest-reviews', 'overall-fit', 'why-stay-here'],
  ski: ['ski-access', 'ski-storage', 'slope-proximity', 'ski-concierge'],
  hiking: ['hiking-access', 'trails-nearby', 'hiking-guides'],
  beach: ['beach-access', 'beach-proximity', 'watersports'],
  watersports: ['watersports-overview', 'equipment', 'lessons'],
  golf: ['golf-access', 'course-proximity', 'golf-packages'],
}
function intentsFor(categories: string[]): string[] {
  const out = new Set<string>(['other'])
  for (const c of categories) for (const id of (INTENT_CATALOGUE[c] || [])) out.add(id)
  return [...out]
}

function qgenSchema(categories: string[], intents: string[]) {
  return { type: 'object', additionalProperties: false, required: ['questions'], properties: { questions: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['question', 'category', 'intent_id', 'priority'],
    properties: {
      question: { type: 'string' },
      category: { type: 'string', enum: categories },
      intent_id: { type: 'string', enum: intents },
      priority: { type: 'string', enum: ['high', 'medium'] },
    },
  } } } }
}

// Map an experience key → the audit question category it should file under. Keeps the
// downstream audit/decision categories stable (dining, business, etc.) while letting the
// taxonomy drive WHICH categories are in play for this hotel.
const EXP_TO_QCAT: Record<string, string> = {
  luxury: 'luxury', dining: 'dining', business: 'business', location: 'location',
  romantic: 'romantic', family: 'family', wellness: 'spa', trust: 'overall',
  ski: 'ski', hiking: 'hiking', beach: 'beach', watersports: 'watersports', golf: 'golf',
}
const UNIVERSAL_QCATS = ['location', 'accessibility', 'parking', 'pets', 'overall']

async function generateQuestions(ctx: { name: string; city: string; type: string; pages: string[]; amenities: string[]; demand?: any }, openaiKey: string): Promise<any[]> {
  const demand = ctx.demand || null
  // Allowed categories = this hotel's experience categories + universal filters. When there's
  // no confirmed profile, fall back to the original full fixed set (behaviour preserved).
  let categories: string[]
  let demandBlock = ''
  if (demand && demand.source === 'confirmed_profile') {
    const expCats = [...demand.primary, ...demand.secondary].map((k: string) => EXP_TO_QCAT[k]).filter(Boolean)
    categories = Array.from(new Set([...expCats, ...UNIVERSAL_QCATS]))
    const seedsFor = (keys: string[]) => keys.map((k: string) => { const e = EXPERIENCE_BY_KEY[k]; return e ? `${e.label}: ${(e.questionSeeds || []).join(' | ')}` : '' }).filter(Boolean).join('\n')
    demandBlock = `\nDEMAND MODEL (source of truth for what guests care about):\nARCHETYPE: ${demand.archetype_label}\nPRIMARY experiences (weight most):\n${seedsFor(demand.primary) || '(none)'}\nSECONDARY experiences (cover):\n${seedsFor(demand.secondary) || '(none)'}\nUNIVERSAL filters (always include): location, parking/accessibility/pets, overall fit\n`
  } else {
    categories = ['location', 'dining', 'spa', 'family', 'romantic', 'business', 'luxury', 'accessibility', 'parking', 'pets', 'overall']
    demandBlock = '\n(No confirmed hotel profile — using generic demand across all standard categories.)\n'
  }
  const intents = intentsFor(categories)
  const user = `HOTEL: ${ctx.name || '(unknown name)'}\nCITY: ${ctx.city || '(unknown city)'}\nTYPE: ${ctx.type || 'luxury hotel'}\nPAGES FOUND: ${ctx.pages.length ? ctx.pages.join(', ') : '(none detected)'}\nAMENITY SIGNALS: ${ctx.amenities.length ? ctx.amenities.join(', ') : '(none detected)'}\n${demandBlock}\nALLOWED CATEGORIES (use EXACTLY these): ${categories.join(', ')}\n\nFor EACH question you MUST also assign an "intent_id" from the allowed list — pick the ONE that best matches what the question is really asking. The intent_id is the stable identity of the question's purpose; the same underlying need must always get the same intent_id even if you word the question differently. Only use "other" if no listed intent fits. Aim to cover a SPREAD of distinct intents rather than several questions sharing one intent_id.\nALLOWED INTENT IDS: ${intents.join(', ')}`
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.2, max_tokens: 1800,
        response_format: { type: 'json_schema', json_schema: { name: 'questions', strict: true, schema: qgenSchema(categories, intents) } },
        messages: [{ role: 'system', content: QGEN_SYSTEM }, { role: 'user', content: user }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return []
    const parsed = JSON.parse(c)
    const qs = (parsed.questions || []).filter((q: any) => q && q.question).map((q: any) => ({ question: String(q.question).trim(), category: q.category || 'overall', intent_id: q.intent_id || 'other', priority: q.priority === 'high' ? 'high' : 'medium' }))
    // De-dup on category:intent_id so two questions never collide on the same stable key.
    // First occurrence wins; later collisions are dropped (keeps the key set stable + unique).
    const seen = new Set<string>()
    return qs.filter((q: any) => {
      const k = `${q.category}:${q.intent_id === 'other' ? q.question.toLowerCase() : q.intent_id}`
      if (seen.has(k)) return false
      seen.add(k); return true
    })
  } catch { return [] }
}

const PRIORITY: { key: string; label: string; kws: string[]; impact: string; cats: string[]; multi?: boolean }[] = [
  { key: 'homepage', label: 'Homepage', kws: [], impact: 'High', cats: ['overall'] },
  { key: 'rooms', label: 'Room pages', kws: ['room', 'suite', 'accommodation', 'chambre', 'zimmer', 'villa'], impact: 'High', cats: ['luxury', 'family', 'romantic'], multi: true },
  { key: 'spa', label: 'Spa / Wellness page', kws: ['spa', 'wellness', 'bien-etre', 'bien-être'], impact: 'High', cats: ['wellness'] },
  { key: 'dining', label: 'Dining page', kws: ['restaurant', 'dining', 'gastro', 'cuisine', 'bar'], impact: 'High', cats: ['dining'] },
  { key: 'location', label: 'Location page', kws: ['location', 'directions', 'getting-here', 'contact', 'access', 'map'], impact: 'High', cats: ['location'] },
  { key: 'meetings', label: 'Meetings & Events page', kws: ['meeting', 'event', 'conference', 'banquet', 'mice', 'seminaire'], impact: 'Medium', cats: ['business'] },
  { key: 'family', label: 'Family page', kws: ['family', 'kids', 'children', 'famille', 'enfant'], impact: 'High', cats: ['family'] },
  { key: 'romantic', label: 'Romantic page', kws: ['romantic', 'couple', 'honeymoon', 'romantique', 'lune-de-miel'], impact: 'High', cats: ['romantic'] },
  { key: 'business', label: 'Business page', kws: ['business', 'corporate', 'affaires', 'executive'], impact: 'Medium', cats: ['business'] },
  { key: 'luxury', label: 'Luxury / About page', kws: ['luxury', 'about', 'la-reserve', 'palace', 'histoire', 'story'], impact: 'Medium', cats: ['luxury', 'overall'] },
  { key: 'offers', label: 'Offers page', kws: ['offer', 'package', 'deal', 'special', 'promotion'], impact: 'Medium', cats: ['overall'] },
  { key: 'parking', label: 'Parking page', kws: ['parking', 'voiturier', 'stationnement', 'garage'], impact: 'Medium', cats: ['practical'] },
  { key: 'accessibility', label: 'Accessibility page', kws: ['accessib', 'wheelchair', 'pmr', 'mobilite', 'mobilité'], impact: 'Medium', cats: ['accessibility'] },
  { key: 'breakfast', label: 'Breakfast page', kws: ['breakfast', 'petit-dejeuner', 'petit-déjeuner', 'brunch'], impact: 'Low', cats: ['dining', 'practical'] },
  { key: 'pets', label: 'Pets page', kws: ['pet', 'dog', 'animaux', 'chien'], impact: 'Low', cats: ['practical'] },
  { key: 'airport', label: 'Airport transfer page', kws: ['airport-transfer', 'transfert', 'navette', 'shuttle', 'limousine'], impact: 'Medium', cats: ['location'] },
  { key: 'experiences', label: 'Experiences page', kws: ['experience', 'activities', 'things-to-do', 'discover', 'guide'], impact: 'Low', cats: ['overall'] },
]

const EXPECTED: Record<string, { field: string; label: string }[]> = {
  homepage: [{ field: 'positioning', label: 'Clear positioning' }, { field: 'quickfacts', label: 'Quick Facts block' }, { field: 'aisummary', label: 'AI summary' }, { field: 'internallinks', label: 'Links to demand pages' }, { field: 'faq', label: 'FAQ section' }],
  rooms: [{ field: 'overview', label: 'Overview' }, { field: 'occupancy', label: 'Occupancy' }, { field: 'view', label: 'View info' }, { field: 'who', label: 'Who it’s for' }, { field: 'idealfor', label: 'Ideal-For' }, { field: 'comparison', label: 'Comparison' }, { field: 'faq', label: 'FAQ' }],
  spa: [{ field: 'services', label: 'Services' }, { field: 'facilities', label: 'Facilities' }, { field: 'hours', label: 'Opening hours' }, { field: 'nonresident', label: 'Non-resident policy' }, { field: 'quickfacts', label: 'Quick Facts' }, { field: 'faq', label: 'FAQ' }],
  dining: [{ field: 'descriptions', label: 'Restaurant descriptions' }, { field: 'cuisine', label: 'Cuisine' }, { field: 'who', label: 'Who it’s for' }, { field: 'why', label: 'Why choose it' }, { field: 'faq', label: 'FAQ' }],
  family: [{ field: 'positioning', label: 'Family positioning' }, { field: 'rooms', label: 'Family rooms' }, { field: 'childpolicy', label: 'Children policy' }, { field: 'amenities', label: 'Family amenities' }, { field: 'attractions', label: 'Nearby family attractions' }, { field: 'faq', label: 'FAQ' }],
  romantic: [{ field: 'positioning', label: 'Couples positioning' }, { field: 'experiences', label: 'Romantic experiences' }, { field: 'suites', label: 'Suites' }, { field: 'spa', label: 'Spa experiences' }, { field: 'dining', label: 'Dining experiences' }, { field: 'faq', label: 'FAQ' }],
  business: [{ field: 'facilities', label: 'Meeting facilities' }, { field: 'capacities', label: 'Capacities' }, { field: 'services', label: 'Corporate services' }, { field: 'airport', label: 'Airport access' }, { field: 'faq', label: 'FAQ' }],
  meetings: [{ field: 'facilities', label: 'Meeting facilities' }, { field: 'capacities', label: 'Capacities' }, { field: 'catering', label: 'Catering' }, { field: 'faq', label: 'FAQ' }],
  luxury: [{ field: 'positioning', label: 'Luxury positioning' }, { field: 'story', label: 'Story / heritage' }, { field: 'awards', label: 'Awards / recognition' }, { field: 'faq', label: 'FAQ' }],
  offers: [{ field: 'positioning', label: 'Clear positioning' }, { field: 'quickfacts', label: 'Quick Facts block' }, { field: 'aisummary', label: 'AI summary' }, { field: 'faq', label: 'FAQ section' }],
  experiences: [{ field: 'positioning', label: 'Clear positioning' }, { field: 'quickfacts', label: 'Quick Facts block' }, { field: 'aisummary', label: 'AI summary' }, { field: 'faq', label: 'FAQ section' }],
  parking: [{ field: 'availability', label: 'Availability' }, { field: 'pricing', label: 'Pricing' }, { field: 'ev', label: 'EV charging' }, { field: 'policy', label: 'Reservation policy' }, { field: 'faq', label: 'FAQ' }],
  accessibility: [{ field: 'rooms', label: 'Accessible rooms' }, { field: 'stepfree', label: 'Step-free access' }, { field: 'lift', label: 'Lift access' }, { field: 'policy', label: 'Accessibility policies' }, { field: 'faq', label: 'FAQ' }],
  breakfast: [{ field: 'hours', label: 'Hours' }, { field: 'included', label: 'Included / price' }, { field: 'venue', label: 'Venue' }, { field: 'faq', label: 'FAQ' }],
  pets: [{ field: 'policy', label: 'Pet policy' }, { field: 'fee', label: 'Fees' }, { field: 'amenities', label: 'Pet amenities' }, { field: 'faq', label: 'FAQ' }],
  airport: [{ field: 'available', label: 'Transfer available' }, { field: 'pricing', label: 'Pricing' }, { field: 'distance', label: 'Distance / time' }, { field: 'booking', label: 'How to book' }, { field: 'faq', label: 'FAQ' }],
  location: [{ field: 'address', label: 'Address & map' }, { field: 'distances', label: 'Distances to airport / centre' }, { field: 'attractions', label: 'Nearby attractions' }, { field: 'transport', label: 'Transport options' }, { field: 'faq', label: 'FAQ' }],
}

const BLUEPRINTS: Record<string, { heading: string; sections: string[]; questions: string[] }> = {
  parking: { heading: 'Parking at the hotel', sections: ['Availability (on-site / valet / nearby)', 'Pricing per night', 'EV charging', 'Reservation policy', 'Height / size limits', 'FAQ'], questions: ['Does the hotel have parking?', 'How much does parking cost?', 'Is valet parking available?', 'Are EV chargers available?', 'Do I need to reserve parking?'] },
  accessibility: { heading: 'Accessibility', sections: ['Accessible rooms', 'Step-free access', 'Lift access', 'Accessible bathrooms', 'Accessibility policies', 'FAQ'], questions: ['Are accessible rooms available?', 'Is there step-free access?', 'Is there lift access to all floors?', 'Are accessible bathrooms available?'] },
  pets: { heading: 'Pets policy', sections: ['Pet policy (allowed / restrictions)', 'Fees', 'Pet amenities (beds, bowls)', 'Size / number limits', 'FAQ'], questions: ['Are pets allowed?', 'Is there a fee for pets?', 'What pet amenities are provided?', 'Is there a size limit for pets?'] },
  breakfast: { heading: 'Breakfast', sections: ['Hours', 'Included in rate / price', 'Venue & setting', 'Menu / style (buffet, à la carte)', 'Dietary options', 'FAQ'], questions: ['Is breakfast included?', 'What are the breakfast hours?', 'Where is breakfast served?', 'Are there vegan / gluten-free options?'] },
  airport: { heading: 'Airport transfer', sections: ['Transfer available (yes/no)', 'Pricing', 'Distance & travel time to airport', 'Vehicle type', 'How to book', 'FAQ'], questions: ['How far is the airport?', 'Is an airport transfer available?', 'How much is the transfer?', 'How do I book a transfer?'] },
  family: { heading: 'Family stays', sections: ['Family positioning', 'Family / connecting rooms', 'Children policy & age limits', 'Family amenities (kids club, pool)', 'Nearby family attractions', 'FAQ'], questions: ['Is the hotel family-friendly?', 'Are family or connecting rooms available?', 'What activities are there for children?', 'Is there a kids club?'] },
  romantic: { heading: 'Romantic & honeymoon stays', sections: ['Couples positioning', 'Romantic experiences & packages', 'Best suites for couples', 'Couples spa experiences', 'Romantic dining', 'FAQ'], questions: ['Is the hotel good for couples?', 'Are there honeymoon packages?', 'Which room is best for a romantic stay?', 'Are there couples spa treatments?'] },
  business: { heading: 'Business, meetings & events', sections: ['Meeting facilities', 'Room capacities', 'Corporate / executive services', 'Airport access', 'Catering', 'FAQ'], questions: ['Does the hotel have meeting rooms?', 'What is the meeting room capacity?', 'Is the hotel suitable for business travel?', 'How far is the airport?'] },
  spa: { heading: 'Spa & wellness', sections: ['Services & treatments', 'Facilities (pool, sauna, gym)', 'Opening hours', 'Non-resident policy', 'Quick Facts', 'FAQ'], questions: ['Does the hotel have a spa?', 'What treatments are offered?', 'Is the spa open to non-residents?', 'What are the spa opening hours?'] },
  dining: { heading: 'Restaurants & bars', sections: ['Each restaurant described', 'Cuisine type', 'Who it’s for / occasion', 'Why choose it', 'Hours & dress code', 'FAQ'], questions: ['What restaurants are at the hotel?', 'What cuisine is served?', 'Do I need a reservation?', 'Are there vegetarian options?'] },
  luxury: { heading: 'About / the hotel', sections: ['Luxury positioning', 'Story & heritage', 'Awards & recognition', 'What makes it distinctive', 'FAQ'], questions: ['What makes this hotel special?', 'What awards has the hotel won?', 'What is the hotel’s story?'] },
  location: { heading: 'Location & getting here', sections: ['Address & map', 'Distance to airport / station / centre', 'Nearby attractions', 'Transport options', 'FAQ'], questions: ['Where is the hotel located?', 'How far is the airport?', 'What attractions are nearby?', 'How do I get there?'] },
}

const EXAMPLES: Record<string, string> = {
  quickfacts: 'Example format (fill with your own facts):\nParking: Yes · Spa: Yes · Lake view: Some rooms · Airport transfer: On request · Pets: Allowed',
  aisummary: 'Example format (write your own 1–2 sentences): "[Hotel] is a [type] hotel in [area], best suited to [guest types], known for [1–2 distinctive features]."',
  faq: 'Example questions to answer: Does the hotel have parking? · Is breakfast included? · How far is the airport? · Is the spa open to non-residents?',
}
const FAQ_QUESTIONS: Record<string, string[]> = {
  homepage: ['What makes this hotel distinctive?', 'Who is this hotel best suited to?', 'Where exactly is the hotel located?', 'What is included in a stay?'],
  rooms: ['What room types are available?', 'How many guests does each room sleep?', 'Which rooms have the best views?', 'Which room is best for families / couples?'],
  spa: ['Does the hotel have a spa?', 'What treatments are offered?', 'Is the spa open to non-residents?', 'What are the spa opening hours?'],
  dining: ['What restaurants are at the hotel?', 'What cuisine is served?', 'Do I need a reservation?', 'Are there vegetarian / dietary options?'],
  family: ['Is the hotel family-friendly?', 'Are family or connecting rooms available?', 'What activities are there for children?', 'Is there a kids club?'],
  romantic: ['Is the hotel good for couples?', 'Are there honeymoon packages?', 'Which room is best for a romantic stay?', 'Are there couples spa treatments?'],
  business: ['Does the hotel have meeting rooms?', 'What is the meeting room capacity?', 'Is the hotel suitable for business travel?', 'How far is the airport?'],
  meetings: ['What meeting and event spaces are available?', 'What is the capacity of each room?', 'Is catering available?', 'How far is the airport?'],
  luxury: ['What makes this hotel special?', 'What awards has the hotel won?', 'What is the hotel’s story?'],
  offers: ['What makes this hotel distinctive?', 'Who is this hotel best suited to?', 'Where exactly is the hotel located?', 'What is included in a stay?'],
  experiences: ['What makes this hotel distinctive?', 'Who is this hotel best suited to?', 'Where exactly is the hotel located?', 'What is included in a stay?'],
  location: ['Where is the hotel located?', 'How far is the airport?', 'What attractions are nearby?', 'How do I get there?'],
  parking: ['Does the hotel have parking?', 'How much does parking cost?', 'Is valet parking available?', 'Are EV chargers available?'],
  accessibility: ['Are accessible rooms available?', 'Is there step-free access?', 'Is there lift access to all floors?', 'Are accessible bathrooms available?'],
  breakfast: ['Is breakfast included?', 'What are the breakfast hours?', 'Where is breakfast served?', 'Are there vegan / gluten-free options?'],
  pets: ['Are pets allowed?', 'Is there a fee for pets?', 'What pet amenities are provided?', 'Is there a size limit for pets?'],
  airport: ['How far is the airport?', 'Is an airport transfer available?', 'How much is the transfer?', 'How do I book a transfer?'],
}

// ── LLM: recommendation readiness (unchanged behaviour) ──
const REC_SYSTEM = `You are a strict, evidence-based hotel AI-recommendation auditor. Given crawled text from ONE hotel website and a list of recommendation prompts, decide for EACH prompt whether THIS WEBSITE provides enough evidence for an AI to CONFIDENTLY RECOMMEND this hotel for that prompt.

Some prompts include "Evidence the site must show for YES:" — a list of the concrete evidence required. When present, grade against THAT list: YES = the site shows essentially all of it with quotable specifics; PARTIAL = it shows some but not all, or shows it thinly; NO = it shows none of it.

RULES:
- Use ONLY provided website text. NEVER use outside knowledge. Never guess.
- "readiness": "YES" (clear specific quotable evidence for what's asked), "PARTIAL" (some but thin/incomplete), or "NO" (none).
- CREDIT SPECIFIC DISTINCTIVE FACTS. A concrete, specific, distinctive fact is real evidence even when the site does NOT frame it as an explicit comparison. Example: a named heritage story, a listed/protected building, a named designer or chef, a signature space or experience — these ARE partial differentiation/atmosphere/quality evidence. Do NOT score such a prompt NO just because the site fails to literally say "unlike other hotels" or "better than competitors". If a genuinely distinctive specific fact is present, score at least PARTIAL, quote it, and in "reasons" note that the differentiating fact exists but is not framed as a reason to choose this hotel over alternatives (i.e. it is under-leveraged, not absent). Reserve NO for when there is genuinely no specific distinctive fact to quote at all — only generic adjectives ("elegant", "luxurious") with nothing concrete behind them.
- Every YES/PARTIAL MUST include a verbatim quote from the text. No quote = NO.
- "evidence": the verbatim quote, or "".
- "reasons": an array of 1-4 short, concrete reasons WHY an AI could not confidently recommend (for YES, may be empty). Phrase as plain factual gaps, e.g. "No parking information found", "No dedicated family page", "No FAQ answering this", "Distinctive heritage stated but not framed as why to choose this hotel". Avoid the generic phrase "comparative claims"; instead say "No distinctive features stated" or "No specific [topic] details", or for under-leveraged evidence "X exists but is not positioned as a differentiator".
- BE HARSH AND SPECIFIC: every reason must name the exact missing fact, page or section for THIS hotel (e.g. "No parking information on any crawled page", "Dining page never states cuisine type or who each restaurant suits"). BAN generic filler that could apply to any hotel ("could be improved", "lacks detail", "not optimised for AI"). A generic reason is not a reason.
- "confidence": integer 0-100 (NO 0-20, PARTIAL 21-60, YES 61-100), justified by the quote.
- "url": source URL of the quote; "".
- "pages": short list of which page TYPES are responsible (e.g. "family page", "room pages", "parking page", "FAQ").
Return STRICTLY the JSON schema, one entry per prompt in order.`

function recSchema() {
  return { type: 'object', additionalProperties: false, required: ['answers'], properties: { answers: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    required: ['index', 'readiness', 'evidence', 'reasons', 'url', 'confidence', 'pages'],
    properties: {
      index: { type: 'integer' }, readiness: { type: 'string', enum: ['YES', 'PARTIAL', 'NO'] },
      evidence: { type: 'string' }, reasons: { type: 'array', items: { type: 'string' } }, url: { type: 'string' }, confidence: { type: 'integer' },
      pages: { type: 'array', items: { type: 'string' } },
    },
  } } } }
}
async function runReadiness(prompts: any[], pages: any[], openaiKey: string) {
  if (!prompts.length || !pages.length) return []
  const corpus = pages.map(p => `URL: ${p.url}\nHEADINGS: ${(p.headings || []).slice(0, 12).join(' | ')}\nTEXT: ${(p.text || '').slice(0, 4000)}`).join('\n\n---\n\n')
  // Catalogue prompts carry the recommendability question + the concrete evidence the site
  // must show for a confident YES. When present, grade against THAT (recommendability), not
  // the bare question — this is what makes a PARTIAL/NO point at specific missing evidence.
  const pList = prompts.map((q, i) => {
    if (q.audit_question) {
      const exp = Array.isArray(q.expected_evidence) && q.expected_evidence.length ? `\n    Evidence the site must show for YES: ${q.expected_evidence.join('; ')}` : ''
      return `[${i}] ${q.audit_question}${exp}`
    }
    return `[${i}] ${q.question}`
  }).join('\n')
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0, max_tokens: 4500,
        response_format: { type: 'json_schema', json_schema: { name: 'readiness', strict: true, schema: recSchema() } },
        messages: [{ role: 'system', content: REC_SYSTEM }, { role: 'user', content: `WEBSITE PAGES:\n\n${corpus}\n\n────────\nPROMPTS:\n${pList}` }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) throw new Error('empty')
    const parsed = JSON.parse(c)
    const byIdx = new Map<number, any>(); for (const a of (parsed.answers || [])) byIdx.set(a.index, a)
    const corpusNorm = normEv(pages.map((p: any) => p.text || '').join(' '))
    return prompts.map((q, i) => {
      const a = byIdx.get(i) || {}; const ev = (a.evidence || '').trim()
      let readiness = a.readiness === 'YES' || a.readiness === 'PARTIAL' ? a.readiness : 'NO'
      if ((readiness === 'YES' || readiness === 'PARTIAL') && ev.length === 0) readiness = 'NO'
      if (readiness !== 'NO' && ev) {
        const en = normEv(ev)
        // FUZZY VERIFICATION: don't demand an exact 60-char substring (brittle on long,
        // accented, reformatted content — it wrongly downgrades genuine answers). Instead
        // confirm the quote genuinely comes from the site by word overlap: most of its
        // meaningful words must appear in the corpus. A hallucinated quote shares few words
        // and still gets downgraded; a real but reworded quote passes.
        const qWords = en.split(' ').filter((w: string) => w.length >= 4)
        if (qWords.length >= 3) {
          const hits = qWords.filter((w: string) => corpusNorm.includes(w)).length
          const ratio = hits / qWords.length
          if (ratio < 0.6) readiness = readiness === 'YES' ? 'PARTIAL' : 'NO'
        } else if (en.length >= 12 && !corpusNorm.includes(en)) {
          readiness = readiness === 'YES' ? 'PARTIAL' : 'NO'
        }
      }
      let conf = Number.isFinite(a.confidence) ? Math.max(0, Math.min(100, a.confidence)) : 0
      if (readiness === 'NO') conf = Math.min(conf, 20)
      return { question: q.question, audit_question: q.audit_question || '', expected_evidence: q.expected_evidence || [], stage: q.stage || '', category: q.category || 'overall', intent_id: q.intent_id || 'other', priority: q.priority || 'medium', readiness, evidence: readiness === 'NO' ? '' : ev, reasons: Array.isArray(a.reasons) ? a.reasons.slice(0, 4) : [], url: readiness === 'NO' ? '' : (a.url || ''), confidence: conf, pages: Array.isArray(a.pages) ? a.pages.slice(0, 5) : [] }
    })
  } catch {
    return prompts.map(q => ({ question: q.question, audit_question: q.audit_question || '', expected_evidence: q.expected_evidence || [], stage: q.stage || '', category: q.category || 'overall', intent_id: q.intent_id || 'other', priority: q.priority || 'medium', readiness: 'NO', evidence: '', reasons: ['Not evaluated'], url: '', confidence: 0, pages: [] }))
  }
}

function pageSchema(fields: string[]) {
  const props: any = { evidence: { type: 'string' } }
  for (const f of fields) props[f] = { type: 'boolean' }
  return { type: 'object', additionalProperties: false, required: [...fields, 'evidence'], properties: props }
}
async function auditPageOnce(pg: any, typeKey: string, openaiKey: string) {
  const expected = EXPECTED[typeKey] || EXPECTED.homepage
  const fields = expected.map(e => e.field)
  const sys = `You are a strict evidence-based auditor checking ONE hotel ${typeKey} page for required elements. Use ONLY the provided text/headings. NEVER infer or use outside knowledge. For each element return true ONLY if it is genuinely present. Provide one short verbatim quote as "evidence" (or "").
Elements: ${expected.map(e => `"${e.field}" = ${e.label}`).join('; ')}.`
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o', temperature: 0, max_tokens: 1200,
      response_format: { type: 'json_schema', json_schema: { name: 'page_audit', strict: true, schema: pageSchema(fields) } },
      messages: [{ role: 'system', content: sys }, { role: 'user', content: `URL: ${pg.url}\nHEADINGS: ${(pg.headings || []).join(' | ')}\nTEXT: ${(pg.text || '').slice(0, 4000)}` }],
    }),
  })
  const data = await res.json()
  const c = data?.choices?.[0]?.message?.content
  if (!c) return null
  return JSON.parse(c)
}
async function auditPage(pg: any, typeKey: string, openaiKey: string) {
  try { const a = await auditPageOnce(pg, typeKey, openaiKey); if (a) return a } catch {}
  try { return await auditPageOnce(pg, typeKey, openaiKey) } catch { return null }
}

function pct(g: number, m: number) { return m ? Math.round((g / m) * 100) : 0 }

// ── CATEGORY / CLUSTER MAPPING ──
const CAT_MAP: Record<string, string> = { luxury: 'luxury', spa: 'wellness', romantic: 'romantic', family: 'family', business: 'business', lake: 'location', location: 'location', airport: 'location', parking: 'practical', pets: 'practical', dining: 'dining', accessibility: 'accessibility', positioning: 'overall', overall: 'overall' }
const CAT_LABEL: Record<string, string> = { luxury: 'Luxury', wellness: 'Wellness', romantic: 'Romantic', family: 'Family', business: 'Business', location: 'Location', practical: 'Practical (parking/pets)', dining: 'Dining', accessibility: 'Accessibility', overall: 'Overall / Brand' }

// ── ROOM NAMING: unique, human labels so two room pages never collide ──
function roomNameFromUrl(u: string): string {
  const lu = (u || '').toLowerCase()
  if (lu.includes('villa')) return 'Villa'
  if (lu.includes('suite')) return 'Suites'
  if (lu.includes('apartment') || lu.includes('residence')) return 'Apartments'
  if (lu.includes('penthouse')) return 'Penthouse'
  return 'Rooms'
}
// Friendly, de-duplicated page name for the action plan
function pageDisplayName(p: any, allPages: any[]): string {
  if (p.key === 'rooms') {
    const sameKey = allPages.filter(x => x.key === 'rooms' && x.url)
    if (sameKey.length > 1) return roomNameFromUrl(p.url || '')
    return 'Rooms'
  }
  const raw = (p.label || '').split(' — ')[0].replace(/ pages?$/i, '').trim()
  return raw || 'Page'
}

// ── LAYER DEFINITIONS (static: what it is + why AI cares) ──
const LAYER_META: Record<number, { layer: string; definition: string; why: string }> = {
  0: { layer: 'Knowledge layer', definition: 'Whether core hotel facts (parking, breakfast, pets, accessibility, airport, check-in, cancellation) have a single, consistent source of truth.', why: 'AI assistants quote facts directly. When facts are scattered or missing, AI either cannot answer or risks giving a wrong answer — both lose the recommendation.' },
  1: { layer: 'Core website structure', definition: 'Whether the expected core pages exist: Homepage, Rooms, Dining, Spa, Location, Offers, Meetings, Contact.', why: 'These are the pages AI crawlers expect on a hotel site. Missing core pages create blind spots the AI fills with nothing — or with a competitor.' },
  2: { layer: 'AI intent hub', definition: 'Whether pages exist that target recommendation intent (family hotel, romantic, business, spa, pet-friendly, accessible, parking, near-airport, lake views).', why: 'AI matches a guest’s intent ("best family hotel in Geneva") to pages built around that intent. No intent page = no match.' },
  3: { layer: 'Knowledge center', definition: 'Whether dedicated fact pages exist for Parking, Breakfast, Pets, Accessibility, Airport Transfer, Check-in/out, Cancellation, and a central FAQ.', why: 'A dedicated, crawlable page per fact is the most reliable way for AI to retrieve and trust a specific answer.' },
  4: { layer: 'Room intelligence', definition: 'For each room page: does it explain what the room is, who it’s for, why choose it, and when to book — with Overview, Quick Facts, Occupancy, View, Ideal-For, Comparison, FAQ.', why: 'Rich room data lets AI recommend a specific room for a specific guest ("best room for a couple"), not just the hotel in general.' },
  5: { layer: 'AI retrieval blocks', definition: 'Whether major pages contain a Quick Facts block and a concise AI Summary paragraph.', why: 'These structured blocks are the easiest thing for AI to lift verbatim, making your answers more likely to be quoted accurately.' },
  6: { layer: 'Question architecture', definition: 'Whether major pages answer WHAT, WHO, HOW, WHY, COMPARISON and FAQ for their topic.', why: 'AI answers guest questions by matching this structure. Pages that only describe, without answering, are weak retrieval sources.' },
  7: { layer: 'Entity coverage', definition: 'Whether pages name real entities — landmarks, airports, stations, neighbourhoods, attractions.', why: 'Named entities anchor the hotel in a location graph AI understands, improving location-based recommendations.' },
  8: { layer: 'Recommendation content', definition: 'Whether pages explicitly help AI recommend (best room for couples / families / business; comparison and ideal-for sections).', why: 'Explicit recommendation cues let AI confidently say "this hotel is best for X" instead of hedging.' },
  9: { layer: 'Local expertise', definition: 'Whether local-knowledge pages exist (things to do, family guide, business guide, romantic guide).', why: 'Local guides signal authority and answer the planning questions guests ask AI alongside the booking.' },
  10: { layer: 'Trust signals', definition: 'Whether reviews, awards, ratings and recognition are present and machine-readable (review schema).', why: 'AI weighs trust signals heavily when choosing which hotel to surface first among similar options.' },
  11: { layer: 'Internal linking', definition: 'Whether pages form topic clusters (e.g. Family page → Family Rooms → Family Offers → Family FAQ).', why: 'Strong internal linking helps crawlers discover all your pages and understand which pages belong to which intent.' },
  12: { layer: 'Schema', definition: 'Whether structured data is present: Hotel, HotelRoom, FAQPage, Review, AggregateRating, Restaurant, Offer, Breadcrumb.', why: 'Schema is the most direct, unambiguous way to feed facts to AI. It removes guesswork from retrieval.' },
  13: { layer: 'AI answer library', definition: 'How many of the important guest questions the website can actually answer, based on the prompt analysis.', why: 'The breadth of answerable questions is a direct measure of how often AI can use your site to respond to a guest.' },
}

const IMPACT_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

// ── ACTION PLAN: NO→PARTIAL ordering, unique page names, quick wins with why+affects ──
const QW_WHY = (el: string): string => {
  const e = el.toLowerCase()
  if (e.includes('quick facts')) return 'Gives AI a scannable list of hard facts (parking, spa, transfer, pets) it can quote directly instead of guessing.'
  if (e.includes('ai summary')) return 'A 1–2 sentence positioning line AI can lift verbatim when asked who the hotel is best for.'
  if (e.includes('faq')) return 'Q&A pairs mirror how guests phrase questions, making your answers easy for AI to match and quote.'
  if (e.includes('comparison')) return 'Comparative detail is what lets AI rank you above alternatives instead of leaving you at a tentative maybe.'
  if (e.includes('award')) return 'Awards and recognition are trust signals AI weighs heavily when deciding which hotel to surface first.'
  return 'Adds structured detail AI looks for, widening the searches it can confidently recommend you for.'
}
function buildActionPlan(readiness: any[], importantPages: any[], missingBlueprints: any[], demandCoverage: any[]) {
  const noByCat: Record<string, number> = {}
  for (const r of readiness) { if (r.readiness === 'NO') { const c = CAT_MAP[r.category] || 'overall'; noByCat[c] = (noByCat[c] || 0) + 1 } }

  const priorities: any[] = []
  // NEW PAGES that flip full-NO prompts (highest value: NO→YES)
  for (const b of missingBlueprints) {
    if (!b.affects || b.affects.length === 0) continue
    const noCount = b.noCount || 0
    const level = noCount >= 2 ? 'Critical' : b.impact === 'High' ? 'Critical' : 'High'
    priorities.push({
      level, addressesNo: noCount, kind: 'create',
      title: `Create a ${b.blueprint.heading} page`,
      why: `AI currently cannot recommend the hotel for these searches because no dedicated ${b.blueprint.heading.toLowerCase()} content was found.`,
      affectedPrompts: b.affects, pages: [`${b.blueprint.heading} page (missing)`],
      outcome: `AI would be able to answer "${b.blueprint.questions[0]}" and confidently surface the hotel for the searches above.`,
      blueprint: { sections: b.blueprint.sections, questions: b.blueprint.questions },
    })
  }
  // EXISTING pages that need strengthening (PARTIAL→YES)
  for (const p of importantPages) {
    if (p.status !== 'Present' || typeof p.score !== 'number' || p.score >= 75) continue
    if (!p.missing || p.missing.length === 0) continue
    const cats = p.cats || []
    const noCount = cats.reduce((s: number, c: string) => s + (noByCat[c] || 0), 0)
    const level = p.score < 40 ? 'High' : 'Medium'
    priorities.push({
      level, addressesNo: noCount, kind: 'strengthen',
      title: `Strengthen your ${p.displayName} page`,
      why: 'This page exists but is missing key elements AI looks for, limiting how confidently it can recommend you.',
      affectedPrompts: p.affects || [], pages: [p.url ? p.url : p.label],
      outcome: `Adding ${p.missing.slice(0, 3).join(', ')} would let AI fully understand and recommend this page's strengths.`,
      toAdd: p.missing,
    })
  }
  // SORT: create-page actions (NO→YES) before strengthen actions (PARTIAL→YES),
  // then by NO prompts unlocked, then impact tier, then number of prompts affected
  const KIND_RANK: Record<string, number> = { create: 0, strengthen: 1 }
  priorities.sort((a, b) =>
    (KIND_RANK[a.kind] - KIND_RANK[b.kind]) ||
    (b.addressesNo - a.addressesNo) ||
    (IMPACT_RANK[a.level] - IMPACT_RANK[b.level]) ||
    ((b.affectedPrompts?.length || 0) - (a.affectedPrompts?.length || 0))
  )
  // De-duplicate identical titles defensively
  const seenTitle = new Set<string>()
  const topPriorities = priorities.filter(p => { if (seenTitle.has(p.title)) return false; seenTitle.add(p.title); return true }).slice(0, 10)

  // QUICK WINS (low-effort elements) with why + affected prompts
  const quickWins: any[] = []
  for (const p of importantPages) {
    if (p.status !== 'Present' || !p.missing) continue
    for (const m of p.missing) {
      if (/FAQ|Quick Facts|Comparison|AI summary|awards/i.test(m)) {
        quickWins.push({ action: `Add ${m} to your ${p.displayName} page`, page: p.url || p.label, element: m, why: QW_WHY(m), affects: (p.affects || []).slice(0, 3) })
      }
    }
  }
  const seenQW = new Set<string>()
  const quickWinsDedup = quickWins.filter(q => { if (seenQW.has(q.action)) return false; seenQW.add(q.action); return true }).slice(0, 8)

  // STRATEGIC: missing pages, ordered NO-first, with structure + categories
  const strategic = missingBlueprints
    .filter((b: any) => b.affects && b.affects.length)
    .sort((a: any, b: any) => (b.noCount || 0) - (a.noCount || 0))
    .map((b: any) => ({
      title: `Create a ${b.blueprint.heading} page`,
      impact: (b.noCount || 0) >= 2 ? 'High' : b.impact,
      why: `Closes ${b.affects.length} recommendation prompt(s) the site currently cannot answer.`,
      categories: b.categories || [],
      strengthens: b.affects,
      sections: b.blueprint.sections,
    }))

  const strengths = demandCoverage.filter(d => d.coverage >= 67).map(d => d.label)
  const weaknesses = demandCoverage.filter(d => d.coverage < 40).map(d => d.label)
  const highRoi = topPriorities.slice(0, 3).map(p => p.title)
  const focusFirst = topPriorities.slice(0, 3).map(p => p.title)
  return {
    intro: 'Based on the pages crawled and the recommendation-readiness analysis, these are the highest-impact actions that would most improve AI recommendation confidence. Actions that unlock searches the site cannot currently answer are listed first.',
    topPriorities, quickWins: quickWinsDedup, strategic,
    forecast: { strengths, weaknesses, highRoi },
    whatNotToDo: focusFirst.length ? { message: 'Do not try to create or rewrite everything at once. Start with the items below — they unlock the largest number of searches the site currently cannot answer. Once those are live, work down the priority list.', focusFirst } : null,
  }
}
function buildContentPlan(importantPages: any[], missingBlueprints: any[]) {
  const existing = importantPages
    .filter(p => p.status === 'Present' && !p.notAssessed)
    .map(p => ({
      type: 'existing' as const, label: p.displayName ? `${p.displayName} — ${p.url ? (() => { try { return new URL(p.url).pathname } catch { return p.url } })() : ''}` : p.label, url: p.url || '',
      score: typeof p.score === 'number' ? p.score : null,
      addSections: (p.missing || []).filter((m: string) => !/^FAQ/i.test(m)),
      faqs: FAQ_QUESTIONS[p.key] || FAQ_QUESTIONS.homepage,
      needsFaq: (p.missing || []).some((m: string) => /FAQ/i.test(m)),
    }))
    .sort((a, b) => (a.score ?? 101) - (b.score ?? 101))
  const newPages = missingBlueprints.map((b: any) => ({
    type: 'new' as const, label: b.blueprint.heading, impact: b.impact,
    addSections: b.blueprint.sections.filter((s: string) => !/^FAQ/i.test(s)),
    faqs: b.blueprint.questions,
  }))
  return { existing, newPages }
}

// ── PROJECTS: GPT synthesis layer. Turns raw findings into a few plain-language
// projects for a hotel marketing team. Grounded ONLY in the findings passed in. ──
const PROJECTS_SYSTEM = `You are a senior hotel AI-visibility (GEO) strategist writing for a hotel marketing director who is NOT technical. You are given the FINDINGS of an automated audit of one hotel website. Your job is to synthesise those findings into a short, clear set of PROJECTS the marketing team can act on — not a list of raw issues.

WHAT YOU KNOW ABOUT AI VISIBILITY (use this to explain WHY each project matters, in plain words):
- AI assistants (ChatGPT, Perplexity, Google AI) recommend a hotel only when the hotel's own pages give clear, retrievable, quotable evidence for a specific guest need.
- The biggest wins come from: (1) creating dedicated pages for guest intents the site can't answer at all (romantic, family, accessibility, parking, airport); (2) adding FAQ blocks and Quick Facts that mirror how guests ask questions; (3) stating clear positioning and distinctive features so AI can say WHY this hotel over others; (4) machine-readable trust signals (review/rating schema, awards).
- "Quick wins" are low-effort additions to existing pages (FAQ, Quick Facts, AI summary). "Projects" are new pages or substantial rewrites.

STRICT RULES:
- Use ONLY the findings provided. NEVER invent a fact about the hotel (no made-up amenities, locations, awards). You are describing GAPS and recommended ADDITIONS, not stating what the hotel has.
- "unlocks" must be copied verbatim from the searches listed in the findings. Do not invent searches.
- Group everything into 4 to 7 projects. Merge related gaps (e.g. all FAQ additions = one "Add FAQs" quick-win project).
- Order: quick-win projects first, then larger projects by impact (most failed searches first).
- Keep language simple and concrete. No jargon, no fluff. Each "why" is 1-2 sentences a non-technical marketer instantly understands.
- Also write a 2-3 sentence "overview": how the site reads to AI today, what it's strong/invisible for, and the single most important thing to do.
- BE HARSH. Every project must be specific to THIS hotel's findings and materially improve AI recommendation. Cut anything generic that could appear in any audit. Do not include a project unless it (a) unlocks named searches the site currently fails, or (b) creates or fixes a concrete page or section named in the findings. No "review your content", no "ensure consistency", no filler.
Return STRICTLY the JSON schema.`

function projectsSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['overview', 'method', 'projects'],
    properties: {
      overview: { type: 'string' },
      method: { type: 'string' },
      projects: {
        type: 'array', items: {
          type: 'object', additionalProperties: false,
          required: ['title', 'effort', 'impact', 'why', 'unlocks', 'steps'],
          properties: {
            title: { type: 'string' },
            effort: { type: 'string', enum: ['Quick win', 'Project'] },
            impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
            why: { type: 'string' },
            unlocks: { type: 'array', items: { type: 'string' } },
            steps: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  }
}

function fallbackProjects(findings: any) {
  const projects: any[] = []
  const qwPages = (findings.pages || []).filter((p: any) => (p.missing || []).some((m: string) => /FAQ|Quick Facts|AI summary/i.test(m)))
  if (qwPages.length) projects.push({
    title: 'Add FAQs, Quick Facts and AI summaries to existing pages', effort: 'Quick win', impact: 'High',
    why: 'AI answers guests by matching question-and-answer content and scannable facts. Adding these lets AI quote your pages directly instead of skipping you.',
    unlocks: [], steps: qwPages.map((p: any) => `${p.name}: add ${(p.missing || []).filter((m: string) => /FAQ|Quick Facts|AI summary/i.test(m)).join(', ')}`),
  })
  for (const mp of (findings.missingPages || [])) projects.push({
    title: `Create a ${mp.page} page`, effort: 'Project', impact: (mp.unlocks || []).length >= 2 ? 'High' : 'Medium',
    why: 'There is no dedicated content for this, so AI cannot recommend the hotel for these searches at all.',
    unlocks: mp.unlocks || [], steps: ['Build the page with the recommended sections and answer the listed questions in your own words.'],
  })
  const weakPages = (findings.pages || []).filter((p: any) => typeof p.score === 'number' && p.score < 60 && (p.missing || []).some((m: string) => !/FAQ|Quick Facts|AI summary/i.test(m)))
  for (const p of weakPages.slice(0, 3)) projects.push({
    title: `Strengthen the ${p.name} page`, effort: 'Project', impact: 'Medium',
    why: 'This page exists but is missing detail AI looks for, so recommendations stay tentative.',
    unlocks: [], steps: [`Add ${(p.missing || []).join(', ')}.`],
  })
  return { overview: `The site can confidently support ${findings.counts?.yes || 0} of ${(findings.counts?.yes || 0) + (findings.counts?.partial || 0) + (findings.counts?.no || 0)} tracked searches. The fastest gains come from adding FAQs and Quick Facts to existing pages, then building the missing intent pages.`, method: 'Projects are ordered by how many guest searches they unlock that the site cannot answer today.', projects }
}

async function buildProjects(findings: any, openaiKey: string) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.3, max_tokens: 2200,
        response_format: { type: 'json_schema', json_schema: { name: 'projects', strict: true, schema: projectsSchema() } },
        messages: [{ role: 'system', content: PROJECTS_SYSTEM }, { role: 'user', content: `FINDINGS (JSON):\n${JSON.stringify(findings)}` }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) throw new Error('empty')
    const parsed = JSON.parse(c)
    if (!parsed.projects || !parsed.projects.length) throw new Error('no projects')
    if (!parsed.method) parsed.method = 'Projects are ordered by how many guest searches they unlock that the site cannot answer today.'
    return parsed
  } catch {
    return fallbackProjects(findings)
  }
}

// ── CONTENT QUALITY: linguistic AI-readiness, evidence-grounded ──
const CONTENT_QUALITY_CATS: { key: string; label: string; desc: string }[] = [
  { key: 'faqcoverage', label: 'FAQ Coverage', desc: 'Real guest questions answered in clear question-and-answer form — the strongest lever for AI citation.' },
  { key: 'specificity', label: 'Specificity', desc: 'Concrete facts (numbers, names, distances, hours, prices) vs vague marketing language.' },
  { key: 'quotable', label: 'Quotable Phrasing', desc: 'Short, factual, liftable sentences AI can quote verbatim vs long flowery prose.' },
  { key: 'summaryblock', label: 'Summary / Quick-Facts Block', desc: 'A compact Key-Facts block AI can lift in one go.' },
  { key: 'clarity', label: 'Clarity & Assertiveness', desc: 'Verifiable, assertive statements vs hedged opinion ("one of the finest").' },
  { key: 'repetition', label: 'Semantic Variety', desc: 'Natural phrasing variety vs the same selling points repeated verbatim.' },
  { key: 'jargon', label: 'Concrete Language', desc: 'Plain concrete wording vs marketing metaphors and buzzwords.' },
]

const CQ_SYSTEM = `You are a strict, evidence-based content auditor judging how well ONE hotel website's writing is prepared to be QUOTED and CITED by AI search engines (ChatGPT, Perplexity, Google AI). You judge writing QUALITY for AI retrieval — not whether facts exist.

For EACH category return:
- "score": integer 0-100 (be strict; reserve 80+ for genuinely excellent AI-ready writing; most luxury hotel sites score 40-65 because they favour evocative marketing prose over machine-readable facts).
- "evidence": ONE short verbatim quote from the provided text justifying the score (a good example, or a problem example). Use "" only if truly nothing applies.
- "comment": 1-2 plain sentences — what you found (referencing the quote) and how to improve it for AI visibility. Concrete, no jargon.

RULES:
- Use ONLY the provided website text. NEVER invent facts, quotes, numbers or features.
- Every score MUST be justified by the evidence quote or an explicit statement that the element is absent.
- Be specific to THIS site. Never write a sentence that could apply to any hotel.
Return STRICTLY the JSON schema.`

function cqSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['categories'],
    properties: {
      categories: {
        type: 'array', items: {
          type: 'object', additionalProperties: false,
          required: ['key', 'score', 'evidence', 'comment'],
          properties: {
            key: { type: 'string' }, score: { type: 'integer' }, evidence: { type: 'string' }, comment: { type: 'string' },
          },
        },
      },
    },
  }
}

async function analyzeContentQuality(pages: any[], openaiKey: string) {
  if (!pages.length) return null
  const corpus = pages.map((p: any) => `URL: ${p.url}\nHEADINGS: ${(p.headings || []).slice(0, 10).join(' | ')}\nTEXT: ${(p.text || '').slice(0, 1200)}`).join('\n\n---\n\n').slice(0, 15000)
  const catList = CONTENT_QUALITY_CATS.map(c => `"${c.key}" = ${c.label}: ${c.desc}`).join('\n')
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0, max_tokens: 2500,
        response_format: { type: 'json_schema', json_schema: { name: 'content_quality', strict: true, schema: cqSchema() } },
        messages: [{ role: 'system', content: CQ_SYSTEM }, { role: 'user', content: `CATEGORIES TO SCORE:\n${catList}\n\n────────\nWEBSITE TEXT:\n${corpus}` }],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return null
    const parsed = JSON.parse(c)
    const byKey = new Map<string, any>(); for (const a of (parsed.categories || [])) byKey.set(a.key, a)
    const categories = CONTENT_QUALITY_CATS.map(def => {
      const a = byKey.get(def.key) || {}
      const score = Number.isFinite(a.score) ? Math.max(0, Math.min(100, a.score)) : 0
      return { key: def.key, label: def.label, score, evidence: (a.evidence || '').trim(), comment: (a.comment || '').trim() }
    })
    const score = categories.length ? Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length) : 0
    return { score, categories }
  } catch { return null }
}

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

    let effCity = city || '', effType = hotelType || '', effName = ''
    let overrides: Record<string, string> = {}
    let notOffered: string[] = []
    if (hotelId && sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data: h } = await sb.from('hotels').select('name, region, location, category, not_offered').eq('id', hotelId).single()
        if (h) { effName = effName || h.name || ''; effCity = effCity || h.location || h.region || ''; effType = effType || h.category || ''; if (Array.isArray(h.not_offered)) notOffered = h.not_offered }
        try {
          const { data: ov } = await sb.from('hotel_priority_pages').select('page_key, url').eq('hotel_id', hotelId)
          if (ov) for (const row of ov) if (row.page_key && row.url) overrides[row.page_key] = row.url
        } catch {}
      } catch {}
    }

    const homeHtml = await scrape(url, apiKey)
    if (!homeHtml) return NextResponse.json({ error: 'Could not load the website (it may block crawlers or be down).' }, { status: 502 })
    const homeLinks = extractLinks(homeHtml, origin)
    const sitemapLinks = await fetchSitemap(origin)
    const candidates = Array.from(new Set([url, ...homeLinks, ...sitemapLinks]))
    // SHARED PAGE DISCOVERY: classify the SAME canonical inventory the Brain crawls (one truth)
    const inventory = buildInventory(url, candidates, (() => { try { return new URL(url).pathname } catch { return '' } })())
    const discovered = inventory.selected

    const matchLink = (kws: string[]) => discovered.find(l => kws.some(k => l.toLowerCase().includes(k)))
    const matchAll = (kws: string[]) => discovered.filter(l => kws.some(k => l.toLowerCase().includes(k)))
    type Slot = { key: string; label: string; impact: string; cats: string[]; url: string | null; source: string }
    const slots: Slot[] = []

    const classifyUrl = (u: string): { key: string; label: string; impact: string; cats: string[] } => {
      const lu = u.toLowerCase()
      for (const def of PRIORITY) { if (def.key === 'homepage') continue; if (def.kws.some(k => lu.includes(k))) return { key: def.key, label: def.label.replace(/ pages?$/i, ''), impact: def.impact, cats: def.cats } }
      let slug = 'Page'
      try { const segs = new URL(u).pathname.split('/').filter(Boolean); const last = segs[segs.length - 1] || ''; if (last) slug = last.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) } catch {}
      return { key: 'homepage', label: slug, impact: 'Medium', cats: ['overall'] }
    }

    if (Array.isArray(manualUrls) && manualUrls.length) {
      // Manual list: audit exactly these
      manualUrls.forEach((u: string) => {
        const c = classifyUrl(u)
        const isHome = u.replace(/\/$/, '') === url.replace(/\/$/, '')
        slots.push({ key: isHome ? 'homepage' : c.key, label: isHome ? 'Homepage' : `${c.label} — ${(() => { try { return new URL(u).pathname } catch { return u } })()}`, impact: c.impact, cats: c.cats, url: u, source: 'manual' })
      })
    } else {
      // AUTO-DISCOVERY: match every PRIORITY type against the homepage's real links
      for (const def of PRIORITY) {
        if (def.key === 'homepage') { slots.push({ key: 'homepage', label: 'Homepage', impact: def.impact, cats: def.cats, url, source: 'home' }); continue }
        if (overrides[def.key]) { slots.push({ key: def.key, label: def.label, impact: def.impact, cats: def.cats, url: overrides[def.key], source: 'override' }); continue }
        if (def.multi) {
          const all = matchAll(def.kws).slice(0, 4)
          if (all.length) { all.forEach((u) => slots.push({ key: def.key, label: `${roomNameFromUrl(u)} — ${(() => { try { return new URL(u).pathname } catch { return u } })()}`, impact: def.impact, cats: def.cats, url: u, source: 'auto' })); continue }
          slots.push({ key: def.key, label: def.label, impact: def.impact, cats: def.cats, url: null, source: 'missing' }); continue
        }
        const found = matchLink(def.kws)
        slots.push({ key: def.key, label: def.label, impact: def.impact, cats: def.cats, url: found || null, source: found ? 'auto' : 'missing' })
      }
    }

    const toScrape = Array.from(new Set([...slots.filter(s => s.url).map(s => s.url as string), ...discovered])).slice(0, CRAWL_LIMIT)
    const pageCache: Record<string, any> = {}
    for (const u of toScrape) {
      const html = u === url ? homeHtml : await scrape(u, apiKey)
      if (!html) continue
      pageCache[u] = { url: u, schemaTypes: extractSchemaTypes(html), headings: extractHeadings(html), text: extractText(html), links: extractLinks(html, origin) }
    }
    const pages: any[] = Object.values(pageCache)
    // ── ONE TRUTH: enrich the readiness corpus with the Brain's stored facts. The Brain is the
    // canonical, complete crawl; the audit's re-scrape can be thinner/truncated. Merge Brain
    // facts (value + quote) per page so answerability is graded against the full site, not a
    // partial re-scrape. No-op if no Brain facts exist. ──
    try {
      if (hotelId && sbUrl && sbKey) {
        const sbB = createClient(sbUrl, sbKey)
        const { data: brainRowRD } = await sbB.from('hotel_brains').select('id').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (brainRowRD?.id) {
          const { data: bFacts } = await sbB.from('hotel_facts').select('fact_value, evidence_quote, page_url').eq('brain_id', brainRowRD.id)
          if (bFacts && bFacts.length) {
            const byPage: Record<string, string[]> = {}
            for (const f of bFacts) { const u = (f.page_url || '').replace(/\/$/, ''); if (!u) continue; (byPage[u] ||= []).push(`${f.fact_value}${f.evidence_quote ? ' — ' + f.evidence_quote : ''}`) }
            for (const p of pages) { const u = (p.url || '').replace(/\/$/, ''); const extra = byPage[u]; if (extra && extra.length) p.text = `${p.text || ''} ${extra.join('. ')}` }
            // add any Brain pages the audit never scraped at all, so their facts still count
            const scrapedSet = new Set(pages.map((p: any) => (p.url || '').replace(/\/$/, '')))
            for (const [u, facts] of Object.entries(byPage)) { if (!scrapedSet.has(u)) pages.push({ url: u, headings: [], text: facts.join('. '), schemaTypes: [], links: [] }) }
          }
        }
      }
    } catch {}
    if (pages.length === 0) return NextResponse.json({ error: 'Could not read any pages.' }, { status: 502 })
    const robots = await fetchRobots(origin)

    const allSchema = new Set<string>()
    for (const p of pages) for (const t of (p.schemaTypes || [])) allSchema.add(t)

    // ── PROMPTS: generate per-hotel questions from real site signals; fall back to the question bank ──
    let prompts: any[] = []
    const amenitySignals = detectAmenities(pages)
    const detectedPages = slots.filter(s => s.url).map(s => (s.label || '').split(' — ')[0]).filter(Boolean)
    // ── DEMAND MODEL: drive question generation from the hotel's CONFIRMED profile. ──
    // Loads the confirmed archetype + taxonomy and builds the v1 demand model. If the hotel
    // has no confirmed profile, buildDemandModel returns a generic fallback and the generator
    // behaves exactly as before — so un-profiled hotels are unaffected.
    let demandModel: any = null
    let confirmedArchetype: string | null = null
    let confirmedExperiences: string[] = []
    let manualQuestions: any[] = []
    if (hotelId && sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const { data: prof } = await sb.from('hotel_profile').select('*').eq('hotel_id', hotelId).maybeSingle()
        demandModel = buildDemandModel(prof || null, { location: effCity })
        if (prof?.taxonomy_status === 'confirmed' && prof?.archetype) { confirmedArchetype = prof.archetype; confirmedExperiences = [...(prof.primary_experiences||[]), ...(prof.secondary_experiences||[])] }
        try { const { data: hq } = await sb.from('hotels').select('audit_questions').eq('id', hotelId).single(); if (Array.isArray(hq?.audit_questions) && hq.audit_questions.length) manualQuestions = hq.audit_questions } catch {}
      } catch { demandModel = buildDemandModel(null, { location: effCity }) }
    }
    // ── V3 CATALOGUE PATH: if this hotel's confirmed archetype owns a canonical intent
    // catalogue, evaluate the site against THAT fixed set (recommendability) instead of
    // letting GPT invent questions. Deterministic intents → stable keys → no churn. Any
    // hotel without a catalogue falls straight through to the existing GPT generator,
    // so all other hotels are completely unaffected.
    const catalogue = getCatalogueForArchetype(confirmedArchetype)
    if (manualQuestions.length) {
      prompts = manualQuestions.map((q: any) => ({
        question: String(q.question || '').trim(),
        audit_question: q.audit_question || '',
        expected_evidence: Array.isArray(q.expected_evidence) ? q.expected_evidence : [],
        stage: q.stage || '',
        category: q.category || 'overall',
        intent_id: q.intent_id || (q.stage ? String(q.stage) + '-manual' : 'manual'),
        priority: q.priority === 'medium' ? 'medium' : 'high',
      })).filter((q: any) => q.question)
    } else if (catalogue && confirmedExperiences.length === 0) {
      const intents = intentsToEvaluate(confirmedArchetype, notOffered, confirmedExperiences)
      prompts = intents.map(it => ({
        question: it.traveller_intent || it.audit_question,
        audit_question: it.audit_question,
        expected_evidence: it.expected_evidence,
        stage: it.stage,
        category: it.category,
        intent_id: it.intent_id,
        priority: it.priority,
      }))
    } else {
      prompts = await generateQuestions({ name: effName, city: effCity, type: effType, pages: detectedPages, amenities: amenitySignals, demand: demandModel }, openaiKey)
    }
    if (!prompts.length && sbUrl && sbKey) {
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

    // ── DEMAND COVERAGE + CLUSTERS (Pillar 2) ──
    const buckets: Record<string, { yes: number; partial: number; no: number; total: number; answered: string[]; missing: string[] }> = {}
    for (const r of readiness) {
      const cat = CAT_MAP[r.category] || 'overall'
      const b = (buckets[cat] ||= { yes: 0, partial: 0, no: 0, total: 0, answered: [], missing: [] })
      b.total++
      if (r.readiness === 'YES') { b.yes++; b.answered.push(r.question) }
      else if (r.readiness === 'PARTIAL') { b.partial++; b.missing.push(r.question) }
      else { b.no++; b.missing.push(r.question) }
    }
    const demandCoverage = Object.entries(buckets).map(([cat, b]) => ({
      category: cat, label: CAT_LABEL[cat] || cat, coverage: b.total ? Math.round(((b.yes + b.partial * 0.5) / b.total) * 100) : 0,
      yes: b.yes, partial: b.partial, no: b.no, total: b.total,
    })).sort((a, b) => a.coverage - b.coverage)
    const clusters = Object.entries(buckets).map(([cat, b]) => ({
      key: cat, label: CAT_LABEL[cat] || cat,
      coverage: b.total ? Math.round(((b.yes + b.partial * 0.5) / b.total) * 100) : 0,
      total: b.total, answered: b.answered, missing: b.missing,
    })).sort((a, b) => b.coverage - a.coverage)
    const strongFor = demandCoverage.filter(d => d.coverage >= 67).map(d => d.label)
    const weakFor = demandCoverage.filter(d => d.coverage < 34).map(d => d.label)

    // ── PER-PAGE AUDIT (also feeds Room intelligence / Question architecture) ──
    const promptsByCat = (cats: string[]) => readiness.filter((r: any) => cats.includes(CAT_MAP[r.category] || 'overall')).map((r: any) => r.question)
    const importantPages: any[] = []
    for (const s of slots) {
      const expected = EXPECTED[s.key] || []
      if (!s.url || !pageCache[s.url]) {
        importantPages.push({ key: s.key, label: s.label, displayName: pageDisplayName({ key: s.key, label: s.label, url: s.url }, slots), cats: s.cats, status: 'Missing', impact: s.impact, source: s.source,
          reason: `No ${s.label.toLowerCase()} found in the crawl.`, affects: promptsByCat(s.cats).slice(0, 4), blueprint: BLUEPRINTS[s.key] || null })
        continue
      }
      const a = await auditPage(pageCache[s.url], s.key, openaiKey)
      if (!a) {
        importantPages.push({ key: s.key, label: s.label, displayName: pageDisplayName({ key: s.key, label: s.label, url: s.url }, slots), cats: s.cats, status: 'Present', impact: s.impact, source: s.source,
          url: s.url, score: null, notAssessed: true, present: [], missing: [], examples: [], evidence: '', affects: [], fields: {} })
        continue
      }
      const present = expected.filter(e => a[e.field]).map(e => e.label)
      const missingDefs = expected.filter(e => !a[e.field])
      const missing = missingDefs.map(e => e.label)
      const examples = (s.key === 'homepage' || s.key === 'offers' || s.key === 'experiences') ? missingDefs.map(e => EXAMPLES[e.field]).filter(Boolean).slice(0, 3) : []
      importantPages.push({ key: s.key, label: s.label, displayName: pageDisplayName({ key: s.key, label: s.label, url: s.url }, slots), cats: s.cats, status: 'Present', impact: s.impact, source: s.source,
        url: s.url, score: pct(present.length, expected.length), present, missing, examples,
        evidence: a?.evidence || '', affects: missing.length ? promptsByCat(s.cats).slice(0, 4) : [], fields: a })
    }

    // ── MISSING BLUEPRINTS (new pages worth creating) ──
    const presentKeys = new Set(slots.filter(s => s.url && pageCache[s.url]).map(s => s.key))
    // Some blueprints are already covered by a differently-named existing page
    // (e.g. a "business" page need is satisfied by an existing Meetings & Events page).
    const KEY_ALIAS: Record<string, string[]> = { business: ['meetings'] }
    const pageExistsFor = (k: string) => presentKeys.has(k) || (KEY_ALIAS[k] || []).some(a => presentKeys.has(a))
    // Exclude blueprints for intents the hotel has confirmed it does not offer, so the audit
    // never recommends building a page (e.g. a Spa page) for a product the hotel doesn't have.
    const BLUEPRINT_NOTOFFERED: Record<string, string> = { wellness: 'spa', spa: 'spa', family: 'family', romantic: 'romantic', business: 'business' }
    const excludedBlueprints = new Set((notOffered || []).map(s => BLUEPRINT_NOTOFFERED[String(s).toLowerCase()] || String(s).toLowerCase()))
    const blueprintKeys = ['parking', 'accessibility', 'pets', 'breakfast', 'airport', 'family', 'romantic', 'business', 'spa', 'dining'].filter(k => !excludedBlueprints.has(k))
    const BP_KEYWORDS: Record<string, string[]> = {
      parking: ['parking'], accessibility: ['accessible', 'accessibility'], pets: ['pet'], breakfast: ['breakfast'],
      airport: ['airport'], romantic: ['romantic', 'honeymoon', 'couple'], business: ['business', 'meeting', 'executive', 'event'],
      spa: ['spa', 'wellness'], dining: ['dining', 'restaurant', 'gastronomy', 'fine dining'],
    }
    const BP_CATS: Record<string, string[]> = {
      parking: ['practical'], accessibility: ['accessibility'], pets: ['practical'], breakfast: ['dining'],
      airport: ['location'], romantic: ['romantic'], business: ['business'], spa: ['wellness'], dining: ['dining'],
    }
    // A blueprint is worth creating only when a SPECIFIC prompt for it actually scored NO
    // (driven by prompt outcomes, not by an incidental keyword appearing somewhere on the site).
    const missingBlueprints = blueprintKeys.filter(k => !presentKeys.has(k) && BLUEPRINTS[k]).map(k => {
      const def = PRIORITY.find(p => p.key === k)
      const kws = BP_KEYWORDS[k] || []
      const affectsRows = readiness.filter((r: any) => kws.some(w => r.question.toLowerCase().includes(w)))
      const affects = affectsRows.map((r: any) => r.question).slice(0, 4)
      const noCount = affectsRows.filter((r: any) => r.readiness === 'NO').length
      return { key: k, impact: def?.impact || 'Medium', affects, noCount, categories: BP_CATS[k] || [], blueprint: BLUEPRINTS[k] }
    }).filter(b => b.noCount >= 1)

    // ── LAYER 0 facts ──
    const factTopics = [
      { key: 'Parking', kws: ['parking', 'valet', 'voiturier', 'garage', 'stationnement'] },
      { key: 'Breakfast', kws: ['breakfast', 'petit-déjeuner', 'petit dejeuner', 'petit déjeuner', 'brunch'] },
      { key: 'Pets', kws: ['pet', 'dog', 'animal', 'animaux', 'chien'] },
      { key: 'Accessibility', kws: ['accessible', 'wheelchair', 'step-free', 'disabled', 'accessibilité', 'mobilité réduite', 'pmr'] },
      { key: 'Airport transfer', kws: ['airport transfer', 'transfert aéroport', 'shuttle', 'navette', 'limousine'] },
      { key: 'Check-in / out', kws: ['check-in', 'check in', 'check-out', 'check out', 'arrivée', 'départ'] },
      { key: 'Cancellation', kws: ['cancellation', 'cancel', 'annulation', 'refundable'] },
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

    // ── ENTITY COVERAGE ──
    const entityHits = (() => {
      const joined = pages.map((p: any) => p.text).join(' ')
      const re = /\b([A-Z][a-zà-ÿ]+(?:\s+(?:[A-Z][a-zà-ÿ]+|de|du|des|d'|la|le))*)\b/g
      const stop = new Set(['The', 'This', 'Our', 'We', 'You', 'Your', 'Hotel', 'Book', 'Home', 'Rooms', 'Spa', 'Dining', 'Contact', 'Welcome', 'Discover'])
      const found = new Set<string>(); let m
      while ((m = re.exec(joined)) !== null) { const tok = m[1].trim(); if (tok.length > 4 && tok.includes(' ') && !stop.has(tok.split(' ')[0])) found.add(tok) }
      return found.size
    })()

    // ── SCHEMA + TRUST ──
    const schemaDefs = ['Hotel', 'HotelRoom', 'FAQPage', 'Review', 'AggregateRating', 'Restaurant', 'Offer', 'Event', 'BreadcrumbList']
    const schemaFound = schemaDefs.filter(s => allSchema.has(s) || (s === 'Hotel' && allSchema.has('LodgingBusiness')))
    const trustText = pages.map((p: any) => p.text.toLowerCase()).join(' ')
    const trust = { reviewSchema: allSchema.has('AggregateRating') || allSchema.has('Review'), awards: /\b(forbes|michelin|award|recognition|voted|best hotel|guide)\b/.test(trustText), ratings: /\b(rated|rating|stars|tripadvisor|5-star|five-star)\b/.test(trustText) }

    // ── INTERNAL LINKING (Layer 11) — score topic clusters from crawled links ──
    const themeKw: Record<string, string[]> = { family: ['family', 'kids', 'children'], spa: ['spa', 'wellness'], dining: ['dining', 'restaurant', 'bar'], romantic: ['romantic', 'couple', 'honeymoon'], rooms: ['room', 'suite', 'accommodation', 'villa'] }
    const linkingFindings: string[] = []
    let clusterCount = 0, themesWithHub = 0
    for (const [theme, kws] of Object.entries(themeKw)) {
      const hub = pages.find((p: any) => kws.some(k => (p.url || '').toLowerCase().includes(k)))
      if (!hub) continue
      themesWithHub++
      const internalToTheme = (hub.links || []).filter((l: string) => kws.some(k => l.toLowerCase().includes(k)) && l !== hub.url).length
      if (internalToTheme >= 2) { clusterCount++; linkingFindings.push(`${theme}: ${internalToTheme} related links`) }
    }
    const linkingStatus = clusterCount >= 3 ? 'PASS' : clusterCount >= 1 ? 'PARTIAL' : 'FAIL'

    // ── DERIVE LAYER VALUES ──
    const has = (k: string) => slots.some(s => s.key === k && s.url && pageCache[s.url])
    const presentSlots = slots.filter(s => s.url && pageCache[s.url])
    const pf = (n: number) => n >= 75 ? 'PASS' : n >= 40 ? 'PARTIAL' : 'FAIL'
    const fixFor = (missing: string[], verb = 'Add') => missing.length ? `${verb} ${missing.slice(0, 4).join(', ')}.` : 'Nothing missing.'

    // L1 core
    const coreKeys = [['homepage', 'Homepage'], ['rooms', 'Rooms'], ['dining', 'Dining'], ['spa', 'Spa'], ['location', 'Location'], ['offers', 'Offers'], ['meetings', 'Meetings'], ['luxury', 'Contact / About']] as [string, string][]
    const coreHave = coreKeys.filter(([k]) => has(k)).map(([, l]) => l)
    const coreMiss = coreKeys.filter(([k]) => !has(k)).map(([, l]) => l)
    const coreScore = pct(coreHave.length, coreKeys.length)

    // L2 intent — exclude intents the hotel has confirmed it does not offer (owner-set not_offered).
    // 'wellness' in not_offered maps to the 'spa' intent. Confirmed-absence intents are never
    // counted against the hotel and never recommended as a page to build.
    const NOTOFFERED_INTENT: Record<string, string> = { wellness: 'spa', spa: 'spa', family: 'family', romantic: 'romantic', business: 'business' }
    const excludedIntents = new Set((notOffered || []).map(s => NOTOFFERED_INTENT[String(s).toLowerCase()] || String(s).toLowerCase()))
    const intentKeys = ([['family', 'Family'], ['romantic', 'Romantic'], ['business', 'Business'], ['spa', 'Spa'], ['pets', 'Pet-friendly'], ['accessibility', 'Accessible'], ['parking', 'Parking'], ['airport', 'Near-airport']] as [string, string][]).filter(([k]) => !excludedIntents.has(k))
    const intentHave = intentKeys.filter(([k]) => has(k)).map(([, l]) => l)
    const intentMiss = intentKeys.filter(([k]) => !has(k)).map(([, l]) => l)
    const intentScore = pct(intentHave.length, intentKeys.length)

    // L3 knowledge center
    const kcKeys = [['parking', 'Parking'], ['breakfast', 'Breakfast'], ['pets', 'Pets'], ['accessibility', 'Accessibility'], ['airport', 'Airport transfer']] as [string, string][]
    const kcHave = kcKeys.filter(([k]) => has(k)).map(([, l]) => l)
    const kcMiss = kcKeys.filter(([k]) => !has(k)).map(([, l]) => l)
    const hasFaqAnywhere = allSchema.has('FAQPage') || importantPages.some(p => p.fields && p.fields.faq)
    if (hasFaqAnywhere) kcHave.push('FAQ'); else kcMiss.push('Central FAQ')
    const kcScore = pct(kcHave.length, kcKeys.length + 1)

    // L4 room intelligence
    const roomPages = importantPages.filter(p => p.key === 'rooms' && p.status === 'Present' && !p.notAssessed)
    const roomScore = roomPages.length ? Math.round(roomPages.reduce((s, p) => s + (p.score || 0), 0) / roomPages.length) : 0
    const roomMiss = Array.from(new Set(roomPages.flatMap(p => p.missing || [])))
    const roomEvidence = roomPages.map(p => `${p.displayName} (${p.score}%)`)

    // L5 retrieval blocks
    const majorForBlocks = importantPages.filter(p => ['homepage', 'offers', 'experiences', 'spa', 'luxury'].includes(p.key) && p.fields)
    const withQF = majorForBlocks.filter(p => p.fields.quickfacts).length
    const withSummary = majorForBlocks.filter(p => p.fields.aisummary).length
    const blocksScore = majorForBlocks.length ? pct(withQF + withSummary, majorForBlocks.length * 2) : 0
    const blocksMiss: string[] = []
    if (withQF < majorForBlocks.length) blocksMiss.push('Quick Facts block on key pages')
    if (withSummary < majorForBlocks.length) blocksMiss.push('AI summary on key pages')

    // L6 question architecture (WHAT/WHO/WHY/COMPARISON/FAQ across assessed pages)
    const qaMap = [
      { comp: 'WHAT', fields: ['overview', 'descriptions', 'positioning', 'services'] },
      { comp: 'WHO', fields: ['who', 'idealfor'] },
      { comp: 'WHY', fields: ['why', 'idealfor'] },
      { comp: 'COMPARISON', fields: ['comparison'] },
      { comp: 'FAQ', fields: ['faq'] },
    ]
    const assessed = importantPages.filter(p => p.fields && p.status === 'Present' && !p.notAssessed)
    const qaPresent = qaMap.filter(q => assessed.some(p => q.fields.some(f => p.fields[f]))).map(q => q.comp)
    const qaMiss = qaMap.filter(q => !assessed.some(p => q.fields.some(f => p.fields[f]))).map(q => q.comp)
    const qaScore = pct(qaPresent.length, qaMap.length)

    // L8 recommendation content (comparison / ideal-for present anywhere + intent pages)
    const recHas = assessed.some(p => p.fields.comparison || p.fields.idealfor) || intentHave.length >= 2
    const recEvidence: string[] = []
    if (assessed.some(p => p.fields.comparison)) recEvidence.push('Comparison sections present')
    if (assessed.some(p => p.fields.idealfor)) recEvidence.push('Ideal-For sections present')
    if (intentHave.length) recEvidence.push(`${intentHave.length} intent pages`)
    const recMiss = recHas ? [] : ['Comparison sections', 'Ideal-For / best-for sections']

    // L9 local expertise
    const localHints = ['things-to-do', 'guide', 'discover', 'experiences', 'neighbourhood', 'area', 'attractions']
    const localPages = pages.filter((p: any) => localHints.some(k => (p.url || '').toLowerCase().includes(k)))
    const localStatus = localPages.length >= 2 ? 'PASS' : localPages.length === 1 ? 'PARTIAL' : 'FAIL'

    // L13 answer library (tied to the 30 prompts — no fabricated counts)
    const answerable = yesN + partialN
    const answerStatus = readiness.length ? (answerable / readiness.length >= 0.7 ? 'PASS' : answerable / readiness.length >= 0.4 ? 'PARTIAL' : 'FAIL') : 'FAIL'

    const L = (n: number, extra: any) => ({ n, ...LAYER_META[n], ...extra })
    const scatteredCount = layer0.filter(l => l.status === 'Scattered').length
    const layer0Missing = layer0.filter(l => l.status === 'Missing').map(l => l.topic)
    const layers = [
      L(0, { status: layer0.every(l => l.status === 'Single source' || l.status === 'Present') ? 'PASS' : layer0.some(l => l.status === 'Missing') ? 'PARTIAL' : 'PARTIAL', detail: layer0, evidence: layer0.filter(l => l.status !== 'Missing').map(l => `${l.topic}: ${l.note}`), missing: layer0Missing, scoreReason: `${layer0Missing.length ? layer0Missing.join(', ') + ' could not be found at all; ' : ''}${scatteredCount} fact(s) are scattered across pages with no single dedicated source. AI has to guess instead of quoting one reliable answer.`, fix: fixFor(layer0Missing.map(l => `a dedicated ${l} page`), 'Create') }),
      L(1, { status: pf(coreScore), score: coreScore, evidence: coreHave, missing: coreMiss, scoreReason: `${coreHave.length} of ${coreKeys.length} expected core pages were found. ${coreMiss.length ? 'Missing: ' + coreMiss.join(', ') + '.' : 'All core pages present.'}`, fix: fixFor(coreMiss.map(m => `a ${m} page`), 'Create') }),
      L(2, { status: pf(intentScore), score: intentScore, evidence: intentHave.map(x => `${x} page`), missing: intentMiss.map(x => `${x} page`), scoreReason: `Only ${intentHave.length} of ${intentKeys.length} guest-intent pages exist${intentHave.length ? ' (' + intentHave.join(', ') + ')' : ''}. Without a page built around an intent, AI has nothing to match a search like "best ${intentMiss[0] ? intentMiss[0].toLowerCase() : 'family'} hotel" to.`, fix: fixFor(intentMiss.map(m => `a ${m} page`), 'Create') }),
      L(3, { status: pf(kcScore), score: kcScore, evidence: kcHave, missing: kcMiss, scoreReason: `${kcHave.length} of ${kcKeys.length + 1} dedicated fact pages were found. ${kcMiss.length ? 'Missing: ' + kcMiss.join(', ') + '. ' : ''}A dedicated, crawlable page per fact is the most reliable way for AI to retrieve a specific answer.`, fix: fixFor(kcMiss.map(m => `a dedicated ${m} page`), 'Create') }),
      L(4, { status: pf(roomScore), score: roomScore, evidence: roomEvidence, missing: roomMiss, scoreReason: `Room pages describe the rooms but average only ${roomScore}% of what AI needs. Missing across them: ${roomMiss.length ? roomMiss.join(', ') : 'nothing'}. Without who-it's-for and comparison detail, AI can recommend the hotel but not the right room.`, fix: fixFor(roomMiss, 'Add') + ' to your room pages.' }),
      L(5, { status: pf(blocksScore), score: blocksScore, evidence: [withQF ? `Quick Facts on ${withQF} page(s)` : '', withSummary ? `AI summary on ${withSummary} page(s)` : ''].filter(Boolean), missing: blocksMiss, scoreReason: `${withQF} key page(s) have a Quick Facts block and ${withSummary} have an AI summary, out of ${majorForBlocks.length} checked. These structured blocks are the easiest thing for AI to lift verbatim, so when they're absent your answers are less likely to be quoted accurately.`, fix: fixFor(blocksMiss, 'Add') }),
      L(6, { status: pf(qaScore), score: qaScore, evidence: qaPresent, missing: qaMiss, scoreReason: `Your pages cover ${qaPresent.length} of ${qaMap.length} question types AI looks for${qaPresent.length ? ' (' + qaPresent.join(', ') + ')' : ''}. Missing: ${qaMiss.length ? qaMiss.join(', ') : 'none'}. Pages that only describe — without answering WHO/WHY/comparison/FAQ — are weak sources for AI.`, fix: qaMiss.length ? `Make sure pages answer ${qaMiss.join(', ')} for their topic.` : 'Nothing missing.' }),
      L(7, { status: entityHits >= 12 ? 'PASS' : entityHits >= 5 ? 'PARTIAL' : 'FAIL', evidence: [`${entityHits} named entities across crawled pages`], missing: entityHits >= 12 ? [] : ['More named landmarks, airports, stations, neighbourhoods'], scoreReason: `${entityHits} named places/landmarks were detected across the crawled pages${entityHits >= 12 ? ', which is enough to anchor the hotel in a location AI understands.' : '. Naming the airport, stations, neighbourhoods and nearby attractions helps AI place you for location-based searches.'}`, fix: entityHits >= 12 ? 'Nothing missing.' : 'Name nearby landmarks, the airport, stations and attractions on your location and intent pages.' }),
      L(8, { status: recHas ? 'PASS' : 'FAIL', evidence: recEvidence, missing: recMiss, scoreReason: recHas ? `Recommendation cues were found (${recEvidence.join('; ')}), so AI has signals to say who the hotel is best for.` : `No comparison or "best for" sections were found, so AI has nothing explicit to base a recommendation on and tends to hedge.`, fix: recMiss.length ? 'Add comparison and best-for sections to room and intent pages.' : 'Nothing missing.' }),
      L(9, { status: localStatus, evidence: localPages.map((p: any) => { try { return new URL(p.url).pathname } catch { return p.url } }), missing: localStatus === 'PASS' ? [] : ['Local guide pages (things to do, area guide)'], scoreReason: `${localPages.length} local-guide page(s) were found. ${localStatus === 'PASS' ? 'Good local authority signals.' : 'Local guides (things to do, area guides) signal authority and answer the planning questions guests ask AI alongside booking.'}`, fix: localStatus === 'PASS' ? 'Nothing missing.' : 'Add local guide pages: things to do, family guide, romantic guide.' }),
      L(10, { status: (trust.reviewSchema && (trust.awards || trust.ratings)) ? 'PASS' : (trust.reviewSchema || trust.awards || trust.ratings) ? 'PARTIAL' : 'FAIL', evidence: [trust.reviewSchema ? 'Review schema present' : '', trust.awards ? 'Awards mentioned' : '', trust.ratings ? 'Ratings mentioned' : ''].filter(Boolean), missing: [!trust.reviewSchema ? 'Review / AggregateRating schema' : '', !trust.awards ? 'Awards & recognition' : '', !trust.ratings ? 'Guest ratings' : ''].filter(Boolean), scoreReason: `${[trust.reviewSchema ? 'review schema' : '', trust.awards ? 'awards' : '', trust.ratings ? 'ratings' : ''].filter(Boolean).join(', ') || 'No trust signals'} detected. ${trust.reviewSchema ? '' : 'Without machine-readable review/rating data, AI cannot read your reputation, which it weighs heavily when choosing which hotel to surface first.'}`, fix: !trust.reviewSchema ? 'Add Review and AggregateRating schema so AI can read your ratings.' : 'Surface awards and guest ratings prominently.' }),
      L(11, { status: linkingStatus, evidence: linkingFindings, missing: linkingStatus === 'PASS' ? [] : ['Topic clusters interlinking related pages'], scoreReason: `${clusterCount} topic cluster(s) with strong interlinking were detected. ${linkingStatus === 'PASS' ? 'Crawlers can follow your pages into clear themes.' : 'When related pages don\u2019t link to each other, crawlers may miss pages and can\u2019t tell which belong to which intent.'}`, fix: linkingStatus === 'PASS' ? 'Nothing missing.' : 'Link each intent hub to its related pages (e.g. Family → Family Rooms → Family Offers → Family FAQ).' }),
      L(12, { status: pf(pct(schemaFound.length, schemaDefs.length)), score: pct(schemaFound.length, schemaDefs.length), present: schemaFound, evidence: schemaFound, missing: schemaDefs.filter(s => !schemaFound.includes(s)), scoreReason: `${schemaFound.length} of ${schemaDefs.length} structured-data types were found${schemaFound.length ? ' (' + schemaFound.join(', ') + ')' : ''}. Missing: ${schemaDefs.filter(s => !schemaFound.includes(s)).join(', ')}. Schema is the most direct way to feed facts to AI without guesswork.`, fix: fixFor(schemaDefs.filter(s => !schemaFound.includes(s)).map(s => `${s} schema`), 'Add') }),
      L(13, { status: answerStatus, evidence: [`${answerable} of ${readiness.length} tracked questions answerable`], missing: readiness.filter((r: any) => r.readiness === 'NO').map((r: any) => r.question).slice(0, 5), scoreReason: `The site can confidently or partly answer ${answerable} of ${readiness.length} tracked guest questions. The breadth of answerable questions is a direct measure of how often AI can use your site to respond to a guest.`, fix: answerStatus === 'PASS' ? 'Nothing missing.' : 'Add FAQs and fact pages for the unanswered questions listed in Pillar 2.' }),
    ]

    const schemaScore = pct(schemaFound.length, schemaDefs.length)
    const architectureScore = Math.round(
      coreScore * 0.16 + intentScore * 0.14 + kcScore * 0.12 + roomScore * 0.10 + qaScore * 0.08 +
      schemaScore * 0.14 + Math.min(100, entityHits * 8) * 0.06 +
      (linkingStatus === 'PASS' ? 100 : linkingStatus === 'PARTIAL' ? 50 : 0) * 0.06 +
      ((trust.reviewSchema ? 50 : 0) + (trust.awards ? 25 : 0) + (trust.ratings ? 25 : 0)) * 0.08 +
      (answerStatus === 'PASS' ? 100 : answerStatus === 'PARTIAL' ? 50 : 0) * 0.06
    )

    // ── PILLAR 3: recommendation coverage (intents with definition/why/fix) ──
    const INTENT_META: Record<string, { label: string; definition: string; why: string }> = {
      luxury: { label: 'Luxury', definition: 'Can AI recommend the hotel for high-end luxury searches?', why: 'The core positioning for a 5-star property; the highest-value demand.' },
      romantic: { label: 'Romantic', definition: 'Can AI recommend it for couples, honeymoons and romantic getaways?', why: 'High-margin, high-intent demand that books premium rooms and packages.' },
      family: { label: 'Family', definition: 'Can AI recommend it for families with children?', why: 'Books multiple rooms and longer stays; strong off-peak demand.' },
      wellness: { label: 'Wellness', definition: 'Can AI recommend it for spa and wellness stays?', why: 'Growing, high-value demand; often the strongest differentiator.' },
      business: { label: 'Business', definition: 'Can AI recommend it for business travel, meetings and events?', why: 'Reliable midweek and corporate demand.' },
      dining: { label: 'Dining', definition: 'Can AI recommend it for fine dining and gastronomy?', why: 'Drives both stays and local reputation.' },
      location: { label: 'Location & airport', definition: 'Can AI recommend it for location, lake views and airport proximity?', why: 'Practical filters travellers and AI use to shortlist hotels.' },
      accessibility: { label: 'Accessibility', definition: 'Can AI recommend it for accessible stays?', why: 'A growing, underserved search category with little competition.' },
      practical: { label: 'Practical (parking/pets)', definition: 'Can AI answer practical filters like parking and pets?', why: 'Common dealbreaker questions; a single missing fact can drop you from a shortlist.' },
      overall: { label: 'Overall / brand', definition: 'Can AI describe and recommend the hotel in general?', why: 'The catch-all positioning behind every recommendation.' },
    }
    const recommendation = demandCoverage.map(d => {
      const meta = INTENT_META[d.category] || { label: d.label, definition: '', why: '' }
      const bp = Object.entries(BP_CATS).find(([, cats]) => cats.includes(d.category))
      const bpKey = bp?.[0]
      const evidenceRows = readiness.filter((r: any) => (CAT_MAP[r.category] || 'overall') === d.category && r.readiness !== 'NO' && r.evidence)
      const missingRows = readiness.filter((r: any) => (CAT_MAP[r.category] || 'overall') === d.category && r.readiness === 'NO')
      return {
        key: d.category, label: meta.label, definition: meta.definition, why: meta.why,
        coverage: d.coverage,
        evidence: evidenceRows.slice(0, 2).map((r: any) => r.evidence),
        missing: missingRows.map((r: any) => r.question).slice(0, 4),
        fix: d.coverage >= 67 ? 'Strong — keep content fresh.' : bpKey && !presentKeys.has(bpKey) ? `Create a ${BLUEPRINTS[bpKey].heading} page.` : 'Add the missing sections and FAQs flagged in the page plan.',
      }
    }).sort((a, b) => a.coverage - b.coverage)

    const architecture = { layers, note: 'Architecture layers are objective findings computed from crawled pages only.', score: architectureScore }
    const actionPlan = buildActionPlan(readiness, importantPages, missingBlueprints, demandCoverage)
    const contentPlan = buildContentPlan(importantPages, missingBlueprints)
    const contentQuality = await analyzeContentQuality(pages, openaiKey)

    // Grounded findings → GPT synthesis into plain-language projects (dashboard lead)
    const findings = {
      score: recScore,
      counts: { yes: yesN, partial: partialN, no: noN },
      coverageByType: demandCoverage.map(d => ({ type: d.label, coverage: d.coverage })),
      cannotRecommend: readiness.filter((r: any) => r.readiness === 'NO').map((r: any) => r.question),
      weakRecommend: readiness.filter((r: any) => r.readiness === 'PARTIAL').map((r: any) => ({ search: r.question, holdingBack: r.reasons })),
      pages: importantPages.filter((p: any) => p.status === 'Present' && !p.notAssessed).map((p: any) => ({ name: p.displayName, score: p.score, missing: p.missing })),
      missingPages: missingBlueprints.map((b: any) => ({ page: b.blueprint.heading, unlocks: b.affects })),
      architecture: { schemaMissing: schemaDefs.filter(s => !schemaFound.includes(s)), trust: { reviewSchema: trust.reviewSchema, awards: trust.awards, ratings: trust.ratings } },
    }
    const projects = await buildProjects(findings, openaiKey)

    const result = {
      url, city: effCity || null, hotelType: effType || null,
      // headline
      recommendation: { score: recScore, yes: yesN, partial: partialN, no: noN, total: readiness.length, results: readiness },
      architectureScore,
      // executive layer
      projects,
      actionPlan, contentPlan, contentQuality,
      summary: { strongFor, weakFor },
      // four pillars
      pillars: {
        architecture: { score: architectureScore, layers },
        answerability: { score: recScore, clusters, total: readiness.length, yes: yesN, partial: partialN, no: noN },
        recommendation: { intents: recommendation },
        trust: { reviewSchema: trust.reviewSchema, awards: trust.awards, ratings: trust.ratings, why: 'Trust signals (reviews, awards, ratings, recognition) are weighed heavily by AI when choosing which hotel to surface first.', missing: [!trust.reviewSchema ? 'Review / AggregateRating schema' : '', !trust.awards ? 'Awards & recognition' : '', !trust.ratings ? 'Guest ratings' : ''].filter(Boolean) },
      },
      // supporting detail
      demandCoverage, importantPages, missingBlueprints, architecture,
      robots, pagesScraped: pages.map((p: any) => p.url), crawlDepth: pages.length, crawlLimit: CRAWL_LIMIT,
    }

    let memory: any = null
    if (hotelId && sbUrl && sbKey) {
      try {
        const sb = createClient(sbUrl, sbKey)
        const auditRunId = (globalThis.crypto && globalThis.crypto.randomUUID) ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        // Load the Hotel Brain's confirmed facts so the evidence layer can mark
        // genuinely-confirmed topics as 'confirmed' (shared truth with the consultant).
        try {
          const { data: brainRow } = await sb.from('hotel_brains').select('id').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(1).maybeSingle()
          if (brainRow?.id) {
            const { data: brainFacts } = await sb.from('hotel_facts').select('category, fact_value, evidence_quote, page_url').eq('brain_id', brainRow.id)
            ;(result as any).facts = brainFacts || []
          } else { (result as any).facts = [] }
        } catch { (result as any).facts = [] }
        const findings = buildFindings(result)
        // load previous run's finding keys for this hotel
        let previousKeys: string[] = []
        try {
          const { data: prev } = await sb.from('audit_findings').select('finding_key, audit_run_id, created_at').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(400)
          if (prev && prev.length) {
            const lastRun = prev[0].audit_run_id
            previousKeys = prev.filter((r: any) => r.audit_run_id === lastRun).map((r: any) => r.finding_key)
          }
        } catch {}
        memory = diffFindings(findings, previousKeys)
        // store this run's findings
        const rows = findings.map(f => ({ audit_run_id: auditRunId, hotel_id: hotelId, finding_key: f.finding_key, type: f.type, title: f.title, evidence: f.evidence, recommendation: f.recommendation, impact: f.impact, category: f.category, status: f.status, affected_queries: f.affected_queries, evidence_state: f.evidence_state || null, evidence_reason: f.evidence_reason || null }))
        for (let i = 0; i < rows.length; i += 100) await sb.from('audit_findings').insert(rows.slice(i, i + 100))
        // save the audit with memory attached
        await sb.from('hotel_audits').insert({ hotel_id: hotelId, url, overall: recScore, result: { ...result, memory } })
      } catch {}
    }
    return NextResponse.json({ ...result, memory })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Audit failed' }, { status: 500 })
  }
}