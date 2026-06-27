// lib/archetype.ts
// ─── ARCHETYPE + EXPERIENCE TAXONOMY DETECTOR ───
// DETERMINISTIC, no GPT. Reads the Knowledge Graph (confirmed facts only) and PROPOSES:
//   - a hotel archetype (luxury_city, mountain_resort, …) with a confidence score
//   - a taxonomy: primary / secondary / not-offered experiences
// It only ever PROPOSES (status 'proposed'). The owner confirms via admin before anything
// downstream trusts it. No experience is promoted unless the KG holds enough CONFIRMED facts
// for it (the registry's minFacts gate) — GPT never decides; pattern-matching a town name
// never promotes 'ski'. This is the same evidence discipline as not_offered + the decision board.

import { EXPERIENCES, ARCHETYPES, EXPERIENCE_BY_KEY } from '@/lib/experiences'

export interface TaxonomyProposal {
  archetype: string
  archetype_label: string
  archetype_confidence: number          // 0..1
  primary_experiences: string[]
  secondary_experiences: string[]
  not_offered_experiences: string[]     // owner-confirmed absence is authoritative; detector only SUGGESTS here
  reasoning: {
    fact_counts: Record<string, number>
    offered: string[]
    archetype_scores: Record<string, number>
    notes: string[]
  }
}

// Confirmed fact count for an experience = sum of facts across its KG topics whose
// cluster_state is NOT 'absent' (absent = the KG could not confirm the concept at all).
function confirmedFactCount(exp: any, clustersByTopic: Record<string, any>): number {
  let n = 0
  for (const t of exp.kgTopics) {
    const c = clustersByTopic[t]
    if (c && c.cluster_state !== 'absent') n += (c.facts || 0)
  }
  return n
}

export function buildArchetypeProposal(
  knowledgeGraph: any,
  opts: { notOffered?: string[] } = {}
): TaxonomyProposal {
  const clusters: any[] = knowledgeGraph?.clusters || []
  const clustersByTopic: Record<string, any> = {}
  for (const c of clusters) clustersByTopic[c.topic] = c

  const notOfferedSet = new Set((opts.notOffered || []).map(s => String(s).toLowerCase()))
  const notes: string[] = []

  // 1) Per-experience confirmed-fact tally + offered gate (registry minFacts).
  const fact_counts: Record<string, number> = {}
  const offered: string[] = []          // experiences the KG genuinely confirms
  for (const exp of EXPERIENCES) {
    const n = confirmedFactCount(exp, clustersByTopic)
    fact_counts[exp.key] = n
    // Owner-confirmed not-offered ALWAYS wins, regardless of stray facts.
    if (notOfferedSet.has(exp.key)) { notes.push(`${exp.key}: owner-marked not offered → excluded`); continue }
    // STUBS (unverified) are never auto-offered — they activate only with a real validated hotel.
    if (exp.status === 'unverified') {
      if (n >= exp.minFacts) notes.push(`${exp.key}: ${n} facts present but experience is UNVERIFIED (stub) — not promoted until a real hotel of this type validates it`)
      continue
    }
    if (n >= exp.minFacts) offered.push(exp.key)
  }

  // 2) Score each archetype by how well its typical-primary experiences are actually offered.
  //    Pure evidence: an archetype scores high only if the hotel CONFIRMS its core experiences.
  const archetype_scores: Record<string, number> = {}
  for (const A of ARCHETYPES) {
    const want = A.typicalPrimary
    if (!want.length) { archetype_scores[A.key] = 0; continue }
    let hit = 0, weight = 0
    for (const k of want) {
      const exp = EXPERIENCE_BY_KEY[k]
      weight += 1
      if (offered.includes(k)) hit += 1
      // A stub experience the archetype needs but we can't verify caps its score (we can't
      // confirm a mountain_resort without confirming ski) — keeps city the honest winner today.
      else if (exp && exp.status === 'unverified') weight += 0.0
    }
    archetype_scores[A.key] = weight ? hit / weight : 0
  }

  // 3) Pick the best — but a VERIFIED archetype is required to win outright. An unverified
  //    archetype (mountain/beach/…) can only be proposed if it clearly beats every verified
  //    one AND its core experiences are offered — which can't happen until stubs are real.
  let best = 'luxury_city', bestScore = -1
  for (const A of ARCHETYPES) {
    const s = archetype_scores[A.key]
    const isVerified = A.status === 'verified'
    if (s > bestScore && (isVerified || s >= 0.999)) { best = A.key; bestScore = s }
  }
  const bestDef = ARCHETYPES.find(a => a.key === best)!
  if (bestDef.status === 'unverified') notes.push(`Proposed archetype ${best} is UNVERIFIED — requires a real validated hotel; treat with extra scrutiny before confirming.`)

  // 4) Taxonomy from offered experiences (excluding hygiene 'trust' from primary/secondary —
  //    it's a universal hygiene dimension, not a positioning experience).
  const positioning = offered.filter(k => k !== 'trust')
  const typical = new Set(bestDef.typicalPrimary)
  const primary = positioning.filter(k => typical.has(k))
  const secondary = positioning.filter(k => !typical.has(k))

  // not-offered SUGGESTION = verified experiences with zero/insufficient confirmed facts,
  // plus anything the owner already marked. Owner confirmation remains authoritative.
  const notOfferedSuggested = EXPERIENCES
    .filter(e => e.status === 'verified' && e.key !== 'trust')
    .filter(e => notOfferedSet.has(e.key) || (fact_counts[e.key] || 0) < e.minFacts)
    .map(e => e.key)

  return {
    archetype: best,
    archetype_label: bestDef.label,
    archetype_confidence: Math.max(0, Math.min(1, bestScore)),
    primary_experiences: primary,
    secondary_experiences: secondary,
    not_offered_experiences: Array.from(new Set(notOfferedSuggested)),
    reasoning: { fact_counts, offered, archetype_scores, notes },
  }
}
