'use client'

export default function CompareProfileLink({ hotel, gold, border, text }: any) {
  const trackProfile = () => {
    if (hotel.is_partner) {
      fetch(`/api/track?hotel_id=${hotel.id}&hotel_name=${encodeURIComponent(hotel.name)}&destination=${encodeURIComponent(`https://swissnethotels.com/hotels/${hotel.slug || hotel.id}`)}&medium=profile&campaign=compare&source=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`).catch(() => {})
    }
  }

  return (
    <a href={`/hotels/${hotel.slug || hotel.id}`} onClick={trackProfile} style={{ flex: 1, display: 'block', textAlign: 'center', border: `1px solid ${border}`, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: text, padding: '0.6rem', textDecoration: 'none', borderRadius: 4 }}>
      View Profile
    </a>
  )
}
