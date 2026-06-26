import {
  REVIEW_EXTRACT_SYSTEM,
  reviewExtractSchema,
  gateAndPhrase,
  mapFindingsToCases,
  type Review,
  type ReviewFinding,
  type ReviewMappingResult,
} from '@/lib/review-intelligence'

// ── REVIEW ANALYZE (shared network half) ──
// Importable by both the /api/review-intelligence route and the consultant route,
// so the consultant never HTTP-requests its own server. Runs the GPT extract pass,
// then the deterministic gate. Returns gated findings. Returns null if OpenAI
// isn't configured (caller degrades gracefully — no review evidence, run unchanged).

export async function analyzeReviews(
  reviews: Review[],
  hotelName?: string,
): Promise<ReviewFinding[] | null> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) return null
  if (!Array.isArray(reviews) || reviews.length === 0) return []

  const reviewBlock = reviews
    .map((r, i) => {
      const meta = [r.source, r.rating != null ? `${r.rating}/5` : null, r.date || null, r.language || null]
        .filter(Boolean).join(' · ')
      return `#${i + 1} [${meta}]\n${(r.text || '').trim()}`
    })
    .join('\n\n')

  const user = `HOTEL: ${hotelName || '(unnamed)'}\nREVIEW COUNT: ${reviews.length}\n\nGUEST REVIEWS (each numbered; count DISTINCT reviews per theme):\n\n${reviewBlock}\n\nReturn only the JSON.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1,
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
    if (!content) return []
    const parsed = JSON.parse(content)
    return gateAndPhrase(parsed.themes || [])
  } catch {
    return []
  }
}

// Convenience: analyze + map to the Cases present this run, in one call.
export async function analyzeAndMapReviews(
  reviews: Review[],
  caseTopics: string[],
  hotelName?: string,
): Promise<{ findings: ReviewFinding[]; mapping: ReviewMappingResult } | null> {
  const findings = await analyzeReviews(reviews, hotelName)
  if (findings === null) return null
  const mapping = mapFindingsToCases(findings, caseTopics)
  return { findings, mapping }
}