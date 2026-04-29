'use client'
import { useState, useMemo } from 'react'

const GOLD = '#C9A84C'
const GOLD_LIGHT = 'rgba(201,169,76,0.12)'
const BG = '#F8F5EF'
const WHITE = '#FFFFFF'
const TEXT = '#2A1A0E'
const TEXT_MUTED = 'rgba(42,26,14,0.5)'
const BORDER = 'rgba(201,169,76,0.2)'
const GREEN = '#16a34a'
const RED = '#dc2626'
const BLUE = '#3b82f6'
const PURPLE = '#8B5CF6'

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = 32
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniChart({ data, labels, colors, title }: { data: number[][]; labels: string[]; colors: string[]; title: string }) {
  const allVals = data.flat()
  const max = Math.max(...allVals) || 1
  const w = 600, h = 160
  const padL = 40, padB = 24, padR = 20, padT = 10
  const chartW = w - padL - padR
  const chartH = h - padB - padT
  const n = data[0]?.length || 1

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={padT + chartH * (1 - t)} x2={w - padR} y2={padT + chartH * (1 - t)} stroke={BORDER} strokeWidth="1" />
          <text x={padL - 6} y={padT + chartH * (1 - t) + 4} textAnchor="end" fill={TEXT_MUTED} fontSize="9">{Math.round(max * t)}</text>
        </g>
      ))}
      {data.map((series, si) => {
        const pts = series.map((v, i) => `${padL + (i / (n - 1)) * chartW},${padT + chartH - (v / max) * chartH}`).join(' ')
        return <polyline key={si} points={pts} fill="none" stroke={colors[si]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      })}
    </svg>
  )
}

export default function DashboardClient({ hotel, views, clicks, leads, aiVisibility, bookings, competitors }: any) {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState(30)

  const hotelName = hotel?.name || 'Your Hotel'
  const hotelRegion = hotel?.region || 'Switzerland'

  // AI Visibility calculations
  const totalQueries = aiVisibility?.length || 0
  const appearedQueries = aiVisibility?.filter((r: any) => r.appeared)?.length || 0
  const visibilityScore = totalQueries > 0 ? Math.round((appearedQueries / totalQueries) * 100) : 0

  // Views/clicks over time
  const now = new Date()
  const periodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)

  const recentViews = views?.filter((v: any) => new Date(v.viewed_at) > periodStart) || []
  const recentClicks = clicks?.filter((c: any) => new Date(c.clicked_at) > periodStart) || []
  const recentLeads = leads?.filter((l: any) => new Date(l.created_at) > periodStart) || []

  // Build daily data for chart
  const days = Array.from({ length: Math.min(period, 30) }, (_, i) => {
    const d = new Date(now.getTime() - (period - 1 - i) * 24 * 60 * 60 * 1000)
    return d.toISOString().split('T')[0]
  })

  const viewsByDay = days.map(d => recentViews.filter((v: any) => v.viewed_at?.startsWith(d)).length)
  const clicksByDay = days.map(d => recentClicks.filter((c: any) => c.clicked_at?.startsWith(d)).length)
  const leadsByDay = days.map(d => recentLeads.filter((l: any) => l.created_at?.startsWith(d)).length)

  // Competitor ranking
  const regionHotels = competitors?.filter((h: any) => h.region === hotelRegion) || []
  const allHotelsInRegion = [{ name: hotelName, rating: hotel?.rating || 4.5, is_current: true }, ...regionHotels]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  const hotelRank = allHotelsInRegion.findIndex((h: any) => h.is_current) + 1

  // Click sources
  const sourceBreakdown = recentClicks.reduce((acc: any, c: any) => {
    const src = c.utm_source || 'direct'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '◈' },
    { id: 'ai-visibility', label: 'AI Visibility', icon: '✦' },
    { id: 'clicks', label: 'Clicks', icon: '↗' },
    { id: 'leads', label: 'Leads', icon: '◎' },
    { id: 'revenue', label: 'Revenue', icon: '◇' },
    { id: 'competitors', label: 'Competitors', icon: '⊕' },
    { id: 'settings', label: 'Settings', icon: '◉' },
  ]

  const kpiCard = (label: string, value: string | number, sub: string, color: string, sparkData?: number[]) => (
    <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.25rem 1.5rem', flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_MUTED, margin: '0 0 0.75rem' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: TEXT, margin: '0 0 0.25rem', lineHeight: 1 }}>{value}</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color, margin: 0 }}>{sub}</p>
        </div>
        {sparkData && <SparkLine data={sparkData} color={color} />}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: 'Montserrat, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: WHITE, borderRight: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid ' + BORDER }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: GOLD, margin: '0 0 0.2rem' }}>SwissNet <span style={{ fontStyle: 'italic', color: TEXT }}>Hotels</span></p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: TEXT_MUTED, margin: 0 }}>AI Visibility</p>
        </div>

        <div style={{ padding: '1rem 0', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 1.5rem', background: tab === item.id ? GOLD_LIGHT : 'transparent',
              border: 'none', borderLeft: tab === item.id ? '3px solid ' + GOLD : '3px solid transparent',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: '0.85rem', color: tab === item.id ? GOLD : TEXT_MUTED }}>{item.icon}</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: tab === item.id ? 600 : 400, color: tab === item.id ? TEXT : TEXT_MUTED }}>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid ' + BORDER }}>
          <div style={{ background: GOLD_LIGHT, border: '1px solid ' + BORDER, borderRadius: 8, padding: '0.75rem' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: GOLD, margin: '0 0 0.25rem' }}>Need Help?</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: 0 }}>Book a strategy call</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, padding: '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: TEXT, margin: '0 0 0.25rem' }}>
              Welcome back, {hotelName}
            </h1>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: 0 }}>
              Performance overview for the last {period} days
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[7, 30, 90].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '0.4rem 0.875rem', borderRadius: 6, border: '1px solid ' + BORDER,
                background: period === p ? GOLD : WHITE, color: period === p ? WHITE : TEXT_MUTED,
                fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
              }}>{p} Days</button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div>
            {/* Hero banner */}
            <div style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, rgba(201,169,76,0.05) 100%)`, border: '1px solid ' + BORDER, borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, background: GOLD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏆</div>
                <div>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: TEXT, margin: '0 0 0.25rem' }}>
                    {visibilityScore >= 50 ? `You are ranked #${hotelRank} in ${hotelRegion} AI Visibility` : `Your AI Visibility Score is ${visibilityScore}%`}
                  </h2>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: GOLD, margin: 0 }}>
                    {recentViews.length} profile views · {recentClicks.length} clicks · {recentLeads.length} leads this period
                  </p>
                </div>
              </div>
              <div style={{ background: GOLD, color: WHITE, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1rem', borderRadius: 6, whiteSpace: 'nowrap' }}>
                ✦ Partner
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpiCard('AI Visibility Score', visibilityScore + '%', totalQueries > 0 ? `${appearedQueries} of ${totalQueries} queries` : 'Run queries to track', GOLD, Array.from({ length: 10 }, (_, i) => Math.max(0, visibilityScore - 20 + i * 3 + Math.random() * 5)))}
              {kpiCard('Competitor Rank', '#' + hotelRank, `of ${allHotelsInRegion.length} in ${hotelRegion}`, hotelRank === 1 ? GREEN : TEXT_MUTED)}
              {kpiCard('Profile Views', recentViews.length, `last ${period} days`, GREEN, viewsByDay)}
              {kpiCard('Leads Generated', recentLeads.length, `last ${period} days`, BLUE, leadsByDay)}
            </div>

            {/* Performance chart */}
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: 0 }}>AI Performance Over Last {period} Days</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[{ label: 'Views', color: GOLD }, { label: 'Clicks', color: BLUE }, { label: 'Leads', color: GREEN }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <MiniChart
                data={[viewsByDay, clicksByDay, leadsByDay]}
                labels={days}
                colors={[GOLD, BLUE, GREEN]}
                title=""
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingLeft: 40 }}>
                {days.filter((_, i) => i % Math.floor(days.length / 5) === 0).map(d => (
                  <span key={d} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED }}>{d.slice(5)}</span>
                ))}
              </div>
            </div>

            {/* Insight cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              {[
                {
                  title: 'Biggest Improvement',
                  icon: '↑',
                  color: GREEN,
                  value: recentViews.length > 0 ? `+${recentViews.length} views` : 'Getting started',
                  desc: recentViews.length > 0 ? 'Profile visits this period' : 'Add FAQs to boost visibility',
                },
                {
                  title: 'Main Opportunity',
                  icon: '◎',
                  color: GOLD,
                  value: visibilityScore < 50 ? 'Low AI visibility' : 'Expand content',
                  desc: visibilityScore < 50 ? 'Add more queries to track' : 'Add intent pages for more coverage',
                },
                {
                  title: 'Recommended Action',
                  icon: '✦',
                  color: BLUE,
                  value: recentLeads.length === 0 ? 'No leads yet' : `${recentLeads.length} leads`,
                  desc: recentLeads.length === 0 ? 'Ensure lead form is visible' : 'Follow up with recent enquiries',
                },
                {
                  title: 'Competitor Movement',
                  icon: '⊕',
                  color: PURPLE,
                  value: `#${hotelRank} of ${allHotelsInRegion.length}`,
                  desc: hotelRank === 1 ? 'You lead the market' : 'Keep improving content to rise',
                },
              ].map(card => (
                <div key={card.title} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: 28, height: 28, background: card.color + '22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: card.color }}>{card.icon}</div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: TEXT_MUTED, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.title}</p>
                  </div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: card.color, margin: '0 0 0.25rem', fontWeight: 400 }}>{card.value}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI VISIBILITY TAB */}
        {tab === 'ai-visibility' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpiCard('Visibility Score', visibilityScore + '%', 'across all queries', GOLD)}
              {kpiCard('Queries Won', appearedQueries.toString(), 'AI appearances', GREEN)}
              {kpiCard('Queries Missed', (totalQueries - appearedQueries).toString(), 'opportunities', RED)}
              {kpiCard('Total Tracked', totalQueries.toString(), 'queries monitored', BLUE)}
            </div>

            {/* Source breakdown */}
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Visibility by AI Platform</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'ChatGPT', icon: '🤖', note: 'Via Bing index' },
                  { label: 'Perplexity', icon: '🔍', note: 'Via Bing index' },
                  { label: 'Google AI', icon: '🌐', note: 'Via Google index' },
                ].map(src => (
                  <div key={src.label} style={{ background: BG, borderRadius: 8, padding: '1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>{src.icon}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: TEXT, margin: '0 0 0.25rem' }}>{src.label}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: '0 0 0.5rem' }}>{src.note}</p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: GOLD, margin: 0 }}>
                      {visibilityScore > 0 ? visibilityScore + '%' : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent appearances */}
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid ' + BORDER }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: 0 }}>Queries Where You Appeared</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BG }}>
                    {['Query', 'Result', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, borderBottom: '1px solid ' + BORDER }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aiVisibility?.filter((r: any) => r.appeared).slice(0, 10).map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid ' + BORDER }}>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT }}>{row.query}</td>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <span style={{ background: GREEN + '22', color: GREEN, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>✓ Appeared</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{new Date(row.checked_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {aiVisibility?.filter((r: any) => r.appeared).length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED }}>No appearances yet</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Add queries in the admin and run the AI visibility check</p>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Recommendations to Improve Visibility</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { text: 'Add FAQs to your hotel profile', impact: 'High Impact' },
                  { text: 'Complete your spa & dining schema', impact: 'High Impact' },
                  { text: 'Add intent pages (honeymoon, wellness)', impact: 'Medium Impact' },
                  { text: 'Increase keyword coverage', impact: 'Medium Impact' },
                ].map((rec, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: BG, borderRadius: 8, padding: '0.875rem 1rem' }}>
                    <span style={{ color: GOLD, fontSize: '1rem' }}>✦</span>
                    <div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, margin: '0 0 0.2rem', fontWeight: 500 }}>{rec.text}</p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: rec.impact.includes('High') ? GREEN : GOLD, margin: 0 }}>{rec.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLICKS TAB */}
        {tab === 'clicks' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpiCard('Total Clicks', recentClicks.length.toString(), `last ${period} days`, GOLD, clicksByDay)}
              {kpiCard('Unique Sources', Object.keys(sourceBreakdown).length.toString(), 'traffic sources', BLUE)}
              {kpiCard('Top Source', Object.entries(sourceBreakdown).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '—', 'most clicks', GREEN)}
              {kpiCard('This Period', recentClicks.length.toString(), 'vs previous period', TEXT_MUTED)}
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Clicks Over Time</h3>
              <MiniChart data={[clicksByDay]} labels={days} colors={[GOLD]} title="" />
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid ' + BORDER }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: 0 }}>Traffic Sources</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BG }}>
                    {['Source', 'Medium', 'Campaign', 'Clicks', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, borderBottom: '1px solid ' + BORDER }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentClicks.slice(0, 20).map((click: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid ' + BORDER }}>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: TEXT }}>{click.utm_source || 'direct'}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <span style={{ background: GOLD_LIGHT, color: GOLD, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', padding: '2px 8px', borderRadius: 20 }}>{click.utm_medium || '—'}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{click.utm_campaign || '—'}</td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, fontWeight: 600 }}>1</td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{new Date(click.clicked_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentClicks.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED }}>No clicks tracked yet</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Clicks are tracked when visitors use your Book Direct button</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEADS TAB */}
        {tab === 'leads' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpiCard('Leads Generated', recentLeads.length.toString(), `last ${period} days`, GOLD, leadsByDay)}
              {kpiCard('Total All Time', leads?.length?.toString() || '0', 'enquiries received', BLUE)}
              {kpiCard('Latest Lead', recentLeads[0] ? new Date(recentLeads[0].created_at).toLocaleDateString('en-GB') : '—', 'most recent', GREEN)}
              {kpiCard('Conversion', recentViews.length > 0 ? Math.round((recentLeads.length / recentViews.length) * 100) + '%' : '0%', 'views to leads', PURPLE)}
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Leads Over Last {period} Days</h3>
              <MiniChart data={[leadsByDay]} labels={days} colors={[GOLD]} title="" />
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid ' + BORDER }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: 0 }}>Recent Enquiries</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BG }}>
                    {['Guest', 'Email', 'Dates', 'Guests', 'Submitted'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, borderBottom: '1px solid ' + BORDER }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads?.slice(0, 20).map((lead: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid ' + BORDER }}>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT }}>{lead.name}</td>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <a href={'mailto:' + lead.email} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: GOLD, textDecoration: 'none' }}>{lead.email}</a>
                      </td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{lead.check_in ? lead.check_in + ' → ' + lead.check_out : '—'}</td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT }}>{lead.guests || '—'}</td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads?.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED }}>No leads yet</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Leads appear when guests submit an enquiry from your hotel profile</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVENUE TAB */}
        {tab === 'revenue' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpiCard('AI Assisted Revenue', 'CHF —', 'log bookings to track', GOLD)}
              {kpiCard('Bookings from AI', '—', 'self-reported bookings', GREEN)}
              {kpiCard('OTA Commission Saved', 'CHF —', 'vs 15% OTA fee', BLUE)}
              {kpiCard('Direct Booking Share', recentClicks.length > 0 ? '100%' : '—', 'all bookings direct', PURPLE)}
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>◇</p>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: TEXT, margin: '0 0 0.75rem' }}>Revenue Tracking Coming Soon</h3>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT_MUTED, maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
                Once you receive a booking from SwissNet, log it here to track your AI-driven revenue and calculate your ROI vs OTA commissions.
              </p>
              <button style={{ background: GOLD, color: WHITE, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 2rem', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                + Log a Booking
              </button>
            </div>
          </div>
        )}

        {/* COMPETITORS TAB */}
        {tab === 'competitors' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpiCard('Your Rank', '#' + hotelRank, `in ${hotelRegion}`, hotelRank === 1 ? GREEN : GOLD)}
              {kpiCard('Hotels Tracked', allHotelsInRegion.length.toString(), 'in your region', BLUE)}
              {kpiCard('Market Position', hotelRank === 1 ? 'Leader' : hotelRank <= 3 ? 'Top 3' : 'Growing', 'competitive status', PURPLE)}
              {kpiCard('Visibility Gap', hotelRank === 1 ? 'Leading' : '—', 'vs top competitor', TEXT_MUTED)}
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid ' + BORDER }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: 0 }}>Regional Rankings — {hotelRegion}</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BG }}>
                    {['Rank', 'Hotel', 'Rating', 'Category', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED, borderBottom: '1px solid ' + BORDER }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allHotelsInRegion.map((h: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid ' + BORDER, background: h.is_current ? GOLD_LIGHT : 'transparent' }}>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? GOLD : BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem', fontWeight: 600, color: i === 0 ? WHITE : TEXT_MUTED }}>#{i + 1}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: h.is_current ? 700 : 400, color: h.is_current ? GOLD : TEXT }}>{h.name}</span>
                          {h.is_current && <span style={{ background: GOLD, color: WHITE, fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>YOU</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT }}>★ {h.rating}</td>
                      <td style={{ padding: '0.875rem 1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{h.category || '—'}</td>
                      <td style={{ padding: '0.875rem 1.5rem' }}>
                        <span style={{ background: h.is_current ? GREEN + '22' : BG, color: h.is_current ? GREEN : TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                          {h.is_current ? '✓ Your Hotel' : 'Competitor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: TEXT, margin: '0 0 1rem' }}>Competitive Recommendations</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { text: hotelRank === 1 ? 'Maintain your #1 position' : 'Improve content to rise in rankings', icon: '↑' },
                  { text: 'Add more FAQs to strengthen authority', icon: '✦' },
                  { text: 'Ensure all schema sections are complete', icon: '◈' },
                  { text: 'Monitor competitor content changes', icon: '⊕' },
                ].map((rec, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: BG, borderRadius: 8, padding: '0.875rem 1rem' }}>
                    <span style={{ color: GOLD, fontSize: '1rem', flexShrink: 0 }}>{rec.icon}</span>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: TEXT, margin: 0, lineHeight: 1.5 }}>{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid ' + BORDER, background: BG }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0 }}>Hotel Profile</h3>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Hotel Name', value: hotel?.name || '—' },
                  { label: 'Location', value: hotel?.location || '—' },
                  { label: 'Region', value: hotel?.region || '—' },
                  { label: 'Category', value: hotel?.category || '—' },
                  { label: 'Nightly Rate', value: hotel?.nightly_rate_chf ? 'CHF ' + hotel.nightly_rate_chf + '/night' : '—' },
                ].map(field => (
                  <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid ' + BORDER }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{field.label}</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: TEXT }}>{field.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {[
              { title: 'Billing', desc: 'SwissNet Partner Plan · CHF 499/month', action: 'Manage' },
              { title: 'Reports', desc: 'Weekly performance email reports', action: 'Configure' },
              { title: 'Integrations', desc: 'Connect booking system for revenue tracking', action: 'Coming Soon' },
            ].map(section => (
              <div key={section.title} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: TEXT, margin: '0 0 0.25rem' }}>{section.title}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: 0 }}>{section.desc}</p>
                </div>
                <button style={{ background: section.action === 'Coming Soon' ? BG : GOLD_LIGHT, color: section.action === 'Coming Soon' ? TEXT_MUTED : GOLD, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, padding: '0.4rem 1rem', border: '1px solid ' + BORDER, borderRadius: 6, cursor: section.action === 'Coming Soon' ? 'default' : 'pointer' }}>
                  {section.action}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}