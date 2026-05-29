'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PARTNER_REGIONS = ['Geneva', 'Zermatt', 'Zurich', 'Interlaken', 'Bern', 'Flims', 'Crans-Montana', 'Davos']

const CATEGORIES = [
  { key: 'spa', label: 'Spa & Wellness' },
  { key: 'ski', label: 'Ski Resort' },
  { key: 'dining', label: 'Fine Dining' },
  { key: 'romantic', label: 'Romantic' },
  { key: 'lake', label: 'Lake Hotel' },
  { key: 'business', label: 'Business' },
  { key: 'family', label: 'Family' },

]

export default function AIVisibilityQueries({ hotels }: { hotels: any[] }) {
  const [selectedRegion, setSelectedRegion] = useState('Geneva')
  const [regionQueries, setRegionQueries] = useState<any[]>([])
  const [newRegionQuery, setNewRegionQuery] = useState('')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [selectedCat, setSelectedCat] = useState('spa')
  const [catQueries, setCatQueries] = useState<any[]>([])
  const [catQuery, setCatQuery] = useState('')
  const [catMsg, setCatMsg] = useState('')

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bg = '#F8F5EF'

  const inp: React.CSSProperties = {
    background: '#fff', border: '1px solid ' + border, borderRadius: 6,
    padding: '8px 12px', color: text, fontSize: 13, outline: 'none',
    fontFamily: 'Montserrat, sans-serif', width: '100%', boxSizing: 'border-box',
  }

  const fetchRegionQueries = useCallback(async () => {
    const { data } = await supabase
      .from('region_queries')
      .select('*')
      .eq('region', selectedRegion)
      .eq('is_active', true)
      .order('created_at')
    setRegionQueries(data || [])
  }, [selectedRegion])

  useEffect(() => { fetchRegionQueries() }, [fetchRegionQueries])

  const fetchCatQueries = useCallback(async () => {
    const { data } = await supabase
      .from('category_queries')
      .select('*')
      .eq('category', selectedCat)
      .order('created_at')
    setCatQueries(data || [])
  }, [selectedCat])

  useEffect(() => { fetchCatQueries() }, [fetchCatQueries])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const addRegionQuery = async (q: string) => {
    if (!q.trim()) return
    const { error } = await supabase.from('region_queries').insert({
      region: selectedRegion,
      query: q.trim(),
      is_active: true,
    })
    if (error) showMsg('error', error.message)
    else { showMsg('success', 'Query added'); setNewRegionQuery(''); fetchRegionQueries() }
  }

  const deleteRegionQuery = async (id: string) => {
    await supabase.from('region_queries').delete().eq('id', id)
    fetchRegionQueries()
  }

  const runOverview = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch(`/api/cron/ai-visibility?region=${selectedRegion}&force=true`)
      const data = await res.json()
      setRunResult(`✓ Done — ${data.total_appearances || 0} appearances · $${data.estimated_cost_usd || '0.000'}`)
    } catch {
      setRunResult('✗ Error running overview')
    }
    setRunning(false)
  }

  const addCatQuery = async () => {
    if (!catQuery.trim()) return
    await supabase.from('category_queries').insert({ category: selectedCat, query: catQuery.trim(), is_active: true })
    setCatQuery('')
    await fetchCatQueries()
  }

  const toggleCatQuery = async (id: string, current: boolean) => {
    await supabase.from('category_queries').update({ is_active: !current }).eq('id', id)
    fetchCatQueries()
  }

  const deleteCatQuery = async (id: string) => {
    await supabase.from('category_queries').delete().eq('id', id)
    fetchCatQueries()
  }

  const runCategory = async (category?: string) => {
    setRunning(true)
    setCatMsg('')
    try {
      const cat = category || selectedCat
      const res = await fetch(`/api/cron/competitor-visibility?type=category&category=${cat}&region=${selectedRegion}&force=true`)
      const data = await res.json()
      setCatMsg(`✓ Done — ${data.total_appearances || 0} appearances · $${data.estimated_cost_usd || '0.000'}`)
    } catch {
      setCatMsg('✗ Error running category check')
    }
    setRunning(false)
  }

  return (
    <div>
      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: msg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          color: msg.type === 'success' ? '#16a34a' : '#dc2626' }}>
          {msg.text}
        </div>
      )}

      {/* ── OVERVIEW QUERIES ── */}
      <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: '0 0 4px' }}>Overview Queries</p>
            <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>General region queries · Powers Overview competitor tab</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {runResult && <span style={{ fontSize: 12, color: '#16a34a' }}>{runResult}</span>}
            <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
              style={{ ...inp, width: 'auto' }}>
              {PARTNER_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={runOverview} disabled={running}
              style={{ background: running ? bg : gold, color: running ? textMuted : '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
              {running ? 'Running...' : `▶ Run ${selectedRegion} Overview`}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input style={{ ...inp, flex: 1 }} value={newRegionQuery}
            onChange={e => setNewRegionQuery(e.target.value)}
            placeholder="Add a new overview query..."
            onKeyDown={e => e.key === 'Enter' && addRegionQuery(newRegionQuery)} />
          <button onClick={() => addRegionQuery(newRegionQuery)}
            style={{ background: gold, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Add
          </button>
        </div>

        {regionQueries.length === 0 ? (
          <p style={{ fontSize: 13, color: textMuted, textAlign: 'center', padding: '20px 0' }}>No queries for {selectedRegion}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {regionQueries.map((q: any) => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(201,169,110,0.06)', border: '1px solid ' + border, borderRadius: 6 }}>
                <span style={{ flex: 1, fontSize: 12, color: text }}>{q.query}</span>
                <button onClick={() => deleteRegionQuery(q.id)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', padding: '2px 6px' }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: textMuted, margin: '12px 0 0' }}>
          {regionQueries.length} queries · ~${(regionQueries.length * 0.03).toFixed(2)}/run
        </p>
      </div>

      {/* ── CATEGORY QUERIES ── */}
      <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: '0 0 4px' }}>Category Queries</p>
            <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>Generic queries · Region appended at runtime · Powers category tabs</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => runCategory(selectedCat)} disabled={running}
              style={{ background: gold, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: running ? 0.7 : 1, whiteSpace: 'nowrap' }}>
              {running ? 'Running...' : `▶ Run ${CATEGORIES.find(c => c.key === selectedCat)?.label} — ${selectedRegion}`}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setSelectedCat(c.key)}
              style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 4, cursor: 'pointer', border: '1px solid ' + (selectedCat === c.key ? text : border), background: selectedCat === c.key ? text : '#fff', color: selectedCat === c.key ? '#fff' : textMuted }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={catQuery} onChange={e => setCatQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCatQuery()}
            placeholder={`e.g. best ${selectedCat} hotel`}
            style={{ ...inp, flex: 1 }} />
          <button onClick={addCatQuery}
            style={{ background: gold, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Add
          </button>
        </div>

        {catMsg && (
          <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, background: catMsg.startsWith('✓') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: catMsg.startsWith('✓') ? '#16a34a' : '#dc2626' }}>
            {catMsg}
          </div>
        )}

        {catQueries.length === 0 ? (
          <p style={{ fontSize: 13, color: textMuted, textAlign: 'center', padding: '20px 0' }}>No queries for this category</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {catQueries.map((q: any) => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: q.is_active ? 'rgba(201,169,110,0.06)' : bg, border: '1px solid ' + border, borderRadius: 6, opacity: q.is_active ? 1 : 0.5 }}>
                <input type="checkbox" checked={q.is_active} onChange={() => toggleCatQuery(q.id, q.is_active)} style={{ accentColor: gold, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: text }}>{q.query} <span style={{ color: textMuted }}>→ {q.query} {selectedRegion}</span></span>
                <button onClick={() => deleteCatQuery(q.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', padding: '2px 6px' }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: textMuted, margin: '12px 0 0' }}>
          {catQueries.filter((q: any) => q.is_active).length} active · Preview: "{catQueries[0]?.query} {selectedRegion}"
        </p>
      </div>
    </div>
  )
}