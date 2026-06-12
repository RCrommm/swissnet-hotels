import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  const url = searchParams.get('url')
  if (key !== process.env.AUDIT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!url) return NextResponse.json({ error: 'Add ?url=https://hotel.com to the link' }, { status: 400 })
  // Reuse the POST logic by faking a request body
  return POST(new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }))
}

const AI_RELEVANT = [
  'room', 'suite', 'accommodation', 'chambre', 'villa',
  'dining', 'restaurant', 'bar', 'gastronom', 'cuisine',
  'spa', 'wellness', 'fitness', 'nescens',
  'family', 'famille', 'kids',
  'offer', 'package', 'offre', 'deal',
  'experience', 'experiences', 'activit',
  'location', 'meeting', 'event',
]

async function scrape(url: string, beeKey: string): Promise<string> {
  try {
    const beeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${beeKey}&url=${encodeURIComponent(url)}&render_js=true&premium_proxy=true&country_code=ch`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 40000)
    const res = await fetch(beeUrl, { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) return await res.text()
    return ''
  } catch { return '' }
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSchema(html: string): string {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1].trim())
  return blocks.join('\n\n')
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    let target = url.trim()
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target

    const beeKey = process.env.SCRAPINGBEE_API_KEY
    if (!beeKey) return NextResponse.json({ error: 'Scraping not configured.' }, { status: 500 })
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return NextResponse.json({ error: 'AI analysis not configured.' }, { status: 500 })

    const origin = new URL(target).origin
    const host = new URL(target).hostname.replace('www.', '')

    // ---- 1. Scrape homepage ----
    const homeHtml = await scrape(target, beeKey)
    if (!homeHtml || homeHtml.length < 500) {
      return NextResponse.json({ error: 'Could not read your homepage (it may be blocking automated visits).', reachable: false }, { status: 200 })
    }

    // ---- 2. Find internal AI-relevant links ----
    const linkMatches = [...homeHtml.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    const seen = new Set<string>([target.replace(/\/$/, '')])
    const candidates: { url: string; label: string }[] = []
    for (const m of linkMatches) {
      let href = m[1].trim()
      const linkText = extractText(m[2]).toLowerCase()
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
      // Normalise to absolute URL
      try {
        if (href.startsWith('/')) href = origin + href
        else if (!/^https?:\/\//i.test(href)) href = origin + '/' + href
      } catch { continue }
      // Same domain only
      try { if (new URL(href).hostname.replace('www.', '') !== host) continue } catch { continue }
      const clean = href.split('#')[0].replace(/\/$/, '')
      if (seen.has(clean)) continue
      const haystack = (clean + ' ' + linkText).toLowerCase()
      if (AI_RELEVANT.some(k => haystack.includes(k))) {
        seen.add(clean)
        candidates.push({ url: clean, label: linkText.slice(0, 40) || clean.split('/').filter(Boolean).pop() || 'page' })
      }
    }

    // De-dupe by "page type" so we don't scan 3 room pages; cap at 8
    const pickedTypes = new Set<string>()
    const typeOf = (s: string) => {
      const l = s.toLowerCase()
      if (/room|suite|accommodation|chambre/.test(l)) return 'rooms'
      if (/villa/.test(l)) return 'villa'
      if (/dining|restaurant|bar|gastronom|cuisine/.test(l)) return 'dining'
      if (/spa|wellness|fitness|nescens/.test(l)) return 'spa'
      if (/family|famille|kids/.test(l)) return 'family'
      if (/offer|package|offre|deal/.test(l)) return 'offers'
      if (/experience|activit/.test(l)) return 'experiences'
      if (/location/.test(l)) return 'location'
      if (/meeting|event/.test(l)) return 'meetings'
      return 'other'
    }
    const toScan: { url: string; label: string; type: string }[] = []
    for (const c of candidates) {
      const t = typeOf(c.url + ' ' + c.label)
      if (pickedTypes.has(t)) continue
      pickedTypes.add(t)
      toScan.push({ ...c, type: t })
      if (toScan.length >= 8) break
    }

    // ---- 3. Scrape the picked pages in parallel ----
    const scraped = await Promise.all(toScan.map(async p => ({ ...p, html: await scrape(p.url, beeKey) })))

    // ---- 4. Build combined content for the AI ----
    const homeTitle = (homeHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').slice(0, 200)
    const homeMeta = (homeHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '').slice(0, 300)

    const allSchema = [extractSchema(homeHtml), ...scraped.map(s => extractSchema(s.html))].filter(Boolean).join('\n\n').slice(0, 8000)

    const pageSections: string[] = []
    pageSections.push(`=== HOMEPAGE (${target}) ===\n${extractText(homeHtml).slice(0, 6000)}`)
    const pagesScannedList: { type: string; url: string; ok: boolean }[] = [{ type: 'home', url: target, ok: true }]
    for (const s of scraped) {
      const ok = !!(s.html && s.html.length > 500)
      pagesScannedList.push({ type: s.type, url: s.url, ok })
      if (ok) {
        pageSections.push(`=== ${s.type.toUpperCase()} PAGE (${s.url}) ===\n${extractText(s.html).slice(0, 4000)}`)
      }
    }
    const combinedContent = pageSections.join('\n\n').slice(0, 28000)

    // ---- 5. Expert GPT audit ----
    const prompt = `You are the world's leading consultant on AI Search Visibility (GEO/AEO) for luxury hotels — you know precisely how ChatGPT, Perplexity, and Google AI Overviews decide which hotels to cite and recommend. A hotel has asked you to audit their official website (multiple key pages have been crawled for you) and tell them, with total precision, exactly what is helping or hurting their chances of being recommended by AI — and exactly how to fix each issue to maximise AI visibility.

You have been given the homepage plus several key pages (rooms, dining, spa, etc.). Judge the site AS A WHOLE — if a fact appears on any page, credit it; only flag something as missing if it is absent across all crawled pages.

SITE: ${host}
HOMEPAGE TITLE: ${homeTitle}
HOMEPAGE META DESCRIPTION: ${homeMeta || 'NONE'}

ALL STRUCTURED DATA (JSON-LD) FOUND ACROSS PAGES:
${allSchema || 'NONE FOUND'}

CONTENT FROM CRAWLED PAGES:
${combinedContent}

CRITICAL INSTRUCTIONS:
- Be ruthlessly specific. Every finding must reference what is ACTUALLY on the site — quote an exact phrase, name the exact element/page, or state explicitly it is absent everywhere. Never write a sentence that could apply to any hotel.
- For each fix, write a precise, actionable instruction WITH EXAMPLE WORDING the hotel could paste onto their page. Write fixes as if your only goal is maximising this hotel's AI citation rate.
- Judge QUALITY, not just presence: content written in clear, factual, quotable sentences ("102 rooms and suites, 3 minutes from Geneva Airport, Spa Nescens 2,500m²") is strong for AI; vague marketing prose ("an extraordinary haven beyond time") is weak — call this out specifically and show how to rewrite it.
- Note which page each strength/gap relates to.

SCORING — be strict and weighted by importance. HIGH-impact factors (rich structured data, FAQ content/schema, concrete factual data, named entities, quotable machine-readable writing) dominate the score. Clean HTML and geo-data alone cannot lift a page that lacks FAQs and concrete facts. Reserve 80+ for sites genuinely optimised for AI citation. Most luxury hotels score 40-65 because they prioritise visual marketing over machine-readable facts. Be honest.

Respond ONLY with valid JSON, no markdown, exactly this shape:
{
  "score": <0-100 integer, weighted by importance>,
  "summary": "<3-4 sentence expert verdict specific to THIS hotel: biggest AI-visibility strengths, most damaging gaps, and what fixing them achieves>",
  "findings": [
    {
      "label": "<short specific title>",
      "ok": <true only if genuinely strong for AI; false if missing/weak/merely adequate>,
      "priority": "<High|Medium|Low>",
      "category": "<Structured Data|Content|Facts|Booking|Authority|Readability>",
      "detail": "<2-4 sentences. First: precisely what you found and on which page (quote/name it) or state it's absent everywhere. Then: exactly how to fix it with example wording. Expert tone, AI-visibility focused.>"
    }
  ]
}
Provide 10-14 findings ordered most damaging first. Be the most precise, useful AI-visibility audit this hotel has ever received.`

    let ai: any = null
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      })
      const aiData = await aiRes.json()
      const content = aiData?.choices?.[0]?.message?.content
      if (content) ai = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'AI analysis failed. Please try again.', reachable: true }, { status: 200 })
    }

    if (!ai || !Array.isArray(ai.findings)) {
      return NextResponse.json({ error: 'AI returned an unexpected result. Please try again.', reachable: true }, { status: 200 })
    }

    const findings = ai.findings.map((f: any) => ({
      key: (f.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40),
      label: f.label || 'Finding',
      ok: !!f.ok,
      priority: ['High', 'Medium', 'Low'].includes(f.priority) ? f.priority : 'Medium',
      category: f.category || 'Content',
      detail: f.detail || '',
    }))

    const passed = findings.filter((f: any) => f.ok).length
    const score = typeof ai.score === 'number' ? Math.round(ai.score) : Math.round((passed / Math.max(findings.length, 1)) * 100)

    return NextResponse.json({
      reachable: true,
      url: target,
      score,
      summary: ai.summary || '',
      passed,
      total: findings.length,
      findings,
      pagesScanned: pagesScannedList.filter(p => p.ok),
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Audit failed: ' + (e?.message || 'unknown error') }, { status: 500 })
  }
}