'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const destinationLinks = [
  { label: 'Zermatt', href: '/destinations/zermatt' },
  { label: 'Geneva', href: '/destinations/geneva' },
  { label: 'St. Moritz', href: '/destinations/st-moritz' },
  { label: 'Interlaken', href: '/destinations/interlaken' },
  { label: 'Zurich', href: '/destinations/zurich' },
  { label: 'Gstaad', href: '/destinations/gstaad' },
  { label: 'Lucerne', href: '/destinations/lucerne' },
  { label: 'Verbier', href: '/destinations/verbier' },
  { label: 'Davos', href: '/destinations/davos' },
  { label: 'Crans-Montana', href: '/destinations/crans-montana' },
  { label: 'Flims', href: '/destinations/flims' },
  { label: 'Bern', href: '/destinations/bern' },
  { label: 'Basel', href: '/destinations/basel' },
  { label: 'Lugano', href: '/destinations/lugano' },
  { label: 'Ascona', href: '/destinations/ascona' },
  { label: 'Andermatt', href: '/destinations/andermatt' },
  { label: 'Montreux', href: '/destinations/montreux' },
]

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [destinationsOpen, setDestinationsOpen] = useState(false)
  const [guidesOpen, setGuidesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const gold = '#C9A84C'
  const linkStyle = {
    fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 500,
    letterSpacing: '0.2em', textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.2s',
  }

  const dropdownItemStyle = {
    display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem',
    fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
    padding: '0.6rem 1.25rem', transition: 'all 0.2s',
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: scrolled ? 'rgba(73,40,22,0.97)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(201,169,110,0.2)' : 'none',
      transition: 'all 0.4s ease',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, letterSpacing: '0.05em' }}>
            SwissNet <span style={{ fontStyle: 'italic', color: '#fff' }}>Hotels</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="hidden md:flex">

          <Link href="/" style={linkStyle}
            onMouseEnter={e => (e.currentTarget.style.color = gold)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
            Home
          </Link>

          <Link href="/hotels" style={linkStyle}
            onMouseEnter={e => (e.currentTarget.style.color = gold)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
            Hotels
          </Link>

          {/* Destinations dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setDestinationsOpen(true)}
            onMouseLeave={() => setDestinationsOpen(false)}
          >
            <button style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = gold)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
              Destinations
              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {destinationsOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(73,40,22,0.98)', border: '1px solid rgba(201,169,110,0.2)',
                padding: '0.75rem 0', minWidth: '200px', marginTop: '0',
                backdropFilter: 'blur(10px)', paddingTop: '0.5rem',
              }}>
                {/* invisible bridge to prevent gap */}
                <div style={{ position: 'absolute', top: '-10px', left: 0, right: 0, height: '10px' }} />
                {destinationLinks.map(item => (
                  <Link key={item.label} href={item.href} style={dropdownItemStyle}
                    onMouseEnter={e => { e.currentTarget.style.color = gold; e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent' }}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
            <div style={{ position: 'relative' }} onMouseEnter={() => setGuidesOpen(true)} onMouseLeave={() => setGuidesOpen(false)}>
  <button style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = gold)} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
    Guides
    <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
  </button>
  {guidesOpen && (
    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(73,40,22,0.98)', border: '1px solid rgba(201,169,110,0.2)', padding: '0.5rem 0', minWidth: '240px', backdropFilter: 'blur(10px)', maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ position: 'absolute', top: '-10px', left: 0, right: 0, height: '10px' }} />
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: gold, padding: '0.5rem 1.25rem 0.4rem' }}>By Category</div>
      {[{label:'Best Ski Hotels',href:'/best/ski-hotels-switzerland'},{label:'Best Wellness Hotels',href:'/best/wellness-hotels-switzerland'},{label:'Best Spa Hotels',href:'/best/spa-hotels-switzerland'},{label:'Best Romantic Hotels',href:'/best/romantic-hotels-switzerland'},{label:'Best Honeymoon Hotels',href:'/best/honeymoon-hotels-switzerland'},{label:'Best Family Hotels',href:'/best/family-hotels-switzerland'}].map(item => (
        <Link key={item.href} href={item.href} style={dropdownItemStyle} onMouseEnter={e => { e.currentTarget.style.color = gold; e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent' }}>{item.label}</Link>
      ))}
    </div>
  )}
</div>
          <a href="/#pricing" style={linkStyle}
            onMouseEnter={e => (e.currentTarget.style.color = gold)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
            Pricing
          </a>

          <div style={{ width: '1px', height: '16px', background: 'rgba(201,169,110,0.3)' }} />

          <Link href="/dashboard/login" style={{ ...linkStyle, color: gold }}>
            Hotel Login
          </Link>

          <a href="/#contact" style={{ display: 'inline-block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.6rem 1.5rem', border: '1px solid ' + gold, textDecoration: 'none' }}>
            Book Demo
          </a>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div style={{ background: 'rgba(73,40,22,0.98)', borderTop: '1px solid rgba(201,169,110,0.2)', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {[
            { label: 'Home', href: '/' },
            { label: 'All Hotels', href: '/hotels' },
            { label: 'Zermatt', href: '/destinations/zermatt' },
            { label: 'Geneva', href: '/destinations/geneva' },
            { label: 'St. Moritz', href: '/destinations/st-moritz' },
            { label: 'Interlaken', href: '/destinations/interlaken' },
            { label: 'Zurich', href: '/destinations/zurich' },
            { label: 'Gstaad', href: '/destinations/gstaad' },
            { label: 'Lucerne', href: '/destinations/lucerne' },
            { label: 'Verbier', href: '/destinations/verbier' },
            { label: 'Davos', href: '/destinations/davos' },
            { label: 'Crans-Montana', href: '/destinations/crans-montana' },
            { label: 'Flims', href: '/destinations/flims' },
            { label: 'Bern', href: '/destinations/bern' },
            { label: 'Pricing', href: '/#pricing' },
            { label: 'Hotel Login', href: '/dashboard/login' },
          ].map(item => (
            <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: item.label === 'Hotel Login' ? gold : 'rgba(255,255,255,0.7)', textDecoration: 'none',
            }}>
              {item.label}
            </Link>
          ))}
          <a href="/#contact" onClick={() => setMenuOpen(false)} style={{ display: 'inline-block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.75rem 1.5rem', textDecoration: 'none', textAlign: 'center' }}>
            Book Demo
          </a>
        </div>
      )}
    </nav>
  )
}