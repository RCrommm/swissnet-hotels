// lib/swissnet-influence.ts
// buildSwissnetInfluence(sourceRows, clickCount, opts) — the SwissNet-attributed
// slice of a hotel's performance. PURE function. No network.
//
// TWO halves, deliberately independent:
//   • TRAFFIC — clicks SwissNet sent the hotel (from swissnet_clicks). Always real:
//     it happens on infrastructure we own, no booking engine involved.
//   • REVENUE (Path A) — what GA4 attributes to sessionSource = "swissnet". Real ONLY
//     when the hotel's booking engine preserves the source into the GA4 purchase event.
//     When it doesn't, revenue stays null (capability = "sessions_only") — never faked.
//
// WORDING DISCIPLINE: this is "influenced" / "attributed", NEVER "generated". SwissNet
// sent the click; it does not claim to have caused the booking.

import type { Ga4SourceRow } from '@/lib/ga4-fetch'

// The GA4 source value we tag SwissNet outbound URLs with (utm_source=swissnet).
const SWISSNET_SOURCE = 'swissnet'

export type AttributionCapability = 'full' | 'sessions_only' | 'none' | 'unknown'

export interface SwissnetInfluenceSignal {
  // TRAFFIC — always real when we have clicks
  clicks: number                       // SwissNet → hotel clicks this period (owned data)
  ga4_swissnet_sessions: number | null // sessions GA4 saw from source=swissnet (null if GA4 absent)

  // REVENUE (Path A) — real only when the source survives into GA4 purchase events
  swissnet_revenue: number | null      // revenue GA4 attributes to source=swissnet
  swissnet_conversions: number | null  // key events on swissnet-sourced sessions
  swissnet_avg_booking_value: number | null

  capability: AttributionCapability    // drives which face the panel shows
  period_days: number | null
  measured: boolean                    // true once we have either clicks or GA4 source data
}

export interface BuildSwissnetOpts {
  periodDays?: number | null
  ga4Connected?: boolean   // is GA4 connected for this hotel at all?
}

export function buildSwissnetInfluence(
  sourceRows: Ga4SourceRow[] | null,
  clickCount: number,
  opts: BuildSwissnetOpts = {},
): SwissnetInfluenceSignal {
  const clicks = Math.max(0, clickCount || 0)
  const ga4Connected = opts.ga4Connected ?? (sourceRows !== null)

  // Pull the swissnet-sourced row(s) out of the GA4 source breakdown.
  let ga4_swissnet_sessions: number | null = null
  let swissnet_revenue: number | null = null
  let swissnet_conversions: number | null = null

  if (ga4Connected && sourceRows) {
    const swissRows = sourceRows.filter(r => r.source.includes(SWISSNET_SOURCE))
    const sessions = swissRows.reduce((a, r) => a + (r.sessions || 0), 0)
    const conversions = swissRows.reduce((a, r) => a + (r.conversions || 0), 0)
    const revenue = swissRows.reduce((a, r) => a + (r.revenue || 0), 0)

    ga4_swissnet_sessions = sessions
    // Revenue is only "real" if GA4 actually attributes some to the swissnet source.
    // Zero revenue with sessions present = engine didn't preserve attribution → null.
    swissnet_revenue = revenue > 0 ? Math.round(revenue) : null
    swissnet_conversions = revenue > 0 ? conversions : null
  }

  const swissnet_avg_booking_value =
    (swissnet_revenue !== null && swissnet_conversions && swissnet_conversions > 0)
      ? Math.round(swissnet_revenue / swissnet_conversions)
      : null

  // Capability — what this hotel's setup can honestly support:
  //   full          → GA4 attributes revenue to the swissnet source (Path A works here)
  //   sessions_only → we have clicks (and/or GA4 sessions) but no swissnet revenue came back
  //   none          → no clicks and no GA4 source data at all
  //   unknown       → GA4 not connected yet, so we can't tell
  let capability: AttributionCapability
  if (swissnet_revenue !== null && swissnet_revenue > 0) {
    capability = 'full'
  } else if (clicks > 0 || (ga4_swissnet_sessions ?? 0) > 0) {
    capability = ga4Connected ? 'sessions_only' : 'unknown'
  } else if (ga4Connected) {
    capability = 'none'
  } else {
    capability = 'unknown'
  }

  const measured = clicks > 0 || (ga4_swissnet_sessions ?? 0) > 0

  return {
    clicks,
    ga4_swissnet_sessions,
    swissnet_revenue,
    swissnet_conversions,
    swissnet_avg_booking_value,
    capability,
    period_days: opts.periodDays ?? null,
    measured,
  }
}