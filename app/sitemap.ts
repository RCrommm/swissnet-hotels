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

  const promptSlugs = [
    'luxury-hotels-zermatt', 'ski-hotels-zermatt', 'luxury-hotels-geneva',
    'luxury-hotels-zurich', 'luxury-hotels-interlaken', 'luxury-hotels-bern',
    'ski-hotels-switzerland', 'wellness-hotels-switzerland', 'romantic-hotels-switzerland',
    'luxury-hotels-switzerland', 'business-hotels-switzerland',
    'wellness-hotels-flims', 'ski-hotels-crans-montana', 'ski-hotels-davos'
  ]
  const promptPages: MetadataRoute.Sitemap = promptSlugs.map(slug => ({
    url: `${baseUrl}/best/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, slug, updated_at, is_partner')
    .eq('is_active', true)

  const hotelPages: MetadataRoute.Sitemap = (hotels || []).map((hotel: any) => ({
    url: `${baseUrl}/hotels/${hotel.slug || hotel.id}`,
    lastModified: new Date(hotel.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: hotel.is_partner ? 0.9 : 0.7,
  }))

  const intents = ['honeymoon', 'wellness', 'skiing', 'families', 'business']
  const partnerHotels = (hotels || []).filter((h: any) => h.is_partner)
  const intentPages: MetadataRoute.Sitemap = partnerHotels.flatMap((hotel: any) =>
    intents.map(intent => ({
      url: `${baseUrl}/hotels/${hotel.slug || hotel.id}/${intent}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  )

  return [...staticPages, ...destinationPages, ...promptPages, ...hotelPages, ...intentPages]
}