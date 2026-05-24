'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'

const GOLD = '#C9A84C'
const DARK = '#0E0B07'
const DARK2 = '#1A1108'
const DARK3 = '#2A1A0E'
const WHITE = '#FFFFFF'
const CREAM = '#F7F4EE'
const TEXT_MUTED = 'rgba(247,244,238,0.45)'
const GOLD_DIM = 'rgba(201,168,76,0.15)'
const BORDER = 'rgba(201,168,76,0.2)'

const SUGGESTIONS = [
  'A private lakefront escape for two',
  'The finest spa hotel in the Alps',
  'Ski-in ski-out with Michelin dining',
  'A romantic honeymoon in Zermatt',
  'Understated luxury in Geneva',
  'Design and culture in Zurich',
]

const DESTINATIONS = [
  {
    name: 'Zermatt',
    tagline: 'The Matterhorn & alpine intimacy',
    img: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=1200&q=80',
    href: '/destinations/zermatt',
  },
  {
    name: 'Geneva',
    tagline: 'Lakeside diplomacy and refinement',
    img: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&q=80',
    href: '/destinations/geneva',
  },
  {
    name: 'St. Moritz',
    tagline: 'Aristocratic winter glamour',
    img: 'https://images.unsplash.com/photo-1612969308146-066d55f37ccb?w=1200&q=80',
    href: '/destinations/st-moritz',
  },
  {
    name: 'Gstaad',
    tagline: 'Discreet alpine exclusivity',
    img: 'https://images.unsplash.com/photo-1547393429-2e4e0b80c3c3?w=1200&q=80',
    href: '/destinations/gstaad',
  },
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasMessages = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, hotels: data.hotels }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologise — something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: DARK, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .pill:hover {
          background: rgba(201,168,76,0.12) !important;
          border-color: rgba(201,168,76,0.6) !important;
          color: #C9A84C !important;
        }
        .dest-card:hover .dest-img { transform: scale(1.06) !important; }
        .dest-card:hover .dest-name { color: #C9A84C !important; }
        .hotel-card { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .view-btn:hover { background: #C9A84C !important; color: #0E0B07 !important; }
        .concierge-input::placeholder { color: rgba(247,244,238,0.25); font-style: italic; }
        .concierge-input:focus { outline: none; }
        .sticky-input::placeholder { color: rgba(42,26,14,0.35); font-style: italic; }
        .sticky-input:focus { outline: none; }
      `}</style>

      {/* ── FULL SCREEN HERO ── */}
      <div style={{
        position: 'relative',
        height: hasMessages ? '120px' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Cinematic background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=70)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          opacity: hasMessages ? 0.08 : 0.22,
          transition: 'opacity 0.8s ease',
        }} />

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at center, transparent 30%, ${DARK} 100%)`,
        }} />

        {/* Top-bottom gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, ${DARK} 0%, transparent 20%, transparent 70%, ${DARK} 100%)`,
        }} />

        {/* Grain */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.035,
          pointerEvents: 'none',
        }} />

        {/* Nav */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '2rem 3rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10,
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: GOLD, letterSpacing: '0.02em' }}>
              SwissNet <em style={{ fontStyle: 'italic', color: 'rgba(247,244,238,0.7)' }}>Hotels</em>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', animation: 'breathe 2.5s ease infinite' }} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(247,244,238,0.4)' }}>
              Concierge available
            </span>
          </div>
          <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(247,244,238,0.4)', textDecoration: 'none', letterSpacing: '0.04em' }}>
            Browse hotels →
          </Link>
        </div>

        {/* Hero content — only when no messages */}
        {!hasMessages && (
          <div style={{
            position: 'relative', zIndex: 5,
            textAlign: 'center',
            maxWidth: 700,
            padding: '0 2rem',
            animation: 'fadeUp 1s ease forwards',
          }}>
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.5rem', fontWeight: 600,
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.7)',
              margin: '0 0 2rem',
            }}>
              Private Travel Concierge · Switzerland
            </p>

            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(3rem, 6vw, 5.5rem)',
              fontWeight: 300,
              color: WHITE,
              margin: '0 0 0.75rem',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}>
              Where in Switzerland<br />
              <em style={{ color: GOLD, fontStyle: 'italic' }}>are you drawn to?</em>
            </h1>

            <div style={{
              width: 40, height: 1,
              background: GOLD, opacity: 0.5,
              margin: '1.75rem auto',
              animation: 'lineGrow 1s ease 0.5s forwards',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
            }} />

            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.15rem', fontWeight: 300,
              fontStyle: 'italic',
              color: TEXT_MUTED,
              margin: '0 auto 3.5rem',
              lineHeight: 1.8,
              maxWidth: 460,
            }}>
              Tell me what matters. I'll find the right hotel — not the most popular one, the right one for you.
            </p>

            {/* Input */}
            <div style={{
              maxWidth: 600, margin: '0 auto',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${BORDER}`,
              borderBottom: `1px solid rgba(201,168,76,0.5)`,
              display: 'flex', alignItems: 'flex-end', gap: '0.75rem',
              padding: '1.25rem 1rem 1.1rem 1.5rem',
            }}>
              <textarea
                ref={inputRef}
                className="concierge-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="A lakefront suite in Geneva, ideally with spa access..."
                rows={2}
                style={{
                  flex: 1,
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.1rem', fontWeight: 300,
                  color: WHITE,
                  border: 'none', resize: 'none',
                  background: 'transparent',
                  lineHeight: 1.65, caretColor: GOLD,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                style={{
                  background: input.trim() ? GOLD : 'transparent',
                  color: input.trim() ? DARK : 'rgba(201,168,76,0.35)',
                  border: `1px solid ${input.trim() ? GOLD : BORDER}`,
                  padding: '0.6rem 1.5rem',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '0.55rem', fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.25s', flexShrink: 0,
                }}
              >
                {loading ? '…' : 'Send'}
              </button>
            </div>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="pill" onClick={() => sendMessage(s)} style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '0.55rem', color: 'rgba(247,244,238,0.5)',
                  background: 'transparent',
                  border: '1px solid rgba(247,244,238,0.12)',
                  padding: '0.4rem 1rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compact header when conversation started */}
        {hasMessages && (
          <div style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 300, color: 'rgba(247,244,238,0.6)', margin: 0, fontStyle: 'italic' }}>
              <em style={{ color: GOLD }}>SwissNet</em> Concierge
            </p>
          </div>
        )}

        {/* Bottom fade into content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: `linear-gradient(to bottom, transparent, ${DARK})`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── DESTINATIONS (before conversation) ── */}
      {!hasMessages && (
        <div style={{ background: DARK, paddingBottom: '6rem', animation: 'fadeIn 0.8s ease 0.3s forwards', opacity: 0 }}>

          {/* Thin gold rule */}
          <div style={{ maxWidth: 1000, margin: '0 auto 5rem', height: 1, background: `linear-gradient(to right, transparent, ${BORDER}, transparent)` }} />

          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3rem' }}>
              <div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 0.6rem' }}>
                  Curated destinations
                </p>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.4rem', fontWeight: 300, color: WHITE, margin: 0, letterSpacing: '-0.01em' }}>
                  Where would you like to go?
                </h2>
              </div>
              <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(247,244,238,0.35)', textDecoration: 'none', letterSpacing: '0.04em' }}>
                All hotels →
              </Link>
            </div>

            {/* Destination grid — asymmetric editorial */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: '1rem' }}>
              {DESTINATIONS.map((dest, i) => (
                <Link key={dest.name} href={dest.href} style={{ textDecoration: 'none' }}>
                  <div className="dest-card" style={{ cursor: 'pointer', position: 'relative' }}>
                    <div style={{
                      overflow: 'hidden',
                      aspectRatio: i === 0 ? '3/4' : '2/3',
                      position: 'relative',
                      marginBottom: '1rem',
                    }}>
                      <img
                        className="dest-img"
                        src={dest.img}
                        alt={dest.name}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover', display: 'block',
                          transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                          filter: 'brightness(0.85)',
                        }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(14,11,7,0.7) 0%, transparent 50%)',
                      }} />
                    </div>
                    <p className="dest-name" style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: i === 0 ? '1.6rem' : '1.25rem',
                      fontWeight: 300, color: 'rgba(247,244,238,0.85)',
                      margin: '0 0 0.3rem',
                      transition: 'color 0.3s ease',
                      letterSpacing: '-0.01em',
                    }}>
                      {dest.name}
                    </p>
                    <p style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.55rem', color: 'rgba(247,244,238,0.3)',
                      margin: 0, lineHeight: 1.5,
                    }}>
                      {dest.tagline}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONVERSATION ── */}
      {hasMessages && (
        <div style={{
          maxWidth: 880, margin: '0 auto',
          padding: '3rem 2rem 10rem',
          display: 'flex', flexDirection: 'column', gap: '3rem',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: `fadeUp 0.45s ease ${i * 0.05}s forwards`, opacity: 0 }}>

              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    maxWidth: '60%',
                    borderRight: `2px solid ${GOLD}`,
                    padding: '1rem 1.25rem 1rem 1rem',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1.1rem', fontWeight: 300, fontStyle: 'italic',
                    color: 'rgba(247,244,238,0.75)',
                    lineHeight: 1.75,
                    textAlign: 'right',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Concierge label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${BORDER}, transparent)` }} />
                    <span style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.46rem', fontWeight: 600,
                      letterSpacing: '0.24em', textTransform: 'uppercase',
                      color: 'rgba(201,168,76,0.6)',
                      whiteSpace: 'nowrap',
                    }}>
                      SwissNet Concierge
                    </span>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${BORDER}, transparent)` }} />
                  </div>

                  {/* Message */}
                  {msg.content && (
                    <div style={{ marginBottom: '2.5rem' }}>
                      {msg.content.split('\n\n').map((para, pi) => (
                        <p key={pi} style={{
                          fontFamily: 'Cormorant Garamond, serif',
                          fontSize: '1.2rem', fontWeight: 300,
                          color: 'rgba(247,244,238,0.8)',
                          lineHeight: 1.9,
                          margin: pi > 0 ? '1.25rem 0 0' : '0',
                          letterSpacing: '0.01em',
                        }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Hotel cards */}
                  {msg.hotels && msg.hotels.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                      gap: '1.25rem',
                    }}>
                      {msg.hotels.map((hotel, j) => (
                        <div
                          key={j}
                          className="hotel-card"
                          style={{
                            animationDelay: `${j * 0.12}s`,
                            background: DARK2,
                            border: `1px solid rgba(201,168,76,0.15)`,
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <Link href={hotel.profile_url} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-label={hotel.hotel_name} />

                          {/* Image */}
                          <div style={{ height: 240, overflow: 'hidden', position: 'relative' }}>
                            {hotel.image ? (
                              <img src={hotel.image} alt={hotel.hotel_name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.8)' }} />
                            ) : (
                              <div style={{ height: '100%', background: DARK3 }} />
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,11,7,0.85) 0%, transparent 50%)' }} />
                            <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem' }}>
                              <p style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontSize: '0.45rem', fontWeight: 600,
                                letterSpacing: '0.22em', textTransform: 'uppercase' as const,
                                color: 'rgba(201,168,76,0.7)', margin: '0 0 0.35rem',
                              }}>
                                {hotel.category}
                              </p>
                              <h3 style={{
                                fontFamily: 'Cormorant Garamond, serif',
                                fontSize: '1.5rem', fontWeight: 300,
                                color: WHITE, margin: 0, lineHeight: 1.15,
                              }}>
                                {hotel.hotel_name}
                              </h3>
                            </div>
                          </div>

                          {/* Body */}
                          <div style={{ padding: '1.25rem' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: 'rgba(247,244,238,0.35)', margin: '0 0 1rem', letterSpacing: '0.04em' }}>
                              {hotel.location}
                            </p>

                            {hotel.amenities?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                                {hotel.amenities.slice(0, 3).map((a: string) => (
                                  <span key={a} style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '0.46rem', fontWeight: 500,
                                    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                                    color: 'rgba(201,168,76,0.7)',
                                    border: '1px solid rgba(201,168,76,0.2)',
                                    padding: '0.2rem 0.6rem',
                                    background: 'rgba(201,168,76,0.06)',
                                  }}>
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}

                            {hotel.exclusive_offer && (
                              <div style={{ borderLeft: `1px solid ${GOLD}`, paddingLeft: '0.875rem', marginBottom: '1.25rem' }}>
                                <p style={{
                                  fontFamily: 'Cormorant Garamond, serif',
                                  fontSize: '0.9rem', fontStyle: 'italic',
                                  color: 'rgba(201,168,76,0.8)', margin: 0, lineHeight: 1.55,
                                }}>
                                  {hotel.exclusive_offer}
                                </p>
                              </div>
                            )}

                            <div style={{
                              display: 'flex', alignItems: 'flex-end',
                              justifyContent: 'space-between',
                              paddingTop: '1rem',
                              borderTop: '1px solid rgba(247,244,238,0.06)',
                            }}>
                              <div>
                                <p style={{
                                  fontFamily: 'Montserrat, sans-serif', fontSize: '0.45rem',
                                  color: 'rgba(247,244,238,0.3)', letterSpacing: '0.1em',
                                  textTransform: 'uppercase' as const, margin: '0 0 0.2rem',
                                }}>From</p>
                                <p style={{
                                  fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem',
                                  fontWeight: 300, color: 'rgba(247,244,238,0.85)', margin: 0, lineHeight: 1,
                                }}>
                                  CHF {hotel.nightly_rate_chf?.toLocaleString()}
                                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: 'rgba(247,244,238,0.3)', fontWeight: 300 }}> /night</span>
                                </p>
                              </div>
                              <div style={{ position: 'relative', zIndex: 2 }}>
                                <a
                                  href={hotel.direct_booking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="view-btn"
                                  style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '0.52rem', fontWeight: 600,
                                    letterSpacing: '0.14em', textTransform: 'uppercase' as const,
                                    color: GOLD,
                                    border: `1px solid rgba(201,168,76,0.4)`,
                                    padding: '0.6rem 1.1rem',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                    transition: 'all 0.2s',
                                    background: 'transparent',
                                  }}
                                >
                                  View →
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

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease forwards' }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${BORDER}, transparent)` }} />
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%', background: GOLD,
                    animation: `blink 1.3s ease-in-out ${i * 0.22}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(247,244,238,0.3)' }}>
                Finding your perfect stay
              </span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${BORDER}, transparent)` }} />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ── STICKY INPUT (after conversation) ── */}
      {hasMessages && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(14,11,7,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${BORDER}`,
          padding: '1.25rem 3rem',
        }}>
          <div style={{
            maxWidth: 820, margin: '0 auto',
            display: 'flex', alignItems: 'flex-end', gap: '1rem',
            borderBottom: `1px solid rgba(201,168,76,0.4)`,
            paddingBottom: '0.75rem',
          }}>
            <textarea
              ref={inputRef}
              className="sticky-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Ask anything else…"
              rows={1}
              style={{
                flex: 1,
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.05rem', fontWeight: 300, fontStyle: 'italic',
                color: 'rgba(247,244,238,0.75)',
                border: 'none', resize: 'none',
                background: 'transparent',
                lineHeight: 1.6, caretColor: GOLD,
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? GOLD : 'transparent',
                color: input.trim() ? DARK : 'rgba(201,168,76,0.3)',
                border: `1px solid ${input.trim() ? GOLD : BORDER}`,
                padding: '0.5rem 1.25rem',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.52rem', fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              {loading ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}