'use client'
import { useState } from 'react'
import Link from 'next/link'

const GOLD = '#C9A84C'
const BG = '#F8F5EF'
const WHITE = '#FFFFFF'
const TEXT = '#2A1A0E'
const TEXT_MUTED = 'rgba(42,26,14,0.5)'
const BORDER = 'rgba(201,169,76,0.15)'
const GREEN = '#16a34a'
const RED = '#dc2626'

const PAGE_TYPES = [
  { value: 'hotel', label: 'Overview', limit: 2, hint: 'Broad brand, location, family, luxury intent' },
  { value: 'rooms', label: 'Rooms & Suites', limit: 2, hint: 'Suites, views, bed types, occupancy' },
  { value: 'dining', label: 'Dining', limit: 2, hint: 'Michelin, menus, breakfast, chef' },
  { value: 'spa', label: 'Spa & Wellness', limit: 2, hint: 'Treatments, pools, wellness, adults-only' },
  { value: 'experiences', label: 'Experiences', limit: 2, hint: 'Skiing, tours, activities, adventures' },
]

export default function OptimiseClient({ hotel, offers, faqs, aiScores }: any) {
  const [tab, setTab] = useState<'offers' | 'faqs' | 'insights'>('insights')
  const [offerForm, setOfferForm] = useState<any>(null)
  const [faqForm, setFaqForm] = useState<any>({ page_type: 'hotel', question: '', answer: '', target_query: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [localOffers, setLocalOffers] = useState(offers)
  const [localFaqs, setLocalFaqs] = useState(faqs)

  const today = new Date().toISOString().split('T')[0]
  const activeOffers = localOffers.filter((o: any) => o.active !== false && (!o.end_date || o.end_date >= today))
  const pendingFaqs = localFaqs.filter((f: any) => f.status === 'pending')

  // AI Insights from real data
  const queryScores = Object.entries(
    aiScores.reduce((acc: any, r: any) => {
      if (!acc[r.query]) acc[r.query] = { appeared: 0, total: 0 }
      acc[r.query].total++
      if (r.appeared) acc[r.query].appeared++
      return acc
    }, {})
  ).map(([query, v]: any) => ({ query, score: Math.round((v.appeared / v.total) * 100) }))
    .sort((a: any, b: any) => b.score - a.score)

  const topQueries = queryScores.slice(0, 3)
  const weakQueries = [...queryScores].sort((a: any, b: any) => a.score - b.score).slice(0, 3)

  const getRecommendation = (query: string, score: number) => {
    const q = query.toLowerCase()
    if (q.includes('romantic') || q.includes('honeymoon') || q.includes('couples')) return 'Add a romantic stays FAQ to the Overview page'
    if (q.includes('spa') || q.includes('wellness') || q.includes('treatment')) return 'Add a spa treatments FAQ to the Spa page'
    if (q.includes('room') || q.includes('suite') || q.includes('view')) return 'Add a suite views FAQ to the Rooms page'
    if (q.includes('michelin') || q.includes('dining') || q.includes('restaurant')) return 'Add a dining FAQ targeting this query'
    if (q.includes('ski') || q.includes('family') || q.includes('children')) return 'Add an experiences FAQ for this query'
    if (score < 20) return 'Add a targeted FAQ to directly address this search query'
    return 'Improve with a specific FAQ targeting this intent'
  }

  const notify = async (action: string, detail: string) => {
    await fetch('/api/notify-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel_name: hotel.name, action, detail }),
    }).catch(() => {})
  }

  const saveOffer = async () => {
    if (!offerForm.name || !offerForm.description) return
    setSaving(true)
    const payload = {
      hotel_id: hotel.id,
      name: offerForm.name,
      description: offerForm.description,
      image_url: offerForm.image_url || null,
      cta_url: offerForm.cta_url || null,
      start_date: offerForm.start_date || null,
      end_date: offerForm.end_date || null,
      active: true,
      is_available: true,
      sort_order: localOffers.length,
    }

    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    if (offerForm.id) {
      const { error } = await sb.from('hotel_offers').update(payload).eq('id', offerForm.id)
      if (!error) {
        setLocalOffers((prev: any) => prev.map((o: any) => o.id === offerForm.id ? { ...o, ...payload } : o))
        await notify('Offer updated', offerForm.name)
        setMessage('Offer updated.')
      }
    } else {
      const { data, error } = await sb.from('hotel_offers').insert(payload).select().single()
      if (!error && data) {
        setLocalOffers((prev: any) => [...prev, data])
        await notify('New offer added', offerForm.name)
        setMessage('Offer added.')
      }
    }
    setOfferForm(null)
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const archiveOffer = async (id: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('hotel_offers').update({ active: false, is_available: false }).eq('id', id)
    setLocalOffers((prev: any) => prev.map((o: any) => o.id === id ? { ...o, active: false, is_available: false } : o))
    await notify('Offer archived', id)
    setMessage('Offer archived.')
    setTimeout(() => setMessage(''), 3000)
  }

  const submitFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return
    if (pendingFaqs.length >= 2) { setMessage('Maximum 2 pending suggestions. Wait for admin review.'); setTimeout(() => setMessage(''), 4000); return }
    const pageLimit = PAGE_TYPES.find(p => p.value === faqForm.page_type)?.limit || 2
    const pageCount = pendingFaqs.filter((f: any) => f.page_type === faqForm.page_type).length
    if (pageCount >= pageLimit) { setMessage(`Maximum ${pageLimit} pending suggestions for this page.`); setTimeout(() => setMessage(''), 4000); return }

    setSaving(true)
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data, error } = await sb.from('hotel_faq_suggestions').insert({
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      page_type: faqForm.page_type,
      question: faqForm.question,
      answer: faqForm.answer,
      target_query: faqForm.target_query || null,
      status: 'pending',
    }).select().single()

    if (!error && data) {
      setLocalFaqs((prev: any) => [data, ...prev])
      await notify('FAQ suggestion submitted', `${faqForm.page_type}: ${faqForm.question}`)
      setFaqForm({ page_type: 'hotel', question: '', answer: '', target_query: '' })
      setMessage('FAQ suggestion submitted for review.')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 4000)
  }

  const inputStyle: any = {
    width: '100%', fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem',
    color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6,
    padding: '0.6rem 0.875rem', background: BG, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: any = {
    fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_MUTED,
    display: 'block', marginBottom: '0.4rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: BG }}>

      {/* Header */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 0.25rem' }}>SwissNet Hotels</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: TEXT, margin: 0 }}>AI Optimisation</h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, margin: '0.2rem 0 0' }}>{hotel.name} · {hotel.location}, Switzerland</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: TEXT_MUTED, textDecoration: 'none', padding: '0.4rem 0.875rem', border: `1px solid ${BORDER}`, borderRadius: 4 }}>← Dashboard</Link>
          <a href={`/hotels/${hotel.slug || hotel.id}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: GOLD, textDecoration: 'none', padding: '0.4rem 0.875rem', border: `1px solid ${BORDER}`, borderRadius: 4 }}>View page →</a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: '0 2rem' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {([
            { key: 'insights', label: 'AI Insights' },
            { key: 'offers', label: `Offers (${activeOffers.length}/3)` },
            { key: 'faqs', label: `FAQ Suggestions (${pendingFaqs.length}/2)` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600,
              color: tab === t.key ? GOLD : TEXT_MUTED,
              background: 'transparent', border: 'none',
              borderBottom: tab === t.key ? `2px solid ${GOLD}` : '2px solid transparent',
              padding: '0.875rem 1.25rem', cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem' }}>

        {message && (
          <div style={{ background: GREEN + '15', border: `1px solid ${GREEN}30`, borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: GREEN }}>{message}</div>
        )}

        {/* ── INSIGHTS TAB ── */}
        {tab === 'insights' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Strong queries */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT, margin: 0 }}>Strongest Queries</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: '0.2rem 0 0' }}>Searches where you appear consistently</p>
              </div>
              <div>
                {topQueries.length === 0 ? (
                  <p style={{ padding: '1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>Run a visibility check to see query data.</p>
                ) : topQueries.map((q: any, i: number) => (
                  <div key={i} style={{ padding: '0.875rem 1.25rem', borderBottom: i < topQueries.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: 0, flex: 1, paddingRight: '1rem' }}>{q.query}</p>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: GREEN, fontWeight: 400, flexShrink: 0 }}>{q.score}%</span>
                    </div>
                    <div style={{ height: 3, background: BORDER, borderRadius: 2 }}>
                      <div style={{ height: '100%', width: q.score + '%', background: GREEN, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak queries */}
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT, margin: 0 }}>Queries to Improve</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: '0.2rem 0 0' }}>Submit a FAQ suggestion to target these</p>
              </div>
              <div>
                {weakQueries.length === 0 ? (
                  <p style={{ padding: '1.25rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED }}>No data yet.</p>
                ) : weakQueries.map((q: any, i: number) => (
                  <div key={i} style={{ padding: '0.875rem 1.25rem', borderBottom: i < weakQueries.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT, margin: 0, flex: 1, paddingRight: '1rem' }}>{q.query}</p>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: q.score < 30 ? RED : '#d97706', fontWeight: 400, flexShrink: 0 }}>{q.score}%</span>
                    </div>
                    <div style={{ height: 3, background: BORDER, borderRadius: 2, marginBottom: '0.5rem' }}>
                      <div style={{ height: '100%', width: q.score + '%', background: q.score < 30 ? RED : '#d97706', borderRadius: 2 }} />
                    </div>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: GOLD, margin: 0 }}>
                      → {getRecommendation(q.query, q.score)}
                    </p>
                    <button onClick={() => { setTab('faqs'); setFaqForm((prev: any) => ({ ...prev, target_query: q.query })) }}
                      style={{ marginTop: '0.4rem', fontFamily: 'Montserrat, sans-serif', fontSize: '0.52rem', fontWeight: 600, color: TEXT_MUTED, background: BG, border: `1px solid ${BORDER}`, padding: '0.25rem 0.6rem', borderRadius: 4, cursor: 'pointer' }}>
                      Submit FAQ →
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── OFFERS TAB ── */}
        {tab === 'offers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: 0 }}>Active Offers</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: '0.2rem 0 0' }}>Maximum 3 active offers · Expired offers hide automatically</p>
              </div>
              {activeOffers.length < 3 && !offerForm && (
                <button onClick={() => setOfferForm({ name: '', description: '', start_date: today, end_date: '', image_url: '', cta_url: '' })}
                  style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  + Add Offer
                </button>
              )}
            </div>

            {/* Offer form */}
            {offerForm && (
              <div style={{ background: WHITE, border: `1px solid ${GOLD}40`, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT, margin: '0 0 1.25rem' }}>{offerForm.id ? 'Edit Offer' : 'New Offer'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Offer Title *</label>
                    <input value={offerForm.name} onChange={e => setOfferForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Romantic Lake Retreat" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Description *</label>
                    <textarea value={offerForm.description} onChange={e => setOfferForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Brief description of the offer..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Start Date</label>
                    <input type="date" value={offerForm.start_date} onChange={e => setOfferForm((p: any) => ({ ...p, start_date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date</label>
                    <input type="date" value={offerForm.end_date} onChange={e => setOfferForm((p: any) => ({ ...p, end_date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Booking Link (optional)</label>
                    <input value={offerForm.cta_url} onChange={e => setOfferForm((p: any) => ({ ...p, cta_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Image URL (optional)</label>
                    <input value={offerForm.image_url} onChange={e => setOfferForm((p: any) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={saveOffer} disabled={saving} style={{ background: GOLD, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.6rem 1.25rem', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving...' : 'Save Offer'}
                  </button>
                  <button onClick={() => setOfferForm(null)} style={{ background: 'transparent', color: TEXT_MUTED, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', padding: '0.6rem 1rem', border: `1px solid ${BORDER}`, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Offer cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {localOffers.filter((o: any) => o.is_available !== false).map((offer: any) => {
                const isExpired = offer.end_date && offer.end_date < today
                const isActive = !isExpired && offer.active !== false
                return (
                  <div key={offer.id} style={{ background: WHITE, border: `1px solid ${isActive ? BORDER : 'rgba(0,0,0,0.06)'}`, borderRadius: 8, padding: '1rem 1.25rem', opacity: isExpired ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: TEXT, margin: 0 }}>{offer.name}</p>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isActive ? GREEN : TEXT_MUTED, background: isActive ? GREEN + '12' : 'rgba(0,0,0,0.05)', padding: '2px 7px', borderRadius: 10 }}>
                            {isExpired ? 'Expired' : isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: TEXT_MUTED, margin: '0 0 0.4rem', lineHeight: 1.5 }}>{offer.description}</p>
                        {(offer.start_date || offer.end_date) && (
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: 0 }}>
                            {offer.start_date && `From ${offer.start_date}`}{offer.start_date && offer.end_date && ' · '}{offer.end_date && `Until ${offer.end_date}`}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, marginLeft: '1rem' }}>
                        {!isExpired && (
                          <button onClick={() => setOfferForm({ ...offer })} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: `1px solid ${BORDER}`, padding: '0.3rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                        )}
                        <button onClick={() => archiveOffer(offer.id)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, border: `1px solid ${BORDER}`, padding: '0.3rem 0.65rem', borderRadius: 4, cursor: 'pointer' }}>Archive</button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {localOffers.filter((o: any) => o.is_available !== false).length === 0 && (
                <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED, margin: 0 }}>No offers yet</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: '0.5rem 0 0' }}>Add seasonal packages, special rates, or exclusive experiences</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FAQ TAB ── */}
        {tab === 'faqs' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: TEXT, margin: '0 0 0.25rem' }}>FAQ Suggestions</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: TEXT_MUTED, margin: 0 }}>Suggestions are reviewed by SwissNet before publishing · Maximum 2 pending at a time · 2 per page</p>
            </div>

            {/* Submit form */}
            {pendingFaqs.length < 2 && (
              <div style={{ background: WHITE, border: `1px solid ${GOLD}40`, borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: TEXT, margin: '0 0 1.25rem' }}>Submit a FAQ Suggestion</p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Target Page *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {PAGE_TYPES.map(p => (
                      <button key={p.value} onClick={() => setFaqForm((prev: any) => ({ ...prev, page_type: p.value }))}
                        style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: faqForm.page_type === p.value ? 700 : 400, padding: '0.35rem 0.75rem', border: `1px solid ${faqForm.page_type === p.value ? GOLD : BORDER}`, background: faqForm.page_type === p.value ? GOLD + '18' : 'transparent', color: faqForm.page_type === p.value ? TEXT : TEXT_MUTED, borderRadius: 20, cursor: 'pointer' }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: '0.4rem 0 0' }}>
                    {PAGE_TYPES.find(p => p.value === faqForm.page_type)?.hint}
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Weak Query to Target (optional)</label>
                  <input value={faqForm.target_query} onChange={e => setFaqForm((p: any) => ({ ...p, target_query: e.target.value }))} placeholder="e.g. best romantic hotel geneva" style={inputStyle} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Question *</label>
                  <input value={faqForm.question} onChange={e => setFaqForm((p: any) => ({ ...p, question: e.target.value }))} placeholder="e.g. Is the hotel suitable for honeymoon stays?" style={inputStyle} />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Answer *</label>
                  <textarea value={faqForm.answer} onChange={e => setFaqForm((p: any) => ({ ...p, answer: e.target.value }))} placeholder="Specific, factual answer with relevant details..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', fontWeight: 600, color: TEXT, margin: '0 0 0.3rem' }}>Good FAQ examples:</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.7 }}>
                    ✓ "Which suites have direct lake views?" · ✓ "Is the spa adults-only?" · ✓ "Does the restaurant offer a tasting menu?"<br />
                    ✗ "Is this hotel luxurious?" · ✗ "Why is this hotel good?"
                  </p>
                </div>

                <button onClick={submitFaq} disabled={saving || !faqForm.question.trim() || !faqForm.answer.trim()}
                  style={{ background: faqForm.question.trim() && faqForm.answer.trim() ? GOLD : BORDER, color: TEXT, fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 700, padding: '0.6rem 1.25rem', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Submitting...' : 'Submit for Review →'}
                </button>
              </div>
            )}

            {/* Existing suggestions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {localFaqs.map((faq: any) => (
                <div key={faq.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.48rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 10, background: faq.status === 'approved' ? GREEN + '12' : faq.status === 'rejected' ? RED + '12' : GOLD + '15', color: faq.status === 'approved' ? GREEN : faq.status === 'rejected' ? RED : '#92701a' }}>
                        {faq.status}
                      </span>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED, background: BG, padding: '2px 7px', borderRadius: 10, border: `1px solid ${BORDER}` }}>{PAGE_TYPES.find(p => p.value === faq.page_type)?.label}</span>
                    </div>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem', color: TEXT_MUTED }}>{new Date(faq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: TEXT, margin: '0 0 0.3rem' }}>{faq.question}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>{faq.answer}</p>
                  {faq.admin_note && (
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: faq.status === 'rejected' ? RED : GOLD, margin: '0.5rem 0 0', fontStyle: 'italic' }}>Admin note: {faq.admin_note}</p>
                  )}
                </div>
              ))}
              {localFaqs.length === 0 && (
                <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: TEXT_MUTED, margin: 0 }}>No suggestions yet</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: TEXT_MUTED, margin: '0.5rem 0 0' }}>Use the AI Insights tab to find weak queries to target</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}