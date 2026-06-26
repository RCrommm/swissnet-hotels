// lib/knowledge-graph.ts
// ─── WEBSITE KNOWLEDGE GRAPH V1 (internal reasoning engine) ───
// Deterministic. No GPT. No invented relationships. No internal links in V1.
// Computes the hotel site's semantic information architecture from stored data:
//   • hotel_facts (category + page_url + confidence)
//   • audit result (recommendation.results answerability)
// One cluster object per commercial topic, fully explainable — the consultant
// CONSUMES structure instead of re-inferring it.

export type ClusterState = 'consolidated' | 'scattered' | 'contaminated' | 'orphaned' | 'absent'

export interface KnowledgeGraphCluster {
  topic: string
  label: string
  canonical_page: string | null
  cluster_state: ClusterState
  cluster_health: number
  facts: number
  fact_pages: { path: string; count: number; transient: boolean }[]
  coverage: number
  evidence_confidence: number
  commercial_importance: 'High' | 'Medium' | 'Low'
  recommendation: 'Consolidate' | 'Create canonical page' | 'Strengthen' | 'Verify' | 'Maintain' | 'None'
  explanation: string
}

export interface KnowledgeGraph {
  clusters: KnowledgeGraphCluster[]
  page_topics: Record<string, string[]>
  summary: { consolidated: number; scattered: number; contaminated: number; orphaned: number; absent: number }
}

const TRANSIENT = /(news|careers?|press|thank-you|post-stay|reservation|booking|check-rates|contact|privacy|terms|cookie|sitemap|gift|voucher)/i

const TOPICS: { topic: string; label: string; homeRe: RegExp; catRe: RegExp; importance: 'High'|'Medium'|'Low'; qRe: RegExp }[] = [
  { topic: 'rooms',    label: 'Rooms & suites',    homeRe: /(accommodation|rooms?|suites?)/i,             catRe: /(rooms?)/i,                 importance: 'High',   qRe: /(rooms?|luxury|overall)/i },
  { topic: 'dining',   label: 'Dining',            homeRe: /(restaurant|dining|bar|brasserie|afternoon)/i, catRe: /(dining|restaurant|bar)/i, importance: 'High',   qRe: /(dining)/i },
  { topic: 'meetings', label: 'Business & meetings', homeRe: /(meeting|event|conference|private-dining|banquet|venue)/i, catRe: /(meeting|business)/i, importance: 'High', qRe: /(business)/i },
  { topic: 'weddings', label: 'Weddings & romance', homeRe: /(wedding|civil|ceremon|romantic)/i,           catRe: /(wedding|romantic)/i,       importance: 'High',   qRe: /(romantic)/i },
  { topic: 'spa',      label: 'Spa & wellness',    homeRe: /(spa|wellness)/i,                              catRe: /(spa|wellness)/i,          importance: 'Medium', qRe: /(spa)/i },
  { topic: 'family',   label: 'Family',            homeRe: /(family|kids|children)/i,                      catRe: /(family)/i,                importance: 'Medium', qRe: /(family)/i },
  { topic: 'location', label: 'Location',          homeRe: /(location|neighbourhood|directions)/i,         catRe: /(location|transport)/i,    importance: 'High',   qRe: /(location)/i },
  { topic: 'offers',   label: 'Offers',            homeRe: /(offers?|packages?)/i,                         catRe: /(offers?)/i,               importance: 'Medium', qRe: /(offers?)/i },
]

function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '').toLowerCase() || '/' } catch { return (u || '').toLowerCase() }
}
// The subtree root of a path: first segment. '/accommodation/duplex-suite' -> '/accommodation'.
// Generic URL-structure only — no hotel-specific slugs — so child pages count toward their parent.
function sectionOf(p: string): string {
  const x = (p || '/').replace(/\/$/, '').toLowerCase() || '/'
  if (x === '/') return '/'
  const seg = x.split('/').filter(Boolean)
  return '/' + (seg[0] || '')
}

export function buildKnowledgeGraph(facts: any[], auditResult: any): KnowledgeGraph {
  const qResults = (auditResult?.recommendation?.results || [])

  const page_topics: Record<string, string[]> = {}
  for (const f of (facts || [])) {
    const p = pathOf(f.page_url || ''); if (!p) continue
    const cat = (f.category || '').toLowerCase()
    ;(page_topics[p] ||= []); if (!page_topics[p].includes(cat)) page_topics[p].push(cat)
  }

  const clusters: KnowledgeGraphCluster[] = TOPICS.map(T => {
    const tFacts = (facts || []).filter(f => T.catRe.test((f.category || '').toLowerCase()))
    const facts_n = tFacts.length

    const byPage: Record<string, number> = {}
    for (const f of tFacts) { const p = pathOf(f.page_url || ''); if (p) byPage[p] = (byPage[p] || 0) + 1 }
    const fact_pages = Object.entries(byPage).map(([path, count]) => ({ path, count, transient: TRANSIENT.test(path) || path === '/' })).sort((a, b) => b.count - a.count)

    // Subtree-aware: group this topic's facts by SECTION (subtree root), pick the dominant
    // non-transient section as the canonical home so a parent + its children count together.
    const bySection: Record<string, number> = {}
    for (const f of tFacts) { const sec = sectionOf(pathOf(f.page_url || '')); if (sec === '/' || TRANSIENT.test(sec)) continue; bySection[sec] = (bySection[sec] || 0) + 1 }
    const dominantSection = Object.entries(bySection).sort((a, b) => b[1] - a[1])[0] || null
    // canonical = a slug-matched page if one exists, else the dominant fact-bearing subtree root
    const canonical_page = Object.keys(byPage).find(p => T.homeRe.test(p) && !TRANSIENT.test(p)) || (dominantSection ? dominantSection[0] : null)
    const subtreeShare = (canonical_page && facts_n) ? (bySection[sectionOf(canonical_page)] || byPage[canonical_page] || 0) / facts_n : 0
    const realPages = fact_pages.filter(p => !p.transient)

    const dimQ = qResults.filter((r: any) => T.qRe.test((r.category || '').toLowerCase()))
    const coverage = dimQ.length ? Math.round(((dimQ.filter((r: any) => r.readiness === 'YES').length + dimQ.filter((r: any) => r.readiness === 'PARTIAL').length * 0.5) / dimQ.length) * 100) : 0

    const confs = tFacts.map((f: any) => Number(f.confidence)).filter((n: number) => Number.isFinite(n))
    const evidence_confidence = confs.length ? Math.round(confs.reduce((a: number, b: number) => a + b, 0) / confs.length) : 0

    let cluster_state: ClusterState
    if (facts_n === 0) cluster_state = 'absent'
    else if (canonical_page) {
      cluster_state = subtreeShare >= 0.6 ? 'consolidated' : 'scattered'
    } else if (realPages.length > 0) cluster_state = 'scattered'
    else cluster_state = 'contaminated'
    const homeShare = subtreeShare
    const healthCanonical = canonical_page ? 40 : 0
    const healthConsolidation = canonical_page ? Math.round(homeShare * 35) : (realPages.length === 1 ? 12 : 0)
    const healthCoverage = Math.round((coverage / 100) * 25)
    const cluster_health = facts_n === 0 ? 0 : Math.max(0, Math.min(100, healthCanonical + healthConsolidation + healthCoverage))

    let recommendation: KnowledgeGraphCluster['recommendation']
    if (cluster_state === 'absent') recommendation = T.importance === 'High' ? 'Verify' : 'None'
    else if (cluster_state === 'contaminated') recommendation = 'Create canonical page'
    else if (cluster_state === 'scattered') recommendation = canonical_page ? 'Consolidate' : 'Create canonical page'
    else recommendation = coverage < 60 ? 'Strengthen' : 'Maintain'

    if (T.importance !== 'Low' && facts_n > 0 && !canonical_page && realPages.length > 0) cluster_state = 'orphaned'

    const where = fact_pages.map(p => `${p.path}${p.transient ? '*' : ''} (${p.count})`).join(', ')
    let explanation: string
    if (cluster_state === 'absent') explanation = `No confirmed ${T.label.toLowerCase()} facts anywhere — AI cannot build this concept.`
    else if (cluster_state === 'consolidated') explanation = `${facts_n} facts anchored on ${canonical_page}; AI builds a clean ${T.label.toLowerCase()} concept. Answerability ${coverage}%.`
    else if (cluster_state === 'scattered') explanation = `${facts_n} facts but ${Math.round((1 - homeShare) * 100)}% sit off the canonical page (${canonical_page || 'none'}). AI sees the facts disconnected. Facts on: ${where}.`
    else if (cluster_state === 'orphaned') explanation = `${facts_n} facts spread across ${realPages.length} page(s) with NO canonical ${T.label.toLowerCase()} page to anchor them. AI cannot consolidate the concept. Facts on: ${where}.`
    else explanation = `${facts_n} facts appear only on utility pages (${fact_pages.slice(0,2).map(p=>p.path).join(', ')}) — no trustworthy ${T.label.toLowerCase()} content. Facts on: ${where}.`

    return { topic: T.topic, label: T.label, canonical_page, cluster_state, cluster_health, facts: facts_n, fact_pages, coverage, evidence_confidence, commercial_importance: T.importance, recommendation, explanation }
  })

  const summary = { consolidated: 0, scattered: 0, contaminated: 0, orphaned: 0, absent: 0 }
  for (const c of clusters) summary[c.cluster_state]++

  return { clusters, page_topics, summary }
}