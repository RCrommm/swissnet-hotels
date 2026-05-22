export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dest = DESTINATIONS[slug]
  if (!dest) return {}
  return {
    title: `Best Luxury Hotels in ${dest.name}, Switzerland 2026 | SwissNet Hotels`,
    description: `Discover the best luxury hotels in ${dest.name}, Switzerland. ${dest.tagline}. Expert guide with hotel comparisons, seasonal tips and direct booking.`,
    alternates: { canonical: `https://swissnethotels.com/destinations/${slug}` },
    openGraph: {
      title: `Best Luxury Hotels in ${dest.name}, Switzerland`,
      description: dest.description,
    }
  }
}

type Destination = {
  name: string
  region: string
  tagline: string
  description: string
  highlights: string[]
  bestFor: string[]
  image: string
  seasonal?: string
  bestPages?: { label: string; href: string }[]
  compareLinks?: { label: string; href: string }[]
  faqs?: { q: string; a: string }[]
}

const DESTINATIONS: Record<string, Destination> = {
  'zermatt': {
    name: 'Zermatt',
    region: 'Valais, Swiss Alps',
    tagline: 'The jewel of the Swiss Alps',
    description: 'Zermatt is Switzerland\'s most iconic mountain resort, set at 1,620m in the shadow of the Matterhorn. A car-free village combining world-class skiing, luxury hotels and Michelin-starred dining with breathtaking alpine scenery.',
    highlights: ['Matterhorn views', 'Car-free village', '360 km of pistes', 'Year-round glacier skiing', 'Michelin-starred dining'],
    bestFor: ['Ski lovers', 'Honeymooners', 'Luxury travelers', 'Hikers', 'Foodies'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'Peak ski season: December to April. Summer hiking: June to September. Year-round glacier skiing available on the Theodul Glacier at 3,883m.',
    bestPages: [
      { label: 'Best luxury hotels in Zermatt', href: '/best/luxury-hotels-zermatt' },
      { label: 'Best ski hotels in Zermatt', href: '/best/ski-hotels-zermatt' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Mont Cervin Palace vs Grand Hotel Zermatterhof', href: '/compare/mont-cervin-palace-vs-grand-hotel-zermatterhof' },
      { label: 'Mont Cervin Palace vs The Omnia', href: '/compare/mont-cervin-palace-vs-the-omnia' },
      { label: 'Schweizerhof Zermatt vs Monte Rosa Zermatt', href: '/compare/schweizerhof-zermatt-vs-monte-rosa-zermatt' },
      { label: 'Monte Rosa Zermatt vs Cervo Mountain Resort', href: '/compare/monte-rosa-zermatt-vs-cervo-mountain-resort-zermatt' },
    ],
    faqs: [
      { q: 'What is the best hotel in Zermatt?', a: 'Mont Cervin Palace is widely considered the finest luxury hotel in Zermatt — a 5-star grand hotel open since 1852 with Matterhorn views, a 1,700 m² spa and 1 Michelin-starred restaurant.' },
      { q: 'Is Zermatt car-free?', a: 'Yes — Zermatt is a car-free village. Visitors arrive by train from Täsch (20 min) and move around the village by foot or electric taxi.' },
      { q: 'When is the best time to visit Zermatt?', a: 'December to April for skiing, June to September for hiking. Summer offers wildflower meadows, Matterhorn views and fewer crowds than peak ski season.' },
    ],
  },
  'geneva': {
    name: 'Geneva',
    region: 'Lake Geneva, Switzerland',
    tagline: 'Where luxury meets lakeside elegance',
    description: 'Geneva is Switzerland\'s most cosmopolitan city, sitting on the shores of Europe\'s largest Alpine lake with views of Mont Blanc. Home to world-class hotels, Michelin-starred restaurants and the headquarters of international diplomacy.',
    highlights: ['Lake Geneva waterfront', 'Mont Blanc views', 'International atmosphere', 'Michelin-starred dining', 'Luxury shopping'],
    bestFor: ['Business travelers', 'Couples', 'Luxury travelers', 'City breaks', 'Diplomats'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'Year-round destination. Spring and autumn are ideal for city breaks. Summer for lake activities. December for Christmas markets.',
    bestPages: [
      { label: 'Best luxury hotels in Geneva', href: '/best/luxury-hotels-geneva' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'La Réserve Genève vs Four Seasons Hotel des Bergues', href: '/compare/la-reserve-geneve-vs-four-seasons-hotel-des-bergues-geneva' },
      { label: "La Réserve Genève vs Hotel d'Angleterre Geneva", href: '/compare/la-reserve-geneve-vs-hotel-dangleterre-geneva' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Geneva?', a: 'La Réserve Genève is one of the finest luxury hotels in Geneva — a lakeside resort hotel set within a 10-acre private park, 3 minutes from the airport, with a 2,000 m² spa and 1 Michelin-starred restaurant.' },
      { q: 'Where should I stay in Geneva for luxury?', a: 'The lakeside area and Bellevue suburb offer the strongest luxury hotel addresses. La Réserve Genève is just 5km from the city centre with private lakefront grounds.' },
      { q: 'Is Geneva good for a romantic break?', a: 'Yes — Geneva\'s lake views, fine dining, spa hotels and easy access to the Alps make it an excellent destination for couples and honeymoons.' },
    ],
  },
  'st-moritz': {
    name: 'St. Moritz',
    region: 'Graubünden, Swiss Alps',
    tagline: 'The birthplace of winter tourism',
    description: 'St. Moritz has been the playground of royalty, celebrities and the ultra-wealthy since 1864. Set at 1,800m in the Engadin Valley, it combines legendary skiing, frozen lake polo and the most exclusive hotels in the Alps.',
    highlights: ['Legendary ski slopes', 'Frozen lake events', 'Celebrity history', 'Ultra-luxury hotels', 'Engadin Valley'],
    bestFor: ['Ultra luxury', 'Ski lovers', 'Socialites', 'Families', 'History enthusiasts'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'Peak ski season: December to March. Summer: June to September for hiking and sailing. Frozen lake polo and White Turf horse racing in February.',
    bestPages: [
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: "Badrutt's Palace Hotel vs Kulm Hotel St. Moritz", href: '/compare/badrutts-palace-hotel-vs-kulm-hotel-st-moritz' },
      { label: "Carlton Hotel vs Badrutt's Palace Hotel", href: '/compare/carlton-hotel-st-moritz-vs-badrutts-palace-hotel' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in St. Moritz?', a: "Badrutt's Palace Hotel is the most iconic luxury hotel in St. Moritz — a legendary 5-star grand hotel open since 1896 with panoramic lake views, multiple restaurants and direct ski access." },
      { q: 'Why is St. Moritz so famous?', a: 'St. Moritz invented winter tourism in 1864 when hotelier Johannes Badrutt bet his English summer guests they would enjoy the winter. It has hosted the Winter Olympics twice (1928, 1948) and remains the most prestigious ski resort in the Alps.' },
      { q: 'When is the best time to visit St. Moritz?', a: 'December to March for skiing and the frozen lake events. July and August for hiking, sailing and the summer festival season.' },
    ],
  },
  'interlaken': {
    name: 'Interlaken',
    region: 'Bern, Switzerland',
    tagline: 'Gateway to the Jungfrau region',
    description: 'Interlaken sits between Lake Thun and Lake Brienz, surrounded by the iconic Eiger, Mönch and Jungfrau peaks. A perfect base for exploring the UNESCO World Heritage Jungfrau-Aletsch region with grand hotels and spectacular mountain views.',
    highlights: ['Jungfrau views', 'Between two lakes', 'Adventure sports', 'Grand hotels', 'UNESCO World Heritage'],
    bestFor: ['Families', 'Adventure seekers', 'Wellness', 'Nature lovers', 'Couples'],
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600',
    seasonal: 'Year-round. Summer for hiking, paragliding and Jungfraujoch visits. Winter for skiing at Grindelwald, Wengen and Mürren.',
    bestPages: [
      { label: 'Best luxury hotels in Interlaken', href: '/best/luxury-hotels-interlaken' },
      { label: 'Best spa hotels in Switzerland', href: '/best/spa-hotels-switzerland' },
      { label: 'Best family hotels in Switzerland', href: '/best/family-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Victoria-Jungfrau vs Grand Hotel Regina', href: '/compare/victoriajungfrau-grand-hotel-interlaken-vs-grand-hotel-regina' },
      { label: 'Victoria-Jungfrau vs Lindner Grand Hotel Beau Rivage', href: '/compare/victoriajungfrau-grand-hotel-interlaken-vs-lindner-grand-beau-rivage-interlaken' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Interlaken?', a: 'Victoria-Jungfrau Grand Hotel & Spa is the finest luxury hotel in Interlaken — a Belle Époque grand hotel open since 1865 with direct Jungfrau views, a 5,500 m² spa and 1 Michelin-starred restaurant.' },
      { q: 'What can you do from Interlaken?', a: 'Interlaken is a gateway to Jungfraujoch (Top of Europe), Grindelwald, Wengen, Lauterbrunnen valley, hiking, skiing, paragliding, kayaking and boat trips on Lakes Thun and Brienz.' },
      { q: 'When is the best time to visit Interlaken?', a: 'June to September for hiking and outdoor activities. December to March for Jungfrau-region skiing. Spring and autumn for fewer crowds.' },
    ],
  },
  'zurich': {
    name: 'Zurich',
    region: 'Zurich, Switzerland',
    tagline: 'Switzerland\'s vibrant financial capital',
    description: 'Zurich consistently ranks as one of the world\'s most liveable cities. A sophisticated blend of medieval old town, world-class museums, luxury shopping on Bahnhofstrasse and some of Switzerland\'s finest hotels overlooking Lake Zurich.',
    highlights: ['Old Town', 'Lake Zurich', 'World-class museums', 'Bahnhofstrasse shopping', 'Michelin dining'],
    bestFor: ['Business travelers', 'City breaks', 'Art lovers', 'Luxury travelers', 'Foodies'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600',
    seasonal: 'Year-round city destination. Spring and summer for lake swimming and outdoor dining. December for Christmas markets and the Zurich Opera.',
    bestPages: [
      { label: 'Best luxury hotels in Zurich', href: '/best/luxury-hotels-zurich' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'La Réserve Zurich vs Baur au Lac', href: '/compare/la-reserve-zurich-vs-baur-au-lac-zurich' },
      { label: 'La Réserve Zurich vs The Dolder Grand', href: '/compare/la-reserve-zurich-vs-the-dolder-grand' },
      { label: 'Baur au Lac vs The Dolder Grand', href: '/compare/baur-au-lac-zurich-vs-the-dolder-grand' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Zurich?', a: 'La Réserve Eden au Lac Zurich is one of the finest boutique luxury hotels in Zurich — a Philippe Starck-designed property on the shores of Lake Zurich with 40 rooms and a 1 Michelin-starred restaurant.' },
      { q: 'What is Bahnhofstrasse?', a: "Bahnhofstrasse is Zurich's famous luxury shopping street — one of the world's most exclusive retail addresses, lined with Swiss watch brands, jewellers and fashion houses." },
      { q: 'How far is Zurich from the Alps?', a: 'Zurich is exceptionally well connected to the Swiss Alps. Davos is 2.5 hours by train, Andermatt 2 hours, and St. Moritz around 3.5 hours.' },
    ],
  },
  'gstaad': {
    name: 'Gstaad',
    region: 'Bern, Swiss Alps',
    tagline: 'Switzerland\'s most exclusive alpine village',
    description: 'Gstaad is the most exclusive ski resort in Switzerland — a small, chalet-style village that has attracted royalty, celebrities and the global elite for over a century. Home to The Alpina and Palace Hotel, two of Switzerland\'s finest properties.',
    highlights: ['Exclusive atmosphere', 'Celebrity destination', 'Palace Hotel', '220 km ski area', 'Summer festivals'],
    bestFor: ['Ultra luxury', 'Privacy seekers', 'Ski lovers', 'Families', 'Celebrities'],
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600',
    seasonal: 'December to April for skiing. June to September for hiking, tennis, golf and the Menuhin Festival.',
    bestPages: [
      { label: 'Best luxury hotels in Gstaad', href: '/best/luxury-hotels-gstaad' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'The Alpina Gstaad vs Palace Hotel Gstaad', href: '/compare/the-alpina-gstaad-vs-palace-hotel-gstaad' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Gstaad?', a: 'The Alpina Gstaad and Palace Hotel Gstaad are the two standout luxury addresses. The Alpina is more contemporary with exceptional dining; Palace Hotel is the classic fairy-tale grand hotel.' },
      { q: 'Why is Gstaad so exclusive?', a: 'Gstaad combines discreet privacy, chalet architecture, celebrity clientele, outstanding skiing and a long tradition of understated luxury. No high-rise buildings, no mass tourism.' },
      { q: 'Is Gstaad good for families?', a: 'Yes — Gstaad has gentle ski terrain, excellent ski schools, family suites and a safe village atmosphere that makes it one of the best Swiss resorts for families.' },
    ],
  },
  'lucerne': {
    name: 'Lucerne',
    region: 'Lucerne, Central Switzerland',
    tagline: 'The most beautiful city in Switzerland',
    description: 'Lucerne is widely considered Switzerland\'s most beautiful city, with its iconic Chapel Bridge, medieval old town and stunning location on Lake Lucerne surrounded by mountains. A perfect blend of culture, history and luxury hospitality.',
    highlights: ['Chapel Bridge', 'Lake Lucerne', 'Medieval old town', 'Mountain views', 'Cultural events'],
    bestFor: ['Couples', 'City breaks', 'History enthusiasts', 'Families', 'Luxury travelers'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'Year-round. Spring and summer for lake cruises and outdoor dining. Autumn for clear mountain views. The Lucerne Festival (classical music) runs August to September.',
    bestPages: [
      { label: 'Best luxury hotels in Lucerne', href: '/best/luxury-hotels-lucerne' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Mandarin Oriental Palace vs Hotel Schweizerhof Luzern', href: '/compare/mandarin-oriental-palace-luzern-vs-hotel-schweizerhof-luzern' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Lucerne?', a: 'Mandarin Oriental Palace Luzern is the finest luxury hotel in Lucerne — a historic palace on the lakefront with Michelin dining and exceptional views of Lake Lucerne and the Alps.' },
      { q: 'What is the Chapel Bridge in Lucerne?', a: 'The Chapel Bridge (Kapellbrücke) is a 14th-century covered wooden bridge — the oldest in Europe — crossing the Reuss river in the heart of Lucerne\'s old town. It is one of Switzerland\'s most photographed landmarks.' },
      { q: 'How do I get to Lucerne from Zurich?', a: 'Lucerne is 50 minutes by direct train from Zurich HB. From Geneva it is around 3 hours. The journey through the Swiss countryside is outstanding.' },
    ],
  },
  'verbier': {
    name: 'Verbier',
    region: 'Valais, Swiss Alps',
    tagline: 'The Alps\' most vibrant ski resort',
    description: 'Verbier is the liveliest ski resort in Switzerland — famous for its challenging off-piste terrain, legendary après-ski and the annual Verbier Festival. A younger, more energetic alternative to St. Moritz with world-class luxury hotels.',
    highlights: ['412 km Four Valleys ski area', 'Off-piste terrain', 'Vibrant après-ski', 'Verbier Festival', 'Mont-Fort peak (3,330m)'],
    bestFor: ['Ski lovers', 'Young luxury', 'Music lovers', 'Adventure seekers', 'Après-ski'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'December to April for skiing. The Verbier Festival (classical music) takes place each July.',
    bestPages: [
      { label: 'Best luxury hotels in Verbier', href: '/best/luxury-hotels-verbier' },
      { label: 'Best ski hotels in Verbier', href: '/best/ski-hotels-verbier' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: "W Verbier vs Chalet d'Adrien", href: '/compare/w-verbier-vs-chalet-dadrien' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Verbier?', a: 'W Verbier is the leading luxury ski hotel in Verbier — a 5-star design hotel with ski-in ski-out access, a destination spa and direct access to the Four Valleys ski area.' },
      { q: 'How does Verbier compare to Zermatt for skiing?', a: 'Verbier has a larger linked ski area (Four Valleys, 412 km vs Zermatt\'s 360 km) and is known for more challenging off-piste terrain. Zermatt is more traditional, car-free, and defined by the Matterhorn.' },
      { q: 'What is the Verbier Festival?', a: 'The Verbier Festival is one of the world\'s finest classical music festivals, held each July in the mountains of Verbier. It attracts leading international musicians and conductors for two weeks of concerts.' },
    ],
  },
  'davos': {
    name: 'Davos',
    region: 'Graubünden, Swiss Alps',
    tagline: 'Europe\'s highest city — where skiing meets the world stage',
    description: 'Davos sits at 1,560 metres in the Graubünden Alps, making it Europe\'s highest city and one of Switzerland\'s premier ski destinations. Sharing the vast Parsenn ski area with Klosters, it combines world-class skiing with international prestige as home to the World Economic Forum.',
    highlights: ['Parsenn ski area (300+ km)', 'World Economic Forum', 'Europe\'s highest city', 'Cross-country skiing', 'Klosters connection'],
    bestFor: ['Ski lovers', 'Business travelers', 'Wellness seekers', 'WEF attendees', 'Families'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'December to April for skiing. January for the World Economic Forum. Summer for hiking, mountain biking and the Davos Festival.',
    bestPages: [
      { label: 'Best luxury hotels in Davos', href: '/best/luxury-hotels-davos' },
      { label: 'Best ski hotels in Davos', href: '/best/ski-hotels-davos' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Alpengold Hotel vs Steigenberger Grandhotel Belvédère', href: '/compare/alpengold-hotel-vs-steigenberger-grandhotel-belvedere' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Davos?', a: 'Alpengold Hotel is the leading luxury hotel in Davos — a 5-star property with a distinctive pinecone-inspired design, 1,200 m² spa, 6 restaurants and direct access to the Parsenn ski area.' },
      { q: 'What is the World Economic Forum in Davos?', a: 'The World Economic Forum Annual Meeting takes place in Davos each January, bringing together world leaders, CEOs and economists. Hotels are fully booked during this period and rates increase significantly.' },
      { q: 'Is Davos good for families?', a: 'Yes — Davos has excellent family ski infrastructure, ski schools, a large variety of slopes and the Davos Lake for summer activities.' },
    ],
  },
  'crans-montana': {
    name: 'Crans-Montana',
    region: 'Valais, Swiss Alps',
    tagline: 'The sunny balcony of the Swiss Alps',
    description: 'Crans-Montana sits on a spectacular sun-drenched plateau at 1,500 metres above the Rhône Valley, with panoramic views of the Valais Alps stretching from Mont Blanc to the Matterhorn. Known as the sunniest ski resort in Switzerland.',
    highlights: ['Exceptional sunshine', 'Rhône Valley panorama', '140 km of pistes', 'Summer golf', 'Mont Blanc to Matterhorn views'],
    bestFor: ['Ski lovers', 'Couples', 'Golf enthusiasts', 'Wellness seekers', 'Sun seekers'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'December to April for skiing. June to September for golf and hiking. Autumn for clear Rhône Valley views.',
    bestPages: [
      { label: 'Best luxury hotels in Crans-Montana', href: '/best/luxury-hotels-crans-montana' },
      { label: 'Best ski hotels in Crans-Montana', href: '/best/ski-hotels-crans-montana' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Crans Ambassador vs Hotel Guarda Golf Crans-Montana', href: '/compare/crans-ambassador-vs-hotel-guarda-golf-crans-montana' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Crans-Montana?', a: 'Crans Ambassador is the finest luxury hotel in Crans-Montana — a 5-star ski-in ski-out hotel at 1,500m with 56 rooms, a 1,300 m² spa and three restaurants including La Muña.' },
      { q: 'Is Crans-Montana better than Zermatt?', a: 'They offer different experiences. Crans-Montana is sunnier, wider and more family-friendly with stunning panoramic views. Zermatt is higher, car-free and dominated by the Matterhorn. Both offer world-class luxury hotels.' },
      { q: 'Does Crans-Montana have golf?', a: 'Yes — Crans-Montana hosts one of Europe\'s finest mountain golf courses, with views of the Valais Alps. The Omega European Masters golf tournament is held here annually.' },
    ],
  },
  'flims': {
    name: 'Flims',
    region: 'Graubünden, Switzerland',
    tagline: 'Where the Rhine Gorge meets the Alps',
    description: 'Flims is one of Switzerland\'s most beautiful and unspoiled alpine destinations, anchoring the world-class Weisse Arena ski domain with Laax and Falera. Surrounded by ancient forests, the turquoise Caumasee lake and the dramatic Ruinaulta Rhine Gorge.',
    highlights: ['Weisse Arena ski domain (224 km)', 'Rhine Gorge (Ruinaulta)', 'Caumasee turquoise lake', 'Romansh culture', 'World\'s largest natural halfpipe'],
    bestFor: ['Skiers & snowboarders', 'Nature lovers', 'Wellness seekers', 'Couples', 'Families'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'December to April for skiing and snowboarding. June to September for hiking, Rhine Gorge walks, Caumasee swimming.',
    bestPages: [
      { label: 'Best luxury hotels in Flims', href: '/best/luxury-hotels-flims' },
      { label: 'Best wellness hotels in Flims', href: '/best/wellness-hotels-flims' },
      { label: 'Best spa hotels in Switzerland', href: '/best/spa-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Hotel Adula vs Parkhotel Waldhaus Flims', href: '/compare/hotel-adula-vs-parkhotel-waldhaus-flims' },
      { label: 'Hotel Adula vs Grand Hotel Waldhaus Flims', href: '/compare/hotel-adula-vs-grand-hotel-waldhaus-flims' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Flims?', a: 'Hotel Adula is the leading luxury hotel in Flims — a 4-star superior property with indoor pool, spa, 3 restaurants and easy access to the Caumasee lake and Rhine Gorge hiking.' },
      { q: 'What is the Rhine Gorge?', a: "The Ruinaulta Rhine Gorge near Flims is often called Switzerland's Grand Canyon — a dramatic 14km gorge carved by the Rhine through ancient landslide debris, with turquoise water and rock formations up to 400m high." },
      { q: 'How do I get to Flims from Zurich?', a: 'Flims is around 2 hours from Zurich by train to Chur, then connecting bus or taxi to Flims. The journey through the Rhine valley is very scenic.' },
    ],
  },
  'bern': {
    name: 'Bern',
    region: 'Bern, Switzerland',
    tagline: 'Switzerland\'s UNESCO World Heritage capital',
    description: 'Bern is one of Europe\'s most beautiful and underrated capitals — a UNESCO World Heritage city of medieval arcades, bear pits and rose gardens perched above a dramatic loop of the Aare river. Home to the Swiss Federal Palace and Bellevue Palace, Switzerland\'s most politically prestigious hotel.',
    highlights: ['UNESCO World Heritage old town', 'Federal Palace', 'Aare river panorama', 'Bernese Alps views', '6 km of medieval arcades'],
    bestFor: ['Culture lovers', 'Business travelers', 'Couples', 'History enthusiasts', 'City breaks'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'Year-round. Summer for the Aare outdoor swimming and rose garden. December for Christmas markets. Spring for the best light on the old town.',
    bestPages: [
      { label: 'Best luxury hotels in Bern', href: '/best/luxury-hotels-bern' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Bellevue Palace vs Hotel Schweizerhof Bern', href: '/compare/bellevue-palace-vs-hotel-schweizerhof-bern' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Bern?', a: 'Bellevue Palace is the finest luxury hotel in Bern — Switzerland\'s official state guesthouse since 1913, directly opposite the Federal Palace with panoramic Aare and Alps views.' },
      { q: 'Why is Bern a UNESCO World Heritage city?', a: 'Bern\'s medieval old town was inscribed as a UNESCO World Heritage Site in 1983 for its extraordinary preservation — 6 km of arcaded walkways, medieval towers and fountains that have remained largely unchanged since the 15th century.' },
      { q: 'Is Bern worth visiting?', a: 'Yes — Bern is one of Europe\'s most underrated capitals. Fewer crowds than Zurich, genuine Swiss character, excellent museums, outstanding restaurants and one of the most beautiful natural settings of any European city.' },
    ],
  },
  'basel': {
    name: 'Basel',
    region: 'Basel, Switzerland',
    tagline: 'Switzerland\'s cultural capital on the Rhine',
    description: 'Basel is Switzerland\'s most culturally rich city, at the meeting point of Switzerland, Germany and France. Home to Art Basel — the world\'s most prestigious art fair — and more than 40 museums, it combines exceptional cultural depth with Swiss luxury hospitality.',
    highlights: ['Art Basel (June)', '40+ world-class museums', 'Rhine waterfront', 'Tri-border location', 'Exceptional fine dining'],
    bestFor: ['Art lovers', 'Culture travelers', 'Business travelers', 'City breaks', 'Luxury travelers'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600',
    seasonal: 'Year-round. June for Art Basel. February for Basel Carnival (Fasnacht). Spring and summer for Rhine promenade walks.',
    bestPages: [
      { label: 'Best luxury hotels in Basel', href: '/best/luxury-hotels-basel' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
    ],
    compareLinks: [],
    faqs: [
      { q: 'What is the best luxury hotel in Basel?', a: "Les Trois Rois Basel is the finest luxury hotel in Basel — a 5-star grand hotel on the Rhine since 1681, with 101 rooms, a Michelin-starred restaurant and views over the Rhine." },
      { q: 'What is Art Basel?', a: "Art Basel is the world's most prestigious contemporary art fair, held annually in June in Basel. It attracts over 90,000 visitors and dealers from 90+ countries across three days of gallery exhibitions." },
      { q: 'What is Basel\'s location advantage?', a: "Basel sits at the exact meeting point of Switzerland, Germany and France — making it uniquely connected to three major European cultures and within 3 hours by train of both Zurich and Paris." },
    ],
  },
  'lugano': {
    name: 'Lugano',
    region: 'Ticino, Switzerland',
    tagline: 'Swiss sophistication with an Italian soul',
    description: 'Lugano is Switzerland\'s most Mediterranean city — a sun-drenched lakeside resort in the Italian-speaking canton of Ticino, where Swiss precision meets the relaxed elegance of northern Italy. Set on the shores of Lake Lugano with dramatic mountain backdrops.',
    highlights: ['Lake Lugano', 'Italian atmosphere', 'Monte San Salvatore', 'Luxury shopping', 'Swiss-Italian cuisine'],
    bestFor: ['Couples', 'Luxury travelers', 'City breaks', 'Art lovers', 'Food enthusiasts'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'April to October — Lugano is at its best in spring and autumn. Summer for lake activities. Winter is quiet.',
    bestPages: [
      { label: 'Best luxury hotels in Lugano', href: '/best/luxury-hotels-lugano' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Grand Hotel Villa Castagnola vs Hotel Splendide Royal', href: '/compare/grand-hotel-villa-castagnola-lugano-v2-vs-hotel-splendide-royal-lugano' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Lugano?', a: 'Grand Hotel Villa Castagnola and Hotel Splendide Royal are Lugano\'s finest luxury hotels — both lakefront properties with long histories and outstanding dining.' },
      { q: 'What language is spoken in Lugano?', a: 'Italian — Lugano is in the canton of Ticino, the Italian-speaking region of Switzerland. Street names, menus and daily life are in Italian, giving the city a distinctly Mediterranean feel.' },
      { q: 'When is the best time to visit Lugano?', a: 'April to October for lake activities, outdoor dining and the Mediterranean atmosphere. The Lugano Summer Festival runs July to August.' },
    ],
  },
  'ascona': {
    name: 'Ascona',
    region: 'Ticino, Switzerland',
    tagline: 'The pearl of Lake Maggiore',
    description: 'Ascona is Switzerland\'s most glamorous lakeside resort — a sun-drenched Mediterranean village on the shores of Lake Maggiore with its famous Piazza, bougainvillea-draped alleys and exceptional luxury hotels including the legendary Eden Roc.',
    highlights: ['Lake Maggiore views', 'Eden Roc', 'Mediterranean atmosphere', 'Piazza Motta', 'Fine dining'],
    bestFor: ['Luxury travelers', 'Couples', 'Honeymooners', 'Wellness seekers', 'Art lovers'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'April to October. Summer is peak season for lake swimming and outdoor dining. JazzAscona festival in June.',
    bestPages: [
      { label: 'Best luxury hotels in Ascona', href: '/best/luxury-hotels-ascona' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Eden Roc Ascona vs Castello del Sole', href: '/compare/eden-roc-ascona-vs-castello-del-sole' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Ascona?', a: 'Eden Roc Ascona is the finest luxury hotel in Ascona — a legendary 5-star lakefront hotel with 95 rooms, 5 restaurants and a long history of welcoming international guests.' },
      { q: 'What is Ascona known for?', a: 'Ascona is known for its Mediterranean atmosphere, the Piazza Motta lakefront promenade, the JazzAscona festival, exceptional restaurants and some of the finest luxury hotels in the Italian-speaking canton of Ticino.' },
      { q: 'How do I get to Ascona?', a: 'Ascona is 2.5 hours from Zurich by train to Locarno, then taxi or bus. The nearest airport is Lugano (40 min) or Milan Malpensa (1.5 hours).' },
    ],
  },
  'andermatt': {
    name: 'Andermatt',
    region: 'Uri, Swiss Alps',
    tagline: 'The Swiss Alps\' most exciting new luxury destination',
    description: 'Andermatt is the most exciting transformation in Swiss alpine tourism — a historic mountain village at the crossroads of the Alps that has become one of Switzerland\'s premier luxury ski destinations, home to The Chedi Andermatt.',
    highlights: ['The Chedi Andermatt', 'SkiArena Andermatt-Sedrun', 'Crossroads of the Alps', 'Year-round destination', 'New luxury development'],
    bestFor: ['Ski lovers', 'Luxury travelers', 'Wellness seekers', 'Couples', 'Adventurers'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'December to April for skiing. June to October for hiking and the golf course. The Andermatt Music Festival runs annually.',
    bestPages: [
      { label: 'Best luxury hotels in Andermatt', href: '/best/luxury-hotels-andermatt' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'The Chedi Andermatt vs Radisson Blu Reussen', href: '/compare/the-chedi-andermatt-vs-radisson-blu-reussen-andermatt' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Andermatt?', a: 'The Chedi Andermatt is the defining luxury hotel in Andermatt — a 5-star Asian-inspired resort with the longest indoor pool in the Alps, multiple Michelin-starred restaurants, exceptional spa and ski-in ski-out access.' },
      { q: 'How big is the Andermatt ski area?', a: 'SkiArena Andermatt-Sedrun-Disentis covers 180+ km of pistes across three linked regions, with the highest point at 3,000m. It is one of the fastest-growing ski areas in the Alps.' },
      { q: 'How do I get to Andermatt?', a: 'Andermatt is 1.5 hours from Zurich, 2 hours from Lugano and easily reachable from Lucerne. The Matterhorn Gotthard railway connects to the resort.' },
    ],
  },
  'montreux': {
    name: 'Montreux',
    region: 'Vaud, Swiss Riviera',
    tagline: 'The jewel of the Swiss Riviera',
    description: 'Montreux is Switzerland\'s most celebrated lakeside resort on the shores of Lake Geneva, sheltered by the Alps with a microclimate mild enough for palm trees. Home to the legendary Montreux Jazz Festival and the palatial Fairmont Le Montreux Palace.',
    highlights: ['Lake Geneva views', 'Montreux Jazz Festival (July)', 'Château de Chillon', 'Fairmont Palace', 'Swiss Riviera microclimate'],
    bestFor: ['Music lovers', 'Couples', 'Luxury travelers', 'Culture enthusiasts', 'Honeymooners'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'Year-round. July for the Montreux Jazz Festival. Spring and autumn for the famous lakeside palm promenade. Summer for lake activities.',
    bestPages: [
      { label: 'Best luxury hotels in Montreux', href: '/best/luxury-hotels-montreux' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Fairmont Le Montreux Palace vs Le Mirador Resort', href: '/compare/fairmont-le-montreux-palace-vs-le-mirador-resort-spa-mont-pelerin' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Montreux?', a: 'Fairmont Le Montreux Palace is the finest luxury hotel in Montreux — a palatial Belle Époque grand hotel open since 1906, directly on Lake Geneva with 236 rooms and multiple restaurants.' },
      { q: 'What is the Montreux Jazz Festival?', a: 'The Montreux Jazz Festival is one of the world\'s most celebrated music festivals, held annually in July on the shores of Lake Geneva. Founded in 1967, it has hosted Miles Davis, Nina Simone, David Bowie and thousands of other artists.' },
      { q: 'What is Château de Chillon?', a: "Château de Chillon is a 12th-century island castle on Lake Geneva, 3km from Montreux — one of Switzerland's most visited landmarks. Lord Byron famously wrote 'The Prisoner of Chillon' after visiting in 1816." },
    ],
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
    .order('star_classification', { ascending: false })

  const hotelsList = hotels || []

  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#3D2B1F'
  const textMuted = 'rgba(61,43,31,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'
  const pageUrl = `https://swissnethotels.com/destinations/${slug}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Best Luxury Hotels in ${dest.name}, Switzerland | SwissNet Hotels`,
        description: dest.description,
        isPartOf: { '@id': 'https://swissnethotels.com#website' },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        mainEntity: { '@id': `${pageUrl}#list` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
          { '@type': 'ListItem', position: 2, name: 'Hotels', item: 'https://swissnethotels.com/hotels' },
          { '@type': 'ListItem', position: 3, name: dest.name, item: pageUrl },
        ]
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#list`,
        name: `Best Luxury Hotels in ${dest.name}, Switzerland`,
        description: dest.description,
        url: pageUrl,
        numberOfItems: hotelsList.length,
        itemListElement: hotelsList.map((h, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Hotel',
            '@id': `https://swissnethotels.com/hotels/${(h as any).slug || h.id}#hotel`,
            name: h.name,
            url: `https://swissnethotels.com/hotels/${(h as any).slug || h.id}`,
            priceRange: `CHF ${h.nightly_rate_chf}+`,
            starRating: { '@type': 'Rating', ratingValue: (h as any).star_classification || 5 },
            address: { '@type': 'PostalAddress', addressLocality: h.location, addressCountry: 'CH' },
          }
        }))
      },
      ...(dest.faqs && dest.faqs.length > 0 ? [{
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: dest.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }] : []),
    ]
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
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: textMuted, lineHeight: 1.9, fontWeight: 300, margin: '0 0 1rem' }}>{dest.description}</p>
              {dest.seasonal && (
                <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 4, padding: '1rem 1.25rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, margin: '0 0 0.4rem' }}>When to Visit</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, margin: 0, lineHeight: 1.7 }}>{dest.seasonal}</p>
                </div>
              )}
            </div>

            {/* Hotels list */}
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>
                The Best Luxury Hotels in {dest.name}
              </h2>
              {hotelsList.length === 0 ? (
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted }}>No hotels listed yet for this destination.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hotelsList.map((hotel, i) => (
                    <Link key={hotel.id} href={`/hotels/${(hotel as any).slug || hotel.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: white, border: hotel.is_partner ? `1px solid ${gold}88` : `1px solid ${border}`, padding: '1.25rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0, width: 32, height: 32, background: i === 0 ? gold : bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 600, color: i === 0 ? '#1a0e06' : textMuted }}>#{i + 1}</span>
                        </div>
                        {hotel.images?.[0] && (
                          <div style={{ width: 80, height: 60, flexShrink: 0, overflow: 'hidden', borderRadius: 4 }}>
                            <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: text, margin: 0 }}>{hotel.name}</p>
                            {hotel.is_partner && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, background: gold, color: '#1a0e06', padding: '2px 8px', borderRadius: 20 }}>✦ Partner</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                            <span style={{ display: 'flex', gap: '0.1rem' }}>
                              {Array.from({ length: (hotel as any).star_classification || 5 }).map((_, si) => (
                                <span key={si} style={{ color: gold, fontSize: '0.55rem' }}>★</span>
                              ))}
                            </span>
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

            {/* Best pages links */}
            {dest.bestPages && dest.bestPages.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Curated Guides</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dest.bestPages.map(link => (
                    <Link key={link.href} href={link.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: white, border: `1px solid ${border}`, borderRadius: 4, textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{link.label}</span>
                      <span style={{ color: gold }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Compare links */}
            {dest.compareLinks && dest.compareLinks.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Compare Hotels in {dest.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dest.compareLinks.map(link => (
                    <Link key={link.href} href={link.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: white, border: `1px solid ${border}`, borderRadius: 4, textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{link.label}</span>
                      <span style={{ color: gold }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {dest.faqs && dest.faqs.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, marginBottom: '1.5rem' }}>
                  Frequently Asked Questions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dest.faqs.map((faq, i) => (
                    <div key={i} style={{ background: white, border: `1px solid ${border}`, padding: '1.25rem 1.5rem', borderRadius: 8 }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: text, margin: '0 0 0.5rem' }}>
                        <span style={{ color: gold, marginRight: '0.5rem' }}>Q.</span>{faq.q}
                      </p>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.8, margin: 0, fontWeight: 300 }}>
                        <span style={{ color: gold, marginRight: '0.5rem' }}>A.</span>{faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: white, border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem' }}>
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

            <div style={{ background: white, border: '1px solid ' + border, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: text, marginBottom: '1rem' }}>Best For</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {dest.bestFor.map(b => (
                  <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: text, border: '1px solid ' + border, padding: '0.3rem 0.75rem', background: bg }}>{b}</span>
                ))}
              </div>
            </div>

            <div style={{ background: white, border: '1px solid ' + border, padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 400, color: text, marginBottom: '1rem' }}>Other Destinations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(DESTINATIONS).filter(([s]) => s !== slug).slice(0, 6).map(([s, d]) => (
                  <Link key={s} href={`/destinations/${s}`} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: `1px solid ${border}` }}>
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