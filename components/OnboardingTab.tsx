'use client'
import { useState } from 'react'

interface Props {
  password: string
  regions: string[]
  existingCategories: string[]
}

const TIERS = ['monitor', 'optimise', 'premium']
const HOTEL_CATEGORIES = ['Ski Resort', 'Wellness Retreat', 'City Luxury', 'Mountain Lodge', 'Lake Resort']

export default function OnboardingTab({ password, regions, existingCategories }: Props) {
  const gold = '#C9A84C'
  const border = 'rgba(201,169,110,0.2)'
  const text = '#2A1A0E'
  const textMuted = 'rgba(42,26,14,0.45)'
  const bg = '#F8F5EF'
  const green = '#16a34a'
  const red = '#dc2626'

  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const [form, setForm] = useState({
    name: '', slug: '', location: '', region: '', category: '',
    rating: '', nightly_rate_chf: '', description: '',
    direct_booking_url: '', contact_email: '',
    tier: 'monitor',
    is_partner: true, is_active: true, show_schema: false,
    categories: '',
    regionGeneral: true,
    regionCategories: '',
    regionQueries: '',
    competitors: '',
  })
  // category key -> textarea of templates (one per line), for NEW categories only
  const [catTemplates, setCatTemplates] = useState<Record<string, string>>({})

  

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid ' + border,
    color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem',
    padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.55rem',
    letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, marginBottom: '0.3rem',
  }
  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: text, margin: '0 0 1rem',
  }
  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid ' + border, borderRadius: 8, padding: '1.5rem', marginBottom: '1.25rem',
  }

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async () => {
    setSubmitting(true)
    setResult(null)
    const payload: any = {
      name: form.name, slug: form.slug || undefined, location: form.location || undefined,
      region: mode === 'new' ? form.region.trim() : form.region,
      category: form.category || undefined,
      rating: form.rating || undefined, nightly_rate_chf: form.nightly_rate_chf || undefined,
      description: form.description || undefined,
      direct_booking_url: form.direct_booking_url || undefined,
      contact_email: form.contact_email || undefined,
      tier: form.tier,
      is_partner: form.is_partner, is_active: form.is_active, show_schema: form.show_schema,
      categories: form.categories.split(',').map(c => c.trim()).filter(Boolean),
      newRegion: mode === 'new',
    }
    if (mode === 'new') {
      payload.regionGeneral = form.regionGeneral
      payload.regionCategories = form.regionCategories.split(',').map(c => c.trim()).filter(Boolean)
      payload.regionQueries = form.regionQueries.split('\n').map(q => q.trim()).filter(Boolean)
      payload.competitors = form.competitors.split('\n').map(c => c.trim()).filter(Boolean)
      const catQueries: Record<string, string[]> = {}
      for (const [cat, text] of Object.entries(catTemplates)) {
        const lines = text.split('\n').map(q => q.trim()).filter(Boolean)
        if (lines.length) catQueries[cat] = lines
      }
      payload.categoryQueries = catQueries
    }
    try {
      const res = await fetch('/api/hotels/onboard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json()
      setResult({ ok: res.ok && j.ok, ...j })
    } catch (e: any) {
      setResult({ ok: false, error: e?.message || 'Request failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = form.name.trim() && form.location.trim() &&
    (mode === 'existing' ? form.region : form.region.trim())

  return (
    <div style={{ maxWidth: 720 }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
        Create a new partner hotel and everything it needs to be live for visibility scoring — the hotel record, its region, queries, competitors, categories and plan tier. The daily cron picks it up automatically on its next run.
      </p>

      <div style={card}>
        <p style={sectionTitle}>Hotel</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div><label style={labelStyle}>Hotel Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="La Réserve Genève" /></div>
          <div><label style={labelStyle}>Slug</label><input value={form.slug} onChange={e => set('slug', e.target.value)} style={inputStyle} placeholder="la-reserve-geneve" /></div>
          <div><label style={labelStyle}>Location *</label><input value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle} placeholder="Geneva, Switzerland" /></div>
          <div>
            <label style={labelStyle}>Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, background: bg }}>
              <option value="">Select category</option>
              {HOTEL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Rating (1-5)</label><input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => set('rating', e.target.value)} style={inputStyle} placeholder="4.8" /></div>
          <div><label style={labelStyle}>Nightly Rate (CHF)</label><input type="number" value={form.nightly_rate_chf} onChange={e => set('nightly_rate_chf', e.target.value)} style={inputStyle} placeholder="900" /></div>
          <div><label style={labelStyle}>Direct Booking URL</label><input value={form.direct_booking_url} onChange={e => set('direct_booking_url', e.target.value)} style={inputStyle} placeholder="https://..." /></div>
          <div><label style={labelStyle}>Contact Email</label><input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} style={inputStyle} placeholder="reservations@..." /></div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </div>

      <div style={card}>
        <p style={sectionTitle}>Plan & activation</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>Plan Tier</label>
            <select value={form.tier} onChange={e => set('tier', e.target.value)} style={{ ...inputStyle, background: bg }}>
              {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Categories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {existingCategories.map(cat => {
                const selected = form.categories.split(',').map(c => c.trim()).filter(Boolean).includes(cat)
                return (
                  <button key={cat} type="button" onClick={() => {
                    const cur = form.categories.split(',').map(c => c.trim()).filter(Boolean)
                    const next = selected ? cur.filter(c => c !== cat) : [...cur, cat]
                    set('categories', next.join(', '))
                  }} style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 0.7rem',
                    border: '1px solid ' + (selected ? gold : border), borderRadius: 4, cursor: 'pointer',
                    background: selected ? gold : '#fff', color: selected ? '#fff' : textMuted,
                  }}>{cat}</button>
                )
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'is_partner', label: '✦ Partner (cron scores it)' },
            { key: 'is_active', label: 'Active' },
            { key: 'show_schema', label: 'Show Schema' },
          ].map(f => (
            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={(form as any)[f.key]} onChange={e => set(f.key, e.target.checked)} style={{ accentColor: gold }} />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={card}>
        <p style={sectionTitle}>Region</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['existing', 'new'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, padding: '0.4rem 1rem',
              borderRadius: 4, cursor: 'pointer', border: '1px solid ' + (mode === m ? text : border),
              background: mode === m ? text : '#fff', color: mode === m ? '#fff' : textMuted,
            }}>{m === 'existing' ? 'Existing region' : 'New region'}</button>
          ))}
        </div>

        {mode === 'existing' ? (
          <div>
            <label style={labelStyle}>Select region</label>
            <select value={form.region} onChange={e => set('region', e.target.value)} style={{ ...inputStyle, background: bg }}>
              <option value="">Select region</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.58rem', color: textMuted, margin: '0.5rem 0 0', lineHeight: 1.5 }}>
              The hotel inherits this region's existing queries and competitors. Nothing else to add — it's scored on the next cron run.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={labelStyle}>New region name (exact case, e.g. Zermatt)</label><input value={form.region} onChange={e => set('region', e.target.value)} style={inputStyle} placeholder="Zermatt" /></div>
            <div><label style={labelStyle}>Region categories (comma keys, for category crons)</label><input value={form.regionCategories} onChange={e => set('regionCategories', e.target.value)} style={inputStyle} placeholder="spa, ski, dining" /></div>

            {form.regionCategories.split(',').map(c => c.trim()).filter(Boolean).map(cat => {
              const inherited = existingCategories.includes(cat)
              return (
                <div key={cat} style={{ paddingLeft: '0.75rem', borderLeft: '2px solid ' + border }}>
                  <label style={labelStyle}>
                    {cat} {inherited
                      ? <span style={{ color: green, textTransform: 'none', letterSpacing: 0 }}>— inherited ✓ (templates already exist)</span>
                      : <span style={{ color: gold, textTransform: 'none', letterSpacing: 0 }}>— new category, add query templates (one per line)</span>}
                  </label>
                  {!inherited && (
                    <textarea
                      value={catTemplates[cat] || ''}
                      onChange={e => setCatTemplates(prev => ({ ...prev, [cat]: e.target.value }))}
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
                      placeholder={'best ' + cat + ' hotel\nbest hotel for ' + cat}
                    />
                  )}
                </div>
              )
            })}
            <div>
              <label style={labelStyle}>General queries (one per line)</label>
              <textarea value={form.regionQueries} onChange={e => set('regionQueries', e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} placeholder={'best luxury hotels in Zermatt\nbest 5 star hotels Zermatt'} />
            </div>
            <div>
              <label style={labelStyle}>Competitor hotels (one per line)</label>
              <textarea value={form.competitors} onChange={e => set('competitors', e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} placeholder={'Mont Cervin Palace\nThe Omnia'} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.regionGeneral} onChange={e => set('regionGeneral', e.target.checked)} style={{ accentColor: gold }} />
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>Run general visibility for this region</span>
            </label>
          </div>
        )}
      </div>

      <button onClick={submit} disabled={submitting || !canSubmit} style={{
        background: canSubmit ? gold : border, color: '#fff', fontFamily: 'Montserrat, sans-serif',
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
        padding: '0.875rem 2.5rem', border: 'none', borderRadius: 6,
        cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed', opacity: submitting ? 0.7 : 1,
      }}>{submitting ? 'Creating…' : 'Create Hotel'}</button>

      {result && (
        <div style={{ marginTop: '1.5rem', background: '#fff', border: '1px solid ' + (result.ok ? green + '40' : red + '40'), borderRadius: 8, padding: '1.25rem 1.5rem' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: result.ok ? green : red, margin: '0 0 0.75rem' }}>
            {result.ok ? '✓ Hotel created' : '✗ Onboarding stopped'}
          </p>
          {Array.isArray(result.steps) && result.steps.map((s: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
              <span style={{ color: s.ok ? green : red, fontSize: '0.8rem' }}>{s.ok ? '✓' : '✗'}</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: text }}>{s.step}:</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: textMuted }}>{s.detail}</span>
            </div>
          ))}
          {result.error && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: red, margin: '0.5rem 0 0' }}>{result.error}</p>}
          {result.ok && result.hotelId && (
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, margin: '0.75rem 0 0', lineHeight: 1.5 }}>
              Hotel ID: <code style={{ background: bg, padding: '1px 6px', borderRadius: 4 }}>{result.hotelId}</code> · Scored on the next daily cron run. Edit further details in the Hotels tab.
            </p>
          )}
        </div>
      )}
    </div>
  )
}