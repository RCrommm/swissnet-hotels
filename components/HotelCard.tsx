import Link from 'next/link'
import { Hotel } from '@/types/hotel'
import { Star, MapPin } from 'lucide-react'

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <div className="group bg-white border border-stone-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={hotel.images[0] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'} 
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hotel.is_featured && (
          <div className="absolute top-3 left-3 bg-amber-700 text-white text-xs px-3 py-1 tracking-widest uppercase">
            Featured
          </div>
        )}
        {hotel.exclusive_offer && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/70 text-white text-xs px-3 py-2">
            🎁 {hotel.exclusive_offer}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-700 mb-1">{hotel.category}</p>
            <h3 className="font-display text-lg font-bold text-stone-800">{hotel.name}</h3>
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
            <span className="text-sm font-semibold">{hotel.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-stone-500 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{hotel.location}</span>
        </div>

        <p className="text-stone-600 text-sm line-clamp-2 mb-4 leading-relaxed">
          {hotel.description}
        </p>

        {/* Amenities preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {hotel.amenities.slice(0, 3).map(a => (
            <span key={a} className="text-xs bg-stone-100 text-stone-600 px-2 py-1">{a}</span>
          ))}
          {hotel.amenities.length > 3 && (
            <span className="text-xs text-stone-400">+{hotel.amenities.length - 3} more</span>
          )}
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <div>
            <p className="text-xs text-stone-500">From</p>
            <p className="font-display text-xl font-bold text-stone-800">
              CHF {hotel.nightly_rate_chf.toLocaleString()}
              <span className="text-sm font-normal text-stone-500"> /night</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/hotels/${hotel.id}`} className="btn-outline text-xs py-2 px-4">
              View
            </Link>
            <a 
              href={hotel.direct_booking_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary text-xs py-2 px-4"
            >
              Book Direct
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}