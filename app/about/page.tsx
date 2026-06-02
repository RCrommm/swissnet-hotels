export const metadata = {
  title: 'About SwissNet Hotels',
  description: 'SwissNet Hotels is a Swiss platform helping luxury hotels appear in AI search — ChatGPT, Perplexity, Google AI — and drive direct bookings.',
  alternates: {
    canonical: 'https://swissnethotels.com/about',
  },
}

export default function AboutPage() {
  const gold = '#C9A84C'
  const bg = '#492816'
  const border = 'rgba(201,169,110,0.3)'
  const text = '#FFFFFF'
  const textMuted = 'rgba(255,255,255,0.6)'

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '10rem 2rem 6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>About</p>
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 300, color: text, margin: '0 0 2rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Built for the hotels<br />
          <span style={{ fontStyle: 'italic', color: gold }}>AI is changing.</span>
        </h1>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: 0 }}>
          Travel search is shifting. Guests are asking ChatGPT where to stay in Geneva, querying Perplexity for the best spa hotel in Zermatt, and reading Google AI Overviews before they ever click a link. The hotels that appear in those answers are capturing bookings. The ones that don't are losing them — often without knowing why.
        </p>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ height: '1px', background: border }} />
      </div>

      {/* Mission */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 2rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>What We Do</p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, lineHeight: 1.6, margin: '0 0 1.5rem' }}>
          SwissNet Hotels tracks, measures, and improves how Swiss luxury hotels appear across AI search platforms.
        </p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: '0 0 1.25rem' }}>
          We build structured, AI-readable profiles for each partner hotel — factual content, schema markup, FAQs, spa and dining data — optimised for how AI models retrieve and cite hotel information. Partner hotels receive a live dashboard showing their visibility across ChatGPT, Perplexity, and Google AI, with competitor benchmarking and weekly tracking.
        </p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: 0 }}>
          The goal is simple: when a traveller asks an AI where to stay, your hotel appears — and the booking goes direct.
        </p>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ height: '1px', background: border }} />
      </div>

      {/* Editorial */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 2rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>How Hotels Are Listed</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: '0 0 1.25rem' }}>
          Hotels listed on SwissNet are selected based on objective criteria: Swiss Deluxe Hotels membership, Leading Hotels of the World accreditation, official star classification, and direct editorial verification. No hotel is listed solely because of a commercial relationship.
        </p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: 0 }}>
          Partner hotels pay for access to visibility tools, schema optimisation, and the partner dashboard — not for rankings or placement in search results. All hotel descriptions, FAQs, and structured content are written independently by SwissNet based on verified hotel data.
        </p>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ height: '1px', background: border }} />
      </div>

      {/* Why Switzerland */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 2rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Why Switzerland</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: '0 0 1.25rem' }}>
          Switzerland is home to some of the world's most recognised luxury hotel names — properties that have defined alpine hospitality for over a century. Yet most of them remain largely invisible in AI search, while budget aggregators and OTA listings dominate the answers guests receive.
        </p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: 0 }}>
          That imbalance is the problem SwissNet was built to address.
        </p>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ height: '1px', background: border }} />
      </div>

      {/* Founder */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 2rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Founder</p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>Romeo Carpentier Alting</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: '0 0 1.25rem' }}>
          Currently studying at École Hôtelière de Lausanne — the world's leading hospitality management school — and working in luxury hotel marketing. SwissNet emerged from a direct observation: AI search was transforming how travellers discover hotels, and the industry had no clear answer to it.
        </p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: 0 }}>
          SwissNet is an attempt to build that answer — combining hospitality knowledge, AI research, and direct booking strategy into a platform built specifically for Swiss luxury properties.
        </p>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ height: '1px', background: border }} />
      </div>

      {/* Contact */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 2rem 10rem' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>Contact</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: '0 0 1.25rem' }}>
          For partnership enquiries, demo requests, or press:
        </p>
        <a href="mailto:contact@swissnethotels.com" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: gold, textDecoration: 'none', fontWeight: 500 }}>
          contact@swissnethotels.com
        </a>
        <div style={{ marginTop: '1.25rem' }}>
          <a href="https://www.linkedin.com/company/swissnet-hotels" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: gold, textDecoration: 'none', fontWeight: 500 }}>
            LinkedIn → SwissNet Hotels
          </a>
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: '2rem 0 0' }}>
          Switzerland
        </p>
      </section>

    </div>
  )
}