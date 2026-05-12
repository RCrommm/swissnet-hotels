'use client'
import { useState } from 'react'

export default function GoogleAITab({ hotels }: { hotels: any[] }) {
  const [selectedHotel, setSelectedHotel] = useState('')
  const [query, setQuery] = useState('')
  const [appeared, setAppeared] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!selectedHotel || !query || appeared === null) {
      setError('Please fill all fields')
      return
    }
    setSaving(true)
    setError('')
    const hotel = hotels.find(h => h.id === selectedHotel)
    const res = await fetch('/api/google-ai-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_id: selectedHotel, hotel_name: hotel?.name, query, appeared })
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setQuery('')
      setAppeared(null)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Failed to save — try again')
    }
  }

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Log Google AI Appearance</h2>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#a8a29e', marginBottom: 20, lineHeight: 1.6 }}>Search each query on Google and check if the hotel appears in the AI Overview. Log the result here.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Hotel</label>
            <select value={selectedHotel} onChange={e => setSelectedHotel(e.target.value)} style={{ width: '100%', border: '1px solid #e7e5e4', borderRadius: 4, padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#3D2B1F', background: '#fff' }}>
              <option value="">Select hotel...</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Query Searched</label>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. best luxury hotel Geneva" style={{ width: '100%', border: '1px solid #e7e5e4', borderRadius: 4, padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#3D2B1F', background: '#fff', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>Did the hotel appear in Google AI Overview?</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setAppeared(true)} style={{ padding: '8px 24px', borderRadius: 4, border: '1px solid ' + (appeared === true ? '#16a34a' : '#e7e5e4'), background: appeared === true ? 'rgba(22,163,74,0.1)' : '#fff', color: appeared === true ? '#16a34a' : '#78716c', fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✓ Yes — Appeared</button>
            <button onClick={() => setAppeared(false)} style={{ padding: '8px 24px', borderRadius: 4, border: '1px solid ' + (appeared === false ? '#dc2626' : '#e7e5e4'), background: appeared === false ? 'rgba(220,38,38,0.1)' : '#fff', color: appeared === false ? '#dc2626' : '#78716c', fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✗ No — Did Not Appear</button>
          </div>
        </div>
        {error && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</p>}
        {saved && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#16a34a', marginBottom: 12 }}>✓ Saved successfully</p>}
        <button onClick={handleSave} disabled={saving} style={{ background: '#C9A84C', color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '10px 24px', border: 'none', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Log Result →'}</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px' }}>
        <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>How to check Google AI Overviews</h3>
        <ol style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#a8a29e', lineHeight: 2, margin: 0, paddingLeft: 20 }}>
          <li>Open Google.com in an incognito window</li>
          <li>Search the query exactly as written</li>
          <li>Look for the "AI Overview" box at the top of results</li>
          <li>Check if the hotel name appears in that box</li>
          <li>Log the result above</li>
        </ol>
      </div>
    </div>
  )
}
