'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function ConciergeClient() {
  const [messages, setMessages] = useState<{role: string; content: string; hotels?: any[]}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasMessages = messages.length > 0

  const gold = '#C9A84C'
  const dark = '#1a0e06'
  const text = '#2A1A12'
  const muted = 'rgba(42,26,18,0.68)'
  const softMuted = 'rgba(42,26,18,0.48)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'
  const border = 'rgba(201,168,76,0.28)'

  const suggestions = [
    'Lakefront privacy for a weekend stay',
    'Ski access with a serious spa',
    'Discreet luxury in Geneva',
    'First visit to Zermatt',
    'Honeymoon hotel in Switzerland',
    'Design-led Zurich stay',
  ]

  const steps = [
    { number: '01', title: 'Share your brief', text: 'Destination, dates, travel style, occasion, budget, and non-negotiables.' },
    { number: '02', title: 'Receive a shortlist', text: 'Only relevant hotels are shown, ranked by fit rather than generic popularity.' },
    { number: '03', title: 'Continue direct', text: 'Review the hotel profile, then continue to the official website when ready.' },
  ]

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
    <main style={{ background: bg, minHeight: '100vh', color: text, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes blink { 0%,100%{opacity:0.15} 50%{opacity:1} }
        .suggestion:hover { border-color: ${gold} !important; color: ${dark} !important; }
        .hotel-card { animation: fadeUp 0.5s ease forwards; opacity: 0; }
        .view-btn:hover { background: ${gold} !important; color: ${dark} !important; }
        .ask-btn:hover { background: ${gold} !important; color: ${dark} !important; border-color: ${gold} !important; }
        input::placeholder { color: rgba(42,26,18,0.35); font-style: italic; }
        input:focus { outline: none; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ height: 86, borderBottom: `1px solid ${border}`, background: 'rgba(248,245,239,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.75rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', color: text, textDecoration: 'none', fontWeight: 300 }}>
          SwissNet <span style={{ color: gold, fontStyle: 'italic' }}>Hotels</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: softMuted }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#35B56B', boxShadow: '0 0 0 5px rgba(53,181,107,0.12)', display: 'inline-block' }} />
          Private Concierge Online
        </div>
        <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: muted, textDecoration: 'none' }}>
          Browse hotels →
        </Link>
      </header>

      {/* ── LANDING (no messages) ── */}
      {!hasMessages && (
        <section style={{ maxWidth: 1220, margin: '0 auto', padding: '4.5rem 2rem 5rem', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '4rem', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: gold, fontWeight: 600, margin: '0 0 1.35rem' }}>
              SwissNet Intelligence
            </p>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(4rem, 8vw, 6.4rem)', lineHeight: 0.92, fontWeight: 300, color: dark, margin: '0 0 1.5rem', letterSpacing: '-0.045em' }}>
              Find your Swiss hotel<br />
              <span style={{ color: gold, fontStyle: 'italic' }}>with confidence.</span>
            </h1>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', lineHeight: 1.6, color: muted, maxWidth: 640, margin: '0 0 2.75rem', fontStyle: 'italic', fontWeight: 300 }}>
              Describe the stay you have in mind — destination, season, occasion, priorities, and budget. SwissNet will shortlist the hotels that best match your requirements.
            </p>

            {/* Input */}
            <div style={{ background: white, border: `1px solid ${border}`, borderBottom: `3px solid ${gold}`, boxShadow: '0 26px 70px rgba(42,26,18,0.08)', display: 'flex', alignItems: 'center', padding: '1rem', maxWidth: 720, marginBottom: '1.2rem' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(input) }}
                placeholder="Describe your ideal stay in Switzerland..."
                style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', color: text, padding: '0.8rem 0.6rem' }}
              />
              <button
                className="ask-btn"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                style={{ border: `1px solid ${border}`, background: 'transparent', color: muted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, padding: '1rem 1.55rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {loading ? '…' : 'Ask'}
              </button>
            </div>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', maxWidth: 700 }}>
              {suggestions.map(s => (
                <button key={s} className="suggestion" onClick={() => send(s)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: muted, background: 'rgba(255,255,255,0.72)', border: `1px solid rgba(201,168,76,0.18)`, padding: '0.75rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <aside style={{ background: 'linear-gradient(135deg, #2A1A12 0%, #0F0905 100%)', color: white, padding: '3rem', minHeight: 510, boxShadow: '0 36px 90px rgba(42,26,18,0.22)' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: gold, fontWeight: 700, margin: '0 0 3.2rem' }}>
              Private Hotel Matching
            </p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.85rem', lineHeight: 1.05, fontWeight: 300, color: white, margin: '0 0 1.5rem' }}>
              A more considered way<br />to choose.
            </h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.88rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.58)', margin: '0 0 2rem', maxWidth: 360, fontWeight: 300 }}>
              Tell us what matters. We match your brief against Switzerland's leading hotels and return a focused shortlist.
            </p>
            <div style={{ borderTop: '1px solid rgba(201,168,76,0.24)' }}>
              {steps.map(step => (
                <div key={step.number} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: '1rem', padding: '1.35rem 0', borderBottom: '1px solid rgba(201,168,76,0.24)' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>{step.number}</span>
                  <div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.86rem', color: 'rgba(255,255,255,0.86)', margin: '0 0 0.35rem', fontWeight: 500 }}>{step.title}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.76rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      )}

      {/* ── CONVERSATION ── */}
      {hasMessages && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2rem 10rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ animation: `fadeUp 0.4s ease ${i * 0.04}s forwards`, opacity: 0 }}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ maxWidth: '60%', background: white, border: `1px solid ${border}`, borderRight: `3px solid ${gold}`, padding: '1rem 1.25rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 300, color: text, lineHeight: 1.75, textAlign: 'right' }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${border}, transparent)` }} />
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: gold, whiteSpace: 'nowrap' }}>SwissNet Concierge</span>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${border}, transparent)` }} />
                  </div>
                  {msg.content && (
                    <div style={{ marginBottom: '2rem' }}>
                      {msg.content.split('\n\n').map((para: string, pi: number) => (
                        <p key={pi} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 300, color: text, lineHeight: 1.9, marginTop: pi > 0 ? '1rem' : 0 }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                  {msg.hotels && msg.hotels.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
                      {msg.hotels.map((hotel: any, j: number) => (
                        <div key={j} className="hotel-card" style={{ animationDelay: `${j * 0.1}s`, background: white, border: `1px solid ${border}`, borderTop: `2px solid ${gold}`, position: 'relative', padding: '1.5rem' }}>
                          <Link href={hotel.profile_url} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-label={hotel.hotel_name} />
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: gold, margin: '0 0 0.5rem' }}>
                            {hotel.category} · {hotel.location}
                          </p>
                          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: dark, lineHeight: 1.2, margin: '0 0 1rem' }}>
                            {hotel.hotel_name}
                          </h3>
                          <div style={{ height: 1, background: border, margin: '0 0 1rem' }} />
                          {hotel.amenities?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                              {hotel.amenities.slice(0, 3).map((a: string) => (
                                <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: gold, border: `1px solid rgba(201,168,76,0.25)`, padding: '0.2rem 0.6rem', background: 'rgba(201,168,76,0.06)' }}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                          {hotel.exclusive_offer && (
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', fontStyle: 'italic', color: muted, borderLeft: `2px solid ${gold}`, paddingLeft: '0.75rem', margin: '0 0 1rem', lineHeight: 1.55 }}>
                              {hotel.exclusive_offer}
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '1rem', borderTop: `1px solid ${border}` }}>
                            <div>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', color: softMuted, letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 0.2rem' }}>From</p>
                              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: dark, margin: 0, lineHeight: 1 }}>
                                CHF {hotel.nightly_rate_chf?.toLocaleString()}
                                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', color: softMuted, fontWeight: 300 }}> /night</span>
                              </p>
                            </div>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                              <a href={hotel.direct_booking_url} target="_blank" rel="noopener noreferrer" className="view-btn" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: dark, border: `1px solid ${border}`, padding: '0.6rem 1.1rem', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s', background: 'transparent' }}>
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

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease forwards' }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${border}, transparent)` }} />
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: gold, animation: `blink 1.3s ease ${i * 0.22}s infinite` }} />)}
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', fontStyle: 'italic', color: muted }}>Finding your perfect stay</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${border}, transparent)` }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── STICKY INPUT ── */}
      {hasMessages && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(248,245,239,0.97)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${border}`, padding: '1rem 2.5rem' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: `2px solid ${gold}`, paddingBottom: '0.75rem' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(input) }}
              placeholder="Ask anything else…"
              style={{ flex: 1, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 300, fontStyle: 'italic', color: text, background: 'transparent', border: 'none', lineHeight: 1.6, caretColor: gold }}
            />
            <button
              className="ask-btn"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{ background: 'transparent', color: input.trim() ? dark : softMuted, border: `1px solid ${input.trim() ? border : 'transparent'}`, padding: '0.5rem 1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flexShrink: 0 }}
            >
              {loading ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}