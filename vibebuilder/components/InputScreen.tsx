'use client'

import { useState } from 'react'

const EXAMPLE_IDEAS = [
  'faceless TikTok fitness motivation page',
  'AI newsletter for startup founders',
  'luxury dropshipping skincare brand',
  'personal brand for ADHD entrepreneur',
]

interface InputScreenProps {
  onGenerate: (idea: string) => void
  isLoading: boolean
}

export default function InputScreen({ onGenerate, isLoading }: InputScreenProps) {
  const [idea, setIdea] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (idea.trim() && !isLoading) {
      onGenerate(idea.trim())
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-2">
          <span className="inline-block px-3 py-1 text-xs font-medium tracking-wide uppercase bg-violet-100 text-violet-700 rounded-full">
            AI-Powered
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-4">
          Vibe<span className="text-violet-600">Builder</span>
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto">
          Turn your idea into a complete business system in 60 seconds.
        </p>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your business idea or vibe..."
              className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-gray-400"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!idea.trim() || isLoading}
            className="mt-4 w-full sm:w-auto px-8 py-4 bg-violet-600 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-violet-200 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating your business...
              </span>
            ) : (
              'Generate Business'
            )}
          </button>
        </form>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">Try an example:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_IDEAS.map((example) => (
              <button
                key={example}
                onClick={() => setIdea(example)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-violet-100 hover:text-violet-700 transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
