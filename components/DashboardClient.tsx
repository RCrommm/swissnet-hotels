'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  hotel: any
  views: any[]
  clicks: any[]
  leads: any[]
  aiVisibility: any[]
  bookings: any[]
  competitors: any[]
}

export default function DashboardClient({ hotel, views, clicks, leads, aiVisibility, bookings, competitors }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [days, setDays] = useState(30)

  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const filteredViews = views.filter(v => new Date(v.viewed_at) > cutoff)
  const filteredClicks = clicks.filter(c => new Date(c.clicked_at) > cutoff)
  const filteredLeads = leads.filter(l => new Date(l.created_at) > cutoff)
  const filteredBookings = bookings.filter(b => new Date(b.booked_at) > cutoff)
  const filteredAI = aiVisibility.filter(a => new Date(a.checked_at) > cutoff)

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.total_chf || 0), 0)
  const totalCommission = filteredBookings.reduce((sum, b) => sum + (b.commission_chf || 0), 0)
  const aiScore = filteredAI.length > 0 ? Math.min(100, Math.round((filteredAI.filter(a => a.appeared).length / filteredAI.length) * 100)) : 0

  const keywordCounts: Record<string, number> = {}
  filteredAI.forEach(a => {
    if (a.keyword) keywordCounts[a.keyword] = (keywordCounts[a.keyword] || 0) + 1
  })
  const topKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  const gold = '#C9A84C'
  const bg = '#F8F5EF'
  const card = '#FFFFFF'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#2A2118'
  const textMuted = 'rgba(42,33,24,0.45)'

  const s = {
    page: { minHeight: '100vh', background: bg, fontFamily: 'Montserrat, sans-serif' },
    header: { background: '#fff', borderBottom: '1px solid ' + border, padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 12px rgba(201,169,110,0.08)' },
    main: { maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
    kpiCard: { background: card, border: '1px solid ' + border, padding: '1.5rem', boxShadow: '0 2px 12px rgba(201,169,110,0.06)' },
    kpiLabel: { fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: textMuted, marginBottom: '0.5rem' },
    kpiValue: { fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: gold, lineHeight: 1 },
    kpiSub: { fontSize: '0.6rem', color: textMuted, marginTop: '0.25rem' },
    section: { background: card, border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(201,169,110,0.06)' },
    sectionTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: text, marginBottom: '1.25rem', fontWeight: 400 },
    tab: (active: boolean) => ({
      padding: '0.6rem 1.25rem',
      fontSize: '0.6rem',
      letterSpacing: '0.15em',
      textTransform: 'uppercase' as const,
      cursor: 'pointer',
      border: active ? '1px solid ' + gold : '1px solid transparent',
      background: active ? gold : 'transparent',
      color: active ? '#fff' : textMuted,
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.2s',
    }),
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.72rem' },
    th: { textAlign: 'left' as const, padding: '0.75rem 1rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border },
    td: { padding: '0.75rem 1rem', color: text, borderBottom: '1px solid rgba(201,169,110,0.08)' },
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: gold, margin: 0 }}>
            SwissNet <span style={{ fontStyle: 'italic', color: text }}>Hotels</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: 0 }}>{hotel?.name}</p>
          <select
            value={days}
            onChange={e => setDays(parseInt(e.target.value))}
            style={{ background: '#fff', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', padding: '0.4rem 0.75rem', cursor: 'pointer' }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid ' + border, color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', padding: '0.4rem 0.75rem', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={s.main}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 0.25rem' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.7rem', color: textMuted, margin: 0 }}>
            Here's how <span style={{ color: gold }}>{hotel?.name}</span> is performing on SwissNet Hotels
          </p>
        </div>

        {/* KPI Cards */}
        <div style={s.kpiGrid}>
          {[
            { label: 'Profile Views', value: filteredViews.length, sub: `Last ${days} days` },
            { label: 'Book Direct Clicks', value: filteredClicks.length, sub: `${filteredViews.length > 0 ? Math.round((filteredClicks.length / filteredViews.length) * 100) : 0}% click rate` },
            { label: 'Leads Received', value: filteredLeads.length, sub: 'Enquiries via SwissNet' },
            { label: 'AI Visibility Score', value: aiScore + '%', sub: `${filteredAI.length} AI queries tracked` },
            { label: 'Revenue via SwissNet', value: 'CHF ' + totalRevenue.toLocaleString(), sub: `CHF ${totalCommission.toLocaleString()} commission` },
          ].map(k => (
            <div key={k.label} style={s.kpiCard}>
              <p style={s.kpiLabel}>{k.label}</p>
              <p style={s.kpiValue}>{k.value}</p>
              <p style={s.kpiSub}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
          {['overview', 'ai visibility', 'leads', 'bookings', 'competitors'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={s.tab(activeTab === t)}>{t}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={s.section}>
              <p style={s.sectionTitle}>Traffic Sources</p>
              {Object.entries(
                filteredViews.reduce((acc: Record<string, number>, v) => {
                  acc[v.source] = (acc[v.source] || 0) + 1
                  return acc
                }, {})
              ).map(([source, count]) => (
                <div key={source} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: text, textTransform: 'capitalize' }}>{source}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '80px', height: '4px', background: 'rgba(201,169,110,0.15)', borderRadius: '2px' }}>
                      <div style={{ width: Math.round((count as number / filteredViews.length) * 100) + '%', height: '100%', background: gold, borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: gold, fontWeight: 500, minWidth: '24px' }}>{count as number}</span>
                  </div>
                </div>
              ))}
              {filteredViews.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted }}>No data for this period</p>}
            </div>

            <div style={s.section}>
              <p style={s.sectionTitle}>Recent Leads</p>
              {filteredLeads.slice(0, 5).map(lead => (
                <div key={lead.id} style={{ borderBottom: '1px solid rgba(201,169,110,0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.72rem', color: text, margin: '0 0 0.2rem', fontWeight: 500 }}>{lead.name}</p>
                  <p style={{ fontSize: '0.65rem', color: textMuted, margin: 0 }}>
                    {lead.check_in ? lead.check_in + ' · ' : ''}{lead.guests || 2} guests
                  </p>
                </div>
              ))}
              {filteredLeads.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted }}>No leads yet this period</p>}
            </div>
          </div>
        )}

        {/* AI Visibility Tab */}
        {activeTab === 'ai visibility' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={s.section}>
              <p style={s.sectionTitle}>AI Visibility Score</p>
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '5rem', color: gold, margin: '0 0 0.5rem', lineHeight: 1 }}>{aiScore}%</p>
                <p style={{ fontSize: '0.65rem', color: textMuted, letterSpacing: '0.1em' }}>VISIBILITY RATE</p>
                <div style={{ width: '100%', height: '6px', background: 'rgba(201,169,110,0.15)', borderRadius: '3px', marginTop: '1.5rem' }}>
                  <div style={{ width: aiScore + '%', height: '100%', background: gold, borderRadius: '3px' }} />
                </div>
                <p style={{ fontSize: '0.6rem', color: textMuted, marginTop: '0.75rem' }}>{filteredAI.filter(a => a.appeared).length} of {filteredAI.length} AI queries</p>
              </div>
            </div>

            <div style={s.section}>
              <p style={s.sectionTitle}>Top Keywords</p>
              {topKeywords.length > 0 ? topKeywords.map(([keyword, count], i) => (
                <div key={keyword} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.6rem', color: gold, minWidth: '16px' }}>#{i + 1}</span>
                  <span style={{ fontSize: '0.7rem', color: text, flex: 1 }}>{keyword}</span>
                  <span style={{ fontSize: '0.65rem', color: gold, fontWeight: 500 }}>{count}x</span>
                </div>
              )) : <p style={{ fontSize: '0.7rem', color: textMuted }}>No keyword data yet</p>}
            </div>

            <div style={{ ...s.section, gridColumn: '1 / -1' }}>
              <p style={s.sectionTitle}>AI Query Log</p>
              <table style={s.table}>
                <thead>
                  <tr>{['Query', 'Keyword', 'Platform', 'Position', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredAI.slice(0, 20).map(a => (
                    <tr key={a.id}>
                      <td style={s.td}>{a.query}</td>
                      <td style={{ ...s.td, color: gold }}>{a.keyword}</td>
                      <td style={s.td}>{a.ai_platform}</td>
                      <td style={s.td}>#{a.position}</td>
                      <td style={s.td}>{new Date(a.checked_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAI.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem' }}>No AI visibility data yet</p>}
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div style={s.section}>
            <p style={s.sectionTitle}>All Leads</p>
            <table style={s.table}>
              <thead>
                <tr>{['Name', 'Email', 'Check In', 'Check Out', 'Guests', 'Message', 'Received'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ ...s.td, fontWeight: 500 }}>{lead.name}</td>
                    <td style={s.td}><a href={'mailto:' + lead.email} style={{ color: gold, textDecoration: 'none' }}>{lead.email}</a></td>
                    <td style={s.td}>{lead.check_in || '—'}</td>
                    <td style={s.td}>{lead.check_out || '—'}</td>
                    <td style={s.td}>{lead.guests || '—'}</td>
                    <td style={{ ...s.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.message || '—'}</td>
                    <td style={s.td}>{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem' }}>No leads for this period</p>}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Bookings', value: filteredBookings.length },
                { label: 'Total Revenue', value: 'CHF ' + totalRevenue.toLocaleString() },
                { label: 'Commission Earned', value: 'CHF ' + totalCommission.toLocaleString() },
              ].map(k => (
                <div key={k.label} style={s.kpiCard}>
                  <p style={s.kpiLabel}>{k.label}</p>
                  <p style={{ ...s.kpiValue, fontSize: '1.8rem' }}>{k.value}</p>
                </div>
              ))}
            </div>
            <div style={s.section}>
              <p style={s.sectionTitle}>Booking History</p>
              <table style={s.table}>
                <thead>
                  <tr>{['Guest', 'Check In', 'Check Out', 'Nights', 'Rate', 'Total', 'Commission', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredBookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ ...s.td, fontWeight: 500 }}>{b.guest_name}</td>
                      <td style={s.td}>{b.check_in}</td>
                      <td style={s.td}>{b.check_out}</td>
                      <td style={s.td}>{b.nights}</td>
                      <td style={s.td}>CHF {b.rate_chf?.toLocaleString()}</td>
                      <td style={s.td}>CHF {b.total_chf?.toLocaleString()}</td>
                      <td style={{ ...s.td, color: gold }}>CHF {b.commission_chf?.toLocaleString()}</td>
                      <td style={s.td}><span style={{ background: 'rgba(201,169,110,0.1)', color: gold, fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem' }}>No bookings for this period</p>}
            </div>
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div style={s.section}>
            <p style={s.sectionTitle}>Competitor Benchmark — {hotel?.region}</p>
            <table style={s.table}>
              <thead>
                <tr>{['Hotel', 'Category', 'Rating', 'Nightly Rate', 'vs You'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(201,169,110,0.05)' }}>
                  <td style={{ ...s.td, color: gold, fontWeight: 600 }}>{hotel?.name} (You)</td>
                  <td style={s.td}>{hotel?.category}</td>
                  <td style={s.td}>★ {hotel?.rating}</td>
                  <td style={s.td}>CHF {hotel?.nightly_rate_chf?.toLocaleString()}</td>
                  <td style={s.td}>—</td>
                </tr>
                {competitors.map(c => (
                  <tr key={c.name}>
                    <td style={s.td}>{c.name}</td>
                    <td style={s.td}>{c.category}</td>
                    <td style={s.td}>★ {c.rating}</td>
                    <td style={s.td}>CHF {c.nightly_rate_chf?.toLocaleString()}</td>
                    <td style={s.td}>
                      <span style={{ color: c.nightly_rate_chf > hotel?.nightly_rate_chf ? '#16a34a' : '#dc2626', fontSize: '0.65rem' }}>
                        {c.nightly_rate_chf > hotel?.nightly_rate_chf ? '↓ cheaper' : '↑ more expensive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {competitors.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem' }}>No competitors found in this region</p>}
          </div>
        )}
      </div>
    </div>
  )
}