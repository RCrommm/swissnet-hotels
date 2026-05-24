'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Hotel = {
  hotel_name: string
  location: string
  category: string
  rating?: number
  nightly_rate_chf?: number
  reason_recommended?: string
  direct_booking_url?: string
  profile_url: string
  amenities?: string[]
  exclusive_offer?: string
  image?: string
}

type Message = {
  role: 'user' | 'assistant'
  content: string
  hotels?: Hotel[]
}

const SUGGESTIONS = [
  'A quiet lakefront hotel for a romantic weekend',
  'A proper ski hotel with spa recovery',
  'Geneva luxury with discretion and privacy',
  'A first trip to Zermatt with Matterhorn views',
  'Best Swiss hotel for a honeymoon',
  'A design-led stay in Zurich',
]

const COLORS = {
  ink: '#21150D',
  espresso: '#120C07',
  brown: '#3A2719',
  gold: '#C9A84C',
  goldSoft: 'rgba(201,168,76,0.16)',
  cream: '#F8F5EF',
  ivory: '#FFFDF8',
  stone: '#E9E1D3',
  muted: 'rgba(33,21,13,0.58)',
  mutedLight: 'rgba(248,245,239,0.62)',
  line: 'rgba(201,168,76,0.24)',
}

function money(value?: number) {
  if (!value) return null
  return `CHF ${value.toLocaleString()}`
}

export default function ConciergeClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasMessages = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || loading) return

    const history = messages
    setMessages(prev => [...prev, { role: 'user', content: clean }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, history }),
      })

      if (!res.ok) throw new Error('Concierge request failed')
      const data = await res.json()

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.message || 'I found a few options worth considering.',
          hotels: Array.isArray(data.hotels) ? data.hotels : [],
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologise — the concierge could not complete that request. Please try again in a moment.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const inputBox = (compact = false) => (
    <form
      className={compact ? 'inputShell compact' : 'inputShell'}
      onSubmit={(e) => {
        e.preventDefault()
        send(input)
      }}
    >
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send(input)
          }
        }}
        placeholder={compact ? 'Refine the search…' : 'Tell me the occasion, destination, season, budget, or mood…'}
        rows={compact ? 1 : 2}
        className="conciergeTextarea"
      />
      <button type="submit" disabled={loading || !input.trim()} className="sendButton">
        {loading ? 'Searching' : 'Ask'}
      </button>
    </form>
  )

  return (
    <main className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 8% 0%, rgba(201,168,76,0.10), transparent 28%),
            linear-gradient(135deg, ${COLORS.ivory} 0%, ${COLORS.cream} 46%, #EFE6D6 100%);
          color: ${COLORS.ink};
          font-family: Montserrat, sans-serif;
        }

        .topbar {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          border-bottom: 1px solid rgba(58,39,25,0.08);
          background: rgba(255,253,248,0.72);
          backdrop-filter: blur(18px);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .brand {
          font-family: Cormorant Garamond, serif;
          font-size: 22px;
          color: ${COLORS.ink};
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .brand em { color: ${COLORS.gold}; font-style: italic; }

        .topMeta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.24em;
          color: rgba(33,21,13,0.42);
          font-weight: 600;
        }

        .liveDot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2fb36d;
          box-shadow: 0 0 0 6px rgba(47,179,109,0.10);
        }

        .navLink {
          color: rgba(33,21,13,0.55);
          text-decoration: none;
          font-size: 12px;
        }

        .hero {
          max-width: 1180px;
          margin: 0 auto;
          padding: 72px 32px 64px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 390px;
          gap: 56px;
          align-items: center;
        }

        .eyebrow {
          font-size: 10px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: ${COLORS.gold};
          font-weight: 700;
          margin: 0 0 24px;
        }

        h1 {
          font-family: Cormorant Garamond, serif;
          font-size: clamp(56px, 7vw, 94px);
          font-weight: 300;
          line-height: 0.95;
          letter-spacing: -0.055em;
          margin: 0;
          color: ${COLORS.ink};
        }

        h1 em {
          font-style: italic;
          color: ${COLORS.gold};
          letter-spacing: -0.04em;
        }

        .lead {
          max-width: 570px;
          margin: 28px 0 36px;
          color: ${COLORS.muted};
          font-family: Cormorant Garamond, serif;
          font-size: 24px;
          font-style: italic;
          line-height: 1.55;
        }

        .inputShell {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          max-width: 680px;
          padding: 18px;
          background: rgba(255,253,248,0.88);
          border: 1px solid rgba(58,39,25,0.10);
          border-bottom: 2px solid ${COLORS.gold};
          box-shadow: 0 22px 55px rgba(33,21,13,0.08);
        }

        .inputShell.compact {
          max-width: 860px;
          width: 100%;
          background: rgba(255,253,248,0.96);
          box-shadow: 0 18px 50px rgba(18,12,7,0.22);
        }

        .conciergeTextarea {
          flex: 1;
          min-height: 42px;
          resize: none;
          border: none;
          outline: none;
          background: transparent;
          color: ${COLORS.ink};
          font-family: Cormorant Garamond, serif;
          font-size: 22px;
          line-height: 1.45;
          font-weight: 300;
        }

        .conciergeTextarea::placeholder { color: rgba(33,21,13,0.34); }

        .sendButton {
          border: 1px solid ${COLORS.gold};
          background: ${COLORS.ink};
          color: ${COLORS.cream};
          padding: 13px 22px;
          cursor: pointer;
          font-family: Montserrat, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          transition: all 180ms ease;
          white-space: nowrap;
        }

        .sendButton:hover:not(:disabled) { background: ${COLORS.gold}; color: ${COLORS.ink}; }
        .sendButton:disabled { opacity: 0.35; cursor: not-allowed; background: transparent; color: ${COLORS.ink}; }

        .suggestions {
          max-width: 690px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .suggestion {
          border: 1px solid rgba(58,39,25,0.10);
          background: rgba(255,253,248,0.58);
          color: rgba(33,21,13,0.58);
          padding: 11px 15px;
          cursor: pointer;
          font-family: Montserrat, sans-serif;
          font-size: 12px;
          transition: all 180ms ease;
        }

        .suggestion:hover { color: ${COLORS.ink}; border-color: ${COLORS.gold}; background: rgba(201,168,76,0.10); }

        .panel {
          background: ${COLORS.espresso};
          color: ${COLORS.cream};
          padding: 34px;
          min-height: 560px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 28px 70px rgba(33,21,13,0.18);
        }

        .panel:before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(160deg, rgba(201,168,76,0.18), transparent 35%),
            radial-gradient(circle at 70% 15%, rgba(255,255,255,0.08), transparent 24%);
          pointer-events: none;
        }

        .panelInner { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }

        .panelKicker {
          color: ${COLORS.gold};
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 44px;
        }

        .panelTitle {
          font-family: Cormorant Garamond, serif;
          font-size: 42px;
          line-height: 1.05;
          font-weight: 300;
          letter-spacing: -0.04em;
          margin: 0 0 20px;
        }

        .panelText {
          color: ${COLORS.mutedLight};
          font-size: 13px;
          line-height: 1.8;
          margin: 0;
        }

        .steps { margin-top: auto; display: grid; gap: 18px; }
        .step { display: grid; grid-template-columns: 32px 1fr; gap: 14px; align-items: start; border-top: 1px solid rgba(201,168,76,0.22); padding-top: 18px; }
        .num { color: ${COLORS.gold}; font-family: Cormorant Garamond, serif; font-size: 24px; line-height: 1; }
        .step strong { display: block; font-size: 12px; color: ${COLORS.cream}; margin-bottom: 5px; }
        .step span { display: block; font-size: 12px; color: ${COLORS.mutedLight}; line-height: 1.65; }

        .conversationWrap { max-width: 920px; margin: 0 auto; padding: 42px 28px 140px; }
        .message { margin-bottom: 34px; animation: fadeUp 360ms ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        .userRow { display: flex; justify-content: flex-end; }
        .userBubble {
          max-width: 68%;
          background: ${COLORS.ivory};
          border: 1px solid rgba(58,39,25,0.10);
          border-right: 2px solid ${COLORS.gold};
          padding: 16px 18px;
          font-family: Cormorant Garamond, serif;
          font-size: 22px;
          font-style: italic;
          line-height: 1.55;
          text-align: right;
          box-shadow: 0 10px 28px rgba(33,21,13,0.05);
        }

        .assistantLabel {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
          color: ${COLORS.gold};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .assistantLabel:before, .assistantLabel:after { content: ''; height: 1px; flex: 1; background: linear-gradient(to right, transparent, ${COLORS.line}); }
        .assistantLabel:after { background: linear-gradient(to left, transparent, ${COLORS.line}); }

        .assistantText {
          font-family: Cormorant Garamond, serif;
          font-size: 24px;
          line-height: 1.72;
          color: ${COLORS.ink};
          margin-bottom: 24px;
        }

        .assistantText p { margin: 0 0 16px; }

        .hotelGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 16px; }
        .hotelCard {
          position: relative;
          background: ${COLORS.ivory};
          border: 1px solid rgba(58,39,25,0.10);
          box-shadow: 0 16px 38px rgba(33,21,13,0.07);
          overflow: hidden;
        }

        .hotelImage {
          height: 190px;
          background: linear-gradient(135deg, ${COLORS.brown}, ${COLORS.espresso});
          position: relative;
          overflow: hidden;
        }

        .hotelImage img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.92) contrast(0.96); transition: transform 600ms ease; }
        .hotelCard:hover .hotelImage img { transform: scale(1.04); }
        .hotelImage:after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(18,12,7,0.68), transparent 58%); }

        .hotelContent { padding: 20px; }
        .hotelMeta { color: ${COLORS.gold}; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 8px; }
        .hotelName { font-family: Cormorant Garamond, serif; color: ${COLORS.ink}; font-size: 28px; line-height: 1.05; font-weight: 300; margin: 0 0 10px; }
        .hotelReason { color: ${COLORS.muted}; font-size: 12px; line-height: 1.65; margin: 0 0 14px; }
        .amenities { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
        .amenity { color: rgba(33,21,13,0.58); background: ${COLORS.goldSoft}; border: 1px solid rgba(201,168,76,0.20); padding: 5px 8px; font-size: 9px; letter-spacing: 0.10em; text-transform: uppercase; font-weight: 600; }
        .hotelFoot { border-top: 1px solid rgba(58,39,25,0.09); padding-top: 16px; display: flex; justify-content: space-between; align-items: end; gap: 16px; }
        .priceLabel { font-size: 9px; color: rgba(33,21,13,0.40); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 2px; }
        .price { font-family: Cormorant Garamond, serif; font-size: 26px; color: ${COLORS.ink}; line-height: 1; }
        .profileLink, .bookLink { position: relative; z-index: 2; }
        .bookLink { color: ${COLORS.ink}; background: ${COLORS.gold}; text-decoration: none; padding: 11px 13px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
        .profileLink { color: ${COLORS.gold}; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; }

        .loading { display: flex; justify-content: center; align-items: center; gap: 9px; color: ${COLORS.muted}; font-family: Cormorant Garamond, serif; font-size: 20px; font-style: italic; }
        .dot { width: 5px; height: 5px; border-radius: 50%; background: ${COLORS.gold}; animation: blink 1.2s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: 160ms; }
        .dot:nth-child(3) { animation-delay: 320ms; }
        @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }

        .stickyComposer {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          background: rgba(18,12,7,0.93);
          border-top: 1px solid rgba(201,168,76,0.22);
          backdrop-filter: blur(18px);
          padding: 16px 24px;
          display: flex;
          justify-content: center;
        }

        @media (max-width: 920px) {
          .hero { grid-template-columns: 1fr; padding-top: 46px; gap: 38px; }
          .panel { min-height: auto; }
          .topbar { padding: 0 20px; }
          .topMeta { display: none; }
          .userBubble { max-width: 86%; }
        }

        @media (max-width: 620px) {
          .topbar { height: 64px; }
          .navLink { display: none; }
          .hero { padding: 36px 18px 44px; }
          h1 { font-size: 50px; }
          .lead { font-size: 21px; }
          .inputShell, .inputShell.compact { flex-direction: column; align-items: stretch; }
          .sendButton { width: 100%; }
          .conversationWrap { padding: 30px 16px 150px; }
          .assistantText { font-size: 21px; }
          .userBubble { max-width: 94%; font-size: 20px; }
        }
      `}</style>

      <header className="topbar">
        <Link href="/" className="brand">SwissNet <em>Hotels</em></Link>
        <div className="topMeta"><span className="liveDot" /> Private concierge online</div>
        <Link href="/hotels" className="navLink">Browse hotels →</Link>
      </header>

      {!hasMessages ? (
        <section className="hero">
          <div>
            <p className="eyebrow">Private travel concierge · Switzerland</p>
            <h1>Find the hotel<br /><em>that actually fits.</em></h1>
            <p className="lead">
              Tell me the mood, occasion, destination, season, or budget. I will narrow Switzerland’s luxury hotels to the few that genuinely make sense.
            </p>

            {inputBox()}

            <div className="suggestions">
              {SUGGESTIONS.map(item => (
                <button key={item} className="suggestion" type="button" onClick={() => send(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <aside className="panel" aria-label="How the concierge works">
            <div className="panelInner">
              <p className="panelKicker">SwissNet Intelligence</p>
              <h2 className="panelTitle">Less browsing.<br />Better decisions.</h2>
              <p className="panelText">
                A calmer way to choose a hotel: describe the stay you want, then compare only the properties that match your priorities.
              </p>

              <div className="steps">
                <div className="step"><span className="num">01</span><div><strong>Describe the trip</strong><span>Romance, skiing, business, wellness, privacy, lakefront, city access, or family needs.</span></div></div>
                <div className="step"><span className="num">02</span><div><strong>Get a short list</strong><span>Hotels are ranked by fit, not by generic popularity.</span></div></div>
                <div className="step"><span className="num">03</span><div><strong>Book direct</strong><span>Open the hotel profile or continue to the official site.</span></div></div>
              </div>
            </div>
          </aside>
        </section>
      ) : (
        <section className="conversationWrap">
          {messages.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className="message">
              {msg.role === 'user' ? (
                <div className="userRow"><div className="userBubble">{msg.content}</div></div>
              ) : (
                <div>
                  <div className="assistantLabel">SwissNet Concierge</div>
                  {msg.content && (
                    <div className="assistantText">
                      {msg.content.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                    </div>
                  )}

                  {msg.hotels && msg.hotels.length > 0 && (
                    <div className="hotelGrid">
                      {msg.hotels.map((hotel, i) => (
                        <article className="hotelCard" key={`${hotel.hotel_name}-${i}`}>
                          <div className="hotelImage">
                            {hotel.image && <img src={hotel.image} alt={hotel.hotel_name} />}
                          </div>
                          <div className="hotelContent">
                            <p className="hotelMeta">{hotel.category} · {hotel.location}</p>
                            <h3 className="hotelName">{hotel.hotel_name}</h3>
                            {hotel.reason_recommended && <p className="hotelReason">{hotel.reason_recommended}</p>}
                            {hotel.amenities && hotel.amenities.length > 0 && (
                              <div className="amenities">
                                {hotel.amenities.slice(0, 4).map(a => <span className="amenity" key={a}>{a}</span>)}
                              </div>
                            )}
                            {hotel.exclusive_offer && <p className="hotelReason"><em>{hotel.exclusive_offer}</em></p>}
                            <div className="hotelFoot">
                              <div>
                                {money(hotel.nightly_rate_chf) && <><div className="priceLabel">From</div><div className="price">{money(hotel.nightly_rate_chf)}</div></>}
                              </div>
                              {hotel.direct_booking_url ? (
                                <a className="bookLink" href={hotel.direct_booking_url} target="_blank" rel="noopener noreferrer">Official site</a>
                              ) : (
                                <Link className="profileLink" href={hotel.profile_url}>View profile →</Link>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="loading"><span>Finding the best fit</span><span className="dot" /><span className="dot" /><span className="dot" /></div>
          )}
          <div ref={bottomRef} />
        </section>
      )}

      {hasMessages && <div className="stickyComposer">{inputBox(true)}</div>}
    </main>
  )
}
