'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const GOLD = '#C9A84C'
const GOLD_DIM = 'rgba(201,169,76,0.15)'
const DARK = '#1C1008'
const DARK2 = '#2A1A0E'
const BG = '#F8F5EF'
const WHITE = '#FFFFFF'
const TEXT = '#2A1A0E'
const TEXT_MUTED = 'rgba(42,26,14,0.5)'
const BORDER = 'rgba(201,169,76,0.18)'

const SUGGESTIONS = [
  'Romantic lake escape',
  'Michelin dining retreat',
  'Ski-in ski-out luxury',
  'Wellness sanctuary',
  'Alpine spa retreat',
  'Mountain hideaway',
  'Design hotel Zurich',
  'Honeymoon in Zermatt',
]

const DESTINATIONS = [
  { name: 'Zermatt', tagline: 'Matterhorn & Alpine luxury', img: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80', href: '/destinations/zermatt' },
  { name: 'Geneva', tagline: 'Lakeside sophistication', img: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80', href: '/destinations/geneva' },
  { name: 'Gstaad', tagline: 'Discreet alpine exclusivity', img: 'https://images.unsplash.com/photo-1547393429-2e4e0b80c3c3?w=800&q=80', href: '/destinations/gstaad' },
  { name: 'St. Moritz', tagline: 'The birthplace of winter', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', href: '/destinations/st-moritz' },
]

interface Hotel {
  hotel_name: string
  location: string
  category: string
  rating: number
  nightly_rate_chf: number
  reason_recommended: string
  direct_booking_url: string
  profile_url: string
  amenities: string[]
  exclusive_offer?: string
  image?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  hotels?: Hotel[]
}

export default function ConciergeClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasMessages = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, hotels: data.hotels }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologise — something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes breathe { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes grain {
          0%,100%{transform:translate(0,0)}
          10%{transform:translate(-2%,-3%)}
          20%{transform:translate(3%,1%)}
          30%{transform:translate(-1%,4%)}
          40%{transform:translate(4%,-2%)}
          50%{transform:translate(-3%,3%)}
          60%{transform:translate(2%,-4%)}
          70%{transform:translate(-4%,1%)}
          80%{transform:translate(1%,3%)}
          90%{transform:translate(3%,-1%)}
        }
        .suggestion-chip:hover { background: rgba(201,169,76,0.12) !important; border-color: rgba(201,169,76,0.5) !important; color: #C9A84C !important; transform: translateY(-1px); }
        .dest-card:hover .dest-overlay { opacity: 1 !important; }
        .dest-card:hover img { transform: scale(1.04); }
        .dest-card img { transition: transform 0.6s ease; }
        .hotel-card { animation: fadeUp 0.4s ease forwards; opacity: 0; }
        .input-glow:focus-within { box-shadow: 0 0 0 1px rgba(201,169,76,0.4), 0 8px 40px rgba(201,169,76,0.12) !important; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', background: DARK, minHeight: hasMessages ? '160px' : '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'min-height 0.6s ease' }}>

        {/* Background imagery */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=60)', backgroundSize: 'cover', backgroundPosition: 'center 30%', opacity: 0.18 }} />

        {/* Grain texture */}
        <div style={{ position: 'absolute', inset: '-50%', width: '200%', height: '200%', opacity: 0.045, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, animation: 'grain 8s steps(1) infinite' }} />

        {/* Radial glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(201,169,76,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${DARK} 0%, rgba(28,16,8,0.7) 40%, rgba(28,16,8,0.85) 75%, ${DARK} 100%)` }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 2rem', maxWidth: 680, animation: 'fadeUp 0.8s ease forwards' }}>

          {/* Online indicator */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(201,169,76,0.1)', border: '1px solid rgba(201,169,76,0.25)', borderRadius: 20, padding: '0.3rem 0.875rem', marginBottom: '2rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'breathe 2s ease infinite' }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.8)' }}>Concierge available</span>
          </div>

          {!hasMessages && (
            <>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.6)', margin: '0 0 1.25rem' }}>SwissNet Hotels</p>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 300, color: WHITE, margin: '0 0 1rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                Luxury travel,<br /><em style={{ fontStyle: 'italic', color: GOLD }}>tailored</em> intelligently.
              </h1>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: '0 auto 3rem', lineHeight: 1.8, fontWeight: 300, maxWidth: 400 }}>
                Tell me what matters most. I'll find the finest Swiss hotel for your stay.
              </p>
            </>
          )}

          {hasMessages && (
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 300, color: WHITE, margin: '0 0 1.5rem', lineHeight: 1.2 }}>
              <em style={{ color: GOLD }}>SwissNet</em> Concierge
            </h2>
          )}

          {/* ── INPUT (hero, only shown before conversation) ── */}
          {!hasMessages && (
            <>
              <div className="input-glow" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(201,169,76,0.45)', borderRadius: 16, padding: '0.875rem 1rem 0.875rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', boxShadow: '0 4px 40px rgba(0,0,0,0.3)', transition: 'box-shadow 0.3s ease', maxWidth: 620, margin: '0 auto' }}>
                <span style={{ color: GOLD, fontSize: '1rem', flexShrink: 0, marginBottom: '0.1rem', opacity: 0.8 }}>✦</span>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Describe your perfect Swiss stay..."
                  rows={1}
                  style={{ flex: 1, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: WHITE, border: 'none', outline: 'none', resize: 'none', background: 'transparent', lineHeight: 1.6, caretColor: GOLD }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  style={{ background: input.trim() ? GOLD : 'rgba(201,169,76,0.2)', color: input.trim() ? DARK : 'rgba(201,169,76,0.4)', border: 'none', borderRadius: 10, padding: '0.6rem 1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.25s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {loading ? '...' : 'Send →'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', padding: '0.4rem 0.875rem', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em' }}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, transparent, ${BG})` }} />
      </div>

      {/* ── CONVERSATION ── */}
      {hasMessages && (
        <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', padding: '2rem 2rem 10rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: 'fadeUp 0.35s ease forwards' }}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ background: DARK2, color: WHITE, fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', padding: '0.875rem 1.25rem', borderRadius: '14px 14px 3px 14px', maxWidth: '65%', lineHeight: 1.7 }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #a8821e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(201,169,76,0.3)' }}>
                      <span style={{ color: DARK, fontSize: '0.6rem', fontWeight: 700 }}>SN</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>SwissNet Concierge</span>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: TEXT_MUTED, marginLeft: '0.5rem' }}>· Powered by SwissNet Intelligence</span>
                    </div>
                  </div>
                  {msg.content && (
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT, lineHeight: 1.85, margin: '0 0 1.25rem', paddingLeft: '2.375rem', fontWeight: 300 }}>{msg.content}</p>
                  )}
                  {msg.hotels && msg.hotels.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem', paddingLeft: '2.375rem' }}>
                      {msg.hotels.map((hotel, j) => (
                        <div key={j} className="hotel-card" style={{ animationDelay: `${j * 0.07}s`, background: WHITE, border: `1px solid rgba(201,169,110,0.2)`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', position: 'relative', transition: 'all 0.35s ease' }}>
  <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
    {hotel.image ? (
      <img src={hotel.image} alt={hotel.hotel_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <div style={{ height: '100%', background: `linear-gradient(135deg, ${DARK} 0%, ${DARK2} 100%)` }} />
    )}
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
    <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem', right: '1.25rem' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: GOLD, margin: '0 0 0.3rem' }}>{hotel.category}</p>
      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: WHITE, margin: 0, lineHeight: 1.2 }}>{hotel.hotel_name}</h3>
    </div>
  </div>
  <div style={{ padding: '1.25rem 1.375rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
      <svg width="11" height="11" fill="none" stroke={GOLD} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>{hotel.location}</span>
    </div>
    {hotel.amenities?.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.875rem' }}>
        {hotel.amenities.slice(0, 3).map((a: string) => (
          <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: TEXT_MUTED, background: BG, border: `1px solid ${BORDER}`, padding: '2px 7px', borderRadius: 8 }}>{a}</span>
        ))}
      </div>
    )}
    {hotel.exclusive_offer && (
      <div style={{ background: 'rgba(201,169,110,0.07)', borderLeft: `2px solid ${GOLD}`, borderRadius: '0 6px 6px 0', padding: '0.5rem 0.75rem', marginBottom: '0.875rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: GOLD, margin: 0 }}>✦ {hotel.exclusive_offer}</p>
      </div>
    )}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.875rem', borderTop: `1px solid rgba(201,169,110,0.15)` }}>
      <div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: TEXT_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 0.15rem' }}>From</p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', fontWeight: 400, color: TEXT, margin: 0 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}<span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, fontWeight: 300 }}> /night</span></p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative', zIndex: 2 }}>
        <Link href={hotel.profile_url} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, color: TEXT, background: BG, border: `1px solid ${BORDER}`, padding: '0.4rem 0.875rem', borderRadius: 8, textDecoration: 'none', textAlign: 'center' as const }}>
          View Profile
        </Link>
        <a href={hotel.direct_booking_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 700, color: '#1a0e06', background: GOLD, padding: '0.4rem 0.875rem', borderRadius: 8, textDecoration: 'none', textAlign: 'center' as const }}>
          Official Website
        </a>
      </div>
    </div>
  </div>
</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', animation: 'fadeUp 0.3s ease forwards' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #a8821e)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: DARK, fontSize: '0.6rem', fontWeight: 700 }}>SN</span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, animation: `pulse 1.3s ease-in-out ${i * 0.18}s infinite` }} />
                ))}
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, marginLeft: '0.5rem', fontStyle: 'italic' }}>Finding your perfect stay…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── DESTINATIONS (only shown before conversation) ── */}
      {!hasMessages && (
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '5rem 2rem 6rem' }}>

          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
            <div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.5rem' }}>Curated by SwissNet</p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: TEXT, margin: 0 }}>Iconic Swiss Destinations</h2>
            </div>
            <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, textDecoration: 'none', letterSpacing: '0.05em' }}>All hotels →</Link>
          </div>

          {/* Destination cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '5rem' }}>
            {DESTINATIONS.map((dest, i) => (
              <Link key={dest.name} href={dest.href} style={{ textDecoration: 'none' }}>
                <div className="dest-card" style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: i === 0 ? '3/4' : '3/4', cursor: 'pointer' }}>
                  <img src={dest.img} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(28,16,8,0.75) 0%, transparent 55%)' }} />
                  <div className="dest-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(201,169,76,0.1)', opacity: 0, transition: 'opacity 0.3s ease' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem' }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 300, color: WHITE, margin: '0 0 0.25rem', lineHeight: 1.1 }}>{dest.name}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(255,255,255,0.55)', margin: 0, letterSpacing: '0.04em' }}>{dest.tagline}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: `linear-gradient(135deg, ${DARK} 0%, ${DARK2} 100%)`, borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse, rgba(201,169,76,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.6)', margin: '0 0 0.875rem', position: 'relative' }}>SwissNet Concierge</p>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300, color: WHITE, margin: '0 0 0.75rem', position: 'relative' }}>
              Your perfect stay,<br /><em style={{ color: GOLD }}>one conversation away.</em>
            </h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: '0 auto 2rem', maxWidth: 380, lineHeight: 1.8, fontWeight: 300, position: 'relative' }}>
              Tell the concierge your dates, preferences and budget. We'll find the finest match across 130+ Swiss luxury hotels.
            </p>
            <button onClick={() => inputRef.current?.focus()} style={{ background: GOLD, color: DARK, border: 'none', borderRadius: 8, padding: '0.875rem 2.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', position: 'relative' }}>
              Start Conversation →
            </button>
          </div>
        </div>
      )}
    {/* ── STICKY INPUT BAR (shown after conversation starts) ── */}
      {hasMessages && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(248,245,239,0.95)', backdropFilter: 'blur(16px)', borderTop: `1px solid ${BORDER}`, padding: '0.875rem 1.5rem', boxShadow: '0 -4px 24px rgba(42,26,14,0.08)' }}>
          <div className="input-glow" style={{ maxWidth: 820, margin: '0 auto', background: WHITE, border: `1px solid rgba(201,169,76,0.4)`, borderRadius: 14, padding: '0.75rem 1rem 0.75rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', boxShadow: '0 2px 16px rgba(201,169,76,0.08)', transition: 'box-shadow 0.3s ease' }}>
            <span style={{ color: GOLD, fontSize: '1rem', flexShrink: 0, marginBottom: '0.1rem', opacity: 0.8 }}>✦</span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Ask anything else..."
              rows={1}
              style={{ flex: 1, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: TEXT, border: 'none', outline: 'none', resize: 'none', background: 'transparent', lineHeight: 1.6, caretColor: GOLD }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{ background: input.trim() ? GOLD : 'rgba(201,169,76,0.15)', color: input.trim() ? DARK : 'rgba(201,169,76,0.4)', border: 'none', borderRadius: 10, padding: '0.6rem 1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.25s', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {loading ? '...' : 'Send →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}