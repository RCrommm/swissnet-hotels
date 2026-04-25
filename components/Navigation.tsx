'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: scrolled ? 'rgba(12,12,12,0.97)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(201,169,110,0.2)' : 'none',
      transition: 'all 0.4s ease',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: '#C9A96E', letterSpacing: '0.05em' }}>
            SwissNet <span style={{ fontStyle: 'italic', color: '#fff' }}>Hotels</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="hidden md:flex">
          {[
            { label: 'Hotels', href: '/hotels' },
            { label: 'Zermatt', href: '/hotels?region=Zermatt' },
            { label: 'St. Moritz', href: '/hotels?region=St.+Moritz' },
            { label: 'Wellness', href: '/hotels?category=Wellness+Retreat' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9A96E')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/hotels" className="btn-gold" style={{ fontSize: '0.65rem', padding: '0.6rem 1.5rem' }}>
            Find a Hotel
          </Link>
        </div>

        <button 
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div style={{ background: 'rgba(12,12,12,0.98)', borderTop: '1px solid rgba(201,169,110,0.2)', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {[
            { label: 'All Hotels', href: '/hotels' },
            { label: 'Zermatt', href: '/hotels?region=Zermatt' },
            { label: 'St. Moritz', href: '/hotels?region=St.+Moritz' },
            { label: 'Wellness', href: '/hotels?category=Wellness+Retreat' },
          ].map(item => (
            <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
            }}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}