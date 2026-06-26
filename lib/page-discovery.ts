// lib/page-discovery.ts
// ─── SHARED PAGE DISCOVERY: one canonical inventory for the whole website ───
// Website → discover → filter → rank → select → (Brain + Audit consume the SAME list).
// Produces an auditable inventory: discovered, filtered, ranked, selected, excluded(+reason).
// Two-pass selection: Pass 1 guarantees one representative per Audit page-type (never dropped);
// Pass 2 fills remaining budget by content rank, up to CEILING. Nothing important dropped by construction.

export const INVENTORY_CEILING = 28

// Transactional / legal pages worth no crawl budget (Brain's EXCLUDE_PAGES)
const EXCLUDE_PAGES = /(\/booking|\/reservation|\/check-rates?|\/my-reservation|\/thank-you|\/post-stay|\/careers?|\/cart|\/checkout|\/login|\/account|\/privacy|\/terms|\/cookie|\/sitemap|\/gift-?card|\/book-now|\/availability|\/article\/|\/articles?\/|\/blog\/|\/news\/|\/press\/|\/journal\/|\/competition|\/offer\/)/i

// Audit page-TYPES that must each be represented if a candidate exists (the coverage guarantee).
const TYPE_PATTERNS: { type: string; re: RegExp }[] = [
  { type: 'rooms', re: /(accommodation|rooms?|suites?|villa)/i },
  { type: 'dining', re: /(restaurant|dining|\bbar\b|brasserie|afternoon-tea|tea|cuisine)/i },
  { type: 'spa', re: /(spa|wellness)/i },
  { type: 'meetings', re: /(meeting|event|conference|banquet|mice|wedding|civil)/i },
  { type: 'location', re: /(location|neighbourhood|directions|getting-here|contact|access|map)/i },
  { type: 'offers', re: /(offers?|packages?|deal|special)/i },
  { type: 'luxury', re: /(about|story|heritage|la-reserve|palace|histoire)/i },
  { type: 'experiences', re: /(whats-on|experience|things-to-do|discover)/i },
  { type: 'family', re: /(family|kids|children|famille|enfant)/i },
  { type: 'romantic', re: /(romantic|couple|honeymoon|romantique)/i },
  { type: 'parking', re: /(parking|valet|voiturier|garage)/i },
  { type: 'accessibility', re: /(accessib|wheelchair|pmr|mobilite)/i },
  { type: 'pets', re: /(pet|dog|animaux|chien)/i },
  { type: 'breakfast', re: /(breakfast|petit-dejeuner|brunch)/i },
  { type: 'airport', re: /(airport-transfer|transfert|navette|shuttle)/i },
]

// Content ranking for Pass 2 (Brain's PAGE_PRIORITY).
const PAGE_PRIORITY: { re: RegExp; rank: number }[] = [
  { re: /(about|story|heritage)/i, rank: 1 },
  { re: /(accommodation|rooms?|suites?)/i, rank: 2 },
  { re: /(restaurant|dining|\bbar\b|brasserie|afternoon-tea|tea)/i, rank: 3 },
  { re: /(spa|wellness)/i, rank: 4 },
  { re: /(meeting|event|conference|wedding|civil)/i, rank: 4 },
  { re: /(whats-on|experience|things-to-do)/i, rank: 5 },
  { re: /(location|neighbourhood|directions|getting-here)/i, rank: 5 },
  { re: /(offers?|packages?)/i, rank: 6 },
  { re: /(faq|policies|parking|accessibility|pets)/i, rank: 6 },
  { re: /(contact)/i, rank: 7 },
  { re: /(press|news|blog|journal)/i, rank: 9 },
]
function pathOf(u: string): string { try { return new URL(u).pathname.replace(/\/$/, '') || '/' } catch { return u } }
function contentRank(u: string, homepage: string): number {
  if (u.replace(/\/$/, '') === homepage.replace(/\/$/, '')) return 0
  const path = pathOf(u)
  for (const p of PAGE_PRIORITY) if (p.re.test(path)) return p.rank
  return 8
}
function typeOf(u: string): string | null {
  const path = pathOf(u)
  for (const t of TYPE_PATTERNS) if (t.re.test(path)) return t.type
  return null
}

export interface PageInventory {
  homepage: string
  discovered: string[]
  filtered: string[]
  ranked: { url: string; type: string | null; rank: number }[]
  selected: string[]
  excluded: { url: string; reason: string }[]
  typeCoverage: Record<string, string>
  ceiling: number
}

export function buildInventory(homepage: string, candidates: string[]): PageInventory {
  const discovered = Array.from(new Set([homepage, ...candidates].map(u => u.replace(/\/$/, '') || u)))
  const excluded: { url: string; reason: string }[] = []

  const filtered: string[] = []
  for (const u of discovered) {
    if (u !== homepage.replace(/\/$/, '') && EXCLUDE_PAGES.test(u)) { excluded.push({ url: u, reason: 'transactional/legal page (no knowledge or scoring value)' }); continue }
    filtered.push(u)
  }

  const ranked = filtered
    .map(u => ({ url: u, type: typeOf(u), rank: contentRank(u, homepage) }))
    .sort((a, b) => a.rank - b.rank || a.url.length - b.url.length)

  const typeCoverage: Record<string, string> = {}
  const selectedSet = new Set<string>()
  const hp = homepage.replace(/\/$/, '')
  selectedSet.add(hp)
  for (const t of TYPE_PATTERNS) {
    const rep = ranked.find(r => r.type === t.type && !selectedSet.has(r.url))
    if (rep) { typeCoverage[t.type] = rep.url; selectedSet.add(rep.url) }
  }

  for (const r of ranked) {
    if (selectedSet.size >= INVENTORY_CEILING) break
    if (!selectedSet.has(r.url)) selectedSet.add(r.url)
  }

  const selected = ranked.filter(r => selectedSet.has(r.url)).map(r => r.url)
  if (!selected.includes(hp)) selected.unshift(hp)
  for (const r of ranked) if (!selectedSet.has(r.url)) excluded.push({ url: r.url, reason: `below content rank ${r.rank}, over crawl ceiling (${INVENTORY_CEILING})` })

  return { homepage: hp, discovered, filtered, ranked, selected, excluded, typeCoverage, ceiling: INVENTORY_CEILING }
}