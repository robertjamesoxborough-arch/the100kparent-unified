'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SiteFooter from '../components/SiteFooter'
import LegalDisclaimer from '../components/LegalDisclaimer'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'

// Replace with your actual Calendly link
const CALENDLY_URL = 'https://calendly.com/the100kparent/consultation'

type QualifyingRoute = 'over-150k' | '100k-plus-pension' | null

interface QuestionnaireData {
  name: string
  email: string
  salary: string
  pensionPot: string
  childcareCosts: string
  interests: string[]
  qualifyingRoute: QualifyingRoute
  completedAt: string
}

interface SavingsResult {
  low: number
  high: number
  breakdown: { label: string; savingLow: number; savingHigh: number }[]
}

function calculateSavings(data: QuestionnaireData): SavingsResult {
  const salary = parseFloat(data.salary) || 0
  const monthlyChildcare = parseFloat(data.childcareCosts) || 0
  const annualChildcare = monthlyChildcare * 12
  const breakdown: { label: string; savingLow: number; savingHigh: number }[] = []

  if (data.qualifyingRoute === 'over-150k') {
    // Full Personal Allowance already gone above £125,140
    // Pension contributions to bring income below £125,140 restores PA
    breakdown.push({ label: 'Personal Allowance recovery via pension', savingLow: 5028, savingHigh: 6285 })
    // Pension annual allowance tapering — above £260k adjusted income it tapers
    if (salary >= 260000) {
      breakdown.push({ label: 'Pension tapering mitigation', savingLow: 3000, savingHigh: 8000 })
    }
    // 45% rate mitigation
    breakdown.push({ label: '45% additional rate tax mitigation', savingLow: 4000, savingHigh: 12000 })
  } else if (data.qualifyingRoute === '100k-plus-pension') {
    // Can use salary sacrifice to push income below £100k — restores full £12,570 PA
    // Saving = PA × marginal rate (40% in this band)
    breakdown.push({ label: 'Personal Allowance recovery via salary sacrifice', savingLow: 4000, savingHigh: 5028 })
    // Pension recycling — draws on pension wealth, contributes efficiently
    breakdown.push({ label: 'Pension recycling strategy', savingLow: 2000, savingHigh: 6000 })
  }

  // Tax-Free Childcare — £2k/yr top-up per child on up to £10k spend
  if (annualChildcare > 0) {
    const tfc = Math.min(Math.round(annualChildcare * 0.2), 4000)
    breakdown.push({ label: 'Tax-Free Childcare top-up', savingLow: Math.round(tfc * 0.6), savingHigh: tfc })
  }

  // Salary sacrifice NI saving (employer + employee)
  if (data.qualifyingRoute === '100k-plus-pension') {
    breakdown.push({ label: 'National Insurance via salary sacrifice', savingLow: 1000, savingHigh: 3000 })
  }

  const low = breakdown.reduce((s, b) => s + b.savingLow, 0)
  const high = breakdown.reduce((s, b) => s + b.savingHigh, 0)

  return { low, high, breakdown }
}

export default function BookingPage() {
  const [data, setData] = useState<QuestionnaireData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('questionnaireComplete')
      if (raw) setData(JSON.parse(raw) as QuestionnaireData)
    } catch {
      // localStorage unavailable
    }
    setLoaded(true)
  }, [])

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ fontSize: '36px' }}>🧸</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '52px' }}>🧸</div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY }}>Complete the questionnaire first</h1>
        <p style={{ color: '#64748B', maxWidth: '380px' }}>We need a few details to personalise your booking and calculate your savings.</p>
        <Link
          href="/advisor-booking_new"
          style={{ backgroundColor: PRIMARY, color: '#FFFFFF', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '16px' }}
        >
          Start Here →
        </Link>
      </div>
    )
  }

  const { low, high, breakdown } = calculateSavings(data)
  const routeLabel = data.qualifyingRoute === 'over-150k' ? 'Earns £150k+' : 'Earns £100k+ with £125k+ pension'

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: SECONDARY, minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <header style={{
        backgroundColor: SECONDARY,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        <Link href="/" style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', textDecoration: 'none' }}>
          THE 100K PARENT
        </Link>
        <span style={{ color: PRIMARY, fontWeight: 600, fontSize: '14px' }}>Final step: pick your time</span>
      </header>

      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Personalised savings hero */}
        <div style={{
          backgroundColor: SECONDARY,
          borderRadius: '16px',
          padding: '40px 36px',
          color: '#FFFFFF',
          marginBottom: '28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎯</div>
          <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '6px' }}>
            Hi {data.name} — based on your situation ({routeLabel}), your PFA estimates:
          </p>
          <div style={{ fontSize: 'clamp(38px, 6vw, 58px)', fontWeight: 900, color: PRIMARY, lineHeight: 1.1, marginBottom: '6px' }}>
            £{low.toLocaleString()}–£{high.toLocaleString()}
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            in recoverable savings per year · subject to your full session review
          </p>
        </div>

        {/* Savings breakdown */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '28px 28px',
          marginBottom: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: SECONDARY, margin: '0 0 20px' }}>
            Where the savings come from
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {breakdown.map(({ label, savingLow, savingHigh }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: PRIMARY, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: '15px', color: '#475569' }}>{label}</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: PRIMARY }}>
                  £{savingLow.toLocaleString()}–£{savingHigh.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: SECONDARY }}>Estimated total per year</span>
            <span style={{ fontWeight: 900, fontSize: '18px', color: PRIMARY }}>
              £{low.toLocaleString()}–£{high.toLocaleString()}
            </span>
          </div>
          <div style={{ marginTop: '16px' }}>
            <LegalDisclaimer />
          </div>
        </div>

        {/* Priorities confirmed */}
        {data.interests.length > 0 && (
          <div style={{
            backgroundColor: '#F0FDF4',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '28px',
            border: `1px solid #BBF7D0`,
          }}>
            <p style={{ fontWeight: 700, color: SECONDARY, margin: '0 0 10px', fontSize: '15px' }}>
              Your PFA will focus on:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.interests.map((i) => (
                <span key={i} style={{
                  backgroundColor: '#FFFFFF',
                  border: `1.5px solid ${PRIMARY}`,
                  color: PRIMARY,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '20px',
                }}>
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Session reminder */}
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>⏱</span>
          <p style={{ fontSize: '14px', color: '#92400E', margin: 0, lineHeight: 1.55 }}>
            <strong>Your session is 15 minutes.</strong> Your PFA will have reviewed your questionnaire in advance so the full time is focused on your action plan — no introductions, no filler.
          </p>
        </div>

        {/* Calendly embed */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: SECONDARY, margin: '0 0 4px' }}>
              Choose your session time
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
              15-minute video call · All times in your local timezone · £60
            </p>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <iframe
              src={`${CALENDLY_URL}?name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}&hide_gdpr_banner=1`}
              width="100%"
              height="660"
              style={{ border: 'none', display: 'block', minHeight: '500px' }}
              title="Book your 100k Parent PFA session"
              loading="lazy"
            />
          </div>
        </div>

        {/* Trust */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {['🔒 Secure booking', '30-day money-back guarantee', 'Qualified PFA · DipPFS'].map((s) => (
            <span key={s} style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>{s}</span>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
