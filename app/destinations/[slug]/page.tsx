
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

    description: `Discover the best luxury hotels in ${dest.name}, Switzerland. ${dest.tagline}. Expert guide with hotel comparisons, seasonal tips and direct booking.`.slice(0, 155),
    alternates: { canonical: `https://swissnethotels.com/destinations/${slug}` },
    openGraph: {
  title: `Best Luxury Hotels in ${dest.name}, Switzerland`,
  description: dest.description.replace(/\n\n/g, ' ').slice(0, 300),
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
  atmosphere?: string
  hotelScene?: string
  comparison?: string
  gettingThere?: string
  bestPages?: { label: string; href: string }[]
  compareLinks?: { label: string; href: string }[]
  faqs?: { q: string; a: string }[]
}

const DESTINATIONS: Record<string, Destination> = {
  'zermatt': {
    name: 'Zermatt',
    region: 'Valais, Swiss Alps',
    tagline: 'The Matterhorn defines it. The hotels live up to it.',
    description: 'Zermatt is Switzerland\'s most iconic mountain resort. The Matterhorn dominates the horizon from the moment you step off the train — it does not appear gradually, and it does not lose its effect after the first day.\n\nThe village beneath it is car-free, walkable, and genuinely world-class: cobblestone streets, grand hotels open since the 1800s, and a concentration of serious restaurants that would be notable in any major city.',
    atmosphere: 'Zermatt is focused on the mountain in a way that few resorts are. Skiing, hiking, and the landscape are the primary reasons to be here — the social scene exists to support them rather than compete with them.\n\nThe car-free environment creates an unusually intimate atmosphere for a resort of this calibre. It is quieter than Verbier, more traditional than Andermatt, and less overtly social than St. Moritz. It suits travelers for whom the mountain itself is the main event.',
    hotelScene: 'Mont Cervin Palace is the benchmark grand hotel — open since 1852, centrally positioned, with a large spa and one Michelin-starred restaurant. It suits travelers who want the complete traditional grand hotel experience.\n\nCervo Mountain Resort offers a boutique alternative: contemporary Alpine design, strong food, and a more personal atmosphere suited to travelers who find grand hotels too formal.\n\nMonte Rosa Zermatt, open since 1839, is the oldest hotel in the village. Its appeal is historical continuity rather than extensive facilities.\n\nRiffelalp Resort 2222m sits at altitude, accessible by private rack railway, with pistes running directly to the door — the strongest choice for ski convenience.',
    highlights: ['Direct Matterhorn views from the village centre', 'Car-free village — electric taxis and horse-drawn carriages only', 'Extensive ski area across three linked valleys', 'Year-round glacier skiing at high altitude', 'Grand hotels in continuous operation since the 19th century'],
    bestFor: ['Couples seeking alpine romance and Matterhorn views', 'Serious skiers who also want luxury accommodation', 'Honeymooners', 'Multigenerational families', 'Travelers who want a car-free, walkable resort'],
    image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=1600',
    seasonal: 'December to April is peak season — deep snow, atmospheric village lighting, and the mountain at its most dramatic.\n\nJuly and August offer a completely different but equally valid stay: wildflower meadows at altitude, hiking towards the Matterhorn, and the glacier open for summer skiing.\n\nThe shoulder months — May, June, October, November — see most hotels close for refurbishment. Late January to mid-March combines reliable snow with good light.',
    comparison: 'Against St. Moritz, Zermatt is more focused on the mountain itself and less on the social season. St. Moritz has frozen lake events, the Cresta Run, and a more theatrical winter calendar; Zermatt has the Matterhorn and the car-free village intimacy.\n\nAgainst Verbier, Zermatt is more traditional, more relaxed in pace, and better for travelers who want the mountain to feel primary. Verbier is more energetic and better for advanced off-piste skiing.\n\nAgainst Gstaad, Zermatt is more skiing-focused; Gstaad is more lifestyle-focused with a stronger summer season.',
    gettingThere: 'Zermatt is car-free — all visitors arrive by train. The most common route is to Visp or Täsch by Swiss rail, then the Matterhorn Gotthard Bahn rack railway to Zermatt (the final stretch from Täsch takes around 12 minutes).\n\nFrom Geneva, the journey takes around 3.5 hours. From Zurich, around 3.5 hours via Visp. The Glacier Express scenic train connects Zermatt to St. Moritz in around 8 hours.',
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
      { q: 'Which hotel is right for a first visit to Zermatt?', a: 'Mont Cervin Palace is the most complete first visit choice — central position, full facilities, Matterhorn views, and a grand hotel atmosphere that captures what Zermatt has been for 170 years. Cervo Mountain Resort is the better choice for travelers who want something more contemporary and intimate from the start.' },
      { q: 'Is Zermatt good for non-skiers in winter?', a: 'Yes — the village is one of the most pleasant in the Alps on foot. The Bahnhofstrasse is lined with restaurants and boutiques, horse-drawn sledge rides operate through the village, snowshoe trails are accessible from the centre, and the mountain view restaurants serve food worth going up for independently of skiing.' },
      { q: 'Why choose Zermatt over St. Moritz?', a: 'Zermatt suits travelers who want the mountain to be the primary experience — the Matterhorn gives it an identity no other resort matches, and the car-free village creates genuine intimacy. St. Moritz suits those who want the social Alpine season as much as the skiing: the frozen lake events, the Cresta Run, and a more theatrical winter programme.' },
    ],
  },
  'geneva': {
    name: 'Geneva',
    region: 'Lake Geneva, Switzerland',
    tagline: 'The most international city in Switzerland — shaped by diplomacy, defined by the lake.',
    description: 'Geneva\'s character is inseparable from its international function. The United Nations European headquarters, the Red Cross, and over 200 international organisations have created a city that runs on discretion, precision, and the expectation of quality.\n\nLake Geneva — one of the largest lakes in Western Europe — dominates the geography. The Jet d\'Eau marks the skyline. The Jura mountains frame the north shore. The old town climbs steeply above the lake on the south bank, compact and walkable, with the St. Pierre Cathedral at its peak.',
    atmosphere: 'Geneva operates at a slower, more deliberate register than Zurich. It is more diplomatic in pace, more international in composition, and more connected to the landscape — the lake is present in the city in a way that makes outdoor life central.\n\nTravelers who want energy and urban texture tend to prefer Zurich. Those who want calm, high-level service, and a city that does not impose itself tend to prefer Geneva.\n\nBusiness travelers with connections to international institutions find Geneva has no equivalent in Switzerland.',
    hotelScene: 'Geneva\'s luxury hotels split clearly between two positions.\n\nThe city-centre lakefront hotels — Four Seasons Hotel des Bergues, Beau-Rivage, Mandarin Oriental, The Woodward — sit on or near the lake in the heart of the city. All are within walking distance of the old town, the Jet d\'Eau, and the main commercial streets. These suit travelers who want to move through the city on foot.\n\nLa Réserve Genève is a different proposition entirely: a resort hotel set within a private park on the lake shore around 5km from the centre. The appeal is seclusion, a large spa, and a stay that does not require engaging with the city at all. It suits travelers who want the Geneva address without the urban context.',
    highlights: ['Lake Geneva — one of Western Europe\'s largest lakes', 'Jet d\'Eau — the city\'s most recognisable landmark', 'Compact old town with St. Pierre Cathedral', 'UN, Red Cross, WHO — major international institutions', 'Direct access to the French Alps and Swiss Riviera'],
    bestFor: ['Business travelers connected to international institutions', 'Couples combining lakeside luxury with mountain access', 'Travelers en route to Verbier, Chamonix, or Montreux', 'Those who prefer calm, professional service over urban energy'],
    image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1600',
    seasonal: 'Geneva works year-round. Spring brings mild temperatures and the lakefront gardens at their best.\n\nSummer is peak season for lake activities and terrace dining. Autumn is clear and pleasant, with the Lavaux grape harvest visible nearby. December brings Christmas markets around the old town.\n\nUnlike resort destinations, Geneva never fully closes — its international function keeps demand and hotel quality steady throughout the year.',
    comparison: 'Against Zurich, Geneva is softer, more international, and more connected to the lake. Zurich has more energy, a stronger restaurant culture, and better connections to the eastern Alps.\n\nAgainst Lausanne and Montreux along the same lake shore, Geneva is more urban and international; the others are more relaxed and resort-oriented.\n\nGeneva suits travelers whose purposes connect to international organisations, or who want the most efficient entry point for the western Swiss Alps.',
    gettingThere: 'Geneva Airport is one of Switzerland\'s two main international hubs. The airport is unusually close to the city — around 6 minutes by train to the main station.\n\nFor ski access: Verbier is around 2 hours by road or train-and-transfer. Chamonix is approximately 1.5 hours by car. Crans-Montana around 2 hours.\n\nMontreux is 1 hour 10 minutes by train along the lake shore.',
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
      { q: 'Should I stay at La Réserve Genève or a city-centre hotel?', a: 'La Réserve suits travelers who want a resort experience — private park, large spa, seclusion, Michelin dining — without needing the city on their doorstep. The city-centre hotels — Four Seasons des Bergues, Beau-Rivage, Mandarin Oriental — suit travelers who want to walk to the old town, the Jet d\'Eau, and the main streets immediately from their hotel. Both are on the lake; the difference is urban access versus resort privacy.' },
      { q: 'How many nights does Geneva need?', a: 'Two nights covers the old town, lakefront, and main museums comfortably. Three nights allows a day trip to Montreux and the Château de Chillon, or a ski day in Verbier or Chamonix. Geneva works well as a standalone short break or as part of a wider Lake Geneva or Alpine itinerary.' },
      { q: 'Is Geneva practical as a base for skiing?', a: 'Yes — Geneva Airport is one of the most efficient entry points for western Swiss and French Alpine skiing. Verbier is around 2 hours by road or train. Chamonix is approximately 1.5 hours by car. Many ski travelers use Geneva as their arrival point even when staying in the mountains.' },
    ],
  },
  'st-moritz': {
    name: 'St. Moritz',
    region: 'Engadin Valley, Graubünden',
    tagline: 'The original luxury ski resort — and still the most self-assured.',
    description: 'St. Moritz invented the concept of the Alpine winter holiday. In 1864, hotelier Johannes Badrutt bet his English summer guests they would enjoy the winter — they did, and a global industry followed.\n\nThat origin story still shapes the resort\'s identity. Set at 1,800m in the Upper Engadin valley, with a frozen lake at its centre and the Bernina peaks above, St. Moritz combines serious skiing with a winter social calendar — polo on the frozen lake, White Turf horse racing in February, the Cresta Run — that has no equivalent in the Alps.',
    atmosphere: 'St. Moritz is more destination than mountain. Guests come for the season as much as the skiing — the off-slope programme, the grand hotels, the social calendar, and the particular self-confidence of a resort that has been at the centre of international luxury travel for 160 years.\n\nIt suits travelers who want the full grand Alpine hotel experience and a winter that extends well beyond skiing. Those who want the mountain to be the only focus tend to prefer Zermatt.',
    hotelScene: 'Badrutt\'s Palace Hotel is the most iconic address — open since 1896, directly above the frozen lake, with a skiing history inseparable from the resort itself.\n\nKulm Hotel St. Moritz — the oldest hotel in the resort, open since 1856 — offers a slightly more residential, understated atmosphere while maintaining comparable quality.\n\nCarlton Hotel suits travelers who want a more intimate, contemporary luxury experience without the grand hotel scale of the Palace or Kulm.',
    highlights: ['Legendary skiing across Corviglia, Corvatsch and Diavolezza', 'Frozen lake events — polo and White Turf horse racing in February', 'The Cresta Run — one of the world\'s oldest toboggan tracks', 'Grand hotels with over a century of continuous operation', 'Engadin valley sunshine record — notably bright in winter'],
    bestFor: ['Travelers who want the full grand Alpine hotel experience', 'Those who value the social winter season as much as skiing', 'Ultra-luxury travelers for whom history and prestige matter', 'Skiers who want variety across multiple connected ski areas'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'The main season runs December to late March, with February the peak month for the frozen lake events.\n\nThe Engadin valley is notably sunny in winter — a quality that distinguishes it from more enclosed Alpine valleys. Summer from June to September offers hiking, sailing on the lake, golf, and the Engadin music festival. Most hotels close in the shoulder months.',
    comparison: 'Against Zermatt, St. Moritz is more social and event-driven. Zermatt is more focused on the mountain itself; St. Moritz is more focused on the season as a whole.\n\nAgainst Gstaad, St. Moritz is louder and more theatrical; Gstaad is more discreet. St. Moritz announces itself; Gstaad withholds.\n\nAgainst Verbier, St. Moritz is more traditional and grand hotel-oriented; Verbier is more energetic and skiing-driven.',
    gettingThere: 'From Zurich, the direct train via Chur takes around 3.5 hours.\n\nThe Glacier Express from Zermatt to St. Moritz — around 8 hours — is one of the world\'s most celebrated scenic rail journeys and worth doing at least once.\n\nThe nearest international airport is Zurich. Private helicopter transfers are available for those arriving by private aviation.',
    bestPages: [
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [],
    faqs: [
      { q: 'Badrutt\'s Palace or Kulm Hotel — which suits me better?', a: 'Badrutt\'s Palace is the more theatrical choice — larger, more central to the resort\'s social scene, and carrying the strongest name recognition. Kulm Hotel is slightly more residential and understated, preferred by guests who want grand hotel quality without the social centre-stage position. Both are among the finest hotels in the resort; the choice is one of atmosphere rather than quality.' },
      { q: 'When are the frozen lake events in St. Moritz?', a: 'The main frozen lake events run in February — White Turf horse racing on the frozen lake typically takes place across three Sundays in February, and snow polo usually follows a similar schedule. Exact dates vary by year. January brings the Cresta Run and bobsled competitions. The full winter event calendar is the reason February is the peak month for hotel rates.' },
      { q: 'Is St. Moritz worth visiting in summer?', a: 'Yes — the Engadin valley is genuinely beautiful in summer, with hiking, sailing, golf, and the summer festival season. The landscape is different from winter but equally compelling. Summer rates are significantly lower than peak ski season, and the resort is considerably less crowded. The quality of the hotels and restaurants remains consistent year-round.' },
    ],
  },
  'interlaken': {
    name: 'Interlaken',
    region: 'Bern Oberland, Switzerland',
    tagline: 'Between two lakes, beneath three peaks.',
    description: 'Interlaken sits on a narrow strip of land between Lake Thun and Lake Brienz, with the Eiger, Mönch, and Jungfrau rising directly to the south.\n\nWhat distinguishes it from other Swiss resort towns is the combination of grand hotel heritage and genuine outdoor access. The Victoria-Jungfrau has been operating since 1865. Within thirty minutes, you can be at the base of one of the most famous mountain faces in the Alps.',
    atmosphere: 'Interlaken has two layers that don\'t always overlap. The town centre attracts a high volume of day tourists and adventure sports operators — paragliding, skydiving, canyon jumping. The grand hotel zone around the Höhematte meadow operates at a different register: quieter, more residential, and better suited to luxury travelers.\n\nThe Victoria-Jungfrau anchors this upper layer of the destination. Guests who stay there experience a different Interlaken from those passing through on group tours.',
    hotelScene: 'Victoria-Jungfrau Grand Hotel & Spa is the dominant address — a Belle Époque grand hotel open since 1865 with direct Jungfrau views, one of the larger hotel spas in Switzerland, and a Michelin-starred restaurant.\n\nLindner Grand Hotel Beau Rivage offers a quieter alternative on Lake Thun, better for travelers who want lake views and a less central position.\n\nGrand Hotel Regina in nearby Grindelwald suits travelers who want to be closer to the ski area and Jungfrau hiking rather than in the valley town.',
    highlights: ['Direct views of the Eiger, Mönch and Jungfrau', 'Gateway to Jungfraujoch and the Jungfrau ski region', 'Lake Thun and Lake Brienz on either side of the town', 'Grand hotel heritage since the 19th century', 'Access to car-free villages Wengen and Mürren'],
    bestFor: ['Families combining luxury with outdoor access', 'Couples seeking dramatic scenery without a ski-only focus', 'Wellness travelers at Victoria-Jungfrau\'s spa', 'Travelers exploring the wider Bernese Oberland'],
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600',
    seasonal: 'Summer — June to September — is Interlaken at its best. Hiking trails open fully, the lakes warm for swimming, and the mountain views are sharpest in early morning light.\n\nWinter brings skiing access via Grindelwald and Wengen, though Interlaken itself sits at low altitude and rarely gets snow in the town. Autumn is underrated — October valley light is exceptional and visitor numbers drop significantly.',
    comparison: 'Against Zermatt or Verbier, Interlaken is not a ski resort in the same way — it is a valley base from which skiing is accessed by train or cable car rather than directly from the hotel. It suits travelers who want the Jungfrau region as a base for multiple activities rather than dedicated ski weeks.\n\nAgainst Lucerne, Interlaken is more outdoor-oriented and less culturally focused. Lucerne is the stronger city break; Interlaken is the stronger nature and activity base.',
    gettingThere: 'Around 2 hours from both Zurich and Geneva by direct train — one of Switzerland\'s most scenic rail routes. From Zurich the route passes through Bern and along Lake Thun. From Geneva it runs along Lake Geneva through Lausanne before climbing into the Bernese Oberland.\n\nFrom Interlaken, the Jungfrau railway connects to Grindelwald, Wengen, and Jungfraujoch.',
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
      { q: 'Is the Victoria-Jungfrau worth the premium over other Interlaken hotels?', a: 'For travelers who want a grand hotel experience in the Jungfrau region, yes — there is no comparable alternative in the same category in Interlaken itself. The spa scale, the Michelin-starred restaurant, and the Belle Époque setting are not replicated elsewhere in the town. For those who want lake views over Jungfrau views, Lindner Beau Rivage on Lake Thun offers a quieter alternative at a lower price point.' },
      { q: 'Should I stay in Interlaken or go up to Grindelwald or Wengen?', a: 'Interlaken suits travelers who want a valley base with easy train access to multiple areas — Grindelwald, Wengen, Lauterbrunnen, Thun, and Bern are all within 30-50 minutes. Grindelwald suits those who want to be directly at the ski area and Eiger hiking trails. Wengen suits those who want a car-free mountain village experience closer to the slopes.' },
      { q: 'Is Interlaken a good base for a non-skiing winter trip?', a: 'It works, but winter is the weakest season for non-skiers. The main draws — lake swimming, Jungfrau hiking, and outdoor activities — are reduced. The Victoria-Jungfrau stays open and the spa is a draw in itself, but travelers who want winter scenery without skiing are better served by Zermatt\'s car-free village atmosphere.' },
    ],
  },
  'zurich': {
    name: 'Zurich',
    region: 'Zurich, Switzerland',
    tagline: 'Switzerland\'s financial capital — and a better city break than most expect.',
    description: 'Zurich is consistently underestimated. Travelers who arrive expecting a dry financial hub tend to leave surprised by the lake, the quality of the restaurants, and the ease of the old town on foot.\n\nBahnhofstrasse — running from the main station to the lake — is one of Europe\'s most concentrated luxury shopping corridors. The Limmat divides the medieval centre into two halves: Grossmünster on the east bank, Lindenhügel and the Fraumünster on the west. Lake Zurich opens to the south, with Alpine views on clear days and a genuine swimming culture in summer.',
    atmosphere: 'Zurich suits travelers who want quality and efficiency without the diplomatic formality of Geneva or the resort atmosphere of the mountain destinations.\n\nThe city is compact enough to walk between most points of interest. The service culture is professional without being stiff. The restaurant scene has enough range — from Michelin level to neighbourhood casual — to sustain several evenings without repetition.\n\nIt is a city for people who like cities, rather than those who want a city as a backdrop to something else.',
    hotelScene: 'Zurich\'s luxury hotels concentrate in two areas.\n\nThe southern lakefront holds the strongest addresses: La Réserve Eden au Lac and Baur au Lac both have prime lake positions, within walking distance of Bahnhofstrasse. La Réserve suits design-conscious travelers who want a boutique lakeside experience — 40 rooms, Philippe Starck interiors, Michelin-starred dining. Baur au Lac suits those who want the most established grand hotel address in Zurich, with a lakeside park and traditional Swiss luxury.\n\nThe old town offers the Widder Hotel — nine interconnected medieval townhouses, better for travelers who want to be embedded in the historic centre rather than on the lake.\n\nThe Dolder Grand sits above the city on the Adlisberg hill. More resort than city hotel, it suits travelers who want panoramic views, a major spa, and proximity to the centre without being in it.',
    highlights: ['Bahnhofstrasse — concentrated luxury shopping from station to lake', 'Lake Zurich with Alpine views on clear days', 'Medieval old town on both banks of the Limmat', 'Kunsthaus Zurich — major permanent art collection', 'Strong and varied restaurant scene'],
    bestFor: ['Business travelers combining work with quality downtime', 'Couples on two to three night city breaks', 'Design and architecture enthusiasts', 'Travelers using Zurich as a hub for wider Swiss exploration'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600',
    seasonal: 'Late spring and early summer — May and June — are the strongest months: warm lake temperatures, outdoor dining on the Limmat, and the city at its most open.\n\nJuly and August bring lake swimming at the Seebad facilities along the shore. December delivers Christmas markets, particularly the one inside the main station.\n\nWinter is quieter but the opera season, gallery programme, and restaurant scene continue without interruption.',
    comparison: 'Against Geneva, Zurich is more energetic and more distinctly Swiss. Geneva has the diplomacy, the international institutions, and easier access to the French Alps; Zurich has more urban texture, a stronger local food culture, and better rail connections to the eastern Alps.\n\nAgainst Basel, Zurich is larger and more cosmopolitan; Basel is more culturally concentrated and better suited to art-focused travel.\n\nZurich is the stronger general Swiss city break; the others suit more specific travel purposes.',
    gettingThere: 'Zurich Airport is Switzerland\'s main international hub. The airport train reaches the main station in around 10 minutes.\n\nWithin Switzerland: Lucerne 50 minutes, Bern around 58 minutes, Basel around 58 minutes. For the Alps: Andermatt around 2 hours, Davos around 2.5 hours, St. Moritz around 3.5 hours.',
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
      { q: 'Which area of Zurich has the best luxury hotels?', a: 'The southern lakefront is the strongest area — La Réserve Eden au Lac and Baur au Lac both sit here, with lake views and walking distance to Bahnhofstrasse. The old town suits travelers who want to be in the medieval centre; the Widder Hotel is the best address there. The Dolder Grand is ideal for those who want a quieter, hillside resort base above the city with panoramic views.' },
      { q: 'How many nights does Zurich need?', a: 'Two nights is comfortable for a focused visit — the old town, lake promenade, Bahnhofstrasse, and Kunsthaus in one day, with the second day for a lake excursion or trip to Lucerne. Three nights allows a slower pace and a day trip to the Alps. More than three nights requires specific interests — gallery programme, culinary exploration, or surrounding day trips.' },
      { q: 'How far is Zurich from the main ski resorts?', a: 'Andermatt is around 2 hours by train — the most accessible ski destination from Zurich. Davos is around 2.5 hours. St. Moritz around 3.5 hours via Chur. For a non-skiing day trip, Mount Rigi and Mount Pilatus above Lake Lucerne are reachable in under an hour.' },
    ],
  },
  'gstaad': {
    name: 'Gstaad',
    region: 'Bernese Oberland, Swiss Alps',
    tagline: 'Discreet, exclusive, and entirely deliberate about both.',
    description: 'Gstaad has cultivated its reputation carefully. The village is small, the chalet architecture strictly enforced, and the atmosphere resolutely against anything that feels like mass tourism.\n\nThe result is a resort that has attracted a remarkably consistent clientele for over a century: old money, artists, and those wealthy enough to prefer anonymity to spectacle. The skiing across the Gstaad Mountain Rides area is real but secondary — Gstaad is more about the lifestyle than the pistes.',
    atmosphere: 'Where St. Moritz announces itself, Gstaad withholds. There is no social performance expected here, no frozen lake theatre, no celebrity-spotting infrastructure. The discretion is the point.\n\nIt suits travelers who want seclusion and Alpine village character at the highest level — guests who have been to St. Moritz and Verbier and want something quieter without sacrificing quality.',
    hotelScene: 'The Alpina Gstaad — opened in 2012 — is the stronger choice for contemporary design, exceptional dining across multiple restaurants, and a spa that operates at serious international standard.\n\nPalace Hotel Gstaad is the historic grand hotel anchor — open over a century, with fairy-tale architecture and a sense of Alpine continuity that no newer property can replicate. The choice between them is a choice between modern luxury and historic prestige.\n\nLe Grand Bellevue offers a design-forward boutique alternative. Ultima Gstaad is the most exclusive address in the village — a private residence-style hotel for travelers who want maximum privacy.',
    highlights: ['Strict chalet architecture — no high-rise buildings permitted', 'Gstaad Mountain Rides ski area across four valleys', 'Palace Hotel — one of Switzerland\'s most iconic properties', 'The Alpina Gstaad — leading contemporary luxury hotel', 'Menuhin Festival classical music each July'],
    bestFor: ['Ultra-luxury travelers who value privacy over social scene', 'Families with multigenerational grand hotel expectations', 'Travelers who have done St. Moritz and want something quieter', 'Summer visitors combining music, hiking, and wellness'],
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600',
    seasonal: 'December to April for skiing, with Christmas and New Year the most sought-after period — book Palace Hotel and The Alpina many months in advance.\n\nThe Menuhin Festival in July brings classical music of genuine international standing to the mountain setting, making summer a real alternative to winter for culturally oriented travelers.\n\nUnlike some Swiss resorts, Gstaad\'s summer season is well-established — the village operates year-round.',
    comparison: 'Against St. Moritz, Gstaad is quieter, more discreet, and less theatrical. St. Moritz has the events calendar and social energy; Gstaad has the village intimacy and privacy culture.\n\nAgainst Verbier, Gstaad is almost a different proposition entirely — Verbier is energetic and skiing-driven; Gstaad is lifestyle-oriented and unhurried.\n\nAgainst Zermatt, Gstaad lacks the mountain drama of the Matterhorn but compensates with village character and summer season depth.',
    gettingThere: 'The MOB Golden Pass train from Montreux is the most scenic route — around 2 hours through the Pays-d\'Enhaut.\n\nFrom Bern, the train via Zweisimmen takes around 1.5 hours. Geneva is around 2.5 hours by road or rail.\n\nThere is a small private airfield at Saanen, 3km from the village, used for private aviation.',
    bestPages: [
      { label: 'Best luxury hotels in Gstaad', href: '/best/luxury-hotels-gstaad' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'The Alpina Gstaad vs Palace Hotel Gstaad', href: '/compare/the-alpina-gstaad-vs-palace-hotel-gstaad' },
    ],
    faqs: [
      { q: 'The Alpina Gstaad or Palace Hotel — which is right for me?', a: 'The Alpina suits travelers who want contemporary design, serious multi-restaurant dining, and a spa operating at international standard. Palace Hotel suits those who want the historic grand hotel experience — the architecture, the long-established staff, the sense of continuity. Both are among Switzerland\'s finest; the choice is one of atmosphere rather than quality.' },
      { q: 'How exclusive is Gstaad really?', a: 'The exclusivity is structural rather than performed. Strict building regulations prevent overdevelopment. The village scale limits visitor numbers naturally. The discretion culture discourages social performance. Gstaad does not market itself heavily — its reputation has been maintained by word of mouth among a consistent clientele for over a century.' },
      { q: 'Is Gstaad worth visiting in summer?', a: 'Yes — the Menuhin Festival in July is a genuine cultural event, not a peripheral resort programme. Hiking across the four-valley area, golf, tennis, and the village atmosphere without ski-season crowds make summer a legitimate alternative. Several of the best restaurants and both flagship hotels operate year-round.' },
    ],
  },
  'lucerne': {
    name: 'Lucerne',
    region: 'Central Switzerland',
    tagline: 'The most immediately beautiful city in Switzerland.',
    description: 'Lucerne has a quality that very few cities possess: it looks exactly as good in person as in photographs. The Chapel Bridge crossing the Reuss, the medieval water tower, the painted facades of the old town, and the lake opening south towards the Alps compose a scene that has drawn travelers since the Grand Tour era.\n\nWhat makes it a luxury destination rather than merely a day-trip stop is the quality of its hotels and a classical music culture — centred on the KKL Luzern concert hall and the annual Lucerne Festival — that gives the city cultural substance beyond its scenery.',
    atmosphere: 'Lucerne is calmer than Zurich and less politically weighted than Bern. It is a city that functions well for travelers who want beauty, culture, and a comfortable base for wider Swiss exploration without the pace of a major commercial centre.\n\nThe tourist concentration in the old town can be high in summer — particularly around the Chapel Bridge on weekend afternoons. The best experience comes from staying long enough to move at a different rhythm from the day-trip crowds.',
    hotelScene: 'Mandarin Oriental Palace Luzern occupies one of the finest hotel buildings in Switzerland — a historic lakefront palace with Michelin-level dining and the service standards the brand is known for. It is the strongest choice for travelers who want the best available in Lucerne.\n\nHotel Schweizerhof Luzern offers a central old-town position with lake views — better for travelers who want to be in the medieval centre within walking distance of the Chapel Bridge.\n\nBürgenstock Resort sits above the lake on a clifftop position accessible by funicular — a resort-style stay with panoramic Alpine views, better for those who want landscape over city access.\n\nFor lakeside stays outside the city itself, Grand Hotel Vitznauerhof and Park Hotel Vitznau on the lake shore offer quieter alternatives with direct lake access.',
    highlights: ['Chapel Bridge — 14th-century covered wooden bridge', 'Lake Lucerne with direct Alpine backdrop', 'KKL Luzern — Frank Gehry-designed concert hall', 'Lucerne Festival — major classical music event August-September', 'Day trip access to Mount Rigi, Pilatus and Titlis'],
    bestFor: ['Couples combining culture and scenery', 'Classical music enthusiasts during the Lucerne Festival', 'Travelers using central Switzerland as a hub', 'Those who want city quality without urban intensity'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'Summer — June to September — is peak season. The lake is at its most vivid, the mountains are visible, and the Lucerne Festival (August-September) brings the city\'s cultural life to its highest point.\n\nSpring is underrated — the old town in April and May without summer crowds is one of Switzerland\'s quieter pleasures.\n\nWinter is quiet but not dead — the Christmas market on the lakefront is one of Switzerland\'s most atmospheric, and the opera and concert season continues through the cooler months.',
    comparison: 'Against Zurich, Lucerne is more scenic and less commercially driven. Zurich has more urban variety and restaurant depth; Lucerne has the lake, the old town, and a more immediately beautiful setting.\n\nAgainst Bern, Lucerne is more touristy but more dramatically positioned. Bern has more political and architectural authenticity; Lucerne has the lake and the Alpine backdrop.\n\nLucerne is the strongest Swiss city break for first-time visitors to the country — the combination of scenery, culture, and accessibility is unmatched.',
    gettingThere: 'Lucerne is 50 minutes from Zurich by direct train — one of Switzerland\'s most used rail connections.\n\nFrom Interlaken, around 2 hours via Bern or the scenic Brünig Pass route. From Geneva, around 3 hours.\n\nMount Rigi and Mount Pilatus are both accessible from Lucerne within an hour by boat and rack railway — making the city a practical base for Alpine day trips without overnight mountain stays.',
    bestPages: [
      { label: 'Best luxury hotels in Lucerne', href: '/best/luxury-hotels-lucerne' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Mandarin Oriental Palace vs Hotel Schweizerhof Luzern', href: '/compare/mandarin-oriental-palace-luzern-vs-hotel-schweizerhof-luzern' },
    ],
    faqs: [
      { q: 'Mandarin Oriental Palace or Hotel Schweizerhof — which is right for me?', a: 'Mandarin Oriental Palace suits travelers who want the finest available hotel in Lucerne — lakefront palace setting, Michelin-level dining, full luxury infrastructure. Hotel Schweizerhof suits those who want a central old-town position within immediate walking distance of the Chapel Bridge and the main streets, at a more accessible price point. Bürgenstock Resort suits travelers who want panoramic lake views and a resort atmosphere above the city.' },
      { q: 'Is Lucerne worth more than a day trip?', a: 'Yes — most travelers who visit as a day trip leave wishing they had stayed. The old town rewards slower exploration, the lake excursions are worthwhile, and the day trips to Rigi and Pilatus are better with an early morning start from a local hotel. Two nights is the practical minimum; three allows a day trip to one of the mountain peaks and a lake cruise.' },
      { q: 'When is the Lucerne Festival?', a: 'The main Lucerne Festival runs from mid-August to mid-September and is one of Europe\'s most serious classical music events — not a peripheral resort programme but a major international festival attracting leading orchestras and soloists. The Summer Festival is the largest; a smaller Piano Festival runs in November and a contemporary music festival in March.' },
    ],
  },
  'verbier': {
    name: 'Verbier',
    region: 'Valais, Swiss Alps',
    tagline: 'The most demanding ski resort in Switzerland — and one of the most energetic.',
    description: 'Verbier sits on a south-facing plateau at 1,500m above the Bagnes valley, part of the Four Valleys ski domain — one of the larger linked ski areas in the Alps. The resort built its reputation on off-piste terrain: the runs from Mont-Fort at 3,330m and the Tortin couloir attract serious freeride skiers from across Europe each winter. The village has grown around this skiing identity — the après-ski scene centred on Place Centrale is genuinely social, the accommodation has diversified into serious luxury, and the Verbier Festival each July brings world-class classical musicians to the mountain setting.',
    atmosphere: 'Verbier is the most energetic resort in Switzerland. It is younger in demographic than Gstaad or St. Moritz, louder in après-ski, and unambiguous about the skiing being the primary reason to be there. Travelers who want a quiet, discreet Alpine experience will be better served elsewhere. Verbier rewards those who want physical skiing — ideally at an advanced level — combined with good food, strong hotel infrastructure, and evenings that extend well past dinner. It is not a resort for posing; the mountain earns the social energy around it.',
    hotelScene: 'W Verbier is the strongest luxury ski hotel — ski-in ski-out access, a destination spa, and a design sensibility that fits the resort\'s character. Chalet d\'Adrien offers a more traditional luxury chalet experience with exceptional food and a more personal atmosphere suited to those who want intimacy over scale. The Experimental Chalet brings a Paris-informed boutique approach. All three are in the village with access to the Medran lift station.',
    highlights: ['Four Valleys ski domain — one of the Alps\' larger linked areas', 'Mont-Fort at 3,330m for advanced and off-piste skiing', 'Verbier Festival — two weeks of classical music each July', 'Active après-ski centred on Place Centrale', 'South-facing plateau with strong winter sunshine'],
    bestFor: ['Advanced and serious skiers who also want luxury', 'Travelers who want energy and social atmosphere alongside mountain access', 'Groups and younger luxury travelers', 'Music enthusiasts visiting for the Verbier Festival in summer'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'December to April for skiing, with January to March the most reliable for snow conditions. The south-facing position brings good winter sunshine but can affect lower-slope conditions in late March. The Verbier Festival in July transforms the resort for two weeks — classical musicians of international standing perform in an extraordinary mountain context, and summer Verbier is worth considering for this alone. Outside festival period, summer is quieter but the hiking and mountain biking infrastructure is solid.',
    comparison: 'Verbier versus Zermatt: Verbier is more energetic, more social, and more focused on demanding skiing. Zermatt is more traditional, car-free, and defined by the Matterhorn. Zermatt suits those who want the mountain to feel like the main event at all times; Verbier suits those who want the skiing to be physically serious and the evenings to match. Verbier versus Gstaad: almost entirely different propositions — Gstaad is discreet and lifestyle-oriented; Verbier is active and skiing-driven. They attract different travelers and the overlap is minimal.',
    gettingThere: 'The most straightforward route is train to Le Châble in the Bagnes valley, then gondola directly to Verbier — from Geneva this takes around 2 hours total. A direct bus from Geneva Airport operates during ski season. From Zurich, allow around 3 hours with a connection in Martigny. By car, Le Châble is approximately 1.5 hours from Geneva via the A9 motorway through the Valais.',
    bestPages: [
      { label: 'Best luxury hotels in Verbier', href: '/best/luxury-hotels-verbier' },
      { label: 'Best ski hotels in Verbier', href: '/best/ski-hotels-verbier' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'W Verbier vs Chalet d\'Adrien', href: '/compare/w-verbier-vs-chalet-dadrien' },
    ],
    faqs: [
      { q: 'Is Verbier suitable for intermediate skiers?', a: 'The Four Valleys area has terrain for all levels, but Verbier\'s identity rests on advanced and off-piste skiing. Intermediate skiers will find enough variety, but those who want primarily groomed blue and red runs with less off-piste pressure will feel more at home in Crans-Montana or Zermatt. If you are a strong intermediate looking to progress, Verbier is one of the best environments in the Alps for that.' },
      { q: 'W Verbier or Chalet d\'Adrien — which is right for me?', a: 'W Verbier suits travelers who want a full-service luxury ski hotel with spa, ski-in ski-out, and a design energy that matches the resort. Chalet d\'Adrien suits those who prefer intimacy, exceptional food, and a more traditional chalet atmosphere. The W is better for groups and those who want a hotel with a social scene; Chalet d\'Adrien is better for couples and small groups who want something more personal.' },
      { q: 'What is the Verbier Festival?', a: 'The Verbier Festival is a two-week classical music festival held each July, bringing leading international soloists, conductors, and chamber musicians to the mountain setting. It is genuinely well-regarded in the classical music world — not a peripheral resort event but a serious festival that attracts a musically informed audience. The combination of setting and programme makes summer Verbier worth considering for those with an interest in classical music.' },
    ],
  },
  'davos': {
    name: 'Davos',
    region: 'Graubünden, Swiss Alps',
    tagline: 'Serious skiing, serious infrastructure — without the social performance.',
    description: 'Davos sits at around 1,560m in the Graubünden Alps, making it one of the higher-altitude resorts in Switzerland. The Parsenn ski area above the town is one of the most extensive in the country, with runs descending to Klosters through varied terrain.\n\nTwo things shape the resort\'s identity: the skiing, and the World Economic Forum, which has met here annually since 1971. For travelers who are not WEF delegates, the WEF effect works in their favour — the hotels are calibrated for demanding international guests, and the infrastructure is maintained at a high standard year-round.',
    atmosphere: 'Davos is functional in a way that Gstaad and St. Moritz are not. It does not perform exclusivity — it delivers infrastructure and ski access without the social overlay that defines some other Alpine destinations.\n\nThis suits a specific type of traveler: serious about skiing, not interested in being seen, and wanting a resort that works efficiently. Those who want village intimacy tend to prefer Klosters, 10 minutes away by train.',
    hotelScene: 'Alpengold Hotel is the strongest luxury choice — a 5-star property with a distinctive organic architecture, a large spa, multiple restaurants, and direct Parsenn ski access. The design sets it apart from traditional Alpine grand hotels.\n\nSteigenberger Grandhotel Belvédère has been operating since 1875 and maintains a classical grand hotel atmosphere — better for travelers who want historic continuity over contemporary design.\n\nHard Rock Hotel Davos offers a more accessible entry point with a stronger entertainment orientation.',
    highlights: ['Parsenn ski area — one of the largest linked ski areas in Switzerland', 'Connection to Klosters via the Parsenn lifts', 'Strong congress and business infrastructure', 'Davos Lake for summer activities', 'Well-developed hiking and biking trails in summer'],
    bestFor: ['Serious skiers who want luxury without the social scene', 'Business and congress travelers', 'Families wanting a spacious, well-equipped resort', 'Travelers who prefer Graubünden\'s quieter character'],
    image: 'https://images.unsplash.com/photo-1526925528837-813a7961f5c7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seasonal: 'December to March for skiing, with January dominated by the World Economic Forum — rates increase significantly and some areas are restricted. Avoid late January unless attending.\n\nFebruary and March offer the best combination of snow reliability and normal resort atmosphere.\n\nSummer is underrated: the Davos Lake, hiking trails through the Flüela and Dischma valleys, and mountain biking routes are genuinely good. The hotels are quieter and rates are lower.',
    comparison: 'Against St. Moritz, Davos is more functional and less social. St. Moritz has the grand winter season theatre; Davos has more ski terrain and less social obligation.\n\nAgainst Klosters, Davos is larger and better equipped for longer stays; Klosters is smaller, quieter, and more discreet. They share the same ski area and are 10 minutes apart by train — some travelers stay in Klosters and ski into Davos.\n\nAgainst Zermatt, Davos is less iconic but more extensive. The Parsenn area is one of Switzerland\'s largest; Zermatt has the Matterhorn.',
    gettingThere: 'From Zurich, around 2.5 hours by train via Landquart. From Chur, around 1 hour by direct train.\n\nThe nearest international airport is Zurich. Davos is not on the main Glacier Express route but connects to the broader Graubünden rail network.',
    bestPages: [
      { label: 'Best luxury hotels in Davos', href: '/best/luxury-hotels-davos' },
      { label: 'Best ski hotels in Davos', href: '/best/ski-hotels-davos' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Alpengold Hotel vs Steigenberger Grandhotel Belvédère', href: '/compare/alpengold-hotel-vs-steigenberger-grandhotel-belvedere' },
    ],
    faqs: [
      { q: 'Alpengold Hotel or Steigenberger Belvédère — which suits me better?', a: 'Alpengold suits travelers who want contemporary design, a strong spa, and direct ski access in a property that feels genuinely of its environment. Steigenberger Belvédère suits those who want classical grand hotel atmosphere and historic continuity — it has been operating since 1875. Both have direct or near-direct Parsenn access; the choice is one of design philosophy.' },
      { q: 'Should I stay in Davos or Klosters?', a: 'Davos is larger, better equipped for longer stays, and has more restaurant and facility variety. Klosters is smaller, quieter, and more discreet — traditionally preferred by guests who want a chalet-village atmosphere and privacy. They share the same ski area and are 10 minutes apart by train. Klosters suits short ski breaks; Davos suits longer stays requiring more infrastructure.' },
      { q: 'When should I avoid Davos?', a: 'Late January during the World Economic Forum is not ideal unless you are attending — security is extensive, rates peak significantly, and some areas are restricted. The weeks immediately before (early January) and after (February) offer the same skiing with a considerably more relaxed atmosphere.' },
    ],
  },
  'crans-montana': {
    name: 'Crans-Montana',
    region: 'Valais, Swiss Alps',
    tagline: 'The sunniest plateau in the Swiss Alps — with a panorama that covers the entire Valais.',
    description: 'Crans-Montana sits on a broad south-facing plateau at 1,500m above the Rhône Valley. The view from almost anywhere in the resort stretches from Mont Blanc in the west to the Matterhorn in the east — a panorama that is more accessible and wider than what most enclosed Alpine valleys offer.\n\nTwo villages merge across the plateau: Crans to the west, more commercial with luxury boutiques and the main hotels; Montana to the east, more residential. The skiing covers 140km of pistes at varied levels, and the Omega European Masters golf tournament each September confirms the resort takes its summer season as seriously as winter.',
    atmosphere: 'Crans-Montana is less intense than Verbier and less socially theatrical than St. Moritz. The sunny plateau creates a different energy from enclosed valley resorts — more open, more relaxed, with the panorama always present.\n\nIt suits travelers who want a serious ski resort with strong sunshine, good wellness facilities, and a setting that works equally for non-skiers. The golf course and Six Senses presence give it a genuine summer and wellness identity that many ski resorts lack.',
    hotelScene: 'Crans Ambassador is the leading luxury ski hotel — ski-in ski-out at 1,500m, with a large spa and three restaurants. It suits travelers who want direct slope access and a full-service property.\n\nSix Senses Crans-Montana takes a different approach: wellness-first, with the Six Senses health programming in an Alpine ski setting. It suits travelers for whom the spa and wellness programme are as important as the skiing.\n\nLeCrans Hotel & Spa offers a more intimate boutique alternative with strong food and chalet character.',
    highlights: ['Panoramic views from Mont Blanc to the Matterhorn', 'South-facing plateau with strong winter sunshine', '140km of ski pistes across varied terrain', 'Omega European Masters golf course', 'Six Senses Crans-Montana — wellness-first luxury hotel'],
    bestFor: ['Skiers who want sunshine and panoramic scenery alongside serious slopes', 'Wellness travelers at Six Senses or Crans Ambassador', 'Golf travelers visiting for the European Masters course', 'Couples who want Alpine luxury without a purely skiing-focused resort'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    seasonal: 'December to April for skiing, with January and February the most reliable for snow. The south-facing position brings excellent sunshine but can affect lower-slope conditions in late March.\n\nSeptember is the Omega European Masters golf month — the resort takes on a different character and fills with a specifically golfing audience.\n\nSummer from June to August offers hiking, mountain biking, and the golf course at its best, with the Valais panorama arguably more impressive without snow.',
    comparison: 'Against Zermatt, Crans-Montana is sunnier, more open, and better suited to mixed groups of skiers and non-skiers. Zermatt is higher, car-free, and defined by the Matterhorn — a more intense and singular destination.\n\nAgainst Verbier, Crans-Montana is more relaxed and better for intermediate skiers; Verbier is more demanding and energetic.\n\nAgainst Davos, Crans-Montana has better sunshine and views; Davos has more ski terrain and stronger congress infrastructure.',
    gettingThere: 'The most scenic route is train to Sierre in the Rhône Valley, then the funicular directly up to Montana — around 2 hours from Geneva, 2.5 hours from Zurich.\n\nA direct bus service from Geneva Airport operates during ski season. By car, Sierre is reached via the A9 motorway through the Valais.',
    bestPages: [
      { label: 'Best luxury hotels in Crans-Montana', href: '/best/luxury-hotels-crans-montana' },
      { label: 'Best ski hotels in Crans-Montana', href: '/best/ski-hotels-crans-montana' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Crans Ambassador vs Hotel Guarda Golf', href: '/compare/crans-ambassador-vs-hotel-guarda-golf-crans-montana' },
    ],
    faqs: [
      { q: 'Crans Ambassador or Six Senses — which is right for me?', a: 'Crans Ambassador suits travelers for whom ski access and a full-service Alpine hotel are the priorities — ski-in ski-out, large spa, three restaurants, traditional luxury positioning. Six Senses suits travelers for whom wellness programming is the primary draw — the Six Senses health approach in an Alpine ski setting is a genuinely distinctive combination.' },
      { q: 'Is Crans-Montana suitable for mixed groups of skiers and non-skiers?', a: 'Yes — the plateau position, the sunshine, the spa hotels, and the walkable resort make it one of Switzerland\'s more versatile destinations for mixed groups. Non-skiers can access the panoramic views from 1,500m without taking lifts, walk across the plateau, and use spa facilities independently of the ski programme.' },
      { q: 'How does Crans-Montana compare to Verbier for skiing?', a: 'Crans-Montana is better for intermediate skiers and those who want sunshine and open terrain. Verbier is better for advanced and off-piste skiers who want more demanding terrain and a more energetic resort atmosphere. The two resorts attract noticeably different skiing profiles.' },
    ],
  },
  'flims': {
    name: 'Flims',
    region: 'Graubünden, Switzerland',
    tagline: 'Ancient forest, a turquoise lake, and a gorge that earns the comparison.',
    description: 'Flims sits above the Rhine valley in Graubünden, part of the Weisse Arena ski domain that links with Laax and Falera across 224km of pistes.\n\nWhat distinguishes it from other Swiss ski destinations is the landscape surrounding the resort. The Caumasee — a glacial lake with an implausible turquoise colour — sits within ancient forest about 20 minutes on foot from the village. The Ruinaulta Rhine Gorge, carved through prehistoric landslide debris over thousands of years, runs along the valley below.',
    atmosphere: 'Flims is less socially prominent than Zermatt, St. Moritz, or Gstaad — which is precisely its appeal for certain travelers. The atmosphere is relaxed, the landscape more dramatically natural, and the resort has a quieter character that suits those who want mountain quality without social performance.\n\nLaax, connected to Flims in the same ski domain, has a younger and more snowboard-oriented energy — the two villages attract different guests despite sharing the same lifts.',
    hotelScene: 'Hotel Adula is the leading luxury property — a 4-star superior hotel at 1,100m with indoor pool, spa, three restaurants, and direct access to both the ski area and the forest trails to the Caumasee. It is the main reason Flims functions as a genuine luxury destination rather than simply a scenic one.\n\nThe Hide Flims offers a more private boutique experience — smaller, quieter, suited to travelers who want maximum seclusion.\n\nParkhotel Waldhaus Flims is a long-established property set within its own park above the village, better for travelers who want a traditional grand hotel atmosphere.',
    highlights: ['Caumasee — glacial turquoise lake within ancient forest', 'Ruinaulta Rhine Gorge — dramatic natural canyon below the village', 'Weisse Arena ski domain — 224km linking Flims, Laax and Falera', 'Laax — leading European freestyle and snowboard resort', 'Romansh cultural heritage in the surrounding villages'],
    bestFor: ['Nature travelers who want landscape as the primary experience', 'Skiers and snowboarders seeking terrain variety', 'Wellness travelers drawn to forest and lake settings', 'Those who want Graubünden\'s quieter character'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600',
    seasonal: 'December to April for skiing — the linked domain offers reliable snow across a good elevation range.\n\nSummer from June to September is when the landscape is most accessible: the Caumasee reaches swimmable temperatures, the Rhine Gorge walks open fully, and the ancient forest trails are at their most atmospheric.\n\nEarly autumn — September and October — is genuinely underrated. The deciduous forest turns colour, crowds thin, and the gorge light is exceptional.',
    comparison: 'Against Davos, Flims-Laax has a smaller ski area but stronger snowboard and freestyle terrain. Davos-Parsenn is more extensive for traditional Alpine skiing; Flims-Laax is better for varied terrain and a more relaxed resort atmosphere.\n\nAgainst Andermatt, Flims has more established infrastructure and a stronger natural landscape identity. Andermatt has higher-altitude skiing and The Chedi as a flagship luxury property.\n\nFlims is the right choice for travelers who prioritise natural setting and a non-social resort atmosphere over prestige or social scene.',
    gettingThere: 'From Zurich, around 2 hours by train to Chur, then connecting bus or taxi to Flims — around 30 minutes from Chur.\n\nThe Chur-Disentis railway also runs through the Ruinaulta Rhine Gorge below the village, making the journey itself worth taking for the scenery.',
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
      { q: 'Hotel Adula or Parkhotel Waldhaus — which suits me better?', a: 'Hotel Adula suits travelers who want a modern spa property with direct access to the Caumasee trails and ski area — it is the stronger choice for active stays combining skiing or hiking with wellness. Parkhotel Waldhaus suits those who want a more traditional grand hotel atmosphere set within its own park grounds.' },
      { q: 'What is the Caumasee and is it worth visiting?', a: 'The Caumasee is a small glacial lake above Flims, its water a distinctive turquoise from mineral sediment. It sits within ancient forest about 20 minutes on foot from the village and is swimmable in summer. It is one of the more photographed natural sites in Graubünden and genuinely worth the walk regardless of season.' },
      { q: 'Is Flims or Laax better for a luxury stay?', a: 'Flims has the stronger luxury hotel infrastructure — Hotel Adula and Parkhotel Waldhaus are both here. Laax has a younger, more snowboard-focused energy and the ROCKS hotel for design-conscious travelers. For a traditional luxury ski and wellness stay, Flims is the better base; for a more contemporary snowboard-culture experience, Laax.' },
    ],
  },
  'bern': {
    name: 'Bern',
    region: 'Bern, Switzerland',
    tagline: 'Switzerland\'s capital — unhurried, underrated, genuinely Swiss.',
    description: 'Bern is the most underestimated city in Switzerland. While Zurich and Geneva compete for international attention, the federal capital goes about its business with a quiet confidence that rewards travelers willing to look past the obvious Swiss itinerary.\n\nThe UNESCO-listed old town occupies a peninsula above a dramatic bend in the Aare river — 6 kilometres of medieval arcades, sandstone fountains, and clock towers that have remained largely unchanged since the 15th century. The Federal Palace sits at the heart of the city, and the atmosphere carries the weight of a place where decisions are made.',
    atmosphere: 'Bern operates at a different pace to Zurich or Geneva. It is more residential, more local, and more genuinely Swiss in character — less internationalised than Geneva, less financially driven than Zurich.\n\nFor luxury travelers, this translates into a city break that feels less performative and more authentic. The restaurants are good without being status-driven. The hotels are serious without competing for attention. It suits travelers who want to understand Switzerland rather than simply pass through it.',
    hotelScene: 'The luxury hotel options in Bern are deliberately limited — two properties of real note.\n\nBellevue Palace is the definitive address: directly opposite the Federal Palace, with views over the Aare gorge and the Alps beyond. It has served as Switzerland\'s official state guesthouse since 1913. The political weight is tangible — every significant figure who has passed through the Swiss capital has stayed here.\n\nHotel Schweizerhof Bern offers a central old-town position with strong dining and a slightly less formal atmosphere — better for travelers who want quality without the official gravitas of the Palace.',
    highlights: ['UNESCO World Heritage old town with 6km of medieval arcades', 'Federal Palace — seat of Swiss government', 'Aare river panorama from the Rose Garden', 'Bellevue Palace — Switzerland\'s official state guesthouse', 'Zentrum Paul Klee — major dedicated museum'],
    bestFor: ['Travelers who want genuine Swiss urban culture over resort atmosphere', 'Those combining business at federal institutions with quality stays', 'Couples seeking a city break without Zurich\'s pace', 'Culture travelers interested in Swiss political and architectural heritage'],
    image: 'https://plus.unsplash.com/premium_photo-1674297229805-e8a1877f9ca4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seasonal: 'Bern works year-round but is strongest in late spring and early summer. The Rose Garden above the Aare peaks in June. The arcaded streets are comfortable in any weather — a practical advantage over open-air city centres.\n\nThe Buskers street music festival in August is one of Europe\'s largest. The Christmas market on Waisenhausplatz is one of Switzerland\'s most genuinely local festive events.',
    comparison: 'Against Zurich, Bern is quieter, more political, and more distinctly Swiss. Zurich has more urban energy and restaurant variety; Bern has more architectural integrity and a slower pace that some travelers strongly prefer.\n\nAgainst Geneva, Bern is less international and less connected to outdoor access. Geneva suits travelers with international institutional connections; Bern suits those who want Swiss capital culture.\n\nBern is also the most central Swiss city — Zurich, Geneva, Basel, and Interlaken are all within an hour by train.',
    gettingThere: 'Bern\'s central position makes it one of Switzerland\'s most connected cities. Zurich is 58 minutes by direct train. Geneva is 1 hour 50 minutes. Basel is 58 minutes. Interlaken is around 50 minutes.\n\nBern Airport has limited direct international connections; most international travelers arrive via Zurich or Geneva.',
    bestPages: [
      { label: 'Best luxury hotels in Bern', href: '/best/luxury-hotels-bern' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Bellevue Palace vs Hotel Schweizerhof Bern', href: '/compare/bellevue-palace-vs-hotel-schweizerhof-bern' },
    ],
    faqs: [
      { q: 'Is Bellevue Palace worth the premium in Bern?', a: 'For travelers who want the full Swiss capital experience — the political setting, the Alpine views, the official guesthouse history — yes, without question. For travelers who primarily want a comfortable central base and good dining without the institutional weight, Hotel Schweizerhof Bern delivers comparable quality at a more accessible price point.' },
      { q: 'How many nights does Bern need?', a: 'Two nights is comfortable — the old town arcades, Federal Palace, Aare panorama from the Rose Garden, and the Kunstmuseum can be covered in one full day. A second day allows a half-day trip to Interlaken or a slower exploration of the city\'s museum quarter. Three nights suits travelers who want to use Bern as a base for the wider region.' },
      { q: 'Why visit Bern rather than Zurich or Geneva?', a: 'Bern offers something neither delivers: a genuinely Swiss urban experience that has not been heavily internationalised. The old town feels lived-in rather than curated for tourism. The pace is slower. The combination of medieval architecture, political history, and river scenery creates a character entirely its own.' },
    ],
  },
  'basel': {
    name: 'Basel',
    region: 'Basel-Stadt, Switzerland',
    tagline: 'Where three countries meet — and the art world arrives every June.',
    description: 'Basel sits at the exact point where Switzerland, Germany, and France converge on the Rhine. This tri-border position has historically made it a city of trade, ideas, and movement.\n\nWith over 40 museums for a population of around 180,000, Basel has one of the highest museum densities of any city in Europe. Art Basel — held each June — brings the global art market to Switzerland, filling the city\'s hotels and restaurants with collectors, gallerists, and cultural figures for one concentrated week.',
    atmosphere: 'Basel is the most culturally serious city in Switzerland. It does not have Zurich\'s financial energy or Geneva\'s international diplomacy — what it has is a depth of cultural infrastructure, a Rhine waterfront with genuine local life, and a Carnival tradition (Fasnacht) that is one of Europe\'s most distinctive.\n\nIt suits travelers who arrive with cultural intent. The Fondation Beyeler alone justifies a trip. Those who want urban energy or outdoor access tend to find Basel limited; those who want concentrated cultural depth find it delivers more than expected.',
    hotelScene: 'Les Trois Rois — The Three Kings — is Basel\'s only 5-star grand hotel. The building has hosted guests since 1681, occupying a prime position on the Rhine in the heart of the city. Its Michelin-starred restaurant, Rhine-facing rooms, and location make it the natural choice for luxury travelers. There is no comparable alternative in the same category in Basel.',
    highlights: ['Over 40 museums including the Kunstmuseum and Fondation Beyeler', 'Art Basel — major international art fair each June', 'Rhine waterfront and historic Grossbasel old town', 'Tri-border location — Switzerland, Germany and France', 'Fasnacht carnival — one of Europe\'s most distinctive cultural events'],
    bestFor: ['Art collectors and culture travelers, especially during Art Basel', 'Business travelers using Basel as a European hub', 'Those combining a city break with Alsace or the Black Forest', 'Travelers who want Swiss quality without a resort atmosphere'],
    image: 'https://images.unsplash.com/photo-1664459937096-d395cd77f8b8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seasonal: 'June is the peak month — Art Basel transforms the city and hotel rates reflect it. Book well in advance if visiting during the fair.\n\nFebruary brings Fasnacht — the Basel Carnival, beginning at precisely 4am on the Monday after Ash Wednesday, running for three days. It is one of Switzerland\'s most authentic local cultural events.\n\nThe rest of the year Basel operates quietly. Spring along the Rhine is pleasant. The Christmas market on Barfüsserplatz is among the country\'s best.',
    comparison: 'Against Zurich, Basel is more culturally concentrated and less commercially driven. Zurich is the stronger general city break; Basel suits travelers with specific cultural interests.\n\nAgainst Bern, Basel is more internationally connected and more art-focused; Bern is more politically resonant and architecturally intact.\n\nBasel\'s tri-border position makes it unique among Swiss cities — Strasbourg is 45 minutes by train, Freiburg im Breisgau 45 minutes, making it a natural base for exploring three countries.',
    gettingThere: 'EuroAirport Basel-Mulhouse-Freiburg serves the city with connections across Europe. By train: Zurich 58 minutes, Bern 58 minutes, Paris around 3 hours on the TGV.\n\nBasel is one of the easiest Swiss cities to reach from across Europe, and its rail connections make day trips to Strasbourg, the Black Forest, and Alsace straightforward.',
    bestPages: [
      { label: 'Best luxury hotels in Basel', href: '/best/luxury-hotels-basel' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
    ],
    compareLinks: [],
    faqs: [
      { q: 'Is Les Trois Rois the only serious luxury hotel in Basel?', a: 'At the 5-star grand hotel level, yes — there is no comparable alternative in Basel. Several strong 4-star properties exist, but Les Trois Rois is the only property in the city that operates at the level of Switzerland\'s leading luxury hotels. During Art Basel in June, it books out months in advance.' },
      { q: 'Is Basel worth visiting outside of Art Basel?', a: 'Yes — the Fondation Beyeler in nearby Riehen is one of Europe\'s finest private art museums and worth the trip independently. The Kunstmuseum Basel holds one of the world\'s oldest public art collections. The Rhine swimming culture in summer — locals float downstream using waterproof bags — gives the city a character unlike anywhere else in Switzerland.' },
      { q: 'How many nights does Basel need?', a: 'Two nights covers the main cultural sites comfortably — the Kunstmuseum, Fondation Beyeler (30 minutes by tram), the old town, and the Rhine waterfront. A third night suits travelers who want to make a day trip to Strasbourg or the Alsace wine route. Basel is also a practical overnight stop in a wider European itinerary.' },
    ],
  },
  'lugano': {
    name: 'Lugano',
    region: 'Ticino, Switzerland',
    tagline: 'Italian in language and temperament — Swiss in quality and infrastructure.',
    description: 'Lugano is the largest city in Ticino, Switzerland\'s Italian-speaking canton. The difference from the rest of Switzerland is immediate: street names, menus, and daily conversation are in Italian. The architecture shifts to terracotta and stone. The pace slows.\n\nLake Lugano runs along the north shore of the city. The Lungolago promenade — lined with palms — connects the old town to the residential neighbourhoods east and west. Monte San Salvatore and Monte Brè rise steeply on either side, accessible by funicular.',
    atmosphere: 'Lugano suits travelers who want warmth — literal and cultural — alongside Swiss infrastructure. It is less hectic than the Italian Lakes just across the border, but more relaxed than Zurich or Bern.\n\nThe financial sector gives the city a professional composure that prevents it from feeling purely touristic. The Piazza della Riforma in the old town is a genuine civic square with local life, not a performance for visitors.\n\nCouples who want a lakeside stay with Italian food and Swiss hotel standards tend to find it delivers on all counts — with the caveat that the season runs April through October.',
    hotelScene: 'Lugano\'s luxury hotels concentrate along the lakefront, but in different positions.\n\nGrand Hotel Villa Castagnola sits on a private estate east of the centre, with gardens descending to the water and Michelin-level dining. It suits travelers who want seclusion and a self-contained property — you can spend an entire stay without leaving the grounds.\n\nHotel Splendide Royal sits directly on the Lungolago promenade in the city centre, open since 1887. It suits travelers who want to walk to the old town piazzas and Bahnhofstrasse immediately.\n\nThe View Lugano takes a hillside position with panoramic lake views but less direct water access — better for views than lakeside living.',
    highlights: ['Lake Lugano — glacial blue-green lake between steep forested hills', 'Italian-speaking culture with Swiss infrastructure', 'Monte San Salvatore accessible by funicular from the centre', 'Easy access to Milan Malpensa and the Italian Lakes', 'Mild Mediterranean microclimate April through October'],
    bestFor: ['Couples wanting Mediterranean atmosphere with Swiss hotel standards', 'Travelers combining Lugano with Lake Como, Maggiore, or Milan', 'Business travelers in the Ticino financial sector', 'Those wanting warmth and lakeside luxury outside ski season'],
    image: 'https://images.unsplash.com/photo-1756755510958-9f02ec73445c?q=80&w=1674&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seasonal: 'April to October is the operative season. May and June offer the best combination of mild temperatures, flowering lakeside gardens, and manageable visitor numbers.\n\nJuly and August are warmest and busiest, with the Lugano Summer Festival running through both months. September is excellent — warm, quieter, with changing hillside colours.\n\nWinter is mild by Swiss standards but most of the outdoor and lakeside appeal is absent.',
    comparison: 'Against Ascona, Lugano is a functioning city with urban infrastructure, a financial quarter, and cultural institutions. Ascona is a small resort village — more exclusive, more holiday-focused, better for travelers who want to disappear into a beautiful setting.\n\nAgainst the Italian Lakes, Lugano has the advantage of Swiss transport reliability, hotel standards, and safety alongside an Italian cultural atmosphere. Many travelers combine both on the same trip — Milan Malpensa is around 1 hour by road.',
    gettingThere: 'From Zurich, the train takes around 2 hours 45 minutes through the Gotthard Base Tunnel — one of the world\'s longest rail tunnels. Milan Malpensa is approximately 1 hour by road.\n\nLugano Airport has limited direct connections; most international travelers arrive via Zurich or Milan.',
    bestPages: [
      { label: 'Best luxury hotels in Lugano', href: '/best/luxury-hotels-lugano' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Grand Hotel Villa Castagnola vs Hotel Splendide Royal', href: '/compare/grand-hotel-villa-castagnola-lugano-v2-vs-hotel-splendide-royal-lugano' },
    ],
    faqs: [
      { q: 'Villa Castagnola or Hotel Splendide Royal — which is the better choice?', a: 'Villa Castagnola suits travelers who want a self-contained estate — private gardens, lakefront access, Michelin dining, and seclusion from the city. Splendide Royal suits those who want to be on the Lungolago promenade with immediate access to the old town and piazzas. Both are historic lakefront properties; the choice is between estate privacy and central position.' },
      { q: 'How many nights does Lugano need?', a: 'Two nights is a practical minimum — the old town, Monte San Salvatore by funicular, and a lakeside evening. Three nights allows a day trip to Ascona, Lake Como, or Locarno. Lugano works well as part of a wider Ticino or northern Italy itinerary rather than as a standalone week-long destination.' },
      { q: 'Is Lugano worth visiting in winter?', a: 'Winter is the weakest season — most of the outdoor appeal depends on the lake, the promenade, and the gardens, all of which lose their draw in the cooler months. The city remains functional and some hotels stay open, but travelers who visit in winter should have specific reasons — business, the financial sector, or transit — rather than expecting the full Lugano experience.' },
    ],
  },
  'ascona': {
    name: 'Ascona',
    region: 'Ticino, Switzerland',
    tagline: 'The most intimate lakeside resort in Switzerland.',
    description: 'Ascona is a small village on the northern shore of Lake Maggiore — Italian in atmosphere, Swiss in infrastructure, and deliberately exclusive in character. The Piazza Motta runs directly along the lake with coloured facades, terrace restaurants, and palm trees, and it is one of the most beautiful public spaces in Switzerland.\n\nMonte Verità, the hill directly above the village, gives Ascona a cultural depth that most resort towns lack. From around 1900, a utopian artists\' colony established itself there — attracting figures including Hermann Hesse and Rudolf Laban. The site is now a hotel and cultural foundation.',
    atmosphere: 'Ascona is a destination for travelers who want to slow down completely. There is no skiing, no major congress infrastructure, and no urban energy — what there is is lake light, excellent food, and a particular quality of unhurried time.\n\nEden Roc and Castello del Sole understand their guests are not seeking activity but atmosphere. The resort is best suited to couples, honeymooners, and travelers who have been to busier destinations and want the opposite.',
    hotelScene: 'Eden Roc Ascona is the landmark property — a historic lakefront hotel that underwent major restoration, with multiple restaurants and a position directly on Lake Maggiore. It suits travelers who want the full lakefront grand hotel experience.\n\nCastello del Sole takes a different approach: a wine estate and beach hotel set within private grounds outside the village. Organic farming, a private beach, and serious dining make it the stronger choice for travelers who want seclusion and an estate experience over lakefront promenade life.\n\nGiardino Ascona offers a more intimate boutique alternative within the village.',
    highlights: ['Piazza Motta — one of Switzerland\'s most beautiful lakefront squares', 'Lake Maggiore with views towards the Italian shore', 'Eden Roc — major lakefront hotel after full restoration', 'Monte Verità — historic artists\' colony and cultural foundation', 'JazzAscona festival each June'],
    bestFor: ['Couples and honeymooners seeking Mediterranean seclusion', 'Wellness travelers who want calm over activity', 'Art and culture enthusiasts drawn to Monte Verità', 'Those wanting Ticino atmosphere in a more intimate setting than Lugano'],
    image: 'https://images.unsplash.com/photo-1717166149666-fbe4cd47bbfc?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seasonal: 'May to October is the operative season. July and August are warmest for lake swimming and outdoor dining. June brings JazzAscona — the village fills for several weeks with a music-focused audience.\n\nSeptember and October are excellent — the summer crowds thin, the lake remains warm enough for swimming, and the Ticino light takes on an autumn quality that makes it arguably the most beautiful period of the year.\n\nAscona largely closes in winter. Most hotels operate seasonally.',
    comparison: 'Against Lugano, Ascona is smaller, quieter, and more resort-focused. Lugano is a functioning city with urban infrastructure; Ascona is a village where the only agenda is the lake and the piazza.\n\nAgainst the Italian Lakes — Como, Maggiore\'s Italian shore — Ascona has Swiss hotel standards and infrastructure alongside the Mediterranean atmosphere. Many travelers combine Ascona with a day trip to Stresa or Bellagio on the same trip.\n\nAscona is not a destination for travelers who want activity variety — it is specifically for those who want to be in one beautiful place and stay there.',
    gettingThere: 'Train to Locarno from Zurich takes around 2.5 hours via the Gotthard Base Tunnel. Taxi from Locarno to Ascona is around 15 minutes.\n\nMilan Malpensa airport is approximately 1 hour by road — the most practical option for international travelers arriving by air. A seaplane service from Lugano operates seasonally.',
    bestPages: [
      { label: 'Best luxury hotels in Ascona', href: '/best/luxury-hotels-ascona' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best luxury hotels in Lugano', href: '/best/luxury-hotels-lugano' },
    ],
    compareLinks: [
      { label: 'Eden Roc Ascona vs Castello del Sole', href: '/compare/eden-roc-ascona-vs-castello-del-sole' },
    ],
    faqs: [
      { q: 'Eden Roc Ascona or Castello del Sole — which is right for me?', a: 'Eden Roc suits travelers who want the lakefront grand hotel experience — the Piazza Motta within walking distance, the lake immediately present, multiple restaurants, and the full hotel infrastructure. Castello del Sole suits those who want an estate experience: private grounds, organic farming, a private beach, and deliberate seclusion from the village. Both are exceptional; the choice is between urban lakefront and rural estate.' },
      { q: 'How many nights does Ascona need?', a: 'Three to five nights is the natural rhythm — Ascona is a destination for slowing down rather than a base for activity. The Piazza, Monte Verità, the lake, and a day trip to Locarno or the Italian side of Lake Maggiore covers the main draws. Shorter stays feel rushed; longer stays reward the pace the resort is designed for.' },
      { q: 'Is Ascona suitable for families?', a: 'Ascona suits families with older children who are comfortable with a quiet, lake-focused holiday. It is not a resort with extensive children\'s activity programming or adventure sports infrastructure. Families wanting active outdoor holidays are better served by Interlaken or Flims. Ascona is better suited to couples and adults who want calm over stimulation.' },
    ],
  },
  'andermatt': {
    name: 'Andermatt',
    region: 'Uri, Swiss Alps',
    tagline: 'The most significant transformation in Swiss Alpine tourism — still in progress.',
    description: 'Andermatt sits at the crossroads of four Alpine passes — Gotthard, Furka, Oberalp, and Susten — at around 1,440m in the Uri Alps. For most of the 20th century it functioned as a quiet military garrison town, largely overlooked by the luxury ski market.\n\nThe arrival of The Chedi Andermatt in 2013, followed by a broader resort development programme, changed that entirely. Today it offers world-class luxury infrastructure in a setting that has not yet been worn smooth by decades of mass tourism.',
    atmosphere: 'Andermatt\'s appeal is the combination of genuine quality and genuine discovery. The skiing is serious — high-alpine terrain with the Gemsstock peak at 2,963m — and The Chedi\'s spa infrastructure exceeds what many established resorts offer. Yet the resort still feels like something in formation rather than something completed.\n\nThis suits a specific traveler: someone who wants exceptional quality without the social scene of Gstaad or the mythological weight of St. Moritz. Those who want a destination with long-established prestige will find Andermatt\'s relative newness unsatisfying.',
    hotelScene: 'The Chedi Andermatt is the defining property — Asian-influenced design in an Alpine setting, multiple Michelin-recognised restaurants, a spa with an exceptionally long indoor pool, and ski-in ski-out access. It is one of the finest ski hotels in Switzerland by any measure.\n\nThe Radisson Blu Reussen offers a more accessible price point with strong facilities and a central village position — better for travelers who want the Andermatt experience at lower cost.\n\nThe resort development continues to add properties; the hotel offering will expand further in coming years.',
    highlights: ['SkiArena Andermatt-Sedrun — high-alpine skiing with Gemsstock at 2,963m', 'The Chedi Andermatt — flagship luxury hotel', 'Crossroads of four major Alpine passes', 'Less crowded than established resorts with equivalent facilities', 'Growing summer season with golf and music festival'],
    bestFor: ['Luxury travelers who want quality without established crowds', 'Serious skiers seeking high-alpine terrain with five-star comfort', 'Wellness travelers drawn to The Chedi\'s spa', 'Those who enjoy destinations still finding their final form'],
    image: 'https://images.unsplash.com/photo-1619893121368-c0fb48bcf172?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seasonal: 'December to April for skiing — the high-alpine terrain means reliable snow and serious skiing well into spring.\n\nSummer from June to October is increasingly worth considering: the Andermatt Music Festival, a golf course, and hiking across the pass landscapes offer genuine quality. The village is quieter in summer but the infrastructure supports year-round stays.',
    comparison: 'Against Zermatt and St. Moritz, Andermatt has less history and social cachet — but comparable or superior luxury infrastructure, less crowding, and more available accommodation at peak periods.\n\nAgainst Flims-Laax, Andermatt has higher-altitude skiing and The Chedi as a flagship anchor; Flims has stronger natural landscape identity and more established wellness infrastructure.\n\nAndermatt is the right choice for travelers who prioritise quality and space over prestige and tradition.',
    gettingThere: 'Around 1 hour 45 minutes from Zurich by train on the Matterhorn Gotthard Bahn via Göschenen. From Lucerne, around 1.5 hours.\n\nBy car, the Gotthard road tunnel connects Andermatt to both northern and southern Switzerland — around 2 hours from Zurich or Lugano.',
    bestPages: [
      { label: 'Best luxury hotels in Andermatt', href: '/best/luxury-hotels-andermatt' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'The Chedi Andermatt vs Radisson Blu Reussen', href: '/compare/the-chedi-andermatt-vs-radisson-blu-reussen-andermatt' },
    ],
    faqs: [
      { q: 'Is The Chedi Andermatt worth the premium?', a: 'For travelers who want one of Switzerland\'s finest ski hotel experiences, yes — the spa, the restaurants, and the ski access combination is difficult to match in the Alps. The premium reflects genuine quality rather than name alone. The Radisson Blu Reussen delivers a strong experience at a lower price point for travelers who want the Andermatt setting without The Chedi\'s rates.' },
      { q: 'How does Andermatt compare to Zermatt for a ski holiday?', a: 'Andermatt has high-alpine terrain and luxury infrastructure comparable to Zermatt, but without the Matterhorn or the 170-year grand hotel history. It is less crowded, easier to book at peak periods, and arguably better value at the luxury level. Zermatt suits travelers for whom the mountain identity and history are important; Andermatt suits those who prioritise the skiing and hotel quality over prestige.' },
      { q: 'What is the summer season like in Andermatt?', a: 'The summer season is growing but not yet as developed as the winter. The Andermatt Music Festival, a golf course, hiking across the pass landscapes, and the dramatic scenery of the Uri Alps make it worth considering. The Chedi stays open year-round and maintains its full quality in summer. Rates are lower than peak ski season.' },
    ],
  },
  'montreux': {
    name: 'Montreux',
    region: 'Vaud, Swiss Riviera',
    tagline: 'The Swiss Riviera at its most theatrical — jazz, a medieval castle, and palm trees.',
    description: 'Montreux curves around the eastern end of Lake Geneva in a microclimate mild enough for palm trees and magnolias at the lakefront. The Château de Chillon — a 12th-century island castle on a rocky outcrop just east of the town — has drawn travelers since the Grand Tour era, and Lord Byron\'s 1816 visit produced one of Romanticism\'s better-known poems. The Montreux Jazz Festival, founded in 1967, brings a cultural seriousness that most resort towns cannot claim: the festival has hosted Miles Davis, Nina Simone, and David Bowie on its lakeside stages, and the free concerts along the promenade run alongside the ticketed arena programme for two weeks each July.',
    atmosphere: 'Montreux is more relaxed and culturally oriented than Geneva, more resort-focused than Lausanne, and more accessible than the Alpine ski destinations. It suits travelers who want a lakeside stay with genuine cultural substance — not just scenery. The Fairmont Palace dominates the lakefront in a way that shapes the town\'s atmosphere: grand hotel culture is central here, and the promenade between the palace and the castle is one of the most pleasant walks in Switzerland. Outside of July, the town is quieter than its reputation suggests — a quality that some travelers find more appealing than the summer peak.',
    hotelScene: 'The Fairmont Le Montreux Palace is the defining address — directly on the lake, open since 1906, with 236 rooms and a history intertwined with the Jazz Festival. Le Mirador Resort & Spa takes a different position on Mont-Pèlerin above the town, offering a clifftop setting with panoramic lake and Alpine views, a major spa, and a more resort-style atmosphere removed from the lakefront. For travelers who want the town experience, the Palace is the obvious choice; for those who want views and a destination spa, Le Mirador offers something different.',
    highlights: ['Château de Chillon — 12th-century island castle on Lake Geneva', 'Montreux Jazz Festival — two weeks each July', 'Lakeside promenade with Mediterranean planting', 'Fairmont Le Montreux Palace — grand hotel since 1906', 'Lavaux UNESCO vineyard terraces visible across the lake'],
    bestFor: ['Music and culture travelers, especially during the Jazz Festival', 'Couples seeking a romantic lakeside stay without ski focus', 'Travelers combining the Swiss Riviera with Geneva and Lausanne', 'Those who want grand hotel history in a non-Alpine setting'],
    image: 'https://images.unsplash.com/photo-1684050879098-87151a1ded14?q=80&w=2068&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    seasonal: 'July is the peak month — the Jazz Festival fills the town for two weeks and the lake is at its warmest. April and May offer the best combination of the famous lakefront flower displays and manageable visitor numbers. Autumn is clear, the Lavaux grape harvest is visible across the water, and the town is noticeably quieter. Winter is mild and the Palace stays open, giving the town a peaceful off-season quality that rewards the few who visit.',
    comparison: 'Against Geneva, Montreux is more resort-oriented and culturally focused; Geneva is more urban, international, and business-driven. Against Lausanne, Montreux is more touristic and event-focused; Lausanne has more daily urban texture and the Olympic Museum. Against Alpine ski destinations, Montreux offers a completely different proposition — no skiing, but a lakeside grand hotel experience, cultural programming, and easy rail access to the rest of the lake. The two are not in competition; they suit different travel purposes entirely.',
    gettingThere: 'Montreux is 25 minutes from Lausanne by direct train and approximately 1 hour 10 minutes from Geneva. The lakeside rail route from Geneva — running along the north shore of Lake Geneva through the Lavaux UNESCO vineyard terraces — is one of Switzerland\'s most scenic journeys. From Zurich, the train via Bern takes around 2.5 hours. There is no practical airport closer than Geneva.',
    bestPages: [
      { label: 'Best luxury hotels in Montreux', href: '/best/luxury-hotels-montreux' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Fairmont Le Montreux Palace vs Le Mirador Resort', href: '/compare/fairmont-le-montreux-palace-vs-le-mirador-resort-mont-pelerin' },
    ],
    faqs: [
      { q: 'Fairmont Le Montreux Palace or Le Mirador — which should I choose?', a: 'The Palace suits travelers who want to be on the lakefront — steps from the promenade, the castle, and the Jazz Festival stages. Le Mirador suits those who want panoramic views over the lake from above, a major spa, and a more secluded resort atmosphere. They serve different travel moods rather than competing directly.' },
      { q: 'Is Montreux worth visiting outside the Jazz Festival?', a: 'Yes — the Château de Chillon alone justifies a visit, the lakeside promenade is beautiful in spring and autumn, and the town is more pleasant outside of the July crowds. The Fairmont Palace stays open year-round and the rail connections to Geneva, Lausanne, and Zermatt make it a practical base for wider exploration.' },
      { q: 'How does Montreux fit into a wider Lake Geneva itinerary?', a: 'Montreux works well as the eastern anchor of a Lake Geneva trip. Geneva is at the western end — 1 hour 10 minutes by train. Lausanne is 25 minutes from Montreux. The Lavaux vineyard terraces between Lausanne and Montreux are UNESCO-listed and accessible by train or on foot. The combination of Geneva, Lausanne, and Montreux covers the full range of what the north shore offers.' },
    ],
  },
  'lausanne': {
    name: 'Lausanne',
    region: 'Vaud, Swiss Riviera',
    tagline: 'The Olympic capital — cultured, steep, and overlooking Lake Geneva.',
    description: 'Lausanne sits on the steep northern shore of Lake Geneva, its streets climbing from the lakefront district of Ouchy up through the old town to the Gothic cathedral at the summit. It is Switzerland\'s fourth-largest city and carries a cultural seriousness that surprises first-time visitors: the International Olympic Committee has been based here since 1915, and the city has built an identity around sport, culture, and education that gives it more substance than its size suggests.\n\nThe lake view from almost anywhere in the city is exceptional — across to the French Alps, with the Dents du Midi and Mont Blanc visible on clear days.',
    atmosphere: 'Lausanne is more energetic than Montreux and more relaxed than Geneva. The student population from EPFL and the university gives the city a younger, more casual energy than Switzerland\'s financial centres. The old town around the cathedral is genuinely medieval — steep, cobbled, and compact. Ouchy on the lakefront has a promenade quality closer to a resort town than a city.\n\nIt suits travelers who want a Swiss city with cultural depth, lake access, and easy connections along the Riviera — without the formality of Geneva or the pure resort focus of Montreux.',
    hotelScene: 'Beau-Rivage Palace is the landmark luxury address — a grand hotel directly on the lake in Ouchy, open since 1861, with one of the finest spa facilities on Lake Geneva. It sits within its own park and has a self-contained resort quality despite being minutes from the city.\n\nLa Réserve Eden au Lac Lausanne offers a more contemporary boutique alternative. For travelers who want to be in the old town rather than on the lakefront, the Royal Savoy offers a hillside position with lake views and a more central access to the cathedral quarter.',
    highlights: ['Beau-Rivage Palace — landmark grand hotel on Lake Geneva since 1861', 'Olympic Museum — world-class sports history on the lakefront', 'Gothic cathedral — one of Switzerland\'s finest', 'Ouchy lakefront promenade', 'Lavaux UNESCO vineyard terraces immediately east of the city'],
    bestFor: ['Couples combining lakeside luxury with city culture', 'Travelers exploring the full Lake Geneva arc', 'Olympic and sports history enthusiasts', 'Those using Lausanne as a base between Geneva and Montreux'],
    image: 'https://images.unsplash.com/photo-1591378603223-e15b45a81640?w=1600&q=80',
    seasonal: 'Late spring and summer — May to September — are the strongest months. The lakefront is at its best, the Lavaux vineyards are vivid green, and the outdoor terrace culture at Ouchy is in full effect.\n\nThe Lausanne Festival in July brings outdoor events across the city. Autumn is excellent for the grape harvest in the Lavaux. Winter is quieter but the cathedral, museums, and restaurant scene continue year-round.',
    comparison: 'Against Geneva, Lausanne is smaller, less international, and more relaxed. Geneva has the UN, the diplomacy, and the international infrastructure; Lausanne has a more local Swiss character and a steeper, more dramatic urban landscape.\n\nAgainst Montreux, Lausanne is more urban and culturally varied; Montreux is more resort-focused and event-driven around the Jazz Festival. The two are 25 minutes apart by train and work well combined on the same trip.\n\nLausanne is the strongest mid-point on a Lake Geneva itinerary — between Geneva to the west and Montreux and the Château de Chillon to the east.',
    gettingThere: 'Lausanne is 35 minutes from Geneva by direct train and 25 minutes from Montreux. From Zurich, around 2 hours 20 minutes. The lakeside rail route is one of Switzerland\'s most scenic — running along the Lavaux vineyard terraces between Lausanne and Montreux.\n\nThe nearest international airport is Geneva. The Lausanne-Ouchy metro connects the main station to the lakefront in around 6 minutes.',
    bestPages: [
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    compareLinks: [],
    faqs: [
      { q: 'How does Lausanne compare to Geneva for a luxury stay?', a: 'Lausanne is more intimate, more local, and less formally international than Geneva. Geneva suits travelers with connections to international institutions or who want the most efficient Alpine access point. Lausanne suits those who want a Lake Geneva stay with genuine city culture, easier access to the Lavaux vineyards, and a slightly more relaxed atmosphere. The two are 35 minutes apart — many travelers combine both.' },
      { q: 'Is Beau-Rivage Palace the best hotel in Lausanne?', a: 'Yes — at the five-star grand hotel level it is the only serious choice in Lausanne. Open since 1861, directly on the lake in Ouchy, with a large spa and park grounds. For travelers who want a more contemporary boutique experience or a position in the old town rather than the lakefront, alternatives exist but none at the same grand hotel level.' },
      { q: 'What is the Lavaux and is it worth visiting from Lausanne?', a: 'The Lavaux is a UNESCO World Heritage vineyard landscape stretching along the lake shore east of Lausanne — terraced vineyards dropping steeply to the water, with views across to the French Alps. It is 15 minutes by train and worth a half-day at minimum. The villages of Lutry, Cully, and Rivaz offer wine tasting directly from the producers. It is one of the more underrated day trips in Switzerland.' },
    ],
  },

  'grindelwald': {
    name: 'Grindelwald',
    region: 'Bern Oberland, Switzerland',
    tagline: 'At the foot of the Eiger — the most dramatic village position in Switzerland.',
    description: 'Grindelwald sits in a valley directly beneath the north face of the Eiger — one of the most famous mountain walls in the world. The village looks directly at the Eiger, Mönch, and Jungfrau, and the proximity of these peaks gives it an atmospheric intensity that few Alpine villages match.\n\nIt is part of the Jungfrau ski region — one of the most extensive in Switzerland — and serves as the main valley base for the Grindelwald-First ski area and the connection to Wengen and Mürren across the Kleine Scheidegg pass.',
    atmosphere: 'Grindelwald is more directly Alpine in character than Interlaken — it sits higher, closer to the peaks, and without the valley-town tourist overlay that the lower resort carries. The village is not car-free like Wengen or Mürren, but it is compact enough to walk between most points.\n\nIt suits travelers who want to be at the mountain rather than using it as a backdrop. The Eiger north face is visible from the main street — a constant presence that gives the village a particular gravitational quality.',
    hotelScene: 'Grand Hotel Regina is the landmark luxury address — a traditional grand hotel in the village with Eiger views, open since 1894. It suits travelers who want the full Alpine grand hotel experience at close range to the peaks.\n\nThe Eiger Boutique Hotel offers a more contemporary alternative in the village centre. For those who want ski-in ski-out access at altitude, Grindelwald-First and Kleine Scheidegg have higher mountain properties.',
    highlights: ['Direct views of the Eiger north face from the village', 'Jungfrau ski region — one of Switzerland\'s most extensive', 'Jungfraujoch accessible by rack railway — highest station in Europe', 'First Cliff Walk and First Flyer — dramatic viewing platforms', 'Connection to Wengen and Mürren via Kleine Scheidegg'],
    bestFor: ['Mountain and hiking travelers who want direct peak access', 'Skiers based in the Jungfrau region', 'Those wanting Jungfraujoch access from a village base', 'Travelers who find Interlaken too flat and touristic'],
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80',
    seasonal: 'December to April for skiing — the Jungfrau region is reliable and the views of the peaks in winter are at their most dramatic.\n\nSummer from June to September is excellent for hiking. The First Cliff Walk, the trails toward Bachalpsee, and the Kleine Scheidegg routes are among the finest alpine walks in the Bernese Oberland.\n\nJungfraujoch — the "Top of Europe" railway station at 3,454m — is accessible year-round and best visited on a clear morning before cloud builds.',
    comparison: 'Against Interlaken, Grindelwald is higher, more immediately Alpine, and better for those who want to be at the mountain rather than in the valley below it. Interlaken has more hotel variety and urban amenity; Grindelwald has the Eiger on the doorstep.\n\nAgainst Wengen and Mürren, Grindelwald is car-accessible and larger — more practical for families and those with luggage. Wengen and Mürren are car-free and smaller — better for those who want true mountain village intimacy.\n\nGrindelwald suits travelers who want to be in the Jungfrau region with practical access, the best views, and a village with enough infrastructure to sustain several days.',
    gettingThere: 'From Interlaken Ost by train — the Bernese Oberland Bahn takes around 35 minutes through the valley with the peaks coming into view as you ascend.\n\nFrom Zurich, around 2.5 hours by train via Bern and Interlaken. From Geneva, around 3 hours.\n\nThe Jungfraujoch railway departs from Grindelwald Grund and Kleine Scheidegg — allow a full day for the excursion.',
    bestPages: [
      { label: 'Best luxury hotels in Interlaken', href: '/best/luxury-hotels-interlaken' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Best family hotels in Switzerland', href: '/best/family-hotels-switzerland' },
    ],
    compareLinks: [
      { label: 'Victoria-Jungfrau vs Grand Hotel Regina', href: '/compare/victoriajungfrau-grand-hotel-interlaken-vs-grand-hotel-regina' },
    ],
    faqs: [
      { q: 'Should I stay in Grindelwald or Interlaken?', a: 'Grindelwald is the better choice for travelers who want to be at the mountain — the Eiger is visible from the main street, the ski lifts are walking distance, and the village atmosphere is more Alpine. Interlaken suits travelers who want a valley base with easier access to multiple areas including Lake Thun and Brienz. The two are 35 minutes apart by train.' },
      { q: 'Is Grindelwald or Wengen better for a ski stay?', a: 'Grindelwald is more practical — car-accessible, larger, with more hotel and restaurant variety. Wengen is car-free, smaller, and more intimate — better for couples and those who want a pure mountain village experience. Both are in the same ski region and connected via Kleine Scheidegg. Many travelers base in Grindelwald for the first visit and Wengen for subsequent trips.' },
      { q: 'Is Jungfraujoch worth the trip from Grindelwald?', a: 'Yes, once — the railway ascent through the Eiger and the views from 3,454m are genuinely extraordinary. Book the first departure of the day from Grindelwald Grund to maximise clear visibility before afternoon cloud builds. The excursion takes around 4-5 hours return. It is expensive but one of the most memorable mountain railway journeys in Europe.' },
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
    .order('nightly_rate_chf', { ascending: false })

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
    <div style={{ background: bg, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
  @media (max-width: 768px) {
    .dest-grid { grid-template-columns: 1fr !important; width: 100% !important; }
    .dest-grid > div { width: 100% !important; max-width: 100% !important; }
    .dest-grid > div:last-child { order: -1; }
    .dest-breadcrumb { display: none !important; }
  }
`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <div style={{ background: '#492816', padding: '6rem 2rem 4rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>SwissNet Hotels</p>
            <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,169,110,0.6)', marginBottom: '1rem' }}>{dest.region}</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, color: '#fff', margin: '0 0 1rem', lineHeight: 1.1 }}>
            Luxury Hotels in {dest.name}
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', margin: '0 auto', fontStyle: 'italic', maxWidth: 560, lineHeight: 1.8 }}>{dest.tagline}</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted }} className="dest-breadcrumb">
          <Link href="/" style={{ color: textMuted, textDecoration: 'none' }}>Home</Link>
          <span>→</span>
          <Link href="/hotels" style={{ color: textMuted, textDecoration: 'none' }}>Hotels</Link>
          <span>→</span>
          <span style={{ color: text }}>{dest.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }} className="dest-grid">
          <div>
            {/* Structured destination sections */}
<div style={{ marginBottom: '2.5rem' }}>

  {/* Why stay here */}
  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, margin: '0 0 0.75rem' }}>Why Stay in {dest.name}</h2>
  {dest.description.split('\n\n').map((p, i) => (
  <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.85, fontWeight: 300, margin: '0 0 1rem' }}>{p}</p>
))}

  {/* Atmosphere */}
  {dest.atmosphere && (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, margin: '0 0 0.75rem' }}>Atmosphere & Travel Style</h2>
      {dest.atmosphere.split('\n\n').map((p, i) => (
  <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.85, fontWeight: 300, margin: '0 0 1rem' }}>{p}</p>
))}
    </div>
  )}

  {/* Hotel scene */}
  {dest.hotelScene && (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, margin: '0 0 0.75rem' }}>Luxury Hotel Scene</h2>
      {dest.hotelScene.split('\n\n').map((p, i) => (
  <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.85, fontWeight: 300, margin: '0 0 1rem' }}>{p}</p>
))}
    </div>
  )}

  {/* When to visit */}
  {dest.seasonal && (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, margin: '0 0 0.75rem' }}>Best Time to Visit</h2>
      {dest.seasonal.split('\n\n').map((p, i) => (
  <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.85, fontWeight: 300, margin: '0 0 1rem' }}>{p}</p>
))}
    </div>
  )}

  {/* Comparison */}
  {dest.comparison && (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: text, margin: '0 0 0.75rem' }}>How It Compares</h2>
      {dest.comparison.split('\n\n').map((p, i) => (
  <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.85, fontWeight: 300, margin: '0 0 1rem' }}>{p}</p>
))}
    </div>
  )}

  {/* Getting there */}
  {dest.gettingThere && (
    <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 4, padding: '1rem 1.25rem' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: gold, margin: '0 0 0.4rem' }}>Getting There</p>
      {dest.gettingThere.split('\n\n').map((p, i) => (
  <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.7, margin: '0 0 0.5rem' }}>{p}</p>
))}
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