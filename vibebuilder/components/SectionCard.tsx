'use client'

import { useState } from 'react'

interface SectionCardProps {
  title: string
  icon: string
  sectionKey: string
  data: Record<string, unknown>
  onRegenerate: (section: string) => void
  isRegenerating: boolean
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item, i) => `${i + 1}. ${item}`).join('\n')
  }
  return String(value)
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

export default function SectionCard({
  title,
  icon,
  sectionKey,
  data,
  onRegenerate,
  isRegenerating,
}: SectionCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const handleEdit = (key: string, value: unknown) => {
    setEditingField(key)
    setEditValues({ ...editValues, [key]: renderValue(value) })
  }

  const handleSave = (key: string) => {
    setEditingField(null)
    // Values are stored in editValues for display
  }

  const getDisplayValue = (key: string, original: unknown): string => {
    if (editValues[key] !== undefined) return editValues[key]
    return renderValue(original)
  }

  const handleCopyAll = async () => {
    const text = Object.entries(data)
      .map(([key, value]) => {
        const display = getDisplayValue(key, value)
        return `${formatLabel(key)}:\n${display}`
      })
      .join('\n\n')

    await navigator.clipboard.writeText(`${title}\n${'='.repeat(title.length)}\n\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => onRegenerate(sectionKey)}
            disabled={isRegenerating}
            className="px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-50"
          >
            {isRegenerating ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Regenerating...
              </span>
            ) : (
              'Regenerate'
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="group">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {formatLabel(key)}
            </label>

            {editingField === key ? (
              <div className="mt-1">
                <textarea
                  value={editValues[key] ?? renderValue(value)}
                  onChange={(e) =>
                    setEditValues({ ...editValues, [key]: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-800 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 resize-y min-h-[60px]"
                  rows={Array.isArray(value) ? Math.min(value.length + 1, 8) : 3}
                />
                <button
                  onClick={() => handleSave(key)}
                  className="mt-1 px-3 py-1 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
                >
                  Save
                </button>
              </div>
            ) : (
              <p
                onClick={() => handleEdit(key, value)}
                className="mt-1 text-sm text-gray-700 whitespace-pre-line cursor-pointer rounded-lg p-2 -mx-2 hover:bg-gray-50 transition-colors"
                title="Click to edit"
              >
                {getDisplayValue(key, value)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
