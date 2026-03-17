export interface BrandIdentity {
  brandName: string
  tagline: string
  toneOfVoice: [string, string, string]
  brandDescription: string
}

export interface Offer {
  product: string
  targetAudience: string
  valueProposition: string
  pricingSuggestion: string
}

export interface ContentEngine {
  contentIdeas: string[]
  examplePosts: string[]
  viralHooks: string[]
}

export interface MonetisationPlan {
  primaryRevenue: string
  secondaryRevenue: string
  funnelExplanation: string
}

export interface LandingPageCopy {
  headline: string
  subheadline: string
  benefits: [string, string, string]
  callToAction: string
}

export interface BusinessKit {
  brand: BrandIdentity
  offer: Offer
  content: ContentEngine
  monetisation: MonetisationPlan
  landingPage: LandingPageCopy
}
