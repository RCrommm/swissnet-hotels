// components/schema/RestaurantsSchema.tsx
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

const CUISINE_TYPES = ['Swiss', 'French', 'Italian', 'Japanese', 'Mediterranean', 'International', 'Asian Fusion', 'Steakhouse', 'Seafood', 'Vegetarian', 'Contemporary'];
const MEAL_TYPES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Afternoon Tea', 'Bar & Cocktails', 'Room Service'];

const empty = {
  name: '', description: '', ai_description: '', cuisine_type: '',
  meal_types: [] as string[], opening_hours: '', price_range: '',
  price_from: '', price_currency: 'CHF', menu_url: '', booking_url: '',
  dress_code: '', michelin_stars: 0, seats: '', is_available: true, sort_order: 0,
};

type Restaurant = typeof empty & { id: string; hotel_id: string };

export default function RestaurantsSchema({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<null | 'new' | Restaurant>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('hotel_restaurants').select('*').eq('hotel_id', hotelId).order('sort_order');
    setItems(data || []);
    setLoading(false);
  }, [hotelId]);

  useEffect(() => { fetch(); }, [fetch]);

  const showMsg = (type: 'success' | 'error', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg('error', 'Name is required.');
    setSaving(true);
    const payload = {
      hotel_id: hotelId, name: form.name.trim(), description: form.description || null,
      ai_description: form.ai_description || null, cuisine_type: form.cuisine_type || null,
      meal_types: form.meal_types, opening_hours: form.opening_hours || null,
      price_range: form.price_range || null,
      price_from: form.price_from ? parseFloat(form.price_from as string) : null,
      price_currency: form.price_currency, menu_url: form.menu_url || null,
      booking_url: form.booking_url || null, dress_code: form.dress_code || null,
      michelin_stars: parseInt(form.michelin_stars as unknown as string) || 0,
      seats: form.seats ? parseInt(form.seats as string) : null,
      is_available: form.is_available, sort_order: parseInt(form.sort_order as unknown as string) || 0,
    };
    let error: any;
    if (editing === 'new') ({ error } = await supabase.from('hotel_restaurants').insert(payload));
    else ({ error } = await supabase.from('hotel_restaurants').update(payload).eq('id', (editing as Restaurant).id));
    setSaving(false);
    if (error) showMsg('error', error.message);
    else { showMsg('success', 'Saved!'); setEditing(null); setForm(empty); fetch(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('hotel_restaurants').delete().eq('id', id);
    showMsg('success', 'Deleted.'); fetch(); setDeleteConfirm(null);
  };

  const toggleMeal = (m: string) => setForm(f => ({ ...f, meal_types: f.meal_types.includes(m) ? f.meal_types.filter(x => x !== m) : [...f.meal_types, m] }));

  const S: Record<string, React.CSSProperties> = {
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    title: { color: COLORS.gold, fontSize: 20, fontWeight: 700, margin: 0 },
    btnGold: { background: COLORS.gold, color: '#1a0e06', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    btnOutline: { background: 'transparent', color: COLORS.gold, border: `1px solid ${COLORS.gold}`, padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    btnDanger: { background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    formWrap: { background: COLORS.bgCard, border: `1px solid ${COLORS.gold}55`, borderRadius: 16, padding: 28, marginBottom: 24 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px', marginBottom: 16 },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    input: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
    textarea: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit' },
    select: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer' },
    sectionTitle: { color: COLORS.gold, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 14, marginTop: 20 },
    tagWrap: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
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
      {msg && <div style={{ padding: '12px 20px', borderRadius: 8, marginBottom: 20, background: msg.type === 'success' ? '#4CAF5022' : '#D6404522', color: msg.type === 'success' ? '#4CAF50' : '#D64045', fontSize: 14 }}>{msg.text}</div>}

      {!editing && (
        <div style={S.header}>
          <h2 style={S.title}>Restaurants — {hotelName}</h2>
          <button style={S.btnGold} onClick={() => { setForm(empty); setEditing('new'); }}>+ Add Restaurant</button>
        </div>
      )}

      {editing && (
        <div style={S.formWrap}>
          <div style={{ color: COLORS.gold, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
            {editing === 'new' ? '✦ New Restaurant' : `✦ Edit: ${(editing as Restaurant).name}`}
          </div>

          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Restaurant Name *</label>
              <input {...inp('name')} placeholder="e.g. Le Restaurant" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Cuisine Type</label>
              <select style={S.select} value={form.cuisine_type} onChange={e => setForm(f => ({ ...f, cuisine_type: e.target.value }))}>
                <option value="">— Select —</option>
                {CUISINE_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={S.textarea} placeholder="Full description..." />
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>AI-Optimised Description</label>
            <textarea value={form.ai_description} onChange={e => setForm(f => ({ ...f, ai_description: e.target.value }))} style={{ ...S.textarea, borderColor: COLORS.gold + '55' }} placeholder="For AI crawler visibility — cuisine style, atmosphere, signature dishes, location context..." />
          </div>

          <div style={S.grid3}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Price From (CHF)</label>
              <input {...inp('price_from')} type="number" placeholder="85" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Price Range</label>
              <input {...inp('price_range')} placeholder="e.g. CHF 85–220" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Michelin Stars</label>
              <select style={S.select} value={form.michelin_stars} onChange={e => setForm(f => ({ ...f, michelin_stars: parseInt(e.target.value) }))}>
                {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n === 0 ? 'None' : '★'.repeat(n)}</option>)}
              </select>
            </div>
          </div>

          <div style={S.grid3}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Opening Hours</label>
              <input {...inp('opening_hours')} placeholder="e.g. 12:00–14:30, 19:00–22:30" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Seats</label>
              <input {...inp('seats')} type="number" placeholder="60" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Dress Code</label>
              <input {...inp('dress_code')} placeholder="e.g. Smart Casual" />
            </div>
          </div>

          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Menu URL</label>
              <input {...inp('menu_url')} placeholder="https://..." />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Reservation URL</label>
              <input {...inp('booking_url')} placeholder="https://..." />
            </div>
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

          <div style={S.sectionTitle}>Meal Services</div>
          <div style={S.tagWrap}>
            {MEAL_TYPES.map(m => <span key={m} style={tag(form.meal_types.includes(m))} onClick={() => toggleMeal(m)}>{m}</span>)}
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
          {!loading && items.length === 0 && <div style={S.empty}>No restaurants yet.<br /><span style={{ color: COLORS.gold, cursor: 'pointer' }} onClick={() => { setForm(empty); setEditing('new'); }}>+ Add restaurant →</span></div>}
          {items.map(item => (
            <div key={item.id} style={S.card}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: item.is_available ? COLORS.success : COLORS.danger }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  {item.name} {item.michelin_stars > 0 && <span style={{ color: COLORS.gold }}>{'★'.repeat(item.michelin_stars)}</span>}
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {item.cuisine_type && <span>{item.cuisine_type}</span>}
                  {item.price_range && <span>{item.price_range}</span>}
                  {item.meal_types?.length > 0 && <span>{item.meal_types.join(', ')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {deleteConfirm === item.id ? (
                  <><span style={{ color: COLORS.textMuted, fontSize: 12, alignSelf: 'center' }}>Confirm?</span><button style={S.btnDanger} onClick={() => handleDelete(item.id)}>Delete</button><button style={S.btnOutline} onClick={() => setDeleteConfirm(null)}>Cancel</button></>
                ) : (
                  <><button style={S.btnOutline} onClick={() => { setForm({ ...empty, ...item, price_from: item.price_from || '', seats: item.seats || '' }); setEditing(item); }}>Edit</button><button style={S.btnDanger} onClick={() => setDeleteConfirm(item.id)}>Delete</button></>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}