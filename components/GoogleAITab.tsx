'use client'
import { useState } from 'react'

const BASE_QUERIES = [
  'best luxury hotel',
  'best spa hotel',
  'best romantic hotel',
  'best hotel on the lake',
  'best 5 star hotel',
  'best boutique hotel',
  'best hotel for couples',
  'best lakeside hotel',
  'luxury hotel with spa',
  'best hotel lake view',
  'most exclusive hotel',
  'best wellness hotel',
  'best fine dining hotel',
  'best hotel for honeymoon',
  'top luxury hotel',
  'best family hotel',
  'best hotel with pool',
  'best hotel with tennis',
  'best hotel for kids',
]

function getQueries(region: string) {
  return BASE_QUERIES.map(q => `${q} ${region}`)
}

export default function GoogleAITab({ hotels }: { hotels: any[] }) {
  const [selectedHotel, setSelectedHotel] = useState('')
  const [results, setResults] = useState<Record<string, boolean | null>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const hotel = hotels.find(h => h.id === selectedHotel)
  const region = hotel?.region || ''
  const queries = region ? getQueries(region) : []
  const answered = Object.keys(results).length
  const allAnswered = queries.length > 0 && answered === queries.length
  const score = allAnswered
    ? Math.round((Object.values(results).filter(Boolean).length / queries.length) * 100)
    : null

  const handleToggle = (query: string, value: boolean) => {
    setResults(prev => ({ ...prev, [query]: value }))
  }

  const handleSave = async () => {
    if (!selectedHotel) { setError('Select a hotel first'); return }
    if (!allAnswered) { setError('Answer all queries first'); return }
    setSaving(true)
    setError('')
    const promises = queries.map(query =>
      fetch('/api/google-ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: selectedHotel, hotel_name: hotel?.name, query, appeared: results[query] })
      })
    )
    await Promise.all(promises)
    setSaving(false)
    setSaved(true)
    setResults({})
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Log Google AI Appearance</h2>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#a8a29e', marginBottom: 20, lineHeight: 1.6 }}>Search each query in Google incognito and click Yes/No. Save when all 15 are answered.</p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Hotel</label>
          <select value={selectedHotel} onChange={e => { setSelectedHotel(e.target.value); setResults({}) }} style={{ width: '100%', border: '1px solid #e7e5e4', borderRadius: 4, padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#3D2B1F', background: '#fff' }}>
            <option value="">Select hotel...</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name} — {h.region}</option>)}
          </select>
        </div>

        {selectedHotel && region && (
          <>
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 4, display: 'inline-block' }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#78716c' }}>Queries for region: <strong style={{ color: '#C9A84C' }}>{region}</strong></span>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 4, background: '#f5f5f4', borderRadius: 2 }}>
                <div style={{ height: 4, background: '#C9A84C', borderRadius: 2, width: `${(answered / queries.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#78716c', whiteSpace: 'nowrap' }}>{answered} / {queries.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {queries.map((query, i) => (
                <div key={query} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e7e5e4', borderRadius: 6, background: results[query] === true ? 'rgba(22,163,74,0.04)' : results[query] === false ? 'rgba(220,38,38,0.04)' : '#fafaf9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#a8a29e', width: 16 }}>{i + 1}.</span>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#3D2B1F', textDecoration: 'none', borderBottom: '1px dashed #e7e5e4' }}>{query}</a>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleToggle(query, true)} style={{ padding: '4px 14px', borderRadius: 4, border: '1px solid ' + (results[query] === true ? '#16a34a' : '#e7e5e4'), background: results[query] === true ? 'rgba(22,163,74,0.1)' : '#fff', color: results[query] === true ? '#16a34a' : '#78716c', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ Yes</button>
                    <button onClick={() => handleToggle(query, false)} style={{ padding: '4px 14px', borderRadius: 4, border: '1px solid ' + (results[query] === false ? '#dc2626' : '#e7e5e4'), background: results[query] === false ? 'rgba(220,38,38,0.1)' : '#fff', color: results[query] === false ? '#dc2626' : '#78716c', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✗ No</button>
                  </div>
                </div>
              ))}
            </div>

            {allAnswered && (
              <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 6, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#78716c' }}>Google AI Score for {hotel?.name}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: score! >= 60 ? '#16a34a' : score! >= 30 ? '#C9A84C' : '#dc2626' }}>{score}%</span>
              </div>
            )}

            {error && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</p>}
            {saved && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#16a34a', marginBottom: 12 }}>✓ Saved successfully</p>}
            <button onClick={handleSave} disabled={saving || !allAnswered} style={{ background: allAnswered ? '#C9A84C' : '#e7e5e4', color: allAnswered ? '#1a0e06' : '#a8a29e', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '10px 24px', border: 'none', borderRadius: 4, cursor: allAnswered ? 'pointer' : 'not-allowed' }}>{saving ? 'Saving...' : 'Save All Results →'}</button>
          </>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px' }}>
        <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>How to check Google AI Overviews</h3>
        <ol style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#a8a29e', lineHeight: 2, margin: 0, paddingLeft: 20 }}>
          <li>Select a hotel above — queries will update for that hotel's region automatically</li>
          <li>Click each query link to open it directly in Google</li>
          <li>Look for the "AI Overview" box at the top of results</li>
          <li>Check if the hotel name appears in that box</li>
          <li>Click Yes or No, then Save All Results</li>
        </ol>
      </div>
    </div>
  )
}