import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HotelCard from '@/components/HotelCard'
import LeadForm from '@/components/LeadForm'

export default async function HomePage() {
  const { data: featuredHotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(3)

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600')" }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6 pt-24">
          <p className="text-amber-400 text-xs uppercase tracking-[0.3em] mb-6">Powered by AI</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            Switzerland's Finest<br />Hotels, Directly
          </h1>
          <p className="text-stone-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover and book Switzerland's most exceptional luxury hotels. No OTA fees. Direct rates. Exclusive offers you won't find anywhere else.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hotels" className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-10 py-4 tracking-wide uppercase text-sm transition-colors">
              Explore Hotels
            </Link>
            <a href="#enquire" className="border border-white text-white hover:bg-white hover:text-stone-900 font-semibold px-10 py-4 tracking-wide uppercase text-sm transition-colors">
              Send Enquiry
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-stone-900 py-8">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '15+', label: 'Partner Hotels' },
            { n: '10', label: 'Swiss Regions' },
            { n: '0%', label: 'OTA Commission' },
            { n: 'AI', label: 'Powered Discovery' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display text-3xl font-bold text-amber-400">{s.n}</p>
              <p className="text-stone-400 text-xs uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-amber-700 text-xs uppercase tracking-[0.3em] mb-3">Handpicked Selection</p>
          <h2 className="font-display text-4xl font-bold text-stone-800">Featured Properties</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(featuredHotels || []).map(hotel => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/hotels" className="btn-outline">
            View All Hotels
          </Link>
        </div>
      </section>

      {/* Why SwissNet */}
      <section className="bg-stone-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-stone-800 mb-4">Why Book Direct?</h2>
            <p className="text-stone-600">Hotels save 15–25% in OTA commissions. You get better rates and real human service.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '✦', title: 'No Hidden Fees', desc: 'Direct rates are always equal to or better than any OTA. No booking fees. No service charges.' },
              { icon: '◆', title: 'Exclusive Offers', desc: 'Partner hotels offer perks only available through SwissNet Hotels — spa credits, room upgrades, transfers.' },
              { icon: '▲', title: 'AI-Matched', desc: 'Our AI finds the perfect hotel for your specific dates, group, and preferences in seconds.' },
            ].map(f => (
              <div key={f.title} className="text-center p-6">
                <div className="text-amber-600 text-2xl mb-4">{f.icon}</div>
                <h3 className="font-display text-xl font-bold text-stone-800 mb-3">{f.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead capture */}
      <section id="enquire" className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-amber-700 text-xs uppercase tracking-[0.3em] mb-3">Personal Service</p>
          <h2 className="font-display text-4xl font-bold text-stone-800 mb-4">Not Sure Where to Stay?</h2>
          <p className="text-stone-600">Tell us your dates and preferences. Our concierge team will match you with the perfect Swiss hotel within 24 hours.</p>
        </div>
        <div className="bg-white border border-stone-200 p-8 shadow-sm">
          <LeadForm />
        </div>
      </section>
    </div>
  )
}