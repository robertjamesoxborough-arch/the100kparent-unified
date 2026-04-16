import Link from 'next/link'
import SiteFooter from '../components/SiteFooter'
import LegalDisclaimer from '../components/LegalDisclaimer'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: SECONDARY, minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* Header */}
      <header style={{
        backgroundColor: SECONDARY,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '20px', letterSpacing: '0.05em' }}>
          THE 100K PARENT
        </span>
        <Link
          href="/advisor-booking_new"
          style={{
            backgroundColor: PRIMARY,
            color: '#FFFFFF',
            padding: '8px 20px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          Get Started
        </Link>
      </header>

      {/* Hero */}
      <section style={{ backgroundColor: SECONDARY, color: '#FFFFFF', padding: '88px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(16,185,129,0.15)',
            border: `1px solid ${PRIMARY}`,
            color: PRIMARY,
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '6px 16px',
            borderRadius: '20px',
            marginBottom: '24px',
          }}>
            For High-Earning Parents
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, lineHeight: 1.12, marginBottom: '24px' }}>
            Earn £60k+?<br />
            You&apos;re Losing Money<br />
            <span style={{ color: PRIMARY }}>You Don&apos;t Have To.</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#94A3B8', lineHeight: 1.65, maxWidth: '600px', margin: '0 auto 16px' }}>
            HMRC&apos;s income traps quietly drain high-earning parents at every level. We have a solution for your specific situation — whether that&apos;s a 15-minute session with a Personal Finance Advisor or one of our plain-English tax guides.
          </p>
          <p style={{ fontSize: '15px', color: '#64748B', marginBottom: '40px' }}>
            PFA sessions · Tax guides · For parents earning £60k and above
          </p>
          <Link
            href="/start_new"
            style={{
              display: 'inline-block',
              backgroundColor: PRIMARY,
              color: '#FFFFFF',
              padding: '18px 44px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '18px',
            }}
          >
            Find What You&apos;re Missing →
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <div style={{ backgroundColor: PRIMARY, padding: '14px 24px', textAlign: 'center', color: '#FFFFFF', fontWeight: 600, fontSize: '15px' }}>
        For parents earning £60k+ · PFA sessions · Tax guides · Something for every situation
      </div>

      {/* Disclaimer banner */}
      <LegalDisclaimer variant="banner" />

      {/* Who this is for */}
      <section style={{ padding: '80px 24px', backgroundColor: '#F8FAFC' }}>
        <div style={{ maxWidth: '920px', margin: '0 auto' }}>
          <p style={{ color: PRIMARY, fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>
            What We Do
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, textAlign: 'center', marginBottom: '16px', color: SECONDARY }}>
            The right help for your situation
          </h2>
          <p style={{ color: '#64748B', textAlign: 'center', fontSize: '16px', maxWidth: '560px', margin: '0 auto 52px' }}>
            Different income levels create different tax problems. We have something specific for each one.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {/* Card 1 — Guides */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '40px 32px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderTop: `4px solid ${PRIMARY}`,
            }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📘</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY, margin: '0 0 12px' }}>
                You earn £60,000 – £149,999
              </h3>
              <p style={{ color: '#64748B', lineHeight: 1.65, marginBottom: '24px', fontSize: '15px' }}>
                Child Benefit clawbacks, the Personal Allowance taper, salary sacrifice gaps — our plain-English guides explain what&apos;s happening and what your options are. From £19.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Child Benefit High Income Tax Charge',
                  'The £100k Personal Allowance cliff',
                  'Salary sacrifice — how it works',
                  'Tax-Free Childcare overview',
                ].map((f) => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: SECONDARY }}>
                    <span style={{ color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/guides_new"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '28px',
                  backgroundColor: '#F0FDF4',
                  color: PRIMARY,
                  border: `2px solid ${PRIMARY}`,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '15px',
                }}
              >
                See the Guides →
              </Link>
            </div>

            {/* Card 2 — PFA £150k */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '40px 32px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderTop: `4px solid ${PRIMARY}`,
            }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>💼</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY, margin: '0 0 12px' }}>
                You earn £150,000+
              </h3>
              <p style={{ color: '#64748B', lineHeight: 1.65, marginBottom: '24px', fontSize: '15px' }}>
                You&apos;ve lost your entire Personal Allowance and you&apos;re paying 45% on everything above £125,140. A 15-minute PFA session identifies how much you can legally recover — illustrative estimates suggest £20k–£30k per year.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Full Personal Allowance recovery',
                  'Pension annual allowance tapering review',
                  '45% tax mitigation strategy',
                  'Childcare cost optimisation',
                ].map((f) => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: SECONDARY }}>
                    <span style={{ color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tier 2 */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '40px 32px',
              boxShadow: `0 0 0 2px ${PRIMARY}, 0 4px 20px rgba(16,185,129,0.15)`,
              borderTop: `4px solid ${PRIMARY}`,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '32px',
                backgroundColor: PRIMARY,
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '20px',
                letterSpacing: '0.06em',
              }}>
                HIGH OPPORTUNITY
              </div>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🏦</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: SECONDARY, margin: '0 0 12px' }}>
                You earn £100k+ and have a £125k+ pension
              </h3>
              <p style={{ color: '#64748B', lineHeight: 1.65, marginBottom: '24px', fontSize: '15px' }}>
                The combination of your salary and pension wealth creates unique opportunities. Strategic salary sacrifice can recover your Personal Allowance <em>and</em> accelerate tax-free pension growth simultaneously.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Personal Allowance recovery via salary sacrifice',
                  'Pension recycling strategy',
                  'Tax-free growth acceleration',
                  'Child Benefit & childcare optimisation',
                ].map((f) => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: SECONDARY }}>
                    <span style={{ color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '44px' }}>
            <Link
              href="/advisor-booking_new"
              style={{
                display: 'inline-block',
                backgroundColor: SECONDARY,
                color: '#FFFFFF',
                padding: '14px 36px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              Book Your £60 Session →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          <p style={{ color: PRIMARY, fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>
            How It Works
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, textAlign: 'center', marginBottom: '52px', color: SECONDARY }}>
            Three steps. Fifteen minutes. Real savings.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '28px' }}>
            {[
              { step: '01', title: 'Tell us your situation', body: 'Answer two quick questions about your income. We\'ll point you to the right option — a PFA session or one of our guides.' },
              { step: '02', 'title': 'Tell us your situation', body: 'A short questionnaire so your Personal Finance Advisor can prepare your personalised analysis before the call.' },
              { step: '03', title: '15 minutes. Life-changing savings.', body: 'A focused 15-minute video call with your PFA. You leave with a specific action plan — average identified saving: £15k–£30k/yr.' },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '32px 26px', borderLeft: `4px solid ${PRIMARY}` }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: PRIMARY, letterSpacing: '0.1em' }}>STEP {step}</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '10px 0 10px', color: SECONDARY }}>{title}</h3>
                <p style={{ color: '#64748B', lineHeight: 1.65, margin: 0, fontSize: '15px' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '72px 24px', backgroundColor: SECONDARY }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, marginBottom: '48px' }}>
            The numbers speak for themselves
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
            {[
              { stat: '£60', label: 'Flat fee, no surprises' },
              { stat: '15 min', label: 'Focused PFA session' },
              { stat: '£30k+', label: 'Average annual saving identified' },
              { stat: '500×', label: 'Typical ROI on session cost' },
            ].map(({ stat, label }) => (
              <div key={label} style={{ padding: '28px 20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: '32px', fontWeight: 900, color: PRIMARY, margin: '0 0 8px' }}>{stat}</p>
                <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: '#F0FDF4', padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, color: SECONDARY, marginBottom: '12px' }}>
          Ready to stop the leak?
        </h2>
        <p style={{ color: '#64748B', fontSize: '17px', marginBottom: '36px' }}>
          PFA sessions from £60 · Tax guides from £19 · For parents earning £60k+
        </p>
        <Link
          href="/start_new"
          style={{
            display: 'inline-block',
            backgroundColor: PRIMARY,
            color: '#FFFFFF',
            padding: '16px 44px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          Find What You&apos;re Missing →
        </Link>
      </section>

      <SiteFooter />
    </div>
  )
}
