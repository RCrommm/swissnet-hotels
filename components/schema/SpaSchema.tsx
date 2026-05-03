// components/schema/SpaSchema.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = {
  bg: '#492816', bgCard: '#5C3320', gold: '#C9A84C', goldLight: '#E8C87A',
  text: '#F5EDD8', textMuted: '#C4A882', border: 'rgba(201,168,76,0.25)',
  danger: '#D64045', success: '#4CAF50', inputBg: 'rgba(0,0,0,0.25)',
};

const FACILITY_PRESETS = ['Indoor Pool', 'Outdoor Pool', 'Sauna', 'Steam Room', 'Hammam', 'Jacuzzi', 'Cold Plunge', 'Ice Fountain', 'Relaxation Room', 'Fitness Centre', 'Yoga Studio', 'Meditation Room', 'Changing Rooms', 'Spa Boutique'];
const TREATMENT_PRESETS = ['Swedish Massage', 'Deep Tissue Massage', 'Hot Stone Massage', 'Couples Massage', 'Aromatherapy', 'Facial', 'Body Wrap', 'Scrub & Exfoliation', 'Hydrotherapy', 'Reflexology', 'Ayurvedic Treatment', 'Anti-Ageing Treatment'];

const empty = {
  name: '', description: '', ai_description: '', facilities: [] as string[],
  treatments: [] as string[], opening_hours: '', price_from: '',
  price_currency: 'CHF', pool: false, sauna: false, hammam: false,
  size_sqm: '', booking_url: '', is_available: true,
  images: [] as string[],
};

type Spa = typeof empty & { id: string; hotel_id: string };

export default function SpaSchema({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const [items, setItems] = useState<Spa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<null | 'new' | Spa>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [facilityInput, setFacilityInput] = useState('');
  const [treatmentInput, setTreatmentInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
const { data } = await supabase.from('hotel_spa').select('*').eq('hotel_id', hotelId);    setItems(data || []);
    setLoading(false);
  }, [hotelId]);

  useEffect(() => { fetch(); }, [fetch]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg('error', 'Name is required.');
    setSaving(true);
    const payload = {
      hotel_id: hotelId, name: form.name.trim(), description: form.description || null,
      ai_description: form.ai_description || null, facilities: form.facilities,
      treatments: form.treatments, opening_hours: form.opening_hours || null,
      price_from: form.price_from ? parseFloat(form.price_from as string) : null,
      price_currency: form.price_currency, pool: form.pool, sauna: form.sauna,
      hammam: form.hammam, size_sqm: form.size_sqm ? parseFloat(form.size_sqm as string) : null,
      images: (form as any).images || [],
      booking_url: form.booking_url || null, is_available: form.is_available,
    };
    let error: any;
    if (editing === 'new') ({ error } = await supabase.from('hotel_spa').insert(payload));
    else ({ error } = await supabase.from('hotel_spa').update(payload).eq('id', (editing as Spa).id));
    setSaving(false);
    if (error) showMsg('error', error.message);
    else { showMsg('success', 'Saved!'); setEditing(null); setForm(empty); fetch(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('hotel_spa').delete().eq('id', id);
    showMsg('success', 'Deleted.'); fetch(); setDeleteConfirm(null);
  };

  const toggleTag = (field: 'facilities' | 'treatments', val: string) => {
    setForm(f => ({ ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val] }));
  };

  const S: Record<string, React.CSSProperties> = {
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    title: { color: COLORS.gold, fontSize: 20, fontWeight: 700, margin: 0 },
    btnGold: { background: COLORS.gold, color: '#1a0e06', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    btnOutline: { background: 'transparent', color: COLORS.gold, border: `1px solid ${COLORS.gold}`, padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    btnDanger: { background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    formWrap: { background: COLORS.bgCard, border: `1px solid ${COLORS.gold}55`, borderRadius: 16, padding: 28, marginBottom: 24 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    input: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    textarea: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit' },
    sectionTitle: { color: COLORS.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 14, marginTop: 20 },
    tagWrap: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 8 },
    card: { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 },
    empty: { textAlign: 'center' as const, color: COLORS.textMuted, padding: '40px 0', fontSize: 15 },
  };

  const tag = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
    border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
    background: active ? COLORS.gold + '22' : 'transparent',
    color: active ? COLORS.goldLight : COLORS.textMuted,
  });

  const inp = (field: string) => ({
    value: (form as any)[field] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value })),
    style: S.input,
  });

  return (
    <div>
      {msg && <div style={{ padding: '12px 20px', borderRadius: 8, marginBottom: 20, background: msg.type === 'success' ? COLORS.success + '22' : COLORS.danger + '22', color: msg.type === 'success' ? COLORS.success : COLORS.danger, fontSize: 14 }}>{msg.text}</div>}

      {!editing && (
        <div style={S.header}>
          <h2 style={S.title}>Spa & Wellness — {hotelName}</h2>
          <button style={S.btnGold} onClick={() => { setForm(empty); setEditing('new'); }}>+ Add Spa / Wellness</button>
        </div>
      )}

      {editing && (
        <div style={S.formWrap}>
          <div style={{ color: COLORS.gold, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
            {editing === 'new' ? '✦ New Spa / Wellness' : `✦ Edit: ${(editing as Spa).name}`}
          </div>

          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Name *</label>
              <input {...inp('name')} placeholder="e.g. The Spa at Mont Cervin" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Size (m²)</label>
              <input {...inp('size_sqm')} type="number" placeholder="800" />
            </div>
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={S.textarea} placeholder="Full description..." />
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>AI-Optimised Description</label>
            <textarea value={form.ai_description} onChange={e => setForm(f => ({ ...f, ai_description: e.target.value }))} style={{ ...S.textarea, borderColor: COLORS.gold + '55' }} placeholder="Written for AI crawler visibility — include location, key facilities, unique selling points..." />
          </div>

          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Price From</label>
              <input {...inp('price_from')} type="number" placeholder="150" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Opening Hours</label>
              <input {...inp('opening_hours')} placeholder="e.g. 07:00–21:00 daily" />
            </div>
          </div>

         <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Booking URL</label>
            <input {...inp('booking_url')} placeholder="https://..." />
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Images (paste URLs one by one)</label>
            {((form as any).images || []).map((url: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input value={url} onChange={e => { const imgs = [...((form as any).images || [])]; imgs[i] = e.target.value; setForm(f => ({ ...f, images: imgs } as any)) }} style={{ ...S.input, flex: 1 }} placeholder="https://..." />
                <button onClick={() => { const imgs = ((form as any).images || []).filter((_: any, idx: number) => idx !== i); setForm(f => ({ ...f, images: imgs } as any)) }} style={{ ...S.btnDanger, padding: '6px 10px' }}>✕</button>
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, images: [...((f as any).images || []), ''] } as any))} style={{ ...S.btnOutline, marginTop: 4, alignSelf: 'flex-start' }}>+ Add Image</button>
          </div>

          <div style={S.sectionTitle}>Key Features</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            {(['pool', 'sauna', 'hammam'] as const).map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.textMuted, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={form[f]} onChange={e => setForm(ff => ({ ...ff, [f]: e.target.checked }))} style={{ accentColor: COLORS.gold, width: 16, height: 16 }} />
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </label>
            ))}
          </div>

          <div style={S.sectionTitle}>Facilities</div>
          <div style={S.tagWrap}>
            {FACILITY_PRESETS.map(a => <span key={a} style={tag(form.facilities.includes(a))} onClick={() => toggleTag('facilities', a)}>{a}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input style={{ ...S.input, flex: 1 }} value={facilityInput} onChange={e => setFacilityInput(e.target.value)} placeholder="Custom facility..." onKeyDown={e => { if (e.key === 'Enter' && facilityInput.trim()) { toggleTag('facilities', facilityInput.trim()); setFacilityInput(''); }}} />
            <button style={S.btnOutline} onClick={() => { if (facilityInput.trim()) { toggleTag('facilities', facilityInput.trim()); setFacilityInput(''); }}}>Add</button>
          </div>

          <div style={S.sectionTitle}>Treatments</div>
          <div style={S.tagWrap}>
            {TREATMENT_PRESETS.map(a => <span key={a} style={tag(form.treatments.includes(a))} onClick={() => toggleTag('treatments', a)}>{a}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input style={{ ...S.input, flex: 1 }} value={treatmentInput} onChange={e => setTreatmentInput(e.target.value)} placeholder="Custom treatment..." onKeyDown={e => { if (e.key === 'Enter' && treatmentInput.trim()) { toggleTag('treatments', treatmentInput.trim()); setTreatmentInput(''); }}} />
            <button style={S.btnOutline} onClick={() => { if (treatmentInput.trim()) { toggleTag('treatments', treatmentInput.trim()); setTreatmentInput(''); }}}>Add</button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.textMuted, fontSize: 14, cursor: 'pointer', marginTop: 20 }}>
            <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} style={{ accentColor: COLORS.gold, width: 16, height: 16 }} />
            Active / Visible in schema
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button style={S.btnOutline} onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>
            <button style={{ ...S.btnGold, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing === 'new' ? 'Create' : 'Save Changes'}</button>
          </div>
        </div>
      )}

      {!editing && (
        <>
          {loading && <div style={S.empty}>Loading...</div>}
          {!loading && items.length === 0 && <div style={S.empty}>No spa entries yet.<br /><span style={{ color: COLORS.gold, cursor: 'pointer' }} onClick={() => { setForm(empty); setEditing('new'); }}>+ Add spa / wellness →</span></div>}
          {items.map(item => (
            <div key={item.id} style={S.card}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: item.is_available ? COLORS.success : COLORS.danger }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.name}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {item.price_from && <span>From CHF {item.price_from}</span>}
                  {item.facilities?.length > 0 && <span>{item.facilities.length} facilities</span>}
                  {item.treatments?.length > 0 && <span>{item.treatments.length} treatments</span>}
                  {item.opening_hours && <span>{item.opening_hours}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {deleteConfirm === item.id ? (
                  <><span style={{ color: COLORS.textMuted, fontSize: 12, alignSelf: 'center' }}>Confirm?</span><button style={S.btnDanger} onClick={() => handleDelete(item.id)}>Delete</button><button style={S.btnOutline} onClick={() => setDeleteConfirm(null)}>Cancel</button></>
                ) : (
                  <><button style={S.btnOutline} onClick={() => { setForm({ ...empty, ...item, price_from: item.price_from || '', size_sqm: item.size_sqm || '', images: (item as any).images || [], facilities: item.facilities || [], treatments: item.treatments || [] }); setEditing(item); }}>Edit</button><button style={S.btnDanger} onClick={() => setDeleteConfirm(item.id)}>Delete</button></>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}