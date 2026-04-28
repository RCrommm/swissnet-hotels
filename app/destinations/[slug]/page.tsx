import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const DESTINATIONS: Record<string, {
  name: string
  region: string
  tagline: string
  description: string
  highlights: string[]
  bestFor: string[]
  image: string
}> = {
  'zermatt': {
    name: 'Zermatt',
    region: 'Valais, Swiss Alps',
    tagline: 'The jewel of the Swiss Alps',
    description: 'Zermatt is Switzerland\'s most iconic mountain resort, set at 1,620m in the shadow of the Matterhorn. A car-free village combining world-class skiing, luxury hotels and Michelin-starred dining with breathtaking alpine scenery.',
    highlights: ['Matterhorn views', 'Car-free village', 'World-class skiing', 'Fine dining', 'Year-round destination'],
    bestFor: ['Ski lovers', 'Honeymooners', 'Luxury travelers', 'Hikers', 'Foodies'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
  },
  'geneva': {
    name: 'Geneva',
    region: 'Lake Geneva, Switzerland',
    tagline: 'Where luxury meets lakeside elegance',
    description: 'Geneva is Switzerland\'s most cosmopolitan city, sitting on the shores of Europe\'s largest Alpine lake with views of Mont Blanc. Home to world-class hotels, Michelin-starred restaurants and the headquarters of international diplomacy.',
    highlights: ['Lake Geneva waterfront', 'Mont Blanc views', 'International atmosphere', 'Fine dining', 'Luxury shopping'],
    bestFor: ['Business travelers', 'Couples', 'Luxury travelers', 'City breaks', 'Art lovers'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
  },
  'st-moritz': {
    name: 'St. Moritz',
    region: 'Graubünden, Swiss Alps',
    tagline: 'The birthplace of winter tourism',
    description: 'St. Moritz has been the playground of royalty, celebrities and the ultra-wealthy since 1864. Set at 1,800m in the Engadin Valley, it combines legendary skiing, frozen lake polo and the most exclusive hotels in the Alps.',
    highlights: ['Legendary ski slopes', 'Frozen lake events', 'Celebrity history', 'Ultra-luxury hotels', 'Engadin Valley'],
    bestFor: ['Ultra luxury', 'Ski lovers', 'Socialites', 'Families', 'History enthusiasts'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
  },
  'interlaken': {
    name: 'Interlaken',
    region: 'Bern, Switzerland',
    tagline: 'Gateway to the Jungfrau region',
    description: 'Interlaken sits between Lake Thun and Lake Brienz, surrounded by the iconic Eiger, Mönch and Jungfrau peaks. A perfect base for exploring the UNESCO World Heritage Jungfrau-Aletsch region with grand hotels and spectacular mountain views.',
    highlights: ['Jungfrau views', 'Two lakes', 'Adventure sports', 'Grand hotels', 'UNESCO region'],
    bestFor: ['Families', 'Adventure seekers', 'Wellness', 'Nature lovers', 'Couples'],
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600',
  },
  'zurich': {
    name: 'Zurich',
    region: 'Zurich, Switzerland',
    tagline: 'Switzerland\'s vibrant financial capital',
    description: 'Zurich consistently ranks as one of the world\'s most liveable cities. A sophisticated blend of medieval old town, world-class museums, luxury shopping on Bahnhofstrasse and some of Switzerland\'s finest hotels overlooking Lake Zurich.',
    highlights: ['Old Town', 'Lake Zurich', 'World-class museums', 'Luxury shopping', 'Michelin dining'],
    bestFor: ['Business travelers', 'City breaks', 'Art lovers', 'Luxury travelers', 'Foodies'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600',
  },
  'gstaad': {
    name: 'Gstaad',
    region: 'Bern, Swiss Alps',
    tagline: 'Switzerland\'s most exclusive alpine village',
    description: 'Gstaad is the most exclusive ski resort in Switzerland — a small, chalet-style village that has attracted royalty, celebrities and the global elite for over a century. Home to The Alpina and Palace Hotel, two of Switzerland\'s finest properties.',
    highlights: ['Exclusive atmosphere', 'Celebrity destination', 'Palace Hotel', 'Ski area', 'Summer hiking'],
    bestFor: ['Ultra luxury', 'Celebrities', 'Ski lovers', 'Families', 'Privacy seekers'],
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600',
  },
  'lucerne': {
    name: 'Lucerne',
    region: 'Lucerne, Central Switzerland',
    tagline: 'The most beautiful city in Switzerland',
    description: 'Lucerne is widely considered Switzerland\'s most beautiful city, with its iconic Chapel Bridge, medieval old town and stunning location on Lake Lucerne surrounded by mountains. A perfect blend of culture, history and luxury hospitality.',
    highlights: ['Chapel Bridge', 'Lake Lucerne', 'Medieval old town', 'Mountain views', 'Cultural events'],
    bestFor: ['Couples', 'City breaks', 'History enthusiasts', 'Families', 'Luxury travelers'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
  },
  'verbier': {
    name: 'Verbier',
    region: 'Valais, Swiss Alps',
    tagline: 'The Alps\' most vibrant ski resort',
    description: 'Verbier is the liveliest ski resort in Switzerland — famous for its challenging off-piste terrain, legendary après-ski and the annual Verbier Festival. A younger, more energetic alternative to St. Moritz with world-class luxury hotels.',
    highlights: ['Off-piste skiing', 'Vibrant après-ski', 'Verbier Festival', 'W Hotel', 'Mont-Fort peak'],
    bestFor: ['Ski lovers', 'Party travelers', 'Young luxury', 'Music lovers', 'Adventure seekers'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
  },
}

export async function generateStaticParams() {
  return Object.keys(DESTINATIONS).map(slug => ({ slug }))
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dest = DESTINATIONS[slug]
  if (!dest) notFound()

  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('region', dest.name)
    .eq('is_active', true)
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false })

  const hotelsList = hotels || []

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const bg = '#F8F5EF'

  // Destination schema
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best Luxury Hotels in ${dest.name}, Switzerland`,
    description: dest.description,
    url: `https://swissnethotels.com/destinations/${slug}`,
    numberOfItems: hotelsList.length,
    itemListElement: hotelsList.map((h, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Hotel',
        name: h.name,
        url: `https://swissnethotels.com/hotels/${h.id}`,
        priceRange: `CHF ${h.nightly_rate_chf}+`,
        starRating: { '@type': 'Rating', ratingValue: h.rating },
        address: { '@type': 'PostalAddress', addressLocality: h.location, addressCountry: 'CH' },
      }
    }))
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <div style={{ position: 'relative', height: '50vh', overflow: 'hidden' }}>
        <img src={dest.image} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,43,31,0.75) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, marginBottom: '0.5rem' }}>{dest.region}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.5rem', fontWeight: 300, color: '#fff', margin: '0 0 0.5rem' }}>
            Luxury Hotels in {dest.name}
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', margin: 0, fontStyle: 'italic' }}>{dest.tagline}</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>
          <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
          <span>→</span>
          <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
          <span>→</span>
          <span style={{ color: text }}>{dest.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
          <div>
            {/* Description */}
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: textMuted, lineHeight: 1.9, fontWeight: 300 }}>{dest.description}</p>
            </div>

            {/* Hotels list */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>
                The Best Luxury Hotels in {dest.name}
              </h2>
              {hotelsList.length === 0 ? (
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted }}>No hotels listed yet for this destination.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hotelsList.map((hotel, i) => (
                    <Link key={hotel.id} href={`/hotels/${hotel.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#fff', border: hotel.is_partner ? `1px solid ${gold}88` : `1px solid ${border}`, padding: '1.25rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', transition: 'box-shadow 0.2s' }}>
                        {/* Rank */}
                        <div style={{ flexShrink: 0, width: 32, height: 32, background: i === 0 ? gold : bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 600, color: i === 0 ? '#1a0e06' : textMuted }}>#{i + 1}</span>
                        </div>
                        {/* Image */}
                        {hotel.images?.[0] && (
                          <div style={{ width: 80, height: 60, flexShrink: 0, overflow: 'hidden', borderRadius: 4 }}>
                            <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: text, margin: 0 }}>{hotel.name}</p>
                            {hotel.is_partner && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, background: gold, color: '#1a0e06', padding: '2px 8px', borderRadius: 20 }}>✦ Partner</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>★ {hotel.rating}</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }}>{hotel.category}</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold }}>From CHF {hotel.nightly_rate_chf?.toLocaleString()}/night</span>
                          </div>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {hotel.description}
                          </p>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: gold }}>View →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Highlights */}
            <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: text, marginBottom: '1rem' }}>Why {dest.name}?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dest.highlights.map(h => (
                  <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: gold, fontSize: '0.7rem' }}>✦</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best for */}
            <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: text, marginBottom: '1rem' }}>Best For</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {dest.bestFor.map(b => (
                  <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: '1px solid ' + border, padding: '0.3rem 0.75rem', background: bg }}>{b}</span>
                ))}
              </div>
            </div>

            {/* Other destinations */}
            <div style={{ background: '#fff', border: '1px solid ' + border, padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: text, marginBottom: '1rem' }}>Other Destinations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(DESTINATIONS).filter(([s]) => s !== slug).slice(0, 5).map(([s, d]) => (
                  <Link key={s} href={`/destinations/${s}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{d.name}</span>
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link href="/hotels" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, textDecoration: 'none' }}>
            ← View all hotels
          </Link>
        </div>
      </div>
    </div>
  )
}