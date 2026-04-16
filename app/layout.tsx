import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The 100k Parent',
  description: 'Tax guides and PFA sessions for high-earning parents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
