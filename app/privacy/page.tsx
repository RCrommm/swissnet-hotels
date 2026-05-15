export default function PrivacyPage() {
  const text = '#1a1a1a'
  const muted = 'rgba(26,26,26,0.6)'
  const gold = '#C9A84C'

  return (
    <div style={{ background: '#FAFAF8', minHeight: '100vh', padding: '6rem 2rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, marginBottom: '1rem' }}>SwissNet Hotels</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', fontWeight: 300, color: text, marginBottom: '2rem' }}>Privacy Policy</h1>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: muted, lineHeight: 1.9, marginBottom: '1.5rem' }}>Last updated: May 2026</p>
        {[
          { title: 'Data We Collect', body: 'SwissNet Hotels collects basic usage data including page views, clicks and booking referrals to measure platform performance. We do not collect personal data without consent.' },
          { title: 'How We Use Data', body: 'Data is used solely to improve hotel visibility, track referral performance for partner hotels, and improve the SwissNet platform. We do not sell data to third parties.' },
          { title: 'Cookies', body: 'We use minimal cookies for analytics purposes only. No advertising or tracking cookies are used.' },
          { title: 'Third Party Services', body: 'SwissNet uses Supabase for data storage, Vercel for hosting, and Resend for email notifications. All data is stored in compliance with GDPR.' },
          { title: 'ChatGPT Integration', body: 'The SwissNet Hotels GPT uses our public API to retrieve hotel recommendations. No personal user data is stored or processed through this integration.' },
          { title: 'Contact', body: 'For any privacy-related questions contact us at contact@swissnethotels.com' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: text, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{s.title}</h2>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', color: muted, lineHeight: 1.9, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}