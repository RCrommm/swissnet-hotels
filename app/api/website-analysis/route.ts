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
      response_format: { type: 'json_schema', json_schema: { name: schema.name, strict: true, schema: schema.schema } },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  try { return JSON.parse(data.choices[0].message.content) } catch { return { _error: 'parse', raw: data?.choices?.[0]?.message?.content || JSON.stringify(data).slice(0, 500) } }
}

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
const RECOMMEND_SYSTEM = `You are an AI retrieval engineer who thinks like ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews deciding whether to recommend a hotel. You are NOT a traditional SEO consultant; schema is only a SUPPORTING signal, not the foundation.

You are given a STRICT EXTRACTION of what a hotel's website literally contains — facts present/absent (with evidence), per-page schema types and fields, FAQ presence, headings. You must base every judgement ONLY on this extraction. You may NOT invent facts the extraction does not show. Where an FAQ answer would need a fact that is absent, write [VERIFY] in place of the value — never guess a number, price, time, or amenity.

Judge by impact hierarchy: TIER 1 (highest) = explicit facts, entity clarity, answerable guest questions, FAQ coverage, content quality. TIER 2 = schema as support. TIER 3 = image/video/breadcrumb schema. Weight Tier 1 hardest. Do NOT assess third-party authority (Tripadvisor, Booking, Michelin, social) — you cannot see it.

Frame everything as "gaps and opportunities," never guarantees. Produce a plain-language marketerSummary, an answersCheck (can a guest get each answer from the site), a per-page actionPlan with real FAQs (use [VERIFY] for unknown facts), and a consolidated siteWideReport.`

const RECOMMEND_SCHEMA = {
  name: 'recommendation',
  schema: {
    type: 'object', additionalProperties: false,
    required: ['overallScore', 'scoreReason', 'summary', 'marketerSummary', 'answersCheck', 'siteWideReport', 'actionPlan'],
    properties: {
      overallScore: { type: 'integer' },
      scoreReason: { type: 'string' },
      summary: { type: 'string' },
      marketerSummary: { type: 'string' },
      answersCheck: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['question', 'answerable', 'note'],
          properties: { question: { type: 'string' }, answerable: { type: 'boolean' }, note: { type: 'string' } },
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

    // PASS 1 — extract only what's present
    const extraction = await callOpenAI(
      EXTRACT_SYSTEM,
      `Extract what is literally present on these pages. Quote evidence for every present:true.\n\n${JSON.stringify(scraped, null, 2)}`,
      EXTRACT_SCHEMA,
    )
    if (extraction?._error) return NextResponse.json({ error: 'Extraction step failed to parse', detail: extraction.raw }, { status: 502 })

    // PASS 2 — recommend from extraction only
    const recommendation = await callOpenAI(
      RECOMMEND_SYSTEM,
      `Here is the strict extraction of the hotel website. Base all advice ONLY on this. Use [VERIFY] for any fact not present.\n\n${JSON.stringify(extraction, null, 2)}`,
      RECOMMEND_SCHEMA,
    )
    if (recommendation?._error) return NextResponse.json({ error: 'Recommendation step failed to parse', detail: recommendation.raw }, { status: 502 })

    // merge into one analysis object the dashboard + admin page read
    const analysis = {
      ...recommendation,
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