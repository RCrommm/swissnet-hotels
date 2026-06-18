'use client'
import { useState } from 'react'

export default function UsersTab({ users, hotels }: { users: any[]; hotels: any[] }) {
  const [rows, setRows] = useState(users)
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [addPicks, setAddPicks] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string>('')

  const hotelName = (id: string) => hotels.find(h => h.id === id)?.name || '—'

  const approve = async (id: string) => {
    const hotel_id = picks[id]
    if (!hotel_id) { alert('Pick a hotel first'); return }
    setBusy(id)
    const res = await fetch('/api/admin-approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, hotel_id }),
    })
    setBusy('')
    if (res.ok) setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', hotel_id } : r))
    else alert('Approve failed — check you are logged into admin')
  }

  const addHotel = async (user_id: string, email: string, rowKey: string) => {
    const hotel_id = addPicks[rowKey]
    if (!hotel_id) { alert('Pick a hotel first'); return }
    setBusy(rowKey)
    const res = await fetch('/api/admin-approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, email, hotel_id }),
    })
    setBusy('')
    if (res.ok) {
      setRows(prev => [...prev, { id: 'new-' + Date.now(), user_id, email, hotel_id, status: 'approved', created_at: new Date().toISOString() }])
      setAddPicks(p => ({ ...p, [rowKey]: '' }))
    } else alert('Add failed')
  }

  const pending = rows.filter(r => r.status !== 'approved' || !r.hotel_id)
  const approved = rows.filter(r => r.status === 'approved' && r.hotel_id)

  // Group approved rows by user (a user can now have multiple hotels)
  const byUser: Record<string, any[]> = {}
  for (const r of approved) {
    const k = r.user_id || r.email || r.id
    if (!byUser[k]) byUser[k] = []
    byUser[k].push(r)
  }

  const th: any = { textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.08em' }
  const td: any = { padding: '12px 16px', fontSize: 13, color: '#3D2B1F' }
  const sel: any = { padding: '6px 10px', border: '1px solid #d6d3d1', borderRadius: 4, fontSize: 13 }
  const btn: any = { background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }

  return (
    <div>
      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
        Pending approval ({pending.length})
      </h2>
      <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, overflow: 'hidden', marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
            <th style={th}>Email</th><th style={th}>Signed up</th><th style={th}>Assign hotel</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {pending.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                <td style={td}>{r.email || '—'}</td>
                <td style={td}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '—'}</td>
                <td style={td}>
                  <select value={picks[r.id] || ''} onChange={e => setPicks(p => ({ ...p, [r.id]: e.target.value }))} style={sel}>
                    <option value="">Select hotel…</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </td>
                <td style={td}>
                  <button onClick={() => approve(r.id)} disabled={busy === r.id} style={btn}>{busy === r.id ? 'Approving…' : 'Approve'}</button>
                </td>
              </tr>
            ))}
            {pending.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#a8a29e', padding: 32 }}>No pending signups.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
        Active users ({Object.keys(byUser).length})
      </h2>
      <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#fafaf9', borderBottom: '1px solid #e7e5e4' }}>
            <th style={th}>Email</th><th style={th}>Hotels</th><th style={th}>Add hotel</th>
          </tr></thead>
          <tbody>
            {Object.entries(byUser).map(([k, list]) => {
              const first = list[0]
              return (
                <tr key={k} style={{ borderBottom: '1px solid #f5f5f4' }}>
                  <td style={td}>{first.email || '—'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {list.map(l => (
                        <span key={l.id} style={{ background: '#f5f5f4', borderRadius: 12, padding: '3px 10px', fontSize: 12 }}>{hotelName(l.hotel_id)}</span>
                      ))}
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select value={addPicks[k] || ''} onChange={e => setAddPicks(p => ({ ...p, [k]: e.target.value }))} style={sel}>
                        <option value="">Add hotel…</option>
                        {hotels.filter(h => !list.some(l => l.hotel_id === h.id)).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                      <button onClick={() => addHotel(first.user_id, first.email, k)} disabled={busy === k} style={{ ...btn, padding: '6px 12px' }}>{busy === k ? '…' : '+ Add'}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {Object.keys(byUser).length === 0 && <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: '#a8a29e', padding: 32 }}>No active users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
