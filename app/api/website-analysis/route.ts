import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const SYSTEM_PROMPT = `You ARE an AI crawler — the engine behind ChatGPT, Perplexity and Google AI Overviews. You only "see" what is in the raw HTML: text, headings, and JSON-LD schema. You do NOT see images, design, or JavaScript-rendered content.

You are given several key pages of a luxury hotel's official website. For each: the URL, its extracted JSON-LD schema blocks, its visible text, and the internal links found on it.

Produce an EXHAUSTIVE forensic analysis. Do not summarise — go page by page, element by element. Length is not a concern. This is a paid consulting deliverable the hotel will act on line by line.

For EACH page:
1. SCHEMA AUDIT — for each JSON-LD block: its @type, then field by field which fields are present (with values) and which expected fields are MISSING. If a schema type that should exist for this kind of page is entirely absent (FAQPage, Restaurant, HotelRoom, Spa/HealthAndBeautyBusiness, BreadcrumbList, Organization, aggregateRating), say so.
2. WHAT AI SEES — every concrete fact you can extract, listed individually.
3. WHAT AI CANNOT SEE — every important fact that is NOT extractable; for each, WHY (absent / image-only / JS / in text but not schema) and WHERE it should be added (which schema type + field, or which part of the page).
4. PRESENT BUT WEAK — facts in text but not in schema, heading/structure problems, thin content.
5. FIXES — for schema, WRITE the actual JSON-LD block to paste with real values (use [PLACEHOLDER] only where genuinely unknown); for FAQs, WRITE the actual Q&A; say exactly where on the page each goes.
FAQs ARE CRITICAL for AI visibility — AI engines pull answers directly from FAQ content. For EVERY page, you MUST propose a set of real FAQs (questions + full answers) appropriate to that page, written the way real guests would ask AI (e.g. "Does La Réserve Genève have a Michelin-starred restaurant?", "How far is La Réserve Genève from Geneva airport?", "Does the spa offer couples treatments?"). Never skip FAQs for a page. These go in the actionPlan for each page.

At the END, you MUST produce a consolidated actionPlan: one entry per page, each listing the major gaps in plain language, the specific schema to add, the actual FAQs to add (written out), and any other concrete actions. Also write a marketerSummary that a non-technical person can act on. This is the part the hotel's marketing team will follow step by step — make it complete and specific. For EACH page in the actionPlan, include a checklist covering the important schema types and content elements that page should have (FAQPage, the page-specific business schema like Restaurant/Spa/Offer/Event, aggregateRating, detailed HotelRoom fields, key on-page content). Mark present:true for what the page already has and present:false for what is missing, so the hotel sees exactly what to fix.
Also analyse INTERNAL LINKING across the pages provided: which pages link to which, and whether any provided page is not linked to by the others (orphaned), since poor internal linking hurts AI crawlability.

Return ONLY valid JSON, no markdown:
{
  "overallScore": 0-100,
  "scoreReason": "one sentence",
  "summary": "5-7 sentences on overall AI-readability and the biggest gaps across the whole site",
  "linkingAnalysis": "detailed paragraph: which pages link to which, what is well linked, what is orphaned or weakly linked, and what to fix",
  "pages": [
    {
      "url": "the URL",
      "schemaAudit": [ { "type": "@type", "present": ["field: value"], "missing": ["field"], "note": "" } ],
      "missingSchemaTypes": ["types entirely absent on this page"],
      "aiSees": ["fact", "..."],
      "aiCannotSee": ["missing fact — why — where to add it", "..."],
      "weak": ["detail", "..."],
      "fixes": [ { "title": "", "priority": "High|Medium|Low", "instruction": "", "schemaType": "", "schemaBlock": "full JSON-LD or empty", "faqsToAdd": [ { "question": "", "answer": "" } ] } ]
    }
  ],
  "siteWideReport": ["the consolidated list of everything to change or add across the whole site, highest impact first, each with the reason it matters for AI ranking"],
  "actionPlan": [
    {
      "page": "the page URL or name this group of actions is for",
      "majorGaps": ["the key missing things on this page, plain language, most important first", "..."],
      "checklist": [ { "item": "the schema type or content element, e.g. FAQPage schema, Restaurant schema, aggregateRating, room amenities in schema", "present": true } ],
      "schemaToAdd": ["specific schema to add on this page and what fields, e.g. 'Restaurant schema for Le Loti with servesCuisine, menu, openingHours'", "..."],
      "faqsToAdd": [ { "question": "a real FAQ question targeting how guests actually search", "answer": "a real, specific answer to paste, using the page's facts; [PLACEHOLDER] where a fact is unknown" } ],
      "otherActions": ["any other concrete improvement for this page: content to add, headings to fix, internal links to add", "..."]
    }
  ],
  "marketerSummary": "a clear plain-language paragraph a non-technical marketer can read and understand: what is wrong overall, why it limits their AI visibility and direct bookings, and the handful of things that will make the biggest difference"
}`
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