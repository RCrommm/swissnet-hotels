'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FaqReviewTab() {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [note, setNote] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('hotel_faq_suggestions').select('*').order('created_at', { ascending: false }).then(({ data }) => setSuggestions(data || []))
  }, [])

  const review = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('hotel_faq_suggestions').update({ status, admin_note: note[id] || null, reviewed_at: new Date().toISOString() }).eq('id', id)
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status, admin_note: note[id] || null } : s))
  }

  const pending = suggestions.filter(s => s.status === 'pending')
  const reviewed = suggestions.filter(s => s.status !== 'pending')

  const pageLabels: Record<string, string> = { hotel: 'Overview', rooms: 'Rooms', dining: 'Dining', spa: 'Spa', experiences: 'Experiences' }

  return (
    <div>
      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 700, color: '#78716c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
        FAQ Suggestions — {pending.length} pending
      </h2>

      {pending.length === 0 && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#a8a29e' }}>No pending suggestions.</p>}

      {pending.map(s => (
        <div key={s.id} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, color: '#C9A84C', background: '#C9A84C15', padding: '2px 8px', borderRadius: 10 }}>{s.hotel_name}</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#78716c', background: '#f5f5f4', padding: '2px 8px', borderRadius: 10 }}>{pageLabels[s.page_type] || s.page_type}</span>
            </div>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#a8a29e' }}>{new Date(s.created_at).toLocaleDateString('en-GB')}</span>
          </div>
          {s.target_query && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#C9A84C', margin: '0 0 6px' }}>Target: "{s.target_query}"</p>}
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: '#2A1A0E', margin: '0 0 4px' }}>Q: {s.question}</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#78716c', margin: '0 0 12px', lineHeight: 1.6 }}>A: {s.answer}</p>
          <input placeholder="Admin note (optional)" value={note[s.id] || ''} onChange={e => setNote(prev => ({ ...prev, [s.id]: e.target.value }))}
            style={{ width: '100%', border: '1px solid #e7e5e4', borderRadius: 4, padding: '6px 10px', fontFamily: 'Montserrat, sans-serif', fontSize: 12, marginBottom: 10, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => review(s.id, 'approved')} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
            <button onClick={() => review(s.id, 'rejected')} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
          </div>
        </div>
      ))}

      {reviewed.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#a8a29e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Previously Reviewed</h3>
          {reviewed.map(s => (
            <div key={s.id} style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 6, padding: '12px 16px', marginBottom: 8, opacity: 0.7 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, color: s.status === 'approved' ? '#16a34a' : '#dc2626', textTransform: 'uppercase' }}>{s.status}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#a8a29e' }}>{s.hotel_name} · {pageLabels[s.page_type]}</span>
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#78716c', margin: 0 }}>{s.question}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}