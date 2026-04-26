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

  const filteredViews = views.filter(v => new Date(v.viewed_at) > cutoff)
  const filteredClicks = clicks.filter(c => new Date(c.clicked_at) > cutoff)
  const filteredLeads = leads.filter(l => new Date(l.created_at) > cutoff)
  const filteredBookings = bookings.filter(b => new Date(b.booked_at) > cutoff)
  const filteredAI = aiVisibility.filter(a => new Date(a.checked_at) > cutoff)

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.total_chf || 0), 0)
  const otaSaved = Math.round(totalRevenue * 0.18)
  const commission = Math.round(totalRevenue * 0.03)
  const aiScore = filteredAI.length > 0 ? Math.min(100, Math.round((filteredAI.filter((a: any) => a.appeared).length / filteredAI.length) * 100)) : 0
  const aiConversions = filteredBookings.filter((b: any) => b.source === 'chatgpt' || b.source === 'ai').length
  const totalHotels = competitors.length + 1
  const rankLabel = `#1 out of ${totalHotels}`

  const keywordCounts: Record<string, number> = {}
  filteredAI.forEach((a: any) => {
    if (a.keyword) keywordCounts[a.keyword] = (keywordCounts[a.keyword] || 0) + 1
  })
  const topKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const trafficSources = filteredViews.reduce((acc: Record<string, number>, v: any) => {
    acc[v.source] = (acc[v.source] || 0) + 1
    return acc
  }, {})

  const recommendations = [
    filteredLeads.filter((l: any) => l.message?.toLowerCase().includes('spa') || l.message?.toLowerCase().includes('wellness')).length > 0 && 'Spa & wellness enquiries are up — consider featuring a spa package offer',
    filteredAI.some((a: any) => a.keyword?.toLowerCase().includes('couple')) && 'High couples search volume this period — promote your romantic packages',
    competitors.some((c: any) => c.rating > hotel?.rating) && `A competitor in ${hotel?.region} has a higher rating — focus on guest experience`,
    filteredClicks.length < filteredViews.length * 0.1 && 'Click-through rate is below 10% — consider updating your exclusive offer',
  ].filter(Boolean).slice(0, 3)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/dashboard/login')
  }

  const kpiCard = (label: string, value: string, sub: string, highlight = false) => (
    <div style={{ background: card, border: '1px solid ' + border, padding: '1.75rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)', flex: 1, minWidth: '180px' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: textMuted, margin: '0 0 0.75rem' }}>{label}</p>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', fontWeight: 400, color: highlight ? gold : text, margin: '0 0 0.4rem', lineHeight: 1 }}>{value}</p>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, margin: 0 }}>{sub}</p>
    </div>
  )

  const tabs = ['Overview', 'AI Visibility', 'Leads', 'Competitors', 'Settings']

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header */}
      <div style={{ background: card, borderBottom: '1px solid ' + border, padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 12px rgba(201,169,110,0.08)' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: gold, margin: 0 }}>
          SwissNet <span style={{ fontStyle: 'italic', color: text }}>Hotels</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: textMuted, margin: 0 }}>{hotel?.name}</p>
          <select value={days} onChange={e => setDays(parseInt(e.target.value))} style={{ background: bg, border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', padding: '0.35rem 0.75rem', cursor: 'pointer', outline: 'none' }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid ' + border, color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
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

        {/* KPI Row 1 */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
          {kpiCard('Revenue Through AI', totalRevenue > 0 ? 'CHF ' + totalRevenue.toLocaleString() : 'CHF 0', `${filteredBookings.length} bookings via SwissNet`, true)}
          {kpiCard('Conversions via AI', String(aiConversions), 'Direct bookings from AI search')}
          {kpiCard('Website & Book Clicks', String(filteredClicks.length), filteredViews.length > 0 ? Math.round((filteredClicks.length / filteredViews.length) * 100) + '% click-through rate' : '0% click-through rate')}
          {kpiCard('AI Visibility Score', aiScore + '/100', `${filteredAI.length} queries tracked`, true)}
        </div>

        {/* KPI Row 2 */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' as const }}>
          {kpiCard('Avg Booking Value', filteredBookings.length > 0 ? 'CHF ' + Math.round(totalRevenue / filteredBookings.length).toLocaleString() : 'CHF 0', 'Per confirmed booking')}
          {kpiCard('OTA Fees Saved', 'CHF ' + otaSaved.toLocaleString(), '~18% commission avoided', true)}
          {kpiCard('Competitor Ranking', rankLabel, `In ${hotel?.region} on SwissNet`)}
          {kpiCard('Total Commission', 'CHF ' + commission.toLocaleString(), '3% of AI-driven revenue')}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid ' + border }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t.toLowerCase().replace(' ', '_'))} style={{
              padding: '0.65rem 1.25rem', fontSize: '0.6rem', letterSpacing: '0.15em',
              textTransform: 'uppercase' as const, cursor: 'pointer', border: 'none',
              background: activeTab === t.toLowerCase().replace(' ', '_') ? gold : 'transparent',
              color: activeTab === t.toLowerCase().replace(' ', '_') ? '#fff' : textMuted,
              fontFamily: 'Montserrat, sans-serif', fontWeight: activeTab === t.toLowerCase().replace(' ', '_') ? 600 : 400,
              transition: 'all 0.2s', marginBottom: '-1px',
              borderBottom: activeTab === t.toLowerCase().replace(' ', '_') ? '2px solid ' + gold : '2px solid transparent',
            }}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem', fontWeight: 400 }}>Performance Over Time</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
                  {[
                    { label: 'Views', value: filteredViews.length, max: Math.max(filteredViews.length, 1), color: gold },
                    { label: 'Clicks', value: filteredClicks.length, max: Math.max(filteredViews.length, 1), color: '#8B6914' },
                    { label: 'Leads', value: filteredLeads.length, max: Math.max(filteredViews.length, 1), color: '#C9A84C' },
                    { label: 'Bookings', value: filteredBookings.length, max: Math.max(filteredViews.length, 1), color: '#2A1A0E' },
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.65rem', color: textMuted }}>{m.label}</span>
                        <span style={{ fontSize: '0.65rem', color: text, fontWeight: 600 }}>{m.value}</span>
                      </div>
                      <div style={{ height: '6px', background: bgSection, borderRadius: '3px' }}>
                        <div style={{ width: Math.round((m.value / m.max) * 100) + '%', height: '100%', background: m.color, borderRadius: '3px', transition: 'width 0.5s ease', minWidth: m.value > 0 ? '4px' : '0' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem', fontWeight: 400 }}>Traffic Sources</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
                  {Object.entries(trafficSources).length > 0 ? Object.entries(trafficSources).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([source, count]) => (
                    <div key={source}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.65rem', color: textMuted, textTransform: 'capitalize' as const }}>{source}</span>
                        <span style={{ fontSize: '0.65rem', color: text, fontWeight: 600 }}>{count as number}</span>
                      </div>
                      <div style={{ height: '6px', background: bgSection, borderRadius: '3px' }}>
                        <div style={{ width: Math.round(((count as number) / filteredViews.length) * 100) + '%', height: '100%', background: gold, borderRadius: '3px' }} />
                      </div>
                    </div>
                  )) : (
                    <p style={{ fontSize: '0.7rem', color: textMuted }}>No traffic data for this period</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem', fontWeight: 400 }}>Top Search Queries</p>
                {topKeywords.length > 0 ? topKeywords.map(([keyword, count], i) => (
                  <div key={keyword} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: i < topKeywords.length - 1 ? '1px solid ' + border : 'none' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: gold, minWidth: '20px', textAlign: 'center' as const }}>#{i + 1}</span>
                    <span style={{ fontSize: '0.7rem', color: text, flex: 1 }}>{keyword}</span>
                    <span style={{ fontSize: '0.65rem', color: gold, fontWeight: 600, background: 'rgba(201,169,110,0.1)', padding: '0.2rem 0.5rem' }}>{count}×</span>
                  </div>
                )) : (
                  ['Best luxury hotel Zermatt Matterhorn', 'Romantic spa hotel Switzerland', 'Family ski resort Zermatt'].map((q, i) => (
                    <div key={q} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: i < 2 ? '1px solid ' + border : 'none' }}>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: gold, minWidth: '20px', textAlign: 'center' as const }}>#{i + 1}</span>
                      <span style={{ fontSize: '0.7rem', color: textMuted, flex: 1 }}>{q}</span>
                      <span style={{ fontSize: '0.65rem', color: textMuted, background: bgSection, padding: '0.2rem 0.5rem' }}>sample</span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem', fontWeight: 400 }}>Smart Recommendations</p>
                {recommendations.length > 0 ? recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', padding: '0.875rem', background: 'rgba(201,169,110,0.06)', borderLeft: '2px solid ' + gold }}>
                    <span style={{ color: gold, fontSize: '0.8rem', flexShrink: 0 }}>✦</span>
                    <p style={{ fontSize: '0.7rem', color: text, margin: 0, lineHeight: 1.6 }}>{rec as string}</p>
                  </div>
                )) : (
                  <>
                    {[
                      'Add a spa package for February demand — wellness searches are peaking',
                      'Couples searches are up 24% this week — consider a romantic package',
                      'Update your exclusive offer — it hasn\'t changed in 30+ days',
                    ].map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', padding: '0.875rem', background: 'rgba(201,169,110,0.06)', borderLeft: '2px solid ' + gold }}>
                        <span style={{ color: gold, fontSize: '0.8rem', flexShrink: 0 }}>✦</span>
                        <p style={{ fontSize: '0.7rem', color: text, margin: 0, lineHeight: 1.6 }}>{rec}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', boxShadow: '0 2px 16px rgba(201,169,110,0.07)' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.25rem', fontWeight: 400 }}>Recent Leads</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Dates', 'Guests', 'Est. Value', 'Received'].map(h => (
                      <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.slice(0, 5).map((lead: any, i: number) => {
                    const nights = lead.check_in && lead.check_out ? Math.round((new Date(lead.check_out).getTime() - new Date(lead.check_in).getTime()) / (1000 * 60 * 60 * 24)) : 3
                    const estValue = nights * (hotel?.nightly_rate_chf || 0)
                    return (
                      <tr key={lead.id} style={{ background: i % 2 === 0 ? card : bgSection }}>
                        <td style={{ padding: '0.75rem', fontWeight: 500, color: text }}>{lead.name}</td>
                        <td style={{ padding: '0.75rem' }}><a href={'mailto:' + lead.email} style={{ color: gold, textDecoration: 'none' }}>{lead.email}</a></td>
                        <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{lead.check_in ? lead.check_in + ' → ' + lead.check_out : '—'}</td>
                        <td style={{ padding: '0.75rem', color: textMuted }}>{lead.guests || '—'}</td>
                        <td style={{ padding: '0.75rem', color: gold, fontWeight: 600 }}>{estValue > 0 ? 'CHF ' + estValue.toLocaleString() : '—'}</td>
                        <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredLeads.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem', textAlign: 'center' as const }}>No leads yet this period</p>}
            </div>
          </div>
        )}

        {/* AI VISIBILITY TAB */}
        {activeTab === 'ai_visibility' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>AI Visibility Score</p>
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '5rem', color: gold, margin: '0 0 0.5rem', lineHeight: 1 }}>{aiScore}</p>
                <p style={{ fontSize: '0.65rem', color: textMuted, letterSpacing: '0.1em' }}>OUT OF 100</p>
                <div style={{ width: '100%', height: '6px', background: bgSection, borderRadius: '3px', marginTop: '1.5rem' }}>
                  <div style={{ width: aiScore + '%', height: '100%', background: gold, borderRadius: '3px' }} />
                </div>
                <p style={{ fontSize: '0.6rem', color: textMuted, marginTop: '0.75rem' }}>{filteredAI.filter((a: any) => a.appeared).length} of {filteredAI.length} AI queries matched</p>
              </div>
            </div>
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>Top Keywords</p>
              {topKeywords.length > 0 ? topKeywords.map(([keyword, count], i) => (
                <div key={keyword} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.6rem', color: gold, minWidth: '16px' }}>#{i + 1}</span>
                  <span style={{ fontSize: '0.7rem', color: text, flex: 1 }}>{keyword}</span>
                  <span style={{ fontSize: '0.65rem', color: gold, fontWeight: 500 }}>{count}×</span>
                </div>
              )) : <p style={{ fontSize: '0.7rem', color: textMuted }}>No keyword data yet</p>}
            </div>
            <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem', gridColumn: '1 / -1' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>AI Query Log</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
                <thead>
                  <tr>{['Query', 'Keyword', 'Platform', 'Position', 'Date'].map(h => <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredAI.slice(0, 15).map((a: any, i: number) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? card : bgSection }}>
                      <td style={{ padding: '0.75rem', color: text }}>{a.query}</td>
                      <td style={{ padding: '0.75rem', color: gold }}>{a.keyword}</td>
                      <td style={{ padding: '0.75rem', color: textMuted }}>{a.ai_platform}</td>
                      <td style={{ padding: '0.75rem', color: textMuted }}>#{a.position}</td>
                      <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{new Date(a.checked_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAI.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem' }}>No AI visibility data yet</p>}
            </div>
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>All Leads</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
              <thead>
                <tr>{['Name', 'Email', 'Check In', 'Check Out', 'Guests', 'Est. Value', 'Received'].map(h => <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead: any, i: number) => {
                  const nights = lead.check_in && lead.check_out ? Math.round((new Date(lead.check_out).getTime() - new Date(lead.check_in).getTime()) / (1000 * 60 * 60 * 24)) : 3
                  const estValue = nights * (hotel?.nightly_rate_chf || 0)
                  return (
                    <tr key={lead.id} style={{ background: i % 2 === 0 ? card : bgSection }}>
                      <td style={{ padding: '0.75rem', fontWeight: 500, color: text }}>{lead.name}</td>
                      <td style={{ padding: '0.75rem' }}><a href={'mailto:' + lead.email} style={{ color: gold, textDecoration: 'none' }}>{lead.email}</a></td>
                      <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{lead.check_in || '—'}</td>
                      <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{lead.check_out || '—'}</td>
                      <td style={{ padding: '0.75rem', color: textMuted }}>{lead.guests || '—'}</td>
                      <td style={{ padding: '0.75rem', color: gold, fontWeight: 600 }}>{estValue > 0 ? 'CHF ' + estValue.toLocaleString() : '—'}</td>
                      <td style={{ padding: '0.75rem', color: textMuted, fontSize: '0.65rem' }}>{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredLeads.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem', textAlign: 'center' as const }}>No leads for this period</p>}
          </div>
        )}

        {/* COMPETITORS TAB */}
        {activeTab === 'competitors' && (
          <div style={{ background: card, border: '1px solid ' + border, padding: '1.5rem' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1rem' }}>Competitor Benchmark — {hotel?.region}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.7rem' }}>
              <thead>
                <tr>{['Hotel', 'Category', 'Rating', 'Nightly Rate', 'Price Position', 'Visibility Rank'].map(h => <th key={h} style={{ textAlign: 'left' as const, padding: '0.6rem 0.75rem', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, borderBottom: '1px solid ' + border }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(201,169,110,0.06)' }}>
                  <td style={{ padding: '0.75rem', color: gold, fontWeight: 600 }}>{hotel?.name} (You)</td>
                  <td style={{ padding: '0.75rem', color: text }}>{hotel?.category}</td>
                  <td style={{ padding: '0.75rem', color: text }}>★ {hotel?.rating}</td>
                  <td style={{ padding: '0.75rem', color: text }}>CHF {hotel?.nightly_rate_chf?.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}><span style={{ background: 'rgba(201,169,110,0.15)', color: gold, fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>Baseline</span></td>
                  <td style={{ padding: '0.75rem', color: gold, fontWeight: 600 }}>#1 of {totalHotels}</td>
                </tr>
                {competitors.map((c: any, i: number) => (
                  <tr key={c.name} style={{ background: i % 2 === 0 ? card : bgSection }}>
                    <td style={{ padding: '0.75rem', color: text }}>{c.name}</td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>{c.category}</td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>★ {c.rating}</td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>CHF {c.nightly_rate_chf?.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: c.nightly_rate_chf > hotel?.nightly_rate_chf ? '#16a34a' : '#dc2626', fontSize: '0.65rem' }}>
                        {c.nightly_rate_chf > hotel?.nightly_rate_chf ? '↓ cheaper than you' : '↑ more expensive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: textMuted }}>#{i + 2} of {totalHotels}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {competitors.length === 0 && <p style={{ fontSize: '0.7rem', color: textMuted, marginTop: '1rem' }}>No competitors in this region yet</p>}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ background: card, border: '1px solid ' + border, padding: '2rem' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: text, margin: '0 0 1.5rem' }}>Hotel Settings</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                  <div style={{ padding: '0.75rem', background: bgSection, border: '1px solid ' + border, fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: text }}>{f.value || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(201,169,110,0.06)', borderLeft: '2px solid ' + gold }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text, margin: 0 }}>
                To update your hotel details, contact <a href="mailto:hotels@swissnethostels.com" style={{ color: gold, textDecoration: 'none' }}>hotels@swissnethostels.com</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}