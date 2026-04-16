import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const config = {
  api: { bodyParser: false },
}

async function getRawBody(req: NextRequest): Promise<string> {
  const buf = await req.arrayBuffer()
  return Buffer.from(buf).toString('utf-8')
}

function verifyStripeWebhook(rawBody: string, signature: string, secret: string) {
  const parts = signature.split(',')
  const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1]
  const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1]

  if (!timestamp || !v1) throw new Error('Missing signature parts')

  const signedPayload = `${timestamp}.${rawBody}`
  const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')

  if (expectedSig !== v1) throw new Error('Invalid signature')

  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
    throw new Error('Timestamp too old')
  }

  return JSON.parse(rawBody)
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  const loopsApiKey = process.env.LOOPS_API_KEY ?? ''

  let rawBody: string
  try {
    rawBody = await getRawBody(req)
  } catch {
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 })
  }

  let event: ReturnType<typeof verifyStripeWebhook>
  try {
    event = verifyStripeWebhook(rawBody, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.customer_details?.email
    const name = session.customer_details?.name || session.metadata?.firstName || email?.split('@')[0] || 'there'
    const firstName = name.split(' ')[0]

    console.log(`Payment completed: ${email} (${firstName})`)

    if (email) {
      try {
        await fetch('https://app.loops.so/api/v1/contacts/create', {
          method: 'POST',
          headers: { Authorization: `Bearer ${loopsApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, firstName, source: 'stripe_purchase', userGroup: 'customers', mailingLists: {} }),
        })

        await fetch('https://app.loops.so/api/v1/events/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${loopsApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            eventName: 'purchase_complete',
            eventProperties: {
              firstName,
              dashboardUrl: 'https://the100kparent-unified.vercel.app/dashboard.html',
              pdfUrl: 'https://the100kparent-unified.vercel.app/success.html',
              purchaseDate: new Date().toLocaleDateString('en-GB'),
            },
          }),
        })
      } catch (err) {
        console.error('Loops API error:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}
