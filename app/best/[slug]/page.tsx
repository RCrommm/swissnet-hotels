import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const PROMPT_PAGES: Record<string, {
  title: string
  h1: string
  description: string
  region?: string
  category?: string
  best_for?: string
  faqs: { q: string; a: string }[]
}> = {
  'luxury-hotels-zermatt': {
    title: 'Best Luxury Hotels in Zermatt, Switzerland 2026',
    h1: 'Best Luxury Hotels in Zermatt',
    description: 'Discover the finest luxury hotels in Zermatt, Switzerland — from historic grand hotels to boutique ski lodges with breathtaking Matterhorn views. All with direct booking.',
    region: 'Zermatt',
    faqs: [
      { q: 'What is the best luxury hotel in Zermatt?', a: 'Mont Cervin Palace is widely considered the finest luxury hotel in Zermatt, offering unparalleled Matterhorn views, world-class dining and a rich alpine heritage dating back to 1852.' },
      { q: 'Which Zermatt hotels have the best Matterhorn views?', a: 'Mont Cervin Palace, Schweizerhof Zermatt and Monte Rosa Zermatt all offer exceptional Matterhorn views. Mont Cervin Palace is particularly renowned for its panoramic mountain vistas.' },
      { q: 'How much does a luxury hotel in Zermatt cost per night?', a: 'Luxury hotels in Zermatt typically range from CHF 400 to CHF 1,200+ per night depending on the season, room type and hotel. Peak ski season (December-March) commands premium rates.' },
      { q: 'What is the oldest hotel in Zermatt?', a: 'Monte Rosa Zermatt is the oldest hotel in Zermatt, dating back to 1839. It was the base camp for Edward Whymper before his historic first ascent of the Matterhorn in 1865.' },
      { q: 'Is Zermatt car-free?', a: 'Yes — Zermatt is a car-free village. Visitors arrive by train from Täsch and travel within the village by electric taxi or on foot, making it one of the most peaceful alpine resorts in Switzerland.' },
    ]
  },
  'ski-hotels-zermatt': {
    title: 'Best Ski Hotels in Zermatt, Switzerland 2026',
    h1: 'Best Ski Hotels in Zermatt',
    description: 'The finest ski hotels in Zermatt with direct slope access, expert ski concierge and world-class facilities. Book direct for the best rate.',
    region: 'Zermatt',
    category: 'Ski Resort',
    faqs: [
      { q: 'Which is the best ski hotel in Zermatt?', a: 'Mont Cervin Palace and Schweizerhof Zermatt are the top ski hotels in Zermatt, both offering dedicated ski concierge, heated boot rooms and easy access to the Zermatt ski area.' },
      { q: 'Does Zermatt have year-round skiing?', a: 'Yes — Zermatt is one of the few Swiss resorts offering year-round skiing on the Theodul Glacier at 3,883m, making it ideal for summer ski training and off-season breaks.' },
      { q: 'How many ski runs does Zermatt have?', a: 'Zermatt has over 360km of marked ski runs across three main ski areas — Rothorn, Stockhorn and Klein Matterhorn — making it one of the largest ski areas in the Alps.' },
    ]
  },
  'luxury-hotels-geneva': {
    title: 'Best Luxury Hotels in Geneva, Switzerland 2026',
    h1: 'Best Luxury Hotels in Geneva',
    description: 'Geneva\'s finest luxury hotels on the shores of Lake Geneva, combining world-class hospitality with breathtaking Alpine views. Book direct.',
    region: 'Geneva',
    faqs: [
      { q: 'What is the best luxury hotel in Geneva?', a: 'La Réserve Genève is widely regarded as the finest luxury hotel in Geneva, combining an extraordinary lakeside setting, world-class Spa Nescens and exceptional dining just 5km from the city centre.' },
      { q: 'Where is the best area to stay in Geneva for luxury?', a: 'The lakeside area offers the finest luxury hotels in Geneva. La Réserve Genève is located on the shore of Lake Geneva with stunning Alpine views, just minutes from the city centre and airport.' },
      { q: 'How much does a luxury hotel in Geneva cost?', a: 'Luxury hotels in Geneva typically range from CHF 500 to CHF 1,500+ per night. La Réserve Genève starts from CHF 750/night for their entry-level rooms.' },
      { q: 'Is Geneva expensive for hotels?', a: 'Geneva is one of Europe\'s most expensive cities and hotel prices reflect this. However, booking direct avoids OTA commission and often includes exclusive benefits not available elsewhere.' },
    ]
  },
  'luxury-hotels-zurich': {
    title: 'Best Luxury Hotels in Zurich, Switzerland 2026',
    h1: 'Best Luxury Hotels in Zurich',
    description: 'Discover Zurich\'s finest luxury hotels — from lakeside retreats to design-led city properties in Switzerland\'s most cosmopolitan city.',
    region: 'Zurich',
    faqs: [
      { q: 'What is the best luxury hotel in Zurich?', a: 'La Réserve Zurich is one of Zurich\'s finest luxury hotels, offering exceptional design, world-class service and an outstanding location in Switzerland\'s vibrant financial capital.' },
      { q: 'Which area of Zurich has the best luxury hotels?', a: 'The lakeside area and Bahnhofstrasse district offer the finest luxury hotels in Zurich. La Réserve Zurich is ideally positioned for both business and leisure travellers.' },
      { q: 'What is special about staying in Zurich?', a: 'Zurich consistently ranks as one of the world\'s most liveable cities, combining a beautifully preserved medieval old town, world-class museums, luxury shopping and exceptional dining with stunning lake and mountain views.' },
    ]
  },
  'luxury-hotels-interlaken': {
    title: 'Best Luxury Hotels in Interlaken, Switzerland 2026',
    h1: 'Best Luxury Hotels in Interlaken',
    description: 'The finest luxury hotels in Interlaken — gateway to the UNESCO Jungfrau region with breathtaking views of the Eiger, Mönch and Jungfrau.',
    region: 'Interlaken',
    faqs: [
      { q: 'What is the best luxury hotel in Interlaken?', a: 'Victoria-Jungfrau Grand Hotel & Spa is the grandest and most celebrated luxury hotel in Interlaken, offering iconic Jungfrau views, a world-class spa and over 150 years of Swiss grand hotel tradition.' },
      { q: 'What can you do from Interlaken?', a: 'Interlaken is the perfect base for the Jungfrau region — day trips to Jungfraujoch (Top of Europe), skiing at Grindelwald and Wengen, hiking, paragliding and exploring the spectacular Bernese Oberland.' },
      { q: 'When is the best time to visit Interlaken?', a: 'Interlaken is beautiful year-round. Summer (June-September) offers hiking and outdoor activities, while winter (December-March) provides excellent skiing access from the valley.' },
    ]
  },
  'luxury-hotels-bern': {
    title: 'Best Luxury Hotels in Bern, Switzerland 2026',
    h1: 'Best Luxury Hotels in Bern',
    description: 'Stay in Bern\'s finest luxury hotels — in the heart of Switzerland\'s UNESCO World Heritage capital city.',
    region: 'Bern',
    faqs: [
      { q: 'What is the best luxury hotel in Bern?', a: 'Bellevue Palace is Bern\'s most prestigious hotel, a landmark property that has hosted world leaders, royalty and dignitaries since 1913 — overlooking the Aare river with stunning Alpine views.' },
      { q: 'Is Bern worth visiting for a luxury stay?', a: 'Absolutely — Bern is one of Europe\'s most underrated capitals. The UNESCO-listed old town, Rose Garden views, Federal Palace and exceptional Swiss cuisine make it a compelling luxury destination.' },
      { q: 'How far is Bern from Zurich and Geneva?', a: 'Bern is perfectly positioned between Zurich (1 hour by train) and Geneva (1.5 hours by train), making it an ideal base for exploring Switzerland or a natural stopover on a Swiss luxury itinerary.' },
    ]
  },
  'ski-hotels-switzerland': {
    title: 'Best Ski Hotels in Switzerland 2026',
    h1: 'Best Ski Hotels in Switzerland',
    description: 'Switzerland\'s finest ski hotels across Zermatt, Crans-Montana, Davos and St. Moritz — with expert ski concierge, slope access and alpine luxury.',
    category: 'Ski Resort',
    faqs: [
      { q: 'What are the best ski hotels in Switzerland?', a: 'The finest ski hotels in Switzerland include Mont Cervin Palace and Schweizerhof Zermatt in Zermatt, Crans Ambassador in Crans-Montana, and Alpengold Hotel in Davos — all offering exceptional ski access and luxury facilities.' },
      { q: 'Which Swiss ski resort is best for luxury?', a: 'Zermatt is consistently ranked Switzerland\'s top luxury ski destination, followed by St. Moritz and Verbier. Zermatt\'s car-free village, year-round skiing and Matterhorn backdrop make it uniquely special.' },
      { q: 'When is ski season in Switzerland?', a: 'The main Swiss ski season runs from December to April. Zermatt offers year-round skiing on the Theodul Glacier. Christmas and February half-term are the busiest and most expensive periods.' },
      { q: 'Do Swiss ski hotels include ski passes?', a: 'Most luxury Swiss ski hotels offer ski pass packages, though passes are rarely included in the base rate. A ski concierge service is standard at partner hotels and will arrange passes, equipment rental and lessons.' },
    ]
  },
  'wellness-hotels-switzerland': {
    title: 'Best Wellness Hotels in Switzerland 2026',
    h1: 'Best Wellness Hotels in Switzerland',
    description: 'Switzerland\'s premier wellness retreats — combining Alpine spa traditions, thermal pools and expert treatments in breathtaking mountain settings.',
    category: 'Wellness Retreat',
    faqs: [
      { q: 'What are the best wellness hotels in Switzerland?', a: 'The finest wellness hotels in Switzerland include Hotel Adula in Flims, Victoria-Jungfrau Grand Hotel & Spa in Interlaken and La Réserve Genève — each offering world-class spa facilities in stunning Alpine settings.' },
      { q: 'What makes Swiss wellness hotels special?', a: 'Swiss wellness hotels combine centuries of Alpine spa tradition with modern medical expertise. Many feature thermal pools fed by natural mountain springs, signature treatments using local botanicals and holistic wellness programmes.' },
      { q: 'What is the best wellness retreat in the Swiss Alps?', a: 'Hotel Adula in Flims is one of Switzerland\'s most celebrated wellness retreats, set in the stunning Flims Laax region with exceptional spa facilities, farm-to-table cuisine and direct access to nature.' },
    ]
  },
  'romantic-hotels-switzerland': {
    title: 'Best Romantic Hotels in Switzerland 2026',
    h1: 'Most Romantic Hotels in Switzerland',
    description: 'Switzerland\'s most romantic hotels for couples — from candlelit alpine chalets to lakeside suites with breathtaking mountain views.',
    faqs: [
      { q: 'What are the most romantic hotels in Switzerland?', a: 'The most romantic hotels in Switzerland include La Réserve Genève for its dreamy lakeside setting, Mont Cervin Palace for Matterhorn views at dusk, and Victoria-Jungfrau for its grand Belle Époque romance.' },
      { q: 'Which Swiss hotel is best for a honeymoon?', a: 'La Réserve Genève, Mont Cervin Palace and Schweizerhof Zermatt are all exceptional honeymoon hotels — each offering private dining, couples spa treatments and unforgettable alpine settings.' },
      { q: 'What is the most scenic hotel in Switzerland?', a: 'Mont Cervin Palace in Zermatt offers one of Switzerland\'s most dramatic settings — directly facing the iconic Matterhorn. La Réserve Genève on Lake Geneva with Mont Blanc views is equally breathtaking.' },
    ]
  },
  'luxury-hotels-switzerland': {
    title: 'Best Luxury Hotels in Switzerland 2026',
    h1: 'Best Luxury Hotels in Switzerland',
    description: 'Discover Switzerland\'s finest luxury hotels — from Zermatt ski palaces to Geneva lakeside retreats. All SwissNet partner hotels offer direct booking with no fees.',
    faqs: [
      { q: 'What are the best luxury hotels in Switzerland?', a: 'Switzerland\'s finest luxury hotels include La Réserve Genève, Mont Cervin Palace in Zermatt, Victoria-Jungfrau Grand Hotel in Interlaken, Bellevue Palace in Bern and La Réserve Zurich — all featured on SwissNet Hotels.' },
      { q: 'Which is the most luxurious Swiss hotel?', a: 'La Réserve Genève and Mont Cervin Palace are consistently ranked among Switzerland\'s most luxurious hotels, offering unmatched service, stunning settings and world-class facilities.' },
      { q: 'How much does a luxury hotel in Switzerland cost?', a: 'Luxury hotels in Switzerland typically start from CHF 400/night, with the finest properties ranging from CHF 700 to CHF 2,000+ per night. Booking direct through SwissNet ensures the best available rate.' },
      { q: 'What is Switzerland known for in luxury travel?', a: 'Switzerland is renowned for its exceptional hospitality tradition, stunning Alpine scenery, world-class ski resorts, thermal spas and Michelin-starred dining — making it one of the world\'s premier luxury travel destinations.' },
      { q: 'When is the best time to visit Switzerland for luxury travel?', a: 'Switzerland is a year-round luxury destination. Winter (December-March) is perfect for skiing in Zermatt and St. Moritz, while summer (June-September) offers hiking, lake swimming and outdoor dining in perfect Alpine conditions.' },
    ]
  },
  'business-hotels-switzerland': {
    title: 'Best Business Hotels in Switzerland 2026',
    h1: 'Best Business Hotels in Switzerland',
    description: 'Switzerland\'s premier business hotels in Geneva, Zurich and Bern — combining world-class meeting facilities with luxury hospitality.',
    category: 'City Luxury',
    faqs: [
      { q: 'What are the best business hotels in Switzerland?', a: 'The finest business hotels in Switzerland include La Réserve Genève and La Réserve Zurich for international executives, and Bellevue Palace in Bern for government and diplomatic visits.' },
      { q: 'Which Swiss city is best for business travel?', a: 'Geneva and Zurich are Switzerland\'s top business destinations. Geneva hosts numerous international organisations and multinational headquarters, while Zurich is the financial capital with excellent transport links.' },
      { q: 'Do Swiss luxury hotels have good meeting facilities?', a: 'Yes — Swiss luxury hotels are renowned for their meeting and event facilities, combining state-of-the-art technology with exceptional catering and dedicated event coordination teams.' },
    ]
  },
  'wellness-hotels-flims': {
    title: 'Best Wellness Hotels in Flims, Switzerland 2026',
    h1: 'Best Wellness Hotels in Flims',
    description: 'Flims is one of Switzerland\'s premier wellness destinations — surrounded by ancient forests, crystal-clear lakes and the dramatic Rhine Gorge.',
    region: 'Flims',
    faqs: [
      { q: 'What is the best wellness hotel in Flims?', a: 'Hotel Adula is the finest wellness hotel in Flims, offering an exceptional spa, farm-to-table cuisine and direct access to the stunning Flims Laax natural landscape.' },
      { q: 'Why is Flims good for wellness?', a: 'Flims sits in one of Switzerland\'s most pristine natural environments — surrounded by ancient forests, the turquoise Caumasee lake and the dramatic Rhine Gorge. The pure Alpine air and natural setting make it ideal for wellness retreats.' },
      { q: 'How do I get to Flims from Zurich?', a: 'Flims is approximately 1.5 hours from Zurich by train to Chur, then bus or taxi to Flims. The journey through the Rhine Valley is scenic and the perfect introduction to the Graubünden region.' },
    ]
  },
  'ski-hotels-crans-montana': {
    title: 'Best Ski Hotels in Crans-Montana, Switzerland 2026',
    h1: 'Best Ski Hotels in Crans-Montana',
    description: 'Crans-Montana sits at 1,500m in the Swiss Alps with panoramic views over the Rhône Valley — one of Switzerland\'s most celebrated ski destinations.',
    region: 'Crans-Montana',
    faqs: [
      { q: 'What is the best ski hotel in Crans-Montana?', a: 'Crans Ambassador is one of Crans-Montana\'s finest ski hotels, combining luxurious accommodation with excellent ski access, a world-class spa and panoramic views over the Rhône Valley.' },
      { q: 'How does Crans-Montana compare to Zermatt?', a: 'Crans-Montana offers a sunnier, more open ski area at lower altitude than Zermatt, with excellent intermediate terrain and a sophisticated resort atmosphere. Zermatt has more challenging terrain and the iconic Matterhorn backdrop.' },
      { q: 'When is the best time to ski in Crans-Montana?', a: 'Crans-Montana\'s ski season runs from December to April, with the resort known for exceptional sunshine hours — earning it the nickname "the sunny balcony of the Alps".' },
    ]
  },
  'ski-hotels-davos': {
    title: 'Best Ski Hotels in Davos, Switzerland 2026',
    h1: 'Best Ski Hotels in Davos',
    description: 'Davos is Europe\'s highest city and one of Switzerland\'s premier ski destinations — combining world-class skiing with luxury hospitality.',
    region: 'Davos',
    faqs: [
      { q: 'What is the best ski hotel in Davos?', a: 'Alpengold Hotel is one of Davos\'s finest boutique ski hotels, combining contemporary alpine design with warm Swiss hospitality and excellent access to the Parsenn and Jakobshorn ski areas.' },
      { q: 'Is Davos good for skiing?', a: 'Davos is one of Switzerland\'s premier ski destinations, sharing the vast Parsenn ski area with Klosters. With over 300km of marked runs, it suits all levels from beginners to expert off-piste skiers.' },
      { q: 'What else is Davos known for besides skiing?', a: 'Davos is internationally known as the home of the World Economic Forum (WEF), held each January. The town also has excellent cross-country skiing, a natural ice rink and the famous Davos Congress Centre.' },
    ]
  },
}

export async function generateStaticParams() {
  return Object.keys(PROMPT_PAGES).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = PROMPT_PAGES[slug]
  if (!page) return {}
  return {
    title: page.title + ' | SwissNet Hotels',
    description: page.description,
  }
}

export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = PROMPT_PAGES[slug]
  if (!page) notFound()

  // Fetch relevant hotels
  let query = supabase.from('hotels').select('*').eq('is_active', true).eq('is_partner', true)
  if (page.region) query = query.eq('region', page.region)
  if (page.category) query = query.eq('category', page.category)
  const { data: hotels } = await query.order('rating', { ascending: false })

  // If no specific filter, get all partners
  const { data: allPartners } = !page.region && !page.category
    ? await supabase.from('hotels').select('*').eq('is_active', true).eq('is_partner', true).order('rating', { ascending: false })
    : { data: null }

  const hotelsList = hotels?.length ? hotels : (allPartners || [])

  const gold = '#C9A84C'
  const border = 'rgba(201,169,76,0.2)'
  const text = '#1a0e06'
  const textMuted = 'rgba(26,14,6,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: page.title,
    description: page.description,
    url: `https://swissnethotels.com/best/${slug}`,
    numberOfItems: hotelsList.length,
    itemListElement: hotelsList.map((h: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Hotel',
        name: h.name,
        url: `https://swissnethotels.com/hotels/${h.slug || h.id}`,
        priceRange: `CHF ${h.nightly_rate_chf}+`,
        starRating: { '@type': 'Rating', ratingValue: h.star_classification || 5 },
        address: { '@type': 'PostalAddress', addressLocality: h.location, addressCountry: 'CH' },
      }
    }))
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
      { '@type': 'ListItem', position: 2, name: 'Best Hotels', item: 'https://swissnethotels.com/best' },
      { '@type': 'ListItem', position: 3, name: page.h1, item: `https://swissnethotels.com/best/${slug}` },
    ]
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <div style={{ background: '#1a0e06', padding: '6rem 2rem 4rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span style={{ color: gold }}>Best Hotels</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>SwissNet Hotels</p>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, color: white, margin: '0 0 1.5rem', lineHeight: 1.1 }}>{page.h1}</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto', fontWeight: 300 }}>{page.description}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ {hotelsList.length} Partner Hotels</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ Direct Booking</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ No Fees</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ Best Rate Guaranteed</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }}>

          {/* Hotel list */}
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 2rem' }}>
              {hotelsList.length} {page.h1}
            </h2>

            {hotelsList.length === 0 ? (
              <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted }}>No hotels found for this category yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {hotelsList.map((hotel: any, i: number) => (
                  <div key={hotel.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', gap: 0 }}>
                    {/* Rank */}
                    <div style={{ width: 56, flexShrink: 0, background: i === 0 ? gold : bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 600, color: i === 0 ? '#1a0e06' : textMuted }}>#{i + 1}</span>
                    </div>
                    {/* Image */}
                    {hotel.images?.[0] && (
                      <div style={{ width: 140, flexShrink: 0, overflow: 'hidden' }}>
                        <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    {/* Content */}
                    <div style={{ flex: 1, padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: 0 }}>{hotel.name}</h3>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, background: gold, color: '#1a0e06', padding: '2px 8px', borderRadius: 20 }}>✦ Partner</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              {Array.from({ length: hotel.star_classification || 5 }).map((_, si) => (
                                <span key={si} style={{ color: gold, fontSize: '0.55rem' }}>★</span>
                              ))}
                            </div>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>{hotel.location}</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>·</span>
                            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: textMuted }}>{hotel.category}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0, lineHeight: 1 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</p>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0.1rem 0 0' }}>/night</p>
                        </div>
                      </div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: '0 0 1rem', fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                        {hotel.description}
                      </p>
                      {hotel.best_for?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {hotel.best_for.slice(0, 3).map((b: string) => (
                            <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, background: bg, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 2 }}>{b}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link href={`/hotels/${hotel.slug || hotel.id}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: text, border: `1px solid ${border}`, padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: 2 }}>
                          View Profile
                        </Link>
                        {hotel.direct_booking_url && (
                          <a href={`/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=best_page`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a0e06', background: gold, padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: 2 }}>
                            Book Direct →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FAQs */}
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.5rem' }}>
                Frequently Asked Questions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {page.faqs.map((faq, i) => (
                  <div key={i} style={{ background: white, border: `1px solid ${border}`, padding: '1.25rem 1.5rem', borderRadius: 8 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>Q.</span>{faq.q}
                    </p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: 0, fontWeight: 300 }}>
                      <span style={{ color: gold, marginRight: '0.5rem' }}>A.</span>{faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: '0 0 1rem' }}>Why Book Direct?</h3>
              {[
                { icon: '✓', title: 'No OTA Fees', desc: 'Save 10-15% vs booking platforms' },
                { icon: '✓', title: 'Best Rate', desc: 'Guaranteed lowest available rate' },
                { icon: '✓', title: 'Direct Relationship', desc: 'Communicate directly with the hotel' },
                { icon: '✓', title: 'Flexible Terms', desc: 'Better cancellation policies' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <span style={{ color: gold, fontSize: '0.8rem', flexShrink: 0, marginTop: '0.1rem' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: text, margin: '0 0 0.15rem' }}>{item.title}</p>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: textMuted, margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Related pages */}
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: '0 0 1rem' }}>Related Guides</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(PROMPT_PAGES).filter(([s]) => s !== slug).slice(0, 6).map(([s, p]) => (
                  <Link key={s} href={`/best/${s}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
                    <span>{p.h1}</span>
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}