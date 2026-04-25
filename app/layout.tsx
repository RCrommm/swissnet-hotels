import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'SwissNet Hotels — Direct Booking for Swiss Luxury Hotels',
  description: 'Discover and book Switzerland\'s finest luxury hotels directly. Skip the OTAs. Get exclusive rates and personalised offers.',
  keywords: 'Switzerland luxury hotels, Swiss ski hotels, Zermatt hotels, St Moritz hotels, direct booking',
  openGraph: {
    title: 'SwissNet Hotels',
    description: 'Switzerland\'s AI-powered luxury hotel discovery platform',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main>{children}</main>
        <footer className="bg-stone-900 text-stone-300 py-16 mt-20">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-white font-display text-xl mb-4">SwissNet Hotels</h3>
              <p className="text-sm leading-relaxed">Switzerland's AI-powered luxury hotel discovery platform. Direct bookings, exclusive offers, no middlemen.</p>
            </div>
            <div>
              <h4 className="text-white text-sm uppercase tracking-widest mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/hotels" className="hover:text-amber-400 transition-colors">All Hotels</a></li>
                <li><a href="/hotels?region=Zermatt" className="hover:text-amber-400 transition-colors">Zermatt</a></li>
                <li><a href="/hotels?region=St.+Moritz" className="hover:text-amber-400 transition-colors">St. Moritz</a></li>
                <li><a href="/hotels?category=Wellness+Retreat" className="hover:text-amber-400 transition-colors">Wellness</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm uppercase tracking-widest mb-4">For Hotels</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:hotels@swissnethostels.com" className="hover:text-amber-400 transition-colors">List your hotel</a></li>
                <li><a href="/admin" className="hover:text-amber-400 transition-colors">Hotel login</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t border-stone-700 text-xs text-stone-500">
            © {new Date().getFullYear()} SwissNet Hotels. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}