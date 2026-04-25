'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold text-stone-800 tracking-wide">
          SwissNet <span className="text-amber-700">Hotels</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/hotels" className="text-sm text-stone-600 hover:text-amber-700 transition-colors tracking-wide uppercase">
            Hotels
          </Link>
          <Link href="/hotels?region=Zermatt" className="text-sm text-stone-600 hover:text-amber-700 transition-colors tracking-wide uppercase">
            Zermatt
          </Link>
          <Link href="/hotels?region=St.+Moritz" className="text-sm text-stone-600 hover:text-amber-700 transition-colors tracking-wide uppercase">
            St. Moritz
          </Link>
          <Link href="/hotels?category=Wellness+Retreat" className="text-sm text-stone-600 hover:text-amber-700 transition-colors tracking-wide uppercase">
            Wellness
          </Link>
          <Link href="/hotels" className="btn-primary text-xs py-2 px-5">
            Find a Hotel
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 flex flex-col gap-4">
          <Link href="/hotels" className="text-sm uppercase tracking-wide" onClick={() => setMenuOpen(false)}>All Hotels</Link>
          <Link href="/hotels?region=Zermatt" className="text-sm uppercase tracking-wide" onClick={() => setMenuOpen(false)}>Zermatt</Link>
          <Link href="/hotels?region=St.+Moritz" className="text-sm uppercase tracking-wide" onClick={() => setMenuOpen(false)}>St. Moritz</Link>
          <Link href="/hotels?category=Wellness+Retreat" className="text-sm uppercase tracking-wide" onClick={() => setMenuOpen(false)}>Wellness</Link>
        </div>
      )}
    </nav>
  )
}