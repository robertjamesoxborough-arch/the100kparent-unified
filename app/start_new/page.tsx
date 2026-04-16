'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteFooter from '../components/SiteFooter'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'

type IncomeBand = 'under-60' | '60-79' | '80-99' | '100-149' | '150-plus' | null
type PensionBand = 'under-125' | '125-plus' | null

const incomeBands: { id: IncomeBand; label: string }[] = [
  { id: 'under-60',  label: 'Under £60,000' },
  { id: '60-79',     label: '£60,000 – £79,999' },
  { id: '80-99',     label: '£80,000 – £99,999' },
  { id: '100-149',   label: '£100,000 – £149,999' },
  { id: '150-plus',  label: '£150,000 or more' },
]

export default function StartPage() {
  const [income, setIncome] = useState<IncomeBand>(null)
  const [pension, setPension] = useState<PensionBand>(null)

  const showPension = income === '100-149'
  const routeReady = income !== null && (income !== '100-149' || pension !== null)

  function getHref(): string {
    if (income === '150-plus') return '/questionnaire_new?route=over-150k'
    if (income === '100-149' && pension === '125-plus') return '/questionnaire_new?route=100k-plus-pension'
    if (income === '100-149' && pension === 'under-125') return '/guides_new?band=100-149'
    if (income === '80-99') return '/guides_new?band=80-99'
    if (income === '60-79') return '/guides_new?band=60-79'
    return 'mailto:hello@the100kparent.com?subject=Waitlist'
  }

  function getResult(): { headline: string; sub: string; price: string; cta: string; isPfa: boolean } | null {
    if (!routeReady) return null
    if (income === '150-plus' || (income === '100-149' && pension === '125-plus')) {
      return {
        headline: 'Here\'s what we recommend for you',
        sub: 'A 15-minute session with a Personal Finance Advisor, prepared specifically around your situation.',
        price: '£60',
        cta: 'Book My Session →',
        isPfa: true,
      }
    }
    if (income === 'under-60') {
      return {
        headline: 'Drop us a note',
        sub: "Our current resources are built for parents earning £60k+. Get in touch and we'll let you know when we have something for your situation.",
        price: '',
        cta: 'Get in Touch',
        isPfa: false,
      }
    }
    return {
      headline: 'Here\'s what we recommend for you',
      sub: 'A plain-English guide to the tax rules at your income level — what\'s happening, what your options are, and what to ask about.',
      price: 'From £19',
      cta: 'See My Guide →',
      isPfa: false,
    }
  }

  const result = getResult()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: SECONDARY, minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

      {/* Header */}
      <header style={{ backgroundColor: SECONDARY, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link href="/" style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', textDecoration: 'none' }}>
          THE 100K PARENT
        </Link>
      </header>

      {/* Disclaimer */}
      <div style={{ backgroundColor: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 24px', textAlign: 'center', fontSize: '12px', color: '#92400E' }}>
        Educational information only — not regulated financial advice.{' '}
        <Link href="/terms_new" style={{ color: '#92400E', fontWeight: 600 }}>Terms</Link>
        {' · '}
        <Link href="/privacy-policy_new" style={{ color: '#92400E', fontWeight: 600 }}>Privacy Policy</Link>
      </div>

      <main style={{ maxWidth: '540px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, color: SECONDARY, marginBottom: '8px' }}>
            Let&apos;s find the right option for you
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '15px', margin: 0 }}>
            Takes 30 seconds.
          </p>
        </div>

        {/* Income card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '28px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '16px' }}>
          <p style={{ fontWeight: 700, color: SECONDARY, fontSize: '16px', margin: '0 0 16px' }}>
            What is your annual salary?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {incomeBands.map(({ id, label }) => {
              const selected = income === id
              return (
                <button
                  key={id}
                  onClick={() => { setIncome(id); setPension(null) }}
                  style={{
                    padding: '13px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${selected ? PRIMARY : '#E2E8F0'}`,
                    backgroundColor: selected ? '#F0FDF4' : '#F8FAFC',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '15px', color: selected ? PRIMARY : SECONDARY }}>
                    {label}
                  </span>
                  {selected && <span style={{ color: PRIMARY, fontWeight: 900 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pension card — only for £100-149k */}
        {showPension && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '28px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: '16px' }}>
            <p style={{ fontWeight: 700, color: SECONDARY, fontSize: '16px', margin: '0 0 6px' }}>
              One more question — what is your total pension pot?
            </p>
            <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 16px' }}>
              Across all pensions combined. Approximate is fine.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'under-125' as PensionBand, label: 'Under £125,000' },
                { id: '125-plus'  as PensionBand, label: '£125,000 or more' },
              ].map(({ id, label }) => {
                const selected = pension === id
                return (
                  <button
                    key={id}
                    onClick={() => setPension(id)}
                    style={{
                      padding: '13px 16px',
                      borderRadius: '8px',
                      border: `2px solid ${selected ? PRIMARY : '#E2E8F0'}`,
                      backgroundColor: selected ? '#F0FDF4' : '#F8FAFC',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '15px', color: selected ? PRIMARY : SECONDARY }}>
                      {label}
                    </span>
                    {selected && <span style={{ color: PRIMARY, fontWeight: 900 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Result */}
        {routeReady && result && (
          <div style={{
            backgroundColor: result.isPfa ? SECONDARY : '#FFFFFF',
            borderRadius: '14px',
            padding: '28px 24px',
            border: `2px solid ${PRIMARY}`,
            boxShadow: `0 4px 16px rgba(16,185,129,0.12)`,
          }}>
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: result.isPfa ? '#FFFFFF' : SECONDARY, margin: '0 0 8px' }}>
              {result.headline}
            </h2>
            <p style={{ fontSize: '14px', color: result.isPfa ? '#94A3B8' : '#64748B', lineHeight: 1.65, margin: '0 0 20px' }}>
              {result.sub}
            </p>
            {result.price && (
              <p style={{ fontSize: '26px', fontWeight: 900, color: PRIMARY, margin: '0 0 16px' }}>
                {result.price}
              </p>
            )}
            <a
              href={getHref()}
              style={{
                display: 'block',
                textAlign: 'center',
                backgroundColor: PRIMARY,
                color: '#FFFFFF',
                padding: '14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              {result.cta}
            </a>
            <p style={{ fontSize: '11px', color: result.isPfa ? '#475569' : '#94A3B8', margin: '12px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
              Illustrative figures only. Not financial advice.{' '}
              <Link href="/terms_new" style={{ color: PRIMARY }}>Terms apply.</Link>
            </p>
          </div>
        )}

      </main>

      <SiteFooter />
    </div>
  )
}
