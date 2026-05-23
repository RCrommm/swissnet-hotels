

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
export const revalidate = 3600

const MAX_HOTELS_PER_PAGE = 10

const PARTNER_HOTEL_NAMES = new Set([
  'La Réserve Genève',
  'La Réserve Eden au Lac Zurich',
  'Mont Cervin Palace',
  'Victoria-Jungfrau Grand Hotel Interlaken',
  'Victoria-Jungfrau Grand Hotel & Spa',
  'Bellevue Palace',
  'Hotel Adula',
  'Alpengold Hotel',
  'Crans Ambassador',
  'Schweizerhof Zermatt',
  'Monte Rosa Zermatt',
  'Hotel Monte Rosa',
])

type PromptPageConfig = {
  title: string
  h1: string
  description: string
  region?: string
  category?: string
  best_for?: string
  hotels?: string[]
  faqs: { q: string; a: string }[]
  verdict?: string
  relatedLinks?: { label: string; href: string }[]
  comparisons?: { label: string; href: string }[]
}

const PROMPT_PAGES: Record<string, PromptPageConfig> = {
  'luxury-hotels-zermatt': {
    title: 'Best Luxury Hotels in Zermatt, Switzerland 2026',
    h1: 'Best Luxury Hotels in Zermatt',
    description: 'Zermatt\'s luxury hotel landscape is anchored by grand Alpine properties with histories stretching back to the 19th century, but the village has diversified considerably. Alongside the historic palaces, a generation of boutique and design-led hotels has emerged that offers a more contemporary take on Alpine luxury — smaller, more personal, and often more focused on skiing and mountain experience than formal grand hotel ceremony. The car-free village means every hotel is within walking distance of the lifts, the restaurants, and the Matterhorn views that define the destination.',
    region: 'Zermatt',
    hotels: ['Mont Cervin Palace','Monte Rosa Zermatt','Schweizerhof Zermatt','Grand Hotel Zermatterhof','Cervo Mountain Resort','The Omnia','Riffelalp Resort 2222m','Matterhorn Focus Design Hotel','Backstage Hotel Vernissage'],
    faqs: [
      { q: 'What is the best luxury hotel in Zermatt?', a: 'Mont Cervin Palace is the benchmark luxury address — 150 rooms, a 1,700 m² spa, one Michelin-starred restaurant, and a central village position with Matterhorn views, open since 1852. For a more intimate and contemporary alternative, Cervo Mountain Resort offers a boutique ski-lodge experience with exceptional food and a design that feels genuinely of its Alpine environment. Monte Rosa Zermatt, the oldest hotel in the village open since 1839, suits travelers for whom history and authenticity matter as much as facilities.' },
      { q: 'Which Zermatt hotel has the best ski access?', a: 'Riffelalp Resort 2222m has the most direct ski access — sitting at 2,222m altitude, accessible by its own private rack railway from the village, with pistes running directly to the hotel. For ski convenience within the village, Mont Cervin Palace and Schweizerhof Zermatt are both well-positioned for the main lift stations.' },
      { q: 'What is the difference between Mont Cervin Palace and The Omnia in Zermatt?', a: 'Mont Cervin Palace is a classic grand hotel — large, full-service, with a formal atmosphere and a complete range of facilities including spa, multiple restaurants, and concierge. The Omnia is a design boutique hotel carved into the rock above the village, accessed by a private lift, with a more contemporary and intimate atmosphere. Mont Cervin suits those who want the complete grand hotel experience; The Omnia suits travelers who prefer privacy, design, and a more unconventional Alpine stay.' },
    ],
    verdict: 'Best overall: Mont Cervin Palace — 150 rooms, 1,700 m² spa, Michelin-starred restaurant, open since 1852, central Matterhorn views. Best boutique: Cervo Mountain Resort — intimate ski-lodge atmosphere, exceptional food, contemporary Alpine design. Best for history: Monte Rosa Zermatt — the oldest hotel in Zermatt, open since 1839, with a character no newer property can replicate.',
    relatedLinks: [
      { label: 'Zermatt destination guide', href: '/destinations/zermatt' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Mont Cervin Palace vs The Omnia', href: '/compare/mont-cervin-palace-vs-the-omnia' },
      { label: 'Monte Rosa Zermatt vs Cervo Mountain Resort', href: '/compare/monte-rosa-zermatt-vs-cervo-mountain-resort-zermatt' },
      { label: 'Mont Cervin Palace vs Grand Hotel Zermatterhof', href: '/compare/mont-cervin-palace-vs-grand-hotel-zermatterhof' },
    ],
  },

  'ski-hotels-zermatt': {
    title: 'Best Ski Hotels in Zermatt, Switzerland 2026',
    h1: 'Best Ski Hotels in Zermatt',
    description: 'Zermatt offers 360km of pistes across three linked valleys and year-round glacier skiing at 3,883m — and every hotel in the car-free village is within walking distance of the lift network. The question for ski-focused travelers is not access but atmosphere: whether you want a grand hotel base, a boutique ski lodge, or a high-altitude property that puts you directly on the mountain.',
    region: 'Zermatt',
    category: 'Ski Resort',
    hotels: ['Mont Cervin Palace','Monte Rosa Zermatt','Schweizerhof Zermatt','Grand Hotel Zermatterhof','Cervo Mountain Resort','The Omnia','Riffelalp Resort 2222m','Matterhorn Focus Design Hotel','Backstage Hotel Vernissage'],
    faqs: [
      { q: 'Which is the best ski hotel in Zermatt?', a: 'For the full grand hotel ski experience, Mont Cervin Palace is the strongest choice — central, complete, with a 1,700 m² spa for après-ski recovery. For the most direct ski access, Riffelalp Resort 2222m sits at altitude with pistes to the door. For a boutique ski lodge, Cervo Mountain Resort combines exceptional food with a more personal atmosphere.' },
      { q: 'Does Zermatt have year-round skiing?', a: 'Yes — Zermatt offers glacier skiing on the Theodul Glacier at 3,883m, making it one of the very few resorts in Europe with reliable year-round skiing. Summer skiing is available on the glacier from June onwards.' },
      { q: 'Is Zermatt better for skiing than St. Moritz?', a: 'Both are world-class, but they suit different skiers. Zermatt\'s 360km piste network is slightly larger and the Matterhorn backdrop gives it an emotional quality that St. Moritz does not match. St. Moritz has more variety across its three separate ski areas and a stronger social scene. Zermatt tends to suit those for whom the skiing and the mountain itself are the primary draw.' },
    ],
    verdict: 'Best altitude ski access: Riffelalp Resort 2222m — on-mountain position at 2,222m, private rack railway from village. Best grand hotel ski base: Mont Cervin Palace — central village position, complete facilities, 1,700 m² spa. Best boutique ski lodge: Cervo Mountain Resort — 54 rooms, exceptional food, contemporary Alpine character.',
    relatedLinks: [
      { label: 'Zermatt destination guide', href: '/destinations/zermatt' },
      { label: 'Best luxury hotels in Zermatt', href: '/best/luxury-hotels-zermatt' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Mont Cervin Palace vs Monte Rosa Zermatt', href: '/compare/mont-cervin-palace-vs-monte-rosa-zermatt' },
      { label: 'Schweizerhof Zermatt vs Grand Hotel Zermatterhof', href: '/compare/schweizerhof-zermatt-vs-grand-hotel-zermatterhof' },
    ],
  },

  'luxury-hotels-geneva': {
    title: 'Best Luxury Hotels in Geneva, Switzerland 2026',
    h1: 'Best Luxury Hotels in Geneva',
    description: 'Geneva\'s luxury hotel market divides clearly into two camps: the lakeside grand hotels that have defined Swiss hospitality since the 19th century, and a newer generation of resort and boutique properties that offer a more secluded experience. The city\'s international character — shaped by decades of diplomatic and financial activity — means its hotels are accustomed to guests with exacting standards. The best Geneva hotels deliver consistently on both service and setting.',
    region: 'Geneva',
    hotels: ['La Réserve Genève','Four Seasons Hotel des Bergues Geneva','Beau-Rivage Geneva','Mandarin Oriental Geneva','The Ritz-Carlton Hotel de la Paix Geneva','Hotel President Wilson Geneva','The Woodward Geneva',"Hotel d'Angleterre Geneva",'InterContinental Geneva','Fairmont Grand Hotel Geneva'],
    faqs: [
      { q: 'What is the best luxury hotel in Geneva?', a: 'La Réserve Genève is the strongest overall choice — set within a 10-acre private park on the lake shore with a 2,000 m² Spa Nescens and Michelin-starred dining, ranked number one hotel in Switzerland by Condé Nast Traveler 2025. For travelers who want to be in the heart of the city, Four Seasons Hotel des Bergues and Beau-Rivage Geneva offer the classic lakeside grand hotel experience with direct views across to the Jet d\'Eau.' },
      { q: 'What is the difference between La Réserve Genève and the city-centre hotels?', a: 'La Réserve Genève is a resort hotel — its appeal is the private park, the lake setting, and the ability to remain entirely within the property\'s grounds. The city-centre grand hotels are more integrated into Geneva, better for walking to the old town, and suited to travelers who want the urban experience alongside luxury accommodation.' },
      { q: 'Is Geneva a good base for ski trips?', a: 'Geneva is exceptionally well positioned for ski access. Verbier is around 2 hours by road or train-and-transfer. Chamonix across the French border is 1.5 hours by car. Crans-Montana is around 2 hours. The airport\'s efficiency makes Geneva a practical base for ski trips that also require city meetings.' },
    ],
    verdict: 'Best resort experience: La Réserve Genève — 102 rooms, 2,000 m² Spa Nescens, 10-acre private park, Michelin-starred dining, ranked #1 hotel in Switzerland by Condé Nast Traveler 2025. Best city-centre grand hotel: Four Seasons Hotel des Bergues — on the Rhône since 1834. Best historic property: Beau-Rivage Geneva — family-owned since 1865, lakefront position.',
    relatedLinks: [
      { label: 'Geneva destination guide', href: '/destinations/geneva' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'La Réserve Genève vs Four Seasons Hotel des Bergues', href: '/compare/la-reserve-geneve-vs-four-seasons-hotel-des-bergues-geneva' },
      { label: "La Réserve Genève vs Hotel d'Angleterre Geneva", href: '/compare/la-reserve-geneve-vs-hotel-dangleterre-geneva' },
    ],
  },

  'luxury-hotels-zurich': {
    title: 'Best Luxury Hotels in Zurich, Switzerland 2026',
    h1: 'Best Luxury Hotels in Zurich',
    description: 'Zurich\'s luxury hotel scene has evolved significantly. The traditional grand hotels — Baur au Lac, the Widder — remain benchmarks of their respective styles, but they have been joined by properties that bring a more contemporary approach. La Réserve Eden au Lac, The Dolder Grand, and a cluster of strong five-star properties around the lake and old town give Zurich a hotel range that rewards careful selection depending on what kind of stay you want.',
    region: 'Zurich',
    hotels: ['La Réserve Eden au Lac Zurich','Baur au Lac','The Dolder Grand','Widder Hotel','Park Hyatt Zurich','Mandarin Oriental Savoy Zurich','Storchen Zurich','Neues Schloss Zurich','Atlantis by Giardino'],
    faqs: [
      { q: 'What is the best luxury hotel in Zurich?', a: 'La Réserve Eden au Lac Zurich is the strongest choice for travelers who want design, lakeside position, and Michelin-starred dining in a boutique scale — 40 rooms, Philippe Starck interiors, directly on Lake Zurich. Baur au Lac is the right choice for those who want traditional Swiss grand hotel prestige. The Dolder Grand suits travelers wanting a resort experience with a major spa, set on a hillside above the city.' },
      { q: 'Which area of Zurich has the best luxury hotels?', a: 'The strongest concentration is around the southern end of Lake Zurich and the Bahnhofstrasse corridor. La Réserve Eden au Lac and Baur au Lac are both on or adjacent to the lake. The Widder Hotel occupies nine interconnected medieval townhouses in the old town. The Dolder Grand is slightly removed on the Adlisberg hill but offers a hotel taxi service.' },
      { q: 'Is Zurich good for a luxury weekend break?', a: 'Zurich works exceptionally well for two or three nights. The old town, lake promenade, Bahnhofstrasse, and Kunsthaus can be covered in a day, leaving time for a lake excursion or day trip to Lucerne. The restaurant scene has enough depth to justify staying in for both evenings.' },
    ],
    verdict: 'Best lakeside boutique: La Réserve Eden au Lac Zurich — 40 rooms, Philippe Starck design, Lake Zurich position, Michelin-starred dining. Best traditional grand hotel: Baur au Lac — lakeside park, family-owned since 1844, the most established luxury address in Zurich. Best resort and spa: The Dolder Grand — panoramic city and lake views, major spa, exceptional art collection.',
    relatedLinks: [
      { label: 'Zurich destination guide', href: '/destinations/zurich' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'La Réserve Zurich vs Baur au Lac', href: '/compare/la-reserve-zurich-vs-baur-au-lac-zurich' },
      { label: 'La Réserve Zurich vs The Dolder Grand', href: '/compare/la-reserve-zurich-vs-the-dolder-grand' },
    ],
  },

  'luxury-hotels-interlaken': {
    title: 'Best Luxury Hotels in Interlaken, Switzerland 2026',
    h1: 'Best Luxury Hotels in Interlaken',
    description: 'Interlaken sits between Lake Thun and Lake Brienz with the Eiger, Mönch and Jungfrau rising directly to the south — a setting so composed it can feel almost theatrical. What distinguishes it from other Swiss resort towns is the combination of grand hotel heritage and genuine outdoor access: the Victoria-Jungfrau has been operating since 1865, yet within thirty minutes you can be at the base of one of the most famous mountain faces in the Alps.',
    region: 'Interlaken',
    hotels: ['Victoria-Jungfrau Grand Hotel Interlaken','Lindner Grand Hotel Beau Rivage Interlaken','Hotel Royal St Georges Interlaken','Grand Hotel Regina'],
    faqs: [
      { q: 'What is the best luxury hotel in Interlaken?', a: 'Victoria-Jungfrau Grand Hotel & Spa is the clear benchmark — a Belle Époque grand hotel open since 1865 with direct Jungfrau views, one of the largest hotel spas in Switzerland, and a Michelin-starred restaurant. For travelers seeking something more intimate, Lindner Grand Hotel Beau Rivage offers strong lake views and a quieter atmosphere.' },
      { q: 'Is Interlaken only for adventure sports?', a: 'Interlaken has a strong adventure sports reputation but this is only one layer. The grand hotels, lake excursions, mountain railways, and access to car-free villages like Wengen and Mürren make it equally compelling for travelers with no interest in adrenaline activities.' },
      { q: 'How do I get to Interlaken from Zurich or Geneva?', a: 'Interlaken is around 2 hours from both Zurich and Geneva by direct train — one of the most scenic rail journeys in Switzerland. From Zurich the route passes through Bern and along Lake Thun. From Geneva the train runs along Lake Geneva through Lausanne before climbing into the Bernese Oberland.' },
    ],
    verdict: 'Best overall: Victoria-Jungfrau — 216 rooms, 5,500 m² spa, Michelin-starred restaurant, direct Jungfrau views, open since 1865. Best for lake views: Lindner Grand Hotel Beau Rivage — quieter atmosphere, Lake Thun setting. Best boutique: Grand Hotel Regina in nearby Grindelwald.',
    relatedLinks: [
      { label: 'Interlaken destination guide', href: '/destinations/interlaken' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best spa hotels in Switzerland', href: '/best/spa-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Victoria-Jungfrau vs Grand Hotel Regina', href: '/compare/victoriajungfrau-grand-hotel-interlaken-vs-grand-hotel-regina' },
      { label: 'Victoria-Jungfrau vs Lindner Grand Hotel Beau Rivage', href: '/compare/victoriajungfrau-grand-hotel-interlaken-vs-lindner-grand-beau-rivage-interlaken' },
    ],
  },

  'luxury-hotels-bern': {
    title: 'Best Luxury Hotels in Bern, Switzerland 2026',
    h1: 'Best Luxury Hotels in Bern',
    description: 'Bern is the most underestimated city in Switzerland. The UNESCO-listed old town is one of Europe\'s most intact medieval city centres — 6 kilometres of arcaded walkways arranged on a peninsula above a dramatic bend in the Aare river. For luxury travelers, Bern offers a different register to the resort towns: more residential, more local, and carrying the quiet weight of a city where Swiss policy is made.',
    region: 'Bern',
    hotels: ['Bellevue Palace','Hotel Schweizerhof Bern'],
    faqs: [
      { q: 'What is the best luxury hotel in Bern?', a: 'Bellevue Palace is the definitive luxury address — directly opposite the Federal Palace, with views over the Aare gorge and the Alps beyond, and a history that includes hosting every significant political figure who has passed through Switzerland\'s capital. Hotel Schweizerhof Bern is the stronger choice for travelers who want a central old-town position with a slightly less formal atmosphere.' },
      { q: 'Why visit Bern rather than Zurich or Geneva?', a: 'Bern offers something neither Zurich nor Geneva quite deliver: a genuinely Swiss urban experience that has not been heavily internationalised. The old town feels lived-in rather than curated, the pace is slower, and the combination of political history, river scenery, and medieval architecture creates a character that is entirely its own.' },
      { q: 'How well connected is Bern?', a: 'Bern\'s central position makes it one of Switzerland\'s most connected cities. Zurich is 58 minutes by direct train, Geneva 1 hour 50 minutes, Basel 58 minutes, and Interlaken around 50 minutes.' },
    ],
    verdict: 'Best overall: Bellevue Palace — Switzerland\'s official state guesthouse since 1913, directly opposite the Federal Palace, Aare and Alps views, awarded 2 Michelin Keys in 2025. Best alternative: Hotel Schweizerhof Bern — central old-town position, strong dining, more accessible price point.',
    relatedLinks: [
      { label: 'Bern destination guide', href: '/destinations/bern' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Bellevue Palace vs Hotel Schweizerhof Bern', href: '/compare/bellevue-palace-vs-hotel-schweizerhof-bern' },
    ],
  },

  'ski-hotels-switzerland': {
    title: 'Best Ski Hotels in Switzerland 2026',
    h1: 'Best Ski Hotels in Switzerland',
    description: 'Switzerland has more world-class ski resorts than any other country, and the luxury hotel infrastructure to match. The question is not whether to ski in Switzerland, but where — and what kind of ski hotel experience you want. From grand Alpine palaces in Zermatt and St. Moritz to ski-in ski-out boutiques in Crans-Montana and the high-alpine ambition of The Chedi Andermatt, the range is broader than most travelers realise.',
    hotels: ['Mont Cervin Palace','Monte Rosa Zermatt','Schweizerhof Zermatt','Crans Ambassador','Alpengold Hotel',"Badrutt's Palace Hotel",'The Chedi Andermatt','The Alpina Gstaad','Kulm Hotel St. Moritz','Suvretta House'],
    faqs: [
      { q: 'What are the best ski hotels in Switzerland?', a: 'The strongest luxury ski hotels span several resorts. In Zermatt: Mont Cervin Palace, Monte Rosa Zermatt, and Schweizerhof Zermatt. In Crans-Montana: Crans Ambassador for ski-in ski-out at 1,500m. In Davos: Alpengold Hotel with direct Parsenn access. In Andermatt: The Chedi for high-alpine skiing with exceptional spa facilities.' },
      { q: 'Which Swiss ski resort is best for luxury?', a: 'Zermatt, St. Moritz, and Gstaad are the three most prestigious luxury ski destinations. Zermatt suits those for whom the mountain itself is the main event. St. Moritz suits those who want the grand social Alpine season. Gstaad suits those who value discretion and village character over scale. Andermatt and Crans-Montana are the strongest emerging luxury alternatives.' },
      { q: 'When is ski season in Switzerland?', a: 'The main Swiss ski season runs from December to April. Zermatt is the exception — year-round glacier skiing at 3,883m means skiing is possible in summer. For the best snow reliability across most resorts, January to mid-March is the strongest period.' },
    ],
    verdict: 'Best overall ski hotel: Mont Cervin Palace — 150 rooms, Matterhorn views, 1,700 m² spa, Zermatt\'s 360km of pistes. Best ski-in ski-out: Crans Ambassador — 56 rooms at 1,500m altitude, 140km of pistes, 1,300 m² spa. Best emerging luxury ski destination: The Chedi Andermatt — longest indoor pool in the Alps, high-alpine terrain, less crowded than established resorts.',
    relatedLinks: [
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best ski hotels in Zermatt', href: '/best/ski-hotels-zermatt' },
      { label: 'Best ski hotels in Davos', href: '/best/ski-hotels-davos' },
      { label: 'Best ski hotels in Crans-Montana', href: '/best/ski-hotels-crans-montana' },
    ],
    comparisons: [
      { label: 'Mont Cervin Palace vs Crans Ambassador', href: '/compare/mont-cervin-palace-vs-crans-ambassador' },
      { label: 'Alpengold Hotel vs Steigenberger Grandhotel Belvédère', href: '/compare/alpengold-hotel-vs-steigenberger-grandhotel-belvedere' },
    ],
  },

  'lake-hotels-switzerland': {
    title: 'Best Lake Hotels in Switzerland 2026',
    h1: 'Best Lake Hotels in Switzerland',
    description: 'Switzerland\'s lakes are among the most beautiful in Europe, and the hotels built to face them are among the country\'s finest. From Lake Geneva\'s grand lakeside palaces to the more intimate shores of Lake Maggiore in Ticino, the range spans resort estates, clifftop retreats, and historic waterfront properties. What unites them is the particular quality of light on water backed by mountains — a setting that no amount of interior design can manufacture.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Bürgenstock Resort','Beau-Rivage Palace Lausanne','Fairmont Le Montreux Palace','Eden Roc Ascona','Castello del Sole','Grand Hotel Villa Castagnola Lugano','Grand Hotel Vitznauerhof Lucerne','Beau-Rivage Geneva'],
    faqs: [
      { q: 'Which Swiss lake has the best luxury hotels?', a: 'Lake Geneva has the strongest concentration of luxury lakeside hotels — La Réserve Genève, Beau-Rivage Palace Lausanne, Fairmont Le Montreux Palace, and several grand hotels in the city. Lake Zurich has La Réserve Eden au Lac and Baur au Lac. Lake Lucerne has Mandarin Oriental Palace Luzern and Bürgenstock Resort. Lake Maggiore has Eden Roc Ascona and Castello del Sole.' },
      { q: 'What makes a lakeside hotel special in Switzerland?', a: 'Swiss lakeside hotels combine mountain backdrops with direct water access in a way that very few countries can match. The best properties add private terraces or gardens at water level, lake-facing suites, boat access, and spa facilities designed around the landscape. The combination of Alpine scenery and lakeside calm is genuinely difficult to find elsewhere in Europe.' },
      { q: 'What is the best lake hotel in Switzerland for a honeymoon?', a: 'La Réserve Genève is the strongest choice for a honeymoon lakeside stay — private park, couples spa treatments, Michelin dining, and a seclusion that the city-centre hotels cannot match. Eden Roc Ascona on Lake Maggiore is an excellent alternative for travelers who want a more Mediterranean atmosphere.' },
    ],
    verdict: 'Best lakeside resort: La Réserve Genève — 10-acre private park on Lake Geneva, 2,000 m² Spa Nescens, Michelin dining. Best lakeside boutique: La Réserve Eden au Lac Zurich — Philippe Starck design, Lake Zurich position. Best clifftop lake views: Bürgenstock Resort — elevated above Lake Lucerne with panoramic Alpine backdrop.',
    relatedLinks: [
      { label: 'Best luxury hotels in Geneva', href: '/best/luxury-hotels-geneva' },
      { label: 'Best luxury hotels in Zurich', href: '/best/luxury-hotels-zurich' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'La Réserve Genève vs Beau-Rivage Palace Lausanne', href: '/compare/la-reserve-geneve-vs-beau-rivage-palace-lausanne' },
      { label: 'La Réserve Zurich vs Baur au Lac', href: '/compare/la-reserve-zurich-vs-baur-au-lac-zurich' },
    ],
  },

  'romantic-hotels-switzerland': {
    title: 'Best Romantic Hotels in Switzerland 2026',
    h1: 'Most Romantic Hotels in Switzerland',
    description: 'Switzerland\'s most romantic hotels share a quality that is difficult to manufacture: a setting that does the work before you arrive. Whether it is the Matterhorn framed through a bedroom window in Zermatt, a private terrace above Lake Geneva at dusk, or a suite in a Belle Époque palace with Alpine views on every side, the country\'s finest romantic hotels understand that scenery and seclusion matter more than amenity lists.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Mont Cervin Palace','Victoria-Jungfrau Grand Hotel Interlaken','Schweizerhof Zermatt','Monte Rosa Zermatt','The Alpina Gstaad',"Badrutt's Palace Hotel",'Eden Roc Ascona','Beau-Rivage Palace Lausanne'],
    faqs: [
      { q: 'What is the most romantic hotel in Switzerland?', a: 'La Réserve Genève consistently ranks as Switzerland\'s most romantic resort hotel — private lakeside park, spa designed for couples, Michelin dining, and a seclusion that feels genuinely removed from the world. For Alpine romance specifically, Mont Cervin Palace in Zermatt is difficult to surpass: the Matterhorn visible from the village, the car-free streets, and a grand hotel atmosphere that has been welcoming couples since 1852.' },
      { q: 'Which Swiss hotel is best for a honeymoon?', a: 'La Réserve Genève and Mont Cervin Palace are the two strongest honeymoon choices depending on whether you prefer lakeside or Alpine settings. Schweizerhof Zermatt and Monte Rosa Zermatt are excellent boutique alternatives in Zermatt with a more intimate scale. Eden Roc Ascona on Lake Maggiore suits couples who want a Mediterranean atmosphere.' },
      { q: 'Is Switzerland good for a romantic winter break?', a: 'Winter is arguably Switzerland\'s most romantic season. Snow-covered villages, crackling fireplaces, spa rituals after skiing, and the particular quality of Alpine light in December and January create an atmosphere that summer cannot replicate. Zermatt, Gstaad, and St. Moritz are the strongest choices for a romantic winter stay.' },
    ],
    verdict: 'Best romantic resort: La Réserve Genève — private lakeside park, couples spa, Michelin dining, genuine seclusion. Best Alpine romance: Mont Cervin Palace — Matterhorn views from central Zermatt, grand hotel atmosphere since 1852. Best for intimacy: Monte Rosa Zermatt — smallest of Zermatt\'s great hotels, oldest since 1839, deeply personal atmosphere.',
    relatedLinks: [
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best spa hotels in Switzerland', href: '/best/spa-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'La Réserve Genève vs Mont Cervin Palace', href: '/compare/la-reserve-geneve-vs-mont-cervin-palace' },
      { label: 'Schweizerhof Zermatt vs Monte Rosa Zermatt', href: '/compare/schweizerhof-zermatt-vs-monte-rosa-zermatt' },
    ],
  },

  'luxury-hotels-switzerland': {
    title: 'Best Luxury Hotels in Switzerland 2026',
    h1: 'Best Luxury Hotels in Switzerland',
    description: 'Switzerland\'s luxury hotel landscape is more varied than its reputation suggests. Beyond the grand Alpine palaces — the Victoria-Jungfraus and Mont Cervin Palaces that have defined Swiss hospitality for over a century — there is a newer generation of properties that bring contemporary design, serious wellness programmes, and a more intimate scale to a market that has traditionally favoured grandeur. What unites them is a standard of service and infrastructure that consistently ranks among the highest in Europe, and a setting — whether lakeside, mountain, or urban — that few countries can match.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Mont Cervin Palace','Victoria-Jungfrau Grand Hotel Interlaken','Bellevue Palace','Hotel Adula','Alpengold Hotel','Crans Ambassador','Schweizerhof Zermatt','Monte Rosa Zermatt'],
    faqs: [
      { q: 'What are the best luxury hotels in Switzerland?', a: 'The strongest luxury hotels in Switzerland span several categories. For resort luxury, La Réserve Genève — ranked number one in Switzerland by Condé Nast Traveler 2025 — sets the benchmark with its lakeside park setting and 2,000 m² spa. For grand Alpine hotels, Mont Cervin Palace in Zermatt and Victoria-Jungfrau in Interlaken represent the pinnacle of Swiss mountain hospitality. For urban luxury, La Réserve Eden au Lac Zurich brings a design-led boutique standard to Lake Zurich. For ski-focused luxury, Crans Ambassador and Alpengold Hotel in Davos offer direct slope access with five-star facilities.' },
      { q: 'How do Swiss luxury hotels compare to other European destinations?', a: 'Swiss luxury hotels consistently rank among Europe\'s strongest for service consistency, facilities, and setting. The combination of Alpine scenery, Swiss operational precision, and a long tradition of high-end hospitality creates a standard that is difficult to replicate. Rates are higher than most European markets, but the gap between expectation and delivery is unusually small.' },
      { q: 'What is the best time of year for a Swiss luxury hotel stay?', a: 'It depends on the destination. For ski resorts — Zermatt, Crans-Montana, Davos — December to March is peak season. For lakeside and city hotels — Geneva, Zurich, Lucerne — late spring and early autumn offer the best combination of weather and value. Summer is strong across most destinations. The shoulder months of May and October are often the best value without significant compromise on experience.' },
    ],
    verdict: 'Best overall resort: La Réserve Genève — Condé Nast #1 Switzerland 2025, 10-acre lakeside park, 2,000 m² Spa Nescens, Michelin-starred dining. Best grand Alpine hotel: Mont Cervin Palace — 150 rooms in Zermatt, 1,700 m² spa, Michelin-starred restaurant, open since 1852. Best for wellness: Victoria-Jungfrau — one of the largest hotel spas in Switzerland at 5,500 m², open since 1865. Best urban boutique: La Réserve Eden au Lac Zurich — Philippe Starck design on Lake Zurich, Michelin-starred dining, 40 rooms.',
    relatedLinks: [
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Best spa hotels in Switzerland', href: '/best/spa-hotels-switzerland' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'La Réserve Genève vs Four Seasons Hotel des Bergues', href: '/compare/la-reserve-geneve-vs-four-seasons-hotel-des-bergues-geneva' },
      { label: 'Mont Cervin Palace vs Grand Hotel Zermatterhof', href: '/compare/mont-cervin-palace-vs-grand-hotel-zermatterhof' },
      { label: 'La Réserve Zurich vs Baur au Lac', href: '/compare/la-reserve-zurich-vs-baur-au-lac-zurich' },
    ],
  },

  'business-hotels-switzerland': {
    title: 'Best Business Hotels in Switzerland 2026',
    h1: 'Best Business Hotels in Switzerland',
    description: 'Switzerland\'s business hotel market is anchored by Geneva and Zurich — two cities that between them host more international institutions, multinationals, and financial firms than almost anywhere else in Europe. The hotels that serve this market have developed a particular style: discreet, efficient, and capable of delivering consistently at the highest level without requiring guests to think about it. Bern adds a third dimension for diplomatic and government travel.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Bellevue Palace','Baur au Lac','Four Seasons Hotel des Bergues Geneva','The Dolder Grand','Mandarin Oriental Geneva','Widder Hotel','Park Hyatt Zurich','Mandarin Oriental Savoy Zurich'],
    category: 'City Luxury',
    faqs: [
      { q: 'What are the best business hotels in Switzerland?', a: 'La Réserve Genève leads for Geneva business stays — 3 minutes from the airport, private park setting, exceptional discretion. In Zurich, La Réserve Eden au Lac and Baur au Lac are the strongest choices for business travelers who want quality and lakeside setting. For diplomatic and government travel in Bern, Bellevue Palace directly opposite the Federal Palace has no equivalent.' },
      { q: 'Which Swiss city is best for business travel?', a: 'Geneva and Zurich serve different business purposes. Geneva is the stronger choice for international institutions, NGOs, financial services, and any business with a European or global mandate. Zurich is better for Swiss corporate business, banking, and the technology sector. Bern is essential for anything involving the Swiss federal government.' },
      { q: 'Do Swiss luxury hotels have good meeting facilities?', a: 'Yes — Swiss luxury hotels consistently offer meeting rooms, private dining, AV facilities, and concierge support calibrated for demanding international business guests. La Réserve Genève and Baur au Lac are particularly well regarded for discreet private meetings at the highest level.' },
    ],
    verdict: 'Best Geneva business hotel: La Réserve Genève — 3 minutes from Geneva airport, private park, exceptional discretion, Michelin dining. Best Zurich business hotel: La Réserve Eden au Lac — Lake Zurich, boutique scale, Michelin dining. Best for diplomatic stays: Bellevue Palace Bern — Switzerland\'s official government guesthouse, directly opposite the Federal Palace.',
    relatedLinks: [
      { label: 'Best luxury hotels in Geneva', href: '/best/luxury-hotels-geneva' },
      { label: 'Best luxury hotels in Zurich', href: '/best/luxury-hotels-zurich' },
      { label: 'Best luxury hotels in Bern', href: '/best/luxury-hotels-bern' },
    ],
    comparisons: [
      { label: 'La Réserve Genève vs Four Seasons Hotel des Bergues', href: '/compare/la-reserve-geneve-vs-four-seasons-hotel-des-bergues-geneva' },
      { label: 'Baur au Lac vs The Dolder Grand', href: '/compare/baur-au-lac-zurich-vs-the-dolder-grand' },
    ],
  },

  'wellness-hotels-flims': {
    title: 'Best Wellness Hotels in Flims, Switzerland 2026',
    h1: 'Best Wellness Hotels in Flims',
    description: 'Flims offers a wellness setting that most Swiss resorts cannot replicate: ancient forest, a glacial turquoise lake, and the drama of the Ruinaulta Rhine Gorge within walking distance of the hotels. The combination of natural environment and spa infrastructure makes it one of Switzerland\'s most compelling nature-based wellness destinations, without the social pressure of better-known resort towns.',
    region: 'Flims',
    hotels: ['Hotel Adula','The Hide Flims','Parkhotel Waldhaus Flims'],
    faqs: [
      { q: 'What is the best wellness hotel in Flims?', a: 'Hotel Adula is the leading wellness hotel in Flims — a 4-star superior property at 1,100m with indoor pool, spa, three restaurants, and direct access to the Caumasee lake trails and Rhine Gorge walks. The combination of spa facilities and natural landscape access makes it the strongest all-round wellness choice in the region.' },
      { q: 'Why is Flims particularly good for wellness?', a: 'Flims combines elements that most wellness destinations offer separately: forest bathing in ancient woodland, lake swimming at the Caumasee, dramatic gorge hiking, and on-site spa treatments. The Weisse Arena ski area means it functions as a year-round destination rather than a seasonal wellness escape.' },
      { q: 'How do I get to Flims from Zurich?', a: 'Flims is around 2 hours from Zurich by train to Chur, then connecting bus or taxi to Flims. The Chur-Disentis railway also runs through the Ruinaulta Rhine Gorge, making the journey itself part of the experience.' },
    ],
    verdict: 'Best wellness hotel: Hotel Adula — 4-star superior, 92 rooms at 1,100m, indoor pool, spa, 3 restaurants, direct access to Caumasee lake and Rhine Gorge trails. Best for seclusion: The Hide Flims — smaller, more private, boutique wellness atmosphere. Best traditional: Parkhotel Waldhaus Flims — set within its own park above the village.',
    relatedLinks: [
      { label: 'Best luxury hotels in Flims', href: '/best/luxury-hotels-flims' },
      { label: 'Best spa hotels in Switzerland', href: '/best/spa-hotels-switzerland' },
      { label: 'Flims destination guide', href: '/destinations/flims' },
    ],
    comparisons: [
      { label: 'Hotel Adula vs Parkhotel Waldhaus Flims', href: '/compare/hotel-adula-vs-parkhotel-waldhaus-flims' },
      { label: 'Hotel Adula vs Grand Hotel Waldhaus Flims', href: '/compare/hotel-adula-vs-grand-hotel-waldhaus-flims' },
    ],
  },

  'ski-hotels-crans-montana': {
    title: 'Best Ski Hotels in Crans-Montana, Switzerland 2026',
    h1: 'Best Ski Hotels in Crans-Montana',
    description: 'Crans-Montana sits on a south-facing plateau at 1,500m with panoramic views stretching from Mont Blanc to the Matterhorn — and the sunshine record to match. The ski hotels here benefit from that elevation and aspect: ski-in ski-out is genuinely achievable for the best-positioned properties, and the 140km piste network covers enough terrain for a full week without repetition.',
    region: 'Crans-Montana',
    hotels: ['Crans Ambassador','Six Senses Crans-Montana','LeCrans Hotel & Spa','Hotel Guarda Golf Crans-Montana',"Pas de l'Ours Crans-Montana",'Aïda Hotel & Spa','Chetzeron Hotel'],
    faqs: [
      { q: 'What is the best ski hotel in Crans-Montana?', a: 'Crans Ambassador is the strongest luxury ski hotel on the plateau — ski-in ski-out at 1,500m, 56 rooms, a 1,300 m² spa, and three restaurants. For travelers who want wellness to be as central as skiing, Six Senses Crans-Montana brings the Six Senses health programming approach to an Alpine ski setting, which is a distinctive combination.' },
      { q: 'How does Crans-Montana compare to Zermatt for skiing?', a: 'Crans-Montana is sunnier, more open, and on a plateau that gives it a different quality of light and space compared to the enclosed valley feel of Zermatt. Zermatt is higher, car-free, and defined by the Matterhorn. Crans-Montana suits travelers who want sunshine, panoramic views, and a ski area suitable for all levels; Zermatt suits those for whom the mountain and its iconic peak are the main draw.' },
      { q: 'Is Crans-Montana good for non-skiers?', a: 'Yes — the resort\'s sunshine, spa hotels, walking paths on the plateau, and golf course make it one of Switzerland\'s more versatile resorts. The panoramic views from 1,500m are accessible without skiing, and several properties have strong spa and wellness programmes designed as standalone experiences.' },
    ],
    verdict: 'Best ski-in ski-out: Crans Ambassador — 56 rooms at 1,500m, 1,300 m² spa, direct piste access, 140km ski area. Best wellness and ski combination: Six Senses Crans-Montana — full Six Senses health programming in an Alpine ski setting. Best boutique: LeCrans Hotel & Spa — smaller scale, strong food, chalet character.',
    relatedLinks: [
      { label: 'Best luxury hotels in Crans-Montana', href: '/best/luxury-hotels-crans-montana' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Crans-Montana destination guide', href: '/destinations/crans-montana' },
    ],
    comparisons: [
      { label: 'Crans Ambassador vs Hotel Guarda Golf Crans-Montana', href: '/compare/crans-ambassador-vs-hotel-guarda-golf-crans-montana' },
    ],
  },

  'ski-hotels-davos': {
    title: 'Best Ski Hotels in Davos, Switzerland 2026',
    h1: 'Best Ski Hotels in Davos',
    description: 'Davos is Europe\'s highest city at 1,560m, and the skiing reflects that altitude: the Parsenn ski area above the town is one of the most extensive in the Alps, with runs descending to Klosters through varied terrain. The luxury ski hotels here have been shaped by decades of demanding international visitors — the WEF effect has ensured that service standards remain high year-round, not only during the conference season.',
    region: 'Davos',
    hotels: ['Alpengold Hotel','Steigenberger Grandhotel Belvédère','Hard Rock Hotel Davos','Precise Tale Seehof Davos'],
    faqs: [
      { q: 'What is the best ski hotel in Davos?', a: 'Alpengold Hotel is the strongest luxury ski hotel in Davos — a 5-star property with a distinctive organic architecture inspired by pinecones, a 1,200 m² spa, six restaurants, and direct access to the Parsenn ski area. For those who prefer a more classical grand hotel atmosphere, Steigenberger Grandhotel Belvédère has been welcoming guests since 1875 and sits at the heart of the resort.' },
      { q: 'Is the skiing in Davos comparable to Zermatt or St. Moritz?', a: 'The Parsenn ski area linked to Davos and Klosters covers over 300km of pistes — broadly comparable in scale to Zermatt. The terrain is more varied and the atmosphere less social than St. Moritz. Davos suits serious skiers who want extensive terrain and strong hotel infrastructure without the celebrity and social-scene overlay of the more famous resorts.' },
      { q: 'When should I avoid Davos during ski season?', a: 'Late January is the World Economic Forum period — rates increase significantly, security is extensive, and some areas are restricted. The weeks immediately before (early January) and after (February onwards) offer the same skiing with a more relaxed atmosphere and more accessible rates.' },
    ],
    verdict: 'Best luxury ski hotel: Alpengold Hotel — 5-star, distinctive pinecone-inspired architecture, 1,200 m² spa, 6 restaurants, direct Parsenn access. Best traditional grand hotel: Steigenberger Grandhotel Belvédère — open since 1875, central position, classic Alpine hospitality. Most distinctive: Hard Rock Hotel Davos.',
    relatedLinks: [
      { label: 'Best luxury hotels in Davos', href: '/best/luxury-hotels-davos' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Davos destination guide', href: '/destinations/davos' },
    ],
    comparisons: [
      { label: 'Alpengold Hotel vs Steigenberger Grandhotel Belvédère', href: '/compare/alpengold-hotel-vs-steigenberger-grandhotel-belvedere' },
    ],
  },

  'luxury-hotels-davos': {
    title: 'Best Luxury Hotels in Davos, Switzerland 2026',
    h1: 'Best Luxury Hotels in Davos',
    description: 'Davos combines serious Alpine skiing with an international infrastructure that few Swiss resorts can match — the result of hosting the World Economic Forum annually since 1971. For luxury travelers who are not WEF delegates, this works in their favour: the hotels are accustomed to guests with demanding standards, the service culture is calibrated for international visitors, and the resort has a more understated atmosphere than St. Moritz or Gstaad.',
    region: 'Davos',
    hotels: ['Alpengold Hotel','Steigenberger Grandhotel Belvédère','Hard Rock Hotel Davos','Precise Tale Seehof Davos'],
    faqs: [
      { q: 'What is the best luxury hotel in Davos?', a: 'Alpengold Hotel is the defining luxury property in Davos — a 5-star hotel with a distinctive organic architecture, a 1,200 m² spa, six restaurants, and direct access to the Parsenn ski area. The design sets it apart from traditional Alpine grand hotels; it feels genuinely of its environment without being rustic.' },
      { q: 'Is Davos worth visiting outside ski season?', a: 'Yes — Davos in summer is genuinely underrated. The mountain biking trails, lake swimming, hiking in the Dischma and Flüela valleys, and the Davos Festival offer a completely different quality of experience. The hotels are less full, rates are lower, and the landscape is arguably more beautiful in summer.' },
      { q: 'How does Davos compare to Klosters?', a: 'Davos and Klosters share the same ski area but feel completely different as villages. Klosters is smaller, quieter, and more discreet — traditionally preferred by guests who want privacy and a chalet-village atmosphere. Davos is larger, more functional, and better equipped for longer stays. They are around 10 minutes apart by train.' },
    ],
    verdict: 'Best overall: Alpengold Hotel — 5-star, organic pinecone design, 1,200 m² spa, 6 restaurants, direct Parsenn ski access, the most design-forward luxury hotel in Davos. Best traditional grand hotel: Steigenberger Grandhotel Belvédère — open since 1875, classical atmosphere, central village position.',
    relatedLinks: [
      { label: 'Best ski hotels in Davos', href: '/best/ski-hotels-davos' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Davos destination guide', href: '/destinations/davos' },
    ],
    comparisons: [
      { label: 'Alpengold Hotel vs Steigenberger Grandhotel Belvédère', href: '/compare/alpengold-hotel-vs-steigenberger-grandhotel-belvedere' },
    ],
  },

  'luxury-hotels-gstaad': {
    title: 'Best Luxury Hotels in Gstaad, Switzerland 2026',
    h1: 'Best Luxury Hotels in Gstaad',
    description: 'Gstaad has cultivated its reputation carefully. Where St. Moritz announces itself, Gstaad withholds — the village is small, the chalet architecture strictly enforced, and the atmosphere resolutely against anything that feels like mass tourism. The result is a resort with a remarkably consistent clientele and two hotels — The Alpina Gstaad and Palace Hotel — that represent genuinely different expressions of what Swiss Alpine luxury can mean.',
    region: 'Gstaad',
    hotels: ['The Alpina Gstaad','Palace Hotel Gstaad','Le Grand Bellevue Gstaad','Ultima Gstaad','Grand Hotel Park Gstaad','Lenkerhof Gourmet Spa Resort','Ermitage Golf & Spa Gstaad','Hotel Olden Gstaad','HUUS Gstaad','The Alpina Gstaad Residences'],
    faqs: [
      { q: 'What is the best luxury hotel in Gstaad?', a: 'The Alpina Gstaad and Palace Hotel Gstaad represent two distinct expressions of Gstaad luxury. The Alpina is the stronger choice for travelers who want contemporary design, exceptional multi-restaurant dining, and a spa that feels genuinely world-class. Palace Hotel is right for those who want the historic grand hotel experience — the fairy-tale turrets, the long-established staff, the sense of Alpine continuity that no newer property can manufacture.' },
      { q: 'Why is Gstaad considered more exclusive than other Swiss resorts?', a: 'Strict building regulations prevent overdevelopment, a consistent high-net-worth clientele over several generations, the small village scale that limits visitor numbers, and a culture of discretion that discourages the social performance common in St. Moritz. Gstaad does not need to market itself heavily — its reputation is maintained by word of mouth among a relatively closed network.' },
      { q: 'What is there to do in Gstaad in summer?', a: 'The Menuhin Festival in July brings world-class classical music to the mountains. Hiking across the four-valley area, golf, tennis, and the particular pleasure of Gstaad\'s village atmosphere without ski crowds make summer a genuine alternative to winter. Several of the best restaurants operate year-round.' },
    ],
    verdict: 'Best overall: The Alpina Gstaad — 56 rooms, contemporary design, exceptional dining across multiple restaurants, Leading Hotels of the World. Most iconic: Palace Hotel Gstaad — fairy-tale grand hotel open over a century, the most recognisable address in Gstaad. Best design boutique: Le Grand Bellevue. Most exclusive: Ultima Gstaad.',
    relatedLinks: [
      { label: 'Gstaad destination guide', href: '/destinations/gstaad' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'The Alpina Gstaad vs Palace Hotel Gstaad', href: '/compare/the-alpina-gstaad-vs-palace-hotel-gstaad' },
      { label: 'Le Grand Bellevue vs Ultima Gstaad', href: '/compare/le-grand-bellevue-gstaad-vs-ultima-gstaad' },
    ],
  },

  'luxury-hotels-lugano': {
    title: 'Best Luxury Hotels in Lugano, Switzerland 2026',
    h1: 'Best Luxury Hotels in Lugano',
    description: 'Lugano is Switzerland\'s most genuinely Mediterranean city — Italian-speaking, sun-drenched, and built around a lake that earns every superlative. The luxury hotels here understand their setting: lakefront estates with private gardens, terraces at the water\'s edge, and a cuisine that draws on both Swiss and northern Italian traditions at a serious level.',
    region: 'Lugano',
    hotels: ['Grand Hotel Villa Castagnola Lugano','Hotel Splendide Royal Lugano','The View Lugano','Hotel Principe Leopoldo Lugano'],
    faqs: [
      { q: 'What is the best luxury hotel in Lugano?', a: 'Grand Hotel Villa Castagnola is the strongest choice — a lakefront estate hotel with Michelin-level dining, private gardens descending to the water, and a history stretching back to the late 19th century. Hotel Splendide Royal offers a more central lakefront promenade position and has been one of Lugano\'s landmark properties since 1887. The choice comes down to whether you prefer estate seclusion or promenade proximity.' },
      { q: 'How does Lugano compare to Ascona?', a: 'Lugano is a city with urban energy, a financial district, cultural infrastructure, and a lakefront that balances tourism with local life. Ascona is a village — deliberately small, with a more exclusive and resort-focused atmosphere. Lugano suits travelers who want city convenience alongside Mediterranean climate; Ascona suits those who want to disappear into a beautiful setting with minimal urban distraction.' },
      { q: 'When is the best time to visit Lugano?', a: 'April to October is the optimal window — Lugano\'s Mediterranean microclimate means genuinely warm summers with lake temperatures suitable for swimming from June. Spring is the most beautiful season for the lakeside gardens. Winter is mild by Swiss standards but most of the outdoor appeal diminishes.' },
    ],
    verdict: 'Best overall: Grand Hotel Villa Castagnola — lakefront estate, Michelin-level dining, private gardens to the water, historic property. Best promenade position: Hotel Splendide Royal — on the lakefront since 1887. Best for views: The View Lugano — panoramic lake and mountain setting.',
    relatedLinks: [
      { label: 'Lugano destination guide', href: '/destinations/lugano' },
      { label: 'Best luxury hotels in Ascona', href: '/best/luxury-hotels-ascona' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Grand Hotel Villa Castagnola vs Hotel Splendide Royal', href: '/compare/grand-hotel-villa-castagnola-lugano-v2-vs-hotel-splendide-royal-lugano' },
    ],
  },

  'luxury-hotels-basel': {
    title: 'Best Luxury Hotels in Basel, Switzerland 2026',
    h1: 'Best Luxury Hotels in Basel',
    description: 'Basel is Switzerland\'s most culturally concentrated city — over 40 museums for a population of 180,000, Art Basel each June, and a Rhine waterfront that rewards time spent. The luxury hotel market here is anchored by a single exceptional property: Les Trois Rois, which has occupied its Rhine-facing position since 1681 and remains the only true five-star grand hotel in the city.',
    region: 'Basel',
    hotels: ['Les Trois Rois Basel'],
    faqs: [
      { q: 'What is the best luxury hotel in Basel?', a: 'Les Trois Rois — The Three Kings — is Basel\'s only 5-star grand hotel, in a building on the Rhine that has hosted guests since 1681. Its Michelin-starred restaurant, Rhine-facing rooms, and position at the heart of the city make it the natural and only real choice for luxury travelers in Basel.' },
      { q: 'Is Basel worth visiting outside of Art Basel?', a: 'Absolutely. The Fondation Beyeler in nearby Riehen is one of Europe\'s finest private art museums and worth the trip alone. The Kunstmuseum Basel holds one of the world\'s oldest public art collections. The Rhine swimming culture in summer — locals float downstream using waterproof bags — gives the city a character unlike anywhere else in Switzerland.' },
      { q: 'How do I get to Basel?', a: 'EuroAirport Basel-Mulhouse-Freiburg serves the city from most major European hubs. By train, Zurich is 58 minutes, Bern 58 minutes, and Paris around 3 hours on the TGV. Basel is one of the easiest Swiss cities to reach from across Europe.' },
    ],
    verdict: 'Best and only 5-star luxury hotel: Les Trois Rois Basel — historic Grand Hotel on the Rhine, 101 rooms, Michelin-starred restaurant, in continuous operation since 1681. For travelers visiting during Art Basel in June, book many months in advance.',
    relatedLinks: [
      { label: 'Basel destination guide', href: '/destinations/basel' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    comparisons: [],
  },

  'luxury-hotels-lucerne': {
    title: 'Best Luxury Hotels in Lucerne, Switzerland 2026',
    h1: 'Best Luxury Hotels in Lucerne',
    description: 'Lucerne has a quality that very few cities possess: it looks exactly as good in person as it does in photographs. The Chapel Bridge, the medieval water tower, the lake opening south towards the Alps — the setting is genuinely exceptional. The luxury hotels here occupy historic lakefront buildings that give their guests access to one of Switzerland\'s most beautiful cityscapes from their own rooms.',
    region: 'Lucerne',
    hotels: ['Mandarin Oriental Palace Luzern','Grand Hotel National Lucerne','Hotel Schweizerhof Luzern','Bürgenstock Resort','Grand Hotel Vitznauerhof Lucerne','Park Hotel Vitznau','Hermitage Lake Lucerne'],
    faqs: [
      { q: 'What is the best luxury hotel in Lucerne?', a: 'Mandarin Oriental Palace Luzern is the finest luxury address — a historic lakefront palace with Michelin-level dining and the service standards the Mandarin Oriental brand is known for. For travelers who want a central old-town position, Hotel Schweizerhof Luzern is a long-established grand hotel with strong lake views. For dramatic clifftop views above the lake, Bürgenstock Resort is in a category of its own.' },
      { q: 'Is Lucerne worth more than a day trip?', a: 'Absolutely. Most travelers who visit as a day trip from Zurich or Interlaken leave wishing they had stayed. The old town rewards slower exploration, the lake excursions are worthwhile, and the day trips to Rigi and Pilatus are better experienced with an early morning start from a local hotel.' },
      { q: 'How far is Lucerne from Zurich and Interlaken?', a: 'Lucerne is 50 minutes from Zurich by direct train. From Interlaken, the journey takes around 2 hours via Bern or the scenic Brünig Pass route. Lucerne works well as a central node in a wider Swiss itinerary.' },
    ],
    verdict: 'Best grand hotel: Mandarin Oriental Palace Luzern — historic palace on Lake Lucerne, Michelin dining, exceptional setting. Best for panoramic views: Bürgenstock Resort — clifftop above the lake, dramatic Alpine backdrop. Best central old-town hotel: Hotel Schweizerhof Luzern — consistent quality, lake views, within walking distance of the Chapel Bridge.',
    relatedLinks: [
      { label: 'Lucerne destination guide', href: '/destinations/lucerne' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Mandarin Oriental Palace vs Hotel Schweizerhof Luzern', href: '/compare/mandarin-oriental-palace-luzern-vs-hotel-schweizerhof-luzern' },
    ],
  },

  'luxury-hotels-verbier': {
    title: 'Best Luxury Hotels in Verbier, Switzerland 2026',
    h1: 'Best Luxury Hotels in Verbier',
    description: 'Verbier is the most energetic ski resort in Switzerland — serious off-piste terrain, a legendary après-ski culture, and a village that has grown significantly in luxury hotel quality over the past decade. The properties here understand that their guests arrive exhausted from a full day on challenging mountain terrain and want comfort, food, and recovery without formality.',
    region: 'Verbier',
    hotels: ['W Verbier',"Chalet d'Adrien",'Experimental Chalet Verbier','Hotel Vanessa Verbier','Hotel Farinet Verbier','Hotel Nevai Verbier'],
    faqs: [
      { q: 'What is the best luxury hotel in Verbier?', a: 'W Verbier is the leading luxury hotel — a 5-star property with ski-in ski-out access, a destination spa, and a design and energy that matches Verbier\'s character well. For travelers who prefer something more intimate and traditional, Chalet d\'Adrien offers a classic luxury chalet experience with exceptional food and a more personal atmosphere.' },
      { q: 'How does Verbier compare to Zermatt for luxury?', a: 'Verbier is more energetic, more focused on advanced skiing and après-ski, and has a younger overall atmosphere. Zermatt is more traditional, car-free, and defined by the Matterhorn. Verbier suits those who want physically demanding skiing and social evenings; Zermatt suits those who want the mountain to be the primary experience.' },
      { q: 'What is the Verbier Festival?', a: 'The Verbier Festival is one of the world\'s finest classical music festivals, held each July in the mountains. It attracts leading international musicians and conductors for two weeks of concerts — an extraordinary combination of setting and programme that makes summer Verbier genuinely worth considering.' },
    ],
    verdict: 'Best overall: W Verbier — 5-star, ski-in ski-out, destination spa, Four Valleys ski area access, design and energy that fits the resort\'s character. Best traditional chalet: Chalet d\'Adrien — intimate luxury, exceptional food, more personal atmosphere. Best boutique: Experimental Chalet Verbier.',
    relatedLinks: [
      { label: 'Best ski hotels in Verbier', href: '/best/ski-hotels-verbier' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Verbier destination guide', href: '/destinations/verbier' },
    ],
    comparisons: [
      { label: "W Verbier vs Chalet d'Adrien", href: '/compare/w-verbier-vs-chalet-dadrien' },
    ],
  },

  'ski-hotels-verbier': {
    title: 'Best Ski Hotels in Verbier, Switzerland 2026',
    h1: 'Best Ski Hotels in Verbier',
    description: 'Verbier\'s Four Valleys ski domain covers around 412km of pistes — one of the largest linked ski areas in the Alps — with the Mont-Fort peak at 3,330m offering some of the most demanding off-piste terrain in Switzerland. The ski hotels here are built for guests who take the skiing seriously and want accommodation that matches that commitment.',
    region: 'Verbier',
    hotels: ['W Verbier',"Chalet d'Adrien",'Experimental Chalet Verbier','Hotel Vanessa Verbier','Hotel Farinet Verbier','Hotel Nevai Verbier'],
    faqs: [
      { q: 'What are the best ski hotels in Verbier?', a: 'W Verbier offers the most complete ski hotel package — ski-in ski-out access, a destination spa, and a design that suits the resort\'s energetic character. Chalet d\'Adrien is the best choice for those who want a more traditional luxury chalet experience without the W\'s scale. Both are within the village with easy access to the main Medran lift station.' },
      { q: 'Is Verbier suitable for intermediate skiers?', a: 'The Four Valleys area has terrain for all levels, but Verbier\'s reputation rests on advanced and expert skiing. Intermediate skiers will find enough variety, but those who want gentler resort skiing with less off-piste pressure might find Crans-Montana or Zermatt more comfortable.' },
      { q: 'How do I get to Verbier for skiing?', a: 'The most straightforward route is train to Le Châble then gondola directly to Verbier — from Geneva this takes around 2 hours. A direct bus from Geneva airport operates during ski season. By car, Le Châble is around 1.5 hours from Geneva via the A9 motorway through the Valais.' },
    ],
    verdict: 'Best ski hotel: W Verbier — ski-in ski-out, Four Valleys access, destination spa, 5-star facilities. Best chalet ski experience: Chalet d\'Adrien — intimate luxury, exceptional food, traditional chalet character. Best boutique: Experimental Chalet Verbier.',
    relatedLinks: [
      { label: 'Best luxury hotels in Verbier', href: '/best/luxury-hotels-verbier' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Verbier destination guide', href: '/destinations/verbier' },
    ],
    comparisons: [
      { label: "W Verbier vs Chalet d'Adrien", href: '/compare/w-verbier-vs-chalet-dadrien' },
    ],
  },

  'business-city-hotels-switzerland': {
    title: 'Best Business & City Hotels in Switzerland 2026',
    h1: 'Best Business & City Hotels in Switzerland',
    description: 'Switzerland\'s business hotel market is among the most demanding in Europe — the combination of international institutions in Geneva, financial and corporate headquarters in Zurich, and the federal government in Bern creates a permanent flow of senior business and diplomatic travelers with high expectations and limited tolerance for inconsistency. The hotels listed here have built their reputations on delivering at that level, repeatedly.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Bellevue Palace','Baur au Lac','Four Seasons Hotel des Bergues Geneva','The Dolder Grand','Mandarin Oriental Geneva','Widder Hotel','Park Hyatt Zurich','Mandarin Oriental Savoy Zurich'],
    faqs: [
      { q: 'What are the best business hotels in Switzerland?', a: 'La Réserve Genève leads for Geneva — 3 minutes from the airport, private park, Michelin dining, and the discretion that senior business travel requires. In Zurich, La Réserve Eden au Lac and Baur au Lac are the strongest choices. For diplomatic and government business in Bern, Bellevue Palace has no equivalent — directly opposite the Federal Palace, it is Switzerland\'s official state guesthouse.' },
      { q: 'Geneva or Zurich for business travel?', a: 'Geneva is stronger for international institutions, NGOs, the financial sector with a global mandate, and anyone whose business connects to European or UN structures. Zurich is better for Swiss corporate business, banking, and the technology sector. The two cities are 3 hours apart by train and many business travelers use both on the same trip.' },
      { q: 'What level of meeting facilities do Swiss luxury hotels provide?', a: 'Swiss luxury hotels consistently offer private meeting rooms, AV facilities, private dining, and concierge support calibrated for demanding international guests. La Réserve Genève and Baur au Lac are particularly well regarded for private meetings at the highest level — the kind where discretion matters as much as the meeting room itself.' },
    ],
    verdict: 'Best Geneva business: La Réserve Genève — 3 minutes from Geneva airport, private park, exceptional discretion, Michelin dining. Best Zurich business: La Réserve Eden au Lac — Lake Zurich, boutique scale, Michelin dining. Best for diplomatic stays: Bellevue Palace — Switzerland\'s official government guesthouse, opposite the Federal Palace.',
    relatedLinks: [
      { label: 'Best luxury hotels in Geneva', href: '/best/luxury-hotels-geneva' },
      { label: 'Best luxury hotels in Zurich', href: '/best/luxury-hotels-zurich' },
      { label: 'Best business hotels in Switzerland', href: '/best/business-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'La Réserve Genève vs Four Seasons Hotel des Bergues', href: '/compare/la-reserve-geneve-vs-four-seasons-hotel-des-bergues-geneva' },
    ],
  },

  'family-hotels-switzerland': {
    title: 'Best Family Hotels in Switzerland 2026',
    h1: 'Best Family Hotels in Switzerland',
    description: 'Switzerland is one of the world\'s strongest family travel destinations — safe, reliable, scenically extraordinary, and with a train network that makes moving between destinations genuinely easy with children. The luxury hotels listed here go beyond family-friendly as a marketing term: they have the space, the children\'s programmes, the outdoor access, and the adult facilities that make a family stay work for everyone.',
    hotels: ['Schweizerhof Zermatt','Victoria-Jungfrau Grand Hotel Interlaken','Hotel Adula','Alpengold Hotel','Mont Cervin Palace','Monte Rosa Zermatt','The Alpina Gstaad','Bürgenstock Resort','Grand Resort Bad Ragaz','Fairmont Le Montreux Palace'],
    faqs: [
      { q: 'What are the best family hotels in Switzerland?', a: 'For ski families, Schweizerhof Zermatt suits those who want a car-free village with gentle terrain and family suites. Victoria-Jungfrau in Interlaken is the strongest grand hotel family choice — a full children\'s programme, the largest hotel spa in the region, and the Jungfrau excursions provide days of activity. Hotel Adula in Flims suits families who want outdoor-focused stays with pool, forest, and lake access.' },
      { q: 'Is Switzerland good for a ski holiday with young children?', a: 'Excellent. Swiss ski resorts have very strong ski school infrastructure, designated beginner areas, and car-free villages like Zermatt and Wengen that are significantly safer for young children. The train access to most resorts makes arrival with young children far easier than road-based alternatives.' },
      { q: 'What age range does Switzerland work for family travel?', a: 'Switzerland works across all age ranges. For toddlers and young children: the trains, lakes, and lower-altitude activities are ideal. For children 6-12: skiing, mountain railways, Jungfraujoch, and lake excursions. For teenagers: skiing, hiking, adventure sports in Interlaken, and the social energy of resorts like Verbier.' },
    ],
    verdict: 'Best family ski hotel: Schweizerhof Zermatt — car-free village, family suites, gentle terrain, ski school access. Best family grand hotel: Victoria-Jungfrau — full children\'s programme, 5,500 m² spa for parents, Jungfrau excursions. Best family outdoor hotel: Hotel Adula — outdoor pool, forest trails, Caumasee, 3 restaurants.',
    relatedLinks: [
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best luxury hotels in Interlaken', href: '/best/luxury-hotels-interlaken' },
    ],
    comparisons: [
      { label: 'Schweizerhof Zermatt vs Mont Cervin Palace', href: '/compare/schweizerhof-zermatt-vs-mont-cervin-palace' },
      { label: 'Victoria-Jungfrau vs Grand Hotel Regina', href: '/compare/victoriajungfrau-grand-hotel-interlaken-vs-grand-hotel-regina' },
    ],
  },

  'spa-hotels-switzerland': {
    title: 'Best Spa Hotels in Switzerland 2026',
    h1: 'Best Spa Hotels in Switzerland',
    description: 'Switzerland\'s spa hotel tradition runs deep — the combination of Alpine thermal heritage, clean mountain air, and a hospitality culture that takes wellness seriously has produced some of the most accomplished spa properties in Europe. The best Swiss spa hotels are not simply hotels with spas attached; they are places where the spa programme, the landscape, and the overall experience are genuinely integrated.',
    hotels: ['La Réserve Genève','Victoria-Jungfrau Grand Hotel Interlaken','Hotel Adula','Crans Ambassador','Alpengold Hotel','Mont Cervin Palace','Schweizerhof Zermatt','Bürgenstock Resort','The Dolder Grand','Grand Resort Bad Ragaz'],
    faqs: [
      { q: 'What are the best spa hotels in Switzerland?', a: 'By sheer scale, Victoria-Jungfrau in Interlaken leads with 5,500 m² — one of the largest hotel spas in the country. La Réserve Genève\'s 2,000 m² Spa Nescens is the strongest lakeside spa resort. Crans Ambassador at 1,500m altitude combines ski-in ski-out access with a 1,300 m² spa. Hotel Adula in Flims offers a nature-integrated spa experience with direct forest and lake access.' },
      { q: 'What should I expect from a Swiss luxury spa?', a: 'Swiss luxury spas typically include indoor pools (often with Alpine views), sauna and steam landscapes, hammam, a full treatment menu including Alpine-specific therapies, and wellness programmes of varying lengths. The best properties — La Réserve Genève, Victoria-Jungfrau, Bürgenstock — offer multi-day wellness programmes with medical and nutritional consultation.' },
      { q: 'Which Swiss spa hotel is best for a pure wellness retreat?', a: 'Hotel Adula in Flims is the strongest nature-integrated wellness retreat — forest, lake, and gorge access combined with solid spa facilities in a resort that does not feel dominated by ski culture. La Réserve Genève is the best choice for those who want Michelin-level dining alongside serious spa programming.' },
    ],
    verdict: 'Largest spa: Victoria-Jungfrau — 5,500 m² in Interlaken, one of the biggest hotel spas in Switzerland. Best lakeside spa resort: La Réserve Genève — 2,000 m² Spa Nescens, private park, Michelin dining. Best mountain spa: Crans Ambassador — 1,300 m² at 1,500m altitude with ski-in ski-out access. Best nature-integrated spa: Hotel Adula — Flims forest and Caumasee setting.',
    relatedLinks: [
      { label: 'Best wellness hotels in Flims', href: '/best/wellness-hotels-flims' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'La Réserve Genève vs Victoria-Jungfrau', href: '/compare/la-reserve-geneve-vs-victoriajungfrau-grand-hotel-interlaken' },
      { label: 'Crans Ambassador vs Hotel Adula', href: '/compare/crans-ambassador-vs-hotel-adula' },
    ],
  },

  'luxury-hotels-ascona': {
    title: 'Best Luxury Hotels in Ascona, Switzerland 2026',
    h1: 'Best Luxury Hotels in Ascona',
    description: 'Ascona is a deliberate anomaly in the Swiss landscape — a small, sun-drenched village on Lake Maggiore that has attracted artists, intellectuals, and the quietly wealthy for over a century. The Piazza Motta running directly along the lake is one of the most beautiful public spaces in Switzerland, and the luxury hotels here — Eden Roc and Castello del Sole in particular — understand that their guests are seeking a particular quality of light, water, and unhurried time.',
    region: 'Ascona',
    hotels: ['Eden Roc Ascona','Castello del Sole','Giardino Ascona','Villa Orselina Locarno','Seven Boutique Hotel Ascona'],
    faqs: [
      { q: 'What is the best luxury hotel in Ascona?', a: 'Eden Roc Ascona is the landmark property — a historic lakefront hotel that underwent major restoration and reopened with 95 rooms, five restaurants, and a position directly on Lake Maggiore. Castello del Sole takes a different approach: a wine estate and beach hotel set within private grounds outside the village, combining agricultural heritage with serious wellness and dining.' },
      { q: 'What is Monte Verità in Ascona?', a: 'Monte Verità is the hill directly above Ascona where, from around 1900, a utopian artists\' colony established itself — attracting figures including Hermann Hesse and Rudolf Laban. The site is now a hotel and cultural foundation, and gives Ascona an intellectual and artistic backstory entirely unlike any other Swiss resort.' },
      { q: 'How do I get to Ascona?', a: 'Train to Locarno from Zurich takes around 2.5 hours via the Gotthard, then taxi to Ascona is around 15 minutes. Milan Malpensa airport is around 1.5 hours by road. A seaplane service from Lugano also operates seasonally.' },
    ],
    verdict: 'Best overall: Eden Roc Ascona — 95 rooms directly on Lake Maggiore, 5 restaurants, reopened after major restoration. Best estate experience: Castello del Sole — wine estate, private beach, organic grounds, serious wellness and dining. Best boutique: Giardino Ascona.',
    relatedLinks: [
      { label: 'Ascona destination guide', href: '/destinations/ascona' },
      { label: 'Best luxury hotels in Lugano', href: '/best/luxury-hotels-lugano' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Eden Roc Ascona vs Castello del Sole', href: '/compare/eden-roc-ascona-vs-castello-del-sole' },
    ],
  },

  'luxury-hotels-andermatt': {
    title: 'Best Luxury Hotels in Andermatt, Switzerland 2026',
    h1: 'Best Luxury Hotels in Andermatt',
    description: 'Andermatt\'s reinvention is one of the more remarkable stories in contemporary Swiss hospitality. A historic mountain village at the crossroads of four Alpine passes, it spent much of the 20th century as a quiet garrison town. The arrival of The Chedi Andermatt and a broader resort development programme changed that entirely — today Andermatt offers world-class luxury infrastructure in an Alpine setting that has not yet been worn smooth by decades of mass tourism.',
    region: 'Andermatt',
    hotels: ['The Chedi Andermatt','The Chedi Residences Andermatt','Radisson Blu Reussen Andermatt','The River House Andermatt','Hotel Crown Andermatt'],
    faqs: [
      { q: 'What is the best luxury hotel in Andermatt?', a: 'The Chedi Andermatt is the defining property — Asian-influenced design in an Alpine setting, multiple Michelin-recognised restaurants, a spa with the longest indoor pool in the Alps, and ski-in ski-out access to SkiArena Andermatt-Sedrun. The Radisson Blu Reussen offers a more accessible price point with strong facilities and a central village position.' },
      { q: 'How does Andermatt compare to Zermatt or St. Moritz?', a: 'Andermatt offers comparable luxury infrastructure — in some areas, such as The Chedi\'s spa, exceeding the established resorts — in a setting that still feels like a discovery. Zermatt and St. Moritz carry more history and social cachet; Andermatt offers more space, less crowding, and the particular pleasure of a resort that has not yet peaked.' },
      { q: 'How do I get to Andermatt?', a: 'Around 1 hour 45 minutes from Zurich by train on the Matterhorn Gotthard Bahn via Göschenen. From Lucerne, allow around 1.5 hours. The Gotthard road tunnel makes it accessible by car from both north and south in around 2 hours from Zurich or Lugano.' },
    ],
    verdict: 'Best overall: The Chedi Andermatt — longest indoor pool in the Alps, multiple Michelin-recognised restaurants, exceptional spa, ski-in ski-out to SkiArena Andermatt-Sedrun. Best value luxury: Radisson Blu Reussen — central village position, strong facilities, more accessible rates.',
    relatedLinks: [
      { label: 'Andermatt destination guide', href: '/destinations/andermatt' },
      { label: 'Best ski hotels in Switzerland', href: '/best/ski-hotels-switzerland' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'The Chedi Andermatt vs Radisson Blu Reussen', href: '/compare/the-chedi-andermatt-vs-radisson-blu-reussen-andermatt' },
    ],
  },

  'luxury-hotels-crans-montana': {
    title: 'Best Luxury Hotels in Crans-Montana, Switzerland 2026',
    h1: 'Best Luxury Hotels in Crans-Montana',
    description: 'Crans-Montana sits on a broad south-facing plateau at 1,500m with panoramic views stretching from Mont Blanc to the Matterhorn. The sunshine record here is exceptional, and the resort has developed a luxury hotel offering — anchored by Crans Ambassador and Six Senses — that takes both ski convenience and wellness seriously.',
    region: 'Crans-Montana',
    hotels: ['Crans Ambassador','Six Senses Crans-Montana','LeCrans Hotel & Spa','Hotel Guarda Golf Crans-Montana',"Pas de l'Ours Crans-Montana",'Aïda Hotel & Spa','Chetzeron Hotel'],
    faqs: [
      { q: 'What is the best luxury hotel in Crans-Montana?', a: 'Crans Ambassador is the leading luxury hotel — ski-in ski-out at 1,500m, 56 rooms, a 1,300 m² spa, and three restaurants, with the panoramic Valais view as a constant backdrop. Six Senses Crans-Montana is the strongest choice for travelers who want wellness to be the primary focus rather than ski convenience.' },
      { q: 'What makes Crans-Montana different from other Swiss ski resorts?', a: 'The south-facing plateau position at 1,500m gives Crans-Montana exceptional sunshine — significantly more than the enclosed Alpine valleys of Zermatt or Davos. The panoramic views from Mont Blanc to the Matterhorn are accessible from the resort itself without taking a lift. The Omega European Masters golf course confirms that the resort takes its summer season as seriously as winter.' },
      { q: 'Is Crans-Montana good for a summer visit?', a: 'Yes — the golf course, hiking on the sunny plateau, and the panoramic views make summer genuinely compelling. The Omega European Masters in September is one of Europe\'s finest mountain golf events.' },
    ],
    verdict: 'Best overall: Crans Ambassador — ski-in ski-out at 1,500m, 56 rooms, 1,300 m² spa, 3 restaurants, exceptional Valais panorama. Best wellness focus: Six Senses Crans-Montana — full Six Senses health programming in an Alpine ski setting. Best boutique: LeCrans Hotel & Spa.',
    relatedLinks: [
      { label: 'Best ski hotels in Crans-Montana', href: '/best/ski-hotels-crans-montana' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Crans-Montana destination guide', href: '/destinations/crans-montana' },
    ],
    comparisons: [
      { label: 'Crans Ambassador vs Hotel Guarda Golf Crans-Montana', href: '/compare/crans-ambassador-vs-hotel-guarda-golf-crans-montana' },
    ],
  },

  'luxury-hotels-flims': {
    title: 'Best Luxury Hotels in Flims, Switzerland 2026',
    h1: 'Best Luxury Hotels in Flims',
    description: 'Flims offers a combination that most Swiss resorts cannot replicate: serious skiing across the Weisse Arena domain, a glacial turquoise lake at walking distance, ancient forest, and the Ruinaulta Rhine Gorge — one of Switzerland\'s most dramatic natural features. The luxury hotel offering here is intimate rather than grand, suited to travelers who want quality and natural setting over social scene.',
    region: 'Flims',
    hotels: ['Hotel Adula','The Hide Flims','Parkhotel Waldhaus Flims'],
    faqs: [
      { q: 'What is the best luxury hotel in Flims?', a: 'Hotel Adula is the leading luxury property — a 4-star superior hotel at 1,100m with indoor pool, spa, three restaurants, and direct access to both the ski area and the forest trails to the Caumasee. For travelers who want maximum seclusion, The Hide Flims offers a more private boutique experience.' },
      { q: 'What is the Caumasee in Flims?', a: 'The Caumasee is a small glacial lake above Flims, its water an extraordinary turquoise colour from mineral sediment. It sits within ancient forest about 20 minutes on foot from the village centre and is accessible for swimming in summer. It is one of the most photographed natural sites in Graubünden.' },
      { q: 'How does Flims-Laax compare to Davos for skiing?', a: 'The Weisse Arena (Flims-Laax-Falera) covers 224km of pistes — somewhat smaller than the Parsenn above Davos but with a stronger reputation for snowboard and freestyle terrain. Laax is one of Europe\'s leading freestyle resorts. For traditional Alpine skiing, Davos-Parsenn is more extensive; for variety and snowboard culture, Flims-Laax is the stronger choice.' },
    ],
    verdict: 'Best overall: Hotel Adula — 4-star superior, 92 rooms, indoor pool, spa, 3 restaurants, direct access to Caumasee lake and Rhine Gorge trails. Best for seclusion: The Hide Flims — boutique, private, more intimate wellness atmosphere. Best traditional: Parkhotel Waldhaus Flims — park setting above the village, established hospitality.',
    relatedLinks: [
      { label: 'Best wellness hotels in Flims', href: '/best/wellness-hotels-flims' },
      { label: 'Flims destination guide', href: '/destinations/flims' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Hotel Adula vs Parkhotel Waldhaus Flims', href: '/compare/hotel-adula-vs-parkhotel-waldhaus-flims' },
    ],
  },

  'luxury-hotels-montreux': {
    title: 'Best Luxury Hotels in Montreux, Switzerland 2026',
    h1: 'Best Luxury Hotels in Montreux',
    description: 'Montreux curves around the eastern end of Lake Geneva in a microclimate mild enough for palm trees, sheltered by the Alps to the north and east. The Château de Chillon rises from a rocky island to the east, the Fairmont Palace dominates the lakefront, and the Montreux Jazz Festival — held each July since 1967 — gives the town a cultural credibility that most Swiss resorts cannot claim.',
    region: 'Montreux',
    hotels: ['Fairmont Le Montreux Palace','Le Mirador Resort & Spa Mont-Pelerin','Royal Plaza Montreux','Grand Hotel Suisse Majestic Montreux','Hotel Eden Palace au Lac Montreux','Eurotel Montreux','Hotel Victoria Glion'],
    faqs: [
      { q: 'What is the best luxury hotel in Montreux?', a: 'Fairmont Le Montreux Palace is the defining grand hotel of the Swiss Riviera — open since 1906, directly on Lake Geneva with 236 rooms and multiple restaurants. Le Mirador Resort & Spa on Mont-Pèlerin above the town offers a different proposition: a clifftop position with exceptional lake views, a major spa, and a more resort-style atmosphere removed from the town.' },
      { q: 'What is the Montreux Jazz Festival?', a: 'Founded in 1967 by Claude Nobs, the Montreux Jazz Festival is one of the world\'s most celebrated music events — held across two weeks each July on the shores of Lake Geneva. It has expanded far beyond jazz to encompass rock, soul, blues, and electronic music. Free stages along the lakefront run alongside ticketed arena concerts.' },
      { q: 'How far is Montreux from Geneva and Lausanne?', a: 'Montreux is 25 minutes from Lausanne by direct train and around 1 hour 10 minutes from Geneva. The lakeside rail route between Geneva and Montreux through the Lavaux UNESCO vineyard terraces is one of Switzerland\'s most scenic journeys.' },
    ],
    verdict: 'Best overall: Fairmont Le Montreux Palace — iconic Belle Époque grand hotel on Lake Geneva since 1906, 236 rooms, multiple restaurants, the defining address on the Swiss Riviera. Best for views and spa: Le Mirador Resort & Spa — clifftop above the lake, major spa, resort atmosphere. Best boutique: Royal Plaza Montreux.',
    relatedLinks: [
      { label: 'Montreux destination guide', href: '/destinations/montreux' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Fairmont Le Montreux Palace vs Le Mirador Resort', href: '/compare/fairmont-le-montreux-palace-vs-le-mirador-resort-spa-mont-pelerin' },
    ],
  },
}

function sortPartnersFirst(hotels: any[]) {
  return [...hotels].sort((a, b) => {
    const aPartner = Boolean(a.is_partner) || PARTNER_HOTEL_NAMES.has(a.name)
    const bPartner = Boolean(b.is_partner) || PARTNER_HOTEL_NAMES.has(b.name)
    if (aPartner && !bPartner) return -1
    if (!aPartner && bPartner) return 1
    return (b.star_classification || 0) - (a.star_classification || 0) || (b.nightly_rate_chf || 0) - (a.nightly_rate_chf || 0)
  })
}

function uniqueHotels(hotels: any[]) {
  const seen = new Set<string>()
  return hotels.filter((hotel) => {
    const key = String(hotel.id || hotel.slug || hotel.name)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function getHotelsForPage(page: PromptPageConfig) {
  if (page.hotels) {
    const { data: selectedHotels } = await supabase.from('hotels').select('*').eq('is_active', true).in('name', page.hotels)
    const ranked = page.hotels.map((name) => selectedHotels?.find((h: any) => h.name === name)).filter(Boolean)
    return uniqueHotels(ranked).slice(0, MAX_HOTELS_PER_PAGE)
  }
  if (page.region) {
    let query = supabase.from('hotels').select('*').eq('is_active', true).eq('region', page.region)
    if (page.category) query = query.eq('category', page.category)
    const { data } = await query
    return uniqueHotels(sortPartnersFirst(data || [])).slice(0, MAX_HOTELS_PER_PAGE)
  }
  if (page.category) {
    const { data } = await supabase.from('hotels').select('*').eq('is_active', true).eq('category', page.category)
    return uniqueHotels(sortPartnersFirst(data || [])).slice(0, MAX_HOTELS_PER_PAGE)
  }
  const { data } = await supabase.from('hotels').select('*').eq('is_active', true)
  return uniqueHotels(sortPartnersFirst(data || [])).slice(0, MAX_HOTELS_PER_PAGE)
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
    alternates: { canonical: `https://swissnethotels.com/best/${slug}` },
  }
}

export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = PROMPT_PAGES[slug]
  if (!page) notFound()

  const hotelsList = await getHotelsForPage(page)

  const gold = '#C9A84C'
  const border = 'rgba(201,169,76,0.2)'
  const text = '#1a0e06'
  const textMuted = 'rgba(26,14,6,0.5)'
  const bg = '#F8F5EF'
  const white = '#FFFFFF'
  const pageUrl = `https://swissnethotels.com/best/${slug}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title + ' | SwissNet Hotels',
        description: page.description,
        isPartOf: { '@id': 'https://swissnethotels.com#website' },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        mainEntity: { '@id': `${pageUrl}#list` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://swissnethotels.com' },
          { '@type': 'ListItem', position: 2, name: 'Best Hotels', item: 'https://swissnethotels.com/best' },
          { '@type': 'ListItem', position: 3, name: page.h1, item: pageUrl },
        ]
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#list`,
        name: page.title,
        description: page.description,
        url: pageUrl,
        numberOfItems: hotelsList.length,
        itemListElement: hotelsList.map((h: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Hotel',
            '@id': `https://swissnethotels.com/hotels/${h.slug || h.id}#hotel`,
            name: h.name,
            url: `https://swissnethotels.com/hotels/${h.slug || h.id}`,
            priceRange: h.nightly_rate_chf ? `CHF ${h.nightly_rate_chf}+` : undefined,
            starRating: { '@type': 'Rating', ratingValue: h.star_classification || 5 },
            address: { '@type': 'PostalAddress', addressLocality: h.location, addressCountry: 'CH' },
          }
        }))
      },
      ...(page.faqs.length > 0 ? [{
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: page.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }] : []),
    ]
  }

  return (
    <div style={{ background: bg, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div style={{ background: '#1a0e06', padding: '6rem 2rem 4rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
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
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ {hotelsList.length} Hotels</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ Partner Priority</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ Direct Booking</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>✓ No Fees</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1rem' }}>
              {hotelsList.length} {page.h1}
            </h2>

            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: textMuted, lineHeight: 1.8, margin: '0 0 1.5rem', fontWeight: 300 }}>
              Hotels are selected based on location, category fit, spa and dining strength, direct booking availability, and SwissNet partner data. Partner hotels are featured first where they genuinely match the category.
            </p>

            {page.verdict && (
              <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, margin: '0 0 0.5rem' }}>✦ Editorial Verdict</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: text, lineHeight: 1.8, margin: 0, fontWeight: 300 }}>{page.verdict}</p>
              </div>
            )}

            {hotelsList.length === 0 ? (
              <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted }}>No hotels found for this category yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {hotelsList.map((hotel: any, i: number) => (
                  <div key={hotel.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', gap: 0 }}>
                    <div style={{ width: 56, flexShrink: 0, background: i === 0 ? gold : bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 600, color: i === 0 ? '#1a0e06' : textMuted }}>#{i + 1}</span>
                    </div>
                    {hotel.images?.[0] && (
                      <div style={{ width: 140, flexShrink: 0, overflow: 'hidden' }}>
                        <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: 0 }}>{hotel.name}</h3>
                            {(hotel.is_partner || PARTNER_HOTEL_NAMES.has(hotel.name)) && (
                              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', fontWeight: 700, background: gold, color: '#1a0e06', padding: '2px 8px', borderRadius: 20 }}>✦ Partner</span>
                            )}
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
                        {hotel.nightly_rate_chf && (
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
                            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: gold, margin: 0, lineHeight: 1 }}>CHF {hotel.nightly_rate_chf?.toLocaleString()}</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: textMuted, margin: '0.1rem 0 0' }}>/night</p>
                          </div>
                        )}
                      </div>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, lineHeight: 1.7, margin: '0 0 1rem', fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as CSSProperties}>
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
                          <a href={(hotel.is_partner || PARTNER_HOTEL_NAMES.has(hotel.name)) ? `/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(hotel.direct_booking_url)}&medium=website&campaign=best_page` : hotel.direct_booking_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a0e06', background: gold, padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: 2 }}>
                            Official Website →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {page.relatedLinks && page.relatedLinks.length > 0 && (
              <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Explore Further</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {page.relatedLinks.map((link: any) => (
                    <Link key={link.href} href={link.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: white, border: `1px solid ${border}`, borderRadius: 4, textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{link.label}</span>
                      <span style={{ color: gold }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {page.comparisons && page.comparisons.length > 0 && (
              <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 1rem' }}>Compare Similar Hotels</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {page.comparisons.map((comp: any) => (
                    <Link key={comp.href} href={comp.href} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', background: white, border: `1px solid ${border}`, borderRadius: 4, textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{comp.label}</span>
                      <span style={{ color: gold }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: text, margin: '0 0 1.5rem' }}>Frequently Asked Questions</h2>
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

          <div style={{ position: 'sticky', top: '2rem' }}>
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: '0 0 1rem' }}>Why Official Website?</h3>
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
