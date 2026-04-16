import Link from 'next/link'
import SiteFooter from '../components/SiteFooter'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'
const LAST_UPDATED = '14 April 2026'

export const metadata = {
  title: 'Privacy Policy | The 100k Parent',
  description: 'How The 100k Parent handles your personal data.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: SECONDARY, marginBottom: '10px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '12px', fontSize: '15px' }}>{children}</p>
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: SECONDARY, minHeight: '100vh' }}>
      <header style={{ backgroundColor: SECONDARY, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link href="/" style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', textDecoration: 'none' }}>
          THE 100K PARENT
        </Link>
        <Link href="/terms_new" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
      </header>

      <div style={{ backgroundColor: SECONDARY, padding: '40px 24px', textAlign: 'center', color: '#FFFFFF' }}>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, margin: '0 0 8px' }}>Privacy Policy</h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>Last updated: {LAST_UPDATED}</p>
      </div>

      <main style={{ maxWidth: '740px', margin: '0 auto', padding: '56px 24px 80px' }}>

        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '20px 24px', marginBottom: '44px', borderLeft: `4px solid ${PRIMARY}` }}>
          <P>
            We keep this short and in plain English. We collect the minimum information needed to provide our service, we don&apos;t sell it to anyone, and you can ask us to delete it at any time. The detail is below.
          </P>
        </div>

        <Section title="1. Who we are">
          <P>
            The 100k Parent is the data controller for personal data collected through this website. That means we decide how and why your data is used. If you have any questions or want to exercise any of your rights, email us at{' '}
            <a href="mailto:privacy@the100kparent.com" style={{ color: PRIMARY }}>privacy@the100kparent.com</a>.
          </P>
        </Section>

        <Section title="2. What we collect and why">
          <P>Here&apos;s exactly what we collect, and why:</P>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {[
              {
                data: 'Your name and email address',
                why: 'To set up your session booking and send you your confirmation and follow-up summary.',
                basis: 'Contract',
              },
              {
                data: 'Approximate salary, pension pot value, and monthly childcare spend',
                why: 'So your session professional can prepare relevant information before your call. These figures stay on your device (in your browser\'s local storage) and are only shared with your session professional to prepare for your session.',
                basis: 'Contract',
              },
              {
                data: 'Your areas of interest (selected from a list)',
                why: 'So your session professional can focus on what matters most to you.',
                basis: 'Contract',
              },
              {
                data: 'Your marketing preference (if you opt in)',
                why: 'To send you occasional emails about tax planning for high-earning parents. You can unsubscribe any time.',
                basis: 'Consent',
              },
            ].map(({ data, why, basis }) => (
              <div key={data} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <p style={{ fontWeight: 700, color: SECONDARY, margin: 0, fontSize: '14px' }}>{data}</p>
                  <span style={{ backgroundColor: '#F0FDF4', color: PRIMARY, fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    {basis}
                  </span>
                </div>
                <p style={{ color: '#64748B', margin: 0, fontSize: '14px', lineHeight: 1.65 }}>{why}</p>
              </div>
            ))}
          </div>

          <P>
            We don&apos;t use your data for automated decision-making or profiling, and we never use it to make decisions that affect you legally or significantly.
          </P>
        </Section>

        <Section title="3. Where your financial information is stored">
          <P>
            The financial information you give us — salary, pension pot, childcare spend — is stored in your browser&apos;s local storage only. It lives on your device, not our servers. It&apos;s shared with your session professional so they can prepare for your call, and that&apos;s it.
          </P>
          <P>
            If we change this in future — for example, if we start storing session data on our servers — we&apos;ll update this policy and tell you in advance.
          </P>
        </Section>

        <Section title="4. Who we share your data with">
          <P>We only share your data where we have to, to provide the service:</P>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            {[
              'Your session professional — they receive your questionnaire responses to prepare for your session.',
              'Our scheduling provider (Calendly) — your name and email are passed to them so you can book your session slot. They process this under their own privacy policy.',
              'Our payment provider — if you make a payment, your transaction is processed by our payment provider. We never see or store your card details.',
              'Our email platform — if you opt in to marketing, your email is stored with our email service provider.',
            ].map((item) => (
              <li key={item} style={{ color: '#475569', lineHeight: 1.75, marginBottom: '8px', fontSize: '15px' }}>{item}</li>
            ))}
          </ul>
          <P>
            <strong>We don&apos;t sell your data. Ever.</strong> We don&apos;t share it with any third party for their own marketing purposes.
          </P>
        </Section>

        <Section title="5. How long we keep it">
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            {[
              'Name and email (session bookings): 12 months after your session, then deleted.',
              'Marketing email list: until you unsubscribe — which you can do at any time via the link in any email we send.',
              'Financial data (salary, pension, childcare): stored in your browser only — cleared whenever you clear your browser data. We don\'t retain this server-side.',
              'Payment transaction records: up to 7 years, as required by HMRC accounting rules.',
            ].map((item) => (
              <li key={item} style={{ color: '#475569', lineHeight: 1.75, marginBottom: '8px', fontSize: '15px' }}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="6. Your rights">
          <P>
            Under UK GDPR, you have the right to:
          </P>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            {[
              'See the data we hold about you',
              'Ask us to correct anything that\'s wrong',
              'Ask us to delete your data',
              'Ask us to stop using it in certain ways',
              'Get a copy of your data in a portable format',
              'Object to us using your data',
              'Withdraw consent at any time (where we\'re relying on consent)',
            ].map((item) => (
              <li key={item} style={{ color: '#475569', lineHeight: 1.75, marginBottom: '6px', fontSize: '15px' }}>{item}</li>
            ))}
          </ul>
          <P>
            To exercise any of these rights, email{' '}
            <a href="mailto:privacy@the100kparent.com" style={{ color: PRIMARY }}>privacy@the100kparent.com</a>.
            We&apos;ll respond within 30 days. If you&apos;re not happy with our response, you can complain to the Information Commissioner&apos;s Office at{' '}
            <a href="https://ico.org.uk" style={{ color: PRIMARY }} target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
          </P>
        </Section>

        <Section title="7. Cookies and local storage">
          <P>
            We use browser local storage (not cookies) to hold your questionnaire responses temporarily on your device. We may use analytics tools to understand how people use the site — where we do, we&apos;ll ask for your consent first. You can clear local storage at any time through your browser settings.
          </P>
        </Section>

        <Section title="8. Changes to this policy">
          <P>
            If we make significant changes, we&apos;ll update the date at the top of this page and, where we have your email, let you know directly.
          </P>
        </Section>

        <Section title="9. Contact">
          <P>
            Privacy questions: <a href="mailto:privacy@the100kparent.com" style={{ color: PRIMARY }}>privacy@the100kparent.com</a>
            <br />
            The 100k Parent, registered in England &amp; Wales
          </P>
        </Section>

      </main>

      <SiteFooter />
    </div>
  )
}
