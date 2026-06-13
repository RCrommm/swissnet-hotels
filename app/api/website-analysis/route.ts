import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const PAGES = ['', '/rooms', '/spa', '/dining', '/about', '/contact']

const SYSTEM_PROMPT = `You ARE an AI crawler — the engine behind ChatGPT, Perplexity and Google AI Overviews. You only "see" what is in the raw HTML: text content, headings, and JSON-LD structured data (schema). You do NOT see images, design, or anything rendered by JavaScript after load.

You are given, for each page of a luxury hotel's official website: the extracted JSON-LD schema blocks, and the visible text. You also get the hotel's true facts from a database.

Your job: produce a DETAILED, page-by-page analysis of how AI-readable this website is, and exactly how to make this hotel appear more often and rank higher in AI search results and AI-driven direct bookings.

For EACH page analysed, report:
- WHAT AI SEES: the facts/entities you can actually extract from the schema and text (be concrete: "I can read that there are 102 rooms and a 2-Michelin-star restaurant").
- WHAT AI CANNOT SEE: important facts that are missing entirely, or present only as images/JS so you cannot read them (cite the real fact from the DB that should be there but isn't).
- WHAT IS THERE BUT WEAK: facts present in plain text but NOT in schema, so you see them but cannot trust/attribute them; bad heading structure; thin content.
- FIXES: exact, specific actions. Never "add FAQs" — instead WRITE the actual FAQ questions + answers to paste (use the DB facts; put [PLACEHOLDER] where a fact is unknown). For schema, name the exact schema type to add (e.g. FAQPage, Hotel with aggregateRating, Restaurant with starRating) and what fields. Say where on the page to add it.

Be demanding and concrete. This is a paid consulting deliverable.

Return ONLY valid JSON, no markdown:
{
  "overallScore": 0-100,
  "scoreReason": "one sentence on why this score",
  "summary": "3-4 sentences: how AI-readable the site is overall and the single biggest opportunity",
  "pages": [
    {
      "url": "the page path",
      "aiSees": ["concrete fact AI can extract", "..."],
      "aiCannotSee": ["important fact missing or unreadable", "..."],
      "weak": ["present but not in schema / structural issue", "..."],
      "fixes": [
        { "title": "specific fix", "priority": "High|Medium|Low", "instruction": "exactly what to do", "schemaType": "e.g. FAQPage, or empty", "faqsToAdd": [ { "question": "...", "answer": "..." } ] }
      ]
    }
  ],
  "topPriorities": ["the 3-5 highest-impact fixes across the whole site, most important first"]
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