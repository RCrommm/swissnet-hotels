import ConciergeClient from '@/components/ConciergeClient'

export const metadata = {
  title: 'AI Concierge — Find Your Perfect Swiss Luxury Hotel | SwissNet Hotels',
  description: 'Describe your perfect Swiss hotel stay and our AI concierge will find the best luxury hotels for you instantly.',
  alternates: { canonical: 'https://swissnethotels.com/concierge' },
}

export default function ConciergePage() {
  return <ConciergeClient />
}