import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import KeywordsTab from '@/components/KeywordsTab'

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
    .order('created_at', { ascending: false })

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

  const tab = params.tab || 'hotels'
  const pw = params.password || ''

  return (
    <div className="pt-20 min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-stone-800">Admin Dashboard</h1>
          <div className="flex gap-3">
            <span className="bg-green-100 text-green-800 text-xs px-3 py-1.5">{hotels?.length || 0} Hotels</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5">{leads?.length || 0} Leads</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5">{keywords?.length || 0} Keywords</span>
            <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1.5">{clicks?.length || 0} Clicks</span>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {['hotels', 'leads', 'keywords', 'clicks'].map(t => (
            <a key={t} href={'/admin?password=' + pw + '&tab=' + t}
              className={'px-6 py-3 text-sm uppercase tracking-wide capitalize transition-colors ' +
                (tab === t ? 'border-b-2 border-amber-700 text-amber-700 font-semibold' : 'text-stone-500 hover:text-stone-700')}>
              {t}
            </a>
          ))}
        </div>

        {tab === 'hotels' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-stone-600 text-sm">{hotels?.length || 0} properties</p>
              <a href="/onboarding" className="btn-primary text-xs py-2 px-4">Add New Hotel →</a>
            </div>
            <div className="bg-white border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    {['Hotel', 'Region', 'Category', 'Rate (CHF)', 'Rating', 'Featured', 'Active'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-stone-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(hotels || []).map((hotel, i) => (
                    <tr key={hotel.id} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                      <td className="px-4 py-3 font-medium text-stone-800">{hotel.name}</td>
                      <td className="px-4 py-3 text-stone-600">{hotel.region}</td>
                      <td className="px-4 py-3 text-stone-600">{hotel.category}</td>
                      <td className="px-4 py-3 text-stone-600">{hotel.nightly_rate_chf?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className="text-amber-600">★ {hotel.rating}</span></td>
                      <td className="px-4 py-3">
                        <span className={hotel.is_featured ? 'text-xs px-2 py-1 bg-amber-100 text-amber-800' : 'text-xs px-2 py-1 bg-stone-100 text-stone-500'}>
                          {hotel.is_featured ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={hotel.is_active ? 'text-xs px-2 py-1 bg-green-100 text-green-800' : 'text-xs px-2 py-1 bg-red-100 text-red-700'}>
                          {hotel.is_active ? 'Live' : 'Hidden'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                {(leads || []).map((lead, i) => (
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
            {leads?.length === 0 && <p className="text-center text-stone-400 py-10 text-sm">No leads yet.</p>}
          </div>
        )}

        {tab === 'keywords' && (
          <KeywordsTab hotels={hotels || []} keywords={keywords || []} password={pw} />
        )}

        {tab === 'clicks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-stone-600 text-sm">{clicks?.length || 0} referral clicks tracked</p>
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
                  {(clicks || []).map((click: any, i: number) => (
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
              {clicks?.length === 0 && <p className="text-center text-stone-400 py-10 text-sm">No clicks yet. They will appear here when guests click Book Direct.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}