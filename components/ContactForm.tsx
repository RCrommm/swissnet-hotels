'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    hotel_name: '',
    phone: '',
    enquiry_type: 'demo',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const gold = '#C9A84C'
  const text = '#FFFFFF'
  const textMuted = 'rgba(255,255,255,0.6)'
  const border = 'rgba(201,169,110,0.3)'

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid ' + border,
    color: text,
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.8rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.6rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: textMuted,
    marginBottom: '0.5rem',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', hotel_name: '', phone: '', enquiry_type: 'demo', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: gold, fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: text, marginBottom: '0.5rem' }}>Message Received</h3>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted }}>
          We'll get back to you within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="John Smith" />
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="john@hotel.com" />
        </div>
        <div>
          <label style={labelStyle}>Hotel Name</label>
          <input type="text" value={form.hotel_name} onChange={e => setForm({ ...form, hotel_name: e.target.value })} style={inputStyle} placeholder="Grand Hotel Zermatt" />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+41 79 000 0000" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>I want to</label>
        <select value={form.enquiry_type} onChange={e => setForm({ ...form, enquiry_type: e.target.value })}
          style={{ ...inputStyle, background: 'rgba(255,255,255,0.06)' }}>
          <option value="demo">Book a Demo</option>
          <option value="join">Join the Platform</option>
          <option value="question">Ask a Question</option>
          <option value="partnership">Discuss a Partnership</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Message</label>
        <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
          style={{ ...inputStyle, resize: 'none' }}
          placeholder="Tell us about your hotel and what you're looking for..." />
      </div>

      {status === 'error' && (
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#fca5a5' }}>Something went wrong. Please try again.</p>
      )}

      <button type="submit" disabled={status === 'loading'} style={{
        background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif',
        fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
        padding: '1rem', border: 'none', cursor: 'pointer', transition: 'background 0.2s',
      }}>
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted, textAlign: 'center', margin: 0 }}>
        We respond within 24 hours.
      </p>
    </form>
  )
}