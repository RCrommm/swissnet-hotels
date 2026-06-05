export const metadata = {
  title: 'Privacy Policy | SwissNet Hotels',
  description: 'How SwissNet Hotels collects and uses data.',
}

export default function PrivacyPage() {
  const gold = '#C9A84C'
  const text = '#1a1a1a'
  const muted = 'rgba(26,26,26,0.6)'
  const bg = '#FAFAF8'
  const border = 'rgba(0,0,0,0.08)'

  const H = ({ children }: { children: string }) => (
    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: text, margin: '2.5rem 0 0.75rem' }}>{children}</h2>
  )
  const P = ({ children }: { children: any }) => (
    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: muted, lineHeight: 1.8, margin: '0 0 1rem' }}>{children}</p>
  )

  return (
    <div style={{ background: bg, minHeight: '100vh', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, margin: '0 0 0.75rem' }}>SwissNet Hotels</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: text, margin: '0 0 0.5rem' }}>Privacy Policy</h1>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: muted, margin: '0 0 2rem' }}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div style={{ height: 1, background: border, marginBottom: '1rem' }} />

        <P>This Privacy Policy explains how SwissNet Hotels ("SwissNet", "we", "us") collects, uses and protects information when you visit swissnethotels.com (the "Site"). We are committed to handling data in accordance with the Swiss Federal Act on Data Protection (FADP) and, where applicable, the EU General Data Protection Regulation (GDPR).</P>

        <H>Who we are</H>
        <P>SwissNet Hotels is a platform based in Switzerland that helps luxury hotels understand and improve their visibility in AI-powered search. For any privacy question, contact us at contact@swissnethotels.com.</P>

        <H>What we collect</H>
        <P>When you visit the Site, we automatically log limited technical information to understand how our pages perform and how visitors discover partner hotels. This includes:</P>
        <ul style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', color: muted, lineHeight: 1.9, margin: '0 0 1rem', paddingLeft: '1.25rem' }}>
          <li>The pages you view and links you click on the Site</li>
          <li>The website or AI assistant that referred you (e.g. a search engine or AI tool)</li>
          <li>Your approximate country and city, derived from your network connection</li>
          <li>Your browser type (user agent) and a truncated, non-identifying network identifier</li>
        </ul>
        <P>We do not require you to create an account to browse the Site, and we do not collect names, email addresses or payment details from general visitors. Partner hotels who log in to their dashboard provide account information separately under their service agreement with us.</P>

        <H>Cookies</H>
        <P>The Site does not use cookies or similar tracking technologies for advertising or cross-site tracking, and we do not use third-party analytics services. Because of this, no cookie consent banner is required. Any data we collect is gathered server-side and used only for the purposes described here.</P>

        <H>Why we collect it</H>
        <P>We use this information to measure the performance of hotel pages, to understand which AI assistants and searches lead visitors to partner hotels, to detect automated traffic, and to improve our service. We do not sell your data, and we do not use it to build advertising profiles.</P>

        <H>How long we keep it</H>
        <P>We retain page-view and click records for as long as needed to provide performance reporting to partner hotels, and we periodically remove or aggregate older records. You may request deletion of any data relating to you (see "Your rights").</P>

        <H>Who we share it with</H>
        <P>Site data is stored using Supabase, our database provider, and hosted via Vercel. These providers process data on our behalf under their own security and data-processing terms. Aggregated, non-identifying performance data is shared with the relevant partner hotel. We do not sell or rent data to third parties.</P>

        <H>Your rights</H>
        <P>Depending on your location, you may have the right to access, correct or delete data relating to you, or to object to its processing. To exercise any of these rights, email contact@swissnethotels.com and we will respond within a reasonable time.</P>

        <H>Changes to this policy</H>
        <P>We may update this Privacy Policy from time to time. The "last updated" date above reflects the most recent version.</P>

        <H>Contact</H>
        <P>For any question about this policy or your data, contact contact@swissnethotels.com.</P>

        <div style={{ height: 1, background: border, margin: '2.5rem 0 1.5rem' }} />
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: muted, lineHeight: 1.7, fontStyle: 'italic' }}>This document is provided as a general template and starting point. It is not legal advice. Before relying on it, have it reviewed by a qualified Swiss legal professional to ensure it fits your specific circumstances and obligations.</p>
        <p style={{ marginTop: '1.5rem' }}><a href="/" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>← Back to SwissNet Hotels</a></p>
      </div>
    </div>
  )
}
