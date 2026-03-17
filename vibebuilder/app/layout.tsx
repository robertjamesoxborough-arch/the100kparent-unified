import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibeBuilder — Generate a Business in 60 Seconds',
  description:
    'Turn your idea into a complete business system with AI-generated brand identity, offers, content plans, monetisation strategy, and landing page copy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
