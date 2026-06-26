// lib/link-intelligence.ts
// Deterministic internal-link intelligence. NO GPT, NO crawl.
// Input: page_links edges (from_url -> to_url) + the knowledge-graph clusters.
// Output: structural signals about how pages connect, to feed the KG + Decision Layer.

export interface LinkEdge { from_url: string; to_url: string }
export interface LinkCluster { topic: string; canonical_page: string | null; fact_pages?: string[]; cluster_state?: string; commercial_importance?: string }

export interface LinkSignals {
  pageCount: number
  edgeCount: number
  homepage: string
  hubs: { url: string; inDegree: number; outDegree: number }[]
  orphans: string[]
  weaklyLinked: string[]
  isolatedCommercial: { url: string; topic: string }[]
  canonicalNotLinkedFromHome: { topic: string; canonical: string }[]
  buriedTopics: { topic: string; canonical: string; inDegree: number }[]
  subtreeBacklinks: { topic: string; canonical: string; supporting: number; backlinking: number; orphanSupporting: string[] }[]
  missingClusterLinks: { fromTopic: string; toTopic: string }[]
}

const norm = (u: any) => (typeof u === 'string' ? u : '').replace(/\/$/, '').toLowerCase()

const HIGH_VALUE = new Set(['rooms', 'dining', 'spa', 'meetings', 'weddings', 'offers'])
const RELATED_PAIRS: [string, string][] = [
  ['rooms', 'offers'], ['rooms', 'dining'], ['dining', 'meetings'],
  ['weddings', 'dining'], ['weddings', 'meetings'], ['spa', 'rooms'], ['offers', 'dining'],
]

export function computeLinkSignals(homepage: string, edges: LinkEdge[], clusters: LinkCluster[]): LinkSignals {
  const hp = norm(homepage)
  const inDeg = new Map<string, number>()
  const outDeg = new Map<string, number>()
  const adj = new Map<string, Set<string>>()
  const radj = new Map<string, Set<string>>()
  const pages = new Set<string>()

  for (const e of edges) {
    const f = norm(e.from_url), t = norm(e.to_url)
    if (!f || !t || f === t) continue
    pages.add(f); pages.add(t)
    outDeg.set(f, (outDeg.get(f) || 0) + 1)
    inDeg.set(t, (inDeg.get(t) || 0) + 1)
    ;(adj.get(f) || adj.set(f, new Set()).get(f)!).add(t)
    ;(radj.get(t) || radj.set(t, new Set()).get(t)!).add(f)
  }
  pages.add(hp)

  // HUBS: pages that distribute crawl flow (high out-degree). Homepage is ALWAYS the
  // primary hub structurally — a crawl may not capture every nav backlink to it, so we
  // don't let degree-counting demote it.
  let hubs = [...pages]
    .map(u => ({ url: u, inDegree: inDeg.get(u) || 0, outDegree: outDeg.get(u) || 0 }))
    .filter(h => h.outDegree >= 5)
    .sort((a, b) => (b.outDegree + b.inDegree) - (a.outDegree + a.inDegree))
    .slice(0, 5)
  const homeHub = { url: hp, inDegree: inDeg.get(hp) || 0, outDegree: outDeg.get(hp) || 0 }
  hubs = [homeHub, ...hubs.filter(h => h.url !== hp)].slice(0, 5)

  // ORPHANS: pages nothing links to (inDegree 0), excluding the homepage itself
  const orphans = [...pages].filter(u => u !== hp && (inDeg.get(u) || 0) === 0)

  // WEAKLY LINKED: exactly one inbound link AND that link is not the homepage.
  // A page linked from the homepage nav is well-anchored; a page reachable only from a
  // single deep page is genuinely fragile (crawler may miss it, AI may not associate it).
  const homeChildren = adj.get(hp) || new Set<string>()
  const weaklyLinked = [...pages].filter(u => {
    if (u === hp) return false
    if ((inDeg.get(u) || 0) !== 1) return false
    const sources = radj.get(u)
    const onlySource = sources && sources.size === 1 ? [...sources][0] : null
    return onlySource !== hp
  })

  const pageTopic = new Map<string, string>()
  for (const c of clusters) {
    if (c.canonical_page) pageTopic.set(norm(absolutize(c.canonical_page, hp)), c.topic)
    for (const fp of (c.fact_pages || [])) pageTopic.set(norm(fp), c.topic)
  }

  const orphanWeak = new Set([...orphans, ...weaklyLinked])
  const isolatedCommercial = [...orphanWeak]
    .filter(u => pageTopic.has(u))
    .map(u => ({ url: u, topic: pageTopic.get(u)! }))

  const homeOut = adj.get(hp) || new Set<string>()

  const canonicalNotLinkedFromHome: { topic: string; canonical: string }[] = []
  const buriedTopics: { topic: string; canonical: string; inDegree: number }[] = []
  for (const c of clusters) {
    if (!c.canonical_page || c.cluster_state === 'absent') continue
    const canon = norm(absolutize(c.canonical_page, hp))
    if (!homeOut.has(canon) && canon !== hp) canonicalNotLinkedFromHome.push({ topic: c.topic, canonical: c.canonical_page })
    const din = inDeg.get(canon) || 0
    if (HIGH_VALUE.has(c.topic) && din <= 1) buriedTopics.push({ topic: c.topic, canonical: c.canonical_page, inDegree: din })
  }

  const subtreeBacklinks: LinkSignals['subtreeBacklinks'] = []
  for (const c of clusters) {
    if (!c.canonical_page || c.cluster_state === 'absent') continue
    const canon = norm(absolutize(c.canonical_page, hp))
    const supporting = (c.fact_pages || []).map(norm).filter(u => u !== canon)
    if (!supporting.length) continue
    let backlinking = 0; const orphanSupporting: string[] = []
    for (const s of supporting) {
      const sOut = adj.get(s) || new Set<string>()
      if (sOut.has(canon)) backlinking++; else orphanSupporting.push(s)
    }
    subtreeBacklinks.push({ topic: c.topic, canonical: c.canonical_page, supporting: supporting.length, backlinking, orphanSupporting })
  }

  const byTopic = new Map<string, string>()
  for (const c of clusters) if (c.canonical_page && c.cluster_state !== 'absent') byTopic.set(c.topic, norm(absolutize(c.canonical_page, hp)))
  const missingClusterLinks: { fromTopic: string; toTopic: string }[] = []
  for (const [a, b] of RELATED_PAIRS) {
    const ca = byTopic.get(a), cb = byTopic.get(b)
    if (!ca || !cb) continue
    const aToB = (adj.get(ca) || new Set()).has(cb)
    const bToA = (adj.get(cb) || new Set()).has(ca)
    if (!aToB && !bToA) missingClusterLinks.push({ fromTopic: a, toTopic: b })
  }

  return {
    pageCount: pages.size, edgeCount: edges.length, homepage: hp,
    hubs, orphans, weaklyLinked, isolatedCommercial,
    canonicalNotLinkedFromHome, buriedTopics, subtreeBacklinks, missingClusterLinks,
  }
}

function absolutize(page: any, homepage: string): string {
  if (typeof page !== 'string' || !page) return ''
  if (/^https?:\/\//.test(page)) return page
  try { const o = new URL(homepage); return o.origin + (page.startsWith('/') ? page : '/' + page) } catch { return page }
}