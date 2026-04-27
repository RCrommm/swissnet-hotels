'use client'
import { useState } from 'react'

export default function AIVisibilityToggle({ enabled }: { enabled: boolean }) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  const toggle = async () => {
    setLoading(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'ai_visibility_cron_enabled', value: !isEnabled ? 'true' : 'false' })
    })
    if (res.ok) setIsEnabled(!isEnabled)
    setLoading(false)
  }

  const runNow = async () => {
    setRunning(true)
    setRunResult(null)
    const res = await fetch('/api/cron/ai-visibility')
    const data = await res.json()
    setRunResult(`✓ Done — ${data.total_appearances || 0} appearances found across ${data.queries_run || 0} queries`)
    setRunning(false)
  }

  const gold = '#C9A84C'

  return (
    <div style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
      <div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#3D2B1F', margin: '0 0 4px' }}>AI Visibility Tracker</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#a8a29e', margin: 0 }}>
          Runs daily at 8am UTC · Checks partner hotels across 15 AI queries · ~$0.10/day
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {runResult && (
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#16a34a' }}>{runResult}</span>
        )}
        <button
          onClick={runNow}
          disabled={running}
          style={{ background: 'rgba(201,169,110,0.15)', color: gold, border: '1px solid ' + gold + '55', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}
        >
          {running ? 'Running...' : '▶ Run Now'}
        </button>
        <button
          onClick={toggle}
          disabled={loading}
          style={{ background: isEnabled ? '#16a34a' : '#e7e5e4', color: isEnabled ? '#fff' : '#78716c', border: 'none', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, padding: '8px 20px', borderRadius: 6, cursor: 'pointer', minWidth: 80 }}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}