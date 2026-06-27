// lib/recommendation-roadmap.ts
// buildRoadmap(rec) — DETERMINISTIC. Buckets evidence that already exists on the
// canonical Recommendation into three implementation stages. No GPT, no invention.
// Every line traces to a real field: audit.failed_queries / audit.missing_information
// (Quick Wins), technical.causes (Next Improvements), case.recommendation (Strategic).

import type { Recommendation } from './recommendation-model'

export interface RoadmapStep { text: string; source: string }
export interface Roadmap {
  quickWins: RoadmapStep[]      // small content adds answering real gaps
  nextImprovements: RoadmapStep[] // structural fixes already identified
  strategicProject: RoadmapStep | null // the Decision Layer's primary move
}

// Turn a failed guest question into a small, concrete content action.
function fromFailedQuestion(q: string): string {
  const clean = (q || '').trim().replace(/\s+/g, ' ')
  return `Add content answering: “${clean}”`
}

// Turn a missing-information field into a content action.
function fromMissing(field: string): string {
  const clean = (field || '').trim()
  return `Add the missing detail: ${clean}`
}

export function buildRoadmap(rec: Recommendation): Roadmap {
  const failed = rec?.audit?.failed_queries || []
  const missing = rec?.audit?.missing_information || []
  const causes = rec?.technical?.causes || []
  const strategic = rec?.case?.recommendation || null

  // QUICK WINS — additive content that closes a real, named gap. Cap at 4 so it
  // stays a short list, not a dump. Failed questions first (most concrete), then
  // any missing fields not already covered.
  const quickWins: RoadmapStep[] = []
  for (const q of failed.slice(0, 4)) quickWins.push({ text: fromFailedQuestion(q), source: 'Guest questions AI can’t answer' })
  if (quickWins.length < 4) {
    for (const mfield of missing.slice(0, 4 - quickWins.length)) {
      quickWins.push({ text: fromMissing(mfield), source: 'Missing information' })
    }
  }

  // NEXT IMPROVEMENTS — structural fixes already surfaced by Technical/Website
  // Intelligence. Each carries its own fix text verbatim. Cap at 3.
  const nextImprovements: RoadmapStep[] = causes.slice(0, 3).map((c: any) => ({
    text: c.fix,
    source: c.layer ? `Technical · ${c.layer}` : 'Technical',
  }))

  // STRATEGIC PROJECT — the single primary recommendation the Decision Layer chose.
  const strategicProject: RoadmapStep | null = strategic
    ? { text: strategic, source: 'Strategic priority' }
    : null

  return { quickWins, nextImprovements, strategicProject }
}
