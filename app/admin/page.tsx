export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import KeywordsTab from '@/components/KeywordsTab'
import HotelsTab from '@/components/HotelsTab'
import SchemaTab from '@/components/SchemaTab'
import AIVisibilityToggle from '@/components/AIVisibilityToggle'
import AIVisibilityQueries from '@/components/AIVisibilityQueries'

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

  const { data: cronSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'ai_visibility_cron_enabled')
    .single()

  // Only fetch visibility stats for partner hotels
  const { data: visibilityStats } = await supabase
    .from('ai_visibility_scores')
    .select('hotel_id, hotel_name, appeared, checked_at')
    .order('checked_at', { ascending: false })
    .limit(500)

  const tab = params.tab || 'hotels'
  const pw = params.password || ''

  const hotelsList = hotels || []
  const partnerHotels = hotelsList.filter(h => h.is_partner)
  const partnerNames = new Set(partnerHotels.map(h => h.name))
  const leadsList = leads || []
  const keywordsList = keywords || []
  const clicksList = clicks || []
  const cronEnabled = cronSetting?.value === 'true'

  // Calculate visibility score — partner hotels only
  const visibilityByHotel: Record<string, { appeared: number; total: number }> = {}
  for (const row of visibilityStats || []) {
    if (!partnerNames.has(row.hotel_name)) continue
    if (!visibilityByHotel[row.hotel_name]) visibilityByHotel[row.hotel_name] = { appeared: 0, total: 0 }
    visibilityByHotel[row.hotel_name].total++
    if (row.appeared) visibilityByHotel[row.hotel_name].appeared++
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
            <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1.5">{clicksList.length} Clicks</span>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {['hotels', 'schema', 'ai visibility', 'leads', 'keywords', 'clicks'].map(t => (
            <a key={t} href={'/admin?password=' + pw + '&tab=' + t}
              className={'px-6 py-3 text-sm uppercase tracking-wide capitalize transition-colors ' +
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

            {/* Visibility scores — partner hotels only */}
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

            {/* Recent appearances */}
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
                  <p className="text-center text-stone-400 py-10 text-sm">No appearances yet — run queries to start tracking.</p>
                )}
              </div>
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
    </div>
  )
}