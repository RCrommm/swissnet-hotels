import { supabase } from '@/lib/supabase'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://swissnethotels.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/hotels`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  // Destination pages
  const destinations = ['zermatt', 'geneva', 'st-moritz', 'interlaken', 'zurich', 'gstaad', 'lucerne', 'verbier']
  const destinationPages: MetadataRoute.Sitemap = destinations.map(slug => ({
    url: `${baseUrl}/destinations/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Hotel pages
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, updated_at')
    .eq('is_active', true)

  const hotelPages: MetadataRoute.Sitemap = (hotels || []).map(hotel => ({
    url: `${baseUrl}/hotels/${hotel.id}`,
    lastModified: new Date(hotel.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...destinationPages, ...hotelPages]
}