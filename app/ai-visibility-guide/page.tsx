import Link from 'next/link'
import Navigation from '@/components/Navigation'

export const metadata = {
  title: 'How Hotels Rank in AI Search — A Guide | SwissNet Hotels',
  description: 'Why luxury hotels are invisible in ChatGPT, Perplexity and Google AI — and the structured way to become visible. A practical guide from SwissNet Hotels.',
  alternates: {
    canonical: 'https://swissnethotels.com/ai-visibility-guide',
  },
  openGraph: {
    title: 'How Hotels Rank in AI Search — A Guide | SwissNet Hotels',
    description: 'Why luxury hotels are invisible in ChatGPT, Perplexity and Google AI — and the structured way to become visible.',
    url: 'https://swissnethotels.com/ai-visibility-guide',
    siteName: 'SwissNet Hotels',
    type: 'article',
  },
}

export default function AIVisibilityGuidePage() {
  const gold = '#C9A84C'
  const bg = '#492816'
  const bgLight = '#FAF7F1'
  const border = 'rgba(0,0,0,0.1)'
  const text = '#2A1208'
  const textMuted = 'rgba(42,18,8,0.7)'
  const heroText = '#FFFFFF'
  const heroMuted = 'rgba(255,255,255,0.7)'

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How Hotels Rank in AI Search',
    description: 'Why luxury hotels are invisible in ChatGPT, Perplexity and Google AI — and the structured way to become visible.',
    author: { '@type': 'Organization', name: 'SwissNet Hotels', url: 'https://swissnethotels.com' },
    publisher: {
      '@type': 'Organization',
      name: 'SwissNet Hotels',
      logo: { '@type': 'ImageObject', url: 'https://swissnethotels.com/logo.png' },
    },
    mainEntityOfPage: 'https://swissnethotels.com/ai-visibility-guide',
    inLanguage: 'en',
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
      <span style={{ width: '30px', height: '1px', background: gold, display: 'inline-block' }} />
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: 0 }}>{children}</p>
    </div>
  )

  const H2 = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 300, color: text, margin: '0 0 1.25rem', lineHeight: 1.15 }}>{children}</h2>
  )

  const P = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', color: textMuted, fontWeight: 300, lineHeight: 1.9, margin: '0 0 1.25rem', maxWidth: 720 }}>{children}</p>
  )

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.85rem', maxWidth: 720 }}>
      <span style={{ color: gold, fontSize: '0.65rem', flexShrink: 0, marginTop: '0.3rem' }}>✦</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: textMuted, lineHeight: 1.7, fontWeight: 300 }}>{children}</span>
    </div>
  )

  const Divider = () => (
    <div style={{ height: 1, background: border, margin: '3.5rem 0', maxWidth: 720 }} />
  )

  return (
    <div style={{ background: bgLight, minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navigation />

      <section style={{ background: bg, padding: '9rem 2rem 5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: gold, margin: '0 0 1.5rem' }}>AI Visibility Guide</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 300, color: heroText, lineHeight: 1.1, margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
            How hotels rank <span style={{ fontStyle: 'italic', color: gold }}>in AI search.</span>
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.85rem', color: heroMuted, fontWeight: 300, lineHeight: 1.8, maxWidth: 640, margin: '0 auto' }}>
            Why reputation alone no longer guarantees a recommendation — and the structured way for a luxury hotel to become visible in ChatGPT, Perplexity and Google AI.
          </p>
        </div>
      </section>

      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <P>
            Travellers used to open Google and scroll through ten blue links. A growing number now start somewhere else: they ask an AI assistant. &ldquo;Best luxury hotel in Geneva with a spa and lake view?&rdquo; ChatGPT answers. Perplexity answers. Google AI answers. Each returns a short, confident list — three or four hotels, a sentence each. The guest picks one and clicks, and that click increasingly lands on an OTA rather than the hotel&rsquo;s own site. The hotels named in that answer get the first chance at the booking. The rest were never in the conversation at all — and the hotel never even knows it was being considered.
          </P>
          <P>
            This guide explains how AI assistants actually decide which hotels to name, why fame and history are no longer enough on their own, and exactly what a hotel can control.
          </P>

          <Divider />

          <H2>The core principle</H2>
          <P>
            AI assistants do not recommend the best hotel. They recommend the hotel that is the <strong style={{ color: text, fontWeight: 500 }}>clearest, most quotable, most consistently described answer</strong> to a specific guest question.
          </P>
          <P>
            That distinction is everything. A century-old, world-famous property can be absent from AI answers while a lesser-known competitor appears — not because the competitor is better, but because its information is cleaner, more structured, and more consistently described across the web. Reputation lives in human memory. AI reads data.
          </P>
          <P>
            This is, in fact, good news for an independent or family-run luxury hotel. The advantage in AI search goes to clarity and structure, not just brand size or marketing budget — which means a well-organised property can earn recommendations a larger, messier competitor misses.
          </P>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Be readable</strong> — give the machine clean, structured, unambiguous information about who the hotel is for and what it offers.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Be quotable</strong> — write content that directly answers the real questions guests ask, in language an AI can lift straight into its answer.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Be trusted</strong> — be described consistently across many credible sources, not only on your own website.</Bullet>

          <Divider />

          <H2>&ldquo;AI visibility&rdquo; is several different problems</H2>
          <P>
            One of the most common — and costly — misunderstandings is treating &ldquo;AI search&rdquo; as a single thing to optimise for. It isn&rsquo;t. The major assistants retrieve information differently, so a hotel can be strong on one platform and invisible on another. Visibility has to be measured and improved per platform, not in aggregate.
          </P>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>ChatGPT</strong> leans heavily on its underlying web-search partner and on third-party sources — directories, review platforms, editorial coverage. Being well-described off your own site matters as much as your own pages.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Google&rsquo;s AI Overviews and AI Mode</strong> draw on Google&rsquo;s own index. Strong, well-structured content plus a complete, current Google Business Profile carry real weight — and the hotel cited isn&rsquo;t always the one ranked first; it&rsquo;s often the one that gives the clearest answer.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Perplexity</strong> retrieves in real time and weights freshness and community discussion. Recency and being talked about across the wider web matter more here than elsewhere.</Bullet>

          <Divider />

          <H2>Part 1 — Be readable</H2>
          <P>
            Most hotel websites are built for human visitors and for beauty, not for systems that need structured, consistent data. The usual problems that make a hotel hard for AI to understand: key details trapped only in PDFs or images; room types described in evocative prose but never clearly labelled; spa, dining and experiences scattered across sections with inconsistent naming; policies hidden inside terms and conditions; FAQs missing, or written from the hotel&rsquo;s perspective instead of the guest&rsquo;s.
          </P>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Add structured data (schema markup).</strong> The machine-readable layer that tells an AI exactly what your property is — location, star rating, price range, amenities, languages, and specific feature flags (spa, lake view, ski-in/ski-out, family-friendly, fine dining). It turns a beautiful but ambiguous page into something a machine can read with confidence.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>State clearly who the hotel is for, not only what it has.</strong> AI matches hotels to intent — romantic, family, business, honeymoon, wellness, lakeside. Describe the kind of stay you&rsquo;re perfect for, in plain language. A hotel famous for romance can still be invisible for &ldquo;romantic hotel&rdquo; queries if nothing in its content signals romance.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Keep information consistent and current</strong> across your own site, your Google Business Profile, OTAs and guides. AI cross-checks sources; contradictions reduce its confidence.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Make sure AI can actually reach your site.</strong> A surprising number of hotel sites unintentionally block retrieval crawlers through outdated configuration — and a blocked crawler simply means you don&rsquo;t exist to that assistant.</Bullet>

          <Divider />

          <H2>Part 2 — Be quotable</H2>
          <P>
            AI engines name the hotel that gives them something specific and clear to quote. The discipline is simple: be the clearest answer to a real guest question.
          </P>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Build structured FAQs around the questions guests actually ask</strong> — &ldquo;Is the spa open to non-guests?&rdquo; &ldquo;How far is the hotel from the lake?&rdquo; &ldquo;Do you have family rooms?&rdquo; Each clear question-and-answer pair is a self-contained, quotable passage an assistant can lift directly.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Write in clear, specific, factual language.</strong> AI increasingly cites the clearest passage, not the highest-ranking page. Vague marketing copy gives a machine nothing to quote; specific facts — &ldquo;a 2,000 m&sup2; spa with a 25-metre indoor pool and lake-view treatment rooms&rdquo; — give it everything.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Cover every intent you genuinely serve.</strong> If you&rsquo;re strong for spa, dining, romance and business, each should have clear, dedicated content. Gaps in content become gaps in visibility.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Create destination and comparison content</strong> an AI can use as a clean, factual source about your area and how your property fits within it.</Bullet>

          <Divider />

          <H2>Part 3 — Be trusted</H2>
          <P>
            This is the hardest element to control directly, and often the most decisive. AI systems rely heavily on credible, independent validation — they weight what others say about a hotel more than what the hotel says about itself.
          </P>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Earn editorial and press coverage.</strong> AI tends to trust journalistic sources more than branded content. Awards, notable events and genuine story angles give publications a reason to mention you — and those mentions feed AI&rsquo;s confidence.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Be listed and described consistently</strong> across reputable travel guides, directories and review platforms. Consistency builds trust; contradiction erodes it.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Treat your Google Business Profile as a primary asset</strong> — complete, current and rich — because it is where a large share of AI-driven clicks ultimately land.</Bullet>
          <Bullet><strong style={{ color: text, fontWeight: 500 }}>Maintain review volume and recency.</strong> A steady flow of fresh, detailed reviews is both a trust signal and a description of who your hotel is for.</Bullet>

          <Divider />

          <H2>Part 4 — Measure it</H2>
          <P>
            The single biggest mistake is treating AI visibility as a vague concept. It is measurable. Run the queries travellers actually use — &ldquo;best luxury hotel in [city],&rdquo; &ldquo;where to stay for a romantic weekend in [city],&rdquo; &ldquo;best family hotel in [region]&rdquo; — across ChatGPT, Perplexity and Google AI, and record whether your hotel appears at all on each platform, which competitors appear instead, which intents you win and lose, and whether the link sends the guest to your own site or to an OTA.
          </P>
          <P>
            That baseline is your benchmark. Fix the gaps — usually content and structure first, trust signals next — and track how the picture changes over time. Doing this by hand across several platforms and dozens of queries doesn&rsquo;t scale, which is precisely the problem SwissNet exists to solve: continuous, per-platform tracking of how a hotel appears in AI search, with specific, actionable recommendations to close the gaps.
          </P>

          <Divider />

          <H2>The honest summary</H2>
          <P>
            AI visibility for hotels is not a trick or a hack. The properties earning AI recommendations are the ones that are readable, quotable, and trusted — crawlable, well-structured, genuinely useful, and consistently validated across the web. They get named because there is something real, clear and trustworthy for the machine to recommend.
          </P>
          <P>
            Reputation brought these hotels here. Structure is what keeps them visible in the AI era.
          </P>

        </div>
      </section>

      <section style={{ background: bg, borderTop: '1px solid ' + border, padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 300, color: heroText, margin: '0 0 1rem' }}>
            See how your hotel appears in AI search.
          </h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.78rem', color: heroMuted, fontWeight: 300, lineHeight: 1.8, margin: '0 0 2rem' }}>
            SwissNet tracks how Swiss luxury hotels appear across ChatGPT, Perplexity and Google AI — and shows exactly where visibility is being lost to competitors.
          </p>
          <Link href="/#contact" style={{ display: 'inline-block', background: gold, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.875rem 2.5rem', textDecoration: 'none' }}>
            Book a Demo →
          </Link>
        </div>
      </section>

      <footer style={{ background: '#2A1208', borderTop: '1px solid rgba(201,169,110,0.2)', padding: '3rem 0 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: gold, margin: '0 0 0.5rem' }}>SwissNet <span style={{ fontStyle: 'italic', color: '#fff' }}>Hotels</span></p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 300, margin: 0 }}>&copy; {new Date().getFullYear()} SwissNet Hotels. All rights reserved.</p>
      </footer>
    </div>
  )
}
