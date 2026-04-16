import Link from 'next/link'
import SiteFooter from '../components/SiteFooter'

const PRIMARY = '#10B981'
const SECONDARY = '#0F172A'
const LAST_UPDATED = '14 April 2026'

export const metadata = {
  title: 'Terms & Conditions | The 100k Parent',
  description: 'Terms and conditions for The 100k Parent.',
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

export default function TermsPage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: SECONDARY, minHeight: '100vh' }}>
      <header style={{ backgroundColor: SECONDARY, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link href="/" style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', textDecoration: 'none' }}>
          THE 100K PARENT
        </Link>
        <Link href="/privacy-policy_new" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none' }}>Privacy Policy</Link>
      </header>

      <div style={{ backgroundColor: SECONDARY, padding: '40px 24px', textAlign: 'center', color: '#FFFFFF' }}>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, margin: '0 0 8px' }}>Terms &amp; Conditions</h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>Last updated: {LAST_UPDATED}</p>
      </div>

      <main style={{ maxWidth: '740px', margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* The big one — right at the top, plain English */}
        <div style={{
          backgroundColor: '#F0FDF4',
          border: `2px solid ${PRIMARY}`,
          borderRadius: '10px',
          padding: '24px 28px',
          marginBottom: '44px',
        }}>
          <p style={{ fontWeight: 700, color: SECONDARY, fontSize: '16px', margin: '0 0 10px' }}>
            The most important thing to understand
          </p>
          <p style={{ color: '#475569', lineHeight: 1.75, margin: '0 0 10px', fontSize: '15px' }}>
            The 100k Parent is an educational information website. The information, guides, and sessions provided through this site are for general educational purposes only. <strong>Nothing on this site is financial advice.</strong> We are not authorised or regulated by the Financial Conduct Authority (FCA).
          </p>
          <p style={{ color: '#475569', lineHeight: 1.75, margin: 0, fontSize: '15px' }}>
            The information on our site shouldn&apos;t be taken as any advice, representation, or arrangement by us. You&apos;re responsible for making — or refraining from making — any financial or investment decisions, and we&apos;re not liable for anything that happens as a result of you relying on the information here. Because the effect of any information can vary based on your individual circumstances, you should always carry out your own research and seek independent regulated advice before making financial decisions.
          </p>
        </div>

        <Section title="1. Who we are">
          <P>
            The 100k Parent (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an educational information service for high-earning parents in the UK. We are registered in England and Wales. References to &ldquo;you&rdquo; mean the person using this site.
          </P>
          <P>
            By using this site or purchasing any product, you confirm you have read and agree to these terms. If you don&apos;t agree, please don&apos;t use the site.
          </P>
        </Section>

        <Section title="2. What we provide">
          <P>
            We provide educational guides, information tools, and access to information sessions with financial professionals. Everything we provide is for general informational and educational purposes only.
          </P>
          <P>
            Our information sessions are 15-minute educational conversations with experienced financial professionals. These sessions give you <strong>information and general context</strong> about tax rules that may be relevant to your situation. They are not regulated financial advice, personal recommendations, or tax advice. The professionals who conduct sessions are providing educational information only — they are not acting as your financial adviser.
          </P>
          <P>
            Any figures or estimates we show you — whether on the website or during a session — are illustrative examples based on publicly available tax rules and the general information you provide. They are not projections, guarantees, or personalised calculations. Your actual position will depend on your individual circumstances and the tax rules in force at the relevant time.
          </P>
        </Section>

        <Section title="3. Regulatory disclosure">
          <P>
            The 100k Parent is not authorised or regulated by the Financial Conduct Authority. We do not provide regulated financial advice, investment advice, or tax advice.
          </P>
          <P>
            Any financial promotions on this site have been approved for the purposes of section 21 of the Financial Services and Markets Act 2000 by [Approving FCA Firm Name], which is authorised and regulated by the Financial Conduct Authority (FRN: [000000]).
          </P>
          <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.75, marginBottom: '12px' }}>
            Note: The bracketed text above must be completed with the details of your Section 21 approver before this site goes live.
          </p>
        </Section>

        <Section title="4. Paying for our products">
          <P>
            <strong>Information sessions: £60.</strong> This is a one-time fee for a 15-minute educational information session as described in section 2. Guide prices are shown on the guides page at the time of purchase. All prices include VAT where applicable and are in pounds sterling.
          </P>
          <P>
            Payment is handled securely by our payment provider. We never store your card details.
          </P>
        </Section>

        <Section title="5. Your right to cancel">
          <P>
            <strong>Information sessions:</strong> You have the right to cancel your session booking within 14 days of purchase under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, provided the session has not yet taken place. To cancel, email{' '}
            <a href="mailto:support@the100kparent.com" style={{ color: PRIMARY }}>support@the100kparent.com</a>{' '}
            with your name and booking reference.
          </P>
          <P>
            <strong>Digital guides:</strong> Once you download a digital guide, your right to cancel under the 14-day cooling-off period ends. You will be asked to confirm this before your download begins. This doesn&apos;t affect any other rights you have.
          </P>
          <P>
            <strong>Our 30-day guarantee:</strong> If you complete a session and feel it didn&apos;t deliver educational value, contact us within 30 days for a full refund — no questions asked. This is on top of your statutory rights and doesn&apos;t replace them.
          </P>
        </Section>

        <Section title="6. What we&apos;re not responsible for">
          <P>
            You&apos;re responsible for the decisions you make and we&apos;re not liable for anything that happens as a result of you relying on our site, guides, or sessions. In particular, we are not responsible for:
          </P>
          <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
            {[
              'Any financial loss, tax liability, or other adverse outcome resulting from information provided through our site or sessions',
              'The accuracy of illustrative estimates — these are based on general rules and the information you provide, which we cannot verify',
              'Changes to tax legislation or HMRC rules after information is provided to you',
              'The services or conduct of any third party, including your session professional, payment providers, or scheduling tools',
            ].map((item) => (
              <li key={item} style={{ color: '#475569', lineHeight: 1.75, marginBottom: '8px', fontSize: '15px' }}>{item}</li>
            ))}
          </ul>
          <P>
            Our total liability to you for any claim will not exceed the amount you paid for the relevant product. Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for any other liability that cannot be excluded by law.
          </P>
        </Section>

        <Section title="7. Our content">
          <P>
            All content on this site — including guides, tools, and session materials — belongs to us or is licensed to us. You can use purchased guides for your own personal use. You can&apos;t share, resell, or reproduce them without our written permission.
          </P>
        </Section>

        <Section title="8. Privacy">
          <P>
            We handle your personal data in line with our{' '}
            <Link href="/privacy-policy_new" style={{ color: PRIMARY }}>Privacy Policy</Link>.
            By using this site, you confirm you&apos;ve read it.
          </P>
        </Section>

        <Section title="9. Governing law">
          <P>
            These terms are governed by the laws of England and Wales. Any disputes are subject to the exclusive jurisdiction of the English courts.
          </P>
        </Section>

        <Section title="10. Contact us">
          <P>
            General:{' '}
            <a href="mailto:hello@the100kparent.com" style={{ color: PRIMARY }}>hello@the100kparent.com</a>
            <br />
            Refunds &amp; cancellations:{' '}
            <a href="mailto:support@the100kparent.com" style={{ color: PRIMARY }}>support@the100kparent.com</a>
            <br />
            Data &amp; privacy:{' '}
            <a href="mailto:privacy@the100kparent.com" style={{ color: PRIMARY }}>privacy@the100kparent.com</a>
          </P>
        </Section>

      </main>

      <SiteFooter />
    </div>
  )
}
