interface LegalDisclaimerProps {
  variant?: 'inline' | 'banner'
}

export default function LegalDisclaimer({ variant = 'inline' }: LegalDisclaimerProps) {
  if (variant === 'banner') {
    return (
      <div style={{
        backgroundColor: '#FFFBEB',
        borderTop: '1px solid #FDE68A',
        borderBottom: '1px solid #FDE68A',
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#92400E',
        lineHeight: 1.55,
      }}>
        <strong>Educational information only — not regulated financial advice.</strong>{' '}
        Any figures shown are illustrative estimates. Seek advice from an FCA-authorised adviser before making financial decisions.{' '}
        <a href="/terms_new" style={{ color: '#92400E', fontWeight: 600 }}>Terms</a>{' · '}
        <a href="/privacy-policy_new" style={{ color: '#92400E', fontWeight: 600 }}>Privacy Policy</a>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      padding: '14px 18px',
      fontSize: '12px',
      color: '#64748B',
      lineHeight: 1.65,
    }}>
      <strong style={{ color: '#475569' }}>Illustrative estimates only.</strong>{' '}
      Figures are based on the information you provided and general HMRC rules at the time of calculation. They are not a guarantee, projection, or regulated financial advice. Actual outcomes depend on your full circumstances and tax rules in force at the relevant time. Always seek independent regulated advice from an FCA-authorised adviser before making financial decisions.{' '}
      <a href="/terms_new" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>Terms</a>
      {' · '}
      <a href="/privacy-policy_new" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
    </div>
  )
}
