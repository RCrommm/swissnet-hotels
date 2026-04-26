import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import Navigation from '@/components/Navigation'

export default async function HomePage() {
  const gold = '#C9A84C'
  const bg = '#492816'
  const bgLight = '#3D2010'
  const border = 'rgba(201,169,110,0.3)'
  const text = '#FFFFFF'
  const textMuted = 'rgba(255,255,255,0.6)'

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <Navigation />

      {/* Hero */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(73,40,22,0.6)' }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ width: '40px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>AI-Powered Hotel Visibility</p>
            <span style={{ width: '40px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 300, color: '#FFFFFF', lineHeight: 1.1, margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
            Get Your Hotel Found<br />
            <span style={{ fontStyle: 'italic', color: gold }}>in AI Search.</span>
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, maxWidth: '560px', margin: '0 auto 2.5rem' }}>
            SwissNet AI helps luxury hotels appear in ChatGPT, Claude, Gemini, and AI travel search — while reducing OTA dependence.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#contact" style={{ display: 'inline-block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid ' + gold, textDecoration: 'none' }}>Book a Demo</a>
            <Link href="/hotels" style={{ display: 'inline-block', background: 'transparent', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', textDecoration: 'none' }}>View Hotels</Link>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Scroll</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, ' + gold + ', transparent)' }} />
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: bgLight, borderTop: '1px solid ' + border, borderBottom: '1px solid ' + border, padding: '2.5rem 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {[
            { n: '15+', label: 'Partner Hotels' },
            { n: '10', label: 'Swiss Regions' },
            { n: '15%+', label: 'Saved vs OTAs' },
            { n: 'AI', label: 'Powered Discovery' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: gold, margin: '0 0 0.25rem' }}>{s.n}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Hotel Preview */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Join Us</p>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>See How Your Hotel Appears in AI Search</h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300, maxWidth: '560px', margin: '0 auto' }}>
            This is what your hotel looks like when a traveller searches on ChatGPT. Professional cards, live rates, and a direct booking button — all powered by SwissNet AI.
          </p>
        </div>
        <img
          src="/images/chatgpt-preview.webp"
          alt="SwissNet AI in ChatGPT"
          style={{ width: '100%', borderRadius: '12px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
        />
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <a href="#contact" style={{ display: 'inline-block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none' }}>Get Your Hotel Listed →</a>
        </div>
      </section>

      {/* Why SwissNet */}
      <section style={{ background: bgLight, borderTop: '1px solid ' + border, padding: '6rem 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>Why SwissNet AI?</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300 }}>AI search is replacing Google. Hotels that aren't visible in AI results are losing bookings every day.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '✦', title: 'AI Visibility', desc: 'Your hotel appears when travellers ask ChatGPT, Claude or Gemini for recommendations. We optimise your presence across all major AI platforms.' },
              { icon: '◆', title: 'Direct Bookings', desc: 'Every booking comes directly to you — no OTA commission, no middlemen. Guests book on your terms.' },
              { icon: '▲', title: 'Live Analytics', desc: 'See exactly how many times your hotel appeared in AI search, how many clicks you received, and how much revenue SwissNet drove.' },
            ].map(f => (
              <div key={f.title} style={{ textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid ' + border, background: '#FFFFFF' }}>
                <div style={{ color: gold, fontSize: '1rem', marginBottom: '1.25rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: '#2A1208', marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: 'rgba(42,18,8,0.6)', lineHeight: 1.8, fontWeight: 300, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Partners */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Trusted By</p>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>Official Partners</h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300 }}>Switzerland's finest luxury hotels trust SwissNet AI to drive direct bookings.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: '100px', border: '1px solid ' + border, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Partner Logo</p>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '1.5rem' }}>
          Interested in joining? <a href="#contact" style={{ color: gold, textDecoration: 'none' }}>Get in touch →</a>
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: bgLight, borderTop: '1px solid ' + border, padding: '6rem 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Simple Pricing</p>
              <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>Transparent Plans</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300, maxWidth: '500px', margin: '0 auto' }}>
              No setup fees. No long-term contracts. Cancel anytime.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>

            {/* Visibility Plan */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid ' + border, padding: '2.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: textMuted, margin: '0 0 1rem' }}>Visibility Plan</p>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text }}>CHF 499</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted }}> / month</span>
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: gold, margin: '0 0 1.5rem', letterSpacing: '0.05em' }}>+ 3% commission on SwissNet bookings</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, marginBottom: '2rem' }}>
                Perfect for hotels wanting a strong AI presence and performance tracking.
              </p>
              <div style={{ borderTop: '1px solid ' + border, paddingTop: '1.5rem', marginBottom: '2rem' }}>
                {[
                  'Hotel listing on SwissNet',
                  'AI search optimisation',
                  'Schema & structured data setup',
                  'Keyword control system',
                  'Basic analytics dashboard',
                  'Views, clicks & leads tracking',
                  'Direct booking link integration',
                  'Monthly visibility report',
                  'Standard support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: gold, fontSize: '0.7rem', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: textMuted, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="#contact" style={{ display: 'block', textAlign: 'center', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem', textDecoration: 'none' }}>
                Get Started
              </a>
            </div>

            {/* Growth Plan */}
            <div style={{ background: '#FFFFFF', border: '2px solid ' + gold, padding: '2.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.3rem 1rem' }}>
                Most Popular
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(42,18,8,0.5)', margin: '0 0 1rem' }}>Growth Plan</p>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: '#2A1208' }}>CHF 999</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(42,18,8,0.5)' }}> / month</span>
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: gold, margin: '0 0 1.5rem', letterSpacing: '0.05em' }}>+ 3% commission on SwissNet bookings</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(42,18,8,0.6)', lineHeight: 1.7, marginBottom: '2rem' }}>
                For hotels wanting active growth, priority placement, and maximum AI visibility.
              </p>
              <div style={{ borderTop: '1px solid rgba(201,169,110,0.3)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(42,18,8,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Everything in Visibility, plus:</p>
                {[
                  'Priority placement in AI recommendations',
                  'Featured on homepage & hotels page',
                  'Advanced analytics — revenue, OTA savings, competitor rank',
                  'Daily rate scraping & content updates',
                  'Search trend monitoring',
                  'AI prompt & demand insights',
                  'Competitor benchmarking',
                  'Monthly strategy recommendations',
                  'Priority support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: gold, fontSize: '0.7rem', flexShrink: 0, marginTop: '0.1rem' }}>✦</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: 'rgba(42,18,8,0.7)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="#contact" style={{ display: 'block', textAlign: 'center', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem', textDecoration: 'none' }}>
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ background: bg, borderTop: '1px solid ' + border, padding: '6rem 0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Get Started</p>
              <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>Contact Us</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300, lineHeight: 1.8 }}>
              Book a demo, join the platform, or simply ask us a question. We respond within 24 hours.
            </p>
          </div>
          <div style={{ border: '1px solid ' + border, padding: '2.5rem', background: 'rgba(255,255,255,0.04)' }}>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#2A1208', borderTop: '1px solid rgba(201,169,110,0.2)', padding: '4rem 0 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: gold, marginBottom: '1rem' }}>SwissNet <span style={{ fontStyle: 'italic', color: '#fff' }}>Hotels</span></p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontWeight: 300 }}>Switzerland's AI-powered luxury hotel discovery platform.</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>Explore</p>
            {['All Hotels', 'Zermatt', 'St. Moritz', 'Wellness'].map(l => (
              <a key={l} href={'/hotels' + (l !== 'All Hotels' ? '?region=' + l : '')} style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 300 }}>{l}</a>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>For Hotels</p>
            <a href="#pricing" style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 300 }}>Pricing</a>
            <a href="#contact" style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 300 }}>Book a Demo</a>
            <a href="/onboarding" style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 300 }}>Join the Platform</a>
            <a href="/dashboard/login" style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none', fontWeight: 400 }}>Hotel Login →</a>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '3rem auto 0', padding: '1.5rem 2rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>© {new Date().getFullYear()} SwissNet Hotels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}