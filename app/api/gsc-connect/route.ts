import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

export const maxDuration = 30

// ─── GSC CONNECT ───
// Saves a hotel's Search Console property (siteUrl) and runs ONE real test-pull
// against the Search Console API to confirm our shared service account can read it.
// On success → gsc_status = 'connected'. On access failure → 'error'.
// Reuses the SAME service-account JSON as GA4 (GA4_SERVICE_ACCOUNT_KEY); each hotel
// grants that email access on their Search Console property.
//
// Unlike GA4 (a numeric ID we can strip), a GSC property is an exact siteUrl string:
//   • URL-prefix:  https://www.hotel.com/   (trailing slash significant)
//   • Domain:      sc-domain:hotel.com
// We cannot normalise it — the test-pull validates whatever the hotel pastes.

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

export async function POST(req: Request) {
  try {
    const { hotelId, siteUrl, password } = await req.json()
    if (password !== (process.env.ADMIN_REPORT_PASSWORD || 'RCrom2004Romeo')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 })

    const site = String(siteUrl || '').trim()
    if (!site) return NextResponse.json({ error: 'A Search Console property is required (e.g. https://www.yourhotel.com/ or sc-domain:yourhotel.com).' }, { status: 400 })

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
    if (!sbUrl || !sbKey) return NextResponse.json({ error: 'Server not configured (Supabase).' }, { status: 500 })
    if (!rawKey) return NextResponse.json({ error: 'Search Console is not configured on the server yet.' }, { status: 500 })

    let credentials: any
    try { credentials = JSON.parse(rawKey) } catch { return NextResponse.json({ error: 'Server credential is malformed.' }, { status: 500 }) }

    const sb = createClient(sbUrl, sbKey)

    // ── THE TEST PULL: one tiny search-analytics query. Denied access throws. ──
    let sampleImpressions = 0
    try {
      const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
      const client = await auth.getClient()
      const webmasters = google.webmasters({ version: 'v3', auth: client as any })
      const res = await webmasters.searchanalytics.query({
        siteUrl: site,
        requestBody: { startDate: '2020-01-01', endDate: new Date().toISOString().slice(0, 10), dimensions: [], rowLimit: 1 },
      })
      const val = res?.data?.rows?.[0]?.impressions
      sampleImpressions = typeof val === 'number' ? Math.round(val) : 0
    } catch (e: any) {
      await sb.from('hotels').update({ gsc_property: site, gsc_status: 'error' }).eq('id', hotelId)
      const reason = e?.message || ''
      const friendly = /permission|denied|403|access|not have/i.test(reason)
        ? 'We could not read this property. Confirm the service-account email was added as a user in Search Console → Settings → Users and permissions, and that the property string is exactly as shown there.'
        : /not found|404|invalid|does not exist/i.test(reason)
        ? 'That property was not found. Copy it exactly from Search Console (URL-prefix needs the trailing slash; a Domain property looks like sc-domain:yourhotel.com).'
        : 'We could not connect to this property. Please try again.'
      return NextResponse.json({ status: 'error', error: friendly }, { status: 200 })
    }

    await sb.from('hotels').update({
      gsc_property: site,
      gsc_status: 'connected',
      gsc_connected_at: new Date().toISOString(),
    }).eq('id', hotelId)

    return NextResponse.json({ status: 'connected', sampleImpressions })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GSC connect failed' }, { status: 500 })
  }
}
