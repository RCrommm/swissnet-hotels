import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HotelCard from '@/components/HotelCard'
import LeadForm from '@/components/LeadForm'
import RegionGrid from '@/components/RegionGrid'
import Navigation from '@/components/Navigation'

export default async function HomePage() {
  const { data: featuredHotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(3)

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }} className="animate-fade-up-delay-1">
            <span style={{ width: '40px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>AI-Powered Discovery</p>
            <span style={{ width: '40px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 300, color: '#FFFFFF', lineHeight: 1.1, margin: '0 0 1.5rem', letterSpacing: '-0.02em' }} className="animate-fade-up-delay-2">
            Get Your Hotel Found<br />
            <span style={{ fontStyle: 'italic', color: gold }}>in AI Search.</span>
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, maxWidth: '560px', margin: '0 auto 2.5rem' }} className="animate-fade-up-delay-3">
            SwissNet AI helps luxury hotels appear in ChatGPT, Claude, Gemini, and AI travel search — while reducing OTA dependence.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }} className="animate-fade-up-delay-4">
            <Link href="/hotels" style={{ display: 'inline-block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid ' + gold, textDecoration: 'none' }}>Explore Hotels</Link>
            <a href="#enquire" style={{ display: 'inline-block', background: 'transparent', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', textDecoration: 'none' }}>Send Enquiry</a>
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
            { n: '0%', label: 'OTA Commission' },
            { n: 'AI', label: 'Powered Discovery' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 400, color: gold, margin: '0 0 0.25rem' }}>{s.n}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Hotels */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Handpicked Selection</p>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: 0 }}>Featured Properties</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {(featuredHotels || []).map(hotel => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/hotels" style={{ display: 'inline-block', background: 'transparent', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid rgba(255,255,255,0.3)', color: text, textDecoration: 'none' }}>View All Hotels</Link>
        </div>
      </section>

      {/* Why SwissNet */}
      <section style={{ background: bgLight, borderTop: '1px solid ' + border, padding: '6rem 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>Why Book Direct?</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300 }}>Hotels save 15–25% in OTA commissions. You get better rates and real human service.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '✦', title: 'No Hidden Fees', desc: 'Direct rates are always equal to or better than any OTA. No booking fees. No service charges.' },
              { icon: '◆', title: 'Exclusive Offers', desc: 'Partner hotels offer perks only available through SwissNet Hotels — spa credits, room upgrades, private transfers.' },
              { icon: '▲', title: 'AI-Matched', desc: 'Our AI finds the perfect hotel for your specific dates, group, and preferences in seconds.' },
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

      {/* Regions */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: 0 }}>Explore by Region</h2>
        </div>
        <RegionGrid />
      </section>

      {/* Lead capture */}
      <section id="enquire" style={{ background: bgLight, borderTop: '1px solid ' + border, padding: '6rem 0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>Personal Service</p>
              <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>Not Sure Where to Stay?</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300, lineHeight: 1.8 }}>Tell us your dates and preferences. Our concierge team will match you with the perfect Swiss hotel within 24 hours.</p>
          </div>
          <div style={{ border: '1px solid ' + border, padding: '2.5rem', background: '#FFFFFF' }}>
            <LeadForm />
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
            <a href="mailto:hotels@swissnethostels.com" style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 300 }}>List your hotel</a>
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