'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const G = '#C9A84C'
const GB = 'rgba(201,168,76,0.12)'
const GBorder = 'rgba(201,168,76,0.2)'
const BG = '#111009'
const BG2 = '#1A1410'
const W = '#FFFFFF'
const T = 'rgba(255,255,255,0.92)'
const TM = '#C8C0B4'
const TF = '#8A8070'
const RULE = 'rgba(255,255,255,0.18)'

const SUGGESTIONS = [
  'A private lakefront escape for two',
  'The finest spa hotel in the Alps',
  'Ski-in ski-out with no compromises',
  'A romantic honeymoon in Zermatt',
  'Understated luxury in Geneva',
  'Michelin dining and mountain views',
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

  const send = async (text: string) => {
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes blink { 0%,100%{opacity:0.15} 50%{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
        .pill:hover { border-color: ${G} !important; color: ${G} !important; }
        .hotel-card { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .view-btn:hover { background: ${G} !important; color: ${BG} !important; border-color: ${G} !important; }
        .ta:focus { outline: none; }
        .ta::placeholder { color: rgba(255,255,255,0.4); }
        .send:hover:not(:disabled) { background: ${G} !important; color: ${BG} !important; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ padding: '1.5rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${RULE}` }}>
        <Link href="/" style={{ textDecoration: 'none', fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: G }}>
          SwissNet <em style={{ fontStyle: 'italic', color: TM }}>Hotels</em>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2.5s ease infinite' }} />
          <span style={{ fontSize: '0.46rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: TM }}>Available now</span>
        </div>
        <Link href="/hotels" style={{ textDecoration: 'none', fontSize: '0.55rem', color: TM, letterSpacing: '0.04em' }}>All hotels →</Link>
      </div>

      {/* ── MAIN ── */}
      {!hasMessages ? (

        /* ── LANDING STATE ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', animation: 'fadeIn 0.6s ease forwards' }}>

          {/* Wordmark */}
          <p style={{ fontSize: '0.46rem', fontWeight: 600, letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: 'rgba(201,168,76,0.5)', marginBottom: '2.5rem' }}>
            Private Travel Concierge · Switzerland
          </p>

          {/* Headline */}
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.8rem, 5vw, 4.8rem)', fontWeight: 300, color: W, textAlign: 'center', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '1.25rem', maxWidth: 680 }}>
            Where in Switzerland<br />
            <em style={{ color: G, fontStyle: 'italic' }}>are you drawn to?</em>
          </h1>

          {/* Divider */}
          <div style={{ width: 32, height: 1, background: G, opacity: 0.4, margin: '1.5rem 0' }} />

          {/* Subline */}
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 300, fontStyle: 'italic', color: TM, textAlign: 'center', lineHeight: 1.8, maxWidth: 440, marginBottom: '3.5rem' }}>
            Tell me what matters. I'll find the right hotel — not the most popular one, the right one for you.
          </p>

          {/* Input box */}
          <div style={{ width: '100%', maxWidth: 580, background: BG2, border: `1px solid ${GBorder}`, borderBottom: `2px solid ${G}`, padding: '1.25rem 1rem 1rem 1.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <textarea
              ref={inputRef}
              className="ta"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="A lakefront suite in Geneva, ideally with spa access..."
              rows={2}
              style={{ flex: 1, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', fontWeight: 300, color: T, background: 'transparent', border: 'none', resize: 'none', lineHeight: 1.65, caretColor: G }}
            />
            <button
              className="send"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{ background: 'transparent', color: input.trim() ? G : 'rgba(201,168,76,0.25)', border: `1px solid ${input.trim() ? GBorder : RULE}`, padding: '0.55rem 1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flexShrink: 0 }}>
              {loading ? '…' : 'Send'}
            </button>
          </div>

          {/* Suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: 580 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="pill" onClick={() => send(s)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.54rem', color: TM, background: 'transparent', border: `1px solid ${RULE}`, padding: '0.4rem 0.9rem', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em' }}>
                {s}
              </button>
            ))}
          </div>

          {/* Bottom note */}
          <p style={{ marginTop: '4rem', fontSize: '0.5rem', color: TF, letterSpacing: '0.06em', fontWeight: 400 }}>
            Curating Switzerland's finest hotels since 2024 · Powered by SwissNet Intelligence
          </p>
        </div>

      ) : (

        /* ── CONVERSATION STATE ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, maxWidth: 820, width: '100%', margin: '0 auto', padding: '3rem 2rem 9rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {messages.map((msg, i) => (
              <div key={i} style={{ animation: `fadeUp 0.4s ease ${i * 0.04}s forwards`, opacity: 0 }}>

                {msg.role === 'user' ? (
                  /* User */
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ maxWidth: '58%', padding: '0.875rem 1.25rem', background: BG2, border: `1px solid ${RULE}`, borderRight: `2px solid ${G}`, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', fontWeight: 300, fontStyle: 'italic', color: T, lineHeight: 1.75, textAlign: 'right' }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  /* Concierge */
                  <div>
                    {/* Separator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${GBorder}, transparent)` }} />
                      <span style={{ fontSize: '0.44rem', fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'rgba(201,168,76,0.5)', whiteSpace: 'nowrap' }}>SwissNet Concierge</span>
                      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${GBorder}, transparent)` }} />
                    </div>

                    {/* Text */}
                    {msg.content && (
                      <div style={{ marginBottom: '2rem' }}>
                        {msg.content.split('\n\n').map((para, pi) => (
                          <p key={pi} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 300, color: T, lineHeight: 1.9, marginTop: pi > 0 ? '1rem' : 0 }}>
                            {para}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Hotel cards */}
                    {msg.hotels && msg.hotels.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {msg.hotels.map((hotel, j) => (
                          <div key={j} className="hotel-card" style={{ animationDelay: `${j * 0.1}s`, background: BG2, border: `1px solid ${RULE}`, borderTop: `1px solid ${GBorder}`, position: 'relative', padding: '1.5rem' }}>
                            <Link href={hotel.profile_url} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-label={hotel.hotel_name} />

                            {/* Category */}
                            <p style={{ fontSize: '0.44rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'rgba(201,168,76,0.55)', marginBottom: '0.5rem' }}>
                              {hotel.category} · {hotel.location}
                            </p>

                            {/* Name */}
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: W, lineHeight: 1.2, marginBottom: '1rem' }}>
                              {hotel.hotel_name}
                            </h3>

                            {/* Thin rule */}
                            <div style={{ height: 1, background: RULE, marginBottom: '1rem' }} />

                            {/* Amenities */}
                            {hotel.amenities?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
                                {hotel.amenities.slice(0, 3).map((a: string) => (
                                  <span key={a} style={{ fontSize: '0.44rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(201,168,76,0.6)', border: `1px solid rgba(201,168,76,0.15)`, padding: '0.18rem 0.55rem', background: GB }}>
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Offer */}
                            {hotel.exclusive_offer && (
                              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.88rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.7)', borderLeft: `1px solid ${G}`, paddingLeft: '0.75rem', marginBottom: '1rem', lineHeight: 1.55 }}>
                                {hotel.exclusive_offer}
                              </p>
                            )}

                            {/* Price + CTA */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '1rem', borderTop: `1px solid ${RULE}` }}>
                              <div>
                                <p style={{ fontSize: '0.44rem', color: TF, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '0.2rem' }}>From</p>
                                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: T, lineHeight: 1 }}>
                                  CHF {hotel.nightly_rate_chf?.toLocaleString()}
                                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', color: TM, fontWeight: 300 }}> /night</span>
                                </p>
                              </div>
                              <div style={{ position: 'relative', zIndex: 2 }}>
                                <a href={hotel.direct_booking_url} target="_blank" rel="noopener noreferrer" className="view-btn" style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: G, border: `1px solid rgba(201,168,76,0.35)`, padding: '0.55rem 1rem', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s', background: 'transparent' }}>
                                  View →
                                </a>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease forwards' }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${GBorder}, transparent)` }} />
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: G, animation: `blink 1.3s ease ${i * 0.22}s infinite` }} />)}
                </div>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.88rem', fontStyle: 'italic', color: TM }}>Finding your perfect stay</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${GBorder}, transparent)` }} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── STICKY INPUT ── */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(10,8,6,0.97)', backdropFilter: 'blur(16px)', borderTop: `1px solid ${RULE}`, padding: '1rem 2.5rem' }}>
            <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: '0.75rem', borderBottom: `1px solid rgba(201,168,76,0.35)`, paddingBottom: '0.75rem' }}>
              <textarea
                ref={inputRef}
                className="ta"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                placeholder="Ask anything else…"
                rows={1}
                style={{ flex: 1, fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: T, background: 'transparent', border: 'none', resize: 'none', lineHeight: 1.6, caretColor: G }}
              />
              <button
                className="send"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                style={{ background: 'transparent', color: input.trim() ? G : 'rgba(201,168,76,0.2)', border: `1px solid ${input.trim() ? GBorder : RULE}`, padding: '0.45rem 1.1rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flexShrink: 0 }}>
                {loading ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}