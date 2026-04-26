'use client'

export default function AISearchPreview() {
  const gold = '#C9A84C'

  const hotels = [
    {
      name: 'Mont Cervin Palace',
      location: 'Zermatt, Switzerland',
      rating: 4.9,
      tag: 'BEST FOR COUPLES',
      amenities: ['Matterhorn View', 'Spa & Wellness', 'Fine Dining', 'Indoor Pool'],
      desc: 'Timeless elegance in the heart of Zermatt. Luxurious rooms with iconic Matterhorn views and award-winning spa for the ultimate couples escape.',
      rate: 920,
      booking: 980,
      expedia: 995,
      // Replace this image URL with your own hotel image
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    },
    {
      name: 'Hotel Monte Rosa',
      location: 'Zermatt, Switzerland',
      rating: 4.8,
      tag: 'WELLNESS RETREAT',
      amenities: ['Matterhorn View', 'Wellness Spa', 'Gourmet Dining', 'Rooftop Terrace'],
      desc: "A serene wellness retreat with panoramic Matterhorn views, exceptional cuisine, and one of Zermatt's finest spa areas.",
      rate: 785,
      booking: 840,
      expedia: 860,
      // Replace this image URL with your own hotel image
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    },
    {
      name: 'Schweizerhof Zermatt',
      location: 'Zermatt, Switzerland',
      rating: 4.9,
      tag: 'ICONIC LUXURY',
      amenities: ['Matterhorn View', 'Luxury Spa', 'Michelin Dining', 'Concierge Service'],
      desc: "Zermatt's legendary grand hotel. Unmatched service, elegant rooms, and stunning Matterhorn views in a historic setting.",
      rate: 600,
      booking: 640,
      expedia: 670,
      // Replace this image URL with your own hotel image
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    },
  ]

  return (
    <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', border: '1px solid #e5e5e5' }}>

      {/* Browser chrome */}
      <div style={{ background: '#f2f2f2', padding: '0.6rem 1rem', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: '6px', padding: '0.25rem 0.75rem', marginLeft: '0.5rem', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#666', margin: 0 }}>chatgpt.com</p>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', minHeight: '600px' }}>

        {/* Sidebar */}
        <div style={{ width: '220px', background: '#f9f9f9', borderRight: '1px solid #ebebeb', padding: '1.25rem', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* ChatGPT logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width="28" height="28" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.813-3.109 10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.812 3.109 10.079 10.079 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.236-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L7.044 23.86a7.504 7.504 0 0 1-2.747-10.24zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l8.048 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.647-1.13zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.499v4.996l-4.331 2.5-4.331-2.5V18z" fill="currentColor"/>
            </svg>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>ChatGPT</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {['New chat', 'Search chats', 'Library'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#555', margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>

          {/* SwissNet plugin card */}
          <div style={{ marginTop: 'auto', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '24px', height: '24px', background: gold, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <p style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 800, margin: 0 }}>S</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>SwissNet AI</p>
              </div>
            </div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#888', margin: '0 0 0.2rem', lineHeight: 1.4 }}>AI-Powered Hotel Discovery</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: gold, margin: 0 }}>swissnet-hotels.com</p>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, padding: '1.5rem 2rem', background: '#fff', overflowX: 'auto' }}>

          {/* User message */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f0f0f0', padding: '0.75rem 1.1rem', maxWidth: '480px', borderRadius: '18px 18px 4px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: '#1a1a1a', margin: 0, lineHeight: 1.5 }}>
                What are the best luxury hotels with a Matterhorn view in Zermatt for a couples relaxing retreat?
              </p>
            </div>
          </div>

          {/* AI response */}
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            {/* ChatGPT avatar */}
            <div style={{ flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.813-3.109 10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.812 3.109 10.079 10.079 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.236-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L7.044 23.86a7.504 7.504 0 0 1-2.747-10.24zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l8.048 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.647-1.13zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.499v4.996l-4.331 2.5-4.331-2.5V18z" fill="#1a1a1a"/>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: '#1a1a1a', marginBottom: '1.25rem', lineHeight: 1.7 }}>
                Here are some of the best luxury hotels in Zermatt offering breathtaking Matterhorn views, perfect for a romantic and relaxing retreat.
              </p>

              {/* Hotel cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1rem' }}>
                {hotels.map((hotel, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e8e8e8', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>

                    {/* Hotel image */}
                    <div style={{ position: 'relative', height: '155px', overflow: 'hidden' }}>
                      <img src={hotel.image} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 800, letterSpacing: '0.1em', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                        {hotel.tag}
                      </div>
                    </div>

                    <div style={{ padding: '0.875rem' }}>
                      {/* Name and rating */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem', gap: '0.5rem' }}>
                        <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: '#1a1a1a', margin: 0, fontWeight: 600, lineHeight: 1.3 }}>{hotel.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                          <span style={{ color: '#f5a623', fontSize: '0.7rem' }}>★</span>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: '#555', fontWeight: 600 }}>{hotel.rating}</span>
                        </div>
                      </div>

                      {/* Location */}
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#888', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span>📍</span> {hotel.location}
                      </p>

                      {/* Amenities */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.6rem' }}>
                        {hotel.amenities.map(a => (
                          <span key={a} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: '#555', background: '#f4f4f4', padding: '0.15rem 0.4rem', borderRadius: '3px', border: '1px solid #e8e8e8' }}>{a}</span>
                        ))}
                      </div>

                      {/* Description */}
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#666', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{hotel.desc}</p>

                      {/* Price section */}
                      <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '0.6rem 0.75rem', marginBottom: '0.6rem', border: '1px solid #efefef' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: '#10a37f', fontWeight: 700, letterSpacing: '0.05em', margin: 0 }}>BEST PRICE GUARANTEED</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: gold, margin: 0, fontWeight: 700 }}>CHF {hotel.rate}</p>
                            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.5rem', color: '#aaa', margin: 0 }}>/night</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <div style={{ background: '#003580', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '3px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.5rem' }}>B.</div>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#888', margin: 0 }}>CHF {hotel.booking}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <div style={{ background: '#ff6600', color: '#fff', padding: '0.1rem 0.25rem', borderRadius: '3px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.5rem' }}>E</div>
                              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: '#888', margin: 0 }}>CHF {hotel.expedia}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button style={{ flex: 1, background: '#fff', border: '1px solid #ddd', borderRadius: '7px', padding: '0.45rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#333', cursor: 'pointer', fontWeight: 500 }}>View Details</button>
                        <button style={{ flex: 1, background: gold, border: 'none', borderRadius: '7px', padding: '0.45rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Book Now</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: '#aaa', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                Prices are indicative and may vary depending on dates and availability. Always book directly through the hotel for the best rate and benefits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}