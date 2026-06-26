// lib/clean-extraction.ts
// ─── CLEAN EXTRACTION (2B) ───
// ONE shared definition of "transient" the Brain (and later the KG/VM) import,
// so the rule can never drift across files.
//
// Transient pages = utility/non-evidentiary pages that must NOT become a hotel's
// PRIMARY knowledge source (news/blog, careers, thank-you, post-stay, reservation,
// booking, contact, privacy, terms, cookie, sitemap, gift/voucher).
// NOTE: the homepage ("/") is NOT transient here — it is primary content.
//
// DOWN-WEIGHT, NEVER DELETE, and CONDITIONAL ON THE TOPIC:
//   a fact is down_weighted ONLY if (a) its page is transient AND
//   (b) its category ALSO has at least one fact on a NON-transient page.
//   If a category's ONLY evidence is on transient pages, those facts are PRESERVED
//   at full weight — so contaminated topics stay contaminated and never collapse
//   to "absent" (a worse, more confident error).

export const TRANSIENT_PAGE = /(news|careers?|press|thank-you|post-stay|reservation|booking|check-rates|contact|privacy|terms|cookie|sitemap|gift|voucher)/i

export function pathOf(u: string): string {
  try { return new URL(u).pathname.replace(/\/$/, '').toLowerCase() || '/' } catch { return (u || '').toLowerCase() }
}

export function isTransientPage(url: string): boolean {
  return TRANSIENT_PAGE.test(pathOf(url || ''))
}

// Tags each fact with `transient` and `down_weighted` (mutates + returns the array).
export function classifyFacts(facts: any[]): any[] {
  for (const f of (facts || [])) {
    f.transient = isTransientPage(f.page_url || '')
  }
  const realByCat: Record<string, boolean> = {}
  for (const f of (facts || [])) {
    const cat = (f.category || '').toLowerCase()
    if (!f.transient) realByCat[cat] = true
  }
  for (const f of (facts || [])) {
    const cat = (f.category || '').toLowerCase()
    f.down_weighted = !!(f.transient && realByCat[cat])
  }
  return facts
}

// Build the knowledge summary from CLASSIFIED facts: primary (full-weight) leads,
// down-weighted facts are kept but marked secondary so they never dominate a topic.
export function summarizeClean(facts: any[]) {
  const byCat: Record<string, { primary: any[]; secondary: any[] }> = {}
  for (const f of (facts || [])) {
    const cat = (f.category || '').toLowerCase()
    ;(byCat[cat] ||= { primary: [], secondary: [] })
    const entry = { key: f.fact_key, value: f.fact_value, quote: f.evidence_quote, page: f.page_url, confidence: f.confidence, transient: !!f.transient }
    if (f.down_weighted) byCat[cat].secondary.push(entry)
    else byCat[cat].primary.push(entry)
  }
  const entities = Array.from(new Set((facts || []).filter(f => f.category === 'entities' && !f.down_weighted).map(f => f.fact_value)))
  const primaryCount = (facts || []).filter(f => !f.down_weighted).length
  const downWeightedCount = (facts || []).filter(f => f.down_weighted).length
  return { categories: Object.keys(byCat), byCategory: byCat, entities, factCount: (facts || []).length, primaryCount, downWeightedCount }
}