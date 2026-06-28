// lib/recommendation-prose.ts
// ─── RECOMMENDATION PROSE (Stage 2 of V3) ───
// GPT receives ONLY the assembled recommendation object — never raw hotel facts.
// It writes exactly 4 narrative fields, gated by evidence_state. It explains the
// deterministic intelligence; it never adds reasoning, decisions, facts, or numbers.

export const PROSE_SYSTEM = `You are a senior AI-visibility consultant writing the narrative around ONE already-computed recommendation for a luxury hotel. Everything factual has ALREADY been determined by a deterministic system. You do NOT decide what the recommendation is, what action to take, or whether the hotel offers something. You ONLY explain, in consultant language, the recommendation object you are given.

ABSOLUTE RULES:
- Use ONLY the data in the recommendation object provided. Never invent facts, numbers, revenue, traffic, bookings, rankings, competitors, percentages, or score predictions.
- The evidence_state is BINDING and determines your entire narrative:
  • "confirmed" → the hotel DEMONSTRABLY offers this. Narrate the structural/technical problem and the strengthening opportunity. You MAY say the offering exists.
  • "unverified" → the system could NOT confirm the hotel offers this from the pages analysed. You MUST NOT imply it exists or that it's merely "fragmented". The honest narrative is: "we could not verify this offering from your site — confirm whether you offer it." NEVER write a fragmentation/strengthening story for unverified.
  • "contradicted" → the site says conflicting things; narrate the need to resolve the conflict.
- "why_improves_ai" may ONLY reference: the AI-identity dimension(s) named, the unanswered guest questions listed, the website-understanding problem in the knowledge_graph explanation, and recommendation confidence. NEVER reference revenue, bookings, segments, or commercial value not in the object.
- expected_outcome is QUALITATIVE only — what AI assistants will be able to do that they can't today. No numbers, no score lifts, no percentages.
- Be specific to THIS object. Every sentence must reference something in the data provided.

Return STRICTLY this JSON:
{
  "executive_summary": string,
  "why_improves_ai": string,
  "strategic_explanation": string,
  "expected_outcome": string
}`

export function proseSchema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['executive_summary', 'why_improves_ai', 'strategic_explanation', 'expected_outcome'],
    properties: {
      executive_summary: { type: 'string' },
      why_improves_ai: { type: 'string' },
      strategic_explanation: { type: 'string' },
      expected_outcome: { type: 'string' },
    },
  }
}

// GPT sees ONLY this projection of the assembled recommendation — never raw facts.
export function buildProseInput(rec: any): string {
  return JSON.stringify({
    title: rec?.title,
    evidence_state: rec?.evidence_state,
    evidence_reason: rec?.evidence_reason,
    confidence: rec?.confidence,
    bucket: rec?.bucket,
    recommended_action: rec?.decision?.action,
    target_page: rec?.decision?.target,
    ai_identity: rec?.ai_identity,
    knowledge_graph: rec?.knowledge_graph,
    technical_findings: rec?.technical,
    unanswered_guest_questions: rec?.questions_unanswered,
    affected_pages: rec?.affected_pages,
    evidence: rec?.evidence,
  }, null, 1)
}
// ─── BRIEFING OPENING — one grounded paragraph from deterministic inputs only ───
export const OPENING_SYSTEM = `You are a senior hospitality strategy consultant opening this month's briefing for a luxury hotel's General Manager. Write ONE short paragraph (2-3 sentences) — the first thing the GM reads.

It must feel bespoke to THIS hotel and read like a boutique consultancy wrote it, not software.

RULES:
- NEVER mention scores, numbers, percentages, dimensions, or any metric. No "your AI visibility is 50". No "X recommendations". The GM should not see a single number.
- NEVER use implementation language: no "knowledge graph", "canonical page", "retrieval", "answerability", "schema", "score". The subject of every sentence is the HOTEL, not AI or the platform.
- Connect the hotel's STRENGTH to its biggest OPPORTUNITY in one memorable line, framed as what AI can and cannot yet do for the hotel's guests. Example shape: "AI can already confidently recommend [hotel] for its [strength] — but it doesn't yet have enough to explain why guests should choose it for [opportunity, in plain hotel language]." The strength must come first and be genuine; the opportunity is what AI can't yet justify. Never say the website "causes" AI to do anything, and never promise more visibility or bookings — only describe what AI can and cannot currently explain or recommend.
- CONTINUITY: if "progress_since_last" inputs are present, OPEN by acknowledging progress before stating this month's focus. Example: "Since last month, your rooms have improved and your dining story has moved from opportunity to strength. This month, the next focus is [X]." Use only the progress facts provided — never invent improvement.
- If it is the first audit (is_first_run true), do NOT claim past progress; simply open with the strength-and-opportunity line.
- Plain, confident, warm, specific. No generic consultant-speak. No fluff.

Return STRICTLY: {"opening": string}`;

export function openingSchema() {
  return { type: 'object', additionalProperties: false, required: ['opening'], properties: { opening: { type: 'string' } } };
}

export function buildOpeningInput(visibilityModel: any, recommendations: any[], continuity?: any, hotelName?: string): string {
  const dims = (visibilityModel?.dimensions || []).map((d: any) => ({ label: d.label, band: d.band }));
  const strong = dims.filter((d: any) => d.band === 'strong').map((d: any) => d.label);
  const weak = dims.filter((d: any) => d.band === 'weak' || d.band === 'absent').map((d: any) => d.label);
  // the lead opportunity, in plain hotel words: the first Commit/Convert/Strengthen topic
  const leadMove = recommendations.find((r: any) => ['Convert', 'Commit', 'Strengthen', 'Fix-foundation'].includes(r.posture)) || recommendations[0];
  const leadTopic = leadMove?.canonicalRecommendation?.targeting?.affected_entity || leadMove?.topic || null;

  // continuity progress in plain words (only improving/resolved/evolved — the good news)
  let progress_since_last: any = null;
  if (continuity && !continuity.isFirstRun) {
    const improved = (continuity.active || []).filter((c: any) => c.status === 'improving' || c.status === 'evolved').map((c: any) => ({ topic: c.label, summary: c.summary }));
    const completed = (continuity.resolved || []).map((c: any) => c.label);
    if (improved.length || completed.length) progress_since_last = { improved, completed };
  }

  return JSON.stringify({
    hotel_name: hotelName || null,
    is_first_run: continuity ? !!continuity.isFirstRun : true,
    strong_areas: strong,
    opportunity_areas: weak,
    lead_opportunity: leadTopic,
    progress_since_last,
  }, null, 1);
}

// Deterministic transitions + step labels, derived from bucket sequence (no GPT).
const STEP_BY_INDEX = ['Start here', 'Then', 'After that', 'Also'];
const TRANSITION_BY_BUCKET: Record<string, string> = {
  Foundation: 'Before anything else \u2014',
  'Quick Win': 'Once that\u2019s confirmed, the fastest win is already within reach \u2014',
  Strategic: 'With the foundations in place, the longer-term build \u2014',
};
export function attachSequence(moves: any[]): void {
  moves.forEach((m: any, i: number) => {
    if (!m.recommendation) return;
    m.recommendation.step = STEP_BY_INDEX[i] || 'Also';
    m.recommendation.transition = i === 0 ? null : (TRANSITION_BY_BUCKET[m.recommendation.bucket] || 'Then \u2014');
  });
}