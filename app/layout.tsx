import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'SwissNet Hotels — Direct Booking for Swiss Luxury Hotels',
  description: 'Discover and book Switzerland\'s finest luxury hotels directly.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  )
}