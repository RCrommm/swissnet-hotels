'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const gold = '#C9A84C'
  const bg = '#492816'
  const bgLight = '#3D2010'
  const border = 'rgba(201,169,110,0.3)'
  const text = '#FFFFFF'
  const textMuted = 'rgba(255,255,255,0.6)'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signup') {
      if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }
      if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return }
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message.includes('already') ? 'An account with this email already exists' : error.message)
        setLoading(false)
        return
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) { setMode('login'); setError('Account created — please sign in.'); setLoading(false); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('hotel_users').insert({ user_id: session.user.id, email, status: 'pending', hotel_id: null })
        fetch('/api/notify-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => {})
      }
      router.push('/dashboard'); router.refresh()
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect email or password')
      setLoading(false)
    } else {
      router.push('/dashboard'); router.refresh()
    }
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: textMuted, marginBottom: '0.5rem' }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: gold, margin: '0 0 0.5rem' }}>
              SwissNet <span style={{ fontStyle: 'italic', color: text }}>Hotels</span>
            </p>
          </a>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: textMuted, margin: 0 }}>
            Hotel Partner Portal
          </p>
        </div>

        <div style={{ border: '1px solid ' + border, padding: '2.5rem', background: bgLight }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} type="button"
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: mode === m ? '2px solid ' + gold : '2px solid transparent', color: mode === m ? text : textMuted, fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0 0.6rem', cursor: 'pointer' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="you@hotel.com" />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} placeholder="••••••••" />
            </div>
            {mode === 'signup' && (
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={inputStyle} placeholder="••••••••" />
              </div>
            )}

            {error && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: error.includes('created') ? gold : '#fca5a5', margin: 0 }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, marginTop: '1.5rem' }}>
          {mode === 'signup'
            ? 'After creating your account, we link it to your hotel before you get access.'
            : <>Need access? Contact <a href="mailto:contact@swissnethotels.com" style={{ color: gold, textDecoration: 'none' }}>contact@swissnethotels.com</a></>}
        </p>
        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', marginTop: '0.75rem' }}>
          <a href="/" style={{ color: textMuted, textDecoration: 'none' }}>← Back to SwissNet Hotels</a>
        </p>
      </div>
    </div>
  )
}
