import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

export const maxDuration = 30

// ─── GA4 CONNECT ───
// Saves a hotel's GA4 Property ID and runs ONE real test-pull against the
// Google Analytics Data API to confirm our shared service account can read it.
// On success → ga4_status = 'connected'. On access failure → 'error'.
// The service-account JSON lives in Vercel env GA4_SERVICE_ACCOUNT_KEY (one
// credential, shared by all hotels; each hotel grants it Viewer on their property).

export async function POST(req: Request) {
  try {
    const { hotelId, propertyId, pathPrefix, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })

    const cleanId = String(propertyId || '').replace(/[^0-9]/g, '')
    if (!cleanId) return NextResponse.json({ error: 'A numeric GA4 Property ID is required (e.g. 123456789).' }, { status: 400 })

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured (Supabase).' }, { status: 500 })
    if (!rawKey) return NextResponse.json({ error: 'GA4 is not configured on the server yet.' }, { status: 500 })

    // Parse the service-account JSON from the env var.
    let credentials: any
    try { credentials = JSON.parse(rawKey) } catch { return NextResponse.json({ error: 'GA4 server credential is malformed.' }, { status: 500 }) }

    const sb = createClient(sbUrl, sbKey)

    // ── THE TEST PULL: one tiny report. If access is denied, this throws. ──
    let sampleSessions = 0
    try {
      const client = new BetaAnalyticsDataClient({ credentials })
      const [report] = await client.runReport({
        property: `properties/${cleanId}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }],
      })
      const val = report?.rows?.[0]?.metricValues?.[0]?.value
      sampleSessions = val ? parseInt(val, 10) || 0 : 0
    } catch (e: any) {
      // Mark the row as errored so the dashboard shows "Connection failed".
      await sb.from('hotels').update({ ga4_property_id: cleanId, ga4_status: 'error' }).eq('id', hotelId)
      const reason = e?.message || ''
      const friendly = /permission|denied|403|access/i.test(reason)
        ? 'We could not read this property. Confirm the email was added as a Viewer, and that the Property ID is correct.'
        : /not found|404|invalid/i.test(reason)
        ? 'That Property ID was not found. Check it in Admin → Property Settings (it is a number, not the “G-” measurement ID).'
        : 'We could not connect to this property. Please try again.'
      return NextResponse.json({ status: 'error', error: friendly }, { status: 200 })
    }

    // Success → persist the connection.
    await sb.from('hotels').update({
      ga4_property_id: cleanId,
      ga4_path_prefix: (typeof pathPrefix === 'string' && pathPrefix.trim()) ? pathPrefix.trim() : null,
      ga4_status: 'connected',
      ga4_connected_at: new Date().toISOString(),
    }).eq('id', hotelId)

    return NextResponse.json({ status: 'connected', sampleSessions })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GA4 connect failed' }, { status: 500 })
  }
}