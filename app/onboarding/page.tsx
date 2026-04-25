'use client'
import { useState } from 'react'

const REGIONS = ['Zermatt', 'St. Moritz', 'Verbier', 'Davos', 'Interlaken', 'Lucerne', 'Geneva', 'Zurich', 'Gstaad', 'Lugano']
const CATEGORIES = ['Ski Resort', 'Wellness Retreat', 'City Luxury', 'Mountain Lodge', 'Lake Resort']
const AMENITY_OPTIONS = ['Ski-in/ski-out', 'Matterhorn view', 'Private spa', 'Butler service', 'Helipad', 'Fine dining', 'Heated pool', 'Lake view', 'Michelin restaurant', 'Wine cellar', 'Hot tub', 'Kids club', 'Mountain guide', 'Infinity pool', 'Yoga classes', 'Organic restaurant', 'Helicopter arrival', 'Paragliding packages', 'Rooftop bar', 'Bicycle hire', 'Concierge', 'Ski storage']
const BEST_FOR_OPTIONS = ['Couples', 'Families', 'Solo travel', 'Business travel', 'Ski holidays', 'Honeymoon', 'Wellness', 'Adventure', 'Groups', 'Special occasions', 'Sightseeing', 'Remote work']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const [form, setForm] = useState({
    name: '', location: '', region: '', category: '', rating: '',
    nightly_rate_chf: '', description: '', direct_booking_url: '',
    exclusive_offer: '', contact_email: '',
    images: ['', '', ''],
    amenities: [] as string[],
    best_for: [] as string[],
  })

  const gold = '#C9A84C'
  const bg = '#492816'
  const bgLight = '#3D2010'
  const border = 'rgba(201,169,110,0.3)'
  const text = '#FFFFFF'
  const textMuted = 'rgba(255,255,255,0.6)'

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid ' + border,
    color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem',
    padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem',
    letterSpacing: '0.15em', textTransform: 'uppercase' as const,
    color: textMuted, marginBottom: '0.5rem',
  }

  const toggleItem = (field: 'amenities' | 'best_for', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }))
  }

  const handleScrape = async () => {
    if (!websiteUrl) return
    setScraping(true)
    setScrapeError('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl })
      })
      const data = await res.json()
      if (data.success) {
        setForm(prev => ({
          ...prev,
          name: data.data.name || '',
          location: data.data.location || '',
          description: data.data.description || '',
          contact_email: data.data.contact_email || '',
          direct_booking_url: data.data.direct_booking_url || websiteUrl,
          exclusive_offer: data.data.exclusive_offer || '',
          nightly_rate_chf: data.data.nightly_rate_chf?.toString() || '',
          rating: data.data.rating?.toString() || '',
          amenities: data.data.amenities || [],
          best_for: data.data.best_for || [],
        }))
        setStep(1)
      } else {
        setScrapeError(data.error || 'Could not extract data')
        setStep(1)
      }
    } catch {
      setScrapeError('Could not reach website. You can fill in the details manually.')
      setStep(1)
    } finally {
      setScraping(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitStatus('loading')
    try {
      const payload = {
        name: form.name, location: form.location, region: form.region,
        category: form.category, rating: parseFloat(form.rating),
        nightly_rate_chf: parseInt(form.nightly_rate_chf),
        description: form.description, direct_booking_url: form.direct_booking_url,
        exclusive_offer: form.exclusive_offer, contact_email: form.contact_email,
        images: form.images.filter(Boolean),
        amenities: form.amenities, best_for: form.best_for,
        is_active: false, is_featured: false,
      }
      const res = await fetch('/api/hotels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) setSubmitStatus('success')
      else setSubmitStatus('error')
    } catch { setSubmitStatus('error') }
  }

  if (submitStatus === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ color: gold, fontSize: '3rem', marginBottom: '1.5rem' }}>✓</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: text, marginBottom: '1rem' }}>Hotel Submitted</h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', color: textMuted, lineHeight: 1.8, marginBottom: '2rem' }}>
            Added as inactive. Go to your admin panel to review and activate it.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="/admin" style={{ display: 'inline-block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', textDecoration: 'none' }}>Go to Admin</a>
            <button onClick={() => { setSubmitStatus('idle'); setStep(0); setWebsiteUrl(''); setForm({ name: '', location: '', region: '', category: '', rating: '', nightly_rate_chf: '', description: '', direct_booking_url: '', exclusive_offer: '', contact_email: '', images: ['', '', ''], amenities: [], best_for: [] }) }} style={{ background: 'transparent', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid ' + border, cursor: 'pointer' }}>Add Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '4rem 0' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: gold, marginBottom: '0.5rem' }}>
              SwissNet <span style={{ fontStyle: 'italic', color: text }}>Hotels</span>
            </p>
          </a>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: textMuted, margin: 0 }}>Hotel Onboarding</p>
        </div>

        {step > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{ flex: 1, height: '3px', background: s <= step ? gold : 'rgba(255,255,255,0.1)', transition: 'background 0.3s', borderRadius: '2px' }} />
            ))}
          </div>
        )}

        <div style={{ background: bgLight, border: '1px solid ' + border, padding: '2.5rem' }}>

          {/* Step 0 — URL scraper */}
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '0.5rem' }}>Add a New Hotel</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, marginBottom: '2rem', lineHeight: 1.8 }}>
                Paste the hotel's website URL and our AI will automatically extract all the details. You can review and edit everything before submitting.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Hotel Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScrape()}
                  style={inputStyle}
                  placeholder="https://www.theomnia.ch"
                />
              </div>

              {scrapeError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#fca5a5', margin: 0 }}>{scrapeError}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleScrape}
                  disabled={scraping || !websiteUrl}
                  style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: 'none', cursor: scraping ? 'wait' : 'pointer', opacity: !websiteUrl ? 0.5 : 1 }}
                >
                  {scraping ? 'Extracting data...' : '✦ Auto-fill with AI'}
                </button>
                <button
                  onClick={() => setStep(1)}
                  style={{ background: 'transparent', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid ' + border, cursor: 'pointer' }}
                >
                  Fill manually
                </button>
              </div>

              {scraping && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(201,169,110,0.08)', border: '1px solid ' + border }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, margin: 0, textAlign: 'center' }}>
                    ✦ AI is reading the hotel website and extracting details...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '0.5rem' }}>Basic Information</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, marginBottom: '2rem' }}>
                Step 1 of 4 — {form.name ? '✓ Pre-filled by AI — please review' : 'Fill in core hotel details'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Hotel Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="The Grand Zermatt" />
                </div>
                <div>
                  <label style={labelStyle}>Full Location *</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={inputStyle} placeholder="Zermatt, Valais" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Region *</label>
                    <select value={form.region} onChange={e => setForm({...form, region: e.target.value})} style={{ ...inputStyle, background: 'rgba(255,255,255,0.06)' }}>
                      <option value="">Select region</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ ...inputStyle, background: 'rgba(255,255,255,0.06)' }}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Rating (1–5) *</label>
                    <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} style={inputStyle} placeholder="4.8" />
                  </div>
                  <div>
                    <label style={labelStyle}>Nightly Rate (CHF) *</label>
                    <input type="number" value={form.nightly_rate_chf} onChange={e => setForm({...form, nightly_rate_chf: e.target.value})} style={inputStyle} placeholder="1200" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Contact Email *</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} style={inputStyle} placeholder="reservations@hotel.com" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Description */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '0.5rem' }}>Description & Offers</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, marginBottom: '2rem' }}>Step 2 of 4 — What makes this hotel special</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Hotel Description *</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={5} style={{ ...inputStyle, resize: 'none' }} placeholder="A legendary alpine retreat..." />
                </div>
                <div>
                  <label style={labelStyle}>Direct Booking URL *</label>
                  <input type="url" value={form.direct_booking_url} onChange={e => setForm({...form, direct_booking_url: e.target.value})} style={inputStyle} placeholder="https://www.hotel.com/book" />
                </div>
                <div>
                  <label style={labelStyle}>Exclusive SwissNet Offer</label>
                  <input type="text" value={form.exclusive_offer} onChange={e => setForm({...form, exclusive_offer: e.target.value})} style={inputStyle} placeholder="3-night stay includes complimentary ski pass" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Photos */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '0.5rem' }}>Hotel Photos</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, marginBottom: '2rem' }}>Step 3 of 4 — Add image URLs</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {form.images.map((img, i) => (
                  <div key={i}>
                    <label style={labelStyle}>Image {i + 1} URL {i === 0 && '*'}</label>
                    <input
                      type="url"
                      value={img}
                      onChange={e => {
                        const newImages = [...form.images]
                        newImages[i] = e.target.value
                        setForm({...form, images: newImages})
                      }}
                      style={inputStyle}
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    {img && (
                      <img src={img} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', marginTop: '0.5rem', border: '1px solid ' + border }} onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Amenities */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: text, marginBottom: '0.5rem' }}>Amenities & Guest Profile</h2>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted, marginBottom: '2rem' }}>
                Step 4 of 4 — {form.amenities.length > 0 ? `✓ ${form.amenities.length} amenities pre-selected by AI — add or remove` : 'Select all that apply'}
              </p>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ ...labelStyle, marginBottom: '1rem' }}>Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {AMENITY_OPTIONS.map(a => (
                    <button key={a} type="button" onClick={() => toggleItem('amenities', a)} style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500,
                      letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 0.8rem',
                      border: '1px solid ' + border, cursor: 'pointer', transition: 'all 0.2s',
                      background: form.amenities.includes(a) ? gold : 'transparent',
                      color: form.amenities.includes(a) ? '#fff' : textMuted,
                    }}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '1rem' }}>Best For</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {BEST_FOR_OPTIONS.map(b => (
                    <button key={b} type="button" onClick={() => toggleItem('best_for', b)} style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500,
                      letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 0.8rem',
                      border: '1px solid ' + border, cursor: 'pointer', transition: 'all 0.2s',
                      background: form.best_for.includes(b) ? gold : 'transparent',
                      color: form.best_for.includes(b) ? '#fff' : textMuted,
                    }}>{b}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid ' + border }}>
              <button onClick={() => setStep(step - 1)} style={{ background: 'transparent', color: textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: '1px solid ' + border, cursor: 'pointer' }}>
                Back
              </button>
              {step < 4 ? (
                <button onClick={() => setStep(step + 1)} style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: 'none', cursor: 'pointer' }}>
                  Next Step →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitStatus === 'loading'} style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2rem', border: 'none', cursor: 'pointer' }}>
                  {submitStatus === 'loading' ? 'Submitting...' : 'Submit Hotel'}
                </button>
              )}
            </div>
          )}

          {submitStatus === 'error' && (
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>Something went wrong. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  )
}