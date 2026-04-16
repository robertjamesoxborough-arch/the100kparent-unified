import Link from 'next/link'
import SiteFooter from '../components/SiteFooter'
import LegalDisclaimer from '../components/LegalDisclaimer'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'

const advisors = [
  {
    name: 'Sarah Mitchell',
    title: 'Personal Finance Advisor',
    speciality: 'High-income tax & pension strategy',
    sessions: '840+ sessions',
    bio: 'Chartered Financial Planner with 12 years helping £100k+ earners navigate HMRC\'s Personal Allowance trap and pension tapering rules.',
    credentials: 'DipPFS · Chartered',
  },
  {
    name: 'James Okonkwo',
    title: 'Personal Finance Advisor',
    speciality: 'Pension recycling & salary sacrifice',
    sessions: '620+ sessions',
    bio: 'Former HMRC tax inspector, now exclusively advises high earners on pension wealth strategy and income tax mitigation.',
    credentials: 'DipPFS · Ex-HMRC',
  },
  {
    name: 'Emma Hargreaves',
    title: 'Personal Finance Advisor',
    speciality: 'Family finance & childcare tax',
    sessions: '710+ sessions',
    bio: 'Specialist in the intersection of high household income, childcare costs, and pension planning — particularly for dual-income families.',
    credentials: 'DipPFS · ACSI',
  },
]

export default function AdvisorBookingPage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: SECONDARY, minHeight: '100vh' }}>
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
        <span style={{ color: '#64748B', fontSize: '14px' }}>Book a Session</span>
      </header>

      {/* Hero */}
      <section style={{ backgroundColor: SECONDARY, padding: '64px 24px', textAlign: 'center', color: '#FFFFFF' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <p style={{ color: PRIMARY, fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
            One Session · One Price
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, marginBottom: '20px', lineHeight: 1.15 }}>
            A 15-minute call with a<br />
            <span style={{ color: PRIMARY }}>Personal Finance Advisor</span>
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '17px', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.65 }}>
            Designed for parents earning £150k+, or £100k+ with a pension over £125k. Your PFA will identify exactly how much you&apos;re losing — and how to stop it.
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '8px',
            backgroundColor: 'rgba(16,185,129,0.15)',
            border: `1px solid ${PRIMARY}`,
            borderRadius: '12px',
            padding: '12px 28px',
          }}>
            <span style={{ fontSize: '48px', fontWeight: 900, color: PRIMARY }}>£60</span>
            <span style={{ color: '#94A3B8', fontSize: '16px' }}>flat fee · no hidden charges</span>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <LegalDisclaimer variant="banner" />

      {/* What you get */}
      <section style={{ padding: '64px 24px', backgroundColor: '#F8FAFC' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, textAlign: 'center', marginBottom: '16px', color: SECONDARY }}>
            What happens in your 15 minutes
          </h2>
          <p style={{ color: '#64748B', textAlign: 'center', fontSize: '16px', marginBottom: '48px', maxWidth: '520px', margin: '0 auto 48px' }}>
            Your PFA reviews your questionnaire answers before the call so every minute counts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '48px' }}>
            {[
              { icon: '🔍', title: 'Tax gap analysis', body: 'Your advisor calculates the exact gap between what you\'re paying now and the legal minimum.' },
              { icon: '💡', title: 'Savings breakdown', body: 'Line-by-line identification of Personal Allowance recovery, pension strategy, and childcare wins.' },
              { icon: '📋', title: 'Action plan', body: 'You leave with a written priority list — what to do first, second, and third to capture the savings.' },
              { icon: '📧', title: 'Follow-up email', body: 'A summary of your session with key figures and next steps sent within 24 hours.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '28px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: SECONDARY, margin: '0 0 8px' }}>{title}</h3>
                <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>

          {/* The offer card */}
          <div style={{
            backgroundColor: SECONDARY,
            borderRadius: '16px',
            padding: '44px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '36px',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ color: PRIMARY, fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                The Session
              </p>
              <h2 style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 900, margin: '0 0 16px' }}>
                15-Minute PFA Session
              </h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '52px', fontWeight: 900, color: PRIMARY }}>£60</span>
                <span style={{ color: '#64748B', fontSize: '16px' }}>one-time</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  '1-on-1 with a qualified Personal Finance Advisor',
                  '15-minute focused video session',
                  'Pre-call review of your questionnaire',
                  'Written action plan included',
                  '24-hour follow-up email',
                  '30-day satisfaction guarantee',
                ].map((f) => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: '#CBD5E1' }}>
                    <span style={{ color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: `1px solid rgba(16,185,129,0.3)`, borderRadius: '10px', padding: '16px 20px' }}>
                <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 4px' }}>This session is designed for:</p>
                <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px', margin: 0 }}>£150,000+ per annum</p>
              </div>
              <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: `1px solid rgba(16,185,129,0.3)`, borderRadius: '10px', padding: '16px 20px' }}>
                <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0 0 4px' }}>Or:</p>
                <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px', margin: 0 }}>£100k+ salary · £125k+ pension</p>
              </div>
              <Link
                href="/questionnaire_new"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: PRIMARY,
                  color: '#FFFFFF',
                  padding: '16px 24px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '17px',
                  marginTop: '4px',
                }}
              >
                Book Now — £60 →
              </Link>
              <p style={{ textAlign: 'center', color: '#475569', fontSize: '13px', margin: 0 }}>
                Secure payment · 30-day guarantee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advisor showcase */}
      <section style={{ padding: '72px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p style={{ color: PRIMARY, fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>
            Your Advisors
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: SECONDARY }}>
            Qualified Personal Finance Advisors
          </h2>
          <p style={{ color: '#64748B', textAlign: 'center', fontSize: '16px', marginBottom: '48px' }}>
            Every session is with a DipPFS-qualified PFA specialising in high-income family finance.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {advisors.map((advisor) => (
              <div key={advisor.name} style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                padding: '32px 26px',
                borderTop: `4px solid ${PRIMARY}`,
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: PRIMARY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 800,
                  marginBottom: '14px',
                }}>
                  {advisor.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: SECONDARY, margin: '0 0 2px' }}>{advisor.name}</h3>
                <p style={{ fontSize: '14px', color: PRIMARY, fontWeight: 700, margin: '0 0 2px' }}>{advisor.title}</p>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>{advisor.credentials} · {advisor.sessions}</p>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px', fontStyle: 'italic' }}>{advisor.speciality}</p>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{advisor.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI callout */}
      <section style={{ backgroundColor: '#F0FDF4', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <p style={{ fontSize: '15px', color: '#64748B', marginBottom: '12px' }}>Consider the maths:</p>
          <p style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 800, color: SECONDARY, lineHeight: 1.5, marginBottom: '24px' }}>
            £60 session fee vs{' '}
            <span style={{ color: PRIMARY }}>£15,000–£30,000</span>{' '}
            in annual savings identified.
          </p>
          <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '32px' }}>
            That&apos;s a potential 500× return. On a 15-minute call.
          </p>
          <Link
            href="/questionnaire_new"
            style={{
              display: 'inline-block',
              backgroundColor: PRIMARY,
              color: '#FFFFFF',
              padding: '14px 36px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            Book Your Session — £60 →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
