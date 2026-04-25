'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Incorrect email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0C0C0C', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: '#C9A96E', margin: '0 0 0.5rem' }}>
            SwissNet <span style={{ fontStyle: 'italic', color: '#fff' }}>Hotels</span>
          </p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Hotel Partner Portal
          </p>
        </div>

        <div style={{ border: '1px solid rgba(201,169,110,0.2)', padding: '2.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="you@hotel.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', padding: '0.75rem 1rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
            </div>
            {error && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: '#ef4444', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ background: '#C9A96E', color: '#0C0C0C', fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: '1.5rem' }}>
          Need access? Contact <a href="mailto:hotels@swissnethostels.com" style={{ color: 'rgba(201,169,110,0.6)', textDecoration: 'none' }}>hotels@swissnethostels.com</a>
        </p>
      </div>
    </div>
  )
}