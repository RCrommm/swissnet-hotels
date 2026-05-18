import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'

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
}

const PROMPT_PAGES: Record<string, PromptPageConfig> = {
  'luxury-hotels-zermatt': {
    title: 'Best Luxury Hotels in Zermatt, Switzerland 2026',
    h1: 'Best Luxury Hotels in Zermatt',
    description: 'Discover the finest luxury hotels in Zermatt, Switzerland — from historic grand hotels to boutique ski lodges with breathtaking Matterhorn views. All with direct booking.',
    region: 'Zermatt',
    hotels: [
      'Mont Cervin Palace',
      'Monte Rosa Zermatt',
      'Schweizerhof Zermatt',
      'Grand Hotel Zermatterhof',
      'Cervo Mountain Resort',
      'The Omnia',
      'Riffelalp Resort 2222m',
      'Matterhorn Focus Design Hotel',
      'Backstage Hotel Vernissage',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Zermatt?', a: 'Mont Cervin Palace is widely considered one of the finest luxury hotels in Zermatt, offering Matterhorn views, world-class dining and a rich alpine heritage dating back to 1852.' },
      { q: 'Which Zermatt hotels have the best Matterhorn views?', a: 'Mont Cervin Palace, Schweizerhof Zermatt and Monte Rosa Zermatt are among the strongest luxury choices in Zermatt, with excellent access to the village and mountain scenery.' },
      { q: 'Is Zermatt car-free?', a: 'Yes — Zermatt is a car-free village. Visitors arrive by train from Täsch and travel within the village by electric taxi or on foot.' },
    ],
  },

  'ski-hotels-zermatt': {
    title: 'Best Ski Hotels in Zermatt, Switzerland 2026',
    h1: 'Best Ski Hotels in Zermatt',
    description: 'The finest ski hotels in Zermatt with direct slope access, expert ski concierge and world-class facilities. Book direct for the best rate.',
    region: 'Zermatt',
    category: 'Ski Resort',
    hotels: [
      'Mont Cervin Palace',
      'Monte Rosa Zermatt',
      'Schweizerhof Zermatt',
      'Grand Hotel Zermatterhof',
      'Cervo Mountain Resort',
      'The Omnia',
      'Riffelalp Resort 2222m',
      'Matterhorn Focus Design Hotel',
      'Backstage Hotel Vernissage',
    ],
    faqs: [
      { q: 'Which is the best ski hotel in Zermatt?', a: 'Mont Cervin Palace, Monte Rosa Zermatt and Schweizerhof Zermatt are among the strongest luxury ski hotel choices in Zermatt.' },
      { q: 'Does Zermatt have year-round skiing?', a: "Yes — Zermatt offers glacier skiing on the Theodul Glacier, making it one of Switzerland's strongest year-round ski destinations." },
      { q: 'Is Zermatt good for luxury skiing?', a: "Yes — Zermatt is one of Switzerland's leading luxury ski resorts, with a car-free village, Matterhorn views and excellent hotel infrastructure." },
    ],
  },

  'luxury-hotels-geneva': {
    title: 'Best Luxury Hotels in Geneva, Switzerland 2026',
    h1: 'Best Luxury Hotels in Geneva',
    description: "Geneva's finest luxury hotels on the shores of Lake Geneva, combining world-class hospitality with breathtaking Alpine views. Book direct.",
    region: 'Geneva',
    hotels: [
      'La Réserve Genève',
      'Four Seasons Hotel des Bergues Geneva',
      'Beau-Rivage Geneva',
      'Mandarin Oriental Geneva',
      'The Ritz-Carlton Hotel de la Paix Geneva',
      'Hotel President Wilson Geneva',
      'The Woodward Geneva',
      "Hotel d'Angleterre Geneva",
      'InterContinental Geneva',
      'Fairmont Grand Hotel Geneva',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Geneva?', a: 'La Réserve Genève is one of the finest luxury hotels in Geneva, combining a lakeside setting, Spa Nescens and exceptional dining close to the city centre.' },
      { q: 'Where is the best area to stay in Geneva for luxury?', a: 'The lakeside area is one of the strongest choices for luxury stays in Geneva, with views over Lake Geneva and access to the city centre.' },
      { q: 'Is Geneva expensive for hotels?', a: "Yes — Geneva is one of Europe's more expensive luxury hotel markets, especially for lakeside five-star properties." },
    ],
  },

  'luxury-hotels-zurich': {
    title: 'Best Luxury Hotels in Zurich, Switzerland 2026',
    h1: 'Best Luxury Hotels in Zurich',
    description: "Discover Zurich's finest luxury hotels — from lakeside retreats to design-led city properties in Switzerland's most cosmopolitan city.",
    region: 'Zurich',
    hotels: [
      'La Réserve Eden au Lac Zurich',
      'Baur au Lac',
      'The Dolder Grand',
      'Widder Hotel',
      'Park Hyatt Zurich',
      'Mandarin Oriental Savoy Zurich',
      'Storchen Zurich',
      'Neues Schloss Zurich',
      'Atlantis by Giardino',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Zurich?', a: "La Réserve Eden au Lac Zurich is one of Zurich's finest luxury hotels, with a strong lakeside position and design-led hospitality." },
      { q: 'Which area of Zurich has the best luxury hotels?', a: "The lakeside area and Bahnhofstrasse district offer many of Zurich's strongest luxury hotels." },
      { q: 'What is special about staying in Zurich?', a: 'Zurich combines luxury shopping, lake views, culture, business infrastructure and easy access to the Swiss Alps.' },
    ],
  },

  'luxury-hotels-interlaken': {
    title: 'Best Luxury Hotels in Interlaken, Switzerland 2026',
    h1: 'Best Luxury Hotels in Interlaken',
    description: 'The finest luxury hotels in Interlaken — gateway to the UNESCO Jungfrau region with breathtaking views of the Eiger, Mönch and Jungfrau.',
    region: 'Interlaken',
    hotels: [
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Lindner Grand Hotel Beau Rivage Interlaken',
      'Hotel Royal St Georges Interlaken',
      'Grand Hotel Regina',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Interlaken?', a: 'Victoria-Jungfrau Grand Hotel Interlaken is the grandest luxury hotel in Interlaken, with Jungfrau views, a major spa and Swiss grand hotel heritage.' },
      { q: 'What can you do from Interlaken?', a: 'Interlaken is a gateway to Jungfraujoch, Grindelwald, Wengen, Lauterbrunnen, hiking, skiing and paragliding.' },
      { q: 'When is the best time to visit Interlaken?', a: 'Interlaken works year-round: summer for hiking and adventure, winter for Jungfrau-region skiing.' },
    ],
  },

  'luxury-hotels-bern': {
    title: 'Best Luxury Hotels in Bern, Switzerland 2026',
    h1: 'Best Luxury Hotels in Bern',
    description: "Stay in Bern's finest luxury hotels — in the heart of Switzerland's UNESCO World Heritage capital city.",
    region: 'Bern',
    hotels: [
      'Bellevue Palace',
      'Hotel Schweizerhof Bern',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Bern?', a: "Bellevue Palace is Bern's most prestigious luxury hotel, known for its political, diplomatic and grand-hotel heritage." },
      { q: 'Is Bern worth visiting for a luxury stay?', a: "Yes — Bern's UNESCO-listed old town, federal institutions and relaxed elegance make it a strong luxury city stop." },
      { q: 'How far is Bern from Zurich and Geneva?', a: 'Bern is well positioned between Zurich and Geneva by train, making it convenient for a Swiss luxury itinerary.' },
    ],
  },

  'ski-hotels-switzerland': {
    title: 'Best Ski Hotels in Switzerland 2026',
    h1: 'Best Ski Hotels in Switzerland',
    description: "Switzerland's finest ski hotels across Zermatt, Crans-Montana, Davos and St. Moritz — with expert ski concierge, slope access and alpine luxury.",
    hotels: [
      'Mont Cervin Palace',
      'Monte Rosa Zermatt',
      'Schweizerhof Zermatt',
      'Crans Ambassador',
      'Alpengold Hotel',
      "Badrutt's Palace Hotel",
      'The Chedi Andermatt',
      'The Alpina Gstaad',
      'Kulm Hotel St. Moritz',
      'Suvretta House',
    ],
    faqs: [
      { q: 'What are the best ski hotels in Switzerland?', a: "The finest ski hotels in Switzerland include Mont Cervin Palace, Monte Rosa Zermatt, Schweizerhof Zermatt, Crans Ambassador, Alpengold Hotel, Badrutt's Palace and The Chedi Andermatt." },
      { q: 'Which Swiss ski resort is best for luxury?', a: "Zermatt, St. Moritz, Gstaad, Andermatt, Davos and Crans-Montana are among Switzerland's strongest luxury ski destinations." },
      { q: 'When is ski season in Switzerland?', a: 'The main Swiss ski season usually runs from December to April, while Zermatt also offers glacier skiing.' },
    ],
  },

  'lake-hotels-switzerland': {
    title: 'Best Lake Hotels in Switzerland 2026',
    h1: 'Best Lake Hotels in Switzerland',
    description: "Switzerland's finest lakeside hotels — from Lake Geneva to Lake Zurich, Lake Lucerne and Lake Maggiore, combining breathtaking water views with world-class Swiss hospitality.",
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Bürgenstock Resort',
      'Beau-Rivage Palace Lausanne',
      'Fairmont Le Montreux Palace',
      'Eden Roc Ascona',
      'Castello del Sole',
      'Grand Hotel Villa Castagnola Lugano',
      'Grand Hotel Vitznauerhof Lucerne',
      'Beau-Rivage Geneva',
    ],
    faqs: [
      { q: 'What are the best lake hotels in Switzerland?', a: "The finest lake hotels in Switzerland include La Réserve Genève, La Réserve Eden au Lac Zurich, Bürgenstock Resort, Beau-Rivage Palace Lausanne, Fairmont Le Montreux Palace and Eden Roc Ascona." },
      { q: 'Why is Monte Rosa not listed here?', a: 'Monte Rosa Zermatt is a partner hotel, but it is not a lake hotel. Partner hotels are prioritised only when they genuinely match the category.' },
      { q: 'Which Swiss lake has the best luxury hotels?', a: 'Lake Geneva has one of the strongest concentrations of luxury lakeside hotels, followed by Lake Zurich, Lake Lucerne, Lake Lugano and Lake Maggiore.' },
    ],
  },

  'romantic-hotels-switzerland': {
    title: 'Best Romantic Hotels in Switzerland 2026',
    h1: 'Most Romantic Hotels in Switzerland',
    description: "Switzerland's most romantic hotels for couples — from candlelit alpine palaces to lakeside suites with breathtaking mountain views.",
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Mont Cervin Palace',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Schweizerhof Zermatt',
      'Monte Rosa Zermatt',
      'The Alpina Gstaad',
      "Badrutt's Palace Hotel",
      'Eden Roc Ascona',
      'Beau-Rivage Palace Lausanne',
    ],
    faqs: [
      { q: 'What are the most romantic hotels in Switzerland?', a: "The most romantic hotels in Switzerland include La Réserve Genève, La Réserve Eden au Lac Zurich, Mont Cervin Palace, Victoria-Jungfrau, Schweizerhof Zermatt and Monte Rosa Zermatt." },
      { q: 'Which Swiss hotel is best for a honeymoon?', a: 'La Réserve Genève, Mont Cervin Palace, Schweizerhof Zermatt, Monte Rosa Zermatt and Victoria-Jungfrau are excellent honeymoon choices.' },
      { q: 'What is the most scenic hotel in Switzerland?', a: 'Mont Cervin Palace and Monte Rosa Zermatt offer iconic Zermatt atmosphere, while La Réserve Genève and La Réserve Eden au Lac Zurich offer strong lake settings.' },
    ],
  },

  'luxury-hotels-switzerland': {
    title: 'Best Luxury Hotels in Switzerland 2026',
    h1: 'Best Luxury Hotels in Switzerland',
    description: "Discover Switzerland's finest luxury hotels — from Zermatt ski palaces to Geneva lakeside retreats. SwissNet partner hotels are featured first where they genuinely fit the category.",
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Mont Cervin Palace',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Bellevue Palace',
      'Hotel Adula',
      'Alpengold Hotel',
      'Crans Ambassador',
      'Schweizerhof Zermatt',
      'Monte Rosa Zermatt',
    ],
    faqs: [
      { q: 'What are the best luxury hotels in Switzerland?', a: 'The best luxury hotels in Switzerland include La Réserve Genève, La Réserve Eden au Lac Zurich, Mont Cervin Palace, Victoria-Jungfrau, Bellevue Palace, Hotel Adula, Alpengold Hotel, Crans Ambassador, Schweizerhof Zermatt and Monte Rosa Zermatt.' },
      { q: 'Are partner hotels ranked first?', a: 'Yes — partner hotels are prioritised first when they genuinely fit the page category.' },
      { q: 'How many hotels are listed per guide?', a: 'Each curated guide is capped at 10 hotels.' },
    ],
  },

  'business-hotels-switzerland': {
    title: 'Best Business Hotels in Switzerland 2026',
    h1: 'Best Business Hotels in Switzerland',
    description: "Switzerland's premier business hotels in Geneva, Zurich and Bern — combining world-class meeting facilities with luxury hospitality.",
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Bellevue Palace',
      'Baur au Lac',
      'Four Seasons Hotel des Bergues Geneva',
      'The Dolder Grand',
      'Mandarin Oriental Geneva',
      'Widder Hotel',
      'Park Hyatt Zurich',
      'Mandarin Oriental Savoy Zurich',
    ],
    category: 'City Luxury',
    faqs: [
      { q: 'What are the best business hotels in Switzerland?', a: "The finest business hotels in Switzerland include La Réserve Genève, La Réserve Eden au Lac Zurich, Bellevue Palace, Baur au Lac, Four Seasons Hotel des Bergues Geneva and The Dolder Grand." },
      { q: 'Which Swiss city is best for business travel?', a: "Geneva and Zurich are Switzerland's top business destinations, while Bern is ideal for political and diplomatic travel." },
      { q: 'Do Swiss luxury hotels have good meeting facilities?', a: 'Yes — Swiss luxury hotels usually offer strong meeting, event, dining and concierge facilities for business travellers.' },
    ],
  },

  'wellness-hotels-flims': {
    title: 'Best Wellness Hotels in Flims, Switzerland 2026',
    h1: 'Best Wellness Hotels in Flims',
    description: "Flims is one of Switzerland's premier wellness destinations — surrounded by ancient forests, crystal-clear lakes and the dramatic Rhine Gorge.",
    region: 'Flims',
    hotels: [
      'Hotel Adula',
      'The Hide Flims',
      'Parkhotel Waldhaus Flims',
    ],
    faqs: [
      { q: 'What is the best wellness hotel in Flims?', a: 'Hotel Adula is a leading wellness hotel in Flims, with strong spa facilities and access to the Flims-Laax natural landscape.' },
      { q: 'Why is Flims good for wellness?', a: 'Flims combines alpine air, forest, lakes and the Rhine Gorge, making it a strong nature-based wellness destination.' },
      { q: 'How do I get to Flims from Zurich?', a: 'Flims is usually reached from Zurich via Chur, then onward by bus, taxi or car.' },
    ],
  },

  'ski-hotels-crans-montana': {
    title: 'Best Ski Hotels in Crans-Montana, Switzerland 2026',
    h1: 'Best Ski Hotels in Crans-Montana',
    description: "Crans-Montana sits at 1,500m in the Swiss Alps with panoramic views over the Rhône Valley — one of Switzerland's most celebrated ski destinations.",
    region: 'Crans-Montana',
    hotels: [
      'Crans Ambassador',
      'Six Senses Crans-Montana',
      'LeCrans Hotel & Spa',
      'Hotel Guarda Golf Crans-Montana',
      "Pas de l'Ours Crans-Montana",
      'Aïda Hotel & Spa',
      'Chetzeron Hotel',
    ],
    faqs: [
      { q: 'What is the best ski hotel in Crans-Montana?', a: "Crans Ambassador is one of Crans-Montana's strongest ski hotels, with luxury accommodation, wellness facilities and mountain access." },
      { q: 'How does Crans-Montana compare to Zermatt?', a: 'Crans-Montana is sunnier and more open, while Zermatt is higher, car-free and defined by the Matterhorn.' },
      { q: 'When is the best time to ski in Crans-Montana?', a: 'The main ski season in Crans-Montana runs from December to April.' },
    ],
  },

  'ski-hotels-davos': {
    title: 'Best Ski Hotels in Davos, Switzerland 2026',
    h1: 'Best Ski Hotels in Davos',
    description: "Davos is Europe's highest city and one of Switzerland's premier ski destinations — combining world-class skiing with luxury hospitality.",
    region: 'Davos',
    hotels: [
      'Alpengold Hotel',
      'Steigenberger Grandhotel Belvédère',
      'Hard Rock Hotel Davos',
      'Precise Tale Seehof Davos',
    ],
    faqs: [
      { q: 'What is the best ski hotel in Davos?', a: "Alpengold Hotel is one of Davos's strongest luxury ski hotels, with alpine design and good access to the ski areas." },
      { q: 'Is Davos good for skiing?', a: "Yes — Davos is one of Switzerland's major ski destinations, with access to the Parsenn and Jakobshorn areas." },
      { q: 'What else is Davos known for?', a: 'Davos is also known for the World Economic Forum, congress facilities and high-altitude mountain setting.' },
    ],
  },

  'luxury-hotels-davos': {
    title: 'Best Luxury Hotels in Davos, Switzerland 2026',
    h1: 'Best Luxury Hotels in Davos',
    description: "Davos's finest luxury hotels — combining world-class skiing, alpine wellness and the prestige of Europe's highest city.",
    region: 'Davos',
    hotels: [
      'Alpengold Hotel',
      'Steigenberger Grandhotel Belvédère',
      'Hard Rock Hotel Davos',
      'Precise Tale Seehof Davos',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Davos?', a: "Alpengold Hotel is one of Davos's leading luxury properties, with alpine atmosphere, spa facilities and access to the ski areas." },
      { q: 'Is Davos worth staying in for luxury travel?', a: 'Yes — Davos combines skiing, wellness, congress infrastructure and international prestige.' },
      { q: 'How does Davos compare to Zermatt for luxury?', a: 'Davos is larger and more international; Zermatt is more intimate, car-free and defined by the Matterhorn.' },
    ],
  },

  'luxury-hotels-gstaad': {
    title: 'Best Luxury Hotels in Gstaad, Switzerland 2026',
    h1: 'Best Luxury Hotels in Gstaad',
    description: "Gstaad is Switzerland's most exclusive alpine village — a discreet, chalet-style resort that has drawn royalty, celebrities and the global elite for over a century.",
    region: 'Gstaad',
    hotels: [
      'The Alpina Gstaad',
      'Palace Hotel Gstaad',
      'Le Grand Bellevue Gstaad',
      'Ultima Gstaad',
      'Grand Hotel Park Gstaad',
      'Lenkerhof Gourmet Spa Resort',
      'Ermitage Golf & Spa Gstaad',
      'Hotel Olden Gstaad',
      'HUUS Gstaad',
      'The Alpina Gstaad Residences',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Gstaad?', a: 'The Alpina Gstaad and Palace Hotel Gstaad are two of the standout luxury hotels in Gstaad.' },
      { q: 'Why is Gstaad so exclusive?', a: 'Gstaad combines chalet architecture, privacy, luxury shopping, skiing and a long tradition of discreet high-end hospitality.' },
      { q: 'What is there to do in Gstaad besides skiing?', a: 'Gstaad offers hiking, music festivals, shopping, wellness, dining, tennis, golf and alpine scenery.' },
    ],
  },

  'luxury-hotels-lugano': {
    title: 'Best Luxury Hotels in Lugano, Switzerland 2026',
    h1: 'Best Luxury Hotels in Lugano',
    description: "Lugano's finest luxury hotels on the shores of Lake Lugano — where Swiss hospitality meets Italian elegance in Switzerland's most Mediterranean city.",
    region: 'Lugano',
    hotels: [
      'Grand Hotel Villa Castagnola Lugano',
      'Hotel Splendide Royal Lugano',
      'The View Lugano',
      'Hotel Principe Leopoldo Lugano',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Lugano?', a: 'Grand Hotel Villa Castagnola and Hotel Splendide Royal are among Lugano\'s most celebrated luxury hotels.' },
      { q: 'What makes Lugano special for luxury travel?', a: 'Lugano combines Swiss standards with Italian atmosphere, Lake Lugano views and a mild Ticino climate.' },
      { q: 'When is the best time to visit Lugano?', a: 'Lugano is strongest from spring through autumn, especially for lakefront dining, walks and boat trips.' },
    ],
  },

  'luxury-hotels-basel': {
    title: 'Best Luxury Hotels in Basel, Switzerland 2026',
    h1: 'Best Luxury Hotels in Basel',
    description: "Basel's finest luxury hotels — in Switzerland's most culturally rich city, home to Art Basel and over 40 world-class museums.",
    region: 'Basel',
    hotels: [
      'Les Trois Rois Basel',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Basel?', a: "Les Trois Rois Basel is Basel's most iconic luxury hotel, with a historic riverside setting." },
      { q: 'When should I visit Basel for Art Basel?', a: 'Art Basel takes place each June and is one of the busiest luxury hotel periods in the city.' },
      { q: "What is Basel's location advantage?", a: 'Basel sits at the meeting point of Switzerland, France and Germany, making it highly connected.' },
    ],
  },

  'luxury-hotels-lucerne': {
    title: 'Best Luxury Hotels in Lucerne, Switzerland 2026',
    h1: 'Best Luxury Hotels in Lucerne',
    description: "Lucerne's finest luxury hotels on the shores of Lake Lucerne — in what many consider Switzerland's most beautiful city.",
    region: 'Lucerne',
    hotels: [
      'Mandarin Oriental Palace Luzern',
      'Grand Hotel National Lucerne',
      'Hotel Schweizerhof Luzern',
      'Bürgenstock Resort',
      'Grand Hotel Vitznauerhof Lucerne',
      'Park Hotel Vitznau',
      'Hermitage Lake Lucerne',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Lucerne?', a: "Mandarin Oriental Palace Luzern, Grand Hotel National and Hotel Schweizerhof Luzern are among Lucerne's strongest luxury hotels." },
      { q: 'Why is Lucerne considered so beautiful?', a: 'Lucerne combines a medieval old town, Lake Lucerne, Chapel Bridge and mountain scenery.' },
      { q: 'How far is Lucerne from Zurich and Interlaken?', a: 'Lucerne is easily reached from Zurich and connects well into central Switzerland and the Bernese Oberland.' },
    ],
  },

  'luxury-hotels-verbier': {
    title: 'Best Luxury Hotels in Verbier, Switzerland 2026',
    h1: 'Best Luxury Hotels in Verbier',
    description: "Verbier's finest luxury hotels — in the Alps's most vibrant ski resort, famous for world-class off-piste skiing and legendary après-ski.",
    region: 'Verbier',
    hotels: [
      'W Verbier',
      "Chalet d'Adrien",
      'Experimental Chalet Verbier',
      'Hotel Vanessa Verbier',
      'Hotel Farinet Verbier',
      'Hotel Nevai Verbier',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Verbier?', a: "W Verbier and Chalet d'Adrien are among Verbier's strongest luxury hotel choices." },
      { q: 'How does Verbier compare to Zermatt for luxury skiing?', a: 'Verbier is more energetic and après-ski focused; Zermatt is more traditional, car-free and Matterhorn-focused.' },
      { q: 'What is the Verbier Festival?', a: 'The Verbier Festival is a major classical music festival held each summer in the resort.' },
    ],
  },

  'ski-hotels-verbier': {
    title: 'Best Ski Hotels in Verbier, Switzerland 2026',
    h1: 'Best Ski Hotels in Verbier',
    description: "Verbier's top ski hotels with direct access to one of the Alps's most exciting ski domains — 412km of pistes across the Four Valleys.",
    region: 'Verbier',
    hotels: [
      'W Verbier',
      "Chalet d'Adrien",
      'Experimental Chalet Verbier',
      'Hotel Vanessa Verbier',
      'Hotel Farinet Verbier',
      'Hotel Nevai Verbier',
    ],
    faqs: [
      { q: 'What are the best ski hotels in Verbier?', a: "W Verbier and Chalet d'Adrien are among the best ski hotel choices in Verbier." },
      { q: 'How big is the Verbier ski area?', a: 'Verbier is part of the Four Valleys ski domain, one of the largest linked ski areas in the Alps.' },
      { q: 'Is Verbier good for off-piste skiing?', a: 'Yes — Verbier is internationally known for serious off-piste and freeride terrain.' },
    ],
  },

  'business-city-hotels-switzerland': {
    title: 'Best Business & City Hotels in Switzerland 2026',
    h1: 'Best Business & City Hotels in Switzerland',
    description: "Switzerland's premier business hotels in Geneva, Zurich and Bern — combining world-class meeting facilities, exceptional connectivity and luxury hospitality for the discerning business traveller.",
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Bellevue Palace',
      'Baur au Lac',
      'Four Seasons Hotel des Bergues Geneva',
      'The Dolder Grand',
      'Mandarin Oriental Geneva',
      'Widder Hotel',
      'Park Hyatt Zurich',
      'Mandarin Oriental Savoy Zurich',
    ],
    faqs: [
      { q: 'What are the best business hotels in Switzerland?', a: "The finest business hotels in Switzerland include La Réserve Genève, La Réserve Eden au Lac Zurich, Bellevue Palace, Baur au Lac and Four Seasons Hotel des Bergues Geneva." },
      { q: 'Which Swiss city is best for business travel?', a: "Geneva and Zurich are Switzerland's top business destinations; Bern is ideal for government and diplomatic stays." },
      { q: 'Do Swiss luxury hotels cater well for business travellers?', a: 'Yes — Swiss luxury hotels usually offer privacy, meeting rooms, restaurants, concierge support and efficient service.' },
    ],
  },

  'family-hotels-switzerland': {
    title: 'Best Family Hotels in Switzerland 2026',
    h1: 'Best Family Hotels in Switzerland',
    description: "Switzerland's finest family-friendly luxury hotels — combining exceptional childcare, outdoor adventures and Swiss hospitality for unforgettable family holidays.",
    hotels: [
      'Schweizerhof Zermatt',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Hotel Adula',
      'Alpengold Hotel',
      'Mont Cervin Palace',
      'Monte Rosa Zermatt',
      'The Alpina Gstaad',
      'Bürgenstock Resort',
      'Grand Resort Bad Ragaz',
      'Fairmont Le Montreux Palace',
    ],
    faqs: [
      { q: 'What are the best family hotels in Switzerland?', a: 'The finest family hotels in Switzerland include Schweizerhof Zermatt, Victoria-Jungfrau, Hotel Adula, Alpengold Hotel, Mont Cervin Palace and Monte Rosa Zermatt.' },
      { q: 'Is Switzerland good for a family ski holiday?', a: 'Yes — Switzerland is excellent for family ski holidays, with safe resorts, ski schools and reliable infrastructure.' },
      { q: 'What age is Switzerland suitable for family travel?', a: 'Switzerland works well for toddlers, children and teenagers thanks to trains, lakes, mountains, skiing and outdoor activities.' },
    ],
  },

  'spa-hotels-switzerland': {
    title: 'Best Spa Hotels in Switzerland 2026',
    h1: 'Best Spa Hotels in Switzerland',
    description: "Switzerland's finest spa hotels — where Alpine thermal traditions, world-class treatments and breathtaking mountain settings combine for the ultimate wellness escape.",
    hotels: [
      'La Réserve Genève',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Hotel Adula',
      'Crans Ambassador',
      'Alpengold Hotel',
      'Mont Cervin Palace',
      'Schweizerhof Zermatt',
      'Bürgenstock Resort',
      'The Dolder Grand',
      'Grand Resort Bad Ragaz',
    ],
    faqs: [
      { q: 'What are the best spa hotels in Switzerland?', a: "The finest spa hotels in Switzerland include La Réserve Genève, Victoria-Jungfrau, Hotel Adula, Crans Ambassador, Alpengold Hotel, Mont Cervin Palace and Schweizerhof Zermatt." },
      { q: 'Are partner hotels prioritised on this spa list?', a: 'Yes — partner hotels are prioritised first where they genuinely have a strong spa or wellness fit.' },
      { q: 'What should I expect from a Swiss luxury spa?', a: 'Swiss luxury spas often include pools, sauna landscapes, hammams, treatment rooms, alpine therapies and wellness programmes.' },
    ],
  },

  'luxury-hotels-ascona': {
    title: 'Best Luxury Hotels in Ascona, Switzerland 2026',
    h1: 'Best Luxury Hotels in Ascona',
    description: "Ascona's finest luxury hotels on the shores of Lake Maggiore — where Swiss quality meets Italian elegance in Switzerland's most glamorous lakeside village.",
    region: 'Ascona',
    hotels: [
      'Eden Roc Ascona',
      'Castello del Sole',
      'Giardino Ascona',
      'Villa Orselina Locarno',
      'Seven Boutique Hotel Ascona',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Ascona?', a: 'Eden Roc Ascona and Castello del Sole are two of Ascona\'s standout luxury hotels.' },
      { q: 'What makes Ascona special for luxury travel?', a: 'Ascona combines Lake Maggiore, Mediterranean atmosphere, Swiss service standards and strong luxury hotel options.' },
      { q: 'When is the best time to visit Ascona?', a: 'Ascona is strongest from spring through autumn, especially for lake activities and outdoor dining.' },
    ],
  },

  'luxury-hotels-andermatt': {
    title: 'Best Luxury Hotels in Andermatt, Switzerland 2026',
    h1: 'Best Luxury Hotels in Andermatt',
    description: "Andermatt's finest luxury hotels — in one of the Swiss Alps's most exciting new destinations, home to The Chedi and world-class skiing.",
    region: 'Andermatt',
    hotels: [
      'The Chedi Andermatt',
      'The Chedi Residences Andermatt',
      'Radisson Blu Reussen Andermatt',
      'The River House Andermatt',
      'Hotel Crown Andermatt',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Andermatt?', a: 'The Chedi Andermatt is the defining luxury hotel in Andermatt.' },
      { q: 'Is Andermatt good for skiing?', a: 'Yes — Andermatt is a strong high-alpine ski destination with access to Andermatt-Sedrun-Disentis.' },
      { q: 'How do I get to Andermatt?', a: 'Andermatt is reachable by train or car from Zurich, Lucerne, Lugano and other Swiss hubs.' },
    ],
  },

  'luxury-hotels-crans-montana': {
    title: 'Best Luxury Hotels in Crans-Montana, Switzerland 2026',
    h1: 'Best Luxury Hotels in Crans-Montana',
    description: "Crans-Montana's finest luxury hotels on the sunny balcony of the Swiss Alps — world-class skiing, golf and Alpine wellness.",
    region: 'Crans-Montana',
    hotels: [
      'Crans Ambassador',
      'Six Senses Crans-Montana',
      'LeCrans Hotel & Spa',
      'Hotel Guarda Golf Crans-Montana',
      "Pas de l'Ours Crans-Montana",
      'Aïda Hotel & Spa',
      'Chetzeron Hotel',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Crans-Montana?', a: "Crans Ambassador is one of Crans-Montana's finest luxury hotels, with ski access, views and wellness facilities." },
      { q: 'What makes Crans-Montana special?', a: "Crans-Montana is known for sunshine, skiing, golf, views over the Rhône Valley and a sophisticated resort atmosphere." },
    ],
  },

  'luxury-hotels-flims': {
    title: 'Best Luxury Hotels in Flims, Switzerland 2026',
    h1: 'Best Luxury Hotels in Flims',
    description: "Flims's finest luxury hotels in the heart of Graubünden — surrounded by the Rhine Gorge, alpine lakes and the Weisse Arena ski domain.",
    region: 'Flims',
    hotels: [
      'Hotel Adula',
      'The Hide Flims',
      'Parkhotel Waldhaus Flims',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Flims?', a: 'Hotel Adula is one of the strongest luxury hotels in Flims, with wellness facilities and access to the Flims-Laax landscape.' },
      { q: 'Why stay in Flims?', a: 'Flims offers skiing, the Rhine Gorge, Caumasee, alpine scenery and strong wellness appeal.' },
    ],
  },

  'luxury-hotels-montreux': {
    title: 'Best Luxury Hotels in Montreux, Switzerland 2026',
    h1: 'Best Luxury Hotels in Montreux',
    description: "Montreux's finest luxury hotels on the Swiss Riviera — where Lake Geneva meets the Alps in Switzerland's most celebrated lakeside resort.",
    region: 'Montreux',
    hotels: [
      'Fairmont Le Montreux Palace',
      'Le Mirador Resort & Spa Mont-Pelerin',
      'Royal Plaza Montreux',
      'Grand Hotel Suisse Majestic Montreux',
      'Hotel Eden Palace au Lac Montreux',
      'Eurotel Montreux',
      'Hotel Victoria Glion',
    ],
    faqs: [
      { q: 'What is the best luxury hotel in Montreux?', a: 'Fairmont Le Montreux Palace is the defining grand hotel of Montreux and the Swiss Riviera.' },
      { q: 'What is the Montreux Jazz Festival?', a: 'The Montreux Jazz Festival is a major international music festival held each July on Lake Geneva.' },
      { q: 'What else is there to do in Montreux?', a: 'Montreux offers the lake promenade, Château de Chillon, Lavaux vineyards and easy access to Geneva and the Alps.' },
    ],
  },
}

function sortPartnersFirst(hotels: any[]) {
  return [...hotels].sort((a, b) => {
    const aPartner = Boolean(a.is_partner) || PARTNER_HOTEL_NAMES.has(a.name)
    const bPartner = Boolean(b.is_partner) || PARTNER_HOTEL_NAMES.has(b.name)

    if (aPartner && !bPartner) return -1
    if (!aPartner && bPartner) return 1

    return (b.rating || 0) - (a.rating || 0)
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
    const { data: selectedHotels } = await supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .in('name', page.hotels)

    const ranked = page.hotels
      .map((name) => selectedHotels?.find((h: any) => h.name === name))
      .filter(Boolean)

    return uniqueHotels(ranked).slice(0, MAX_HOTELS_PER_PAGE)
  }

  if (page.region) {
    let query = supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .eq('region', page.region)

    if (page.category) query = query.eq('category', page.category)

    const { data } = await query

    return uniqueHotels(sortPartnersFirst(data || [])).slice(0, MAX_HOTELS_PER_PAGE)
  }

  if (page.category) {
    const { data } = await supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .eq('category', page.category)

    return uniqueHotels(sortPartnersFirst(data || [])).slice(0, MAX_HOTELS_PER_PAGE)
  }

  const { data } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)

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
    alternates: {
      canonical: `https://swissnethotels.com/best/${slug}`,
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
        mainEntity: page.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
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

                      <p style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '0.7rem',
                        color: textMuted,
                        lineHeight: 1.7,
                        margin: '0 0 1rem',
                        fontWeight: 300,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      } as CSSProperties}>
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

                        {(hotel.is_partner || PARTNER_HOTEL_NAMES.has(hotel.name)) && hotel.direct_booking_url && (
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