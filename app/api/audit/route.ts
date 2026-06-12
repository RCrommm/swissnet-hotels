import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    let target = url.trim()
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target

    const beeKey = process.env.SCRAPINGBEE_API_KEY
    if (!beeKey) return NextResponse.json({ error: 'Scraping not configured.' }, { status: 500 })

    // ---- Fetch the fully-rendered page via ScrapingBee ----
    let html = ''
    try {
      const beeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${beeKey}&url=${encodeURIComponent(target)}&render_js=true&premium_proxy=true&country_code=ch`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 50000)
      const res = await fetch(beeUrl, { signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        html = await res.text()
      } else {
        return NextResponse.json({ error: `Could not read the site (scraper status ${res.status}).`, reachable: false }, { status: 200 })
      }
    } catch (e: any) {
      return NextResponse.json({ error: 'Could not read the site (timed out or blocked).', reachable: false }, { status: 200 })
    }

    if (!html || html.length < 500) {
      return NextResponse.json({ error: 'The site returned almost no content.', reachable: false }, { status: 200 })
    }

    // ---- Extract readable text + schema for the AI ----
    const schemaBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => m[1].trim())
    const schemaText = schemaBlocks.length ? schemaBlocks.join('\n\n').slice(0, 6000) : 'NONE FOUND'

    const metaDesc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '').slice(0, 300)
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').slice(0, 200)

    const visibleText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 14000)

    // ---- Ask GPT for an expert assessment ----
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return NextResponse.json({ error: 'AI analysis not configured.' }, { status: 500 })

    const prompt = `You are a leading expert in AI Search Visibility (GEO) for luxury hotels — how hotels get cited and recommended by ChatGPT, Perplexity, and Google AI Overviews. You are auditing a hotel's OWN official website page. Be rigorous, specific, and concrete. Reference exactly what you see on the page — quote short phrases or name specific elements. Never give generic advice that could apply to any hotel.

PAGE TITLE: ${title}
META DESCRIPTION: ${metaDesc || 'NONE'}

STRUCTURED DATA (JSON-LD schema) FOUND ON PAGE:
${schemaText}

VISIBLE PAGE TEXT:
${visibleText}

Evaluate the page against every factor that determines whether an AI assistant will confidently recommend this hotel. For EACH finding:
- State precisely what you found or didn't find ON THIS PAGE (name the element, quote a short phrase, or say explicitly it is absent).
- Explain why it matters for AI visibility in one sentence.
- Give a concrete, actionable fix the hotel can implement — specific to this hotel, not generic.

Cover at least these areas, plus anything else notable:
1. Structured data / schema — present? Hotel type? How rich? Missing fields (rooms, amenities, ratings, FAQ schema, restaurant, geo)? Be specific about which schema fields are present vs absent.
2. FAQ content & FAQ schema — do they answer common guest questions in quotable form?
3. Concrete factual data AI loves — exact room/suite count, named restaurants + Michelin status, spa name + size in m², check-in/out times, cancellation policy, languages spoken, parking, distances to airport/centre, address, phone.
4. Named entities & specificity — are restaurants, spa, suites, chefs named explicitly?
5. Machine-readability — clean text vs HTML entities, content buried in images, JS-dependent content.
6. Meta description & title quality.
7. Direct-booking signals — is there a clear reason/CTA to book direct vs OTA?
8. Authority/trust signals on the page — awards, ratings, press, certifications.

Respond ONLY with valid JSON, no markdown, exactly this shape:
{
  "score": <0-100 integer reflecting overall AI-readiness>,
  "summary": "<2-3 sentence precise verdict naming the biggest strengths and the biggest gaps for THIS specific hotel>",
  "findings": [
    { "label": "<short specific title>", "ok": <true if genuinely done well, false if missing/weak>, "priority": "<High|Medium|Low>", "detail": "<precise observation referencing what is actually on the page + a concrete, hotel-specific fix. 2-3 sentences.>" }
  ]
}
Provide 8-12 findings, ordered most important first. Be detailed and exact.`

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
    } catch (e: any) {
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
      schemaFound: schemaBlocks.length > 0,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Audit failed: ' + (e?.message || 'unknown error') }, { status: 500 })
  }
}