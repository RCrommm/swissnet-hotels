import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  metadataBase: new URL('https://swissnethotels.com'),
  title: 'SwissNet Hotels — Direct Booking for Swiss Luxury Hotels',
  description: 'Discover and book Switzerland\'s finest luxury hotels directly.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: 'sIX8jPq9VMJjlEpiqXFd2gMtNUVheU-w6hmVCC661JI',
    other: {
      'msvalidate.01': '4C294F54AA8FE666AFBFD3C44D401904',
    },
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://swissnethotels.com#organization',
      name: 'SwissNet Hotels',
      url: 'https://swissnethotels.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://swissnethotels.com/apple-touch-icon.png',
      },
      description: 'SwissNet Hotels is a direct booking platform for luxury hotels in Switzerland.',
      areaServed: {
        '@type': 'Country',
        name: 'Switzerland',
      },
      sameAs: [
        'https://www.linkedin.com/company/swissnet-hotels',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://swissnethotels.com#website',
      url: 'https://swissnethotels.com',
      name: 'SwissNet Hotels',
      description: 'Direct booking platform for luxury Swiss hotels.',
      publisher: { '@id': 'https://swissnethotels.com#organization' },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}