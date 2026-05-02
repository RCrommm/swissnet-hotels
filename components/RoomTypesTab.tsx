'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COLORS = {
  bg: '#492816',
  bgLight: '#3D2010',
  bgCard: '#5C3320',
  gold: '#C9A84C',
  goldLight: '#E8C87A',
  text: '#F5EDD8',
  textMuted: '#C4A882',
  border: 'rgba(201,168,76,0.25)',
  danger: '#D64045',
  success: '#4CAF50',
  inputBg: 'rgba(0,0,0,0.25)',
};

const TYPE_CATEGORIES = ['room', 'suite', 'villa', 'penthouse', 'chalet', 'apartment'];
const BED_TYPES = ['King', 'Queen', 'Twin', 'Double', 'Single', 'Bunk', 'Sofa Bed'];
const VIEW_TYPES = ['Mountain View', 'Lake View', 'Garden View', 'City View', 'Pool View', 'Sea View', 'Forest View', 'Courtyard View'];
const AMENITY_PRESETS = [
  'WiFi', 'Minibar', 'Safe', 'Nespresso', 'Bathrobe & Slippers',
  'Rain Shower', 'Bathtub', 'Smart TV', 'Air Conditioning', 'Heating',
  'Butler Service', 'Room Service', 'Balcony', 'Terrace', 'Fireplace',
  'Jacuzzi', 'Spa Access', 'Gym Access', 'Pool Access', 'Private Pool',
  'Kitchen', 'Living Room', 'Dining Area', 'Laundry Service', 'Parking',
  'Airport Transfer', 'Daily Housekeeping', 'Turndown Service', 'Work Desk',
  'Blackout Curtains', 'Soundproofing',
];

const emptyRoom = {
  name: '',
  type_category: 'room',
  description: '',
  short_description: '',
  ai_description: '',
  price_per_night: '',
  price_currency: 'CHF',
  price_weekend: '',
  price_peak: '',
  max_occupancy: 2,
  adults: 2,
  children: 0,
  size_sqm: '',
  floor_level: '',
  bed_type: 'King',
  bed_count: 1,
  view_type: '',
  amenities: [] as string[],
  highlights: [] as string[],
  keywords: [] as string[],
  thumbnail_url: '',
  booking_url: '',
  is_available: true,
  min_stay_nights: 1,
  schema_name: '',
  sort_order: 0,
};

type RoomForm = typeof emptyRoom;
type Room = RoomForm & { id: string; hotel_id: string; base_rate_chf?: number };

export default function RoomTypesTab({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<null | 'new' | Room>(null);
  const [form, setForm] = useState<RoomForm>(emptyRoom);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [amenityInput, setAmenityInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('sort_order', { ascending: true });
    if (!error) setRooms(data || []);
    setLoading(false);
  }, [hotelId]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const openNew = () => {
    setForm({ ...emptyRoom, sort_order: (rooms.length + 1) * 10 });
    setEditing('new');
  };

  const openEdit = (room: Room) => {
    setForm({
      ...emptyRoom,
      ...room,
      amenities: room.amenities || [],
      highlights: room.highlights || [],
      keywords: room.keywords || [],
      price_per_night: room.price_per_night || '',
      price_weekend: room.price_weekend || '',
      price_peak: room.price_peak || '',
      size_sqm: room.size_sqm || '',
    });
    setEditing(room);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyRoom);
    setAmenityInput('');
    setHighlightInput('');
    setKeywordInput('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg('error', 'Room name is required.');
    setSaving(true);

    const payload = {
      hotel_id: hotelId,
      name: form.name.trim(),
      type_category: form.type_category,
      description: form.description || null,
      short_description: form.short_description || null,
      ai_description: form.ai_description || null,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night as string) : null,
      price_currency: form.price_currency || 'CHF',
      price_weekend: form.price_weekend ? parseFloat(form.price_weekend as string) : null,
      price_peak: form.price_peak ? parseFloat(form.price_peak as string) : null,
      max_occupancy: parseInt(form.max_occupancy as unknown as string) || 2,
      adults: parseInt(form.adults as unknown as string) || 2,
      children: parseInt(form.children as unknown as string) || 0,
      size_sqm: form.size_sqm ? parseFloat(form.size_sqm as string) : null,
      floor_level: form.floor_level || null,
      bed_type: form.bed_type || null,
      bed_count: parseInt(form.bed_count as unknown as string) || 1,
      view_type: form.view_type || null,
      amenities: form.amenities,
      highlights: form.highlights,
      keywords: form.keywords,
      thumbnail_url: form.thumbnail_url || null,
      booking_url: form.booking_url || null,
      is_available: form.is_available,
      min_stay_nights: parseInt(form.min_stay_nights as unknown as string) || 1,
      schema_name: form.schema_name || null,
      sort_order: parseInt(form.sort_order as unknown as string) || 0,
    };

    let error: any;
    if (editing === 'new') {
      ({ error } = await supabase.from('room_types').insert(payload));
    } else {
      ({ error } = await supabase.from('room_types').update(payload).eq('id', (editing as Room).id));
    }

    setSaving(false);
    if (error) {
      showMsg('error', `Save failed: ${error.message}`);
    } else {
      showMsg('success', editing === 'new' ? 'Room type created!' : 'Room type updated!');
      cancelEdit();
      fetchRooms();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('room_types').delete().eq('id', id);
    if (error) showMsg('error', `Delete failed: ${error.message}`);
    else { showMsg('success', 'Room type deleted.'); fetchRooms(); }
    setDeleteConfirm(null);
  };

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a]
    }));
  };

  const addTag = (field: 'highlights' | 'keywords', value: string, setter: (v: string) => void) => {
    const v = value.trim();
    if (!v) return;
    setForm(f => ({ ...f, [field]: f[field].includes(v) ? f[field] : [...f[field], v] }));
    setter('');
  };

  const removeTag = (field: 'highlights' | 'keywords', value: string) => {
    setForm(f => ({ ...f, [field]: f[field].filter(x => x !== value) }));
  };

  const S: Record<string, React.CSSProperties> = {
    wrap: { padding: '24px 0' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    title: { color: COLORS.gold, fontSize: 22, fontWeight: 700, margin: 0 },
    btnGold: { background: COLORS.gold, color: '#1a0e06', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    btnOutline: { background: 'transparent', color: COLORS.gold, border: `1px solid ${COLORS.gold}`, padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    btnDanger: { background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    card: { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 },
    cardLeft: { flex: 1 },
    roomName: { color: COLORS.text, fontWeight: 700, fontSize: 16, marginBottom: 4 },
    roomMeta: { color: COLORS.textMuted, fontSize: 13, display: 'flex', gap: 14, flexWrap: 'wrap' },
    formWrap: { background: COLORS.bgCard, border: `1px solid ${COLORS.gold}55`, borderRadius: 16, padding: 28, marginBottom: 24 },
    formTitle: { color: COLORS.gold, fontSize: 18, fontWeight: 700, marginBottom: 24 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px', marginBottom: 16 },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' },
    textarea: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 80, resize: 'vertical', fontFamily: 'inherit' },
    select: { background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer' },
    sectionTitle: { color: COLORS.gold, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginBottom: 14, marginTop: 22 },
    tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    tagInput: { display: 'flex', gap: 8, marginTop: 8 },
    actions: { display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' },
    empty: { textAlign: 'center', color: COLORS.textMuted, padding: '40px 0', fontSize: 15 },
    checkWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  };

  const tagStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
    border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
    background: active ? COLORS.gold + '22' : 'transparent',
    color: active ? COLORS.goldLight : COLORS.textMuted,
  });

  const msgStyle = (type: 'success' | 'error'): React.CSSProperties => ({
    padding: '12px 20px', borderRadius: 8, marginBottom: 20,
    background: type === 'success' ? COLORS.success + '22' : COLORS.danger + '22',
    color: type === 'success' ? COLORS.success : COLORS.danger,
    border: `1px solid ${type === 'success' ? COLORS.success : COLORS.danger}44`,
    fontSize: 14,
  });

  const inp = (field: keyof RoomForm) => ({
    value: form[field] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value })),
    style: S.input,
  });

  if (!hotelId) return <div style={S.empty}>Select a hotel to manage room types.</div>;

  return (
    <div style={S.wrap}>
      {msg && <div style={msgStyle(msg.type)}>{msg.text}</div>}

      {!editing && (
        <div style={S.header}>
          <h2 style={S.title}>Room Types — {hotelName}</h2>
          <button style={S.btnGold} onClick={openNew}>+ Add Room Type</button>
        </div>
      )}

      {editing && (
        <div style={S.formWrap}>
          <div style={S.formTitle}>{editing === 'new' ? '✦ New Room Type' : `✦ Edit: ${(editing as Room).name}`}</div>

          <div style={S.sectionTitle}>Basic Information</div>
          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Room Name *</label>
              <input {...inp('name')} placeholder="e.g. Deluxe King Room" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Category</label>
              <select style={S.select} value={form.type_category} onChange={e => setForm(f => ({ ...f, type_category: e.target.value }))}>
                {TYPE_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Short Description</label>
            <input {...inp('short_description')} placeholder="One-line description for AI crawlers" />
          </div>
          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>Full Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={S.textarea} placeholder="Detailed room description..." />
          </div>
          <div style={{ ...S.fieldGroup, marginBottom: 16 }}>
            <label style={S.label}>AI-Optimised Description</label>
            <textarea value={form.ai_description} onChange={e => setForm(f => ({ ...f, ai_description: e.target.value }))} style={{ ...S.textarea, borderColor: COLORS.gold + '55' }} placeholder="Optimised for AI crawler indexing..." />
          </div>

          <div style={S.sectionTitle}>Pricing</div>
          <div style={S.grid3}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Base Rate / Night</label>
              <input {...inp('price_per_night')} type="number" placeholder="850" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Weekend Rate</label>
              <input {...inp('price_weekend')} type="number" placeholder="optional" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Peak Season Rate</label>
              <input {...inp('price_peak')} type="number" placeholder="optional" />
            </div>
          </div>
          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Currency</label>
              <select style={S.select} value={form.price_currency} onChange={e => setForm(f => ({ ...f, price_currency: e.target.value }))}>
                {['CHF', 'EUR', 'USD', 'GBP'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Min Stay (nights)</label>
              <input {...inp('min_stay_nights')} type="number" min="1" />
            </div>
          </div>

          <div style={S.sectionTitle}>Room Specifications</div>
          <div style={S.grid3}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Size (m²)</label>
              <input {...inp('size_sqm')} type="number" placeholder="45" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Bed Type</label>
              <select style={S.select} value={form.bed_type} onChange={e => setForm(f => ({ ...f, bed_type: e.target.value }))}>
                <option value="">— Select —</option>
                {BED_TYPES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>No. of Beds</label>
              <input {...inp('bed_count')} type="number" min="1" max="6" />
            </div>
          </div>
          <div style={S.grid3}>
            <div style={S.fieldGroup}>
              <label style={S.label}>View Type</label>
              <select style={S.select} value={form.view_type} onChange={e => setForm(f => ({ ...f, view_type: e.target.value }))}>
                <option value="">— Select —</option>
                {VIEW_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Floor Level</label>
              <input {...inp('floor_level')} placeholder="e.g. 3rd–5th" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Max Occupancy</label>
              <input {...inp('max_occupancy')} type="number" min="1" max="20" />
            </div>
          </div>

          <div style={S.sectionTitle}>Amenities</div>
          <div style={S.tagWrap}>
            {AMENITY_PRESETS.map(a => (
              <span key={a} style={tagStyle(form.amenities.includes(a))} onClick={() => toggleAmenity(a)}>{a}</span>
            ))}
          </div>
          <div style={S.tagInput}>
            <input style={{ ...S.input, flex: 1 }} value={amenityInput} onChange={e => setAmenityInput(e.target.value)} placeholder="Add custom amenity..." onKeyDown={e => { if (e.key === 'Enter') { toggleAmenity(amenityInput); setAmenityInput(''); }}} />
            <button style={S.btnOutline} onClick={() => { toggleAmenity(amenityInput); setAmenityInput(''); }}>Add</button>
          </div>

          <div style={S.sectionTitle}>Highlights</div>
          <div style={S.tagWrap}>
            {form.highlights.map(h => (
              <span key={h} style={tagStyle(true)}>
                {h} <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => removeTag('highlights', h)}>×</span>
              </span>
            ))}
          </div>
          <div style={S.tagInput}>
            <input style={{ ...S.input, flex: 1 }} value={highlightInput} onChange={e => setHighlightInput(e.target.value)} placeholder="e.g. Panoramic Matterhorn views..." onKeyDown={e => e.key === 'Enter' && addTag('highlights', highlightInput, setHighlightInput)} />
            <button style={S.btnOutline} onClick={() => addTag('highlights', highlightInput, setHighlightInput)}>Add</button>
          </div>

          <div style={S.sectionTitle}>AI Keywords</div>
          <div style={S.tagWrap}>
            {form.keywords.map(k => (
              <span key={k} style={tagStyle(false)}>
                {k} <span style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => removeTag('keywords', k)}>×</span>
              </span>
            ))}
          </div>
          <div style={S.tagInput}>
            <input style={{ ...S.input, flex: 1 }} value={keywordInput} onChange={e => setKeywordInput(e.target.value)} placeholder="e.g. luxury suite zermatt..." onKeyDown={e => e.key === 'Enter' && addTag('keywords', keywordInput, setKeywordInput)} />
            <button style={S.btnOutline} onClick={() => addTag('keywords', keywordInput, setKeywordInput)}>Add</button>
          </div>

          <div style={S.sectionTitle}>Booking & Media</div>
          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Booking URL</label>
              <input {...inp('booking_url')} placeholder="https://..." />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Thumbnail URL</label>
              <input {...inp('thumbnail_url')} placeholder="https://..." />
            </div>
          </div>
          <div style={{ ...S.fieldGroup, marginTop: 12 }}>
            <label style={S.label}>Images (paste URLs one by one)</label>
            {((form as any).images || []).map((url: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input value={url} onChange={e => { const imgs = [...((form as any).images || [])]; imgs[i] = e.target.value; setForm(f => ({ ...f, images: imgs } as any)) }} style={{ ...S.input, flex: 1 }} placeholder="https://..." />
                <button onClick={() => { const imgs = ((form as any).images || []).filter((_: any, idx: number) => idx !== i); setForm(f => ({ ...f, images: imgs } as any)) }} style={{ ...S.btnDanger, padding: '6px 10px' }}>✕</button>
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, images: [...((f as any).images || []), ''] } as any))} style={{ ...S.btnOutline, marginTop: 4, alignSelf: 'flex-start' }}>+ Add Image</button>
          </div>

          <div style={S.sectionTitle}>Advanced</div>
          <div style={S.grid2}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Schema Name Override</label>
              <input {...inp('schema_name')} placeholder="Leave blank to use room name" />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Sort Order</label>
              <input {...inp('sort_order')} type="number" />
            </div>
          </div>
          <div style={{ ...S.checkWrap, marginTop: 12 }}>
            <input type="checkbox" id="is_available" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} style={{ accentColor: COLORS.gold, width: 16, height: 16 }} />
            <label htmlFor="is_available" style={{ color: COLORS.textMuted, fontSize: 14, cursor: 'pointer' }}>Room is available</label>
          </div>

          <div style={S.actions}>
            <button style={S.btnOutline} onClick={cancelEdit}>Cancel</button>
            <button style={{ ...S.btnGold, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing === 'new' ? 'Create Room Type' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <>
          {loading && <div style={S.empty}>Loading...</div>}
          {!loading && rooms.length === 0 && (
            <div style={S.empty}>
              No room types yet.<br />
              <span style={{ color: COLORS.gold, cursor: 'pointer' }} onClick={openNew}>+ Add your first room type →</span>
            </div>
          )}
          {rooms.map(room => (
            <div key={room.id} style={S.card}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: room.is_available ? COLORS.success : COLORS.danger }} />
              <div style={S.cardLeft}>
                <div style={S.roomName}>{room.name}</div>
                <div style={S.roomMeta}>
                  <span style={{ background: COLORS.gold + '22', color: COLORS.gold, border: `1px solid ${COLORS.gold}44`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{room.type_category}</span>
                  {room.base_rate_chf && <span>CHF {Number(room.base_rate_chf).toLocaleString()} / night</span>}
                  {room.size_sqm && <span>{room.size_sqm} m²</span>}
                  {room.bed_type && <span>{room.bed_type}</span>}
                  {room.view_type && <span>{room.view_type}</span>}
                  {room.amenities?.length > 0 && <span style={{ color: COLORS.gold }}>{room.amenities.length} amenities</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {deleteConfirm === room.id ? (
                  <>
                    <span style={{ color: COLORS.textMuted, fontSize: 12, alignSelf: 'center' }}>Confirm?</span>
                    <button style={S.btnDanger} onClick={() => handleDelete(room.id)}>Delete</button>
                    <button style={S.btnOutline} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button style={S.btnOutline} onClick={() => openEdit(room)}>Edit</button>
                    <button style={S.btnDanger} onClick={() => setDeleteConfirm(room.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {rooms.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button style={S.btnGold} onClick={openNew}>+ Add Another Room Type</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}