import type { BlueprintSection } from './knowledge-blueprint'

export type SectionDraft = {
  key: string
  draft: string
  usedFacts: number
  thin: boolean
  flagged: boolean
}

const DRAFT_SYSTEM = `You are writing ONE section of a hotel's AI-readable knowledge page. You are given a list of FACTS that were extracted verbatim from the hotel's own website, each with the quote that proves it. You write clear, factual, answer-first prose for the section — the way AI systems can quote easily.

ABSOLUTE RULES — these define whether the output is usable at all:
- Use ONLY the supplied facts. You may rephrase, combine and order them. You may NOT add a single detail that is not in the facts — no invented amenities, sizes, names, prices, distances, adjectives-as-facts, or "typical hotel" filler. If it is not in the facts, it does not exist.
- If the facts are too thin to write a real section, write LESS. A short honest paragraph beats a padded one. Never invent to reach a length.
- Lead with the concrete fact, not marketing language. Prefer "42 rooms across three categories" over "a stunning collection of beautifully appointed rooms".
- No superlatives or claims the facts don't support ("finest", "unforgettable", "world-class") unless the fact itself states it.
- Write 2-5 short sentences. Plain, specific, quotable. British English.
- Return STRICTLY the JSON schema: { "draft": string }. The draft is plain text, no markdown, no headings.`

function draftSchema() {
  return {
    type: 'object', additionalProperties: false, required: ['draft'],
    properties: { draft: { type: 'string' } },
  }
}

function flagUnsupported(draft: string, factsBlob: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[,\s]/g, '')
  const factsNorm = norm(factsBlob)
  const nums = (draft.match(/\d[\d.,]*\s?(?:m²|m2|km|min|pm|am|%)?/gi) || [])
  for (const n of nums) {
    const t = norm(n)
    if (t.length < 1) continue
    const digits = t.replace(/[^\d.]/g, '')
    if (digits.length >= 1 && !factsNorm.includes(digits)) return true
  }
  return false
}

export async function buildBlueprintDraft(
  section: BlueprintSection,
  openaiKey: string,
  ctx: { hotelName?: string; city?: string } = {}
): Promise<SectionDraft> {
  const base: SectionDraft = { key: section.key, draft: '', usedFacts: section.facts.length, thin: false, flagged: false }

  if (section.facts.length < 2) { base.thin = true; return base }

  const factLines = section.facts.map((f, i) => `${i + 1}. ${f.value}${f.quote ? `  (site says: "${f.quote}")` : ''}`).join('\n')
  const factsBlob = section.facts.map(f => `${f.value} ${f.quote}`).join(' ')
  const user = `HOTEL: ${ctx.hotelName || '(unknown)'}${ctx.city ? `, ${ctx.city}` : ''}
SECTION: ${section.title} — ${section.purpose}
TARGET LENGTH: about ${section.targetWords} words (write LESS if the facts don't support it).

FACTS YOU MAY USE (and NOTHING else):
${factLines}

Write the section now, using only the facts above. Return only the JSON.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o', temperature: 0.2, max_tokens: 500,
        response_format: { type: 'json_schema', json_schema: { name: 'draft', strict: true, schema: draftSchema() } },
        messages: [
          { role: 'system', content: DRAFT_SYSTEM },
          { role: 'user', content: user },
        ],
      }),
    })
    const data = await res.json()
    const c = data?.choices?.[0]?.message?.content
    if (!c) return base
    const parsed = JSON.parse(c)
    const draft = String(parsed.draft || '').trim()
    base.draft = draft
    base.flagged = draft ? flagUnsupported(draft, factsBlob) : false
    return base
  } catch {
    return base
  }
}

export async function buildAllDrafts(
  sections: BlueprintSection[],
  openaiKey: string,
  ctx: { hotelName?: string; city?: string } = {}
): Promise<Record<string, SectionDraft>> {
  const out: Record<string, SectionDraft> = {}
  const drafts = await Promise.all(sections.map(s => buildBlueprintDraft(s, openaiKey, ctx)))
  for (const d of drafts) out[d.key] = d
  return out
}
