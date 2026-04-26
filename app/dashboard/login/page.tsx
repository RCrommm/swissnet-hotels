'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Incorrect email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const gold = '#C9A84C'
  const bg = '#F8F5EF'
  const border = 'rgba(201,169,110,0.25)'
  const text = '#2A2118'
  const textMuted = 'rgba(42,33,24,0.45)'

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: gold, margin: '0 0 0.5rem' }}>
            SwissNet <span style={{ fontStyle: 'italic', color: text }}>Hotels</span>
          </p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: textMuted, margin: 0 }}>
            Hotel Partner Portal
          </p>
        </div>

        <div style={{ border: '1px solid ' + border, padding: '2.5rem', background: '#fff', boxShadow: '0 4px 24px rgba(201,169,110,0.08)' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, marginBottom: '0.5rem' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', background: bg, border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box' as const }}
                placeholder="you@hotel.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted, marginBottom: '0.5rem' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', background: bg, border: '1px solid ' + border, color: text, fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box' as const }}
                placeholder="••••••••" />
            </div>
            {error && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#dc2626', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: textMuted, marginTop: '1.5rem' }}>
          Need access? Contact <a href="mailto:hotels@swissnethostels.com" style={{ color: gold, textDecoration: 'none' }}>hotels@swissnethostels.com</a>
        </p>
        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', marginTop: '0.75rem' }}>
          <a href="/" style={{ color: textMuted, textDecoration: 'none' }}>← Back to SwissNet Hotels</a>
        </p>
      </div>
    </div>
  )
}