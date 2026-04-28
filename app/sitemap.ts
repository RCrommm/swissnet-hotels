import { supabase } from '@/lib/supabase'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://swissnethotels.com'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/hotels`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const destinations = ['zermatt', 'geneva', 'st-moritz', 'interlaken', 'zurich', 'gstaad', 'lucerne', 'verbier']
  const destinationPages: MetadataRoute.Sitemap = destinations.map(slug => ({
    url: `${baseUrl}/destinations/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, updated_at, is_partner')
    .eq('is_active', true)

  const hotelPages: MetadataRoute.Sitemap = (hotels || []).map(hotel => ({
    url: `${baseUrl}/hotels/${hotel.id}`,
    lastModified: new Date(hotel.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: hotel.is_partner ? 0.9 : 0.7,
  }))

  // Intent pages for partner hotels only
  const intents = ['honeymoon', 'wellness', 'skiing', 'families', 'business']
  const partnerHotels = (hotels || []).filter(h => h.is_partner)
  const intentPages: MetadataRoute.Sitemap = partnerHotels.flatMap(hotel =>
    intents.map(intent => ({
      url: `${baseUrl}/hotels/${hotel.id}/${intent}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  )

  return [...staticPages, ...destinationPages, ...hotelPages, ...intentPages]
}