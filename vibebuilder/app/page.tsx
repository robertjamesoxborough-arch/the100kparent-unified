'use client'

import { useState } from 'react'
import InputScreen from '@/components/InputScreen'
import ResultsView from '@/components/ResultsView'
import { BusinessKit } from '@/lib/types'

export default function Home() {
  const [idea, setIdea] = useState('')
  const [kit, setKit] = useState<BusinessKit | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (inputIdea: string) => {
    setIsLoading(true)
    setError(null)
    setIdea(inputIdea)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: inputIdea }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await res.json()
      setKit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async (section: string) => {
    if (!kit) return
    setRegeneratingSection(section)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          regenerate: true,
          section,
          currentKit: kit,
        }),
      })

      if (!res.ok) throw new Error('Regeneration failed')

      const updated = await res.json()
      setKit({ ...kit, ...updated })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed')
    } finally {
      setRegeneratingSection(null)
    }
  }

  const handleStartOver = () => {
    setKit(null)
    setIdea('')
    setError(null)
  }

  if (kit) {
    return (
      <ResultsView
        idea={idea}
        kit={kit}
        onRegenerate={handleRegenerate}
        regeneratingSection={regeneratingSection}
        onStartOver={handleStartOver}
      />
    )
  }

  return (
    <div>
      <InputScreen onGenerate={handleGenerate} isLoading={isLoading} />
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
