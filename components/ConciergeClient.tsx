'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const GOLD = '#C9A84C'
const DARK = '#2A1A0E'
const BG = '#F8F5EF'
const WHITE = '#FFFFFF'
const TEXT = '#2A1A0E'
const TEXT_MUTED = 'rgba(42,26,14,0.5)'
const BORDER = 'rgba(201,169,76,0.15)'

const SUGGESTIONS = [
  'Best romantic spa hotel in Geneva with lake view',
  'Luxury ski hotel in Zermatt with Matterhorn view',
  'Family-friendly 5-star hotel in Interlaken',
  'Michelin-starred dining hotel in Switzerland',
  'Wellness retreat in the Swiss Alps under CHF 800',
  'Pet-friendly luxury hotel in Davos',
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
  best_for: string[]
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        hotels: data.hotels,
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologise — something went wrong. Please try again.',
      }])
    }
    setLoading(false)
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #2A1A0E 0%, #3D2810 100%)`, padding: '5rem 2rem 3rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(201,169,76,0.7)', margin: '0 0 1rem' }}>SwissNet Hotels</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, color: WHITE, margin: '0 0 1rem', lineHeight: 1.1 }}>
          AI Concierge
        </h1>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '0 auto', maxWidth: 480, lineHeight: 1.8, fontWeight: 300 }}>
          Describe your perfect Swiss hotel stay and I'll find the finest options for you — instantly.
        </p>
      </div>

      {/* Main */}
      <div style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Empty state */}
        {!hasMessages && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: TEXT, margin: '0 0 0.5rem' }}>How can I help you today?</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: '0 0 2rem' }}>Try one of these searches or describe exactly what you're looking for</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT, background: WHITE, border: '1px solid ' + BORDER, padding: '0.5rem 1rem', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ background: DARK, color: WHITE, fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', padding: '0.75rem 1.25rem', borderRadius: '12px 12px 2px 12px', maxWidth: '70%', lineHeight: 1.6 }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: DARK, fontSize: '0.65rem', fontWeight: 700 }}>SN</span>
                    </div>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SwissNet Concierge</span>
                  </div>
                  {msg.content && (
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT, lineHeight: 1.8, margin: '0 0 1rem', paddingLeft: '2.25rem' }}>{msg.content}</p>
                  )}
                  {msg.hotels && msg.hotels.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', paddingLeft: '2.25rem' }}>
                      {msg.hotels.map((hotel, j) => (
                        <div key={j} style={{ background: WHITE, border: '1px solid ' + BORDER, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(42,26,14,0.06)' }}>
                          {hotel.image && (
                            <div style={{ height: 160, overflow: 'hidden' }}>
                              <img src={hotel.image} alt={hotel.hotel_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                          {!hotel.image && (
                            <div style={{ height: 100, background: `linear-gradient(135deg, #2A1A0E, #3D2810)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: GOLD }}>SwissNet Hotels</span>
                            </div>
                          )}
                          <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1.2 }}>{hotel.hotel_name}</h3>
                              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: GOLD, fontWeight: 700, background: GOLD + '15', padding: '2px 6px', borderRadius: 10, flexShrink: 0, marginLeft: '0.5rem' }}>★ {hotel.rating}</span>
                            </div>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: '0 0 0.5rem' }}>{hotel.location}</p>
                            {hotel.amenities?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                {hotel.amenities.slice(0, 3).map((a: string) => (
                                  <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: TEXT_MUTED, background: BG, border: '1px solid ' + BORDER, padding: '2px 6px', borderRadius: 8 }}>{a}</span>
                                ))}
                              </div>
                            )}
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: '0 0 0.75rem', lineHeight: 1.5 }}>{hotel.reason_recommended}</p>
                            {hotel.exclusive_offer && (
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: GOLD, margin: '0 0 0.75rem', fontWeight: 600 }}>✦ {hotel.exclusive_offer}</p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid ' + BORDER, paddingTop: '0.75rem' }}>
                              <div>
                                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: TEXT_MUTED, margin: '0 0 0.1rem' }}>From</p>
                                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: GOLD, margin: 0, lineHeight: 1 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</p>
                                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.45rem', color: TEXT_MUTED, margin: 0 }}>per night</p>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <Link href={hotel.profile_url} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, color: TEXT, background: BG, border: '1px solid ' + BORDER, padding: '0.35rem 0.75rem', borderRadius: 4, textDecoration: 'none', textAlign: 'center' }}>
                                  View Details
                                </Link>
                                <a href={hotel.direct_booking_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, color: DARK, background: GOLD, padding: '0.35rem 0.75rem', borderRadius: 4, textDecoration: 'none', textAlign: 'center' }}>
                                  Book Now
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: DARK, fontSize: '0.65rem', fontWeight: 700 }}>SN</span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.6, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ position: 'sticky', bottom: '1.5rem', background: WHITE, border: '1px solid ' + BORDER, borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', boxShadow: '0 4px 24px rgba(42,26,14,0.08)' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Describe your perfect Swiss hotel stay..."
            rows={1}
            style={{ flex: 1, fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: TEXT, border: 'none', outline: 'none', resize: 'none', background: 'transparent', lineHeight: 1.6 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{ background: input.trim() ? GOLD : BORDER, color: input.trim() ? DARK : TEXT_MUTED, border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            Send →
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  )
}