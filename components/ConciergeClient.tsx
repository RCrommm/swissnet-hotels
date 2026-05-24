'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const GOLD = '#B8973A'
const GOLD_LIGHT = 'rgba(184,151,58,0.10)'
const GOLD_BORDER = 'rgba(184,151,58,0.20)'
const INK = '#1A1108'
const INK_LIGHT = '#3D2B1F'
const INK_MUTED = 'rgba(26,17,8,0.40)'
const BG = '#F7F4EE'
const BG_DARK = '#EDE8DC'
const WHITE = '#FFFFFF'
const RULE = 'rgba(26,17,8,0.08)'

const SUGGESTIONS = [
  'A private lake escape for two',
  'The finest spa in the Alps',
  'Ski-in ski-out, no compromises',
  'Michelin dining and mountain views',
  'Honeymoon in Zermatt',
  'Design hotel in Zurich',
]

const DESTINATIONS = [
  { name: 'Zermatt', tagline: 'The Matterhorn & alpine intimacy', img: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&q=75', href: '/destinations/zermatt' },
  { name: 'Geneva', tagline: 'Lakeside diplomacy and refinement', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=75', href: '/destinations/geneva' },
  { name: 'St. Moritz', tagline: 'Aristocratic winter glamour', img: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=900&q=75', href: '/destinations/st-moritz' },
  { name: 'Gstaad', tagline: 'Discreet alpine exclusivity', img: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=900&q=75', href: '/destinations/gstaad' },
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
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity: 0.15; } 50% { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pill:hover { background: ${GOLD_LIGHT} !important; border-color: ${GOLD} !important; color: ${GOLD} !important; }
        .dest-img { transition: transform 0.7s ease; }
        .dest-wrap:hover .dest-img { transform: scale(1.04); }
        .dest-wrap:hover .dest-label { color: ${GOLD} !important; }
        .hotel-card { animation: fadeUp 0.45s ease forwards; opacity: 0; }
        .book-btn:hover { background: ${INK} !important; }
        .concierge-ta::placeholder { color: ${INK_MUTED}; font-style: italic; }
        .concierge-ta:focus { outline: none; }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(247,244,238,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${RULE}`,
        padding: '1.25rem 3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: GOLD }}>
            SwissNet <em style={{ fontStyle: 'italic', color: INK_LIGHT }}>Hotels</em>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_MUTED }}>
            Concierge available
          </span>
        </div>
        <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: INK_MUTED, textDecoration: 'none' }}>
          Browse hotels →
        </Link>
      </header>

      {/* ── HERO (no messages) ── */}
      {!hasMessages && (
        <div style={{ animation: 'fadeIn 0.5s ease forwards' }}>

          {/* Hero text + input */}
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '7rem 2rem 5rem', textAlign: 'center' }}>
            <p style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600,
              letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, margin: '0 0 2rem',
            }}>
              Private Travel Concierge
            </p>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              fontWeight: 300, color: INK,
              margin: '0 0 1.5rem', lineHeight: 1.08, letterSpacing: '-0.01em',
            }}>
              Tell me what you're<br />
              <em style={{ fontStyle: 'italic', color: GOLD }}>looking for.</em>
            </h1>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 300,
              fontStyle: 'italic', color: INK_MUTED,
              margin: '0 auto 4rem', lineHeight: 1.75, maxWidth: 460,
            }}>
              I'll find the right Swiss hotel — not the most popular one, the right one for you.
            </p>

            {/* Input field */}
            <div style={{
              maxWidth: 580, margin: '0 auto 1.75rem',
              background: WHITE,
              border: `1px solid ${RULE}`,
              borderBottom: `2px solid ${GOLD}`,
              display: 'flex', alignItems: 'flex-end', gap: '1rem',
              padding: '1.25rem 1.25rem 1.1rem 1.5rem',
            }}>
              <textarea
                ref={inputRef}
                className="concierge-ta"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="A lakefront suite in Geneva, ideally with spa access..."
                rows={2}
                style={{
                  flex: 1, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem',
                  fontWeight: 300, color: INK, border: 'none', resize: 'none',
                  background: 'transparent', lineHeight: 1.6, caretColor: GOLD,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                style={{
                  background: input.trim() ? INK : BG_DARK,
                  color: input.trim() ? WHITE : INK_MUTED,
                  border: 'none', padding: '0.6rem 1.5rem',
                  fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem',
                  fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s', flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>

            {/* Suggestion pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s} className="pill"
                  onClick={() => sendMessage(s)}
                  style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: INK_MUTED,
                    background: 'transparent', border: `1px solid ${RULE}`,
                    padding: '0.45rem 1rem', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ maxWidth: 900, margin: '0 auto', height: 1, background: RULE }} />

          {/* Destinations */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 3rem 7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3rem' }}>
              <div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.5rem' }}>
                  Where to begin
                </p>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', fontWeight: 300, color: INK, margin: 0 }}>
                  Switzerland's finest destinations
                </h2>
              </div>
              <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: INK_MUTED, textDecoration: 'none' }}>
                All hotels →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '1.25rem' }}>
              {DESTINATIONS.map((dest, i) => (
                <Link key={dest.name} href={dest.href} style={{ textDecoration: 'none' }}>
                  <div className="dest-wrap" style={{ cursor: 'pointer' }}>
                    <div style={{ overflow: 'hidden', aspectRatio: i === 0 ? '2/3' : '3/4', marginBottom: '1rem' }}>
                      <img
                        className="dest-img"
                        src={dest.img} alt={dest.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                    <p className="dest-label" style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: i === 0 ? '1.5rem' : '1.2rem',
                      fontWeight: 400, color: INK_LIGHT, margin: '0 0 0.3rem',
                      transition: 'color 0.2s',
                    }}>
                      {dest.name}
                    </p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: INK_MUTED, margin: 0 }}>
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
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '4rem 2rem 10rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: `fadeUp 0.4s ease ${i * 0.04}s forwards`, opacity: 0 }}>

              {msg.role === 'user' ? (
                /* User bubble */
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    maxWidth: '62%', background: WHITE,
                    border: `1px solid ${RULE}`, borderLeft: `3px solid ${GOLD}`,
                    padding: '1rem 1.25rem',
                    fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem',
                    fontWeight: 300, fontStyle: 'italic', color: INK_LIGHT, lineHeight: 1.7,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Concierge response */
                <div>
                  {/* Label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: 1, height: 28, background: GOLD, opacity: 0.7 }} />
                    <span style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 600,
                      letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD,
                    }}>
                      SwissNet Concierge
                    </span>
                  </div>

                  {/* Message paragraphs */}
                  {msg.content && (
                    <div style={{ paddingLeft: '1.75rem', marginBottom: '2rem' }}>
                      {msg.content.split('\n\n').map((para, pi) => (
                        <p key={pi} style={{
                          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem',
                          fontWeight: 300, color: INK_LIGHT, lineHeight: 1.85,
                          margin: pi > 0 ? '1rem 0 0' : '0',
                        }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Hotel cards */}
                  {msg.hotels && msg.hotels.length > 0 && (
                    <div style={{
                      paddingLeft: '1.75rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '1.25rem',
                    }}>
                      {msg.hotels.map((hotel, j) => (
                        <div
                          key={j}
                          className="hotel-card"
                          style={{
                            animationDelay: `${j * 0.1}s`,
                            background: WHITE,
                            border: `1px solid ${RULE}`,
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <Link href={hotel.profile_url} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-label={`View ${hotel.hotel_name}`} />

                          {/* Image */}
                          <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                            {hotel.image ? (
                              <img src={hotel.image} alt={hotel.hotel_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ height: '100%', background: BG_DARK }} />
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,17,8,0.55) 0%, transparent 55%)' }} />
                            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
                              <p style={{
                                fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 600,
                                letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                                color: 'rgba(255,255,255,0.65)', margin: '0 0 0.3rem',
                              }}>
                                {hotel.category}
                              </p>
                              <h3 style={{
                                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
                                fontWeight: 400, color: WHITE, lineHeight: 1.2, margin: 0,
                              }}>
                                {hotel.hotel_name}
                              </h3>
                            </div>
                          </div>

                          {/* Card body */}
                          <div style={{ padding: '1.25rem' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: INK_MUTED, margin: '0 0 1rem' }}>
                              {hotel.location}
                            </p>

                            {hotel.amenities?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                                {hotel.amenities.slice(0, 3).map((a: string) => (
                                  <span key={a} style={{
                                    fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 500,
                                    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                                    color: GOLD, border: `1px solid ${GOLD_BORDER}`,
                                    padding: '0.2rem 0.6rem', background: GOLD_LIGHT,
                                  }}>
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}

                            {hotel.exclusive_offer && (
                              <div style={{ borderLeft: `2px solid ${GOLD}`, paddingLeft: '0.75rem', marginBottom: '1rem' }}>
                                <p style={{
                                  fontFamily: 'Cormorant Garamond, serif', fontSize: '0.88rem',
                                  fontStyle: 'italic', color: INK_LIGHT, margin: 0, lineHeight: 1.5,
                                }}>
                                  {hotel.exclusive_offer}
                                </p>
                              </div>
                            )}

                            <div style={{
                              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                              paddingTop: '1rem', borderTop: `1px solid ${RULE}`,
                            }}>
                              <div>
                                <p style={{
                                  fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', color: INK_MUTED,
                                  letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 0.2rem',
                                }}>From</p>
                                <p style={{
                                  fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
                                  fontWeight: 400, color: INK_LIGHT, margin: 0, lineHeight: 1,
                                }}>
                                  CHF {hotel.nightly_rate_chf?.toLocaleString()}
                                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: INK_MUTED, fontWeight: 300 }}> /night</span>
                                </p>
                              </div>
                              <div style={{ position: 'relative', zIndex: 2 }}>
                                <a
                                  href={hotel.direct_booking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="book-btn"
                                  style={{
                                    fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600,
                                    letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                                    color: WHITE, background: INK_LIGHT,
                                    padding: '0.6rem 1rem', textDecoration: 'none',
                                    display: 'inline-block', transition: 'background 0.2s',
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

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.75rem', animation: 'fadeIn 0.3s ease forwards' }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', background: GOLD,
                    animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', fontStyle: 'italic', color: INK_MUTED }}>
                Finding your perfect stay…
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ── STICKY INPUT BAR (after conversation) ── */}
      {hasMessages && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(247,244,238,0.97)', backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${RULE}`,
          padding: '1rem 3rem',
        }}>
          <div style={{
            maxWidth: 820, margin: '0 auto',
            display: 'flex', alignItems: 'flex-end', gap: '1rem',
            borderBottom: `2px solid ${GOLD}`, paddingBottom: '0.75rem',
          }}>
            <textarea
              ref={inputRef}
              className="concierge-ta"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Ask anything else…"
              rows={1}
              style={{
                flex: 1, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem',
                fontWeight: 300, fontStyle: 'italic', color: INK_LIGHT,
                border: 'none', resize: 'none', background: 'transparent',
                lineHeight: 1.6, caretColor: GOLD,
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? INK : 'transparent',
                color: input.trim() ? WHITE : INK_MUTED,
                border: `1px solid ${input.trim() ? INK : RULE}`,
                padding: '0.5rem 1.25rem',
                fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem',
                fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
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
