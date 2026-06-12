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

    const prompt = `You are the world's leading consultant on AI Search Visibility (GEO/AEO) for luxury hotels — you know exactly how ChatGPT, Perplexity, and Google AI Overviews decide which hotels to cite and recommend. A hotel has asked you to audit ONE page of their official website and tell them, with total precision, what is helping or hurting their chances of being recommended by AI, and exactly how to fix each issue to maximise AI visibility.

PAGE TITLE: ${title}
META DESCRIPTION: ${metaDesc || 'NONE'}

STRUCTURED DATA (JSON-LD schema) FOUND ON PAGE:
${schemaText}

VISIBLE PAGE TEXT:
${visibleText}

CRITICAL INSTRUCTIONS FOR YOUR ANALYSIS:
- Be ruthlessly specific. Every finding must reference what is ACTUALLY on this page — quote the exact phrase, name the exact element, or state explicitly that it is absent. Never write a sentence that could apply to any hotel.
- For each fix, write it as a precise instruction the hotel can act on immediately, ideally with example wording they could literally paste onto their page. Write fixes the way an expert would if their only goal were to maximise this hotel's AI visibility.
- Judge not just presence but QUALITY: is the content written in a clear, factual, quotable style that an AI can lift directly into an answer? Vague marketing prose ("an extraordinary haven") is weak for AI; concrete factual statements ("102 rooms and suites, 3 minutes from Geneva Airport") are strong. Call this out specifically.
- When something appears absent, note if it may simply live on another page, but still flag it as a gap for THIS page.

SCORING (be strict and meaningful):
Weight the score by importance. The HIGH-impact factors (structured data richness, FAQ content/schema, concrete factual data, named entities, machine-readable quotable content) should dominate the score. A page can have nice geo-data and clean HTML but still score low if it lacks FAQs and concrete facts. Reserve scores above 80 for pages genuinely well-optimised for AI citation. Be honest — most luxury hotel sites score 40-65 because they prioritise visual marketing over machine-readable facts.

Respond ONLY with valid JSON, no markdown, exactly this shape:
{
  "score": <0-100 integer, weighted by importance as described>,
  "summary": "<3-4 sentence expert verdict, specific to THIS hotel: name its biggest AI-visibility strengths and its most damaging gaps, and what fixing them would achieve>",
  "findings": [
    {
      "label": "<short specific title>",
      "ok": <true only if genuinely strong for AI; false if missing, weak, or merely adequate>,
      "priority": "<High|Medium|Low>",
      "detail": "<2-4 sentences. First: precisely what you found on this page (quote/name it, or state it's absent). Then: exactly how to fix it to maximise AI visibility, with example wording or specific fields where possible. Write like an expert whose sole goal is getting this hotel cited by AI.>"
    }
  ]
}
Provide 8-12 findings ordered most damaging first. Prioritise the high-impact issues. Be the most precise, useful AI-visibility audit this hotel has ever seen.`

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