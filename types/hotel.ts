export interface Hotel {
  id: string
  name: string
  location: string
  region: string
  category: string
  rating: number
  nightly_rate_chf: number
  images: string[]
  amenities: string[]
  best_for: string[]
  description: string
  direct_booking_url: string
  exclusive_offer: string
  contact_email: string
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  hotel_id?: string
  hotel_name?: string
  check_in?: string
  check_out?: string
  guests?: number
  message?: string
  source: string
  created_at: string
}