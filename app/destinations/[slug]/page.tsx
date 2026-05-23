
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dest = DESTINATIONS[slug]
  if (!dest) return {}
  return {
    title: `Best Hotels in ${dest.name}, Switzerland | SwissNet`,

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
    tagline: 'The Matterhorn defines it. The hotels live up to it.',
    description: 'Zermatt is Switzerland\'s most iconic mountain resort — and one of the few places where the landscape genuinely overwhelms expectations. The Matterhorn dominates the horizon from the moment you step off the train, and the car-free village beneath it manages to feel both intimate and world-class at the same time. For luxury travelers, Zermatt offers cobblestone streets lined with grand hotels that have been operating since the 1800s, Michelin-starred restaurants, and a ski area that runs year-round on the high-altitude glacier.',
    highlights: ['Direct Matterhorn views from the village', 'Car-free village — electric taxis and horse-drawn carriages only', 'Extensive ski area across three linked valleys', 'Year-round glacier skiing at high altitude', 'Grand hotels open since the 19th century'],
    bestFor: ['Couples seeking alpine romance', 'Serious skiers who want luxury too', 'Honeymooners', 'Multigenerational families', 'Travelers who want a car-free, walkable resort'],
    image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=1600',
    seasonal: 'December to April delivers the full Zermatt experience — deep snow, atmospheric village lighting, and the mountain at its most dramatic. July and August offer a completely different but equally compelling stay: wildflower meadows at altitude, hiking towards the Matterhorn, and the glacier open for summer skiing. The shoulder seasons (May, June, October, November) see most hotels close for refurbishment. Late January to mid-March combines reliable snow with some of the best light of the season.',
    bestPages: [
      { label: 'Best luxury hotels in Zermatt', href: '/best/luxury-hotels-zermatt' },
      { label: 'Best ski hotels in Zermatt', href: '/best/ski-hotels-zermatt' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Mont Cervin Palace vs Grand Hotel Zermatterhof', href: '/compare/mont-cervin-palace-vs-grand-hotel-zermatterhof' },
      { label: 'Mont Cervin Palace vs The Omnia', href: '/compare/mont-cervin-palace-vs-the-omnia' },
      { label: 'Schweizerhof Zermatt vs Monte Rosa Zermatt', href: '/compare/schweizerhof-zermatt-vs-monte-rosa-zermatt' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Zermatt?', a: 'Mont Cervin Palace is the benchmark — open since 1852, centrally positioned with Matterhorn views, a large spa, and one Michelin-starred restaurant. For travelers seeking something more intimate, Cervo Mountain Resort offers a boutique ski-lodge experience with strong food and a more contemporary atmosphere. Monte Rosa Zermatt, the oldest hotel in the village, suits those for whom history matters as much as facilities.' },
      { q: 'Why choose Zermatt over St. Moritz?', a: 'Zermatt is more focused on the mountain itself — the Matterhorn gives the resort an identity no other Swiss destination can match, and the car-free village creates a more intimate, walkable atmosphere. St. Moritz has a more social, event-driven winter season with frozen lake polo and the Cresta Run. Zermatt suits travelers who want the skiing and the landscape to be the primary experience; St. Moritz suits those who want the off-slope social season as well.' },
      { q: 'Is Zermatt suitable for non-skiers in winter?', a: 'Yes — the village is one of the most pleasant in the Alps to explore on foot, with luxury boutiques and restaurants along the Bahnhofstrasse, horse-drawn sledge rides, snowshoe trails, and mountain-view dining throughout. Non-skiers at Mont Cervin Palace or Schweizerhof Zermatt rarely feel left out.' },
    ],
  },
  'geneva': {
    name: 'Geneva',
    region: 'Lake Geneva, Switzerland',
    tagline: 'Where European diplomacy meets lakeside luxury.',
    description: 'Geneva operates at a different register to most Swiss cities. It is international in a structural rather than cosmetic way — the United Nations, the Red Cross, and dozens of global institutions have shaped a city accustomed to guests for whom discretion and quality are non-negotiable. Lake Geneva dominates the cityscape, with the Jet d\'Eau marking the skyline and the Jura mountains framing the north shore. For luxury travelers, Geneva offers some of Switzerland\'s most accomplished hotels, a level of service professionalism shaped by its international clientele, and a compact old town that rewards walking.',
    highlights: ['Lake Geneva waterfront and the Jet d\'Eau', 'Direct access to the French Alps and Swiss Riviera', 'Concentrated Michelin-starred dining scene', 'International atmosphere with Swiss operational standards', 'Major international airport with broad global connections'],
    bestFor: ['Business travelers connected to international institutions', 'Couples combining city luxury with lake and mountain access', 'Travelers en route to the Swiss Riviera or French Alps', 'Those seeking urban sophistication with strong outdoor access'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'Geneva works year-round. Spring brings mild lakeside temperatures and the famous flower clock. Summer is peak season for lake activities and terrace dining. Autumn offers clear mountain views and the grape harvest in nearby Lavaux. December brings Christmas markets around the old town. The city\'s international function keeps hotel occupancy steady throughout the year.',
    bestPages: [
      { label: 'Best luxury hotels in Geneva', href: '/best/luxury-hotels-geneva' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'La Réserve Genève vs Four Seasons Hotel des Bergues', href: '/compare/la-reserve-geneve-vs-four-seasons-hotel-des-bergues-geneva' },
      { label: 'La Réserve Genève vs Hotel d\'Angleterre Geneva', href: '/compare/la-reserve-geneve-vs-hotel-dangleterre-geneva' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Geneva?', a: 'La Réserve Genève stands apart from the city-centre grand hotels — set within a private park on the lake shore around 5km from the centre, with a large spa and consistently ranked among Switzerland\'s top hotels. For travelers who want to be in the heart of the city, Four Seasons Hotel des Bergues and Beau-Rivage Geneva offer the classic lakeside grand hotel experience with direct Jet d\'Eau views.' },
      { q: 'Why choose Geneva over Zurich for a luxury city break?', a: 'Geneva is softer, more international, and more connected to the outdoors — the lake dominates the city in a way Zurich\'s lake does not. Zurich has more energy, a stronger restaurant scene, and a more distinctly Swiss urban character. Geneva suits travelers who want calm, diplomatic-level service, and easy access to the French Alps or the Swiss Riviera.' },
      { q: 'How far is Geneva from the ski resorts?', a: 'Geneva is well positioned for ski access. Verbier is around 2 hours by road or train-and-transfer. Chamonix across the French border is approximately 1.5 hours by car. Crans-Montana is around 2 hours. The airport\'s efficiency makes Geneva a practical base for ski trips combined with city meetings.' },
    ],
  },
  'st-moritz': {
    name: 'St. Moritz',
    region: 'Engadin Valley, Graubünden',
    tagline: 'The original luxury ski resort — and still the most mythologised.',
    description: 'St. Moritz invented the concept of the winter holiday. In 1864, hotelier Johannes Badrutt bet his English summer guests that they would enjoy the Alpine winter — they did, and a global industry followed. That origin story still shapes the resort\'s identity: St. Moritz has a self-confidence that no other Swiss destination quite matches, a sense that it does not need to explain itself. Set at 1,800m in the Upper Engadin valley, with a frozen lake at its centre and the peaks of the Bernina range above, it combines legendary skiing with a social calendar — polo on the frozen lake, White Turf horse racing in February, the Cresta Run — that gives winter season a theatrical quality unique in the Alps. For luxury travelers, St. Moritz delivers the full grand hotel experience: properties that have been hosting royalty, heads of state, and the ultra-wealthy for well over a century.',
    highlights: ['Legendary skiing across Corviglia, Corvatsch and Diavolezza', 'Frozen lake events including polo and White Turf horse racing', 'The Cresta Run — one of the world\'s oldest toboggan tracks', 'Grand hotels with over a century of history', 'Exceptional Engadin light — the valley gets 320+ days of sunshine annually'],
    bestFor: ['Travelers who want the full grand Alpine hotel experience', 'Those interested in the social winter season', 'Luxury skiers who want variety across multiple connected areas', 'Ultra-luxury travelers for whom history and prestige matter'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'The main season runs December to late March, with February the peak month for the frozen lake events. The Engadin valley\'s exceptional sunshine record — over 320 days per year — makes it one of the most reliably bright ski destinations in the Alps. Summer from June to September is genuinely worth considering: hiking, sailing on the lake, golf, and the Engadin music festival. The shoulder months see most hotels close for refurbishment.',
    bestPages: [
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Badrutt\'s Palace Hotel vs Kulm Hotel St. Moritz', href: '/compare/badrutts-palace-hotel-vs-kulm-hotel-st-moritz' },
      { label: 'Carlton Hotel vs Badrutt\'s Palace Hotel', href: '/compare/carlton-hotel-st-moritz-vs-badrutts-palace-hotel' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in St. Moritz?', a: 'Badrutt\'s Palace Hotel is the most iconic address — open since 1896, directly above the lake, with a skiing history intertwined with the resort itself. For travelers who prefer a quieter, more residential atmosphere, Kulm Hotel St. Moritz — the oldest hotel in the resort, open since 1856 — offers a slightly more understated but equally accomplished alternative. Carlton Hotel suits those wanting a more intimate, modern luxury experience.' },
      { q: 'Why choose St. Moritz over Zermatt?', a: 'St. Moritz and Zermatt are Switzerland\'s two most celebrated ski resorts but appeal to different sensibilities. St. Moritz has a more social, event-driven winter season and a grander hotel culture — it suits travelers for whom the off-slope experience is as important as the skiing. Zermatt is more focused on the mountain itself, with the Matterhorn giving it an emotional intensity that St. Moritz does not try to replicate. Zermatt is car-free and more intimate; St. Moritz is larger and more destination-oriented.' },
      { q: 'How do I get to St. Moritz?', a: 'The Glacier Express from Zermatt to St. Moritz is one of the world\'s most celebrated scenic train journeys — around 8 hours and worth doing at least once. From Zurich, the direct train via Chur takes around 3.5 hours. The nearest airport with good connections is Zurich; a helicopter transfer is also available for those arriving privately.' },
    ],
  },
  'interlaken': {
    name: 'Interlaken',
    region: 'Bern Oberland, Switzerland',
    tagline: 'Between two lakes, beneath three peaks.',
    description: 'Interlaken sits on a narrow strip of land between Lake Thun and Lake Brienz, with the Eiger, Mönch, and Jungfrau rising directly to the south. What distinguishes it from other Swiss resort towns is the combination of grand hotel heritage and genuine outdoor access: the Victoria-Jungfrau has been operating since 1865, and the Jungfraujoch railway — reaching 3,454m — departs from nearby Grindelwald and Wengen. For luxury travelers, Interlaken works both as a destination in itself and as a base for the wider Jungfrau region.',
    highlights: ['Direct views of the Eiger, Mönch and Jungfrau', 'Gateway to Jungfraujoch and the Jungfrau ski region', 'Lake Thun and Lake Brienz on either side of the town', 'Grand hotel heritage dating to the 19th century', 'Access to car-free villages Wengen and Mürren'],
    bestFor: ['Families combining luxury with outdoor access', 'Couples seeking dramatic scenery without a ski-only focus', 'Wellness travelers at Victoria-Jungfrau\'s major spa', 'Travelers exploring the wider Bernese Oberland'],
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600',
    seasonal: 'Summer — June to September — is Interlaken at its best. Hiking trails open, the lakes warm for swimming, and mountain views are sharpest in early morning. Winter brings skiing access via Grindelwald and Wengen, though Interlaken itself sits at low altitude and rarely gets snow in the town. Autumn is underrated — October valley light is exceptional and crowds are thin.',
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
      { q: 'What is the best luxury hotel in Interlaken?', a: 'Victoria-Jungfrau Grand Hotel & Spa is the benchmark — a Belle Époque grand hotel open since 1865 with direct Jungfrau views, one of the larger hotel spas in Switzerland, and a Michelin-starred restaurant. For something more intimate, Lindner Grand Hotel Beau Rivage offers strong lake views and a quieter atmosphere.' },
      { q: 'Is Interlaken only for adventure sports?', a: 'No — Interlaken has a strong adventure sports reputation but the grand hotels, lake excursions, mountain railways, and access to car-free villages like Wengen and Mürren make it equally compelling for travelers with no interest in adrenaline activities.' },
      { q: 'How do I get to Interlaken?', a: 'Interlaken is around 2 hours from both Zurich and Geneva by direct train. From Zurich the route passes through Bern and along Lake Thun. From Geneva the train runs along Lake Geneva through Lausanne before climbing into the Bernese Oberland — one of Switzerland\'s most scenic rail journeys.' },
    ],
  },
  'zurich': {
    name: 'Zurich',
    region: 'Zurich, Switzerland',
    tagline: 'Switzerland\'s most liveable city — and increasingly its most interesting.',
    description: 'Zurich has spent years being underestimated by travelers who treat it as a stopover. The financial core still dominates — Bahnhofstrasse is one of Europe\'s most concentrated luxury shopping streets — but the broader city has developed a restaurant scene, a design hotel culture, and a lakeside energy that rewards longer stays. The old town sits on both banks of the Limmat, the lake opens south with Alpine views on clear days, and a concentration of world-class museums sits within walking distance. For luxury travelers, Zurich offers Swiss operational excellence, a compact walkable centre, and hotels ranging from established grand properties to Philippe Starck-designed boutiques on the water.',
    highlights: ['Bahnhofstrasse — concentrated luxury shopping street', 'Lake Zurich with Alpine views on clear days', 'Medieval old town on both banks of the Limmat', 'Kunsthaus Zurich — major art museum', 'Strong restaurant scene across price points'],
    bestFor: ['Business travelers combining work and quality downtime', 'Design and architecture enthusiasts', 'Couples on short city breaks', 'Travelers using Zurich as a hub for wider Swiss exploration'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600',
    seasonal: 'Zurich is strongest in late spring and early summer — May and June bring warm lake temperatures and outdoor dining on the Limmat. July and August are peak season with lake swimming at the Seebad facilities. December brings Christmas markets, particularly the one inside the main station. Winter is quieter but the opera, galleries, and restaurant scene continue year-round.',
    bestPages: [
      { label: 'Best luxury hotels in Zurich', href: '/best/luxury-hotels-zurich' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'La Réserve Eden au Lac vs Baur au Lac', href: '/compare/la-reserve-zurich-vs-baur-au-lac-zurich' },
      { label: 'La Réserve Eden au Lac vs The Dolder Grand', href: '/compare/la-reserve-zurich-vs-the-dolder-grand' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Zurich?', a: 'It depends on the kind of stay. La Réserve Eden au Lac is the strongest choice for a design-led boutique experience on the lake — 40 rooms, Philippe Starck interiors, Michelin-starred dining. Baur au Lac is the most established grand hotel, preferred for traditional Swiss luxury and a central lakeside position. The Dolder Grand suits those wanting a resort experience with a major spa, set on a hillside above the city.' },
      { q: 'How far is Zurich from the Swiss Alps?', a: 'Zurich is one of the best-connected Swiss cities for mountain access. Andermatt is around 2 hours by train, Davos around 2.5 hours, St. Moritz around 3.5 hours. The Rigi and Pilatus mountains above Lake Lucerne are reachable in under an hour for a day trip.' },
      { q: 'Is Zurich good for a weekend luxury break?', a: 'Zurich works well for two or three nights. The old town, lake promenade, Bahnhofstrasse, and Kunsthaus can be covered in a day, leaving time for a lake excursion or trip to Lucerne. The restaurant scene has enough variety to make both evenings worthwhile.' },
    ],
  },
  'gstaad': {
    name: 'Gstaad',
    region: 'Bernese Oberland, Swiss Alps',
    tagline: 'Discreet, understated, and entirely deliberate about both.',
    description: 'Gstaad has cultivated its reputation carefully. Where St. Moritz announces itself, Gstaad withholds — the village is small, the chalet architecture strictly enforced, and the atmosphere resolutely against anything that feels like mass tourism. The result is a resort that has attracted a remarkably consistent clientele for over a century: royalty, old money, artists, and those wealthy enough to prefer anonymity to spectacle. The skiing across the Gstaad Mountain Rides area covers four valleys and connects several villages, but skiing is almost secondary to the lifestyle the resort represents. The Palace Hotel has been defining Alpine luxury since 1913; The Alpina Gstaad, opened in 2012, brought contemporary design and serious gastronomy to a destination that had long been associated with a more traditional grand hotel style.',
    highlights: ['Strict chalet architecture — no high-rise buildings permitted', 'Gstaad Mountain Rides ski area across four valleys', 'Palace Hotel — one of Switzerland\'s most iconic properties', 'The Alpina Gstaad — leading contemporary luxury hotel', 'Menuhin Festival classical music in summer'],
    bestFor: ['Ultra-luxury travelers who value privacy over social scene', 'Those seeking a genuinely exclusive Alpine village atmosphere', 'Families with multigenerational luxury hotel expectations', 'Summer visitors combining music, hiking and wellness'],
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600',
    seasonal: 'December to April for skiing, with Christmas and New Year the most sought-after period — book Palace Hotel and The Alpina many months in advance for these dates. The Menuhin Festival in July brings a cultural dimension that makes summer genuinely worth considering. June to September offers hiking, tennis, golf, and a village that feels refreshingly uncrowded compared to its winter self. Unlike some Swiss resorts, Gstaad\'s summer season is well-established.',
    bestPages: [
      { label: 'Best luxury hotels in Gstaad', href: '/best/luxury-hotels-gstaad' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'The Alpina Gstaad vs Palace Hotel Gstaad', href: '/compare/the-alpina-gstaad-vs-palace-hotel-gstaad' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Gstaad?', a: 'The Alpina Gstaad and Palace Hotel Gstaad represent two distinct expressions of Gstaad luxury. The Alpina is the stronger choice for travelers who want contemporary design, exceptional multi-restaurant dining, and a spa that feels genuinely world-class. Palace Hotel is the right choice for those who want the historic grand hotel experience — the turrets, the long-established staff, the sense of continuity. Both are among Switzerland\'s finest properties.' },
      { q: 'Why is Gstaad considered more exclusive than other Swiss resorts?', a: 'Several factors combine: the strict building regulations that prevent overdevelopment, the consistent high-net-worth clientele over several generations, the small village scale that limits visitor numbers, and a culture of discretion that discourages the kind of social performance common in St. Moritz. Gstaad does not need to market itself heavily — its reputation is maintained by word of mouth among a relatively closed social network.' },
      { q: 'How do I get to Gstaad?', a: 'Gstaad is most easily reached by the MOB Golden Pass train from Montreux — a scenic 2-hour journey that is worth taking for the views alone. From Bern, the train via Zweisimmen takes around 1.5 hours. The nearest major airport is Geneva at around 2.5 hours by road or rail. There is a small airfield at Saanen, 3km from the village, used for private aviation.' },
    ],
  },
  'lucerne': {
    name: 'Lucerne',
    region: 'Central Switzerland',
    tagline: 'The most immediately beautiful city in Switzerland — and aware of it.',
    description: 'Lucerne has a quality that very few cities possess: it looks exactly as good in person as it does in photographs. The Chapel Bridge crossing the Reuss, the medieval water tower, the painted facades of the old town, and the lake opening south towards the Alps compose a scene that has been drawing travelers since the Grand Tour era. What sustains it as a luxury destination rather than merely a day-trip stop is the quality of its hotels — properties like Mandarin Oriental Palace Luzern and the Grand Hotel National occupy historic lakefront buildings with views that remain genuinely impressive — and a classical music culture, centred on the KKL Luzern concert hall and the annual Lucerne Festival, that gives the city cultural substance beyond its scenery.',
    highlights: ['Chapel Bridge — 14th-century covered wooden bridge', 'Lake Lucerne with direct Alpine backdrop', 'KKL Luzern — world-class concert hall', 'Lucerne Festival — one of Europe\'s premier classical music events', 'Day trip access to Mount Rigi, Pilatus and Titlis'],
    bestFor: ['Couples combining culture and scenery', 'Classical music enthusiasts visiting for the Lucerne Festival', 'Travelers using central Switzerland as a base', 'Those who want a city break without urban intensity'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'Summer — June to September — is peak season and deservedly so: the lake is at its most vivid, the mountains visible, and the Lucerne Festival (August-September) brings the city\'s cultural life to its highest point. Spring is underrated — the old town in April and May without summer crowds is one of Switzerland\'s quieter pleasures. Winter is quiet but the Christmas market on the lakefront is among Switzerland\'s most atmospheric. Avoid August weekends if you want the old town to yourself.',
    bestPages: [
      { label: 'Best luxury hotels in Lucerne', href: '/best/luxury-hotels-lucerne' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Mandarin Oriental Palace vs Hotel Schweizerhof Luzern', href: '/compare/mandarin-oriental-palace-luzern-vs-hotel-schweizerhof-luzern' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Lucerne?', a: 'Mandarin Oriental Palace Luzern occupies one of the finest hotel buildings in Switzerland — a historic lakefront palace with views across to the Alps, Michelin-level dining, and the service standards the Mandarin Oriental brand is known for. For travelers who want a more central position within the old town, Hotel Schweizerhof Luzern is a long-established grand hotel with strong lake views and a reputation for consistent quality.' },
      { q: 'Is Lucerne worth more than a day trip?', a: 'Absolutely. Most travelers who visit Lucerne as a day trip from Zurich or Interlaken leave wishing they had stayed. The old town rewards slower exploration, the lake excursions are genuinely worthwhile, and the day trips to Rigi and Pilatus are better experienced with an early morning start from a local hotel rather than a rushed itinerary from elsewhere.' },
      { q: 'How far is Lucerne from Zurich and Interlaken?', a: 'Lucerne is 50 minutes from Zurich by direct train — one of Switzerland\'s most used rail connections. From Interlaken, the journey takes around 2 hours via Bern or the scenic Brünig Pass route. Lucerne works well as a central node in a wider Swiss itinerary.' },
    ],
  },
  'verbier': {
    name: 'Verbier',
    region: 'Valais, Swiss Alps',
    tagline: 'The Alps\' most energetic resort — serious skiing, serious après.',
    description: 'Verbier occupies a different position in the Swiss luxury landscape to Gstaad or St. Moritz. It is louder, younger in energy, and unabashedly skiing-focused — the Four Valleys ski domain is one of the most extensive in the Alps, and the off-piste terrain around Mont-Fort attracts some of the world\'s best freeride skiers every winter. The village sits at 1,500m on a sunny plateau above the Rhône Valley, with a mix of traditional chalets and more contemporary design hotels that has evolved significantly over the past decade. What makes Verbier compelling for luxury travelers is that it combines genuine mountain seriousness — this is not a resort for posing — with a hospitality scene that has grown to match: destination spas, Michelin-level dining, and hotels that understand their guests arrive exhausted from a full day on the mountain.',
    highlights: ['Four Valleys ski domain — one of the largest linked areas in the Alps', 'Mont-Fort at 3,330m for serious off-piste terrain', 'Verbier Festival — major classical music event each July', 'Strong après-ski culture centred on Place Centrale', 'Sunny south-facing plateau position'],
    bestFor: ['Serious and advanced skiers who also want luxury', 'Younger luxury travelers and groups', 'Music lovers visiting for the Verbier Festival in summer', 'Those who want energy and social atmosphere alongside mountain access'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'December to April for skiing, with January to March the optimal period for snow reliability. The resort sits on a south-facing plateau which means excellent sunshine but can affect snow quality in late March. The Verbier Festival in July is the standout summer event — world-class classical musicians perform across two weeks in an extraordinary mountain setting. Outside festival period, summer is quieter than the ski season but the hiking and mountain biking infrastructure is well developed.',
    bestPages: [
      { label: 'Best luxury hotels in Verbier', href: '/best/luxury-hotels-verbier' },
      { label: 'Best ski hotels in Verbier', href: '/best/ski-hotels-verbier' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'W Verbier vs Chalet d\'Adrien', href: '/compare/w-verbier-vs-chalet-dadrien' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Verbier?', a: 'W Verbier is the leading luxury ski hotel — a 5-star property with ski-in ski-out access, a destination spa, and a design and energy that fits Verbier\'s character well. For travelers who prefer something more intimate and traditional, Chalet d\'Adrien offers a classic luxury chalet experience with exceptional food and a more personal atmosphere.' },
      { q: 'How does Verbier compare to Zermatt?', a: 'The two resorts attract genuinely different travelers. Verbier is more energetic, more focused on advanced skiing and après-ski, and has a younger overall atmosphere. Zermatt is more traditional, car-free, and defined by the Matterhorn in a way that gives it a different emotional register. Verbier suits those who want the skiing to be physically demanding and the evenings to be social; Zermatt suits those who want the mountain to feel like the main event in all its forms.' },
      { q: 'Is Verbier accessible by public transport?', a: 'Yes — the most straightforward route is by train to Le Châble in the Bagnes valley, then gondola directly up to Verbier. From Geneva, the total journey is around 2 hours. From Zurich, allow around 3 hours with the connection in Martigny. A direct bus service from Geneva airport also operates during ski season.' },
    ],
  },
  'davos': {
    name: 'Davos',
    region: 'Graubünden, Swiss Alps',
    tagline: 'Serious skiing, serious infrastructure, serious reputation.',
    description: 'Davos sits at around 1,560m in the Graubünden Alps — one of the higher-altitude resorts in Switzerland — and its identity is shaped by two things: the Parsenn ski area, one of the most extensive in the Alps, and the World Economic Forum, which has met here annually since 1971. For luxury travelers who are not WEF delegates, this combination works in their favour: the hotels are accustomed to demanding international guests, the infrastructure is well-maintained year-round, and the resort has a more functional, less showy atmosphere than St. Moritz or Gstaad.',
    highlights: ['Access to the Parsenn ski area — one of Switzerland\'s largest linked areas', 'Connection to Klosters via the Parsenn lifts', 'Strong congress and business infrastructure', 'Davos Lake for summer swimming and walks', 'Well-developed summer hiking and biking trails'],
    bestFor: ['Serious skiers who want luxury without the social scene', 'Business travelers attending congresses or conferences', 'Families wanting a spacious, well-equipped resort', 'Travelers who prefer Graubünden\'s quieter character'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'December to March for skiing, with January dominated by the World Economic Forum — rates increase and some areas are restricted. February and March offer the best combination of snow conditions and normal resort atmosphere. Summer is underrated: the Davos Lake, hiking trails through the Flüela and Dischma valleys, and mountain biking routes offer genuine outdoor quality away from ski crowds.',
    bestPages: [
      { label: 'Best luxury hotels in Davos', href: '/best/luxury-hotels-davos' },
      { label: 'Best ski hotels in Davos', href: '/best/ski-hotels-davos' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Alpengold Hotel vs Steigenberger Grandhotel Belvédère', href: '/compare/alpengold-hotel-vs-steigenberger-grandhotel-belvedere' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Davos?', a: 'Alpengold Hotel is the strongest luxury choice — a 5-star property with a distinctive organic architecture, a large spa, multiple restaurants, and direct access to the Parsenn ski area. For a more traditional grand hotel atmosphere, Steigenberger Grandhotel Belvédère has been welcoming guests since 1875 and maintains a classic Alpine hospitality style.' },
      { q: 'How does Davos compare to Klosters?', a: 'Davos and Klosters share the same ski area via the Parsenn lifts but feel completely different as villages. Klosters is smaller, quieter, and more discreet. Davos is larger, more functional, and better equipped for longer stays. They are around 10 minutes apart by train — some travelers stay in Klosters and ski into Davos.' },
      { q: 'Should I avoid Davos during the World Economic Forum?', a: 'Unless you are attending, late January is not ideal — security is extensive, some areas are restricted, and rates peak significantly. Early January and February offer the same skiing with a considerably more relaxed atmosphere.' },
    ],
  },
  'crans-montana': {
    name: 'Crans-Montana',
    region: 'Valais, Swiss Alps',
    tagline: 'The sunniest resort in the Alps — with a panorama that stops conversations.',
    description: 'Crans-Montana sits on a broad south-facing plateau at 1,500m above the Rhône Valley, and the view from almost anywhere in the resort is the kind that takes a moment to process: a 180-degree panorama stretching from Mont Blanc to the Matterhorn, with the entire chain of Valais peaks between them. The sunshine record here is exceptional — the plateau catches light that the valley floor never sees — and this gives the resort a warmth and brightness that distinguishes it from more enclosed Alpine destinations. Two villages merge across the plateau: Crans is the more commercial, with luxury boutiques and hotels; Montana the more residential. The skiing across 140km of pistes is varied enough for all levels, and the Omega European Masters golf tournament each September confirms that Crans-Montana takes its summer season as seriously as its winter one.',
    highlights: ['Panoramic views from Mont Blanc to the Matterhorn', 'Exceptional sunshine record on the south-facing plateau', '140km of ski pistes across varied terrain', 'Omega European Masters golf course', 'Strong wellness hotel offering'],
    bestFor: ['Skiers who want sunshine and panoramic scenery alongside serious slopes', 'Golf travelers visiting for the European Masters course', 'Wellness travelers at properties like Six Senses Crans-Montana', 'Couples who want Alpine luxury without a purely skiing-focused resort'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'December to April for skiing, with January and February the most reliable for snow. The south-facing position means exceptional sunshine but can affect snow quality on lower slopes in late March. September is the Omega European Masters golf month — the resort fills and the atmosphere is distinctly different from ski season. Summer from June to August offers hiking, mountain biking, and the golf course at its best, with the panoramic views arguably more impressive than in winter.',
    bestPages: [
      { label: 'Best luxury hotels in Crans-Montana', href: '/best/luxury-hotels-crans-montana' },
      { label: 'Best ski hotels in Crans-Montana', href: '/best/ski-hotels-crans-montana' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Crans Ambassador vs Hotel Guarda Golf', href: '/compare/crans-ambassador-vs-hotel-guarda-golf-crans-montana' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Crans-Montana?', a: 'Crans Ambassador is the leading luxury ski hotel on the plateau — ski-in ski-out at 1,500m, 56 rooms, a 1,300 m² spa, and three restaurants. Six Senses Crans-Montana brings a different philosophy: wellness-first, with the Six Senses approach to health programming in an Alpine setting. The choice depends on whether your priority is ski convenience and traditional Alpine luxury or a more wellness-oriented stay.' },
      { q: 'Is Crans-Montana better for beginners or advanced skiers?', a: 'The resort suits both. The plateau position and varied terrain means gentler runs for beginners and intermediates across much of the ski area, while the higher terrain above Cry d\'Er and Toula offers more demanding skiing. It is not a freeride resort like Verbier, but serious skiers find enough variety for a week\'s skiing.' },
      { q: 'How do I get to Crans-Montana?', a: 'The most scenic route is by train to Sierre in the Rhône Valley, then the funicular directly up to Montana — around 2 hours from Geneva or 2.5 hours from Zurich. A direct bus service from Geneva airport operates during the ski season. By car, Sierre is easily reached via the A9 motorway through the Valais.' },
    ],
  },
  'flims': {
    name: 'Flims',
    region: 'Graubünden, Switzerland',
    tagline: 'Ancient forests, a turquoise lake, and a gorge that earns the comparison to the Grand Canyon.',
    description: 'Flims occupies a position in the Swiss consciousness as the destination for those who have moved beyond the obvious. It lacks the celebrity associations of Gstaad or the mythological weight of Zermatt — what it offers instead is landscape of exceptional and unusual quality. The Caumasee lake, its colour an implausible turquoise born of glacial minerals, sits within ancient forest above the village. The Ruinaulta Rhine Gorge — a 14km canyon carved through 9,000-year-old landslide debris — is one of Switzerland\'s most dramatic natural features. The skiing across the Weisse Arena links Flims with Laax and Falera for 224km of pistes, and Laax in particular has developed a serious reputation for snowboarding and freestyle skiing. The wellness hotel offering, anchored by Hotel Adula, provides the luxury infrastructure that makes Flims a genuine destination rather than merely a scenic one.',
    highlights: ['Caumasee — glacial turquoise lake within ancient forest', 'Ruinaulta Rhine Gorge — Switzerland\'s Grand Canyon', 'Weisse Arena ski domain — 224km linking Flims, Laax and Falera', 'Laax — one of Europe\'s leading freestyle and snowboard resorts', 'Romansh cultural heritage in the surrounding villages'],
    bestFor: ['Nature travelers who want dramatic landscape as the primary experience', 'Skiers and snowboarders seeking terrain variety beyond classic Alpine resorts', 'Wellness travelers drawn to forest and lake settings', 'Travelers who want Graubünden\'s quieter, less commercialised character'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'December to April for skiing — the linked Weisse Arena domain offers reliable snow across an elevation range that keeps conditions good throughout the season. Summer from June to September is when the landscape is most accessible: the Caumasee reaches swimmable temperatures, the Rhine Gorge walks open fully, and the ancient forest trails are at their most atmospheric. Early autumn — September and October — is an underrated time: the deciduous forest turns, the crowds thin, and the gorge light is exceptional.',
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
      { q: 'What is the best luxury hotel in Flims?', a: 'Hotel Adula is the leading luxury property in Flims — a 4-star superior hotel with indoor pool, spa, three restaurants, and a position that gives direct access to both the ski area and the forest trails to the Caumasee. For travelers who want a more classic grand hotel atmosphere, Parkhotel Waldhaus Flims is a long-established property set within its own park above the village.' },
      { q: 'What is the Ruinaulta Rhine Gorge?', a: 'The Ruinaulta is a 14km gorge carved by the Rhine through the deposits of a massive prehistoric landslide — around 9,000 years ago, a collapse from the Flimserstein peak deposited billions of cubic metres of rock across the valley. The river has since cut through this material to create canyon walls up to 400m high with a characteristic white-grey colour. The gorge is walkable, cyclable, and accessible by the Chur-Disentis railway line that runs through it.' },
      { q: 'How does Flims compare to Davos or St. Moritz for a luxury ski stay?', a: 'Flims-Laax is less socially prominent than St. Moritz and less internationally known than Davos, which is precisely its appeal for certain travelers. The skiing is extensive and varied, the landscape more dramatically natural, and the atmosphere more relaxed. If your priority is the mountain environment and quality accommodation without a heavy social scene, Flims-Laax is one of Switzerland\'s most underrated choices.' },
    ],
  },
  'bern': {
    name: 'Bern',
    region: 'Bern, Switzerland',
    tagline: 'Switzerland\'s capital — unhurried, underrated, and genuinely distinctive.',
    description: 'Bern is the most underestimated city in Switzerland. While Zurich and Geneva compete for international attention, the federal capital goes about its business with a quiet confidence that rewards travelers willing to look beyond the obvious Swiss itinerary. The UNESCO-listed old town is one of Europe\'s most intact medieval city centres — 6 kilometres of arcaded walkways, sandstone fountains, and clock towers arranged on a peninsula above a dramatic bend in the Aare river. The political dimension is real and felt: the Federal Palace sits at the heart of the city, Bellevue Palace directly opposite has served as Switzerland\'s official state guesthouse since 1913, and the atmosphere carries a certain weight that comes from being the place where Swiss policy is made. For luxury travelers, Bern offers a different register to the resort towns — more residential, more local, more genuinely Swiss.',
    highlights: ['UNESCO World Heritage old town with 6km of medieval arcades', 'Federal Palace — seat of Swiss government', 'Aare river gorge views from the Rose Garden', 'Bellevue Palace — Switzerland\'s official state guesthouse', 'Strong museum quarter including the Zentrum Paul Klee'],
    bestFor: ['Travelers who want genuine Swiss urban culture over resort atmosphere', 'Those combining business at federal institutions with quality stays', 'Couples seeking a city break without Zurich\'s pace or Geneva\'s internationalism', 'Culture travelers interested in Swiss political and artistic heritage'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'Bern works well year-round but is at its most atmospheric in spring and early summer — the Rose Garden above the Aare is at its best in June, the arcaded streets are pleasant in any weather, and the outdoor dining season opens fully in May. The Christmas market on Waisenhausplatz is one of Switzerland\'s most local-feeling festive events. Summer brings the Buskers festival in August, one of Europe\'s largest street music events. Winter is quiet but the city never closes.',
    bestPages: [
      { label: 'Best luxury hotels in Bern', href: '/best/luxury-hotels-bern' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Bellevue Palace vs Hotel Schweizerhof Bern', href: '/compare/bellevue-palace-vs-hotel-schweizerhof-bern' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Bern?', a: 'Bellevue Palace is the definitive luxury address in Bern — directly opposite the Federal Palace, with views over the Aare gorge and the Alps beyond, and a history that includes hosting every significant political figure who has passed through Switzerland\'s capital. Hotel Schweizerhof Bern is the stronger choice for travelers who want a central old-town position with a slightly less formal atmosphere.' },
      { q: 'Why visit Bern rather than Zurich or Geneva?', a: 'Bern offers something neither Zurich nor Geneva quite deliver: a genuinely Swiss urban experience that has not been heavily internationalised. The old town feels lived-in rather than curated, the pace is slower, and the combination of political history, river scenery, and medieval architecture creates a character that is entirely its own. It suits travelers who want to understand Switzerland rather than simply pass through it.' },
      { q: 'How well connected is Bern?', a: 'Bern\'s central position makes it one of Switzerland\'s most connected cities. Zurich is 58 minutes by direct train, Geneva 1 hour 50 minutes, Basel 58 minutes, and Interlaken around 50 minutes. It works well as a base for a wider Swiss itinerary or as a standalone two to three night stay.' },
    ],
  },
  'basel': {
    name: 'Basel',
    region: 'Basel-Stadt, Switzerland',
    tagline: 'Where three countries meet — and the art world descends every June.',
    description: 'Basel sits at a genuinely unusual geographic and cultural intersection: the point where Switzerland, Germany, and France converge on the Rhine. This tri-border position has historically made it a city of trade, ideas, and movement — and it shows in the cultural infrastructure that Basel has accumulated over centuries. With over 40 museums for a city of 180,000 people, it has the highest density of museums per capita of any city in the world. Art Basel — held each June — is the event that brings the global art market to Switzerland, filling the city\'s hotels and restaurants with collectors, gallerists, and cultural figures. For luxury travelers, Basel is most rewarding when visited with cultural intent: the Fondation Beyeler alone justifies a trip, and the Rhine waterfront has a quality that rewards time spent.',
    highlights: ['Over 40 museums including the Kunstmuseum and Fondation Beyeler', 'Art Basel — the world\'s most prestigious art fair each June', 'Rhine waterfront and the historic Grossbasel old town', 'Tri-border location connecting Switzerland, Germany and France', 'Les Trois Rois — one of Switzerland\'s oldest grand hotels'],
    bestFor: ['Art collectors and culture travelers, especially during Art Basel', 'Business travelers using Basel as a European hub', 'Those combining a city break with visits to Alsace or the Black Forest', 'Travelers who want Swiss quality without a resort or tourist-heavy atmosphere'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600',
    seasonal: 'June is the peak month — Art Basel transforms the city and hotel rates reflect it. Book well in advance if visiting during the fair. The rest of the year Basel operates at a quieter, more local rhythm. Spring along the Rhine is pleasant; the Fasnacht carnival in February is one of Switzerland\'s most distinctive cultural events, beginning at precisely 4am on the Monday after Ash Wednesday. Winter is quiet but the Christmas market on Barfüsserplatz is among the country\'s best.',
    bestPages: [
      { label: 'Best luxury hotels in Basel', href: '/best/luxury-hotels-basel' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
    ],
    compareLinks: [],
    faqs: [
      { q: 'What is the best luxury hotel in Basel?', a: 'Les Trois Rois — The Three Kings — is Basel\'s only 5-star grand hotel, occupying a building on the Rhine that has hosted guests since 1681. Its Michelin-starred restaurant, Rhine-facing rooms, and position at the heart of the city make it the natural choice for luxury travelers. There is no comparable alternative in the same category in Basel.' },
      { q: 'Is Basel worth visiting outside of Art Basel?', a: 'Absolutely. The Fondation Beyeler in nearby Riehen is one of Europe\'s finest private art museums and worth the trip alone. The Kunstmuseum Basel holds one of the world\'s oldest public art collections. The Rhine swimming culture in summer — locals float downstream in the current using waterproof bags — gives the city a character unlike anywhere else in Switzerland.' },
      { q: 'How do I get to Basel?', a: 'Basel is exceptionally well connected. EuroAirport Basel-Mulhouse-Freiburg serves the city from most major European hubs. By train, Zurich is 58 minutes, Bern 58 minutes, and Paris around 3 hours on the TGV. Basel is one of the easiest Swiss cities to reach from across Europe.' },
    ],
  },
  'lugano': {
    name: 'Lugano',
    region: 'Ticino, Switzerland',
    tagline: 'Swiss precision, Italian temperament — and a lake that earns every superlative.',
    description: 'Lugano is Switzerland\'s most genuinely Mediterranean city, and the contrast with the rest of the country is immediate on arrival. The Italian language, the terracotta architecture, the palm-lined lakefront promenade, and the pace of life in the old town piazzas all signal that you are in a different Switzerland. The canton of Ticino has been Italian-speaking since the 16th century, and that cultural continuity gives Lugano a coherence that tourist-facing Swiss-Italian hybrid destinations sometimes lack. Lake Lugano itself — blue-green, hemmed by steep forested hills — is one of the most beautiful bodies of water in Europe. The luxury hotel scene is anchored by lakefront historic properties that understand their setting: terraces over the water, gardens that descend to private docks, and a cuisine that draws on both Swiss and Italian traditions at a serious level.',
    highlights: ['Lake Lugano — one of Europe\'s most beautiful lakes', 'Italian-speaking culture with Swiss infrastructure', 'Monte San Salvatore and Monte Brè for panoramic views', 'Strong private banking and business culture', 'Easy access to the Italian Lakes and Milan'],
    bestFor: ['Couples seeking Mediterranean atmosphere with Swiss comfort', 'Travelers combining Lugano with the Italian Lakes', 'Business travelers in the financial sector', 'Those wanting lakeside luxury in a warmer, more relaxed climate than northern Switzerland'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'April to October is the optimal window — Lugano\'s Mediterranean microclimate means genuinely warm summers with lake temperatures suitable for swimming from June onwards. Spring is the most beautiful season for the lakeside gardens. The Lugano Summer Festival runs through July and August. Winter is mild by Swiss standards but most of the outdoor appeal diminishes; the city is quieter and some lakefront hotels reduce services.',
    bestPages: [
      { label: 'Best luxury hotels in Lugano', href: '/best/luxury-hotels-lugano' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Grand Hotel Villa Castagnola vs Hotel Splendide Royal', href: '/compare/grand-hotel-villa-castagnola-lugano-v2-vs-hotel-splendide-royal-lugano' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Lugano?', a: 'Grand Hotel Villa Castagnola is the strongest choice — a lakefront estate hotel with Michelin-level dining, private gardens descending to the water, and a history that stretches back to the late 19th century. Hotel Splendide Royal offers a more central position on the lakefront promenade and has been one of Lugano\'s landmark properties since 1887. Both are compelling; the choice comes down to whether you prefer estate seclusion or promenade proximity.' },
      { q: 'How does Lugano compare to Ascona?', a: 'Lugano is a city — it has urban energy, a financial district, a full range of cultural and commercial infrastructure, and a lakefront that balances tourism with local life. Ascona is a village, deliberately small, with a more exclusive and resort-focused atmosphere. Lugano suits travelers who want city convenience alongside Mediterranean climate; Ascona suits those who want to disappear into a beautiful setting with minimal urban distraction.' },
      { q: 'How do I get to Lugano?', a: 'Lugano Airport has limited direct connections but the train from Zurich takes around 2 hours and 45 minutes through some exceptional Alpine scenery including the Gotthard Base Tunnel. Milan Malpensa is around 1 hour by road — making Lugano accessible from a wide range of European and international flights via Milan.' },
    ],
  },
  'ascona': {
    name: 'Ascona',
    region: 'Ticino, Switzerland',
    tagline: 'The smallest town in Switzerland with an outsized sense of occasion.',
    description: 'Ascona is a deliberate anomaly in the Swiss landscape — a small, sun-drenched village on the northern shore of Lake Maggiore that has attracted artists, writers, intellectuals, and the quietly wealthy for over a century. The Piazza Motta, running directly along the lake with its coloured facades and terrace restaurants, is one of the most beautiful public spaces in Switzerland. Monte Verità — the hill above the village where a utopian artists\' colony established itself in the early 20th century — gives Ascona a cultural backstory that most Swiss resorts lack entirely. The luxury hotels here, Eden Roc and Castello del Sole in particular, understand that their guests are not seeking activity-packed resorts but rather a particular quality of light, water, and unhurried time. That is Ascona\'s specific offering, and it is delivered with considerable sophistication.',
    highlights: ['Piazza Motta — one of Switzerland\'s most beautiful lakefront squares', 'Lake Maggiore with views towards the Italian shore', 'Eden Roc — landmark luxury hotel reopened after major restoration', 'Monte Verità — historic artists\' colony and cultural site', 'JazzAscona festival each June'],
    bestFor: ['Couples and honeymooners seeking Mediterranean seclusion', 'Wellness travelers prioritising calm over activity', 'Art and culture enthusiasts drawn to Monte Verità\'s history', 'Those wanting Ticino\'s Italian atmosphere in a more intimate setting than Lugano'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'May to October is the season, with July and August the warmest months for lake swimming and outdoor dining on the Piazza. June brings JazzAscona, which fills the village for several weeks. September and October offer some of the best conditions — the summer crowds thin, the light becomes golden, and the lake temperatures remain swimmable. Ascona largely closes in winter; most luxury hotels operate seasonally.',
    bestPages: [
      { label: 'Best luxury hotels in Ascona', href: '/best/luxury-hotels-ascona' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best luxury hotels in Lugano', href: '/best/luxury-hotels-lugano' },
    ],
    compareLinks: [
      { label: 'Eden Roc Ascona vs Castello del Sole', href: '/compare/eden-roc-ascona-vs-castello-del-sole' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Ascona?', a: 'Eden Roc Ascona is the landmark property — a historic lakefront hotel that underwent major restoration and reopened with 95 rooms, five restaurants, and a position directly on Lake Maggiore that few hotels in Switzerland can match for sheer setting. Castello del Sole takes a different approach: a wine estate and beach hotel set within private grounds outside the village, combining agricultural heritage with serious wellness and dining.' },
      { q: 'What is Monte Verità?', a: 'Monte Verità is the hill directly above Ascona where, from around 1900, a group of idealists — vegetarians, nudists, anarchists, artists, and reformers — established an alternative colony that attracted figures including Hermann Hesse, Rudolf Laban, and Carl Jung. The site is now a hotel and cultural foundation, and it gives Ascona a intellectual and artistic history that is entirely unlike any other Swiss resort.' },
      { q: 'How do I get to Ascona?', a: 'The most practical route is by train to Locarno — around 2.5 hours from Zurich via the Gotthard — then taxi or bus to Ascona, around 15 minutes. Milan Malpensa airport is around 1.5 hours by road, making Ascona accessible from a wide range of international flights. A seaplane service from Lugano also operates seasonally.' },
    ],
  },
  'andermatt': {
    name: 'Andermatt',
    region: 'Uri, Swiss Alps',
    tagline: 'The most ambitious transformation in Swiss alpine tourism — and it is working.',
    description: 'Andermatt\'s reinvention is one of the more remarkable stories in contemporary Swiss hospitality. A historic mountain village at the crossroads of four Alpine passes — Gotthard, Furka, Oberalp, and Susten — it spent much of the 20th century as a quiet military garrison town, underused and largely overlooked by the luxury ski market. The arrival of The Chedi Andermatt in 2013, followed by a broader resort development programme, changed that entirely. Today Andermatt offers something genuinely rare: world-class luxury infrastructure in an Alpine setting that has not yet been worn smooth by decades of mass tourism. The skiing across SkiArena Andermatt-Sedrun is serious high-alpine terrain, The Chedi\'s spa contains the longest indoor pool in the Alps, and the village retains an authenticity that purpose-built resorts cannot manufacture.',
    highlights: ['SkiArena Andermatt-Sedrun — high-alpine skiing to 3,000m', 'The Chedi Andermatt — longest indoor pool in the Alps', 'Crossroads of four major Alpine passes', 'Less crowded than established resorts with equivalent facilities', 'Year-round destination with growing summer season'],
    bestFor: ['Luxury travelers who want established quality without established crowds', 'Serious skiers seeking high-alpine terrain with five-star comfort', 'Wellness travelers drawn to The Chedi\'s exceptional spa', 'Those curious about a resort still finding its final form'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'December to April for skiing — the high-alpine terrain means reliable snow and the Gemsstock peak at 2,963m offers some of the most demanding skiing in Switzerland. Summer from June to October is increasingly worth considering: the Andermatt Music Festival, the golf course, and hiking across the pass landscapes offer genuine quality. The village is quieter in summer than the ski season but the infrastructure now supports year-round stays.',
    bestPages: [
      { label: 'Best luxury hotels in Andermatt', href: '/best/luxury-hotels-andermatt' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'The Chedi Andermatt vs Radisson Blu Reussen', href: '/compare/the-chedi-andermatt-vs-radisson-blu-reussen-andermatt' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Andermatt?', a: 'The Chedi Andermatt is the defining property and one of the finest ski hotels in Switzerland — Asian-influenced design in an Alpine setting, multiple Michelin-recognised restaurants, a spa with the longest indoor pool in the Alps, and ski-in ski-out access. The Radisson Blu Reussen offers a more accessible price point with strong facilities and a central village position, suited to travelers who want the Andermatt experience without The Chedi\'s rates.' },
      { q: 'How does Andermatt compare to established resorts like Zermatt or St. Moritz?', a: 'Andermatt offers comparable luxury infrastructure — in some areas, such as The Chedi\'s spa, exceeding the established resorts — in a setting that still feels like a discovery rather than a pilgrimage. Zermatt and St. Moritz carry more history and social cachet; Andermatt offers more space, less crowding, and the particular pleasure of a resort that has not yet peaked. The skiing is serious and underrated.' },
      { q: 'How do I get to Andermatt?', a: 'Andermatt is around 1 hour 45 minutes from Zurich by train on the Matterhorn Gotthard Bahn via Göschenen — a scenic journey through the Reuss valley. From Lucerne, allow around 1.5 hours. The Gotthard road tunnel makes it accessible by car from both north and south in around 2 hours from Zurich or Lugano.' },
    ],
  },
  'montreux': {
    name: 'Montreux',
    region: 'Vaud, Swiss Riviera',
    tagline: 'Palm trees, a medieval castle, and Freddie Mercury — the Swiss Riviera at its most theatrical.',
    description: 'Montreux occupies one of the most naturally gifted positions in Switzerland. The town curves around the eastern end of Lake Geneva, sheltered by the Alps to the north and east in a configuration that creates a microclimate mild enough for palm trees and magnolias to grow at the lakefront. The Château de Chillon, rising from a rocky island just east of the town, has been one of Switzerland\'s most visited monuments for centuries — Lord Byron carved his name into its dungeon wall in 1816. The Montreux Jazz Festival, founded in 1967 and held each July, brings the town a cultural credibility that most Swiss resorts cannot claim: Miles Davis, Nina Simone, David Bowie, and Prince have all performed on its lakeside stages. For luxury travelers, Montreux offers the Fairmont Le Montreux Palace as one of Switzerland\'s great Belle Époque grand hotels, a lakeside promenade lined with sculptures and flowers, and the particular pleasure of a destination that takes its cultural life seriously.',
    highlights: ['Château de Chillon — 12th-century island castle on Lake Geneva', 'Montreux Jazz Festival each July', 'Lakeside promenade with palm trees and Alpine backdrop', 'Fairmont Le Montreux Palace — grand hotel since 1906', 'Easy access to Lausanne, Geneva and the Lavaux vineyards'],
    bestFor: ['Music and culture travelers, especially during the Jazz Festival', 'Couples seeking romantic lakeside atmosphere', 'Those combining the Swiss Riviera with wider Lake Geneva exploration', 'Travelers who want grand hotel history in a non-ski setting'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'July is the peak month — the Jazz Festival fills the town and the lake is at its warmest. Spring, particularly April and May, is when the famous flower displays on the lakefront promenade are at their most impressive and the town is not yet at full capacity. Autumn offers clear lake views and the grape harvest in the nearby Lavaux UNESCO vineyard terraces. Winter is quiet but the Fairmont Palace and the castle remain open, and the town has a melancholy off-season quality that some travelers find more appealing than the summer crowds.',
    bestPages: [
      { label: 'Best luxury hotels in Montreux', href: '/best/luxury-hotels-montreux' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Fairmont Le Montreux Palace vs Le Mirador Resort', href: '/compare/fairmont-le-montreux-palace-vs-le-mirador-resort-spa-mont-pelerin' },
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Montreux?', a: 'Fairmont Le Montreux Palace is the defining grand hotel of the Swiss Riviera — open since 1906, directly on the lake with 236 rooms, multiple restaurants, and a history that includes hosting the Jazz Festival\'s most celebrated artists. Le Mirador Resort & Spa on Mont-Pèlerin above the town offers a different proposition: a clifftop position with exceptional lake views, a major spa, and a more resort-style atmosphere removed from the town itself.' },
      { q: 'What is the Montreux Jazz Festival?', a: 'Founded in 1967 by Claude Nobs, the Montreux Jazz Festival is one of the world\'s most celebrated and longest-running music events. Held across two weeks each July on the shores of Lake Geneva, it has expanded far beyond jazz to encompass rock, soul, blues, and electronic music. The free stages along the lakefront run continuously alongside the ticketed arena concerts, giving the festival an unusually accessible atmosphere for an event of its stature.' },
      { q: 'How far is Montreux from Geneva and Lausanne?', a: 'Montreux is 25 minutes from Lausanne by direct train and around 1 hour 10 minutes from Geneva. The lakeside rail route between Geneva and Montreux is one of Switzerland\'s most scenic — the train runs along the northern shore of Lake Geneva through the Lavaux vineyard terraces, a UNESCO World Heritage landscape. Montreux works well as a standalone destination or as part of a wider Lake Geneva itinerary.' },
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