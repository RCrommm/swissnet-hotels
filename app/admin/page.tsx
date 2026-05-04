export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import KeywordsTab from '@/components/KeywordsTab'
import HotelsTab from '@/components/HotelsTab'
import SchemaTab from '@/components/SchemaTab'
import AIVisibilityToggle from '@/components/AIVisibilityToggle'
import AIVisibilityQueries from '@/components/AIVisibilityQueries'
import RegionQueriesTab from '@/components/RegionQueriesTab'

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
    .limit(100)

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
{['hotels', 'schema', 'ai visibility', 'analytics', 'leads', 'keywords', 'clicks', 'region queries'].map(t => (            <a key={t} href={'/admin?password=' + pw + '&tab=' + t}
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

            {/* Views by source */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px' }}>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Views by Source</h3>
                {Object.keys(viewsBySource).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#a8a29e' }}>No views yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(viewsBySource).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([source, count]) => (
                      <div key={source}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#3D2B1F', textTransform: 'capitalize' }}>{source}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#C9A84C' }}>{count as number}</span>
                        </div>
                        <div style={{ height: 5, background: '#f5f5f4', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: Math.round(((count as number) / viewsList.length) * 100) + '%', background: '#C9A84C', borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Per hotel summary */}
              <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px' }}>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Per Hotel Summary</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Hotel', 'Views', 'Clicks', 'Leads', 'Conv.'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: '#a8a29e', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #f5f5f4' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hotelsList.filter(h => h.is_active).slice(0, 15).map((hotel: any, i: number) => {
                      const v = viewsByHotel[hotel.name] || 0
                      const c = clicksByHotel[hotel.name] || 0
                      const l = leadsByHotel[hotel.name] || 0
                      const conv = v > 0 ? Math.round((l / v) * 100) : 0
                      return (
                        <tr key={hotel.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf9' }}>
                          <td style={{ padding: '6px 8px', color: '#3D2B1F', fontWeight: hotel.is_partner ? 600 : 400 }}>
                            {hotel.is_partner && <span style={{ color: '#C9A84C', marginRight: 4 }}>✦</span>}
                            {hotel.name.split(' ').slice(0, 3).join(' ')}
                          </td>
                          <td style={{ padding: '6px 8px', color: v > 0 ? '#C9A84C' : '#a8a29e', fontWeight: 600 }}>{v}</td>
                          <td style={{ padding: '6px 8px', color: c > 0 ? '#8B5CF6' : '#a8a29e', fontWeight: 600 }}>{c}</td>
                          <td style={{ padding: '6px 8px', color: l > 0 ? '#16a34a' : '#a8a29e', fontWeight: 600 }}>{l}</td>
                          <td style={{ padding: '6px 8px', color: conv > 0 ? '#3b82f6' : '#a8a29e' }}>{conv}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent views */}
            <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e7e5e4' }}>
                <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Recent Profile Views</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    {['Hotel', 'Source', 'Referrer', 'Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-stone-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewsList.slice(0, 30).map((view: any, i: number) => (
                    <tr key={view.id} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                      <td className="px-4 py-3 font-medium text-stone-800 text-xs">{view.hotel_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                          background: view.utm_source === 'chatgpt' ? 'rgba(22,163,74,0.1)' :
                            view.utm_source === 'google' ? 'rgba(59,130,246,0.1)' :
                            view.utm_source === 'perplexity' ? 'rgba(139,92,246,0.1)' : 'rgba(201,169,110,0.1)',
                          color: view.utm_source === 'chatgpt' ? '#16a34a' :
                            view.utm_source === 'google' ? '#3b82f6' :
                            view.utm_source === 'perplexity' ? '#8B5CF6' : '#C9A84C',
                        }}>
                          {view.utm_source || 'direct'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {view.referrer || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">{new Date(view.viewed_at).toLocaleString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {viewsList.length === 0 && <p className="text-center text-stone-400 py-10 text-sm">No views yet — views appear when someone visits a hotel profile page.</p>}
            </div>
          </div>
        )}

        {tab === 'leads' && (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  {['Name', 'Email', 'Hotel', 'Dates', 'Guests', 'Submitted'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-stone-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsList.map((lead: any, i: number) => (
                  <tr key={lead.id} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-4 py-3 font-medium text-stone-800">{lead.name}</td>
                    <td className="px-4 py-3"><a href={'mailto:' + lead.email} className="text-amber-700 hover:underline">{lead.email}</a></td>
                    <td className="px-4 py-3 text-stone-600">{lead.hotel_name || '—'}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs">{lead.check_in ? lead.check_in + ' → ' + lead.check_out : '—'}</td>
                    <td className="px-4 py-3 text-stone-600">{lead.guests || '—'}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leadsList.length === 0 && <p className="text-center text-stone-400 py-10 text-sm">No leads yet.</p>}
          </div>
        )}

        {tab === 'keywords' && <KeywordsTab hotels={hotelsList} keywords={keywordsList} password={pw} />}
        {tab === 'region queries' && <RegionQueriesTab />}
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
        value: '$' + ((cronCosts || []).reduce((sum: number, r: any) => sum + Number(r.estimated_cost_usd || 0), 0)).toFixed(3),
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