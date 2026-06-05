export const metadata = {
  title: 'Terms & Conditions | SwissNet Hotels',
  description: 'Terms of use for SwissNet Hotels.',
}

export default function TermsPage() {
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
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: text, margin: '0 0 0.5rem' }}>Terms &amp; Conditions</h1>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: muted, margin: '0 0 2rem' }}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div style={{ height: 1, background: border, marginBottom: '1rem' }} />

        <P>These Terms &amp; Conditions ("Terms") govern your use of swissnethotels.com (the "Site") operated by SwissNet Hotels ("SwissNet", "we", "us"). By using the Site, you agree to these Terms.</P>

        <H>About SwissNet Hotels</H>
        <P>SwissNet Hotels is a platform that helps luxury hotels understand and improve their visibility in AI-powered search and that curates a directory of Swiss luxury hotels. The Site provides hotel information, comparisons and related content.</P>

        <H>Use of the Site</H>
        <P>You may use the Site for lawful, personal and informational purposes. You agree not to misuse the Site, attempt to disrupt it, scrape it at scale, or use it in any way that could harm SwissNet, partner hotels or other users.</P>

        <H>Hotel information and accuracy</H>
        <P>We aim to keep hotel information, rates and availability accurate, but information on the Site is provided for general guidance and may not always be current. Prices, offers and availability are set by the hotels and their booking systems, not by SwissNet. Always confirm details directly with the hotel before booking. SwissNet is not the seller of any hotel stay and does not process bookings or payments.</P>

        <H>Links to hotel and third-party sites</H>
        <P>The Site links to hotels' official booking pages and other third-party websites. We are not responsible for the content, availability, pricing or practices of those external sites. Any booking you make is a contract directly between you and the hotel or its chosen booking provider.</P>

        <H>AI visibility services</H>
        <P>For partner hotels, SwissNet provides tools that measure and aim to improve visibility in AI search platforms. AI search results are determined by third-party systems outside our control. We provide measurement, analysis and recommendations in good faith, but we do not guarantee any specific ranking, placement, visibility score, booking volume or commercial outcome. The terms of any paid partnership are governed by a separate service agreement.</P>

        <H>Intellectual property</H>
        <P>The Site, its design, text and original content are owned by SwissNet or its licensors and may not be copied or reused without permission. Hotel names, trademarks and imagery remain the property of their respective owners.</P>

        <H>Limitation of liability</H>
        <P>To the fullest extent permitted by law, SwissNet is not liable for any indirect, incidental or consequential loss arising from your use of the Site, or from reliance on information that proves inaccurate or out of date. The Site is provided "as is" without warranties of any kind.</P>

        <H>Governing law</H>
        <P>These Terms are governed by the laws of Switzerland, and any dispute shall be subject to the competent Swiss courts, without prejudice to any mandatory consumer protection rights you may have in your country of residence.</P>

        <H>Changes</H>
        <P>We may update these Terms from time to time. Continued use of the Site after changes means you accept the revised Terms.</P>

        <H>Contact</H>
        <P>Questions about these Terms can be sent to contact@swissnethotels.com.</P>

        <div style={{ height: 1, background: border, margin: '2.5rem 0 1.5rem' }} />
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.62rem', color: muted, lineHeight: 1.7, fontStyle: 'italic' }}>This document is provided as a general template and starting point. It is not legal advice. Before relying on it — and especially before signing paid partner agreements — have it reviewed by a qualified Swiss legal professional.</p>
        <p style={{ marginTop: '1.5rem' }}><a href="/" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.7rem', color: gold, textDecoration: 'none' }}>← Back to SwissNet Hotels</a></p>
      </div>
    </div>
  )
}
