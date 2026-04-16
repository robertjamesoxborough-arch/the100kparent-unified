import Link from 'next/link'

const PRIMARY = '#10B981'

export default function SiteFooter() {
  return (
    <footer style={{
      backgroundColor: '#020617',
      padding: '48px 24px 32px',
      color: '#475569',
      fontSize: '13px',
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '32px',
          lineHeight: 1.65,
          color: '#64748B',
          fontSize: '12px',
        }}>
          <strong style={{ color: '#94A3B8' }}>Important:</strong> The 100k Parent provides educational information and general guidance only. Nothing on this website constitutes regulated financial advice, and we are not authorised or regulated by the Financial Conduct Authority (FCA). Any figures shown are illustrative estimates based on general tax rules and the information you provide — they are not guarantees, projections, or personalised recommendations. Tax rules can change and their effect depends on individual circumstances. Before making any financial decisions, you should seek independent regulated advice from an FCA-authorised adviser. Your statutory rights are not affected.
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '32px',
          marginBottom: '32px',
        }}>
          <div>
            <p style={{ fontWeight: 800, color: '#94A3B8', marginBottom: '12px', fontSize: '14px', letterSpacing: '0.05em' }}>
              THE 100K PARENT
            </p>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              Educational financial guidance for high-earning parents.
            </p>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em' }}>
              Service
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/start_new" style={{ color: '#475569', textDecoration: 'none' }}>Find Your Path</Link>
              <Link href="/advisor-booking_new" style={{ color: '#475569', textDecoration: 'none' }}>PFA Sessions</Link>
              <Link href="/guides_new" style={{ color: '#475569', textDecoration: 'none' }}>Tax Guides</Link>
            </div>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em' }}>
              Legal
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/terms_new" style={{ color: '#475569', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
              <Link href="/privacy-policy_new" style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</Link>
              <a href="mailto:privacy@the100kparent.com" style={{ color: '#475569', textDecoration: 'none' }}>Data Requests</a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} The 100k Parent. All rights reserved. Registered in England &amp; Wales.</p>
          <p style={{ margin: 0 }}>
            Not FCA regulated ·{' '}
            <Link href="/terms_new" style={{ color: PRIMARY, textDecoration: 'none' }}>Terms</Link>
            {' · '}
            <Link href="/privacy-policy_new" style={{ color: PRIMARY, textDecoration: 'none' }}>Privacy</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
