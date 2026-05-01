import { supabase } from '@/lib/supabase'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://swissnethotels.com'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/hotels`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const destinations = ['zermatt', 'geneva', 'st-moritz', 'interlaken', 'zurich', 'gstaad', 'lucerne', 'verbier', 'davos', 'crans-montana', 'flims', 'bern', 'basel', 'lugano'] 
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
  'wellness-hotels-flims', 'ski-hotels-crans-montana', 'ski-hotels-davos',
  'luxury-hotels-davos', 'luxury-hotels-gstaad', 'luxury-hotels-lugano', 'luxury-hotels-basel', 'luxury-hotels-lucerne', 'luxury-hotels-verbier', 'ski-hotels-verbier', 'honeymoon-hotels-switzerland', 'family-hotels-switzerland', 'spa-hotels-switzerland'
]
  const promptPages: MetadataRoute.Sitemap = promptSlugs.map(slug => ({
    url: `${baseUrl}/best/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, slug, updated_at, is_partner, region')
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
  const subPages = ['rooms', 'dining', 'spa', 'experiences']
const subPageUrls: MetadataRoute.Sitemap = partnerHotels.flatMap((hotel: any) =>
  subPages.map(page => ({
    url: `${baseUrl}/hotels/${hotel.slug || hotel.id}/${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
)

const partnerSlugs = partnerHotels.map((h: any) => h.slug)
const allSlugs = (hotels || []).map((h: any) => h.slug)

const comparePages: MetadataRoute.Sitemap = partnerHotels.flatMap((hotelA: any) =>
  (hotels || [])
    .filter((hotelB: any) => hotelB.id !== hotelA.id && hotelB.region === hotelA.region)
    .slice(0, 3)
    .map((hotelB: any) => ({
      url: `${baseUrl}/compare/${hotelA.slug}-vs-${hotelB.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
)

return [...staticPages, ...destinationPages, ...promptPages, ...hotelPages, ...intentPages, ...subPageUrls, ...comparePages]}