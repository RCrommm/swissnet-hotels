import Link from 'next/link'

export const metadata = {
  title: 'Swiss Hotel Concierge | SwissNet Hotels',
  description:
    'Describe your ideal stay in Switzerland and receive a focused shortlist of luxury hotels matched to your priorities.',
  alternates: {
    canonical: 'https://swissnethotels.com/concierge',
  },
}

export default function ConciergePage() {
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
    {
      number: '01',
      title: 'Share your brief',
      text: 'Destination, dates, travel style, occasion, budget, and non-negotiables.',
    },
    {
      number: '02',
      title: 'Receive a shortlist',
      text: 'Only relevant hotels are shown, ranked by fit rather than generic popularity.',
    },
    {
      number: '03',
      title: 'Continue direct',
      text: 'Review the hotel profile, then continue to the official website when ready.',
    },
  ]

  return (
    <main style={{ background: bg, minHeight: '100vh', color: text }}>
      {/* Top bar */}
      <header
        style={{
          height: 86,
          borderBottom: `1px solid ${border}`,
          background: 'rgba(248,245,239,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.75rem',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.45rem',
            color: text,
            textDecoration: 'none',
            fontWeight: 300,
          }}
        >
          SwissNet <span style={{ color: gold, fontStyle: 'italic' }}>Hotels</span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.62rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: softMuted,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#35B56B',
              boxShadow: '0 0 0 5px rgba(53,181,107,0.12)',
            }}
          />
          Private Concierge Online
        </div>

        <Link
          href="/hotels"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.78rem',
            color: muted,
            textDecoration: 'none',
          }}
        >
          Browse hotels →
        </Link>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1220,
          margin: '0 auto',
          padding: '4.5rem 2rem 5rem',
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '4rem',
          alignItems: 'center',
        }}
      >
        {/* Left */}
        <div>
          <p
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.62rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: gold,
              fontWeight: 600,
              margin: '0 0 1.35rem',
            }}
          >
            SwissNet Intelligence
          </p>

          <h1
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(4rem, 8vw, 6.4rem)',
              lineHeight: 0.92,
              fontWeight: 300,
              color: dark,
              margin: '0 0 1.5rem',
              letterSpacing: '-0.045em',
            }}
          >
            Find your Swiss hotel
            <br />
            <span style={{ color: gold, fontStyle: 'italic' }}>with confidence.</span>
          </h1>

          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.45rem',
              lineHeight: 1.6,
              color: muted,
              maxWidth: 640,
              margin: '0 0 2.75rem',
              fontStyle: 'italic',
              fontWeight: 300,
            }}
          >
            Describe the stay you have in mind — destination, season, occasion, priorities,
            and budget. SwissNet will shortlist the hotels that best match your requirements.
          </p>

          {/* Search box */}
          <form
            action="/concierge/results"
            style={{
              background: white,
              border: `1px solid ${border}`,
              borderBottom: `3px solid ${gold}`,
              boxShadow: '0 26px 70px rgba(42,26,18,0.08)',
              display: 'flex',
              alignItems: 'center',
              padding: '1rem',
              maxWidth: 720,
            }}
          >
            <input
              name="q"
              placeholder="Describe your ideal stay in Switzerland..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.45rem',
                color: text,
                padding: '0.8rem 0.6rem',
              }}
            />
            <button
              type="submit"
              style={{
                border: `1px solid ${border}`,
                background: 'transparent',
                color: muted,
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '1rem 1.55rem',
                cursor: 'pointer',
              }}
            >
              Ask
            </button>
          </form>

          {/* Suggestions */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginTop: '1.2rem',
              maxWidth: 700,
            }}
          >
            {suggestions.map((s) => (
              <Link
                key={s}
                href={`/concierge/results?q=${encodeURIComponent(s)}`}
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '0.76rem',
                  color: muted,
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.72)',
                  border: `1px solid rgba(201,168,76,0.18)`,
                  padding: '0.75rem 1rem',
                }}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <aside
          style={{
            background: 'linear-gradient(135deg, #2A1A12 0%, #0F0905 100%)',
            color: white,
            padding: '3rem',
            minHeight: 510,
            boxShadow: '0 36px 90px rgba(42,26,18,0.22)',
          }}
        >
          <p
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.62rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: gold,
              fontWeight: 700,
              margin: '0 0 3.2rem',
            }}
          >
            Private Hotel Matching
          </p>

          <h2
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '2.85rem',
              lineHeight: 1.05,
              fontWeight: 300,
              color: white,
              margin: '0 0 1.5rem',
            }}
          >
            A more considered way
            <br />
            to choose.
          </h2>

          <p
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '0.88rem',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.58)',
              margin: '0 0 2rem',
              maxWidth: 360,
              fontWeight: 300,
            }}
          >
            Tell us what matters. We match your brief against Switzerland’s leading hotels
            and return a focused shortlist.
          </p>

          <div style={{ borderTop: '1px solid rgba(201,168,76,0.24)' }}>
            {steps.map((step) => (
              <div
                key={step.number}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr',
                  gap: '1rem',
                  padding: '1.35rem 0',
                  borderBottom: '1px solid rgba(201,168,76,0.24)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  {step.number}
                </span>
                <div>
                  <p
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.86rem',
                      color: 'rgba(255,255,255,0.86)',
                      margin: '0 0 0.35rem',
                      fontWeight: 500,
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '0.76rem',
                      color: 'rgba(255,255,255,0.52)',
                      lineHeight: 1.7,
                      margin: 0,
                      fontWeight: 300,
                    }}
                  >
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}