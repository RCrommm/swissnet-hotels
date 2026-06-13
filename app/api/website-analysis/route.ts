import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

// ── extraction helpers ────────────────────────────────────────────────
function extractSchema(html: string): string[] {
  const blocks: string[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) blocks.push(m[1].trim())
  return blocks
}
function extractText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)
}
function extractHeadings(html: string): string[] {
  const out: string[] = []
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const t = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (t) out.push(`H${m[1]}: ${t}`)
  }
  return out.slice(0, 40)
}
function extractMeta(html: string): { title: string; description: string } {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim()
  const description = (html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '').trim()
  return { title, description }
}
function extractAlts(html: string): string[] {
  const out: string[] = []
  const re = /<img[^>]*alt=["']([^"']+)["']/gi
  let m
  while ((m = re.exec(html)) !== null) { const a = m[1].trim(); if (a) out.push(a) }
  return [...new Set(out)].slice(0, 30)
}
function extractLinks(html: string, base: string): string[] {
  const links = new Set<string>()
  const re = /href=["']([^"']+)["']/gi
  let m
  while ((m = re.exec(html)) !== null) {
    let href = m[1]
    if (href.startsWith('/')) href = base + href
    if (base && href.includes(base.replace(/^https?:\/\//, '').split('/')[0])) links.add(href.split('#')[0].split('?')[0])
  }
  return [...links].slice(0, 60)
}
async function scrape(url: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=false`)
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

async function callOpenAI(system: string, user: string, schema: any) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 16000,
      response_format: { type: 'json_schema', json_schema: { name: schema.name, strict: true, schema: schema.schema } },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  if (data?.error) return { _error: 'api', raw: data.error.message || JSON.stringify(data.error) }
  const content = data?.choices?.[0]?.message?.content
  const finish = data?.choices?.[0]?.finish_reason
  if (!content) return { _error: 'empty', raw: 'finish_reason=' + finish + ' ' + JSON.stringify(data).slice(0, 400) }
  try { return JSON.parse(content) } catch { return { _error: 'parse', raw: 'finish_reason=' + finish + ' | ' + content.slice(0, 400) } }
}

// ── fixed checklists so scores are stable across runs ─────────────────
const FACT_CHECKLIST = [
  'Hotel name', 'Star rating / category', 'Number of rooms', 'Number of suites', 'Number of restaurants',
  'Number of bars', 'Spa', 'Indoor pool', 'Outdoor pool', 'Fitness centre / gym',
  'Meeting rooms', 'Event / banquet space', 'Wedding facilities', 'Kids club / family facilities', 'Concierge',
  'Self parking', 'Valet parking', 'EV charging', 'Airport transfer service', 'Distance from airport',
  'Distance from city centre', 'Distance from train station', 'Check-in time', 'Check-out time', 'Cancellation policy',
  'Pet policy', 'Accessibility / step-free access', 'Languages spoken', 'Michelin-starred or fine dining', 'Lake view / lakefront location',
]

const ANSWER_QUESTIONS = [
  'Where exactly is the hotel located?',
  'How far is it from the airport, and is there a transfer service?',
  'Is this a 5-star / luxury hotel?',
  'What room and suite types are available?',
  'Does it have lake views or a lakefront location?',
  'Does it have Michelin-starred or notable fine dining?',
  'How many restaurants and bars are there?',
  'Does it have a spa, and what treatments are offered?',
  'Is there an indoor and/or outdoor pool?',
  'Is there a fitness centre?',
  'Is it family friendly, with activities for children?',
  'Are there connecting or family rooms?',
  'Is it suitable for business travellers, with meeting rooms?',
  'Can it host weddings or private events, and at what capacity?',
  'What are the check-in and check-out times?',
  'Is parking available, and is there valet or EV charging?',
  'Are pets allowed?',
  'What is the cancellation policy?',
  'Is the hotel accessible / step-free?',
  'What languages does the staff speak?',
  'How do I book directly with the hotel?',
  'What makes this hotel different from other luxury hotels in the city?',
]

// ── PASS 1: EXTRACTION (what is literally present, with evidence) ──────
const EXTRACT_SYSTEM = `You are an extraction engine. You report ONLY what is literally present in the page data you are given (visible text, headings, meta, image alt text, JSON-LD schema). You NEVER infer, assume, or guess. If something is not explicitly present, mark it not present. For every "present:true" you must quote the exact evidence found in the data. This is a factual extraction, not advice — give NO recommendations.`

const EXTRACT_SCHEMA = {
  name: 'extraction',
  schema: {
    type: 'object', additionalProperties: false,
    required: ['pages', 'facts'],
    properties: {
      facts: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['fact', 'present', 'evidence'],
          properties: {
            fact: { type: 'string' },
            present: { type: 'boolean' },
            evidence: { type: 'string', description: 'exact text/schema where found, or empty if not present' },
          },
        },
      },
      pages: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['url', 'schemaTypesPresent', 'schemaFields', 'hasFAQ', 'headings', 'keyFactsOnPage'],
          properties: {
            url: { type: 'string' },
            schemaTypesPresent: { type: 'array', items: { type: 'string' } },
            schemaFields: {
              type: 'array',
              items: {
                type: 'object', additionalProperties: false,
                required: ['type', 'presentFields', 'value'],
                properties: {
                  type: { type: 'string' },
                  presentFields: { type: 'array', items: { type: 'string' } },
                  value: { type: 'string', description: 'short summary of key values found' },
                },
              },
            },
            hasFAQ: { type: 'boolean' },
            headings: { type: 'array', items: { type: 'string' } },
            keyFactsOnPage: { type: 'array', items: { type: 'string' }, description: 'concrete facts literally stated on this page' },
          },
        },
      },
    },
  },
}

// ── PASS 2: RECOMMENDATION (works ONLY from extraction, never the raw site) ──
const RECOMMEND_SYSTEM = `You are an AI retrieval engineer who thinks like ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews deciding whether to understand, trust and RECOMMEND a hotel. You are NOT a traditional SEO consultant; schema is only a SUPPORTING signal, not the foundation. What matters most is whether explicit facts and answerable guest questions are present in plain content.

You are given a STRICT EXTRACTION of what a hotel's website literally contains — facts present/absent (with evidence), per-page schema types and fields, FAQ presence, headings, key facts per page. You must base every judgement ONLY on this extraction. You may NOT invent facts the extraction does not show. Where an FAQ answer would need a fact that is absent, write [VERIFY] in place of the value — never guess a number, price, time, or amenity.

Do NOT assess third-party authority (Tripadvisor, Booking, Michelin listings, social, reviews) — you cannot see it, so never mention it as present or missing. Do NOT assess imagery beyond alt text you were given.

You will produce:
1. summary — 2-3 sentences, plain language, what AI understands about this hotel and the single biggest gap.
2. marketerSummary — a short paragraph a hotel marketing team can act on, no jargon.
3. entityClarityScore — integer 0-20. How unambiguously AI can identify this hotel as a distinct entity and tie it to its city, region, category, signature dining/spa, and location. 20 = crystal clear and richly connected; 0 = ambiguous or thin. Judge ONLY from the extraction.
4. scoreNarrative — one sentence explaining the entity-clarity judgement and the dominant strength/weakness.
5. answersCheck — evaluate EXACTLY these guest questions, in this order, returning the question text verbatim, whether the SITE answers it (answerable true/false), and a short note citing what is present or what is missing:
${ANSWER_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n')}
6. siteWideReport — the highest-impact changes across the whole site, ordered by impact, framed as gaps and opportunities (never guarantees).
7. actionPlan — per page: majorGaps, schemaToAdd (only where it gives a real AI benefit), faqsToAdd (real questions; use [VERIFY] for any fact not in the extraction), otherActions.
8. entityPositioning — how strongly AI can associate this hotel with each positioning category, judged ONLY from the extraction. Use EXACTLY these five entities, in this order: Luxury Hotel, Spa & Wellness, Family, Business & Meetings, Fine Dining. For each return strength (Strong / Medium / Weak) and a one-line why citing what is present or absent.
9. contentGaps — the missing content blocks that would most improve AI understanding. Tag each Critical (AI cannot extract core facts without it), Important (improves recommendation potential), or Nice-to-have (minor). List Critical first.`

const RECOMMEND_SCHEMA = {
  name: 'recommendation',
  schema: {
    type: 'object', additionalProperties: false,
    required: ['summary', 'marketerSummary', 'entityClarityScore', 'scoreNarrative', 'answersCheck', 'entityPositioning', 'contentGaps', 'siteWideReport', 'actionPlan'],
    properties: {
      summary: { type: 'string' },
      marketerSummary: { type: 'string' },
      entityClarityScore: { type: 'integer' },
      scoreNarrative: { type: 'string' },
      answersCheck: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['question', 'answerable', 'note'],
          properties: { question: { type: 'string' }, answerable: { type: 'boolean' }, note: { type: 'string' } },
        },
      },
      entityPositioning: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['entity', 'strength', 'why'],
          properties: {
            entity: { type: 'string' },
            strength: { type: 'string', enum: ['Strong', 'Medium', 'Weak'] },
            why: { type: 'string' },
          },
        },
      },
      contentGaps: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['area', 'tier', 'why'],
          properties: {
            area: { type: 'string' },
            tier: { type: 'string', enum: ['Critical', 'Important', 'Nice-to-have'] },
            why: { type: 'string' },
          },
        },
      },
      siteWideReport: { type: 'array', items: { type: 'string' } },
      actionPlan: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['page', 'majorGaps', 'schemaToAdd', 'faqsToAdd', 'otherActions'],
          properties: {
            page: { type: 'string' },
            majorGaps: { type: 'array', items: { type: 'string' } },
            schemaToAdd: { type: 'array', items: { type: 'string' } },
            faqsToAdd: {
              type: 'array',
              items: {
                type: 'object', additionalProperties: false,
                required: ['question', 'answer'],
                properties: { question: { type: 'string' }, answer: { type: 'string' } },
              },
            },
            otherActions: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
}

// ── deterministic schema scoring (out of 15) ──────────────────────────
const SCHEMA_WEIGHTS: Record<string, number> = {
  Hotel: 4, LodgingBusiness: 4, HotelRoom: 3, Suite: 1, FAQPage: 3, Review: 2, AggregateRating: 2,
  WebPage: 1, BreadcrumbList: 1, WebSite: 1, Organization: 1, LocalBusiness: 2, ImageObject: 1, Place: 1,
}

export async function POST(req: Request) {
  try {
    const { urls, password, hotelId } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const list: string[] = (urls || '').split('\n').map((u: string) => u.trim()).filter(Boolean)
    if (list.length === 0) return NextResponse.json({ error: 'Paste at least one URL' }, { status: 400 })

    const apiKey = process.env.SCRAPINGBEE_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'SCRAPINGBEE_API_KEY not set' }, { status: 500 })

    const origin = (() => { try { return new URL(list[0]).origin } catch { return '' } })()

    const pageData: any[] = []
    for (const url of list) {
      const html = await scrape(url, apiKey)
      if (!html) { pageData.push({ url, error: 'could not scrape' }); continue }
      const meta = extractMeta(html)
      pageData.push({
        url,
        schema: extractSchema(html),
        text: extractText(html),
        headings: extractHeadings(html),
        metaTitle: meta.title,
        metaDescription: meta.description,
        imageAlts: extractAlts(html),
        links: extractLinks(html, origin),
      })
    }
    const scraped = pageData.filter(p => !p.error)
    const urlsFailed = pageData.filter(p => p.error).map(p => p.url)
    if (scraped.length === 0) return NextResponse.json({ error: 'Could not scrape any of the URLs — site may block scrapers or credits ran out.' }, { status: 502 })

    // PASS 1 — extract per page against the fixed checklist (keeps each call small)
    const perPage: any[] = []
    const allFacts: any[] = []
    for (const pg of scraped) {
      const ex = await callOpenAI(
        EXTRACT_SYSTEM,
        `Check whether each of these facts is literally present on THIS ONE page. Return one entry per checklist item (present true/false + quoted evidence), plus any extra concrete facts you find. Also return the page object.\n\nFACT CHECKLIST:\n${FACT_CHECKLIST.map(f => '- ' + f).join('\n')}\n\nPAGE DATA:\n${JSON.stringify(pg, null, 2)}`,
        EXTRACT_SCHEMA,
      )
      if (ex?._error) return NextResponse.json({ error: 'Extraction step failed to parse', detail: ex.raw }, { status: 502 })
      if (Array.isArray(ex.pages)) perPage.push(...ex.pages)
      if (Array.isArray(ex.facts)) allFacts.push(...ex.facts)
    }
    // de-duplicate facts by name, preferring present:true
    const factMap = new Map<string, any>()
    for (const f of allFacts) {
      const key = (f.fact || '').toLowerCase()
      const existing = factMap.get(key)
      if (!existing || (f.present && !existing.present)) factMap.set(key, f)
    }
    const extraction = { facts: [...factMap.values()], pages: perPage }

    // PASS 2 — recommend from extraction only
    const recommendation = await callOpenAI(
      RECOMMEND_SYSTEM,
      `Here is the strict extraction of the hotel website. Base all advice ONLY on this. Use [VERIFY] for any fact not present.\n\n${JSON.stringify(extraction, null, 2)}`,
      RECOMMEND_SCHEMA,
    )
    if (recommendation?._error) return NextResponse.json({ error: 'Recommendation step failed to parse', detail: recommendation.raw }, { status: 502 })

    // ── ANCHORED SCORING — computed from detected signals, not freeformed ──
    const factsArr: any[] = extraction.facts || []
    const factsPresent = factsArr.filter(f => f.present).length
    const factsScore = factsArr.length ? Math.round(25 * (factsPresent / factsArr.length)) : 0

    const ans: any[] = recommendation.answersCheck || []
    const ansYes = ans.filter(q => q.answerable).length
    const answerabilityScore = ans.length ? Math.round(25 * (ansYes / ans.length)) : 0

    const schemaTypes = new Set<string>()
    for (const p of perPage) for (const t of (p.schemaTypesPresent || [])) schemaTypes.add(t)
    let schemaRaw = 0
    for (const t of schemaTypes) schemaRaw += SCHEMA_WEIGHTS[t] || 0
    const schemaScore = Math.min(15, schemaRaw)

    const faqPages = perPage.filter(p => p.hasFAQ).length
    const faqScore = perPage.length ? Math.round(15 * (faqPages / perPage.length)) : 0

    const entityScore = Math.max(0, Math.min(20, recommendation.entityClarityScore ?? 0))

    const overallScore = factsScore + answerabilityScore + entityScore + schemaScore + faqScore
    const scoreReason = `Hotel facts ${factsScore}/25 · Guest questions answerable ${answerabilityScore}/25 · Entity clarity ${entityScore}/20 · Schema coverage ${schemaScore}/15 · FAQ & answerable content ${faqScore}/15.${recommendation.scoreNarrative ? ' ' + recommendation.scoreNarrative : ''}`
    const scoreBreakdown = [
      { label: 'Hotel facts present', score: factsScore, max: 25 },
      { label: 'Guest questions answerable', score: answerabilityScore, max: 25 },
      { label: 'Entity clarity', score: entityScore, max: 20 },
      { label: 'Schema coverage', score: schemaScore, max: 15 },
      { label: 'FAQ & answerable content', score: faqScore, max: 15 },
    ]

    // merge into one analysis object the dashboard + admin page read
    const analysis = {
      ...recommendation,
      overallScore,
      scoreReason,
      scoreBreakdown,
      factsCheck: (extraction.facts || []).map((f: any) => ({ fact: f.fact, present: f.present, note: f.evidence || '' })),
      pages: (extraction.pages || []).map((p: any) => ({
        url: p.url,
        schemaAudit: (p.schemaFields || []).map((s: any) => ({ type: s.type, present: s.presentFields || [], missing: [], note: s.value || '' })),
        missingSchemaTypes: [],
        aiSees: p.keyFactsOnPage || [],
        aiCannotSee: [],
        weak: p.hasFAQ ? [] : ['No FAQ section detected on this page'],
        fixes: [],
      })),
    }

    const urlsScraped = scraped.map(p => p.url)
    try {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      await sb.from('website_analyses').insert({ hotel_id: hotelId || null, urls_scraped: urlsScraped, urls_failed: urlsFailed, analysis })
    } catch {}

    return NextResponse.json({ urlsScraped, urlsFailed, analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}