import Anthropic from '@anthropic-ai/sdk'
import { BusinessKit } from './types'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are an elite business strategist and brand architect. You generate sharp, specific, opinionated business systems — not generic filler.

When given a business idea or vibe, you produce a complete business kit in structured JSON.

Rules:
- Be SPECIFIC. Not "health-conscious millennials" but "burnt-out tech workers aged 25-35 who want to get fit without giving up their lifestyle"
- Be OPINIONATED. Pick a lane. Don't hedge.
- Be PRACTICAL. Every suggestion should be actionable today.
- Content should feel native to the platform (TikTok = short punchy hooks, Newsletter = deep insights, Instagram = visual storytelling)
- Pricing should reflect real market rates
- Brand names should be memorable, modern, and available as domains (avoid generic names)
- Hooks should trigger curiosity or emotion`

const USER_PROMPT = (idea: string) => `Generate a complete business kit for this idea:

"${idea}"

First, internally expand this into: niche + audience + platform + monetisation angle.

Then output ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "brand": {
    "brandName": "string",
    "tagline": "string",
    "toneOfVoice": ["adjective1", "adjective2", "adjective3"],
    "brandDescription": "2-3 sentence brand description"
  },
  "offer": {
    "product": "what is being sold",
    "targetAudience": "specific audience description",
    "valueProposition": "clear value prop",
    "pricingSuggestion": "specific pricing with reasoning"
  },
  "content": {
    "contentIdeas": ["idea1", "idea2", "idea3", "idea4", "idea5", "idea6", "idea7", "idea8", "idea9", "idea10"],
    "examplePosts": ["full example post 1", "full example post 2", "full example post 3"],
    "viralHooks": ["hook1", "hook2", "hook3", "hook4", "hook5"]
  },
  "monetisation": {
    "primaryRevenue": "primary revenue stream with detail",
    "secondaryRevenue": "secondary revenue stream with detail",
    "funnelExplanation": "step by step funnel explanation"
  },
  "landingPage": {
    "headline": "compelling headline",
    "subheadline": "supporting subheadline",
    "benefits": ["benefit 1 with detail", "benefit 2 with detail", "benefit 3 with detail"],
    "callToAction": "CTA button text + surrounding copy"
  }
}`

export async function generateBusinessKit(idea: string): Promise<BusinessKit> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: USER_PROMPT(idea),
      },
    ],
    system: SYSTEM_PROMPT,
  })

  const text = message.content[0]
  if (text.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  return JSON.parse(text.text) as BusinessKit
}

export async function regenerateSection(
  idea: string,
  section: string,
  currentKit: BusinessKit
): Promise<Partial<BusinessKit>> {
  const sectionPrompt = `You previously generated a business kit for: "${idea}"

Here is the current kit:
${JSON.stringify(currentKit, null, 2)}

Now REGENERATE ONLY the "${section}" section. Make it different and better than before. Be bolder, more specific, more opinionated.

Output ONLY the JSON for the "${section}" section (no markdown, no explanation). Use the exact same structure as the original.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: sectionPrompt,
      },
    ],
    system: SYSTEM_PROMPT,
  })

  const text = message.content[0]
  if (text.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  const parsed = JSON.parse(text.text)
  return { [section]: parsed } as Partial<BusinessKit>
}
