// components/schema/OffersSchema.tsx
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

const OFFER_TYPES = ['package', 'early_bird', 'last_minute', 'seasonal', 'honeymoon', 'family', 'spa', 'loyalty', 'direct_booking'];
const INCLUDES_PRESETS = ['Breakfast', 'Dinner', 'Spa Access', 'Airport Transfer', 'Welcome Champagne', 'Late Checkout', 'Early Check-in', 'Room Upgrade', 'Ski Pass', 'City Tax Included'];

const empty = {
  name: '', description: '', ai_description: '', offer_type: 'package',
  discount_percent: '', discount_amount: '', price_from: '', price_currency: 'CHF',
  valid_from: '', valid_through: '', conditions: '', booking_url: '',
  includes: [] as string[], min_stay_nights: 1, is_available: true, sort_order: 0,
};

type Offer = typeof empty & { id: string; hotel_id: string };

export default function OffersSchema({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const [items, setItems] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<null | 'new' | Offer>(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [includesInput, setIncludesInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('hotel_offers').select('*').eq('hotel_id', hotelId).order('sort_order');
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
      ai_description: form.ai_description || null, offer_type: form.offer_type,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent as string) : null,
      discount_amount: form.discount_amount ? parseFloat(form.discount_amount as string) : null,
      price_from: form.price_from ? parseFloat(form.price_from as string) : null,
      price_currency: form.price_currency, valid_from: form.valid_from || null,
      valid_through: form.valid_through || null, conditions: form.conditions || null,
      booking_url: form.booking_url || null, includes: form.includes,
      min_stay_nights: parseInt(form.min_stay_nights as unknown as string) || 1,
      is_available: form.is_available, sort_order: parseInt(form.sort_order as unknown as string) || 0,
    };
    let error: any;
    if (editing === 'new') ({ error } = await supabase.from('hotel_offers').insert(payload));
    else ({ error } = await supabase.from('hotel_offers').update(payload).eq('id', (editing as Offer).id));
    setSaving(false);
    if (error) showMsg('error', error.message);
    else { showMsg('success', 'Saved!'); setEditing(null); setForm(empty); fetch(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('hotel_offers').delete().eq('id', id);
    showMsg('success', 'Deleted.'); fetch(); setDeleteConfirm(null);
  };

  const toggleInclude = (val: string) => setForm(f => ({ ...f, includes: f.includes.includes(val) ? f.includes.filter(x => x !== val) : [...f.includes, val] }));

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
          <h2 style={S.title}>Special Offers — {hotelName}</h2>
          <button style={S.btnGold} onClick={() => { setForm(empty); setEditing('new'); }}>+ Add Offer</button>
        </div>
      )}

      {editing && (
        <div style={S.formWrap}>
          <div style={{ color: COLORS.gold, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
            {editing === 'new' ? '✦ New Special Offer' : `✦ Edit: ${(editing as Offer).name}`}
          </div>

          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Offer Name *</label>
              <input {...inp('name')} placeholder="e.g. Alpine Escape Package" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Offer Type</label>
              <select style={S.select} value={form.offer_type} onChange={e => setForm(f => ({ ...f, offer_type: e.target.value }))}>
                {OFFER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={S.textarea} placeholder="Full offer description..." />
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>AI-Optimised Description</label>
            <textarea value={form.ai_description} onChange={e => setForm(f => ({ ...f, ai_description: e.target.value }))} style={{ ...S.textarea, borderColor: COLORS.gold + '55' }} placeholder="For AI crawler visibility — occasion, savings, inclusions, urgency, target guest..." />
          </div>

          <div style={S.grid3}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Price From (CHF)</label>
              <input {...inp('price_from')} type="number" placeholder="450" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Discount %</label>
              <input {...inp('discount_percent')} type="number" placeholder="e.g. 20" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Min Stay (nights)</label>
              <input {...inp('min_stay_nights')} type="number" min="1" />
            </div>
          </div>

          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Valid From</label>
              <input {...inp('valid_from')} type="date" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Valid Through</label>
              <input {...inp('valid_through')} type="date" />
            </div>
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Conditions / Fine Print</label>
            <input {...inp('conditions')} placeholder="e.g. Subject to availability, non-refundable" />
          </div>

          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Booking URL</label>
            <input {...inp('booking_url')} placeholder="https://..." />
          </div>

          <div style={S.sectionTitle}>What's Included</div>
          <div style={S.tagWrap}>
            {INCLUDES_PRESETS.map(i => <span key={i} style={tag(form.includes.includes(i))} onClick={() => toggleInclude(i)}>{i}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input style={{ ...S.input, flex: 1 }} value={includesInput} onChange={e => setIncludesInput(e.target.value)} placeholder="Custom inclusion..." onKeyDown={e => { if (e.key === 'Enter' && includesInput.trim()) { toggleInclude(includesInput.trim()); setIncludesInput(''); }}} />
            <button style={S.btnOutline} onClick={() => { if (includesInput.trim()) { toggleInclude(includesInput.trim()); setIncludesInput(''); }}}>Add</button>
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
          {!loading && items.length === 0 && <div style={S.empty}>No offers yet.<br /><span style={{ color: COLORS.gold, cursor: 'pointer' }} onClick={() => { setForm(empty); setEditing('new'); }}>+ Add special offer →</span></div>}
          {items.map(item => (
            <div key={item.id} style={S.card}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: item.is_available ? COLORS.success : COLORS.danger }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.name}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: COLORS.gold + '22', color: COLORS.gold, border: `1px solid ${COLORS.gold}44`, padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>{item.offer_type?.replace('_', ' ')}</span>
                  {item.price_from && <span>From CHF {item.price_from}</span>}
                  {item.discount_percent && <span>{item.discount_percent}% off</span>}
                  {item.valid_through && <span>Until {new Date(item.valid_through).toLocaleDateString('en-GB')}</span>}
                  {item.includes?.length > 0 && <span>{item.includes.length} inclusions</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {deleteConfirm === item.id ? (
                  <><span style={{ color: COLORS.textMuted, fontSize: 12, alignSelf: 'center' }}>Confirm?</span><button style={S.btnDanger} onClick={() => handleDelete(item.id)}>Delete</button><button style={S.btnOutline} onClick={() => setDeleteConfirm(null)}>Cancel</button></>
                ) : (
                  <><button style={S.btnOutline} onClick={() => { setForm({ ...empty, ...item, price_from: item.price_from || '', discount_percent: item.discount_percent || '', discount_amount: item.discount_amount || '' }); setEditing(item); }}>Edit</button><button style={S.btnDanger} onClick={() => setDeleteConfirm(item.id)}>Delete</button></>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}