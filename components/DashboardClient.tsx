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

  const gold = '#C9A84C'
  const bg = '#F8F5EF'
  const card = '#FFFFFF'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bgSection = '#F2EAE0'

  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const filteredClicks = clicks.filter(c => new Date(c.clicked_at) > cutoff)
  const filteredLeads = leads.filter(l => new Date(l.created_at) > cutoff)
  const filteredAI = aiVisibility.filter(a => new Date(a.checked_at) > cutoff)

  const aiScore = filteredAI.length > 0
    ? Math.round((filteredAI.filter(a => a.appeared).length / filteredAI.length) * 100)
    : 0

  const totalHotels = competitors.length + 1

  // Click sources breakdown
  const clickSources = filteredClicks.reduce((acc: Record<string, number>, c: any) => {
    const source = c.utm_source || c.utm_medium || 'direct'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})

  // AI queries that triggered appearances
  const appearedQueries = filteredAI.filter(a => a.appeared)
  const missedQueries = filteredAI.filter(a => !a.appeared)

  // Group AI scores by date for trend
  const aiByDate: Record<string, { appeared: number; total: number }> = {}
  filteredAI.forEach(a => {
    const date = new Date(a.checked_at).toLocaleDateString('en-GB')
    if (!aiByDate[date]) aiByDate[date] = { appeared: 0, total: 0 }
    aiByDate[date].total++
    if (a.appeared) aiByDate[date].appeared++
  })
  const aiTrend = Object.entries(aiByDate).slice(-7).map(([date, s]) => ({
    date,
    score: Math.round((s.appeared / s.total) * 100)
  }))

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  const kpiCard = (label: string, value: string, sub: string, highlight = false) => (
    <div style={{ background: card, border: '1px solid ' + border, padding: '1.75rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)', flex: 1, minWidth: '180px', borderRadius: 8 }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: textMuted, margin: '0 0 0.75rem' }}>{label}</p>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', fontWeight: 400, color: highlight ? gold : text, margin: '0 0 0.4rem', lineHeight: 1 }}>{value}</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: 0 }}>{sub}</p>
    </div>
  )

  const tabs = ['Overview', 'AI Visibility', 'Clicks', 'Leads', 'Competitors', 'Settings']

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header */}
      <div style={{ background: card, borderBottom: '1px solid ' + border, padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 12px rgba(201,169,110,0.08)' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: gold, margin: 0 }}>
          SwissNet <span style={{ fontStyle: 'italic', color: text }}>Hotels</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: textMuted, margin: 0 }}>{hotel?.name}</p>
          <select value={days} onChange={e => setDays(parseInt(e.target.value))} style={{ background: bg, border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', padding: '0.35rem 0.75rem', cursor: 'pointer', outline: 'none', borderRadius: 4 }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid ' + border, color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', padding: '0.35rem 0.75rem', cursor: 'pointer', borderRadius: 4 }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 0.25rem' }}>Welcome back</h1>
          <p style={{ fontSize: '0.7rem', color: textMuted, margin: 0 }}>
            Performance overview for <span style={{ color: gold, fontWeight: 500 }}>{hotel?.name}</span> · Last {days} days
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' as const }}>
          {kpiCard('AI Visibility Score', aiScore + '%', `${appearedQueries.length} of ${filteredAI.length} queries`, true)}
          {kpiCard('Book Direct Clicks', String(filteredClicks.length), 'Tracked referral clicks')}
          {kpiCard('Leads Received', String(filteredLeads.length), 'Enquiries this period')}
          {kpiCard('Competitor Rank', '#1 of ' + totalHotels, 'In ' + (hotel?.region || 'your region'))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid ' + border }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t.toLowerCase().replace(' ', '_'))} style={{
              padding: '0.65rem 1.25rem', fontSize: '0.6rem', letterSpacing: '0.15em',
              textTransform: 'uppercase' as const, cursor: 'pointer', border: 'none',
              background: 'transparent',
              color: activeTab === t.toLowerCase().replace(' ', '_') ? gold : textMuted,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: activeTab === t.toLowerCase().replace(' ', '_') ? 600 : 400,
              borderBottom: activeTab === t.toLowerCase().replace(' ', '_') ? '2px solid ' + gold : '2px solid transparent',
              marginBottom: '-1px',
            }}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* AI Score */}
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem' }}>AI Visibility Score</p>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '4rem', color: gold, margin: '0 0 0.5rem', lineHeight: 1 }}>{aiScore}%</p>
                <div style={{ width: '100%', height: 8, background: bgSection, borderRadius: 4, margin: '1rem 0 0.5rem' }}>
                  <div style={{ width: aiScore + '%', height: '100%', background: gold, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <p style={{ fontSize: '0.6rem', color: textMuted }}>{appearedQueries.length} appearances in {filteredAI.length} AI queries tracked</p>
              </div>
              {aiTrend.length > 1 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.6rem', color: textMuted, marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>7-day trend</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40 }}>
                    {aiTrend.map((d, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                        <div style={{ width: '100%', background: gold, borderRadius: 2, height: Math.max(2, (d.score / 100) * 36) + 'px', opacity: 0.7 + (i / aiTrend.length) * 0.3 }} />
                        <span style={{ fontSize: 8, color: textMuted }}>{d.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clicks breakdown */}
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem' }}>Click Sources</p>
              {Object.keys(clickSources).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
                  {Object.entries(clickSources).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([source, count]) => (
                    <div key={source}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.65rem', color: text, textTransform: 'capitalize' as const }}>{source}</span>
                        <span style={{ fontSize: '0.65rem', color: gold, fontWeight: 600 }}>{count as number}</span>
                      </div>
                      <div style={{ height: 6, background: bgSection, borderRadius: 3 }}>
                        <div style={{ width: Math.round(((count as number) / filteredClicks.length) * 100) + '%', height: '100%', background: gold, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.7rem', color: textMuted }}>No click data for this period</p>
              )}
            </div>

            {/* Recent leads */}
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8, gridColumn: '1 / -1' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem' }}>Recent Leads</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Dates', 'Guests', 'Received'].map(h => (
                      <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.slice(0, 5).map((lead: any, i: number) => (
                    <tr key={lead.id} style={{ background: i % 2 === 0 ? card : bgSection }}>
                      <td style={{ padding: '0.75rem', fontWeight: 500, color: text }}>{lead.name}</td>
                      <td style={{ padding: '0.75rem' }}><a href={'mailto:' + lead.email} style={{ color: gold, textDecoration: 'none' }}>{lead.email}</a></td>
                      <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{lead.check_in ? lead.check_in + ' → ' + lead.check_out : '—'}</td>
                      <td style={{ padding: '0.75rem', color: textMuted }}>{lead.guests || '—'}</td>
                      <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem', textAlign: 'center' as const }}>No leads yet this period</p>}
            </div>
          </div>
        )}

        {/* AI VISIBILITY TAB */}
        {activeTab === 'ai_visibility' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' }}>
            {/* Score + trend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8, textAlign: 'center' as const }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>Current Score</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '5rem', color: aiScore >= 50 ? '#16a34a' : aiScore >= 20 ? gold : '#dc2626', margin: '0 0 0.5rem', lineHeight: 1 }}>{aiScore}%</p>
                <div style={{ width: '100%', height: 8, background: bgSection, borderRadius: 4, margin: '1rem 0 0.5rem' }}>
                  <div style={{ width: aiScore + '%', height: '100%', background: aiScore >= 50 ? '#16a34a' : aiScore >= 20 ? gold : '#dc2626', borderRadius: 4 }} />
                </div>
                <p style={{ fontSize: '0.6rem', color: textMuted }}>{appearedQueries.length} of {filteredAI.length} queries</p>
              </div>

              <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>Score Over Time</p>
                {aiTrend.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 8 }}>
                      {aiTrend.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, color: textMuted }}>{d.score}%</span>
                          <div style={{ width: '100%', background: gold, borderRadius: 3, height: Math.max(4, (d.score / 100) * 60) + 'px' }} />
                          <span style={{ fontSize: 8, color: textMuted, whiteSpace: 'nowrap' as const }}>{d.date.split('/').slice(0, 2).join('/')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.7rem', color: textMuted }}>Not enough data yet — score will appear after a few daily runs</p>
                )}
              </div>
            </div>

            {/* Appeared queries */}
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>
                ✓ Queries Where You Appeared <span style={{ fontSize: '0.9rem', color: '#16a34a' }}>({appearedQueries.length})</span>
              </p>
              {appearedQueries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {appearedQueries.slice(0, 10).map((a: any, i: number) => (
                    <div key={i} style={{ background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '0.75rem 1rem' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: text, margin: '0 0 0.3rem' }}>{a.query}</p>
                      {a.response_snippet && (
                        <p style={{ fontSize: '0.65rem', color: textMuted, margin: 0, lineHeight: 1.5 }}>
                          "...{a.response_snippet.substring(0, 120)}..."
                        </p>
                      )}
                      <p style={{ fontSize: '0.6rem', color: textMuted, margin: '0.3rem 0 0' }}>{new Date(a.checked_at).toLocaleDateString('en-GB')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.7rem', color: textMuted }}>No appearances yet — keep building your schema and intent phrases</p>
              )}
            </div>

            {/* Missed queries */}
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>
                ✗ Queries You're Missing <span style={{ fontSize: '0.9rem', color: '#dc2626' }}>({missedQueries.length})</span>
              </p>
              <p style={{ fontSize: '0.65rem', color: textMuted, margin: '0 0 1rem' }}>These are opportunities — improve your schema and AI descriptions to appear in these searches.</p>
              {missedQueries.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                  {[...new Set(missedQueries.map((a: any) => a.query))].slice(0, 10).map((query: any, i: number) => (
                    <span key={i} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 20, padding: '4px 12px' }}>{query}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.7rem', color: textMuted }}>No missed queries — great visibility!</p>
              )}
            </div>
          </div>
        )}

        {/* CLICKS TAB */}
        {activeTab === 'clicks' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {kpiCard('Total Clicks', String(filteredClicks.length), 'Book Direct + Website')}
              {kpiCard('Unique Sources', String(Object.keys(clickSources).length), 'Different traffic sources')}
              {kpiCard('This Period', days + ' days', 'Date range selected')}
            </div>

            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>All Clicks</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
                <thead>
                  <tr>
                    {['Source', 'Medium', 'Campaign', 'Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClicks.slice(0, 30).map((click: any, i: number) => (
                    <tr key={click.id} style={{ background: i % 2 === 0 ? card : bgSection }}>
                      <td style={{ padding: '0.75rem', color: text }}>{click.utm_source || '—'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, background: click.utm_medium === 'chatgpt_plugin' ? 'rgba(22,163,74,0.1)' : 'rgba(201,169,110,0.1)', color: click.utm_medium === 'chatgpt_plugin' ? '#16a34a' : gold }}>
                          {click.utm_medium || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: textMuted }}>{click.utm_campaign || '—'}</td>
                      <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{new Date(click.clicked_at).toLocaleString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClicks.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, textAlign: 'center' as const, marginTop: '1rem' }}>No clicks tracked this period</p>}
            </div>
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>All Leads</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Check In', 'Check Out', 'Guests', 'Message', 'Received'].map(h => (
                    <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead: any, i: number) => (
                  <tr key={lead.id} style={{ background: i % 2 === 0 ? card : bgSection }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500, color: text }}>{lead.name}</td>
                    <td style={{ padding: '0.75rem' }}><a href={'mailto:' + lead.email} style={{ color: gold, textDecoration: 'none' }}>{lead.email}</a></td>
                    <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{lead.check_in || '—'}</td>
                    <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{lead.check_out || '—'}</td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>{lead.guests || '—'}</td>
                    <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem', maxWidth: 200 }}>{lead.message ? lead.message.substring(0, 60) + '...' : '—'}</td>
                    <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, textAlign: 'center' as const, marginTop: '1rem' }}>No leads for this period</p>}
          </div>
        )}

        {/* COMPETITORS TAB */}
        {activeTab === 'competitors' && (
          <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', borderRadius: 8 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>Competitor Benchmark — {hotel?.region}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
              <thead>
                <tr>
                  {['Hotel', 'Category', 'Rating', 'Nightly Rate', 'vs You'].map(h => (
                    <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(201,169,110,0.06)' }}>
                  <td style={{ padding: '0.75rem', color: gold, fontWeight: 600 }}>{hotel?.name} ✦</td>
                  <td style={{ padding: '0.75rem', color: text }}>{hotel?.category}</td>
                  <td style={{ padding: '0.75rem', color: text }}>★ {hotel?.rating}</td>
                  <td style={{ padding: '0.75rem', color: text }}>CHF {hotel?.nightly_rate_chf?.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', color: gold, fontSize: '0.65rem' }}>You</td>
                </tr>
                {competitors.map((c: any, i: number) => (
                  <tr key={c.name} style={{ background: i % 2 === 0 ? card : bgSection }}>
                    <td style={{ padding: '0.75rem', color: text }}>{c.name}</td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>{c.category}</td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>★ {c.rating}</td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>CHF {c.nightly_rate_chf?.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.65rem' }}>
                      <span style={{ color: c.nightly_rate_chf > hotel?.nightly_rate_chf ? '#16a34a' : '#dc2626' }}>
                        {c.nightly_rate_chf > hotel?.nightly_rate_chf ? '↓ cheaper' : '↑ pricier'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {competitors.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem' }}>No competitors found in this region</p>}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ background: card, border: '1px solid ' + border, padding: '2rem', borderRadius: 8 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.5rem' }}>Hotel Settings</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Hotel Name', value: hotel?.name },
                { label: 'Location', value: hotel?.location },
                { label: 'Region', value: hotel?.region },
                { label: 'Category', value: hotel?.category },
                { label: 'Nightly Rate (CHF)', value: hotel?.nightly_rate_chf },
                { label: 'Contact Email', value: hotel?.contact_email },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, marginBottom: '0.5rem' }}>{f.label}</label>
                  <div style={{ padding: '0.75rem', background: bgSection, border: '1px solid ' + border, fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: text, borderRadius: 4 }}>{f.value || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem', background: 'rgba(201,169,110,0.06)', borderLeft: '2px solid ' + gold, borderRadius: '0 6px 6px 0' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, margin: 0 }}>
                To update your hotel details, contact <a href="mailto:hotels@swissnethotels.com" style={{ color: gold, textDecoration: 'none' }}>hotels@swissnethotels.com</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}