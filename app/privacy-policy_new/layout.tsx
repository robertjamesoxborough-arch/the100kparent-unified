import type { Metadata } from 'next'

// The _new funnel is not finished and is not linked from the live site, but it
// is deployed and was publicly reachable. Keeping it out of search indexes
// until the team decides whether to finish it or retire it.
// See GO-LIVE-CHECKLIST.md and phase-4-report.md.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
