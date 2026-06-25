// lib/technical-readiness.ts
// ─── TECHNICAL AI-READINESS (from the audit's existing architecture block) ───
// Deterministic. No GPT. No crawl. Reads result.architecture.layers (already computed
// and stored) and converts FAIL/PARTIAL technical layers into consultant-ready findings:
// issue, severity, fix, and action TYPE (add_schema / add_section / strengthen_page / verify).

export type TechActionType = 'add_schema' | 'add_section' | 'strengthen_page' | 'verify'

export interface TechFinding {
  layer: string
  severity: 'High' | 'Medium' | 'Low'
  issue: string
  evidence: string
  fix: string
  action: TechActionType
}

function layerAction(layerName: string, fix: string): TechActionType {
  const l = (layerName || '').toLowerCase()
  const f = (fix || '').toLowerCase()
  if (l === 'schema' || /schema/.test(f)) return 'add_schema'
  if (l === 'trust signals' || /review|aggregaterating|schema/.test(f)) return 'add_schema'
  if (/add .* block|quick facts|ai summary|faq|section|who|why/.test(f)) return 'add_section'
  if (/create a .* page|create a dedicated/.test(f)) return 'strengthen_page'
  return 'add_section'
}

const TECH_LAYERS = /(schema|retrieval blocks|question architecture|trust signals|entity coverage|internal linking|ai answer library)/i

export function buildTechnicalReadiness(auditResult: any): { findings: TechFinding[]; techScore: number | null } {
  const arch = auditResult?.architecture
  if (!arch || !Array.isArray(arch.layers)) return { findings: [], techScore: null }

  const findings: TechFinding[] = []
  for (const layer of arch.layers) {
    const status = (layer.status || '').toUpperCase()
    if (status !== 'FAIL' && status !== 'PARTIAL') continue
    if (!TECH_LAYERS.test(layer.layer || '')) continue
    const missing = Array.isArray(layer.missing) ? layer.missing : []
    if (!missing.length && status !== 'FAIL') continue

    const severity: TechFinding['severity'] = status === 'FAIL' ? 'High' : (typeof layer.score === 'number' && layer.score < 40 ? 'High' : 'Medium')
    const issue = `${layer.layer}: ${layer.scoreReason || (missing.length ? `missing ${missing.slice(0, 4).join(', ')}` : 'incomplete')}`
    const evidence = Array.isArray(layer.evidence) && layer.evidence.length ? layer.evidence.slice(0, 3).join('; ') : (missing.length ? `Missing: ${missing.slice(0, 5).join(', ')}` : '')
    findings.push({
      layer: layer.layer,
      severity,
      issue: issue.slice(0, 240),
      evidence: evidence.slice(0, 200),
      fix: (layer.fix || '').slice(0, 200),
      action: layerAction(layer.layer, layer.fix || ''),
    })
  }

  findings.sort((a, b) => (a.severity === 'High' ? 0 : 1) - (b.severity === 'High' ? 0 : 1))
  const techScore = typeof arch.score === 'number' ? arch.score : null
  return { findings: findings.slice(0, 10), techScore }
}