// lib/foundations.ts
// buildFoundations(auditResult, knowledgeGraph) — DETERMINISTIC explainability layer.
// Exposes the months of Website Intelligence already computed: the 14 architecture
// layers (each with why/assessment/evidence/fix) + Knowledge Graph health + Question
// Coverage. NO GPT, NO invention. A foundation renders ONLY if its source data exists.
// This is an explanation of WHY the visibility score is what it is — not a new score.

export interface Foundation {
  key: string
  name: string
  band: 'strong' | 'moderate' | 'weak' | 'absent'
  score: number | null          // 0-100 where the source provides one; else null
  status: string | null         // PASS / PARTIAL / FAIL where applicable
  why_it_matters: string        // from LAYER_META.why (real)
  assessment: string            // from layer.scoreReason (real)
  evidence: string[]            // from layer.evidence (real)
  recommendation: string | null // from layer.fix (real)
}

function bandFromStatus(status: string | null, score: number | null): Foundation['band'] {
  if (score != null) return score >= 70 ? 'strong' : score >= 40 ? 'moderate' : score > 0 ? 'weak' : 'absent'
  const s = (status || '').toUpperCase()
  if (s === 'PASS') return 'strong'
  if (s === 'PARTIAL') return 'moderate'
  if (s === 'FAIL') return 'weak'
  return 'absent'
}

export function buildFoundations(auditResult: any, knowledgeGraph: any): Foundation[] {
  const out: Foundation[] = []

  // ── The 14 architecture layers (the technical foundations) ──
  const layers = auditResult?.architecture?.layers
  if (Array.isArray(layers)) {
    for (const l of layers) {
      // Only include a layer that actually carries an assessment — no empty shells.
      const assessment = (l.scoreReason || '').trim()
      if (!assessment) continue
      const score = typeof l.score === 'number' ? l.score : null
      const status = l.status || null
      out.push({
        key: 'layer-' + l.n,
        name: l.layer || ('Layer ' + l.n),
        band: bandFromStatus(status, score),
        score,
        status,
        why_it_matters: (l.why || '').trim(),
        assessment,
        evidence: Array.isArray(l.evidence) ? l.evidence.filter(Boolean) : [],
        recommendation: (l.fix && l.fix !== 'Nothing missing.') ? l.fix : null,
      })
    }
  }

  // ── Knowledge Graph health (synthesized from the KG engine, real) ──
  if (knowledgeGraph?.clusters?.length) {
    const cl = knowledgeGraph.clusters
    const commercial = cl.filter((c: any) => c.commercial_importance === 'High')
    const pool = commercial.length ? commercial : cl
    const avgHealth = Math.round(pool.reduce((s: number, c: any) => s + (c.cluster_health || 0), 0) / pool.length)
    const consolidated = cl.filter((c: any) => c.cluster_state === 'consolidated').length
    const scattered = cl.filter((c: any) => c.cluster_state === 'scattered' || c.cluster_state === 'orphaned').length
    const evidence: string[] = cl
      .filter((c: any) => c.facts > 0)
      .slice(0, 6)
      .map((c: any) => `${c.label}: ${c.cluster_state}${c.canonical_page ? ` (${c.canonical_page})` : ''}`)
    out.push({
      key: 'knowledge-graph',
      name: 'Knowledge Graph',
      band: bandFromStatus(null, avgHealth),
      score: avgHealth,
      status: null,
      why_it_matters: 'AI builds a clean concept of each offering only when its facts are anchored on one page. Scattered facts read as disconnected, so AI cannot confidently describe or recommend that offering.',
      assessment: `${consolidated} topic${consolidated === 1 ? '' : 's'} are consolidated on a canonical page; ${scattered} are scattered across pages with no single anchor.`,
      evidence,
      recommendation: scattered > 0 ? 'Consolidate scattered topics onto one canonical page each so AI can form a single, trustworthy concept.' : null,
    })
  }

  // ── Question Coverage (synthesized from audit recommendation results, real) ──
  const rec = auditResult?.recommendation
  if (rec && typeof rec.total === 'number' && rec.total > 0) {
    const answered = (rec.yes || 0) + (rec.partial || 0)
    const pctCov = Math.round((answered / rec.total) * 100)
    out.push({
      key: 'question-coverage',
      name: 'Question Coverage',
      band: bandFromStatus(null, pctCov),
      score: pctCov,
      status: null,
      why_it_matters: 'The breadth of guest questions your site can answer is a direct measure of how often AI can use your site to respond to a guest at all.',
      assessment: `Your site can confidently or partly answer ${answered} of ${rec.total} tracked guest questions (${rec.yes || 0} fully, ${rec.partial || 0} partially).`,
      evidence: [`${rec.yes || 0} questions fully answerable`, `${rec.partial || 0} partially answerable`, `${rec.no || 0} unanswered`],
      recommendation: pctCov < 70 ? 'Add FAQs and fact pages for the unanswered guest questions to widen the searches AI can use you for.' : null,
    })
  }

  return out
}
