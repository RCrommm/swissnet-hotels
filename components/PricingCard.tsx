'use client'
import { useState } from 'react'

export default function PricingCard({ gold, border, name, tagline, price, plus, primary, more, featured, noCommission }: {
  gold: string; border: string; name: string; tagline: string; price: string
  plus?: string; primary: string[]; more: string[]; featured?: boolean; noCommission?: boolean
}) {
  const [open, setOpen] = useState(false)
  const dark = '#2A1208'
  const muted = 'rgba(42,18,8,0.65)'

  const Feature = ({ f }: { f: string }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: gold, color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', marginTop: '0.15rem' }}>✦</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: muted, lineHeight: 1.5 }}>{f}</span>
    </div>
  )

  return (
    <div style={{ background: '#FFFFFF', border: featured ? '1px solid ' + gold + '88' : '1px solid ' + border, padding: featured ? '3rem 2.5rem 2.5rem' : '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: featured ? '0 20px 60px rgba(0,0,0,0.25)' : 'none' }}>
      {featured && (
        <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: gold, color: '#1a0e06', fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.35rem 1.4rem', whiteSpace: 'nowrap' }}>Most Popular</div>
      )}
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>{name}</p>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 400, color: dark, margin: '0 0 1.25rem', lineHeight: 1.4 }}>{tagline}</p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: noCommission ? '0.3rem' : '1.5rem' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: dark, margin: 0, lineHeight: 1 }}>CHF {price}</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(42,18,8,0.4)', margin: 0 }}>/mo</p>
      </div>
      {noCommission && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: gold, margin: '0 0 1.5rem', fontWeight: 500 }}>No commission on bookings</p>}

      <div style={{ height: '1px', background: 'rgba(201,169,110,0.25)', marginBottom: '1.5rem' }} />

      {plus && <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 600, fontSize: '0.95rem', color: gold, margin: '0 0 1rem' }}>{plus}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {primary.map(f => <Feature key={f} f={f} />)}
        {open && more.map(f => <Feature key={f} f={f} />)}
      </div>

      {more.length > 0 && (
        <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: 'none', color: gold, fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '2rem', textAlign: 'left', alignSelf: 'flex-start' }}>
          {open ? 'View fewer features ▲' : 'View all features ▾'}
        </button>
      )}

      <a href="#contact" style={{ display: 'block', textAlign: 'center', background: featured ? gold : 'transparent', color: featured ? '#fff' : dark, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem', textDecoration: 'none', border: '1px solid ' + gold, marginTop: 'auto' }}>
        Get Started
      </a>
    </div>
  )
}
