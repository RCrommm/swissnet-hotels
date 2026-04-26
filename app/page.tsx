import Link from 'next/link'
import { supabase } from '@/lib/supabase'
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

  const mockHotels = [
    {
      name: 'Mont Cervin Palace',
      location: 'Zermatt, Switzerland',
      rating: 4.9,
      rate: 920,
      booking_rate: 980,
      expedia_rate: 995,
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600',
      tag: 'Best for Couples',
      amenities: ['Matterhorn View', 'Fine Dining'],
      desc: 'Timeless elegance in the heart of Zermatt. Luxurious rooms with iconic Matterhorn views and award-winning spa for the ultimate couples escape.',
    },
    {
      name: 'Hotel Monte Rosa',
      location: 'Zermatt, Switzerland',
      rating: 4.8,
      rate: 785,
      booking_rate: 840,
      expedia_rate: 860,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
      tag: 'Wellness Retreat',
      amenities: ['Matterhorn View', 'Wellness Spa'],
      desc: 'A serene wellness retreat with panoramic Matterhorn views, exceptional cuisine, and one of Zermatt\'s finest spa areas.',
    },
    {
      name: 'Schweizerhof Zermatt',
      location: 'Zermatt, Switzerland',
      rating: 4.9,
      rate: 600,
      booking_rate: 640,
      expedia_rate: 670,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600',
      tag: 'Iconic Luxury',
      amenities: ['Matterhorn View', 'Michelin Dining'],
      desc: 'Zermatt\'s legendary grand hotel. Unmatched service, elegant rooms, and stunning Matterhorn views in a historic setting.',
    },
  ]

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

        {/* ChatGPT mockup — white background like real ChatGPT */}
        <div style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {/* Browser bar */}
          <div style={{ background: '#f5f5f5', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
            <div style={{ flex: 1, background: '#fff', borderRadius: '6px', padding: '0.25rem 0.75rem', marginLeft: '0.75rem', border: '1px solid #e5e5e5' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#999', margin: 0 }}>chatgpt.com</p>
            </div>
          </div>

          {/* ChatGPT sidebar + content */}
          <div style={{ display: 'flex' }}>
            {/* Sidebar */}
            <div style={{ width: '220px', background: '#f9f9f9', borderRight: '1px solid #e5e5e5', padding: '1rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '28px', height: '28px', background: '#000', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700, margin: 0 }}>✦</p>
                </div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>ChatGPT</p>
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#888', margin: '0 0 0.5rem' }}>New chat</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#888', margin: '0 0 0.5rem' }}>Search chats</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#888', margin: 0 }}>Library</p>
              <div style={{ marginTop: '2rem', padding: '0.75rem', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, color: '#1a1a1a', margin: '0 0 0.2rem' }}>SwissNet AI</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#888', margin: '0 0 0.2rem' }}>AI-Powered Hotel Discovery</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: gold, margin: 0 }}>swissnet-hotels.com</p>
              </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, padding: '1.5rem 2rem', overflowX: 'auto' }}>
              {/* User question */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f0f0f0', padding: '0.75rem 1rem', maxWidth: '480px', borderRadius: '18px 18px 4px 18px' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: '#1a1a1a', margin: 0 }}>What are the best luxury hotels with a Matterhorn view in Zermatt for a couples relaxing retreat?</p>
                </div>
              </div>

              {/* AI response */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <p style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700, margin: 0 }}>✦</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: '#1a1a1a', marginBottom: '1.25rem', lineHeight: 1.7 }}>
                    Here are some of the best luxury hotels in Zermatt offering breathtaking Matterhorn views, perfect for a romantic and relaxing retreat.
                  </p>

                  {/* Hotel cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1rem' }}>
                    {mockHotels.map((hotel, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e5e5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ position: 'relative', height: '150px', overflow: 'hidden' }}>
                          <img src={hotel.image} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                            {hotel.tag}
                          </div>
                        </div>
                        <div style={{ padding: '0.875rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                            <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: '#1a1a1a', margin: 0, fontWeight: 600, lineHeight: 1.3 }}>{hotel.name}</h4>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#666', flexShrink: 0, marginLeft: '0.5rem' }}>★ {hotel.rating}</span>
                          </div>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#888', margin: '0 0 0.5rem' }}>📍 {hotel.location}</p>
                          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            {hotel.amenities.map(a => (
                              <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: '#555', background: '#f5f5f5', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{a}</span>
                            ))}
                          </div>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#666', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{hotel.desc}</p>

                          <div style={{ background: '#f9f9f9', borderRadius: '6px', padding: '0.5rem', marginBottom: '0.5rem' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: '#10a37f', fontWeight: 700, letterSpacing: '0.05em', margin: '0 0 0.3rem' }}>✓ BEST PRICE GUARANTEED</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: gold, margin: 0, fontWeight: 700 }}>CHF {hotel.rate}</p>
                                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: '#aaa', margin: 0 }}>/night</p>
                              </div>
                              <div style={{ fontSize: '0.55rem', color: '#888', fontFamily: 'Montserrat, sans-serif' }}>
                                <p style={{ margin: '0 0 0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span style={{ background: '#003580', color: '#fff', padding: '0.1rem 0.3rem', borderRadius: '2px', fontWeight: 700, fontSize: '0.5rem' }}>B</span>
                                  Booking.com CHF {hotel.booking_rate}
                                </p>
                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span style={{ color: '#ff6600', fontWeight: 700 }}>✈</span>
                                  Expedia CHF {hotel.expedia_rate}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button style={{ flex: 1, background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '0.4rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#333', cursor: 'pointer', fontWeight: 500 }}>View Details</button>
                            <button style={{ flex: 1, background: gold, border: 'none', borderRadius: '6px', padding: '0.4rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Book Now</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#aaa', margin: 0, fontStyle: 'italic' }}>
                    Prices are indicative and may vary depending on dates and availability. Always book directly through the hotel for the best rate and benefits.
                  </p>
                </div>
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