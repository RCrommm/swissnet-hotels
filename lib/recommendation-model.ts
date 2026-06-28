// lib/recommendation-model.ts
// Canonical Recommendation contract. One object, layers enrich it.
// Deterministic layers compute facts; prose only describes existing fields.

export type Posture = 'Commit' | 'Convert' | 'Fix-foundation' | 'Confirm' | 'Decline' | 'Defer'
export type ActionType = 'create_page' | 'strengthen_page' | 'add_faq' | 'add_schema' | 'add_section' | 'verify' | 'investigate' | 'do_nothing'
export type EvidenceState = 'confirmed' | 'unverified'
export type ConfidenceTier = 'high' | 'medium' | 'low' | 'needs_verification'

export interface SwissCase {
  diagnosis: string
  business_consequence: string
  recommendation: string
  expected_result: string
  proof: { failed_questions: string[]; overlapping_pages: string[]; quotes: { quote: string; page: string }[] }
}

export interface Recommendation {
  identity: { id: string; posture: Posture; action: ActionType; title: string }
  targeting: { topic: string; affected_entity: string; canonical_page: string | null; affected_pages: string[] }
  priority: { score: number; tier: string; inputs: any; rank: number; explanation: string; foundational?: boolean }
  confidence: { tier: ConfidenceTier; score: number; evidence_state: EvidenceState; inputs: any; reason: string }
  evidence: { facts: { value: string; quote: string; page: string; confidence: number }[] }
  audit: { failed_queries: string[]; partial_queries: string[]; missing_information: string[]; coverage_pct: number | null }
  recommendability?: {
    answerable: string[]
    partially_answerable: { intent: string; evidence_needed: string[] }[]
    not_answerable: { intent: string; evidence_needed: string[] }[]
    has_catalogue: boolean
  }
  knowledge_graph: { cluster_state: string; cluster_health: number | null; fact_pages: string[]; explanation: string }
  technical: { causes: { layer: string; severity: string; fix: string }[] }
  prose: { ai_reasoning: string; business_reasoning: string; expected_outcome: string; why_now: string; success_measure: string }
  case: SwissCase | null
  future: { external: ExternalSignal | null; behavioral: BehavioralSignal | null; search: SearchSignal | null }
  history: { first_seen: string | null; last_seen: string | null; status: 'new' | 'still_open' | 'resolved' | null; score_change: number | null } | null
}

export interface ExternalSignal {
  contradictions: { claim_key: string; official_value: string; external_values: { value: string; source: string }[]; ai_risk: string }[]
  authority_gaps: { entity: string; external_richness: string; action: string }[]
  third_party_owned: { question: string; owned_by: string }[]
}
export interface BehavioralSignal {
  // Current period — what guests do on this Case's pages now.
  landing_sessions: number | null     // sessions landing on affected_pages
  exit_rate: number | null            // % who leave from these pages
  conversion_rate: number | null      // % of those sessions that convert (booking event)
  // #1 — AI assistants are already sending real visitors here.
  ai_referred_sessions: number | null // sessions whose source is an AI assistant (chatgpt.com, perplexity.ai, gemini.google.com, etc.)
  // #3 — before/after a fix shipped (needs two date ranges + a known fix date).
  previous_period: {
    landing_sessions: number | null
    conversion_rate: number | null
  } | null
  // Provenance so the Case can cite which GA4 paths it measured (no invention).
  measured_pages: string[]            // the GA4 page paths that matched affected_pages
  period_days: number | null          // window length used for the current pull
}
export interface SearchSignalQuery { query: string; impressions: number; clicks: number; ctr: number; position: number }
export interface SearchSignal {
  impressions: number | null
  clicks: number | null
  ctr: number | null
  avg_position: number | null
  top_queries: SearchSignalQuery[]
  measured_pages: string[]
  previous_period: { impressions: number | null; ctr: number | null } | null
  impressions_change_pct: number | null
  period_days: number | null
}