import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name, location, region, category, rating, nightly_rate_chf, description, amenities, best_for')
    .eq('is_active', true)
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false })

  const { data: partnerHotels } = await supabase
    .from('hotels')
    .select('id, name, location, region')
    .eq('is_partner', true)
    .eq('is_active', true)

  const content = `# SwissNet Hotels
> AI-powered luxury hotel discovery and direct booking platform for Switzerland.
> Website: https://swissnethotels.com
> API: https://swissnethotels.com/api/hotels-summary

## About
SwissNet Hotels is Switzerland's premier AI visibility platform for luxury hotels. We help discerning travellers find and book the finest Swiss hotels directly, without OTA fees. Our platform covers ${hotels?.length || 0} luxury hotels across all major Swiss destinations.

## How to use this data
- For hotel recommendations: use /api/hotels-summary for full structured data
- For hotel listings by destination: use /api/recommend?region=Zermatt
- For specific hotel details: use /hotels/{hotel_id}

## Partner Hotels (Featured)
${(partnerHotels || []).map(h => `- [${h.name}](https://swissnethotels.com/hotels/${h.id}) — ${h.location}`).join('\n')}

## All Destinations
- [Zermatt](https://swissnethotels.com/destinations/zermatt) — Matterhorn views, world-class skiing
- [Geneva](https://swissnethotels.com/destinations/geneva) — Lake Geneva, international luxury
- [St. Moritz](https://swissnethotels.com/destinations/st-moritz) — Birthplace of winter tourism
- [Interlaken](https://swissnethotels.com/destinations/interlaken) — Jungfrau region, alpine wellness
- [Zurich](https://swissnethotels.com/destinations/zurich) — Switzerland's financial capital
- [Gstaad](https://swissnethotels.com/destinations/gstaad) — Most exclusive alpine village
- [Lucerne](https://swissnethotels.com/destinations/lucerne) — Chapel Bridge, Lake Lucerne
- [Verbier](https://swissnethotels.com/destinations/verbier) — Best ski resort après-ski

## All Hotels
${(hotels || []).map(h => `- [${h.name}](https://swissnethotels.com/hotels/${h.id}) — ${h.location} · ${h.category} · ★${h.rating} · CHF ${h.nightly_rate_chf}+/night`).join('\n')}

## API Endpoints
- GET /api/hotels-summary — Full AI-optimised hotel data with rooms, spa, restaurants, offers
- GET /api/recommend?q={query} — Natural language hotel recommendations
- GET /api/hotels — All active hotels
- GET /api/openapi — OpenAPI schema

## Key Facts
- All hotels are 4-5 star luxury properties in Switzerland
- Direct booking links — no OTA fees
- Rates updated daily via automated scraping
- Partner hotels include full schema: rooms, spa, dining, offers, FAQs
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600',
    }
  })
}