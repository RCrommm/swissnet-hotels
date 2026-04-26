import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HotelCard from '@/components/HotelCard'
import ContactForm from '@/components/ContactForm'
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
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>AI Hotel Preview</h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, fontWeight: 300, maxWidth: '560px', margin: '0 auto' }}>
            This is what your hotel looks like when a traveller searches on ChatGPT. Professional cards, live rates, and a direct booking button — all powered by SwissNet AI.
          </p>
        </div>

        {/* ChatGPT mockup */}
        <div style={{ border: '1px solid ' + border, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderBottom: '1px solid ' + border, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.3rem 0.75rem', marginLeft: '0.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>chatgpt.com</p>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid ' + border, padding: '0.75rem 1.25rem', maxWidth: '500px', borderRadius: '8px 8px 2px 8px' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: text, margin: 0 }}>What are the best luxury hotels with a Matterhorn view in Zermatt for a couples relaxing retreat?</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10a37f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <p style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, margin: 0 }}>AI</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted, marginBottom: '1.5rem', lineHeight: 1.7 }}>
                  Here are the best luxury hotels in Zermatt offering breathtaking Matterhorn views, perfect for a romantic and relaxing retreat.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  {(featuredHotels || []).slice(0, 3).map((hotel, i) => (
                    <div key={hotel.id} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                      <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                        <img src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600'} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>
                          {i === 0 ? 'Best for Couples' : i === 1 ? 'Wellness Retreat' : 'Iconic Luxury'}
                        </div>
                      </div>
                      <div style={{ padding: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: '#1a1a1a', margin: 0, fontWeight: 600 }}>{hotel.name}</h4>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#666' }}>★ {hotel.rating}</span>
                        </div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#888', margin: '0 0 0.5rem' }}>📍 {hotel.location}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                          {hotel.amenities.slice(0, 2).map((a: string) => (
                            <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#666', background: '#f5f5f5', padding: '0.2rem 0.4rem', borderRadius: '2px' }}>{a}</span>
                          ))}
                        </div>
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: gold, margin: 0, fontWeight: 700 }}>CHF {hotel.nightly_rate_chf.toLocaleString()}</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#aaa', margin: 0 }}>/night · Best Price</p>
                          </div>
                          <a href={`/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=ai_preview`} target="_blank" rel="noopener noreferrer" style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.4rem 0.875rem', borderRadius: '4px', textDecoration: 'none' }}>
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', margin: '0.75rem 0 0', fontStyle: 'italic' }}>
                  Powered by SwissNet AI · swissnet-hotels.com
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
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

      {/* Contact */}
      <section id="contact" style={{ background: bgLight, borderTop: '1px solid ' + border, padding: '6rem 0' }}>
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