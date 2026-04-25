'use client'
import { useState } from 'react'
import { Hotel } from '@/types/hotel'

export default function LeadForm({ hotel }: { hotel?: Hotel }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', check_in: '', check_out: '', guests: '2', message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const gold = '#C9A84C'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const border = 'rgba(201,169,110,0.25)'
  const bg = '#FFFFFF'

  const inputStyle = {
    width: '100%', background: '#FAFAF8', border: '1px solid ' + border,
    color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem',
    padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem',
    letterSpacing: '0.15em', textTransform: 'uppercase' as const,
    color: textMuted, marginBottom: '0.5rem',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, guests: parseInt(form.guests), hotel_id: hotel?.id, hotel_name: hotel?.name })
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', phone: '', check_in: '', check_out: '', guests: '2', message: '' })
      } else setStatus('error')
    } catch { setStatus('error') }
  }

  if (status === 'success') {
    return (
      <div style={{ background: '#FAFAF8', border: '1px solid ' + border, padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ color: gold, fontSize: '2rem', marginBottom: '1rem' }}>✓</div>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: text, marginBottom: '0.5rem' }}>Enquiry Received</h3>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted }}>
          {hotel ? `The ${hotel.name} team` : 'Our team'} will contact you within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: bg, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="Alexandra Smith" />
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inputStyle} placeholder="alex@example.com" />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={inputStyle} placeholder="+44 7700 900000" />
        </div>
        <div>
          <label style={labelStyle}>Guests</label>
          <select value={form.guests} onChange={e => setForm({...form, guests: e.target.value})} style={{ ...inputStyle, background: '#FAFAF8' }}>
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Check In</label>
          <input type="date" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Check Out</label>
          <input type="date" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Special Requests</label>
        <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Anniversary, dietary requirements, room preferences..." />
      </div>

      {status === 'error' && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#dc2626' }}>Something went wrong. Please try again.</p>}

      <button type="submit" disabled={status === 'loading'} style={{
        background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif',
        fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
        padding: '1rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s',
      }}>
        {status === 'loading' ? 'Sending...' : 'Send Enquiry'}
      </button>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, textAlign: 'center', margin: 0 }}>No booking fees. Direct communication with the hotel.</p>
    </form>
  )
}