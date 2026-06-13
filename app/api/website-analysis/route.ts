import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const PAGES = ['']

const SYSTEM_PROMPT = `You ARE an AI crawler — the engine behind ChatGPT, Perplexity and Google AI Overviews. You only "see" what is in the raw HTML: text content, headings, and JSON-LD structured data (schema). You do NOT see images, design, or anything rendered by JavaScript after load.

You are given ONE page (the homepage) of a luxury hotel's official website: its extracted JSON-LD schema blocks and its visible text. You also get the hotel's TRUE facts from a database.

Produce an EXHAUSTIVE, forensic analysis of this single page. Do not summarise — go element by element. Length is not a concern; be as thorough as the content allows. This is a paid consulting deliverable a hotel will act on line by line.

Work through it in this depth:

1. SCHEMA AUDIT — for EACH JSON-LD block found, state its @type, then go field by field: which fields are present and what value they hold, and which expected fields for that type are MISSING. Name the exact missing fields (e.g. "Hotel schema is missing: aggregateRating, priceRange, amenityFeature, starRating, checkinTime"). If a schema type that should exist does not exist at all (FAQPage, Restaurant, Room/HotelRoom, Spa/HealthAndBeautyBusiness, BreadcrumbList, Organization), say so explicitly.

2. WHAT AI SEES — every concrete fact/entity you can actually extract from the schema and the text, listed individually. Be specific and complete.

3. WHAT AI CANNOT SEE — every important fact (cross-check against the DB facts) that is NOT extractable. For each one, explain WHY you can't see it: is it absent entirely? present only in an image? likely behind JavaScript? in plain text but not in schema so unreliable? And state WHERE it should go (which schema type + field, or which part of the page).

4. PRESENT BUT WEAK — facts that appear in the visible text but are NOT in schema (so you read them but cannot trust/attribute them), plus structural issues (heading hierarchy, missing h1, thin content, no semantic grouping).

5. FIXES — exhaustive and concrete. For schema fixes, WRITE OUT the actual JSON-LD block to paste, with the real values from the DB facts (use [PLACEHOLDER] only where a fact is genuinely unknown). For FAQs, WRITE the actual questions and answers. For each fix say exactly WHERE on the page it goes.

Return ONLY valid JSON, no markdown:
{
  "overallScore": 0-100,
  "scoreReason": "one sentence on why this score",
  "summary": "4-6 sentences: exactly how AI-readable this homepage is, what is solid, and the biggest gaps",
  "schemaAudit": [
    { "type": "the @type found", "present": ["field: value", "..."], "missing": ["field", "..."], "note": "any issue with this block" }
  ],
  "missingSchemaTypes": ["schema types that should exist on this page but are entirely absent"],
  "pages": [
    {
      "url": "/",
      "aiSees": ["every concrete fact AI can extract, one per item", "..."],
      "aiCannotSee": ["the missing fact — WHY it can't be seen — WHERE it should be added", "..."],
      "weak": ["present in text but not in schema / structural issue, with detail", "..."],
      "fixes": [
        { "title": "specific fix", "priority": "High|Medium|Low", "instruction": "exactly what to do and where on the page", "schemaType": "e.g. FAQPage", "schemaBlock": "the full JSON-LD to paste, or empty string", "faqsToAdd": [ { "question": "...", "answer": "..." } ] }
      ]
    }
  ],
  "topPriorities": ["the highest-impact fixes, most important first, with the reason each matters for AI ranking"]
}`

function extractSchema(html: string): string[] {
  const blocks: string[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) !== null) { blocks.push(m[1].trim()) }
  return blocks
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000)
}

async function scrape(url: string, apiKey: string): Promise<string | null> {
  try {
    const api = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=false`
    const res = await fetch(api)
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

export async function POST(req: Request) {
  try {
    const { hotelId, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hotelId) return NextResponse.json({ error: 'Missing hotelId' }, { status: 400 })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: hotel } = await sb.from('hotels').select('*').eq('id', hotelId).single()
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })

    const base = (hotel.direct_booking_url || '').replace(/\/$/, '')
    if (!base) return NextResponse.json({ error: 'No direct_booking_url on this hotel' }, { status: 400 })

    const apiKey = process.env.SCRAPINGBEE_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'SCRAPINGBEE_API_KEY not set' }, { status: 500 })

    // Hotel facts for grounding
    const [{ data: rooms }, { data: restaurants }, { data: spa }] = await Promise.all([
      sb.from('room_types').select('name, size_sqm, base_rate_chf, bed_type').eq('hotel_id', hotelId),
      sb.from('hotel_restaurants').select('name, cuisine_type, michelin_stars').eq('hotel_id', hotelId).eq('is_available', true),
      sb.from('hotel_spa').select('name, size_sqm').eq('hotel_id', hotelId).eq('is_available', true),
    ])
    const facts = {
      name: hotel.name, region: hotel.region, stars: hotel.star_classification, rate: hotel.nightly_rate_chf,
      rooms: (rooms || []).map((r: any) => ({ name: r.name, sqm: r.size_sqm, bed: r.bed_type, rate: r.base_rate_chf })),
      restaurants: (restaurants || []).map((r: any) => ({ name: r.name, cuisine: r.cuisine_type, michelin: r.michelin_stars })),
      spa: (spa || []).map((s: any) => ({ name: s.name, sqm: s.size_sqm })),
    }

    // Scrape pages
    const pageData: any[] = []
    for (const path of PAGES) {
      const url = base + path
      const html = await scrape(url, apiKey)
      if (!html) continue
      pageData.push({ url: path || '/', schema: extractSchema(html), text: extractText(html) })
    }

    if (pageData.length === 0) return NextResponse.json({ error: 'Could not scrape any pages — the site may block scrapers or credits ran out.' }, { status: 502 })

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.3, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Hotel facts (ground truth):\n${JSON.stringify(facts, null, 2)}\n\nScraped pages (schema + text as an AI crawler sees them):\n${JSON.stringify(pageData, null, 2)}` },
        ],
      }),
    })
    const aiData = await aiRes.json()
    let analysis: any = null
    try { analysis = JSON.parse(aiData.choices[0].message.content) } catch { analysis = { error: 'Could not parse AI output', raw: aiData?.choices?.[0]?.message?.content || '' } }

    return NextResponse.json({ hotel: { name: hotel.name, url: base }, pagesScraped: pageData.map(p => p.url), analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}