'use client'
import { useState } from 'react'
import { Hotel } from '@/types/hotel'

export default function LeadForm({ hotel }: { hotel?: Hotel }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    check_in: '',
    check_out: '',
    guests: '2',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          guests: parseInt(form.guests),
          hotel_id: hotel?.id,
          hotel_name: hotel?.name,
        })
      })
      
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', phone: '', check_in: '', check_out: '', guests: '2', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="font-display text-xl font-bold text-green-800 mb-2">Enquiry Received</h3>
        <p className="text-green-700 text-sm">
          {hotel ? `The ${hotel.name} team` : 'Our team'} will contact you within 24 hours with availability and pricing.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1.5">Full Name *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 transition-colors"
            placeholder="Alexandra Smith"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1.5">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="w-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 transition-colors"
            placeholder="alex@example.com"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            className="w-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 transition-colors"
            placeholder="+44 7700 900000"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1.5">Guests</label>
          <select
            value={form.guests}
            onChange={e => setForm({...form, guests: e.target.value})}
            className="w-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 transition-colors bg-white"
          >
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1.5">Check In</label>
          <input
            type="date"
            value={form.check_in}
            onChange={e => setForm({...form, check_in: e.target.value})}
            className="w-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1.5">Check Out</label>
          <input
            type="date"
            value={form.check_out}
            onChange={e => setForm({...form, check_out: e.target.value})}
            className="w-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 transition-colors"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1.5">Special Requests</label>
        <textarea
          value={form.message}
          onChange={e => setForm({...form, message: e.target.value})}
          rows={3}
          className="w-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-700 transition-colors resize-none"
          placeholder="Anniversary, dietary requirements, room preferences..."
        />
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">Something went wrong. Please try again or email us directly.</p>
      )}

      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full py-4 text-sm">
        {status === 'loading' ? 'Sending...' : 'Send Enquiry'}
      </button>
      <p className="text-xs text-stone-400 text-center">No booking fees. Direct communication with the hotel.</p>
    </form>
  )
}