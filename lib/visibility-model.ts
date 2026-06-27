// lib/visibility-model.ts
// ─── THE AI VISIBILITY MODEL ───
// Computes, DETERMINISTICALLY (no GPT), how AI currently "sees" the hotel across
// commercial dimensions. Every score derives from data already stored:
//   (a) confirmed Brain facts in that dimension
//   (b) a real, well-built page (audit importantPages)
//   (c) answerable guest questions (audit recommendation.results YES vs NO/PARTIAL)
// The score is their weighted blend, so it is always defensible. GPT never sets numbers.
//
// APPLICABILITY (owner-confirmed): a dimension the hotel genuinely does not offer
// (e.g. no spa) is marked applicable=false, shown as "Not offered", and EXCLUDED from
// the overall — never scored as a weakness. This is driven ONLY by the owner-confirmed
// `notOffered` list, NEVER inferred from a low score. "Doesn't do this" and "does this
// badly" are different conclusions; only the former excludes.

export interface DimensionScore {
  dimension: string
  label: string
  score: number
  band: 'strong' | 'moderate' | 'weak' | 'absent' | 'na'
  applicable: boolean
  na_reason?: string
  inputs: { facts: number; pageScore: number | null; pageExists: boolean; qTotal: number; qAnswerable: number }
  evidence: string[]
}

const DIMENSIONS: { dimension: string; label: string; factCats: RegExp; pageKey: RegExp; qCat: RegExp; hygiene?: boolean }[] = [
  { dimension: 'luxury',   label: 'Luxury & positioning', factCats: /(identity|awards|trust|amenities|rooms)/i, pageKey: /(home|about|rooms?|suites?|accommodation)/i, qCat: /(luxury|overall)/i },
  { dimension: 'dining',   label: 'Dining',               factCats: /(dining|restaurant|bar)/i,                 pageKey: /(restaurant|dining|bar|brasserie|afternoon)/i, qCat: /(dining)/i },
  { dimension: 'romantic', label: 'Romantic & weddings',  factCats: /(romantic|wedding)/i,                      pageKey: /(wedding|romantic|honeymoon|civil)/i, qCat: /(romantic)/i },
  { dimension: 'business', label: 'Business & meetings',  factCats: /(business|meeting)/i,                      pageKey: /(meeting|event|conference|baptist|business)/i, qCat: /(business)/i },
  { dimension: 'family',   label: 'Family',               factCats: /(family)/i,                                pageKey: /(family|kids|children)/i, qCat: /(family)/i },
  { dimension: 'wellness', label: 'Wellness & spa',       factCats: /(spa|wellness)/i,                          pageKey: /(spa|wellness)/i, qCat: /(spa)/i },
  { dimension: 'location', label: 'Location',             factCats: /(location|transport|entities)/i,          pageKey: /(location|neighbourhood|directions)/i, qCat: /(location)/i },
  { dimension: 'trust',    label: 'Practical & trust',    factCats: /(parking|accessibility|pets|policies)/i,  pageKey: /(parking|accessib|contact|practical)/i, qCat: /(parking|accessibility|pets)/i, hygiene: true },
]

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '').toLowerCase() || '/' } catch { return (u || '').toLowerCase() }
}

export function buildVisibilityModel(facts: any[], auditResult: any, notOffered: string[] = []): { dimensions: DimensionScore[]; overall: number } {
  const pages = (auditResult?.importantPages || [])
  const qResults = (auditResult?.recommendation?.results || [])
  const naSet = new Set((notOffered || []).map(s => String(s || '').toLowerCase().trim()).filter(Boolean))

  const dims: DimensionScore[] = DIMENSIONS.map(D => {
    // ── NOT OFFERED (owner-confirmed): excluded, shown separately, never scored as weak. ──
    if (naSet.has(D.dimension)) {
      return {
        dimension: D.dimension, label: D.label, score: 0, band: 'na', applicable: false,
        na_reason: `This hotel does not offer ${D.label.toLowerCase()}.`,
        inputs: { facts: 0, pageScore: null, pageExists: false, qTotal: 0, qAnswerable: 0 },
        evidence: ['Not offered by this hotel — excluded from the AI Visibility score.'],
      }
    }

    const dimFacts = (facts || []).filter(f => D.factCats.test((f.category || '').toLowerCase()))
    const factCount = dimFacts.length

    const page = pages.find((p: any) => {
      const blob = `${p.key || ''} ${pathOf(p.url || '')} ${(p.label || '')}`.toLowerCase()
      return D.pageKey.test(blob) && p.status === 'Present'
    })
    const pageExists = !!page
    const pageScore = page && typeof page.score === 'number' ? page.score : null

    const dimQ = qResults.filter((r: any) => D.qCat.test((r.category || '').toLowerCase()))
    const qTotal = dimQ.length
    const qAnswerable = dimQ.filter((r: any) => r.readiness === 'YES').length
    const qPartial = dimQ.filter((r: any) => r.readiness === 'PARTIAL').length

    const factPts = Math.min(40, factCount * 12)
    const pagePts = pageExists ? (pageScore != null ? Math.round((pageScore / 100) * 35) : 18) : 0
    const ansPts = qTotal > 0 ? Math.round(((qAnswerable + qPartial * 0.5) / qTotal) * 25) : 0
    let score = factPts + pagePts + ansPts
    if (factCount === 0 && !pageExists && qAnswerable === 0 && qPartial === 0) score = 0
    score = Math.max(0, Math.min(100, score))

    const band: DimensionScore['band'] = score === 0 ? 'absent' : score < 35 ? 'weak' : score < 70 ? 'moderate' : 'strong'

    const evidence: string[] = []
    if (factCount) evidence.push(`${factCount} confirmed fact${factCount > 1 ? 's' : ''} about ${D.label.toLowerCase()}`)
    else evidence.push(`No confirmed facts about ${D.label.toLowerCase()}`)
    if (pageExists) evidence.push(`Has a ${pageScore != null ? `${pageScore}/100 ` : ''}page AI can retrieve`)
    else evidence.push(`No dedicated page AI can retrieve`)
    if (qTotal) evidence.push(`AI can answer ${qAnswerable}/${qTotal} guest question${qTotal > 1 ? 's' : ''} here${qPartial ? ` (${qPartial} partial)` : ''}`)

    return { dimension: D.dimension, label: D.label, score, band, applicable: true, inputs: { facts: factCount, pageScore, pageExists, qTotal, qAnswerable }, evidence }
  })

  // Overall = mean of the COMMERCIAL dimensions that are APPLICABLE.
  // Excludes hygiene (Practical & trust) AND any owner-confirmed not-offered dimension.
  const scored = dims.filter(d => {
    const def = DIMENSIONS.find(D => D.dimension === d.dimension)
    return d.applicable !== false && !def?.hygiene
  })
  const overall = Math.round(scored.reduce((s, d) => s + d.score, 0) / Math.max(1, scored.length))

  return { dimensions: dims, overall }
}
