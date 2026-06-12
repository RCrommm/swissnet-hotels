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
      .slice(0, 9000)

    // ---- Ask GPT for an expert assessment ----
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return NextResponse.json({ error: 'AI analysis not configured.' }, { status: 500 })

    const prompt = `You are an expert in AI search visibility (how hotels get recommended by ChatGPT, Perplexity, and Google AI) specialising in luxury hotels. Analyse this hotel's OWN website page and judge how well it is set up to be found and recommended by AI assistants.

PAGE TITLE: ${title}
META DESCRIPTION: ${metaDesc || 'NONE'}

STRUCTURED DATA (JSON-LD schema) FOUND ON PAGE:
${schemaText}

VISIBLE PAGE TEXT:
${visibleText}

Assess the page on the factors that make AI assistants cite and recommend a hotel:
- Structured data / schema (is it present, is it the Hotel type, is it rich or thin)
- FAQ content (do they answer common guest questions in a way AI can quote)
- Concrete facts AI loves (number of rooms/suites, named restaurants, Michelin, spa size, distances, check-in/out times, cancellation policy, languages, parking)
- Clarity and machine-readability of the content
- Anything notably missing that would help AI recommend them

Respond ONLY with valid JSON, no markdown, in exactly this shape:
{
  "score": <0-100 integer, how AI-ready this page is>,
  "summary": "<one or two sentence plain-English verdict>",
  "findings": [
    { "label": "<short title>", "ok": <true if this is done well, false if missing/weak>, "priority": "<High|Medium|Low>", "detail": "<specific observation about THIS page and a concrete fix>" }
  ]
}
Give 6-10 findings. Base every finding on what is actually present or absent in the content above — do not give generic advice. Be specific and reference what you actually saw.`

    let ai: any = null
    try {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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