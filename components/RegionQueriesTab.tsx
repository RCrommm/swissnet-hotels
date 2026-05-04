'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const REGIONS = ['Geneva','Zurich','Zermatt','St. Moritz','Gstaad','Verbier','Interlaken','Bern','Crans-Montana','Davos','Flims','Andermatt','Lucerne','Lugano','Ascona','Montreux','Grindelwald','Engelberg','Basel','Lausanne']

const gold = '#C9A84C'
const border = 'rgba(201,169,110,0.2)'
const text = '#2A1A0E'
const textMuted = 'rgba(42,26,14,0.45)'
const bg = '#F8F5EF'

export default function RegionQueriesTab() {
  const [region, setRegion] = useState('Zermatt')
  const [queries, setQueries] = useState<any[]>([])
  const [newQuery, setNewQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  const inp: React.CSSProperties = {
    background: '#fff', border: '1px solid ' + border, borderRadius: 6,
    padding: '8px 12px', color: text, fontSize: 13, outline: 'none',
    fontFamily: 'Montserrat, sans-serif', width: '100%', boxSizing: 'border-box',
  }

  const fetchQueries = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('region_queries')
      .select('*')
      .eq('region', region)
      .order('created_at')
    setQueries(data || [])
    setLoading(false)
  }, [region])

  useEffect(() => { fetchQueries() }, [fetchQueries])

  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const addQuery = async () => {
    const q = newQuery.trim()
    if (!q) return
    if (queries.find(x => x.query === q)) return showMsg('error', 'Already exists')
    const { error } = await supabase.from('region_queries').insert({ region, query: q, is_active: true })
    if (error) showMsg('error', error.message)
    else { showMsg('success', 'Added!'); setNewQuery(''); fetchQueries() }
  }

  const deleteQuery = async (id: string) => {
    await supabase.from('region_queries').delete().eq('id', id)
    fetchQueries()
  }

  const toggleQuery = async (id: string, current: boolean) => {
    await supabase.from('region_queries').update({ is_active: !current }).eq('id', id)
    fetchQueries()
  }

  const runCompetitorForRegion = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/cron/competitor-visibility?force=true&region=' + encodeURIComponent(region))
      const data = await res.json()
      setRunResult(`✓ Done — ${data.total_appearances || 0} appearances across ${data.regions_checked || 1} region`)
    } catch {
      setRunResult('✗ Error running competitor queries')
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

      <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 12, color: textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>Region:</span>
          <select value={region} onChange={e => setRegion(e.target.value)} style={{ ...inp, width: 'auto', flex: 1, maxWidth: 240 }}>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {runResult && <span style={{ fontSize: 12, color: '#16a34a' }}>{runResult}</span>}
          <span style={{ fontSize: 12, color: textMuted }}>{queries.filter(q => q.is_active).length} active queries</span>
          <button onClick={runCompetitorForRegion} disabled={running}
            style={{ background: running ? bg : gold, color: running ? textMuted : '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer' }}>
            {running ? 'Running...' : '▶ Run ' + region}
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '20px' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: text, margin: '0 0 16px' }}>
          Queries for {region} — {queries.length} total
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input style={{ ...inp, flex: 1 }} value={newQuery} onChange={e => setNewQuery(e.target.value)}
            placeholder="Add a new query..." onKeyDown={e => e.key === 'Enter' && addQuery()} />
          <button onClick={addQuery}
            style={{ background: gold, color: '#1a0e06', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Add
          </button>
        </div>
        {loading ? (
          <p style={{ fontSize: 13, color: textMuted, textAlign: 'center', padding: '20px 0' }}>Loading...</p>
        ) : queries.length === 0 ? (
          <p style={{ fontSize: 13, color: textMuted, textAlign: 'center', padding: '20px 0' }}>No queries for {region} yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queries.map(q => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: q.is_active ? 'rgba(201,169,110,0.06)' : bg, border: '1px solid ' + border, borderRadius: 6, opacity: q.is_active ? 1 : 0.5 }}>
                <input type="checkbox" checked={q.is_active} onChange={() => toggleQuery(q.id, q.is_active)} style={{ accentColor: gold, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: text, lineHeight: 1.4 }}>{q.query}</span>
                <button onClick={() => deleteQuery(q.id)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', padding: '2px 6px', flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}