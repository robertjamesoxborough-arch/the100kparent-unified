'use client'

import { BusinessKit } from '@/lib/types'
import SectionCard from './SectionCard'

interface ResultsViewProps {
  idea: string
  kit: BusinessKit
  onRegenerate: (section: string) => void
  regeneratingSection: string | null
  onStartOver: () => void
}

const SECTIONS: {
  key: keyof BusinessKit
  title: string
  icon: string
}[] = [
  { key: 'brand', title: 'Brand Identity', icon: '✦' },
  { key: 'offer', title: 'Offer', icon: '◆' },
  { key: 'content', title: 'Content Engine', icon: '▶' },
  { key: 'monetisation', title: 'Monetisation Plan', icon: '◉' },
  { key: 'landingPage', title: 'Landing Page Copy', icon: '▧' },
]

export default function ResultsView({
  idea,
  kit,
  onRegenerate,
  regeneratingSection,
  onStartOver,
}: ResultsViewProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              Vibe<span className="text-violet-600">Builder</span>
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs bg-violet-100 text-violet-600 rounded-full">
              {idea}
            </span>
          </div>
          <button
            onClick={onStartOver}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Start Over
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Business Kit is Ready
          </h2>
          <p className="text-gray-500">
            Click any field to edit. Use Regenerate for a fresh take on any section.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {SECTIONS.map(({ key, title, icon }) => (
            <div key={key} className={key === 'content' || key === 'landingPage' ? 'md:col-span-2' : ''}>
              <SectionCard
                title={title}
                icon={icon}
                sectionKey={key}
                data={kit[key] as unknown as Record<string, unknown>}
                onRegenerate={onRegenerate}
                isRegenerating={regeneratingSection === key}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
