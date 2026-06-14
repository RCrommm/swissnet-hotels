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
  { key: 'rooms', label: 'Room pages', kws: ['room', 'suite', 'accommodation', 'chambre', 'zimmer', 'villa'], impact: 'High', cats: ['luxury', 'family', 'romantic'], multi: true },
  { key: 'spa', label: 'Spa / Wellness page', kws: ['spa', 'wellness', 'bien-etre', 'bien-être'], impact: 'High', cats: ['wellness'] },
  { key: 'dining', label: 'Dining page', kws: ['restaurant', 'dining', 'gastro', 'cuisine', 'bar'], impact: 'High', cats: ['dining'] },
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
  location: ['Where is the hotel located?', 'How far is the airport?', 'What attractions are nearby?', 'How do I get there?'],
  parking: ['Does the hotel have parking?', 'How much does parking cost?', 'Is valet parking available?', 'Are EV chargers available?'],
  accessibility: ['Are accessible rooms available?', 'Is there step-free access?', 'Is there lift access to all floors?', 'Are accessible bathrooms available?'],
  breakfast: ['Is breakfast included?', 'What are the breakfast hours?', 'Where is breakfast served?', 'Are there vegan / gluten-free options?'],
  pets: ['Are pets allowed?', 'Is there a fee for pets?', 'What pet amenities are provided?', 'Is there a size limit for pets?'],
  airport: ['How far is the airport?', 'Is an airport transfer available?', 'How much is the transfer?', 'How do I book a transfer?'],
}

const REC_SYSTEM = `You are a strict, evidence-based hotel AI-recommendation auditor. Given crawled text from ONE hotel website and a list of recommendation prompts, decide for EACH prompt whether THIS WEBSITE provides enough evidence for an AI to CONFIDENTLY RECOMMEND this hotel for that prompt.

RULES:
- Use ONLY provided website text. NEVER use outside knowledge. Never guess.
- "readiness": "YES" (clear specific quotable evidence), "PARTIAL" (some but thin/incomplete), or "NO" (none).
- Every YES/PARTIAL MUST include a verbatim quote from the text. No quote = NO.
- "evidence": the verbatim quote, or "".
- "reasons": an array of 1-4 short, concrete reasons WHY an AI could not confidently recommend (for YES, may be empty). Phrase as plain factual gaps, e.g. "No parking information found", "No dedicated family page", "No FAQ answering this", "No distinctive features stated". Avoid the generic phrase "comparative claims"; instead say "No distinctive features stated" or "No specific [topic] details".
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
  const corpus = pages.map(p => `URL: ${p.url}\nHEADINGS: ${(p.headings || []).slice(0, 12).join(' | ')}\nTEXT: ${(p.text || '').slice(0, 1400)}`).join('\n\n---\n\n')
  const pList = prompts.map((q, i) => `[${i}] ${q.question}`).join('\n')
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
    return prompts.map((q, i) => {
      const a = byIdx.get(i) || {}; const ev = (a.evidence || '').trim()
      let readiness = a.readiness === 'YES' || a.readiness === 'PARTIAL' ? a.readiness : 'NO'
      if ((readiness === 'YES' || readiness === 'PARTIAL') && ev.length === 0) readiness = 'NO'
      let conf = Number.isFinite(a.confidence) ? Math.max(0, Math.min(100, a.confidence)) : 0
      if (readiness === 'NO') conf = Math.min(conf, 20)
      return { question: q.question, category: q.category || 'overall', priority: q.priority || 'medium', readiness, evidence: readiness === 'NO' ? '' : ev, reasons: Array.isArray(a.reasons) ? a.reasons.slice(0, 4) : [], url: readiness === 'NO' ? '' : (a.url || ''), confidence: conf, pages: Array.isArray(a.pages) ? a.pages.slice(0, 5) : [] }
    })
  } catch {
    return prompts.map(q => ({ question: q.question, category: q.category || 'overall', priority: q.priority || 'medium', readiness: 'NO', evidence: '', reasons: ['Not evaluated'], url: '', confidence: 0, pages: [] }))
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
const IMPACT_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
function buildActionPlan(readiness: any[], importantPages: any[], missingBlueprints: any[], architecture: any, demandCoverage: any[]) {
  const priorities: any[] = []
  for (const b of missingBlueprints) {
    const level = b.impact === 'High' ? 'Critical' : b.impact === 'Medium' ? 'High' : 'Medium'
    if (!b.affects || b.affects.length === 0) continue
    priorities.push({
      level, title: `Create a ${b.blueprint.heading} page`,
      why: `AI currently cannot confidently recommend the hotel for these searches because no dedicated ${b.blueprint.heading.toLowerCase()} content was found in the crawl.`,
      affectedPrompts: b.affects, pages: [`${b.blueprint.heading} page (missing)`],
      outcome: `AI would be able to answer "${b.blueprint.questions[0]}" and confidently surface the hotel for the searches above.`,
      blueprint: { sections: b.blueprint.sections, questions: b.blueprint.questions },
    })
  }
  for (const p of importantPages) {
    if (p.status !== 'Present' || typeof p.score !== 'number' || p.score >= 75) continue
    if (!p.missing || p.missing.length === 0) continue
    const level = p.score < 40 ? 'High' : 'Medium'
    priorities.push({
      level, title: `Strengthen your ${p.label.split(' — ')[0]} page`,
      why: `This page exists but is missing key elements AI looks for, limiting how confidently it can recommend you.`,
      affectedPrompts: p.affects || [], pages: [p.url ? p.url : p.label],
      outcome: `Adding ${p.missing.slice(0, 3).join(', ')} would let AI fully understand and recommend this page's strengths.`,
      toAdd: p.missing,
    })
  }
  priorities.sort((a, b) => (IMPACT_RANK[a.level] - IMPACT_RANK[b.level]) || ((b.affectedPrompts?.length || 0) - (a.affectedPrompts?.length || 0)))
  const topPriorities = priorities.slice(0, 10)
  const quickWins: any[] = []
  for (const p of importantPages) {
    if (p.status !== 'Present' || !p.missing) continue
    for (const m of p.missing) {
      if (/FAQ|Quick Facts|Comparison|AI summary|awards/i.test(m)) quickWins.push({ action: `Add ${m} to your ${p.label.split(' — ')[0]} page`, page: p.url || p.label })
    }
  }
  const seenQW = new Set<string>()
  const quickWinsDedup = quickWins.filter(q => { if (seenQW.has(q.action)) return false; seenQW.add(q.action); return true }).slice(0, 8)
  const strategic = missingBlueprints.map((b: any) => ({ title: `${b.blueprint.heading} page`, impact: b.impact, strengthens: b.affects && b.affects.length ? b.affects : [] })).filter((s: any) => s.strengthens.length)
  const strengths = demandCoverage.filter(d => d.coverage >= 67).map(d => d.label)
  const weaknesses = demandCoverage.filter(d => d.coverage < 40).map(d => d.label)
  const highRoi = topPriorities.filter(p => p.level === 'Critical' || p.level === 'High').slice(0, 3).map(p => p.title)
  const focusFirst = topPriorities.slice(0, 3).map(p => p.title)
  return {
    intro: 'Based on the pages crawled and the recommendation-readiness analysis, these are the highest-impact actions that would most improve AI recommendation confidence. Every action below is drawn directly from the audit findings.',
    topPriorities, quickWins: quickWinsDedup, strategic,
    forecast: { strengths, weaknesses, highRoi },
    whatNotToDo: focusFirst.length ? { message: 'Do not try to create or rewrite everything at once. Focus first on the items below — they close the largest number of recommendation gaps. Once those are live, move down the priority list.', focusFirst } : null,
  }
}
function buildContentPlan(importantPages: any[], missingBlueprints: any[]) {
  const existing = importantPages
    .filter(p => p.status === 'Present' && !p.notAssessed)
    .map(p => ({
      type: 'existing' as const, label: p.label, url: p.url || '',
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

    const classifyUrl = (u: string): { key: string; label: string; impact: string; cats: string[] } => {
      const lu = u.toLowerCase()
      for (const def of PRIORITY) { if (def.key === 'homepage') continue; if (def.kws.some(k => lu.includes(k))) return { key: def.key, label: def.label.replace(/ pages?$/i, ''), impact: def.impact, cats: def.cats } }
      let slug = 'Page'
      try { const segs = new URL(u).pathname.split('/').filter(Boolean); const last = segs[segs.length - 1] || ''; if (last) slug = last.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) } catch {}
      return { key: 'homepage', label: slug, impact: 'Medium', cats: ['overall'] }
    }

    if (Array.isArray(manualUrls) && manualUrls.length) {
      manualUrls.forEach((u: string) => {
        const c = classifyUrl(u)
        const isHome = u.replace(/\/$/, '') === url.replace(/\/$/, '')
        slots.push({ key: isHome ? 'homepage' : c.key, label: isHome ? 'Homepage' : `${c.label} — ${(() => { try { return new URL(u).pathname } catch { return u } })()}`, impact: c.impact, cats: c.cats, url: u, source: 'manual' })
      })
    } else {
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
    const strongFor = demandCoverage.filter(d => d.coverage >= 67).map(d => d.label)
    const weakFor = demandCoverage.filter(d => d.coverage < 34).map(d => d.label)

    const promptsByCat = (cats: string[]) => readiness.filter((r: any) => cats.includes(CAT_MAP[r.category] || 'overall')).map((r: any) => r.question)
    const importantPages: any[] = []
    for (const s of slots) {
      const expected = EXPECTED[s.key] || []
      if (!s.url || !pageCache[s.url]) {
        importantPages.push({ key: s.key, label: s.label, status: 'Missing', impact: s.impact, source: s.source,
          reason: `No ${s.label.toLowerCase()} found in the crawl.`, affects: promptsByCat(s.cats).slice(0, 4), blueprint: BLUEPRINTS[s.key] || null })
        continue
      }
      const a = await auditPage(pageCache[s.url], s.key, openaiKey)
      if (!a) {
        importantPages.push({ key: s.key, label: s.label, status: 'Present', impact: s.impact, source: s.source,
          url: s.url, score: null, notAssessed: true, present: [], missing: [], examples: [], evidence: '', affects: [], blueprint: null })
        continue
      }
      const present = expected.filter(e => a[e.field]).map(e => e.label)
      const missingDefs = expected.filter(e => !a[e.field])
      const missing = missingDefs.map(e => e.label)
      const examples = s.key === 'homepage' ? missingDefs.map(e => EXAMPLES[e.field]).filter(Boolean).slice(0, 3) : []
      importantPages.push({ key: s.key, label: s.label, status: 'Present', impact: s.impact, source: s.source,
        url: s.url, score: pct(present.length, expected.length), present, missing, examples,
        evidence: a?.evidence || '', affects: missing.length ? promptsByCat(s.cats).slice(0, 4) : [], blueprint: null })
    }

    const presentKeys = new Set(slots.filter(s => s.url && pageCache[s.url]).map(s => s.key))
    const blueprintKeys = ['parking', 'accessibility', 'pets', 'breakfast', 'airport', 'family', 'romantic', 'business', 'spa', 'dining']
    const BP_KEYWORDS: Record<string, string[]> = {
      parking: ['parking'], accessibility: ['accessible', 'accessibility'], pets: ['pet'], breakfast: ['breakfast'],
      airport: ['airport'], romantic: ['romantic', 'honeymoon', 'couple'], business: ['business', 'meeting', 'executive', 'event'],
      spa: ['spa', 'wellness'], dining: ['dining', 'restaurant', 'gastronomy', 'fine dining'],
    }
    const catCovered = (k: string) => {
      const cat = (PRIORITY.find(p => p.key === k)?.cats || [])
      return readiness.some((r: any) => cat.includes(CAT_MAP[r.category] || 'overall') && r.readiness !== 'NO')
    }
    const topicInText = (k: string) => {
      const kws = (PRIORITY.find(p => p.key === k)?.kws || [])
      return pages.some((p: any) => kws.some(w => (p.text || '').toLowerCase().includes(w)))
    }
    const missingBlueprints = blueprintKeys.filter(k => !presentKeys.has(k) && BLUEPRINTS[k] && !catCovered(k) && !topicInText(k)).map(k => {
      const def = PRIORITY.find(p => p.key === k)
      const kws = BP_KEYWORDS[k] || []
      const affects = readiness.filter((r: any) => kws.some(w => r.question.toLowerCase().includes(w))).map((r: any) => r.question).slice(0, 4)
      return { key: k, impact: def?.impact || 'Medium', affects, blueprint: BLUEPRINTS[k] }
    })

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
      note: 'Architecture layers are supporting evidence, computed from crawled pages only.',
    }
    const architectureScore = Math.round(coreScore * 0.3 + intentScore * 0.25 + schemaScore * 0.25 + Math.min(100, entityHits * 8) * 0.1 + ((trust.reviewSchema ? 50 : 0) + (trust.awards ? 25 : 0) + (trust.ratings ? 25 : 0)) * 0.1)

    const actionPlan = buildActionPlan(readiness, importantPages, missingBlueprints, architecture, demandCoverage)
    const contentPlan = buildContentPlan(importantPages, missingBlueprints)

    const result = {
      url, city: effCity || null, hotelType: effType || null,
      actionPlan, contentPlan,
      summary: { strongFor, weakFor },
      recommendation: { score: recScore, yes: yesN, partial: partialN, no: noN, total: readiness.length, results: readiness },
      demandCoverage, importantPages, missingBlueprints, architecture, architectureScore,
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