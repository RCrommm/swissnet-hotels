type RoomType = {
  id: string
  is_available: boolean
  name: string
  description?: string
  max_occupancy?: number
  bed_type?: string
  size_sqm?: number
  amenities?: string[]
  base_rate_chf?: number
  view?: string
  type_category?: string
  short_description?: string
  ai_description?: string
  thumbnail_url?: string
  images?: Array<string | { url: string }>
  booking_url?: string
  price_per_night?: number
  price_currency?: string
  price_weekend?: number
  price_peak?: number
  min_stay_nights?: number
  floor_level?: string
  highlights?: string[]
  sort_order?: number
}

type Hotel = {
  id: string
  slug?: string
  name: string
  description?: string
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  star_rating?: number
  phone?: string
  email?: string
  hero_image?: string
  thumbnail_url?: string
  amenities?: string[]
  price_range?: string
}

export default function RoomTypeSchema({ hotel, roomTypes }: { hotel: Hotel; roomTypes: RoomType[] }) {
  if (!hotel || !roomTypes?.length) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}#hotel`,
    name: hotel.name,
    description: hotel.description,
    address: hotel.address ? {
      '@type': 'PostalAddress',
      streetAddress: hotel.address,
      addressLocality: hotel.city,
      addressCountry: hotel.country || 'CH',
    } : undefined,
    geo: (hotel.latitude && hotel.longitude) ? {
      '@type': 'GeoCoordinates',
      latitude: hotel.latitude,
      longitude: hotel.longitude,
    } : undefined,
    starRating: hotel.star_rating ? { '@type': 'Rating', ratingValue: hotel.star_rating } : undefined,
    amenityFeature: (hotel.amenities || []).map((a: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
    containsPlace: roomTypes.filter(rt => rt.is_available).map(rt => ({
      '@type': 'HotelRoom',
      '@id': `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}#room-${rt.id}`,
      name: rt.name,
      description: rt.ai_description || rt.description || rt.short_description,
      occupancy: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: rt.max_occupancy || 2,
      },
      bed: rt.bed_type ? {
        '@type': 'BedDetails',
        typeOfBed: rt.bed_type,
        numberOfBeds: 1,
      } : undefined,
      floorSize: rt.size_sqm ? {
        '@type': 'QuantitativeValue',
        value: rt.size_sqm,
        unitCode: 'MTK',
      } : undefined,
      amenityFeature: (rt.amenities || []).map((a: string) => ({
        '@type': 'LocationFeatureSpecification',
        name: a,
        value: true,
      })),
      offers: (rt.base_rate_chf || rt.price_per_night) ? {
        '@type': 'Offer',
        price: rt.base_rate_chf || rt.price_per_night,
        priceCurrency: rt.price_currency || 'CHF',
        url: rt.booking_url || `https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`,
        availability: 'https://schema.org/InStock',
      } : undefined,
      additionalProperty: rt.view ? [{
        '@type': 'PropertyValue',
        name: 'View',
        value: rt.view,
      }] : undefined,
    })),
  }

  const clean = JSON.parse(JSON.stringify(schema, (_, v) => v === undefined ? undefined : v))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clean) }}
    />
  )
}