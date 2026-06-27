// lib/demand.ts
// ─── THE DEMAND MODEL (v1) ───
// Structured input to the Question Generator. DETERMINISTIC, no GPT, no external data.
// Answers: "what do guests ask AI when choosing THIS hotel?" — built ONLY from the confirmed
// hotel profile (archetype + experience taxonomy) + location. GPT no longer DECIDES demand;
// it only PHRASES this structured model into natural guest questions (see hotel-audit).
//
// v2 (future, gated on data): enrich `intents` with GSC queries + AI referral + citation data.
// Until those are connected this is archetype/taxonomy-derived — real value (multi-archetype),
// but it is a STRUCTURED PROMPT, not a measurement. Do not oversell it as measured demand.

import { EXPERIENCE_BY_KEY, ARCHETYPE_BY_KEY } from '@/lib/experiences'

export interface DemandIntent {
  experience: string          // experience key (dining, ski, …) or 'universal'
  label: string
  tier: 'primary' | 'secondary' | 'universal'
  seeds: string[]             // question seeds (registry seeds or universal dealbreakers)
}

export interface DemandModel {
  archetype: string | null
  archetype_label: string | null
  source: 'confirmed_profile' | 'fallback_generic'
  primary: string[]           // experience keys
  secondary: string[]
  intents: DemandIntent[]     // everything the generator should ask about, tiered
  note: string
}

// Universal dealbreaker intents — the filters AI uses to shortlist ANY hotel, regardless of
// archetype. Always included so adaptive generation never drops basic coverage (location,
// practical, overall). These are NOT experiences a hotel "offers" — they're guest filters.
const UNIVERSAL_INTENTS: DemandIntent[] = [
  { experience: 'universal', label: 'Location & getting there', tier: 'universal', seeds: ['hotel near {landmark}', 'how to get to {hotel}', 'best area to stay in {area}'] },
  { experience: 'universal', label: 'Practical (parking, accessibility, pets)', tier: 'universal', seeds: ['does {hotel} have parking', 'is {hotel} accessible', 'are pets allowed at {hotel}'] },
  { experience: 'universal', label: 'Overall fit & value', tier: 'universal', seeds: ['is {hotel} worth it', 'what is {hotel} best known for', 'who is {hotel} best for'] },
]

export function buildDemandModel(profile: any | null, ctx: { location?: string } = {}): DemandModel {
  // No confirmed profile → generic fallback (current behaviour preserved for un-profiled hotels).
  if (!profile || profile.taxonomy_status !== 'confirmed') {
    return {
      archetype: null, archetype_label: null, source: 'fallback_generic',
      primary: [], secondary: [], intents: [...UNIVERSAL_INTENTS],
      note: 'No confirmed hotel profile — generic demand (universal intents only). Run archetype-detect + confirm to make this hotel-specific.',
    }
  }

  const archDef = ARCHETYPE_BY_KEY[profile.archetype] || null
  const primary: string[] = Array.isArray(profile.primary_experiences) ? profile.primary_experiences : []
  const secondary: string[] = Array.isArray(profile.secondary_experiences) ? profile.secondary_experiences : []

  const toIntent = (key: string, tier: 'primary' | 'secondary'): DemandIntent | null => {
    const exp = EXPERIENCE_BY_KEY[key]
    if (!exp) return null
    // STUB experiences carry no seeds yet — they contribute the experience focus but no
    // fabricated questions until promoted to a real definition with a validated hotel.
    return { experience: key, label: exp.label, tier, seeds: exp.questionSeeds || [] }
  }

  const intents: DemandIntent[] = []
  for (const k of primary) { const i = toIntent(k, 'primary'); if (i) intents.push(i) }
  for (const k of secondary) { const i = toIntent(k, 'secondary'); if (i) intents.push(i) }
  intents.push(...UNIVERSAL_INTENTS)

  return {
    archetype: profile.archetype,
    archetype_label: archDef?.label || profile.archetype,
    source: 'confirmed_profile',
    primary, secondary, intents,
    note: 'v1 demand model: derived from confirmed archetype + taxonomy + location. Structured input the generator phrases — not yet measured from GSC/GA4/citations.',
  }
}
