import { NextResponse } from 'next/server'
import {
  REVIEW_EXTRACT_SYSTEM,
  reviewExtractSchema,
  gateAndPhrase,
  type Review,
  type ReviewFinding,
} from '@/lib/review-intelligence'

export const maxDuration = 60

// ── REVIEW INTELLIGENCE ROUTE ──
// The engine's network half. Takes normalized Review[] (from ANY connector, or
// pasted by hand for validation), runs ONE GPT extract pass to cluster themes
// from the supplied review text only, then pipes through gateAndPhrase (the
// deterministic sufficiency gate + claim phrasing). Returns gated findings.
//
// GPT reads + clusters. Platform gates + phrases. GPT never decides significance.

interface Body {
  password?: string
  reviews?: Review[]
  hotelName?: string
}

export async function POST(req: Request) {
  try {
    const { password, reviews, hotelName } = (await req.json()) as Body
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'reviews[] required' }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) return NextResponse.json({ error: 'Server not configured (OpenAI).' }, { status: 500 })

    // Compact the reviews for the prompt — number them so GPT can count distinct
    // supporters honestly, and keep source so quotes stay attributable.
    const reviewBlock = reviews
      .map((r, i) => {
        const meta = [r.source, r.rating != null ? `${r.rating}/5` : null, r.date || null, r.language || null]
          .filter(Boolean).join(' · ')
        return `#${i + 1} [${meta}]\n${(r.text || '').trim()}`
      })
      .join('\n\n')

    const user = `HOTEL: ${hotelName || '(unnamed)'}\nREVIEW COUNT: ${reviews.length}\n\nGUEST REVIEWS (each numbered; count DISTINCT reviews per theme):\n\n${reviewBlock}\n\nReturn only the JSON.`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1, // low — extraction, not creativity
        max_tokens: 2000,
        response_format: { type: 'json_schema', json_schema: { name: 'review_themes', strict: true, schema: reviewExtractSchema() } },
        messages: [
          { role: 'system', content: REVIEW_EXTRACT_SYSTEM },
          { role: 'user', content: user },
        ],
      }),
    })

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'Extract produced no output' }, { status: 502 })

    let parsed: any
    try { parsed = JSON.parse(content) } catch { return NextResponse.json({ error: 'Extract returned malformed JSON' }, { status: 502 }) }

    // PLATFORM decides significance — apply the gate to GPT's grouped themes.
    const findings: ReviewFinding[] = gateAndPhrase(parsed.themes || [])

    return NextResponse.json({
      hotel: hotelName || null,
      reviews_analyzed: reviews.length,
      themes_found: (parsed.themes || []).length,
      findings, // only those that cleared the sufficiency gate
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Review intelligence failed' }, { status: 500 })
  }
}