import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'

const MAX_HOTELS_PER_PAGE = 10

const PROMPT_PAGES: Record<string, {
  title: string
  h1: string
  description: string
  region?: string
  category?: string
  best_for?: string
  hotels?: string[]
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
    hotels: [
      'Mont Cervin Palace',
      'Crans Ambassador',
      'Alpengold Hotel',
      "Badrutt's Palace Hotel",
      'The Chedi Andermatt',
      'The Alpina Gstaad',
      'Kulm Hotel St. Moritz',
      'Suvretta House',
      'Grand Hotel Kronenhof Pontresina',
      'Kempinski Grand Hotel des Bains St. Moritz',
    ],
    faqs: [
      { q: 'What are the best ski hotels in Switzerland?', a: 'The finest ski hotels in Switzerland include Mont Cervin Palace in Zermatt, Crans Ambassador in Crans-Montana, Alpengold Hotel in Davos, Badrutt\'s Palace in St. Moritz and The Chedi Andermatt — all offering exceptional ski access, luxury facilities and world-class service.' },
      { q: 'Which Swiss ski resort is best for luxury?', a: 'Zermatt is consistently ranked Switzerland\'s top luxury ski destination, followed by St. Moritz, Gstaad, Andermatt and Crans-Montana. Zermatt\'s car-free village, year-round skiing and Matterhorn backdrop make it uniquely special.' },
      { q: 'When is ski season in Switzerland?', a: 'The main Swiss ski season runs from December to April. Zermatt offers year-round skiing on the Theodul Glacier. Christmas and February half-term are the busiest and most expensive periods.' },
      { q: 'Do Swiss ski hotels include ski passes?', a: 'Most luxury Swiss ski hotels offer ski pass packages, though passes are rarely included in the base rate. A ski concierge service is standard at many luxury properties and can arrange passes, equipment rental and lessons.' },
    ]
  },

  'lake-hotels-switzerland': {
    title: 'Best Lake Hotels in Switzerland 2026',
    h1: 'Best Lake Hotels in Switzerland',
    description: 'Switzerland\'s finest lakeside hotels — from Lake Geneva to Lake Zurich, Lake Lucerne and Lake Maggiore, combining breathtaking water views with world-class Swiss hospitality.',
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Bürgenstock Resort',
      'Beau-Rivage Palace Lausanne',
      'Fairmont Le Montreux Palace',
      'Eden Roc Ascona',
      'Castello del Sole Ascona',
      'Grand Hotel Villa Castagnola Lugano',
      'Grand Hotel Vitznauerhof Lucerne',
      'Beau-Rivage Genève',
    ],
    faqs: [
      { q: 'What are the best lake hotels in Switzerland?', a: 'The finest lake hotels in Switzerland include La Réserve Genève on Lake Geneva, La Réserve Eden au Lac Zurich on Lake Zurich, Bürgenstock Resort above Lake Lucerne, Beau-Rivage Palace Lausanne, Fairmont Le Montreux Palace and Eden Roc Ascona on Lake Maggiore.' },
      { q: 'Which Swiss lake has the best luxury hotels?', a: 'Lake Geneva has the highest concentration of luxury lakeside hotels, with La Réserve Genève, Beau-Rivage Palace Lausanne, Beau-Rivage Genève and Fairmont Le Montreux Palace all ranked among Europe\'s finest. Lake Zurich, Lake Lucerne and Lake Maggiore also have exceptional options.' },
      { q: 'What makes Swiss lake hotels special?', a: 'Swiss lake hotels combine some of Europe\'s most dramatic scenery — crystal-clear Alpine lakes framed by mountain peaks — with the country\'s legendary hospitality standards. Many offer private lake access, water sports, terrace dining overlooking the water and rooms with panoramic lake views.' },
      { q: 'Are Swiss lake hotels good year round?', a: 'Yes — Swiss lake hotels are exceptional year-round. Summer offers lake swimming, sailing and outdoor dining. Autumn brings golden light and fewer crowds. Winter has a magical stillness with snow-capped mountains reflected in calm water. Spring sees the flowers bloom along the lakeside promenades.' },
    ]
  },

  'romantic-hotels-switzerland': {
    title: 'Best Romantic Hotels in Switzerland 2026',
    h1: 'Most Romantic Hotels in Switzerland',
    description: 'Switzerland\'s most romantic hotels for couples — from candlelit alpine palaces to lakeside suites with breathtaking mountain views.',
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Mont Cervin Palace',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Schweizerhof Zermatt',
      'The Alpina Gstaad',
      "Badrutt's Palace Hotel",
      'Eden Roc Ascona',
      'Castello del Sole Ascona',
      'Beau-Rivage Palace Lausanne',
    ],
    faqs: [
      { q: 'What are the most romantic hotels in Switzerland?', a: 'The most romantic hotels in Switzerland include La Réserve Genève for its dreamy lakeside setting, La Réserve Eden au Lac Zurich for city-lake romance, Mont Cervin Palace for Matterhorn views at dusk, Victoria-Jungfrau for Belle Époque grandeur and The Alpina Gstaad for intimate alpine luxury.' },
      { q: 'Which Swiss hotel is best for a honeymoon?', a: 'La Réserve Genève, Mont Cervin Palace, Schweizerhof Zermatt and Victoria-Jungfrau are all exceptional honeymoon hotels — each offering private dining, couples spa treatments and unforgettable alpine or lakeside settings.' },
      { q: 'What is the most scenic hotel in Switzerland?', a: 'Mont Cervin Palace in Zermatt offers one of Switzerland\'s most dramatic settings facing the iconic Matterhorn. La Réserve Genève on Lake Geneva and La Réserve Eden au Lac Zurich also offer exceptional water and mountain views.' },
    ]
  },

  'luxury-hotels-switzerland': {
    title: 'Best Luxury Hotels in Switzerland 2026',
    h1: 'Best Luxury Hotels in Switzerland',
    description: 'Discover Switzerland\'s finest luxury hotels — from Zermatt ski palaces to Geneva lakeside retreats. SwissNet partner hotels are featured first where they genuinely fit the category.',
    hotels: [
      'La Réserve Genève',
      'Mont Cervin Palace',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'La Réserve Eden au Lac Zurich',
      'Bellevue Palace',
      'Bürgenstock Resort',
      'The Dolder Grand',
      'The Chedi Andermatt',
      "Badrutt's Palace Hotel",
      'The Alpina Gstaad',
    ],
    faqs: [
      { q: 'What are the best luxury hotels in Switzerland?', a: 'Switzerland\'s finest luxury hotels include La Réserve Genève, Mont Cervin Palace in Zermatt, Victoria-Jungfrau Grand Hotel in Interlaken, Bellevue Palace in Bern, La Réserve Eden au Lac Zurich, Bürgenstock Resort, The Dolder Grand and The Chedi Andermatt.' },
      { q: 'Which is the most luxurious Swiss hotel?', a: 'La Réserve Genève, Bürgenstock Resort, The Dolder Grand, The Chedi Andermatt, Badrutt\'s Palace and Mont Cervin Palace are consistently among Switzerland\'s most luxurious hotels, each offering exceptional service, location and facilities.' },
      { q: 'How much does a luxury hotel in Switzerland cost?', a: 'Luxury hotels in Switzerland typically start from CHF 400/night, with the finest properties ranging from CHF 700 to CHF 2,000+ per night. Booking direct through SwissNet helps avoid OTA fees and can provide better hotel relationships.' },
      { q: 'What is Switzerland known for in luxury travel?', a: 'Switzerland is renowned for its exceptional hospitality tradition, stunning Alpine scenery, world-class ski resorts, thermal spas and Michelin-starred dining — making it one of the world\'s premier luxury travel destinations.' },
      { q: 'When is the best time to visit Switzerland for luxury travel?', a: 'Switzerland is a year-round luxury destination. Winter is perfect for skiing in Zermatt, St. Moritz and Davos, while summer offers hiking, lake swimming and outdoor dining in Alpine conditions.' },
    ]
  },

  'business-hotels-switzerland': {
    title: 'Best Business Hotels in Switzerland 2026',
    h1: 'Best Business Hotels in Switzerland',
    description: 'Switzerland\'s premier business hotels in Geneva, Zurich and Bern — combining world-class meeting facilities with luxury hospitality.',
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Bellevue Palace',
      'Baur au Lac',
      'Four Seasons Hotel des Bergues Geneva',
      'The Dolder Grand',
      'Mandarin Oriental Geneva',
      'Widder Hotel Zurich',
      'Park Hyatt Zurich',
      'Mandarin Oriental Savoy Zurich',
    ],
    category: 'City Luxury',
    faqs: [
      { q: 'What are the best business hotels in Switzerland?', a: 'The finest business hotels in Switzerland include La Réserve Genève and Four Seasons Hotel des Bergues in Geneva, La Réserve Eden au Lac Zurich, Baur au Lac, The Dolder Grand and Widder Hotel in Zurich, plus Bellevue Palace in Bern for government and diplomatic visits.' },
      { q: 'Which Swiss city is best for business travel?', a: 'Geneva and Zurich are Switzerland\'s top business destinations. Geneva hosts numerous international organisations and multinational headquarters, while Zurich is the financial capital with excellent transport links. Bern is ideal for political and diplomatic travel.' },
      { q: 'Do Swiss luxury hotels have good meeting facilities?', a: 'Yes — Swiss luxury hotels are renowned for their meeting and event facilities, combining state-of-the-art technology with exceptional catering, privacy and dedicated event coordination teams.' },
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
      { q: 'What else is Davos known for besides skiing?', a: 'Davos is internationally known as the home of the World Economic Forum, held each January. The town also has excellent cross-country skiing, a natural ice rink and the famous Davos Congress Centre.' },
    ]
  },

  'luxury-hotels-davos': {
    title: 'Best Luxury Hotels in Davos, Switzerland 2026',
    h1: 'Best Luxury Hotels in Davos',
    description: 'Davos\'s finest luxury hotels — combining world-class skiing, alpine wellness and the prestige of Europe\'s highest city.',
    region: 'Davos',
    faqs: [
      { q: 'What is the best luxury hotel in Davos?', a: 'Alpengold Hotel is one of Davos\'s most refined luxury properties, offering a warm alpine atmosphere, excellent spa facilities and prime access to the Parsenn and Jakobshorn ski areas.' },
      { q: 'Is Davos worth staying in for luxury travel?', a: 'Davos offers a compelling combination of world-class skiing, alpine wellness and international prestige. Its position as Europe\'s highest city and home to the World Economic Forum gives it a unique character among Swiss mountain resorts.' },
      { q: 'How does Davos compare to Zermatt for luxury?', a: 'Davos offers a more open, accessible alpine experience compared to the intimate car-free village of Zermatt. Davos suits those who want a larger ski area, congress facilities and a more international atmosphere alongside luxury accommodation.' },
    ]
  },

  'luxury-hotels-gstaad': {
    title: 'Best Luxury Hotels in Gstaad, Switzerland 2026',
    h1: 'Best Luxury Hotels in Gstaad',
    description: 'Gstaad is Switzerland\'s most exclusive alpine village — a discreet, chalet-style resort that has drawn royalty, celebrities and the global elite for over a century.',
    region: 'Gstaad',
    faqs: [
      { q: 'What is the best luxury hotel in Gstaad?', a: 'The Alpina Gstaad and Palace Hotel Gstaad are the two standout luxury properties in Gstaad — both offering exceptional service, world-class facilities and the exclusive atmosphere that defines this uniquely discreet alpine resort.' },
      { q: 'Why is Gstaad so exclusive?', a: 'Gstaad has maintained its exclusivity through strict building regulations that preserve the traditional chalet architecture, a deliberately small resort scale and a loyal clientele of European aristocracy, celebrities and ultra-high-net-worth guests who return generation after generation.' },
      { q: 'What is there to do in Gstaad besides skiing?', a: 'Gstaad offers exceptional summer hiking, the Menuhin Festival, polo, golf, tennis and some of Switzerland\'s finest boutique shopping. The resort is equally popular year-round for guests seeking privacy and natural beauty.' },
    ]
  },

  'luxury-hotels-lugano': {
    title: 'Best Luxury Hotels in Lugano, Switzerland 2026',
    h1: 'Best Luxury Hotels in Lugano',
    description: 'Lugano\'s finest luxury hotels on the shores of Lake Lugano — where Swiss hospitality meets Italian elegance in Switzerland\'s most Mediterranean city.',
    region: 'Lugano',
    faqs: [
      { q: 'What is the best luxury hotel in Lugano?', a: 'Hotel Splendide Royal and Villa Castagnola are Lugano\'s most celebrated luxury hotels, both offering exceptional lakeside settings, fine dining and the unique blend of Swiss service standards and Italian warmth that defines the Ticino experience.' },
      { q: 'What makes Lugano special for luxury travel?', a: 'Lugano offers something unique in Switzerland — the warmth and cuisine of northern Italy combined with Swiss precision and reliability. The lakeside setting, Mediterranean microclimate and the Lago di Lugano create an atmosphere unlike anywhere else in the country.' },
      { q: 'When is the best time to visit Lugano?', a: 'Lugano is at its best from April to October when the lakeside promenades, boat trips and outdoor dining are in full swing. The mild microclimate means it is one of the warmest destinations in Switzerland year-round.' },
    ]
  },

  'luxury-hotels-basel': {
    title: 'Best Luxury Hotels in Basel, Switzerland 2026',
    h1: 'Best Luxury Hotels in Basel',
    description: 'Basel\'s finest luxury hotels — in Switzerland\'s most culturally rich city, home to Art Basel and over 40 world-class museums.',
    region: 'Basel',
    faqs: [
      { q: 'What is the best luxury hotel in Basel?', a: 'Les Trois Rois (Three Kings Hotel) is Basel\'s most celebrated luxury hotel, a grand riverside property with a history stretching back to 1681 and a reputation for the finest service in the city.' },
      { q: 'When should I visit Basel for Art Basel?', a: 'Art Basel takes place each June in Basel, drawing the global art world for one of the most prestigious art fairs on earth. Hotels book out months in advance during this period so early reservation is essential.' },
      { q: 'What is Basel\'s location advantage?', a: 'Basel sits at the tri-border point of Switzerland, Germany and France, making it one of Europe\'s most strategically located cities. Zurich, Strasbourg, Freiburg and the Black Forest are all within easy reach.' },
    ]
  },

  'luxury-hotels-lucerne': {
    title: 'Best Luxury Hotels in Lucerne, Switzerland 2026',
    h1: 'Best Luxury Hotels in Lucerne',
    description: 'Lucerne\'s finest luxury hotels on the shores of Lake Lucerne — in what many consider Switzerland\'s most beautiful city.',
    region: 'Lucerne',
    faqs: [
      { q: 'What is the best luxury hotel in Lucerne?', a: 'Palace Hotel Lucerne and Hotel Schweizerhof Luzern are the standout luxury addresses in Lucerne, both offering exceptional lake views, impeccable Swiss service and proximity to the city\'s iconic Chapel Bridge and medieval old town.' },
      { q: 'Why is Lucerne considered so beautiful?', a: 'Lucerne combines a perfectly preserved medieval old town, the iconic wooden Chapel Bridge dating to 1333, a stunning setting on Lake Lucerne, and a dramatic mountain backdrop including Mount Pilatus and Rigi — creating one of the most photogenic cityscapes in Europe.' },
      { q: 'How far is Lucerne from Zurich and Interlaken?', a: 'Lucerne is approximately 50 minutes from Zurich by direct train and 2 hours from Interlaken, making it an ideal stop on a Swiss grand tour itinerary combining city luxury with Alpine scenery.' },
    ]
  },

  'luxury-hotels-verbier': {
    title: 'Best Luxury Hotels in Verbier, Switzerland 2026',
    h1: 'Best Luxury Hotels in Verbier',
    description: 'Verbier\'s finest luxury hotels — in the Alps\'s most vibrant ski resort, famous for world-class off-piste skiing and legendary après-ski.',
    region: 'Verbier',
    faqs: [
      { q: 'What is the best luxury hotel in Verbier?', a: 'W Verbier and Chalet d\'Adrien are among Verbier\'s finest luxury properties, combining world-class facilities with the resort\'s uniquely energetic atmosphere — the perfect base for serious skiers who want both performance and luxury.' },
      { q: 'How does Verbier compare to Zermatt for luxury skiing?', a: 'Verbier is more energetic and socially vibrant than Zermatt, with a younger clientele and legendary après-ski scene. Zermatt is more traditional and exclusive. Both offer world-class skiing — Verbier\'s off-piste terrain and Zermatt\'s Matterhorn setting are equally compelling for different reasons.' },
      { q: 'What is the Verbier Festival?', a: 'The Verbier Festival is one of the world\'s most prestigious classical music festivals, held each July. It draws the finest musicians and conductors for two weeks of concerts in spectacular Alpine surroundings — transforming Verbier into a cultural destination in summer.' },
    ]
  },

  'ski-hotels-verbier': {
    title: 'Best Ski Hotels in Verbier, Switzerland 2026',
    h1: 'Best Ski Hotels in Verbier',
    description: 'Verbier\'s top ski hotels with direct access to one of the Alps\'s most exciting ski domains — 412km of pistes across the Four Valleys.',
    region: 'Verbier',
    faqs: [
      { q: 'What are the best ski hotels in Verbier?', a: 'W Verbier is Verbier\'s most celebrated ski hotel, offering ski-in/ski-out access, exceptional dining and the energy of one of the Alps\'s most vibrant resort atmospheres. Chalet d\'Adrien provides a more intimate alternative.' },
      { q: 'How big is the Verbier ski area?', a: 'Verbier anchors the Four Valleys ski domain — one of the largest in the world at 412km of marked pistes. The domain connects Verbier, Nendaz, Veysonnaz, Thyon and La Tzoumaz, offering extraordinary variety for all skill levels.' },
      { q: 'Is Verbier good for off-piste skiing?', a: 'Verbier is regarded as one of the world\'s premier off-piste destinations. The Vallon d\'Arby and the famous Tortin couloir draw expert skiers and freeriders from around the world. The resort\'s high-altitude terrain and reliable snow make it exceptional for backcountry skiing.' },
    ]
  },

  'business-city-hotels-switzerland': {
    title: 'Best Business & City Hotels in Switzerland 2026',
    h1: 'Best Business & City Hotels in Switzerland',
    description: 'Switzerland\'s premier business hotels in Geneva, Zurich and Bern — combining world-class meeting facilities, exceptional connectivity and luxury hospitality for the discerning business traveller.',
    hotels: [
      'La Réserve Genève',
      'La Réserve Eden au Lac Zurich',
      'Bellevue Palace',
      'Baur au Lac',
      'Four Seasons Hotel des Bergues Geneva',
      'The Dolder Grand',
      'Mandarin Oriental Geneva',
      'Widder Hotel Zurich',
      'Park Hyatt Zurich',
      'Mandarin Oriental Savoy Zurich',
    ],
    faqs: [
      { q: 'What are the best business hotels in Switzerland?', a: 'The finest business hotels in Switzerland include La Réserve Genève and Four Seasons Hotel des Bergues in Geneva, La Réserve Eden au Lac Zurich, Baur au Lac, The Dolder Grand and Widder Hotel in Zurich, plus Bellevue Palace in Bern for government and diplomatic stays.' },
      { q: 'Which Swiss city is best for business travel?', a: 'Geneva and Zurich are Switzerland\'s two premier business destinations. Geneva hosts the United Nations, WHO and hundreds of multinational headquarters, while Zurich is Europe\'s leading financial centre with the best air connections. Bern is the political capital and ideal for government and diplomatic visits.' },
      { q: 'What should I look for in a Swiss business hotel?', a: 'The best Swiss business hotels combine fast and reliable WiFi, dedicated meeting and boardroom facilities, proximity to airports or financial districts, efficient concierge services and excellent restaurants for client entertainment — all within a luxury setting that reflects well on your organisation.' },
      { q: 'Do Swiss luxury hotels cater well for business travellers?', a: 'Switzerland has one of the world\'s most refined business hospitality cultures. Swiss luxury hotels typically offer dedicated business centres, express laundry and pressing, early breakfast service, discreet and efficient service standards, and a level of privacy and professionalism that makes them ideal for sensitive corporate visits.' },
    ]
  },

  'family-hotels-switzerland': {
    title: 'Best Family Hotels in Switzerland 2026',
    h1: 'Best Family Hotels in Switzerland',
    description: 'Switzerland\'s finest family-friendly luxury hotels — combining exceptional childcare, outdoor adventures and Swiss hospitality for unforgettable family holidays.',
    hotels: [
      'Schweizerhof Zermatt',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Hotel Adula',
      'Alpengold Hotel',
      'Mont Cervin Palace',
      'The Alpina Gstaad',
      'Bürgenstock Resort',
      'Grand Resort Bad Ragaz',
      'Fairmont Le Montreux Palace',
      'Suvretta House',
    ],
    faqs: [
      { q: 'What are the best family hotels in Switzerland?', a: 'The finest family hotels in Switzerland include Schweizerhof Zermatt for its family suites and ski-friendly environment, Victoria-Jungfrau for its spacious rooms and Jungfrau adventures, Hotel Adula in Flims for its exceptional natural setting and Alpengold Hotel in Davos for alpine activities.' },
      { q: 'Is Switzerland good for a family ski holiday?', a: 'Switzerland is one of the world\'s best destinations for a family ski holiday. Zermatt\'s car-free village is exceptionally safe for children, all major resorts have excellent ski schools from age 3, and the combination of skiing, sledging and alpine activities suits all ages.' },
      { q: 'What age is Switzerland suitable for family travel?', a: 'Switzerland is suitable for families with children of all ages. Toddlers enjoy the novelty of mountain trains and cable cars, school-age children thrive with skiing and outdoor adventures, and teenagers appreciate the combination of sport, nature and the sophistication of Swiss resort life.' },
    ]
  },

  'spa-hotels-switzerland': {
    title: 'Best Spa Hotels in Switzerland 2026',
    h1: 'Best Spa Hotels in Switzerland',
    description: 'Switzerland\'s finest spa hotels — where Alpine thermal traditions, world-class treatments and breathtaking mountain settings combine for the ultimate wellness escape.',
    hotels: [
      'La Réserve Genève',
      'Victoria-Jungfrau Grand Hotel Interlaken',
      'Hotel Adula',
      'Bürgenstock Resort',
      'The Dolder Grand',
      'Six Senses Crans-Montana',
      'Grand Resort Bad Ragaz',
      'The Chedi Andermatt',
      'Clinique La Prairie',
      'Le Grand Bellevue Gstaad',
    ],
    faqs: [
      { q: 'What are the best spa hotels in Switzerland?', a: 'The finest spa hotels in Switzerland include La Réserve Genève with its world-renowned Spa Nescens, Victoria-Jungfrau in Interlaken, Hotel Adula in Flims, Bürgenstock Resort, The Dolder Grand, Six Senses Crans-Montana and Grand Resort Bad Ragaz.' },
      { q: 'What makes Swiss spa hotels different?', a: 'Swiss spa hotels combine the country\'s centuries-old tradition of therapeutic Alpine bathing with modern medical wellness expertise. Many use local botanicals, glacier water and Alpine mineral springs in their treatments — creating experiences genuinely rooted in the landscape.' },
      { q: 'What should I expect from a Swiss luxury spa?', a: 'A Swiss luxury spa typically features indoor and outdoor pools, a full sauna landscape, hammam, dedicated treatment rooms for couples and individuals, and a programme of Alpine-inspired treatments. The finest Swiss spas also offer medical wellness programmes and nutritional guidance.' },
    ]
  },

  'luxury-hotels-ascona': {
    title: 'Best Luxury Hotels in Ascona, Switzerland 2026',
    h1: 'Best Luxury Hotels in Ascona',
    description: 'Ascona\'s finest luxury hotels on the shores of Lake Maggiore — where Swiss quality meets Italian elegance in Switzerland\'s most glamorous lakeside village.',
    region: 'Ascona',
    faqs: [
      { q: 'What is the best luxury hotel in Ascona?', a: 'Eden Roc Ascona is widely regarded as the finest luxury hotel on Lake Maggiore — a legendary clifftop retreat with an iconic infinity pool, Michelin-starred dining and a clientele that has included some of the world\'s most celebrated names. Castello del Sole is an equally extraordinary alternative for guests seeking a complete estate experience with vineyards and exceptional spa facilities.' },
      { q: 'What makes Ascona special for luxury travel?', a: 'Ascona offers something unique in Switzerland — the warmth, cuisine and Mediterranean atmosphere of northern Italy combined with Swiss precision and reliability. The combination of Lake Maggiore\'s extraordinary scenery, the famous Piazza Motta, the exceptional concentration of luxury hotels and a microclimate that delivers more sunshine than almost anywhere in Switzerland makes it genuinely special.' },
      { q: 'When is the best time to visit Ascona?', a: 'Ascona is at its finest from April to October, with the summer months offering warm lake swimming, outdoor dining and the famous JazzAscona festival in June. September and October are particularly beautiful with mild temperatures, fewer crowds and the harvest season in the surrounding Ticino vineyards.' },
    ]
  },

  'luxury-hotels-andermatt': {
    title: 'Best Luxury Hotels in Andermatt, Switzerland 2026',
    h1: 'Best Luxury Hotels in Andermatt',
    description: 'Andermatt\'s finest luxury hotels — in one of the Swiss Alps\'s most exciting new destinations, home to The Chedi and world-class skiing.',
    region: 'Andermatt',
    faqs: [
      { q: 'What is the best luxury hotel in Andermatt?', a: 'The Chedi Andermatt is unquestionably the finest luxury hotel in Andermatt and one of the great ski hotels of the world — an Asian-inspired 5-star resort with the longest indoor pool in the Alps, multiple Michelin-starred restaurants and an exceptional spa. It has single-handedly transformed Andermatt into an internationally recognised luxury destination.' },
      { q: 'Is Andermatt good for skiing?', a: 'Andermatt is one of the most exciting ski destinations in Switzerland. The SkiArena Andermatt-Sedrun covers 180km of pistes across two cantons, with exceptional high-altitude terrain, reliable snow cover and some of the best off-piste skiing in the Alps. The resort is also connected to Sedrun and Disentis, making it one of the largest ski areas in Central Switzerland.' },
      { q: 'How do I get to Andermatt?', a: 'Andermatt is located at the heart of the Swiss Alps at the junction of the Gotthard, Furka and Oberalp passes. By train, it is approximately 2 hours from Zurich and accessible via the famous Glacier Express from Zermatt. By car, it is reached via the A2 motorway through the Gotthard Tunnel from Zurich or Lugano.' },
    ]
  },

  'luxury-hotels-crans-montana': {
    title: 'Best Luxury Hotels in Crans-Montana, Switzerland 2026',
    h1: 'Best Luxury Hotels in Crans-Montana',
    description: 'Crans-Montana\'s finest luxury hotels on the sunny balcony of the Swiss Alps — world-class skiing, golf and Alpine wellness.',
    region: 'Crans-Montana',
    faqs: [
      { q: 'What is the best luxury hotel in Crans-Montana?', a: 'Crans Ambassador is one of Crans-Montana\'s finest luxury hotels, combining excellent ski access with panoramic Rhône Valley views and exceptional wellness facilities.' },
      { q: 'What makes Crans-Montana special?', a: 'Crans-Montana is known as the sunniest ski resort in Switzerland, with exceptional sunshine hours, the FIS World Cup downhill course and a sophisticated resort atmosphere.' },
    ]
  },

  'luxury-hotels-flims': {
    title: 'Best Luxury Hotels in Flims, Switzerland 2026',
    h1: 'Best Luxury Hotels in Flims',
    description: 'Flims\'s finest luxury hotels in the heart of Graubünden — surrounded by the Rhine Gorge, alpine lakes and the Weisse Arena ski domain.',
    region: 'Flims',
    faqs: [
      { q: 'What is the best luxury hotel in Flims?', a: 'Hotel Adula is the finest luxury hotel in Flims, offering exceptional wellness facilities, farm-to-table dining and direct access to the stunning Flims Laax natural landscape.' },
      { q: 'Why stay in Flims?', a: 'Flims offers a unique combination of the Weisse Arena ski domain, the turquoise Caumasee lake, the dramatic Rhine Gorge and some of Switzerland\'s most pristine Alpine scenery.' },
    ]
  },

  'luxury-hotels-montreux': {
    title: 'Best Luxury Hotels in Montreux, Switzerland 2026',
    h1: 'Best Luxury Hotels in Montreux',
    description: 'Montreux\'s finest luxury hotels on the Swiss Riviera — where Lake Geneva meets the Alps in Switzerland\'s most celebrated lakeside resort.',
    region: 'Montreux',
    faqs: [
      { q: 'What is the best luxury hotel in Montreux?', a: 'Fairmont Le Montreux Palace is the defining grand hotel of the Swiss Riviera — a magnificent Belle Époque palace directly on Lake Geneva that has hosted royalty, jazz legends and international dignitaries for over a century. Its combination of historic grandeur, exceptional spa, world-class dining and the most celebrated lakeside position in Switzerland makes it the natural first choice.' },
      { q: 'What is the Montreux Jazz Festival?', a: 'The Montreux Jazz Festival is one of the world\'s most prestigious music events, held each July on the shores of Lake Geneva. Founded in 1967 by Claude Nobs, it has hosted virtually every major artist in jazz, rock and soul — from Miles Davis and Ray Charles to David Bowie and Prince. Hotels in Montreux book out months in advance during festival period.' },
      { q: 'What else is there to do in Montreux?', a: 'Montreux offers exceptional year-round activities beyond the Jazz Festival. The Château de Chillon is a 20-minute walk along the lake promenade. The Swiss Riviera wine route through the Lavaux UNESCO terraced vineyards is a short train ride away. Geneva is 1 hour by train, and the Bernese Alps are easily accessible for day trips.' },
    ]
  },
}

function sortPartnersFirst(hotels: any[]) {
  return [...hotels]
    .sort((a, b) => {
      if (a.is_partner && !b.is_partner) return -1
      if (!a.is_partner && b.is_partner) return 1
      return (b.rating || 0) - (a.rating || 0)
    })
    .slice(0, MAX_HOTELS_PER_PAGE)
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

async function getHotelsForPage(page: typeof PROMPT_PAGES[string]) {
  if (page.hotels) {
    const { data: selectedHotels } = await supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .in('name', page.hotels)

    const ranked = page.hotels
      .map((name) => selectedHotels?.find((h: any) => h.name === name))
      .filter(Boolean)

    return ranked.slice(0, MAX_HOTELS_PER_PAGE)
  }

  if (page.region) {
    let query = supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .eq('region', page.region)

    if (page.category) query = query.eq('category', page.category)

    const { data } = await query
      .order('is_partner', { ascending: false })
      .order('rating', { ascending: false })
      .limit(MAX_HOTELS_PER_PAGE)

    return data || []
  }

  if (page.category) {
    const { data } = await supabase
      .from('hotels')
      .select('*')
      .eq('is_active', true)
      .eq('category', page.category)
      .order('is_partner', { ascending: false })
      .order('rating', { ascending: false })
      .limit(MAX_HOTELS_PER_PAGE)

    return data || []
  }

  const { data } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true)
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false })
    .limit(MAX_HOTELS_PER_PAGE)

  return data || []
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
                            {hotel.is_partner && (
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

                        {hotel.is_partner && hotel.direct_booking_url && (
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