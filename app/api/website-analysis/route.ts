import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const SYSTEM_PROMPT = `You are an AI retrieval engineer — you think the way ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews actually retrieve, understand and recommend hotels. You are NOT a traditional SEO consultant and you do NOT treat schema as the foundation.

You only "see" what is in the raw HTML: visible text, headings, and JSON-LD schema. You do NOT see images, design, or JavaScript-rendered content. You are given several key pages of a luxury hotel's official website, each with its URL, extracted JSON-LD schema, visible text, and internal links.

Evaluate the site by this impact hierarchy — judge the higher tiers harder:
TIER 1 (highest impact): explicit hotel facts present in visible text; entity clarity (city, region, country, airport, landmarks named plainly); whether common guest questions are answerable from the page; FAQ coverage; structured, factual content over marketing fluff.
TIER 2: schema (Hotel, Restaurant, Spa, Offer, Event, HotelRoom, FAQPage, aggregateRating, etc.) as a SUPPORTING layer that confirms the facts.
TIER 3: image/video/breadcrumb/search schema.

Do NOT assess third-party authority (Tripadvisor, Booking, Michelin, social). You cannot see off-site sources, so never guess at them.

Be concrete and exhaustive. This is a paid consulting deliverable the hotel acts on line by line. Never invent a fact: if something is not present on the page, mark it missing — do not assume it.

Produce, across the whole site:
1. factsCheck — the explicit facts AI assistants most often need. For each, present:true only if it is actually stated in the visible text or schema, present:false otherwise.
2. answersCheck — common guest questions; answerable:true only if the page content genuinely answers it.
3. Per page: a field-by-field schema audit, what AI can/can't see, what is weak, and fixes.
4. A consolidated actionPlan per page and a plain-language marketerSummary a non-technical person can act on.

FAQs are critical for AI visibility — propose real FAQs per page in the actionPlan, never skip them.

Return ONLY valid JSON, no markdown:
{
  "overallScore": 0-100,
  "scoreReason": "one sentence on why this score, weighted to Tier 1",
  "summary": "5-7 sentences on overall AI-readability, led by facts/entities/content, with schema as support",
  "marketerSummary": "a clear plain-language paragraph a non-technical marketer can act on: what is wrong, why it limits AI visibility and bookings, and the few things that matter most",
  "linkingAnalysis": "short paragraph: which pages link to which, what is well linked, what is orphaned",
  "factsCheck": [ { "fact": "e.g. Number of rooms", "present": true, "note": "where found, or what to add" } ],
  "answersCheck": [ { "question": "e.g. How far is the hotel from the airport?", "answerable": true, "note": "brief" } ],
  "siteWideReport": ["consolidated list of everything to change/add across the site, highest impact first, each with the reason it matters for AI"],
  "pages": [
    {
      "url": "the URL",
      "schemaAudit": [ { "type": "@type", "present": ["field: value"], "missing": ["field"], "note": "" } ],
      "missingSchemaTypes": ["types entirely absent on this page"],
      "aiSees": ["concrete fact AI can extract", "..."],
      "aiCannotSee": ["missing fact — why — where to add it", "..."],
      "weak": ["present but not in schema / structural issue", "..."],
      "fixes": [ { "title": "", "priority": "High|Medium|Low", "instruction": "", "schemaType": "", "schemaBlock": "full JSON-LD or empty", "faqsToAdd": [ { "question": "", "answer": "" } ] } ]
    }
  ],
  "actionPlan": [
    {
      "page": "the page URL",
      "majorGaps": ["key missing things, plain language, most important first"],
      "schemaToAdd": ["specific schema to add and what fields"],
      "faqsToAdd": [ { "question": "real FAQ targeting how guests search", "answer": "real answer using the page facts; [PLACEHOLDER] where a fact is unknown" } ],
      "otherActions": ["other concrete improvements: content, headings, internal links"]
    }
  ]
}

For factsCheck, always include at least: Hotel name, Category/positioning, Star rating, Number of rooms, Number of suites, Restaurants, Bars, Spa, Pool, Gym, Meeting rooms, Airport distance, Train station distance, Parking, EV charging, Pet policy, Check-in time, Check-out time, Languages spoken, Accessibility, Family-friendly, Lake/views.
For answersCheck, always include at least: Where is the hotel located, Why stay here / what is unique, Is it family friendly, Is it good for business, Does it have a spa, Does it have a pool, Is there parking, Is breakfast included, How far from the airport, What are the room categories, What attractions are nearby.`
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
function extractLinks(html: string, base: string): string[] {
  const links = new Set<string>()
  const re = /href=["']([^"']+)["']/gi
  let m
  while ((m = re.exec(html)) !== null) {
    let href = m[1]
    if (href.startsWith('/')) href = base + href
    if (href.includes(base.replace(/^https?:\/\//, '').split('/')[0])) links.add(href.split('#')[0].split('?')[0])
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
      pageData.push({ url, schema: extractSchema(html), text: extractText(html), links: extractLinks(html, origin) })
    }
    const scraped = pageData.filter(p => !p.error)
    if (scraped.length === 0) return NextResponse.json({ error: 'Could not scrape any of the URLs — site may block scrapers or credits ran out.' }, { status: 502 })

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.3, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Pages (schema + text + internal links as an AI crawler sees them):\n${JSON.stringify(pageData, null, 2)}` },
        ],
      }),
    })
    const aiData = await aiRes.json()
    let analysis: any = null
    try { analysis = JSON.parse(aiData.choices[0].message.content) } catch { analysis = { error: 'Could not parse AI output', raw: aiData?.choices?.[0]?.message?.content || '' } }

    const urlsScraped = scraped.map(p => p.url)
    const urlsFailed = pageData.filter(p => p.error).map(p => p.url)

    try {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      await sb.from('website_analyses').insert({ hotel_id: hotelId || null, urls_scraped: urlsScraped, urls_failed: urlsFailed, analysis })
    } catch {}

    return NextResponse.json({ urlsScraped, urlsFailed, analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}