export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import KeywordsTab from '@/components/KeywordsTab'
import HotelsTab from '@/components/HotelsTab'
import SchemaTab from '@/components/SchemaTab'
import AIVisibilityToggle from '@/components/AIVisibilityToggle'
import AIVisibilityQueries from '@/components/AIVisibilityQueries'
import GoogleAITab from '@/components/GoogleAITab'

async function isAuthenticated(password?: string) {
  const cookieStore = await cookies()
  return cookieStore.get('admin_auth')?.value === process.env.ADMIN_PASSWORD ||
    password === process.env.ADMIN_PASSWORD
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ password?: string; tab?: string }>
}) {
  const params = await searchParams
  const auth = await isAuthenticated(params.password)

  if (!auth) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-stone-50">
        <div className="bg-white border border-stone-200 p-10 max-w-sm w-full shadow-sm">
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-6 text-center">Admin Access</h1>
          <form action="/admin" method="get">
            <input name="password" type="password" placeholder="Enter admin password" className="w-full border border-stone-300 px-4 py-3 text-sm mb-4 focus:outline-none focus:border-amber-700" />
            <button type="submit" className="btn-primary w-full py-3">Enter</button>
          </form>
          {params.password && <p className="text-red-600 text-sm text-center mt-3">Incorrect password</p>}
        </div>
      </div>
    )
  }

  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .order('is_partner', { ascending: false })
    .order('name', { ascending: true })

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: keywords } = await supabase
    .from('hotel_keywords')
    .select('*, hotels(name)')
    .order('priority', { ascending: true })

  const { data: clicks } = await supabase
    .from('referral_clicks')
    .select('*')
    .order('clicked_at', { ascending: false })
    .limit(2000)

  const { data: views } = await supabase
    .from('hotel_views')
    .select('*')
    .order('viewed_at', { ascending: false })
    .limit(200)

  const { data: cronSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'ai_visibility_cron_enabled')
    .single()

  const { data: visibilityStats } = await supabase
    .from('ai_visibility_scores')
    .select('hotel_id, hotel_name, appeared, checked_at, query')
    .order('checked_at', { ascending: false })
    .limit(500)

  const { data: cronCostsAll } = await supabase
  .from('cron_costs')
  .select('estimated_cost_usd, run_at, triggered_by')
  .order('run_at', { ascending: false })

const { data: cronCosts } = await supabase
  .from('cron_costs')
  .select('*')
  .order('run_at', { ascending: false })
  .limit(30)

  const tab = params.tab || 'hotels'
  const pw = params.password || ''

  const hotelsList = hotels || []
  const partnerHotels = hotelsList.filter(h => h.is_partner)
  const partnerNames = new Set(partnerHotels.map(h => h.name))
  const leadsList = leads || []
  const keywordsList = keywords || []
  const clicksList = clicks || []
  const viewsList = views || []
  const cronEnabled = cronSetting?.value === 'true'

  // Visibility scores — partner hotels only
  const visibilityByHotel: Record<string, { appeared: number; total: number }> = {}
  for (const row of visibilityStats || []) {
    if (!partnerNames.has(row.hotel_name)) continue
    if (!visibilityByHotel[row.hotel_name]) visibilityByHotel[row.hotel_name] = { appeared: 0, total: 0 }
    visibilityByHotel[row.hotel_name].total++
    if (row.appeared) visibilityByHotel[row.hotel_name].appeared++
  }

  // Analytics — views per hotel
  const viewsByHotel: Record<string, number> = {}
  for (const v of viewsList) {
    viewsByHotel[v.hotel_name] = (viewsByHotel[v.hotel_name] || 0) + 1
  }

  // Analytics — clicks per hotel
  const clicksByHotel: Record<string, number> = {}
  for (const c of clicksList) {
    if (c.hotel_name) clicksByHotel[c.hotel_name] = (clicksByHotel[c.hotel_name] || 0) + 1
  }

  // Analytics — leads per hotel
  const leadsByHotel: Record<string, number> = {}
  for (const l of leadsList) {
    if (l.hotel_name) leadsByHotel[l.hotel_name] = (leadsByHotel[l.hotel_name] || 0) + 1
  }

  // Views by source
  const viewsBySource: Record<string, number> = {}
  for (const v of viewsList) {
    const src = v.utm_source || 'direct'
    viewsBySource[src] = (viewsBySource[src] || 0) + 1
  }

  // Clicks by individual page (normalised source_page)
  const cleanPage = (raw: string) => {
    if (!raw || !raw.trim()) return null
    let p = raw.trim().replace(/^https?:\/\/(www\.)?swissnethotels\.com/i, '').split('?')[0]
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
    return p || '/'
  }
  const clicksByPage: Record<string, number> = {}
  let unknownPageClicks = 0
  for (const c of clicksList) {
    const page = cleanPage(c.source_page)
    if (!page) { unknownPageClicks++; continue }
    clicksByPage[page] = (clicksByPage[page] || 0) + 1
  }
  const clicksByPageSorted = Object.entries(clicksByPage).sort((a, b) => b[1] - a[1])
  const totalPageClicks = clicksByPageSorted.reduce((s, [, n]) => s + n, 0)

  // Clicks grouped by hotel (all of a hotel's pages combined, via slug)
  const slugToName: Record<string, string> = {}
  for (const h of hotelsList) { if (h.slug) slugToName[h.slug] = h.name }
  const viewsByHotelSorted = Object.entries(viewsByHotel)
    .map(([name, n]) => ({ name, n }))
    .sort((a, b) => b.n - a.n)
  const totalHotelViews = viewsByHotelSorted.reduce((s, x) => s + x.n, 0)

  return (
    <div className="pt-20 min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-stone-800">Admin Dashboard</h1>
          <div className="flex gap-3">
            <span className="bg-green-100 text-green-800 text-xs px-3 py-1.5">{hotelsList.length} Hotels</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5">{partnerHotels.length} Partners</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5">{leadsList.length} Leads</span>
            <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1.5">{viewsList.length} Views</span>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-stone-200 flex-wrap">
{['hotels', 'schema', 'ai visibility', 'analytics', 'keywords', 'clicks'].map(t => ( <a key={t} href={'/admin?password=' + pw + '&tab=' + t}
              className={'px-5 py-3 text-sm uppercase tracking-wide capitalize transition-colors ' +
                (tab === t ? 'border-b-2 border-amber-700 text-amber-700 font-semibold' : 'text-stone-500 hover:text-stone-700')}>
              {t}
            </a>
          ))}
        </div>

        {tab === 'hotels' && <HotelsTab hotels={hotelsList} password={pw} />}

        {tab === 'schema' && <SchemaTab hotels={hotelsList} />}

        {tab === 'ai visibility' && (
  <div>
    <AIVisibilityToggle enabled={cronEnabled} />
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <AIVisibilityQueries hotels={partnerHotels} />
    </div>
    
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                AI Visibility Scores — Partner Hotels Only
              </h2>
              {Object.keys(visibilityByHotel).length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '40px', textAlign: 'center', color: '#a8a29e', fontSize: 14 }}>
                  No data yet — add queries and run for each partner hotel.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {Object.entries(visibilityByHotel)
                    .sort((a, b) => (b[1].appeared / b[1].total) - (a[1].appeared / a[1].total))
                    .map(([hotelName, stats]) => {
                      const score = Math.round((stats.appeared / stats.total) * 100)
                      const color = score >= 50 ? '#16a34a' : score >= 20 ? '#C9A84C' : '#dc2626'
                      return (
                        <div key={hotelName} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#3D2B1F', margin: 0 }}>{hotelName}</p>
                              <span style={{ fontSize: 10, background: '#C9A84C22', color: '#C9A84C', border: '1px solid #C9A84C44', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✦ Partner</span>
                            </div>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#a8a29e', margin: 0 }}>
                              Appeared in {stats.appeared} of {stats.total} AI queries
                            </p>
                          </div>
                          <div style={{ width: 200 }}>
                            <div style={{ height: 6, background: '#f5f5f4', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: score + '%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 60 }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 700, color, margin: 0 }}>{score}%</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#a8a29e', margin: 0 }}>AI visibility</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                Recent Appearances
              </h2>
              <div className="bg-white border border-stone-200 overflow-hidden rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      {['Hotel', 'Query', 'Result', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-stone-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(visibilityStats || [])
                      .filter(r => partnerNames.has(r.hotel_name) && r.appeared)
                      .slice(0, 20)
                      .map((row: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                          <td className="px-4 py-3 font-medium text-stone-800 text-xs">{row.hotel_name}</td>
                          <td className="px-4 py-3 text-stone-600 text-xs">{row.query}</td>
                          <td className="px-4 py-3">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">✓ Appeared</span>
                          </td>
                          <td className="px-4 py-3 text-stone-500 text-xs">{new Date(row.checked_at).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {(visibilityStats || []).filter(r => partnerNames.has(r.hotel_name) && r.appeared).length === 0 && (
                  <p className="text-center text-stone-400 py-10 text-sm">No appearances yet.</p>
                )}
              </div>
            </div>
          <div style={{ marginTop: 32 }}>
              <GoogleAITab hotels={partnerHotels} />
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'analytics' && (
          <div>
            {/* Summary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Total Views', value: viewsList.length, color: '#C9A84C' },
                { label: 'Total Clicks', value: clicksList.length, color: '#8B5CF6' },
                { label: 'Total Leads', value: leadsList.length, color: '#16a34a' },
                { label: 'Conversion', value: viewsList.length > 0 ? Math.round((leadsList.length / viewsList.length) * 100) + '%' : '0%', color: '#3b82f6' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>{k.label}</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 400, color: k.color, margin: 0 }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Clicks by page type */}
<div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px', marginBottom: 28 }}>
  <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Clicks by Page Type</h3>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
    {[
      { label: 'Hotel Profile', campaign: 'hotel_profile', color: '#C9A84C' },
      { label: 'Compare Pages', campaign: 'compare', color: '#8B5CF6' },
      { label: 'Best Pages', campaign: 'best_page', color: '#3b82f6' },
      { label: 'Destination', campaign: 'hotels_page_website', color: '#16a34a' },
      { label: 'Rooms', campaign: 'rooms_page', color: '#f59e0b' },
      { label: 'Dining', campaign: 'dining_page', color: '#ef4444' },
      { label: 'Spa', campaign: 'spa_page', color: '#ec4899' },
      { label: 'AI Concierge', campaign: 'ai_concierge', color: '#06b6d4' },
    ].map(({ label, campaign, color }) => {
      const count = clicksList.filter((c: any) => c.utm_campaign === campaign).length
      return (
        <div key={campaign} style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 6, padding: '12px 16px' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{label}</p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, color: count > 0 ? color : '#a8a29e', margin: 0 }}>{count}</p>
        </div>
      )
    })}
  </div>
</div>

{/* Clicks by hotel (all pages combined) */}
<div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px', marginBottom: 28 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Views by Hotel</h3>
    <div style={{ textAlign: 'right' }}>
      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 400, color: '#C9A84C' }}>{totalHotelViews}</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#a8a29e', marginLeft: 6 }}>total hotel profile views</span>
    </div>
  </div>
  {viewsByHotelSorted.length === 0 ? (
    <p style={{ fontSize: 13, color: '#a8a29e' }}>No view data yet.</p>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
      {viewsByHotelSorted.map(({ name, n }) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#3D2B1F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <div style={{ width: 160, height: 5, background: '#f5f5f4', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ height: '100%', width: Math.round((n / viewsByHotelSorted[0].n) * 100) + '%', background: '#C9A84C', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#C9A84C', minWidth: 28, textAlign: 'right', flexShrink: 0 }}>{n}</span>
        </div>
      ))}
    </div>
  )}
</div>





            
          </div>
        )}

      

        {tab === 'keywords' && <KeywordsTab hotels={hotelsList} keywords={keywordsList} password={pw} />}



{tab === 'clicks' && (
  <div>
    <div className="flex justify-between items-center mb-4">
      <p className="text-stone-600 text-sm">{clicksList.length} referral clicks tracked</p>
    </div>
    <div className="bg-white border border-stone-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 border-b border-stone-200">
          <tr>
            {['Hotel', 'Source', 'Medium', 'Campaign', 'Time'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-stone-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clicksList.map((click: any, i: number) => (
            <tr key={click.id} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
              <td className="px-4 py-3 font-medium text-stone-800">{click.hotel_name || '—'}</td>
              <td className="px-4 py-3 text-stone-600">{click.utm_source}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 ${click.utm_medium === 'chatgpt_plugin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {click.utm_medium}
                </span>
              </td>
              <td className="px-4 py-3 text-stone-600">{click.utm_campaign}</td>
              <td className="px-4 py-3 text-stone-500 text-xs">{new Date(click.clicked_at).toLocaleString('en-GB')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {clicksList.length === 0 && <p className="text-center text-stone-400 py-10 text-sm">No clicks yet.</p>}
    </div>
  </div>
)}
      </div>
      {/* Cost tracking */}
<div style={{ marginTop: 32 }}>
  <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
    API Cost Tracking
  </h2>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
    {[
      {
        label: 'Total Spent',
        value: '$' + ((cronCostsAll || []).reduce((sum: number, r: any) => sum + Number(r.estimated_cost_usd || 0), 0)).toFixed(3),
        color: '#C9A84C',
      },
      {
        label: 'This Month',
        value: '$' + ((cronCosts || []).filter((r: any) => new Date(r.run_at) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum: number, r: any) => sum + Number(r.estimated_cost_usd || 0), 0)).toFixed(3),
        color: '#3b82f6',
      },
      {
        label: 'Last Run',
        value: cronCosts?.[0] ? '$' + Number(cronCosts[0].estimated_cost_usd).toFixed(3) : '—',
        color: '#16a34a',
      },
    ].map(k => (
      <div key={k.label} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '16px 20px' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>{k.label}</p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 400, color: k.color, margin: 0 }}>{k.value}</p>
      </div>
    ))}
  </div>
  <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, overflow: 'hidden' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
          {['Date', 'Triggered By', 'Hotels', 'Queries', 'Platforms', 'Cost'].map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(cronCosts || []).map((row: any, i: number) => (
          <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f4', background: i % 2 === 0 ? '#fff' : '#fafaf9' }}>
            <td style={{ padding: '10px 16px', color: '#3D2B1F' }}>{new Date(row.run_at).toLocaleString('en-GB')}</td>
            <td style={{ padding: '10px 16px' }}>
              <span style={{ background: row.triggered_by === 'manual' ? 'rgba(59,130,246,0.1)' : 'rgba(22,163,74,0.1)', color: row.triggered_by === 'manual' ? '#3b82f6' : '#16a34a', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {row.triggered_by}
              </span>
            </td>
            <td style={{ padding: '10px 16px', color: '#3D2B1F' }}>{row.hotels_checked}</td>
            <td style={{ padding: '10px 16px', color: '#3D2B1F' }}>{row.queries_run}</td>
            <td style={{ padding: '10px 16px', color: '#3D2B1F' }}>{row.platforms_checked}</td>
            <td style={{ padding: '10px 16px', fontWeight: 600, color: '#C9A84C' }}>${Number(row.estimated_cost_usd).toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {(cronCosts || []).length === 0 && (
      <p style={{ textAlign: 'center', color: '#a8a29e', padding: '2rem', fontSize: 13 }}>No runs yet — cost will appear after first cron run.</p>
    )}
  </div>
</div>
    </div>
  )
}