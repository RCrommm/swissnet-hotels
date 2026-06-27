// lib/foundations.ts
// buildFoundations(auditResult, knowledgeGraph) — DETERMINISTIC executive explainability.
// Groups the real audit layers into 5 consulting PILLARS a GM understands. Each pillar's
// score = average of its child layers' real scores (PASS/PARTIAL/FAIL → 100/50/0 for
// layers without a numeric score). NO GPT, NO invented metric — a pillar is an average of
// real layer numbers, and every child layer is exposed on click. A pillar renders only if
// it has at least one real child; a child renders only if the audit computed it.

export interface FoundationChild {
  name: string
  score: number | null
  status: string | null
  ok: boolean            // true = PASS / strong, for the ✓ vs ⚠ marker
}

export interface Foundation {
  key: string
  name: string
  band: 'strong' | 'moderate' | 'weak' | 'absent'
  score: number | null
  why_it_matters: string
  assessment: string
  evidence: string[]
  recommendation: string | null
  components: FoundationChild[]   // the underlying audit layers, shown on expand
}

function layerNumeric(l: any): number {
  if (typeof l.score === 'number') return l.score
  const s = (l.status || '').toUpperCase()
  if (s === 'PASS') return 100
  if (s === 'PARTIAL') return 50
  return 0
}
function layerOk(l: any): boolean {
  if (typeof l.score === 'number') return l.score >= 70
  return (l.status || '').toUpperCase() === 'PASS'
}
function bandOf(score: number | null): Foundation['band'] {
  if (score == null) return 'absent'
  return score >= 70 ? 'strong' : score >= 40 ? 'moderate' : score > 0 ? 'weak' : 'absent'
}

// Pillar definitions: which audit layer numbers (L0–L13) roll into each consulting pillar.
const PILLARS: { key: string; name: string; layerNs: number[]; why: string }[] = [
  { key: 'knowledge', name: 'Knowledge', layerNs: [0, 7], why: 'AI can only describe and recommend your hotel from facts it can clearly retrieve. This is how completely and consistently your core facts and named places are captured.' },
  { key: 'technical', name: 'Technical Readiness', layerNs: [12, 5, 13, 11, 1], why: 'These are the machine-readable signals AI relies on to parse, trust and quote your site — schema, structured blocks, internal links and the core page structure.' },
  { key: 'content', name: 'Content Structure', layerNs: [2, 3, 4, 8, 6], why: 'Whether your pages are built around the things guests search for, and answer the who/why/comparison questions AI needs to recommend you for a specific need.' },
  { key: 'trust', name: 'Trust & Authority', layerNs: [10, 9], why: 'Reviews, awards, ratings and local authority are weighed heavily by AI when choosing which hotel to surface first among similar options.' },
]

export function buildFoundations(auditResult: any, knowledgeGraph: any): Foundation[] {
  const layers = auditResult?.architecture?.layers
  const byN: Record<number, any> = {}
  if (Array.isArray(layers)) for (const l of layers) byN[l.n] = l

  const out: Foundation[] = []

  for (const P of PILLARS) {
    const childLayers = P.layerNs.map(n => byN[n]).filter(Boolean)
    if (childLayers.length === 0) continue

    const avg = Math.round(childLayers.reduce((s, l) => s + layerNumeric(l), 0) / childLayers.length)
    const components: FoundationChild[] = childLayers.map(l => ({
      name: l.layer || ('Layer ' + l.n),
      score: typeof l.score === 'number' ? l.score : null,
      status: l.status || null,
      ok: layerOk(l),
    }))

    // Assessment + evidence + recommendation: lead with the weakest child layer (the one
    // most responsible for the pillar score) so the GM sees the real reason and real fix.
    const weakest = [...childLayers].sort((a, b) => layerNumeric(a) - layerNumeric(b))[0]
    const assessment = (weakest?.scoreReason || '').trim()
    const evidence: string[] = childLayers.flatMap((l: any) => Array.isArray(l.evidence) ? l.evidence.filter(Boolean) : []).slice(0, 6)
    const recommendation = (weakest?.fix && weakest.fix !== 'Nothing missing.') ? weakest.fix : null

    out.push({
      key: P.key, name: P.name, band: bandOf(avg), score: avg,
      why_it_matters: P.why, assessment, evidence, recommendation, components,
    })
  }

  // ── Knowledge Graph health → folded into the Knowledge pillar as a child + evidence ──
  if (knowledgeGraph?.clusters?.length) {
    const cl = knowledgeGraph.clusters
    const pool = cl.filter((c: any) => c.commercial_importance === 'High')
    const use = pool.length ? pool : cl
    const avgHealth = Math.round(use.reduce((s: number, c: any) => s + (c.cluster_health || 0), 0) / use.length)
    const kPillar = out.find(p => p.key === 'knowledge')
    if (kPillar) {
      kPillar.components.push({ name: 'Knowledge Graph', score: avgHealth, status: null, ok: avgHealth >= 70 })
      // re-average including KG
      const allScores = kPillar.components.map(c => c.score ?? (c.ok ? 100 : 50))
      kPillar.score = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      kPillar.band = bandOf(kPillar.score)
      const scattered = cl.filter((c: any) => c.cluster_state === 'scattered' || c.cluster_state === 'orphaned')
      if (scattered.length) {
        kPillar.evidence = [...scattered.slice(0, 4).map((c: any) => `${c.label}: ${c.cluster_state}`), ...kPillar.evidence].slice(0, 6)
      }
    }
  }

  // ── Question Coverage → its own pillar (answerability is a distinct executive concern) ──
  const rec = auditResult?.recommendation
  if (rec && typeof rec.total === 'number' && rec.total > 0) {
    const answered = (rec.yes || 0) + (rec.partial || 0)
    const pctCov = Math.round((answered / rec.total) * 100)
    out.push({
      key: 'question-coverage', name: 'Question Coverage', band: bandOf(pctCov), score: pctCov,
      why_it_matters: 'The breadth of guest questions your site can answer is a direct measure of how often AI can use your site to respond to a guest at all.',
      assessment: `Your site can confidently or partly answer ${answered} of ${rec.total} tracked guest questions (${rec.yes || 0} fully, ${rec.partial || 0} partially).`,
      evidence: [`${rec.yes || 0} questions fully answerable`, `${rec.partial || 0} partially answerable`, `${rec.no || 0} unanswered`],
      recommendation: pctCov < 70 ? 'Add FAQs and fact pages for the unanswered guest questions to widen the searches AI can use you for.' : null,
      components: [],
    })
  }

  // Executive order: strongest reasons first reads as a confident briefing.
  return out.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
}
