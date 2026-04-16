'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteFooter from '../components/SiteFooter'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'

interface Guide {
  id: string
  band: string
  bandLabel: string
  title: string
  subtitle: string
  price: number
  highlights: string[]
  pages: string
  badge?: string
}

const guides: Guide[] = [
  {
    id: 'guide-60-79',
    band: '60-79',
    bandLabel: '£60,000 – £79,999',
    title: 'The High Income Child Benefit Guide',
    subtitle: 'Understanding and managing the Child Benefit High Income Tax Charge',
    price: 19,
    highlights: [
      'How the High Income Tax Charge works and when it applies',
      'Salary sacrifice — what it is, how it works in general terms',
      'Pension contributions and their general tax treatment',
      'Questions to ask your employer about available schemes',
      'How to think about your household income position',
    ],
    pages: '28 pages',
  },
  {
    id: 'guide-80-99',
    band: '80-99',
    bandLabel: '£80,000 – £99,999',
    title: 'The £100k Cliff Preparation Guide',
    subtitle: 'What to understand before your income crosses £100,000',
    price: 24,
    highlights: [
      'How the Personal Allowance taper works (£100k–£125,140)',
      'The effective 60% marginal rate — explained clearly',
      'Pension contribution basics and salary sacrifice concepts',
      'Tax-Free Childcare — eligibility and general overview',
      'Questions to discuss with an FCA-regulated adviser',
    ],
    pages: '34 pages',
    badge: 'Most popular',
  },
  {
    id: 'guide-100-149',
    band: '100-149',
    bandLabel: '£100,000 – £149,999',
    title: 'The Personal Allowance Recovery Guide',
    subtitle: 'Understanding your options when you\'re in the taper zone',
    price: 29,
    highlights: [
      'The Personal Allowance taper — a detailed walkthrough',
      'How pension contributions interact with the taper in general terms',
      'Salary sacrifice concepts and typical employer scheme structures',
      'Tax-Free Childcare — eligibility rules and how to claim',
      'Key questions to bring to an FCA-regulated financial adviser',
    ],
    pages: '42 pages',
  },
  {
    id: 'bundle',
    band: 'bundle',
    bandLabel: 'All income bands',
    title: 'Complete High-Earner Parent Bundle',
    subtitle: 'All three guides — ideal if your income is changing or you want the full picture',
    price: 49,
    highlights: [
      'All three guides included',
      'Covers £60k through to £149,999',
      'Useful for households with variable or growing income',
      'Single download, all formats included',
    ],
    pages: '104 pages total',
    badge: 'Best value',
  },
]

function GuidesContent() {
  const searchParams = useSearchParams()
  const recommendedBand = searchParams.get('band')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: SECONDARY, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ backgroundColor: SECONDARY, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link href="/" style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', textDecoration: 'none' }}>
          THE 100K PARENT
        </Link>
        <Link href="/start_new" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none' }}>← Find your path</Link>
      </header>

      {/* Disclaimer banner */}
      <div style={{ backgroundColor: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '10px 24px', textAlign: 'center', fontSize: '12px', color: '#92400E', lineHeight: 1.55 }}>
        <strong>Important:</strong> These guides contain general educational information only — not regulated financial advice. Figures and examples are illustrative. Always seek independent advice from an FCA-authorised adviser before making financial decisions.{' '}
        <Link href="/terms_new" style={{ color: '#92400E', fontWeight: 600 }}>Terms</Link>
        {' · '}
        <Link href="/privacy-policy_new" style={{ color: '#92400E', fontWeight: 600 }}>Privacy Policy</Link>
      </div>

      {/* Hero */}
      <section style={{ backgroundColor: SECONDARY, padding: '56px 24px', textAlign: 'center', color: '#FFFFFF' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto' }}>
          {recommendedBand && (
            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(16,185,129,0.15)',
              border: `1px solid ${PRIMARY}`,
              color: PRIMARY,
              fontSize: '13px',
              fontWeight: 700,
              padding: '5px 14px',
              borderRadius: '20px',
              marginBottom: '16px',
              letterSpacing: '0.05em',
            }}>
              ✓ We&apos;ve highlighted the guide for your income band
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, marginBottom: '14px' }}>
            Tax guides for high-earning parents
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '16px', lineHeight: 1.65, marginBottom: 0 }}>
            Plain-English explanations of the tax rules that affect you most. Written for parents earning £60k–£150k who want to understand their options before speaking to a regulated adviser.
          </p>
        </div>
      </section>

      {/* What these guides are — and aren't */}
      <div style={{ backgroundColor: '#F0FDF4', borderBottom: '1px solid #BBF7D0', padding: '16px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <p style={{ fontWeight: 700, color: SECONDARY, fontSize: '13px', margin: '0 0 4px' }}>✓ What our guides are</p>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Plain-English educational information about tax rules. General explanations of strategies and how they typically work.</p>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#DC2626', fontSize: '13px', margin: '0 0 4px' }}>✗ What our guides are not</p>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Regulated financial advice. Personal recommendations. Guarantees of any specific outcome. A substitute for an FCA-authorised adviser.</p>
          </div>
        </div>
      </div>

      {/* Guides grid */}
      <section style={{ padding: '60px 24px', backgroundColor: '#F8FAFC' }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}>
          {guides.map((guide) => {
            const isRecommended = recommendedBand === guide.band
            return (
              <div
                key={guide.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '32px 28px',
                  boxShadow: isRecommended
                    ? `0 0 0 2px ${PRIMARY}, 0 6px 20px rgba(16,185,129,0.12)`
                    : '0 1px 4px rgba(0,0,0,0.08)',
                  position: 'relative',
                  borderTop: `4px solid ${isRecommended ? PRIMARY : '#E2E8F0'}`,
                }}
              >
                {(isRecommended || guide.badge) && (
                  <div style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '24px',
                    backgroundColor: isRecommended ? PRIMARY : SECONDARY,
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: '20px',
                    letterSpacing: '0.06em',
                  }}>
                    {isRecommended ? '⭐ RECOMMENDED FOR YOU' : guide.badge?.toUpperCase()}
                  </div>
                )}

                <p style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {guide.bandLabel}
                </p>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: SECONDARY, margin: '0 0 6px', lineHeight: 1.25 }}>
                  {guide.title}
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 20px', lineHeight: 1.55 }}>
                  {guide.subtitle}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 900, color: PRIMARY }}>£{guide.price}</span>
                  <span style={{ color: '#94A3B8', fontSize: '14px' }}>· {guide.pages} · PDF</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {guide.highlights.map((h) => (
                    <li key={h} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#475569' }}>
                      <span style={{ color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {h}
                    </li>
                  ))}
                </ul>

                <button
                  style={{
                    width: '100%',
                    backgroundColor: isRecommended ? PRIMARY : SECONDARY,
                    color: '#FFFFFF',
                    padding: '13px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  Get Guide — £{guide.price}
                </button>

                <p style={{ fontSize: '11px', color: '#94A3B8', margin: '10px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
                  General educational information only. Not financial advice.{' '}
                  <Link href="/terms_new" style={{ color: PRIMARY }}>Terms apply.</Link>
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* PFA upsell */}
      <section style={{ backgroundColor: SECONDARY, padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <p style={{ color: PRIMARY, fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Earning £150k+, or £100k+ with a £125k+ pension?
          </p>
          <h2 style={{ color: '#FFFFFF', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 800, marginBottom: '12px' }}>
            A PFA session might be the better fit
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '28px', lineHeight: 1.65 }}>
            A 15-minute 1-on-1 session with a Personal Finance Advisor goes further than a guide for those situations. Illustrative estimates suggest clients in those situations can identify £15,000–£30,000 in savings opportunities — actual outcomes depend entirely on individual circumstances.
          </p>
          <Link
            href="/start_new"
            style={{
              display: 'inline-block',
              backgroundColor: PRIMARY,
              color: '#FFFFFF',
              padding: '13px 32px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            Find Your Option →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

export default function GuidesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ fontSize: '36px' }}>📘</div>
      </div>
    }>
      <GuidesContent />
    </Suspense>
  )
}
