'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'

type QualifyingRoute = 'over-150k' | '100k-plus-pension' | null

interface FormData {
  name: string
  email: string
  salary: string
  pensionPot: string
  childcareCosts: string
  interests: string[]
}

interface FormErrors {
  name?: string
  email?: string
  salary?: string
  pensionPot?: string
  childcareCosts?: string
  interests?: string
  consent?: string
}

const INTEREST_OPTIONS = [
  'Recovering my Personal Allowance',
  'Reducing 45% additional rate tax',
  'Pension annual allowance tapering',
  'Salary sacrifice strategy',
  'Pension recycling opportunities',
  'Tax-Free Childcare',
  'Child Benefit optimisation',
  'ISA & investment strategy',
]

function QuestionnaireContent() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [qualifyingRoute, setQualifyingRoute] = useState<QualifyingRoute>(null)
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    salary: '',
    pensionPot: '',
    childcareCosts: '',
    interests: [],
  })
  const [errors, setErrors] = useState<FormErrors>({})

  function updateField(field: keyof Omit<FormData, 'interests'>, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function toggleInterest(interest: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
    setErrors((prev) => ({ ...prev, interests: undefined }))
  }

  function validateStep2(): boolean {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = 'Please enter your name'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email'
    if (!consentTerms) e.consent = 'You must agree to the Terms & Conditions and Privacy Policy to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep3(): boolean {
    const e: FormErrors = {}
    if (!form.salary.trim()) e.salary = 'Please enter your salary'
    if (qualifyingRoute === '100k-plus-pension' && !form.pensionPot.trim()) {
      e.pensionPot = 'Please enter your pension pot value'
    }
    if (!form.childcareCosts.trim()) e.childcareCosts = 'Please enter your monthly childcare spend (enter 0 if none)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep4(): boolean {
    const e: FormErrors = {}
    if (form.interests.length === 0) e.interests = 'Please select at least one area'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validateStep4()) return
    const payload = {
      ...form,
      qualifyingRoute,
      consentTerms,
      consentMarketing,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem('questionnaireComplete', JSON.stringify(payload))
    router.push('/booking_new')
  }

  const totalSteps = 4
  const progressPct = (step / totalSteps) * 100

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
        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em' }}>
          THE 100K PARENT
        </span>
        <span style={{ color: '#64748B', fontSize: '13px' }}>Step {step} of {totalSteps}</span>
      </header>

      {/* Disclaimer banner */}
      <div style={{ backgroundColor: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 24px', textAlign: 'center', fontSize: '12px', color: '#92400E' }}>
        Educational information only — not regulated financial advice.{' '}
        <Link href="/terms_new" style={{ color: '#92400E', fontWeight: 600 }}>Terms</Link>
        {' · '}
        <Link href="/privacy-policy_new" style={{ color: '#92400E', fontWeight: 600 }}>Privacy Policy</Link>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', backgroundColor: '#E2E8F0' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: PRIMARY, transition: 'width 0.3s ease' }} />
      </div>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Guide */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '6px' }}>🧸</div>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Your pre-session questionnaire</p>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '36px 32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>

          {/* ── STEP 1: Qualifier ── */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY, margin: '0 0 8px' }}>
                Which of these describes your situation?
              </h1>
              <p style={{ color: '#64748B', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6 }}>
                Select the one that best describes you so we can make the most of your session.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                {[
                  {
                    id: 'over-150k' as QualifyingRoute,
                    title: 'I earn £150,000+ per year',
                    detail: 'You\'ve lost your full Personal Allowance and may be affected by pension annual allowance tapering.',
                  },
                  {
                    id: '100k-plus-pension' as QualifyingRoute,
                    title: 'I earn £100k+ and have a £125k+ pension',
                    detail: 'Your salary and pension combination creates powerful salary sacrifice and recycling opportunities.',
                  },
                ].map(({ id, title, detail }) => {
                  const selected = qualifyingRoute === id
                  return (
                    <button
                      key={id}
                      onClick={() => setQualifyingRoute(id)}
                      style={{
                        padding: '20px 20px',
                        borderRadius: '10px',
                        border: `2px solid ${selected ? PRIMARY : '#CBD5E1'}`,
                        backgroundColor: selected ? '#F0FDF4' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${selected ? PRIMARY : '#CBD5E1'}`,
                          backgroundColor: selected ? PRIMARY : 'transparent',
                          flexShrink: 0,
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {selected && <span style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: 900 }}>✓</span>}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '16px', color: SECONDARY, margin: '0 0 4px' }}>{title}</p>
                          <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>{detail}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Not qualifying path */}
              {qualifyingRoute === null && (
                <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginBottom: '20px' }}>
                  Select the option that applies to you to continue.
                </p>
              )}

              <button
                onClick={() => qualifyingRoute && setStep(2)}
                disabled={!qualifyingRoute}
                style={{
                  width: '100%',
                  backgroundColor: qualifyingRoute ? PRIMARY : '#E2E8F0',
                  color: qualifyingRoute ? '#FFFFFF' : '#94A3B8',
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: qualifyingRoute ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                Continue →
              </button>

              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#94A3B8' }}>
                Not sure which applies?{' '}
                <a href="/start_new" style={{ color: PRIMARY, textDecoration: 'none', fontWeight: 600 }}>
                  Find your option →
                </a>
              </p>
            </>
          )}

          {/* ── STEP 2: Name & Email ── */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY, margin: '0 0 8px' }}>
                Nice to meet you
              </h1>
              <p style={{ color: '#64748B', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6 }}>
                Your advisor will use this to personalise your session and send your follow-up email.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: SECONDARY }}>
                  Your full name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${errors.name ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.name && <p style={{ color: '#EF4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.name}</p>}
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: SECONDARY }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="e.g. alex@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${errors.email ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.email && <p style={{ color: '#EF4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.email}</p>}
              </div>

              {/* GDPR consent */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consentTerms}
                    onChange={(e) => {
                      setConsentTerms(e.target.checked)
                      if (e.target.checked) setErrors((prev) => ({ ...prev, consent: undefined }))
                    }}
                    style={{ marginTop: '3px', flexShrink: 0, width: '16px', height: '16px', accentColor: PRIMARY }}
                  />
                  <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    <strong>Required:</strong> I have read and agree to the{' '}
                    <Link href="/terms_new" target="_blank" style={{ color: PRIMARY, fontWeight: 600 }}>Terms &amp; Conditions</Link>
                    {' '}and{' '}
                    <Link href="/privacy-policy_new" target="_blank" style={{ color: PRIMARY, fontWeight: 600 }}>Privacy Policy</Link>
                    , including the processing of my personal data to facilitate my session booking. I understand this service provides educational information only and is not regulated financial advice.
                  </span>
                </label>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consentMarketing}
                    onChange={(e) => setConsentMarketing(e.target.checked)}
                    style={{ marginTop: '3px', flexShrink: 0, width: '16px', height: '16px', accentColor: PRIMARY }}
                  />
                  <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    <strong>Optional:</strong> I&apos;d like to receive occasional emails about tax planning for high-earning parents. I can unsubscribe at any time.
                  </span>
                </label>
                {errors.consent && (
                  <p style={{ color: '#EF4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.consent}</p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ backgroundColor: '#F1F5F9', color: SECONDARY, padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => validateStep2() && setStep(3)}
                  style={{ backgroundColor: PRIMARY, color: '#FFFFFF', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Financial details ── */}
          {step === 3 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY, margin: '0 0 8px' }}>
                Your financial picture
              </h1>
              <p style={{ color: '#64748B', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6 }}>
                Approximate figures are fine. This lets your PFA calculate your potential savings before the call.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: SECONDARY }}>
                  Annual gross salary (£)
                </label>
                <input
                  type="number"
                  value={form.salary}
                  onChange={(e) => updateField('salary', e.target.value)}
                  placeholder={qualifyingRoute === 'over-150k' ? 'e.g. 160000' : 'e.g. 110000'}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${errors.salary ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.salary && <p style={{ color: '#EF4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.salary}</p>}
              </div>

              {qualifyingRoute === '100k-plus-pension' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: SECONDARY }}>
                    Total pension pot value (£)
                  </label>
                  <input
                    type="number"
                    value={form.pensionPot}
                    onChange={(e) => updateField('pensionPot', e.target.value)}
                    placeholder="e.g. 180000"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${errors.pensionPot ? '#EF4444' : '#CBD5E1'}`,
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.pensionPot && <p style={{ color: '#EF4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.pensionPot}</p>}
                </div>
              )}

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: SECONDARY }}>
                  Monthly childcare spend (£) — enter 0 if none
                </label>
                <input
                  type="number"
                  value={form.childcareCosts}
                  onChange={(e) => updateField('childcareCosts', e.target.value)}
                  placeholder="e.g. 2200"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${errors.childcareCosts ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.childcareCosts && <p style={{ color: '#EF4444', fontSize: '13px', margin: '4px 0 0' }}>{errors.childcareCosts}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ backgroundColor: '#F1F5F9', color: SECONDARY, padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => validateStep3() && setStep(4)}
                  style={{ backgroundColor: PRIMARY, color: '#FFFFFF', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 4: Priorities ── */}
          {step === 4 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY, margin: '0 0 8px' }}>
                What&apos;s your top priority?
              </h1>
              <p style={{ color: '#64748B', fontSize: '15px', margin: '0 0 24px', lineHeight: 1.6 }}>
                Select everything that matters. Your PFA will lead with these in your 15-minute call.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '10px',
                marginBottom: '28px',
              }}>
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = form.interests.includes(interest)
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: `2px solid ${selected ? PRIMARY : '#CBD5E1'}`,
                        backgroundColor: selected ? '#F0FDF4' : '#FFFFFF',
                        color: selected ? PRIMARY : '#475569',
                        fontWeight: selected ? 700 : 500,
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selected ? '✓ ' : ''}{interest}
                    </button>
                  )
                })}
              </div>

              {errors.interests && (
                <p style={{ color: '#EF4444', fontSize: '13px', margin: '-16px 0 16px' }}>{errors.interests}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setStep(3)}
                  style={{ backgroundColor: '#F1F5F9', color: SECONDARY, padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  style={{ backgroundColor: PRIMARY, color: '#FFFFFF', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
                >
                  Book My Session →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Trust signals */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
          {['🔒 Secure & private', '30-day guarantee', '£60 · 15 min call'].map((s) => (
            <span key={s} style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>{s}</span>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ fontSize: '40px' }}>🧸</div>
      </div>
    }>
      <QuestionnaireContent />
    </Suspense>
  )
}
