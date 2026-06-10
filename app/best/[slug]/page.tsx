

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BestHotelCard from './HotelCard'
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
    description: 'Zermatt\'s luxury hotels divide along a clear axis: historic grand properties that have defined the village for over a century, and a newer generation of boutique hotels that offer the same setting with less ceremony.\n\nThe car-free village means every hotel is walkable to the lifts — ski access is rarely the deciding factor. What varies is atmosphere, scale, and formality. The choice between Mont Cervin Palace and Cervo Mountain Resort is less about skiing and more about what kind of stay you want.',
    region: 'Zermatt',
    hotels: ['Mont Cervin Palace','Monte Rosa Zermatt','Schweizerhof Zermatt','Grand Hotel Zermatterhof','Cervo Mountain Resort','The Omnia','Riffelalp Resort 2222m','Matterhorn Focus Design Hotel','Backstage Hotel Vernissage'],
    faqs: [
      { q: 'Which Zermatt hotel is right for a first visit?', a: 'Mont Cervin Palace is the most complete first-visit choice — central position, full facilities, Matterhorn views, and a grand hotel atmosphere consistent since 1852. Cervo Mountain Resort is the better starting point for travelers who already know they want something more intimate and contemporary.' },
      { q: 'Which hotel has the best ski access?', a: 'Riffelalp Resort 2222m sits at altitude with pistes to the door, accessible by its own rack railway from the village. For village-based stays, Mont Cervin Palace and Schweizerhof Zermatt are both well-positioned for the main lift stations.' },
      { q: 'Is Zermatt better for couples or families?', a: 'Both — differently. Couples tend to choose Cervo Mountain Resort or The Omnia for atmosphere and intimacy. Families tend to prefer Mont Cervin Palace or Schweizerhof Zermatt for their broader facilities and more flexible service. The car-free village works well for both.' },
    ],
    verdict: 'Mont Cervin Palace remains the benchmark: the most complete grand hotel offering in the village, open since 1852, with the Matterhorn on the doorstep. Cervo Mountain Resort is the strongest boutique alternative — smaller, more personal, with food that genuinely stands out. Travelers who want to be on the mountain rather than in the village should look at Riffelalp Resort 2222m. Monte Rosa Zermatt — the oldest hotel in Zermatt, open since 1839 — suits those for whom historical continuity matters more than facilities scale.',
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
    description: 'Zermatt offers an extensive ski area across three linked valleys with year-round glacier skiing at high altitude — and every hotel in the car-free village is within walking distance of the lift network. The question for ski-focused travelers is not access but atmosphere: whether you want a grand hotel base, a boutique ski lodge, or a high-altitude property that puts you directly on the mountain.',
    region: 'Zermatt',
    category: 'Ski Resort',
    hotels: ['Mont Cervin Palace','Monte Rosa Zermatt','Schweizerhof Zermatt','Grand Hotel Zermatterhof','Cervo Mountain Resort','The Omnia','Riffelalp Resort 2222m','Matterhorn Focus Design Hotel','Backstage Hotel Vernissage'],
    faqs: [
      { q: 'Which is the best ski hotel in Zermatt?', a: 'For the full grand hotel ski experience, Mont Cervin Palace is the strongest choice — central, complete, with a large spa for après-ski recovery. For the most direct ski access, Riffelalp Resort 2222m sits at altitude with pistes to the door. For a boutique ski lodge, Cervo Mountain Resort combines strong food with a more personal atmosphere.' },
      { q: 'Does Zermatt have year-round skiing?', a: 'Yes — Zermatt offers glacier skiing at high altitude, making it one of the very few resorts in Europe with reliable year-round skiing. Summer skiing is available on the glacier from June onwards.' },
      { q: 'Is Zermatt better for skiing than St. Moritz?', a: 'Both are world-class but suit different skiers. Zermatt\'s ski area is slightly larger and the Matterhorn backdrop gives it an emotional quality St. Moritz does not match. St. Moritz has more variety across three separate areas and a stronger social scene. Zermatt suits those for whom the skiing and the mountain are the primary draw.' },
    ],
    verdict: 'Riffelalp Resort 2222m has the most direct ski access — on-mountain position, its own rack railway from the village. Mont Cervin Palace is the strongest grand hotel ski base — central village, full facilities, large spa. Cervo Mountain Resort is the best boutique ski lodge — intimate scale, strong food, contemporary Alpine character.',
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
    description: 'Geneva\'s luxury hotels divide into two types and the distinction matters more here than in most cities.\n\nThe city-centre lakefront hotels — Four Seasons Hotel des Bergues, Beau-Rivage, Mandarin Oriental, The Woodward — sit within walking distance of the old town and the Jet d\'Eau. They suit travelers who want to move through the city on foot.\n\nLa Réserve Genève operates on different terms: a resort hotel within a private park on the lake shore, around 5km from the centre. It offers seclusion, a large spa, and a stay that does not require engaging with the city at all. The right choice depends entirely on why you are in Geneva.',
    region: 'Geneva',
    hotels: ['La Réserve Genève','Four Seasons Hotel des Bergues Geneva','Beau-Rivage Geneva','Mandarin Oriental Geneva','The Ritz-Carlton Hotel de la Paix Geneva','Hotel President Wilson Geneva','The Woodward Geneva',"Hotel d'Angleterre Geneva",'InterContinental Geneva','Fairmont Grand Hotel Geneva'],
    faqs: [
      { q: 'La Réserve Genève or a city-centre hotel?', a: 'La Réserve suits travelers who want a resort experience — private park, large spa, seclusion, strong dining — without needing the city on their doorstep. The city-centre hotels suit those who want to walk to the old town, the Jet d\'Eau, and the main lakefront streets directly from their hotel. Both are on the lake; the difference is urban access versus resort privacy.' },
      { q: 'Which Geneva hotel works best for business travel?', a: 'La Réserve Genève is the strongest choice for senior business travelers who value discretion — it sits close to Geneva Airport and away from the city\'s tourist activity. For those who need to be in the city for meetings, Four Seasons Hotel des Bergues and Mandarin Oriental Geneva are the most established lakefront addresses for business.' },
      { q: 'Is Geneva a practical base for skiing?', a: 'Yes — Geneva Airport is one of the most efficient entry points for western Swiss and French Alpine skiing. Verbier is around 2 hours by road or train. Chamonix is approximately 1.5 hours by car. Many ski travelers use Geneva as their arrival point even when staying in the mountains.' },
    ],
    verdict: 'La Réserve Genève is the strongest overall choice for travelers who want a self-contained resort experience — private park, large spa, serious dining, away from the urban centre. Four Seasons Hotel des Bergues is the most established city-centre address, on the Rhône since 1834. Beau-Rivage Geneva offers something the branded hotels cannot: independent, family-owned character on the lakefront since 1865. The Woodward suits travelers who want more contemporary design and a stronger food and bar focus.',
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
    description: 'The choice of Zurich luxury hotel is largely determined by where you want to be based.\n\nThe southern lakefront holds the strongest addresses — La Réserve Eden au Lac and Baur au Lac both occupy prime lake positions within walking distance of Bahnhofstrasse. The Widder Hotel occupies nine interconnected medieval townhouses in the old town, better for travelers who want the historic centre rather than the water. The Dolder Grand sits above the city on a hillside — more resort than city hotel, suited to those who want panoramic views and a major spa at a slight remove from the centre.\n\nAll four positions have distinct advantages. The question is which matches your priorities.',
    region: 'Zurich',
    hotels: ['La Réserve Eden au Lac Zurich','Baur au Lac','The Dolder Grand','Widder Hotel','Park Hyatt Zurich','Mandarin Oriental Savoy Zurich','Storchen Zurich','Neues Schloss Zurich','Atlantis by Giardino'],
    faqs: [
      { q: 'La Réserve Eden au Lac or Baur au Lac?', a: 'La Réserve suits design-conscious travelers who want a boutique lakeside experience — 40 rooms, contemporary interiors, serious dining. Baur au Lac suits those who want the most established grand hotel address in the city — a lakeside park, traditional Swiss luxury, family-owned since 1844. Both are on the lake; the difference is boutique contemporary versus classic grand hotel.' },
      { q: 'Which Zurich hotel works best for a business stay?', a: 'La Réserve Eden au Lac and Baur au Lac are the strongest business addresses — lakeside, close to the financial district, with private dining options. Park Hyatt Zurich suits those who want to be close to the main station and conference infrastructure. The Dolder Grand suits business travelers who prefer a quieter base above the city.' },
      { q: 'Is The Dolder Grand worth staying at if you want to be in the city?', a: 'For travelers who want a resort-style experience — major spa, panoramic views, art-filled interiors — the hotel runs a car service and is around 10 minutes from the centre. For those who want to walk everywhere, the lakefront hotels are the practical choice. The Dolder is right if the spa and the views are what you are coming for.' },
    ],
    verdict: 'La Réserve Eden au Lac is the most design-forward choice — boutique scale, lakeside position, strong food programme, contemporary interiors. Baur au Lac is the city\'s most established address — grand hotel tradition, lakeside park, consistent across decades. The Dolder Grand is the resort option above the city — major spa, panoramic views, the strongest wellness offering of the three. For old-town immersion, the Widder Hotel has no comparable alternative in the historic centre.',
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
    description: 'Interlaken sits between Lake Thun and Lake Brienz with the Eiger, Mönch and Jungfrau rising directly to the south. What distinguishes it from other Swiss resort towns is the combination of grand hotel heritage and genuine outdoor access — the Victoria-Jungfrau has been operating since 1865, yet within thirty minutes you can be at the base of one of the most famous mountain faces in the Alps.\n\nThe town itself has two distinct layers: a high-volume day-tourist centre, and a quieter grand hotel zone around the Höhematte meadow where the Victoria-Jungfrau anchors a different kind of stay entirely.',
    region: 'Interlaken',
    hotels: ['Victoria-Jungfrau Grand Hotel Interlaken','Lindner Grand Hotel Beau Rivage Interlaken','Hotel Royal St Georges Interlaken','Grand Hotel Regina'],
    faqs: [
      { q: 'Is the Victoria-Jungfrau worth the premium over other Interlaken hotels?', a: 'For travelers who want a grand hotel experience in the Jungfrau region, yes — there is no comparable alternative in the same category in Interlaken. The spa scale, the Michelin-starred restaurant, and the Belle Époque setting are not replicated elsewhere in the town. For those who want lake views over Jungfrau views, Lindner Beau Rivage on Lake Thun offers a quieter alternative at a lower price point.' },
      { q: 'Should I stay in Interlaken or go up to Grindelwald or Wengen?', a: 'Interlaken suits travelers who want a valley base with easy train access to multiple areas — Grindelwald, Wengen, Lauterbrunnen, Thun, and Bern are all within 30-50 minutes. Grindelwald suits those who want to be directly at the ski area. Wengen suits those who want a car-free mountain village closer to the slopes.' },
      { q: 'Is Interlaken only for adventure sports?', a: 'No — the grand hotels, lake excursions, mountain railways, and access to car-free villages like Wengen and Mürren make it equally compelling for travelers with no interest in adrenaline activities. The adventure sports reputation is just one layer.' },
    ],
    verdict: 'Victoria-Jungfrau is the only real grand hotel choice in Interlaken — open since 1865, with a large spa, Michelin-starred restaurant, and direct Jungfrau views. Lindner Grand Hotel Beau Rivage is the strongest alternative for travelers who want lake views and a quieter atmosphere. Grand Hotel Regina in nearby Grindelwald suits those who want to be closer to the ski area.',
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
    description: 'Bern is the most underestimated city in Switzerland. The UNESCO-listed old town is one of Europe\'s most intact medieval city centres — 6 kilometres of arcaded walkways arranged on a peninsula above a dramatic bend in the Aare river. For luxury travelers, Bern offers a different register to the resort towns: more residential, more local, and carrying the quiet weight of a city where Swiss policy is made.\n\nThe luxury hotel market here is deliberately limited — two properties of real note, each with a distinct positioning.',
    region: 'Bern',
    hotels: ['Bellevue Palace','Hotel Schweizerhof Bern'],
    faqs: [
      { q: 'Is Bellevue Palace worth the premium in Bern?', a: 'For travelers who want the full Swiss capital experience — the political setting, the Alpine views, the official guesthouse history — yes, without question. For travelers who primarily want a comfortable central base and good dining without the institutional weight, Hotel Schweizerhof Bern delivers comparable quality at a more accessible price point.' },
      { q: 'Why visit Bern rather than Zurich or Geneva?', a: 'Bern offers something neither delivers: a genuinely Swiss urban experience that has not been heavily internationalised. The old town feels lived-in rather than curated, the pace is slower, and the combination of political history, river scenery, and medieval architecture creates a character entirely its own.' },
      { q: 'How many nights does Bern need?', a: 'Two nights is comfortable — the old town arcades, Federal Palace, Aare panorama from the Rose Garden, and the Kunstmuseum in one day. A second day allows a half-day trip to Interlaken or a slower exploration of the museum quarter. Three nights suits travelers who want to use Bern as a base for the wider region.' },
    ],
    verdict: 'Bellevue Palace is the definitive choice for the Swiss capital experience — directly opposite the Federal Palace, Aare and Alps views, Switzerland\'s official state guesthouse since 1913. Hotel Schweizerhof Bern is the stronger choice for travelers who want a central old-town position with a slightly less formal atmosphere and more accessible rates.',
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
    description: 'The best ski hotels are not simply good hotels near a ski area. They are properties that understand what ski guests actually need: early breakfast, equipment storage and drying, a ski concierge who handles lift passes and lessons, and recovery facilities — spa and pool — designed for physical use rather than decoration.\n\nThe hotels on this list are distributed across Switzerland\'s main ski destinations — Zermatt, Crans-Montana, Davos, Gstaad, Andermatt, St. Moritz — each with a different resort character. Choosing between them means first choosing which resort suits you, then which hotel within it.',
    hotels: ['Mont Cervin Palace','Monte Rosa Zermatt','Schweizerhof Zermatt','Crans Ambassador','Alpengold Hotel',"Badrutt's Palace Hotel",'The Chedi Andermatt','The Alpina Gstaad','Kulm Hotel St. Moritz','Suvretta House'],
    faqs: [
      { q: 'Which Swiss ski resort has the strongest luxury hotel offering?', a: 'Zermatt has the most concentrated collection of long-established luxury ski hotels — Mont Cervin Palace, Schweizerhof Zermatt, Monte Rosa — all within the car-free village. St. Moritz has the most prestigious grand hotel addresses. Crans Ambassador in Crans-Montana offers the strongest ski-in ski-out access. The Chedi Andermatt is the most architecturally distinctive ski hotel in the country.' },
      { q: 'What separates a good ski hotel from a good hotel near skiing?', a: 'Practical infrastructure matters most: a dedicated ski concierge, heated boot rooms, flexible early breakfast, and a spa oriented toward recovery. The hotels on this list have most of these in place. A beautiful lobby with no boot room or ski storage quickly loses its appeal after a long day on the mountain.' },
      { q: 'Which Swiss ski hotel works best for families?', a: 'Schweizerhof Zermatt is the strongest family ski hotel — car-free village for safety, gentle nearby terrain, family suite options, and full hotel infrastructure. Alpengold Hotel in Davos also works well for families who want a spacious resort with good ski school access.' },
    ],
    verdict: 'Mont Cervin Palace is the benchmark grand hotel ski experience in Zermatt — central position, full facilities, open since 1852. Crans Ambassador has the strongest direct slope access on this list, ski-in ski-out at 1,500m in Crans-Montana. The Chedi Andermatt stands apart architecturally — Asian-influenced design, serious spa, high-alpine skiing — and is the right choice for travelers who want something genuinely different from a traditional Alpine ski hotel. Badrutt\'s Palace in St. Moritz remains the most prestigious ski hotel address in Switzerland for those who want the full grand season experience.',
    relatedLinks: [
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best ski hotels in Zermatt', href: '/best/ski-hotels-zermatt' },
      { label: 'Best ski hotels in Davos', href: '/best/ski-hotels-davos' },
      { label: 'Best ski hotels in Crans-Montana', href: '/best/ski-hotels-crans-montana' },
    ],
    comparisons: [
      { label: 'Alpengold Hotel vs Steigenberger Grandhotel Belvédère', href: '/compare/alpengold-hotel-vs-steigenberger-grandhotel-belvedere' },
    ],
  },

  'lake-hotels-switzerland': {
    title: 'Best Lake Hotels in Switzerland 2026',
    h1: 'Best Lake Hotels in Switzerland',
    description: 'Switzerland\'s lakes are among the most beautiful in Europe, and the hotels built to face them are among the country\'s finest. From Lake Geneva\'s grand lakeside palaces to the more intimate shores of Lake Maggiore in Ticino, the range spans resort estates, clifftop retreats, and historic waterfront properties.\n\nWhat unites the strongest entries on this list is a quality that interior design alone cannot manufacture: the particular light on water backed by mountains, present from the room and from the terrace, throughout the stay.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Bürgenstock Resort','Beau-Rivage Palace Lausanne','Fairmont Le Montreux Palace','Eden Roc Ascona','Castello del Sole','Grand Hotel Villa Castagnola Lugano','Grand Hotel Vitznauerhof Lucerne','Beau-Rivage Geneva'],
    faqs: [
      { q: 'Which Swiss lake has the best luxury hotels?', a: 'Lake Geneva has the strongest concentration — La Réserve Genève, Beau-Rivage Palace Lausanne, Fairmont Le Montreux Palace, and several grand hotels in the city. Lake Zurich has La Réserve Eden au Lac and Baur au Lac. Lake Lucerne has Mandarin Oriental Palace Luzern and Bürgenstock Resort. Lake Maggiore has Eden Roc Ascona and Castello del Sole.' },
      { q: 'What is the best lake hotel for a honeymoon?', a: 'La Réserve Genève is the strongest choice — private park, large spa, serious dining, and a seclusion the city-centre hotels cannot match. Eden Roc Ascona on Lake Maggiore is the best alternative for travelers who want a more Mediterranean atmosphere.' },
      { q: 'La Réserve Genève or Beau-Rivage Palace Lausanne?', a: 'La Réserve is a resort hotel — private park, seclusion, spa-focused, removed from the city. Beau-Rivage Palace Lausanne is a city lakefront grand hotel — directly on Lausanne\'s lakefront, within the city, better for travelers who want urban access alongside the lake. Different propositions for different travel purposes.' },
    ],
    verdict: 'La Réserve Genève is the strongest lakeside resort — private park on Lake Geneva, large spa, serious dining. La Réserve Eden au Lac brings boutique design to Lake Zurich in 40 rooms. Bürgenstock Resort occupies a clifftop above Lake Lucerne with panoramic Alpine views unavailable from any lakefront property. Eden Roc Ascona and Castello del Sole are the strongest choices on Lake Maggiore, each with a completely different character.',
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
    description: 'Switzerland\'s most romantic hotels share a quality that is difficult to manufacture: a setting that does the work before you arrive. Whether it is the Matterhorn framed through a bedroom window in Zermatt, a private terrace above Lake Geneva at dusk, or a suite in a Belle Époque palace with Alpine views on every side, the country\'s finest romantic hotels understand that scenery and seclusion matter more than amenity lists.\n\nThe hotels on this list are selected for atmosphere and emotional fit first — facilities second.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Mont Cervin Palace','Victoria-Jungfrau Grand Hotel Interlaken','Schweizerhof Zermatt','Monte Rosa Zermatt','The Alpina Gstaad',"Badrutt's Palace Hotel",'Eden Roc Ascona','Beau-Rivage Palace Lausanne'],
    faqs: [
      { q: 'What is the most romantic hotel in Switzerland?', a: 'La Réserve Genève is the strongest lakeside romantic choice — private park, spa designed for couples, serious dining, and a seclusion that city-centre hotels cannot replicate. For Alpine romance, Mont Cervin Palace in Zermatt is difficult to surpass: the Matterhorn visible from the village, car-free streets, and a grand hotel atmosphere welcoming couples since 1852.' },
      { q: 'Which Swiss hotel is best for a honeymoon?', a: 'La Réserve Genève and Mont Cervin Palace are the two strongest honeymoon choices depending on whether you prefer lakeside or Alpine settings. Monte Rosa Zermatt — the most intimate of the Zermatt grand hotels — suits couples who want something smaller and more personal. Eden Roc Ascona suits those who want a Mediterranean atmosphere on Lake Maggiore.' },
      { q: 'Is Switzerland good for a romantic winter break?', a: 'Winter is arguably Switzerland\'s strongest season for romantic stays. Snow-covered villages, fireplaces, spa rituals after skiing, and the particular quality of Alpine light in December and January create an atmosphere that summer cannot replicate. Zermatt, Gstaad, and St. Moritz are the strongest choices.' },
    ],
    verdict: 'La Réserve Genève is the strongest romantic resort choice — private lakeside park, couples spa, serious dining, genuine seclusion. For Alpine romance, Mont Cervin Palace has the setting and history. Monte Rosa Zermatt is the most intimate option in Zermatt — the oldest hotel in the village, with a personal atmosphere that larger properties cannot manufacture. Eden Roc Ascona suits couples who want the Mediterranean over the Alps.',
    relatedLinks: [
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best spa hotels in Switzerland', href: '/best/spa-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Schweizerhof Zermatt vs Monte Rosa Zermatt', href: '/compare/schweizerhof-zermatt-vs-monte-rosa-zermatt' },
    ],
  },

  'luxury-hotels-switzerland': {
    title: 'Best Luxury Hotels in Switzerland 2026',
    h1: 'Best Luxury Hotels in Switzerland',
    description: 'Switzerland\'s luxury hotel market spans two distinct traditions. The historic grand hotels — Victoria-Jungfrau in Interlaken, Mont Cervin Palace in Zermatt, Bellevue Palace in Bern — are large-scale, formal, and deeply rooted in 19th-century hospitality. A second generation — La Réserve Genève, La Réserve Eden au Lac Zurich — brings contemporary design and resort programming to Swiss luxury without that formality.\n\nThe hotels listed here cover both traditions across the country\'s main destinations. The right choice depends first on destination, then on the type of stay you want within it.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Mont Cervin Palace','Victoria-Jungfrau Grand Hotel Interlaken','Bellevue Palace','Hotel Adula','Alpengold Hotel','Crans Ambassador','Schweizerhof Zermatt','Monte Rosa Zermatt'],
    faqs: [
      { q: 'How do I choose between Swiss luxury hotels across different destinations?', a: 'Destination comes before hotel. Ski resorts — Zermatt, Crans-Montana, Davos — suit winter-focused stays. Lake and city hotels — Geneva, Zurich, Lucerne — work year-round. Nature destinations — Flims, Interlaken — suit travelers who want outdoor access alongside serious accommodation. Once the destination is clear, the hotel choice within it narrows quickly.' },
      { q: 'Which Swiss luxury hotel is best for a honeymoon?', a: 'La Réserve Genève is the strongest choice for a lakeside resort honeymoon — private park, large spa, serious dining, genuine seclusion. For an Alpine village honeymoon, Mont Cervin Palace or Schweizerhof Zermatt are the main options, both with Matterhorn views. Monte Rosa Zermatt is the most intimate of the Zermatt grand hotels. The choice depends on whether you prefer lake or mountain.' },
      { q: 'Are Swiss luxury hotels good value compared to other European destinations?', a: 'They are among the most expensive in Europe at the five-star level. The premium reflects the Swiss cost base, infrastructure quality, and consistent demand. The gap between expectation and delivery is generally small — service reliability and setting quality hold up well. Travelers who prioritise value find better options elsewhere; those who prioritise consistency tend to find Switzerland worth it.' },
    ],
    verdict: 'La Réserve Genève is the strongest resort luxury option — private lakeside park, serious spa, strong dining, close to Geneva Airport. La Réserve Eden au Lac brings boutique design and serious food to Lake Zurich in 40 rooms. Mont Cervin Palace remains the most complete traditional grand hotel in a Swiss ski resort. Victoria-Jungfrau in Interlaken has one of the largest hotel spas in the country alongside Belle Époque grand hotel character. Bellevue Palace in Bern occupies a category of its own — Switzerland\'s official state guesthouse, directly opposite the Federal Palace, open since 1913.',
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
    description: 'Switzerland\'s business hotel market is anchored by Geneva and Zurich — two cities that between them host more international institutions, multinationals, and financial firms than almost anywhere else in Europe. The hotels that serve this market have developed a particular style: discreet, efficient, and capable of delivering consistently at the highest level without requiring guests to think about it.\n\nBern adds a third dimension for diplomatic and government travel — a category in which Bellevue Palace has no Swiss equivalent.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Bellevue Palace','Baur au Lac','Four Seasons Hotel des Bergues Geneva','The Dolder Grand','Mandarin Oriental Geneva','Widder Hotel','Park Hyatt Zurich','Mandarin Oriental Savoy Zurich'],
    category: 'City Luxury',
    faqs: [
      { q: 'Which Swiss city is best for business travel?', a: 'Geneva and Zurich serve different business purposes. Geneva is the stronger choice for international institutions, NGOs, financial services, and any business with a European or global mandate. Zurich is better for Swiss corporate business, banking, and the technology sector. Bern is essential for anything involving the Swiss federal government.' },
      { q: 'La Réserve Genève or a central Geneva hotel for business?', a: 'La Réserve suits senior business travelers who value discretion and proximity to the airport. For those who need to be in the city for multiple meetings on foot, Four Seasons Hotel des Bergues and Mandarin Oriental Geneva are more practical — central, walkable to the main commercial and institutional areas.' },
      { q: 'Do Swiss luxury hotels have good meeting facilities?', a: 'Yes — Swiss luxury hotels consistently offer private meeting rooms, AV facilities, private dining, and concierge support calibrated for demanding international guests. La Réserve Genève and Baur au Lac are particularly well regarded for discreet private meetings where confidentiality matters as much as the room itself.' },
    ],
    verdict: 'La Réserve Genève leads for Geneva business — close to the airport, private park, exceptional discretion, serious dining. For city-centre Geneva meetings, Four Seasons Hotel des Bergues is the most established address. La Réserve Eden au Lac and Baur au Lac are the strongest Zurich business hotels — both lakeside, both close to the financial district. Bellevue Palace in Bern is in a category of its own for diplomatic and government travel.',
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
    description: 'Flims offers a wellness setting that most Swiss resorts cannot replicate: ancient forest, a glacial turquoise lake, and the Ruinaulta Rhine Gorge within walking distance of the hotels. The combination of natural environment and spa infrastructure makes it one of Switzerland\'s most compelling nature-based wellness destinations — without the social pressure of better-known resort towns.',
    region: 'Flims',
    hotels: ['Hotel Adula','The Hide Flims','Parkhotel Waldhaus Flims'],
    faqs: [
      { q: 'What is the best wellness hotel in Flims?', a: 'Hotel Adula is the leading wellness property — a 4-star superior hotel at 1,100m with indoor pool, spa, three restaurants, and direct access to the Caumasee lake trails and Rhine Gorge walks. The combination of spa facilities and natural landscape access makes it the strongest all-round wellness choice in the region.' },
      { q: 'Why is Flims particularly good for wellness?', a: 'Flims combines elements that most wellness destinations offer separately: forest bathing in ancient woodland, lake swimming at the Caumasee, dramatic gorge hiking, and on-site spa treatments. The Weisse Arena ski area means it functions year-round rather than as a seasonal wellness escape.' },
      { q: 'Flims or Davos for a wellness stay?', a: 'Flims suits travelers who want nature and landscape as the primary wellness context — the forest, the lake, and the gorge are all walking distance. Davos suits those who want a more functional resort with stronger ski infrastructure alongside wellness facilities. Flims is quieter and more nature-immersive; Davos is larger and better equipped for longer stays.' },
    ],
    verdict: 'Hotel Adula is the anchor of the Flims wellness offer — indoor pool, spa, three restaurants, direct Caumasee and gorge access. The Hide Flims is the right choice for travelers who want a more private, boutique wellness experience. Parkhotel Waldhaus offers a traditional grand hotel atmosphere set within its own park above the village.',
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
    description: 'Crans-Montana sits on a south-facing plateau at 1,500m with panoramic views stretching from Mont Blanc to the Matterhorn. The ski hotels here benefit from that elevation and aspect — ski-in ski-out is genuinely achievable for the best-positioned properties, and the plateau\'s open terrain suits a wider range of skiers than more enclosed Alpine valleys.\n\nThe resort also has a stronger wellness hotel offering than most Swiss ski destinations, making it a practical choice for mixed groups where not everyone is skiing.',
    region: 'Crans-Montana',
    hotels: ['Crans Ambassador','Six Senses Crans-Montana','LeCrans Hotel & Spa','Hotel Guarda Golf Crans-Montana',"Pas de l'Ours Crans-Montana",'Aïda Hotel & Spa','Chetzeron Hotel'],
    faqs: [
      { q: 'Crans Ambassador or Six Senses — which is right for me?', a: 'Crans Ambassador suits travelers for whom ski access and a full-service Alpine hotel are the priorities — ski-in ski-out, large spa, three restaurants. Six Senses suits travelers for whom wellness programming is the primary draw — the Six Senses health approach in an Alpine ski setting is a genuinely distinctive combination.' },
      { q: 'How does Crans-Montana compare to Zermatt for skiing?', a: 'Crans-Montana is sunnier, more open, and on a plateau that gives a different quality of light and space compared to Zermatt\'s enclosed valley. Zermatt is higher, car-free, and defined by the Matterhorn. Crans-Montana suits travelers who want sunshine, panoramic views, and a ski area suitable for all levels; Zermatt suits those for whom the mountain and its peak are the main draw.' },
      { q: 'Is Crans-Montana good for non-skiers?', a: 'Yes — the sunshine, spa hotels, walking paths on the plateau, and golf course make it one of Switzerland\'s more versatile resorts. The panoramic views from 1,500m are accessible without skiing, and several properties have strong spa and wellness programmes designed as standalone experiences.' },
    ],
    verdict: 'Crans Ambassador has the strongest ski-in ski-out position on the plateau — large spa, three restaurants, the most complete full-service ski hotel in the resort. Six Senses Crans-Montana is the right choice for wellness-first travelers who also want ski access. LeCrans Hotel & Spa is the strongest boutique option — smaller scale, strong food, chalet character.',
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
    description: 'Davos sits at around 1,560m in the Graubünden Alps and the Parsenn ski area above it is one of the most extensive in Switzerland, with runs descending through varied terrain to Klosters. The luxury ski hotels here have been shaped by decades of demanding international visitors — the WEF effect has ensured that service standards remain high year-round, not only during the conference season.',
    region: 'Davos',
    hotels: ['Alpengold Hotel','Steigenberger Grandhotel Belvédère','Hard Rock Hotel Davos','Precise Tale Seehof Davos'],
    faqs: [
      { q: 'Alpengold Hotel or Steigenberger Belvédère — which suits me better?', a: 'Alpengold suits travelers who want contemporary design, a strong spa, and direct ski access in a property that feels genuinely of its environment. Steigenberger Belvédère suits those who want classical grand hotel atmosphere and historic continuity — it has been operating since 1875. Both have direct or near-direct Parsenn access; the choice is one of design philosophy.' },
      { q: 'Is the Davos ski area comparable to Zermatt?', a: 'The Parsenn ski area linked to Davos and Klosters is one of the most extensive in Switzerland — broadly comparable in scale to Zermatt. The terrain is more varied and the atmosphere less social than St. Moritz. Davos suits serious skiers who want extensive terrain and strong hotel infrastructure without the social-scene overlay of the more famous resorts.' },
      { q: 'When should I avoid Davos during ski season?', a: 'Late January during the World Economic Forum is not ideal — security is extensive, rates peak significantly, and some areas are restricted. Early January and February offer the same skiing with a considerably more relaxed atmosphere.' },
    ],
    verdict: 'Alpengold Hotel is the strongest luxury ski choice in Davos — distinctive organic architecture, large spa, multiple restaurants, direct Parsenn access. Steigenberger Grandhotel Belvédère is the right choice for those who want a classical grand hotel atmosphere that has been consistent since 1875. Both are strong; the choice is design sensibility.',
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
      { q: 'What is the best luxury hotel in Davos?', a: 'Alpengold Hotel is the defining luxury property — a 5-star hotel with a distinctive organic architecture, a large spa, six restaurants, and direct access to the Parsenn ski area. The design sets it apart from traditional Alpine grand hotels; it feels genuinely of its environment without being rustic.' },
      { q: 'Is Davos worth visiting outside ski season?', a: 'Yes — Davos in summer is genuinely underrated. The mountain biking trails, lake swimming, hiking in the Dischma and Flüela valleys, and the Davos Festival offer a completely different quality of experience. The hotels are quieter, rates are lower, and the landscape is arguably more beautiful in summer.' },
      { q: 'Davos or Klosters?', a: 'Davos and Klosters share the same ski area but feel completely different. Klosters is smaller, quieter, and more discreet — traditionally preferred by guests who want privacy and a chalet-village atmosphere. Davos is larger, more functional, and better equipped for longer stays. They are around 10 minutes apart by train.' },
    ],
    verdict: 'Alpengold Hotel is the most distinctive luxury address in Davos — organic pinecone-inspired architecture, large spa, six restaurants, direct Parsenn access. Steigenberger Grandhotel Belvédère is the right choice for travelers who want classical grand hotel character in a property that has been operating since 1875.',
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
    description: 'Gstaad has cultivated its reputation carefully. Where St. Moritz announces itself, Gstaad withholds — the village is small, the chalet architecture strictly enforced, and the atmosphere resolutely against anything that feels like mass tourism.\n\nThe result is a resort that has attracted a remarkably consistent clientele for over a century. The skiing across the Gstaad Mountain Rides area is real but secondary — Gstaad is more about the lifestyle than the pistes, and both flagship hotels understand this.',
    region: 'Gstaad',
    hotels: ['The Alpina Gstaad','Palace Hotel Gstaad','Le Grand Bellevue Gstaad','Ultima Gstaad','Grand Hotel Park Gstaad','Lenkerhof Gourmet Spa Resort','Ermitage Golf & Spa Gstaad','Hotel Olden Gstaad','HUUS Gstaad','The Alpina Gstaad Residences'],
    faqs: [
      { q: 'The Alpina Gstaad or Palace Hotel — which is right for me?', a: 'The Alpina suits travelers who want contemporary design, serious multi-restaurant dining, and a spa operating at international standard. Palace Hotel suits those who want the historic grand hotel experience — the architecture, the long-established staff, the sense of continuity. Both are among Switzerland\'s finest; the choice is one of atmosphere rather than quality.' },
      { q: 'How exclusive is Gstaad?', a: 'The exclusivity is structural rather than performed. Strict building regulations prevent overdevelopment. The village scale limits visitor numbers naturally. The discretion culture discourages social performance. Gstaad does not market itself heavily — its reputation has been maintained by word of mouth among a consistent clientele for over a century.' },
      { q: 'Is Gstaad worth visiting in summer?', a: 'Yes — the Menuhin Festival in July is a genuine cultural event of international standing. Hiking across the four-valley area, golf, tennis, and the village atmosphere without ski-season crowds make summer a legitimate alternative. Both flagship hotels operate year-round.' },
    ],
    verdict: 'The Alpina Gstaad is the stronger choice for contemporary design, exceptional dining, and a spa that operates at serious international standard. Palace Hotel is the right choice for the historic grand hotel experience — the fairy-tale architecture, long-established staff, and sense of Alpine continuity no newer property can replicate. Le Grand Bellevue offers a design-forward boutique alternative. Ultima Gstaad suits travelers who want maximum privacy in a residence-style setting.',
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
    description: 'Lugano is Switzerland\'s most genuinely Mediterranean city — Italian-speaking, sun-drenched, and built around a lake that rewards time spent at the water\'s edge. The luxury hotels here concentrate along the lakefront but in different positions: estate seclusion east of the centre at Villa Castagnola, or promenade proximity in the city at Splendide Royal.\n\nThe choice between them is less about quality than about what kind of stay you want.',
    region: 'Lugano',
    hotels: ['Grand Hotel Villa Castagnola Lugano','Hotel Splendide Royal Lugano','The View Lugano','Hotel Principe Leopoldo Lugano'],
    faqs: [
      { q: 'Villa Castagnola or Hotel Splendide Royal?', a: 'Villa Castagnola suits travelers who want a self-contained estate — private gardens, lakefront access, serious dining, and seclusion from the city. Splendide Royal suits those who want to be on the Lungolago promenade with immediate access to the old town piazzas. Both are historic lakefront properties; the choice is estate privacy versus central position.' },
      { q: 'How does Lugano compare to Ascona?', a: 'Lugano is a functioning city — urban energy, a financial district, cultural infrastructure, and a lakefront that balances tourism with local life. Ascona is a village — deliberately small, resort-focused, better for travelers who want to disappear into a beautiful setting with minimal urban distraction. Many travelers combine both on the same trip.' },
      { q: 'When is the best time to visit Lugano?', a: 'April to October is the operative season. May and June offer the best combination of mild temperatures, flowering lakeside gardens, and manageable visitor numbers. July and August are warmest but busiest. September is excellent — warm, quieter, with the hillsides beginning to change colour. Winter is mild but most of the outdoor and lakeside appeal diminishes significantly.' },
    ],
    verdict: 'Grand Hotel Villa Castagnola is the strongest choice for estate seclusion — private gardens to the water, serious dining, historic lakefront property. Hotel Splendide Royal is the right choice for central lakefront positioning — on the Lungolago promenade since 1887, immediate old-town access. The View Lugano suits travelers who prioritise panoramic lake and mountain views above direct water access.',
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
    description: 'Basel is Switzerland\'s most culturally concentrated city — over 40 museums for a population of 180,000, Art Basel each June, and a Rhine waterfront that rewards time spent. The luxury hotel market here is anchored by a single exceptional property: Les Trois Rois, which has occupied its Rhine-facing position since 1681 and remains the only five-star grand hotel in the city.',
    region: 'Basel',
    hotels: ['Les Trois Rois Basel'],
    faqs: [
      { q: 'Is Les Trois Rois the only serious luxury hotel in Basel?', a: 'At the five-star grand hotel level, yes — there is no comparable alternative in Basel. Several strong four-star properties exist, but Les Trois Rois is the only property in the city that operates at the level of Switzerland\'s leading luxury hotels. During Art Basel in June, it books out months in advance.' },
      { q: 'Is Basel worth visiting outside of Art Basel?', a: 'Absolutely. The Fondation Beyeler in nearby Riehen is one of Europe\'s finest private art museums and worth the trip independently. The Kunstmuseum Basel holds one of the world\'s oldest public art collections. The Rhine swimming culture in summer — locals float downstream using waterproof bags — gives the city a character unlike anywhere else in Switzerland.' },
      { q: 'How many nights does Basel need?', a: 'Two nights covers the main cultural sites comfortably — Kunstmuseum, Fondation Beyeler, the old town, and the Rhine waterfront. A third night suits travelers who want a day trip to Strasbourg or the Alsace wine route. Basel also works as a practical overnight stop in a wider European itinerary.' },
    ],
    verdict: 'Les Trois Rois is the only choice at the five-star level — a building on the Rhine that has hosted guests since 1681, with a Michelin-starred restaurant and Rhine-facing rooms. For travelers visiting during Art Basel in June, book many months in advance.',
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
    description: 'Lucerne has a quality that very few cities possess: it looks exactly as good in person as in photographs. The Chapel Bridge, the medieval water tower, and the lake opening south towards the Alps compose a setting that has drawn travelers since the Grand Tour era.\n\nThe luxury hotels here occupy historic lakefront buildings, a clifftop resort above the water, and old-town positions — each offering a different relationship to what makes Lucerne worth staying in.',
    region: 'Lucerne',
    hotels: ['Mandarin Oriental Palace Luzern','Grand Hotel National Lucerne','Hotel Schweizerhof Luzern','Bürgenstock Resort','Grand Hotel Vitznauerhof Lucerne','Park Hotel Vitznau','Hermitage Lake Lucerne'],
    faqs: [
      { q: 'Mandarin Oriental Palace, Hotel Schweizerhof, or Bürgenstock — which is right for me?', a: 'Mandarin Oriental Palace suits travelers who want the finest available hotel in Lucerne — lakefront palace setting, serious dining, full luxury infrastructure. Hotel Schweizerhof suits those who want a central old-town position within walking distance of the Chapel Bridge at a more accessible price point. Bürgenstock Resort suits travelers who want panoramic lake views and a resort atmosphere above the city.' },
      { q: 'Is Lucerne worth more than a day trip?', a: 'Yes — most travelers who visit as a day trip leave wishing they had stayed. The old town rewards slower exploration, the lake excursions are worthwhile, and the day trips to Rigi and Pilatus are better with an early morning start from a local hotel. Two nights is the practical minimum.' },
      { q: 'When is the Lucerne Festival?', a: 'The main Lucerne Festival runs from mid-August to mid-September — one of Europe\'s most serious classical music events, attracting leading orchestras and soloists. A smaller Piano Festival runs in November and a contemporary music festival in March. The Summer Festival is the strongest reason to visit in late August.' },
    ],
    verdict: 'Mandarin Oriental Palace Luzern is the finest luxury address — historic lakefront palace, serious dining, the strongest overall offering in the city. Hotel Schweizerhof Luzern is the practical choice for central old-town positioning at a more accessible price. Bürgenstock Resort is in a category of its own for panoramic lake views — a clifftop resort above the water with Alpine views that no lakefront property can match.',
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
    description: 'Verbier is the most energetic ski resort in Switzerland — serious off-piste terrain, a genuine après-ski culture, and a village that has grown significantly in luxury hotel quality over the past decade. The properties here understand their guests: they arrive physically tired from demanding mountain terrain and want comfort, food, and recovery without grand hotel formality.',
    region: 'Verbier',
    hotels: ['W Verbier',"Chalet d'Adrien",'Experimental Chalet Verbier','Hotel Vanessa Verbier','Hotel Farinet Verbier','Hotel Nevai Verbier'],
    faqs: [
      { q: 'W Verbier or Chalet d\'Adrien — which is right for me?', a: 'W Verbier suits travelers who want a full-service luxury ski hotel with spa, ski-in ski-out, and a design energy that matches the resort. Chalet d\'Adrien suits those who prefer intimacy, exceptional food, and a more traditional chalet atmosphere. The W is better for groups and those who want a hotel with a social scene; Chalet d\'Adrien is better for couples and small groups who want something more personal.' },
      { q: 'How does Verbier compare to Zermatt for luxury?', a: 'Verbier is more energetic, more focused on advanced skiing and après-ski, and has a younger overall atmosphere. Zermatt is more traditional, car-free, and defined by the Matterhorn. Verbier suits those who want physically demanding skiing and social evenings; Zermatt suits those who want the mountain to be the primary experience.' },
      { q: 'What is the Verbier Festival?', a: 'The Verbier Festival is a two-week classical music festival held each July — bringing leading international soloists and conductors to the mountain setting. It is genuinely well-regarded in the classical music world, not a peripheral resort event. The combination of setting and programme makes summer Verbier worth considering for those with an interest in classical music.' },
    ],
    verdict: 'W Verbier is the strongest full-service luxury ski hotel — ski-in ski-out, destination spa, Four Valleys access, and a design and energy that fits the resort\'s character. Chalet d\'Adrien is the right choice for travelers who want intimacy, exceptional food, and a more personal chalet atmosphere. Experimental Chalet Verbier is the best boutique option for design-conscious travelers who want something smaller.',
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
    description: 'Verbier\'s Four Valleys ski domain is one of the largest linked ski areas in the Alps, with the Mont-Fort peak offering some of the most demanding off-piste terrain in Switzerland. The ski hotels here are built for guests who take the skiing seriously and want accommodation that matches that commitment — not grand hotel ceremony, but proper ski infrastructure and food worth coming back to.',
    region: 'Verbier',
    hotels: ['W Verbier',"Chalet d'Adrien",'Experimental Chalet Verbier','Hotel Vanessa Verbier','Hotel Farinet Verbier','Hotel Nevai Verbier'],
    faqs: [
      { q: 'What are the best ski hotels in Verbier?', a: 'W Verbier offers the most complete ski hotel package — ski-in ski-out access, a destination spa, and a design that suits the resort\'s energetic character. Chalet d\'Adrien is the best choice for those who want a more traditional luxury chalet experience. Both are within the village with easy access to the main Medran lift station.' },
      { q: 'Is Verbier suitable for intermediate skiers?', a: 'The Four Valleys area has terrain for all levels, but Verbier\'s reputation rests on advanced and expert skiing. Intermediate skiers will find enough variety, but those who want primarily groomed runs with less off-piste pressure will feel more comfortable in Crans-Montana or Zermatt.' },
      { q: 'How do I get to Verbier?', a: 'Train to Le Châble then gondola directly to Verbier — from Geneva this takes around 2 hours total. A direct bus from Geneva airport operates during ski season. By car, Le Châble is around 1.5 hours from Geneva via the A9 motorway through the Valais.' },
    ],
    verdict: 'W Verbier is the strongest ski hotel — ski-in ski-out, Four Valleys access, destination spa. Chalet d\'Adrien is the best chalet ski experience — intimate luxury, exceptional food, traditional character. Experimental Chalet Verbier is the best boutique option.',
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
    description: 'Switzerland\'s business hotel market is among the most demanding in Europe — the combination of international institutions in Geneva, financial and corporate headquarters in Zurich, and the federal government in Bern creates a permanent flow of senior business and diplomatic travelers with high expectations and limited tolerance for inconsistency.\n\nThe hotels listed here have built their reputations on delivering at that level, repeatedly.',
    hotels: ['La Réserve Genève','La Réserve Eden au Lac Zurich','Bellevue Palace','Baur au Lac','Four Seasons Hotel des Bergues Geneva','The Dolder Grand','Mandarin Oriental Geneva','Widder Hotel','Park Hyatt Zurich','Mandarin Oriental Savoy Zurich'],
    faqs: [
      { q: 'Geneva or Zurich for business travel?', a: 'Geneva is stronger for international institutions, NGOs, the financial sector with a global mandate, and anyone whose business connects to European or UN structures. Zurich is better for Swiss corporate business, banking, and the technology sector. The two cities are 3 hours apart by train and many business travelers use both on the same trip.' },
      { q: 'Which is the best business hotel in Geneva?', a: 'La Réserve Genève leads for senior business travelers who value discretion and proximity to the airport. For those who need to be in the city for back-to-back meetings, Four Seasons Hotel des Bergues and Mandarin Oriental Geneva are the most established central lakefront addresses.' },
      { q: 'What level of meeting facilities do Swiss luxury hotels provide?', a: 'Swiss luxury hotels consistently offer private meeting rooms, AV facilities, private dining, and concierge support calibrated for demanding international guests. La Réserve Genève and Baur au Lac are particularly well regarded for private meetings where discretion matters as much as the room itself.' },
    ],
    verdict: 'La Réserve Genève leads for Geneva business — close to the airport, private park, exceptional discretion. Four Seasons Hotel des Bergues is the strongest central Geneva address for meetings and city access. La Réserve Eden au Lac and Baur au Lac are the strongest Zurich business hotels. Bellevue Palace in Bern is the only real choice for diplomatic and government travel — directly opposite the Federal Palace.',
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
    description: 'Switzerland is one of the world\'s strongest family travel destinations — safe, scenically extraordinary, and with a train network that makes moving between destinations genuinely easy with children. The luxury hotels on this list go beyond family-friendly as a marketing term: they have the space, children\'s programmes, outdoor access, and adult facilities that make a stay work for everyone simultaneously.',
    hotels: ['Schweizerhof Zermatt','Victoria-Jungfrau Grand Hotel Interlaken','Hotel Adula','Alpengold Hotel','Mont Cervin Palace','Monte Rosa Zermatt','The Alpina Gstaad','Bürgenstock Resort','Grand Resort Bad Ragaz','Fairmont Le Montreux Palace'],
    faqs: [
      { q: 'What are the best family ski hotels in Switzerland?', a: 'Schweizerhof Zermatt is the strongest family ski hotel — car-free village for safety, gentle terrain, family suite configurations, and full hotel infrastructure. Mont Cervin Palace suits families who want the most complete grand hotel experience in Zermatt. Alpengold Hotel in Davos works well for families who want a spacious resort with good ski school access.' },
      { q: 'Is Switzerland good for a ski holiday with young children?', a: 'Excellent. Swiss ski resorts have strong ski school infrastructure, designated beginner areas, and car-free villages like Zermatt and Wengen that are significantly safer for young children. Train access to most resorts makes arrival with children far easier than road-based alternatives.' },
      { q: 'What age range does Switzerland work for family travel?', a: 'Switzerland works across all ages. For young children: trains, lakes, and lower-altitude activities. For children 6-12: skiing, mountain railways, Jungfraujoch, and lake excursions. For teenagers: skiing, hiking, adventure sports in Interlaken, and resorts like Verbier for social energy.' },
    ],
    verdict: 'Schweizerhof Zermatt is the strongest family ski hotel — car-free village, family suites, gentle terrain, ski school access. Victoria-Jungfrau in Interlaken is the strongest family grand hotel choice — full children\'s programme, large spa for parents, Jungfrau excursions on the doorstep. Hotel Adula in Flims is the best outdoor-focused family option — pool, forest trails, Caumasee.',
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
      { q: 'What are the best spa hotels in Switzerland?', a: 'Victoria-Jungfrau in Interlaken has one of the largest hotel spas in the country. La Réserve Genève\'s Spa Nescens is the strongest lakeside spa resort. Crans Ambassador at 1,500m altitude combines ski-in ski-out with a large spa. Hotel Adula in Flims offers a nature-integrated spa experience with direct forest and lake access.' },
      { q: 'What should I expect from a Swiss luxury spa?', a: 'Swiss luxury spas typically include indoor pools (often with Alpine views), sauna and steam landscapes, hammam, a full treatment menu, and wellness programmes of varying lengths. The best properties offer multi-day wellness programmes with medical and nutritional consultation.' },
      { q: 'Which Swiss spa hotel is best for a pure wellness retreat?', a: 'Hotel Adula in Flims is the strongest nature-integrated wellness retreat — forest, lake, and gorge access combined with solid spa facilities in a resort that does not feel dominated by ski culture. La Réserve Genève is the best choice for those who want serious dining alongside serious spa programming.' },
    ],
    verdict: 'Victoria-Jungfrau has one of the largest hotel spas in Switzerland — a major facility in a Belle Époque grand hotel in Interlaken. La Réserve Genève is the strongest lakeside spa resort — large Spa Nescens, private park, serious dining. Crans Ambassador combines ski-in ski-out access with a large mountain spa at 1,500m. Hotel Adula in Flims is the best nature-integrated option — forest, lake, and gorge all on the doorstep.',
    relatedLinks: [
      { label: 'Best wellness hotels in Flims', href: '/best/wellness-hotels-flims' },
      { label: 'Best romantic hotels in Switzerland', href: '/best/romantic-hotels-switzerland' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
    ],
    comparisons: [
    ],
  },

  'luxury-hotels-ascona': {
    title: 'Best Luxury Hotels in Ascona, Switzerland 2026',
    h1: 'Best Luxury Hotels in Ascona',
    description: 'Ascona is a small village on the northern shore of Lake Maggiore — Italian in atmosphere, Swiss in infrastructure, and deliberately exclusive in character. The Piazza Motta running along the lake is one of the most beautiful public spaces in Switzerland, and the luxury hotels here understand that their guests are not seeking activity but atmosphere: a particular quality of light, water, and unhurried time.',
    region: 'Ascona',
    hotels: ['Eden Roc Ascona','Castello del Sole','Giardino Ascona','Villa Orselina Locarno','Seven Boutique Hotel Ascona'],
    faqs: [
      { q: 'Eden Roc Ascona or Castello del Sole?', a: 'Eden Roc suits travelers who want the lakefront grand hotel experience — Piazza Motta within walking distance, the lake immediately present, multiple restaurants. Castello del Sole suits those who want an estate experience: private grounds, organic farming, a private beach, and deliberate seclusion from the village. Both are exceptional; the choice is between urban lakefront and rural estate.' },
      { q: 'How many nights does Ascona need?', a: 'Three to five nights is the natural rhythm — Ascona is designed for slowing down rather than as a base for activity. The Piazza, Monte Verità, the lake, and a day trip to Locarno or the Italian shore of Lake Maggiore covers the main draws. Shorter stays feel rushed.' },
      { q: 'Is Ascona suitable for families?', a: 'Ascona suits families with older children who are comfortable with a quiet, lake-focused holiday. It is not a resort with extensive children\'s programming or adventure sports. Families wanting active outdoor holidays are better served by Interlaken or Flims.' },
    ],
    verdict: 'Eden Roc Ascona is the landmark lakefront hotel — directly on Lake Maggiore, multiple restaurants, the full grand hotel infrastructure. Castello del Sole is the right choice for travelers who want an estate experience: private grounds, organic farming, private beach, deliberate seclusion. Giardino Ascona is the strongest boutique option within the village.',
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
    description: 'Andermatt\'s reinvention is one of the more remarkable stories in contemporary Swiss hospitality. A historic mountain village at the crossroads of four Alpine passes, it spent much of the 20th century as a quiet garrison town. The arrival of The Chedi Andermatt and a broader resort development programme changed that — today Andermatt offers world-class luxury infrastructure in a setting that has not yet been worn smooth by decades of mass tourism.',
    region: 'Andermatt',
    hotels: ['The Chedi Andermatt','The Chedi Residences Andermatt','Radisson Blu Reussen Andermatt','The River House Andermatt','Hotel Crown Andermatt'],
    faqs: [
      { q: 'Is The Chedi Andermatt worth the premium?', a: 'For travelers who want one of Switzerland\'s finest ski hotel experiences, yes — the spa, the restaurants, and the ski access combination is difficult to match in the Alps. The premium reflects genuine quality rather than name alone. The Radisson Blu Reussen delivers a strong experience at a lower price point for travelers who want the Andermatt setting without The Chedi\'s rates.' },
      { q: 'How does Andermatt compare to Zermatt for a ski holiday?', a: 'Andermatt has high-alpine terrain and luxury infrastructure comparable to Zermatt, but without the Matterhorn or the long grand hotel history. It is less crowded, easier to book at peak periods, and arguably better value at the luxury level. Zermatt suits travelers for whom mountain identity and history matter; Andermatt suits those who prioritise skiing and hotel quality over prestige.' },
      { q: 'What is the summer season like in Andermatt?', a: 'Growing but not yet as developed as winter. The Andermatt Music Festival, a golf course, hiking across the pass landscapes, and the scenery of the Uri Alps make it worth considering. The Chedi stays open year-round at full quality. Rates are lower than peak ski season.' },
    ],
    verdict: 'The Chedi Andermatt is the defining property — Asian-influenced design in an Alpine setting, an exceptionally long indoor pool, multiple recognized restaurants, ski-in ski-out access. It is one of the finest ski hotels in Switzerland. The Radisson Blu Reussen delivers a strong stay at a more accessible price point for travelers who want the Andermatt experience without The Chedi\'s rates.',
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
    description: 'Crans-Montana sits on a broad south-facing plateau at 1,500m with panoramic views stretching from Mont Blanc to the Matterhorn. The sunshine record here is exceptional for a Swiss ski resort, and the luxury hotel offering — anchored by Crans Ambassador and Six Senses — takes both ski convenience and wellness seriously.\n\nThe plateau position also makes it one of Switzerland\'s more versatile resorts for non-skiers.',
    region: 'Crans-Montana',
    hotels: ['Crans Ambassador','Six Senses Crans-Montana','LeCrans Hotel & Spa','Hotel Guarda Golf Crans-Montana',"Pas de l'Ours Crans-Montana",'Aïda Hotel & Spa','Chetzeron Hotel'],
    faqs: [
      { q: 'Crans Ambassador or Six Senses — which is right for me?', a: 'Crans Ambassador suits travelers for whom ski access and a full-service Alpine hotel are the priorities — ski-in ski-out, large spa, three restaurants. Six Senses suits travelers for whom wellness programming is the primary draw — the Six Senses health approach in an Alpine ski setting is a genuinely distinctive combination.' },
      { q: 'What makes Crans-Montana different from other Swiss ski resorts?', a: 'The south-facing plateau at 1,500m gives Crans-Montana exceptional sunshine — significantly more than the enclosed valleys of Zermatt or Davos. The panoramic views from Mont Blanc to the Matterhorn are accessible from the resort itself without taking a lift. The Omega European Masters golf course confirms the resort takes its summer season as seriously as winter.' },
      { q: 'Is Crans-Montana good for a summer visit?', a: 'Yes — the golf course, hiking on the plateau, and the panoramic views make summer genuinely compelling. The Omega European Masters in September is one of Europe\'s finest mountain golf events and gives the resort a specific summer identity.' },
    ],
    verdict: 'Crans Ambassador is the strongest full-service luxury ski hotel on the plateau — ski-in ski-out, large spa, three restaurants, the Valais panorama as a constant backdrop. Six Senses is the right choice for travelers who want wellness programming as the primary focus alongside skiing. LeCrans Hotel & Spa is the strongest boutique option — smaller, strong food, chalet character.',
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
      { q: 'Hotel Adula or Parkhotel Waldhaus — which suits me better?', a: 'Hotel Adula suits travelers who want a modern spa property with direct access to the Caumasee trails and ski area — the stronger choice for active stays combining skiing or hiking with wellness. Parkhotel Waldhaus suits those who want a more traditional grand hotel atmosphere set within its own park grounds.' },
      { q: 'What is the Caumasee?', a: 'The Caumasee is a small glacial lake above Flims, its water a distinctive turquoise from mineral sediment. It sits within ancient forest about 20 minutes on foot from the village and is swimmable in summer. It is one of the more photographed natural sites in Graubünden and genuinely worth the walk regardless of season.' },
      { q: 'How does Flims-Laax compare to Davos for skiing?', a: 'The Weisse Arena covers 224km of pistes — somewhat smaller than the Parsenn above Davos but with a stronger reputation for snowboard and freestyle terrain. For traditional Alpine skiing, Davos-Parsenn is more extensive; for variety and snowboard culture, Flims-Laax is the stronger choice.' },
    ],
    verdict: 'Hotel Adula is the anchor of the Flims luxury offer — indoor pool, spa, three restaurants, direct access to Caumasee lake and Rhine Gorge trails. The Hide Flims is the right choice for maximum seclusion — smaller, more private, boutique wellness atmosphere. Parkhotel Waldhaus offers a traditional park-set grand hotel experience for travelers who want established hospitality over contemporary design.',
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
    description: 'Montreux curves around the eastern end of Lake Geneva in a microclimate mild enough for palm trees, sheltered by the Alps to the north and east. The Château de Chillon rises from a rocky island to the east, the Fairmont Palace dominates the lakefront, and the Montreux Jazz Festival — held each July since 1967 — gives the town a cultural credibility that most Swiss lakeside destinations cannot claim.',
    region: 'Montreux',
    hotels: ['Fairmont Le Montreux Palace','Le Mirador Resort & Spa Mont-Pelerin','Royal Plaza Montreux','Grand Hotel Suisse Majestic Montreux','Hotel Eden Palace au Lac Montreux','Eurotel Montreux','Hotel Victoria Glion'],
    faqs: [
      { q: 'Fairmont Le Montreux Palace or Le Mirador — which should I choose?', a: 'The Palace suits travelers who want to be on the lakefront — steps from the promenade, the Château de Chillon, and the Jazz Festival stages. Le Mirador suits those who want panoramic views over the lake from above, a major spa, and a more secluded resort atmosphere. They serve different travel moods rather than competing directly.' },
      { q: 'Is Montreux worth visiting outside the Jazz Festival?', a: 'Yes — the Château de Chillon alone justifies a visit, the lakeside promenade is beautiful in spring and autumn, and the town is more pleasant outside the July crowds. The Fairmont Palace stays open year-round and the rail connections to Geneva, Lausanne, and Zermatt make it a practical base for wider exploration.' },
      { q: 'How does Montreux fit into a wider Lake Geneva itinerary?', a: 'Montreux works well as the eastern anchor of a Lake Geneva trip. Geneva is 1 hour 10 minutes by train. Lausanne is 25 minutes. The Lavaux vineyard terraces between Lausanne and Montreux are UNESCO-listed and accessible by train or on foot. The combination of Geneva, Lausanne, and Montreux covers the full range of what the north shore offers.' },
    ],
    verdict: 'Fairmont Le Montreux Palace is the defining address — directly on Lake Geneva since 1906, 236 rooms, multiple restaurants, the most established grand hotel on the Swiss Riviera. Le Mirador Resort & Spa on Mont-Pèlerin above the town offers clifftop panoramic views, a major spa, and a more secluded resort atmosphere for those who prefer elevation to lakefront proximity. Royal Plaza Montreux is the strongest boutique option.',
    relatedLinks: [
      { label: 'Montreux destination guide', href: '/destinations/montreux' },
      { label: 'Best lake hotels in Switzerland', href: '/best/lake-hotels-switzerland' },
      { label: 'Best luxury hotels in Switzerland', href: '/best/luxury-hotels-switzerland' },
    ],
    comparisons: [
      { label: 'Fairmont Le Montreux Palace vs Le Mirador Resort', href: '/compare/fairmont-le-montreux-palace-vs-le-mirador-resort-mont-pelerin' },
    ],
  },
}

export function getBestPagesForHotel(hotelName: string, region?: string, category?: string): { slug: string }[] {
  const matches: { slug: string }[] = []
  for (const [slug, page] of Object.entries(PROMPT_PAGES)) {
    let included = false
    if (page.hotels) included = page.hotels.includes(hotelName)
    else if (page.region && page.category) included = page.region === region && page.category === category
    else if (page.region) included = page.region === region
    else if (page.category) included = page.category === category
    if (included) matches.push({ slug })
  }
  return matches
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
  const cleanDescription = page.description.replace(/\n\n/g, ' ').slice(0, 155)
  return {
    title: page.title + ' | SwissNet Hotels',
    description: cleanDescription,
    alternates: { canonical: `https://swissnethotels.com/best/${slug}` },
    openGraph: {
      title: page.title + ' | SwissNet Hotels',
      description: cleanDescription,
    },
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
        description: page.description.replace(/\n\n/g, ' '),
        ...(page.verdict ? { 'abstract': page.verdict } : {}),
        isPartOf: { '@id': 'https://swissnethotels.com#website' },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        mainEntity: { '@id': `${pageUrl}#list` },
        author: { '@type': 'Organization', name: 'SwissNet Hotels', url: 'https://swissnethotels.com' },
        publisher: { '@id': 'https://swissnethotels.com#organization' },
        datePublished: '2026-01-01',
        dateModified: new Date().toISOString().split('T')[0],
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
        description: page.description.replace(/\n\n/g, ' '),
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
            ...(h.rating_value && h.rating_count ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: h.rating_value,
                reviewCount: h.rating_count,
                bestRating: 5,
                worstRating: 1,
              },
            } : {}),
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

      <div style={{ background: '#492816', padding: '6rem 2rem 4rem' }}>
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
          {page.description.split('\n\n').map((p, i) => (
  <p key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: '600px', margin: '0 auto 0.75rem', fontWeight: 300 }}>{p}</p>
))}
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
                  <BestHotelCard key={hotel.id} hotel={{ ...hotel, index: i }} slug={slug} gold={gold} border={border} bg={bg} text={text} textMuted={textMuted} />
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
                { icon: '✓', title: 'No OTA Fees', desc: 'Avoid third-party platform fees where applicable' },
{ icon: '✓', title: 'Direct Rates', desc: 'Access direct hotel rates and offers' },
{ icon: '✓', title: 'Direct Relationship', desc: 'Handle requests directly with the hotel' },
{ icon: '✓', title: 'Cancellation Terms', desc: 'Cancellation terms vary by property' },
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
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: text, margin: '0 0 1rem' }}>Explore Further</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(page.relatedLinks || [])
  .slice(0, 6)
  .map((link) => (
    <Link key={link.href} href={link.href} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: gold, textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: `1px solid ${border}` }}>
      <span>{link.label}</span>
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
