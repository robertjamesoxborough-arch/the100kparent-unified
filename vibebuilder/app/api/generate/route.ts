import { NextRequest, NextResponse } from 'next/server'
import { generateBusinessKit, regenerateSection } from '@/lib/ai'
import { BusinessKit } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idea, regenerate, section, currentKit } = body

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ error: 'Please provide a business idea' }, { status: 400 })
    }

    if (regenerate && section && currentKit) {
      const updated = await regenerateSection(idea, section, currentKit as BusinessKit)
      return NextResponse.json(updated)
    }

    const kit = await generateBusinessKit(idea)
    return NextResponse.json(kit)
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate business kit. Please try again.' },
      { status: 500 }
    )
  }
}
