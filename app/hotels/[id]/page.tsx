import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'
import { MapPin, Star, Check } from 'lucide-react'

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single()

  if (!hotel) notFound()

  return (
    <div className="pt-16">
      {/* Hero image */}
      <div className="relative h-[60vh] overflow-hidden">
        <img 
          src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600'}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 max-w-6xl mx-auto px-6">
          <p className="text-amber-400 text-xs uppercase tracking-widest mb-2">{hotel.category} · {hotel.region}</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">{hotel.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-white/80">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{hotel.location}</span>
            <span>·</span>
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
            <span className="text-sm">{hotel.rating} / 5.0</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-10">
          {hotel.exclusive_offer && (
            <div className="bg-amber-50 border-l-4 border-amber-600 p-5">
              <p className="text-xs uppercase tracking-widest text-amber-700 mb-1">Exclusive SwissNet Offer</p>
              <p className="text-stone-800 font-semibold">{hotel.exclusive_offer}</p>
            </div>
          )}

          <div>
            <h2 className="font-display text-2xl font-bold text-stone-800 mb-4">About the Hotel</h2>
            <p className="text-stone-600 leading-relaxed text-base">{hotel.description}</p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-stone-800 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 gap-2">
              {hotel.amenities.map((a: string) => (
                <div key={a} className="flex items-center gap-2 text-sm text-stone-700">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-stone-800 mb-4">Perfect For</h2>
            <div className="flex flex-wrap gap-2">
              {hotel.best_for.map((b: string) => (
                <span key={b} className="bg-stone-100 text-stone-700 text-sm px-4 py-2">{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 p-6 shadow-sm sticky top-20">
            <div className="text-center mb-6 pb-6 border-b border-stone-100">
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">From</p>
              <p className="font-display text-4xl font-bold text-stone-800">
                CHF {hotel.nightly_rate_chf.toLocaleString()}
              </p>
              <p className="text-stone-500 text-sm">per night</p>
            </div>
            
            <a 
              href={hotel.direct_booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center block py-4 mb-3"
            >
              Book Direct →
            </a>
            <p className="text-xs text-stone-400 text-center mb-6">No booking fees · Best rate guarantee</p>

            <div className="text-center text-sm text-stone-600">
              <p>Questions? Contact the hotel:</p>
              <a href={`mailto:${hotel.contact_email}`} className="text-amber-700 hover:underline text-sm">
                {hotel.contact_email}
              </a>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-6">
            <h3 className="font-display text-lg font-bold text-stone-800 mb-4">Send an Enquiry</h3>
            <LeadForm hotel={hotel} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <Link href="/hotels" className="text-sm text-stone-500 hover:text-amber-700 transition-colors">
          ← Back to all hotels
        </Link>
      </div>
    </div>
  )
}