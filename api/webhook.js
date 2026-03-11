// Stripe → Loops Webhook Handler
// Triggers welcome email when payment completes

const crypto = require('crypto');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const loopsApiKey = process.env.LOOPS_API_KEY;

    // Get raw body for signature verification
    let rawBody;
    try {
        rawBody = await getRawBody(req);
    } catch (err) {
        return res.status(400).json({ error: 'Could not read body' });
    }

    // Verify Stripe signature
    let event;
    try {
        event = verifyStripeWebhook(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const email = session.customer_details?.email;
        const name = session.customer_details?.name || 
                     session.metadata?.firstName || 
                     email?.split('@')[0] || 
                     'there';

        const firstName = name.split(' ')[0];

        console.log(`Payment completed: ${email} (${firstName})`);

        if (email) {
            try {
                // 1. Add contact to Loops
                const contactRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${loopsApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        firstName: firstName,
                        source: 'stripe_purchase',
                        userGroup: 'customers',
                        mailingLists: {}
                    })
                });

                const contactData = await contactRes.json();
                console.log('Contact created:', contactData);

                // 2. Trigger welcome email event in Loops
                const eventRes = await fetch('https://app.loops.so/api/v1/events/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${loopsApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        eventName: 'purchase_complete',
                        eventProperties: {
                            firstName: firstName,
                            dashboardUrl: 'https://the100kparent-unified.vercel.app/dashboard.html',
                            pdfUrl: 'https://the100kparent-unified.vercel.app/success.html',
                            purchaseDate: new Date().toLocaleDateString('en-GB')
                        }
                    })
                });

                const eventData = await eventRes.json();
                console.log('Email event triggered:', eventData);

            } catch (err) {
                console.error('Loops API error:', err);
                // Don't fail the webhook - payment still succeeded
            }
        }
    }

    return res.status(200).json({ received: true });
}

// Verify Stripe webhook signature manually (no stripe npm needed)
function verifyStripeWebhook(rawBody, signature, secret) {
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t=')).split('=')[1];
    const v1 = parts.find(p => p.startsWith('v1=')).split('=')[1];

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

    if (expectedSig !== v1) {
        throw new Error('Invalid signature');
    }

    // Check timestamp is within 5 minutes
    const tolerance = 300;
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > tolerance) {
        throw new Error('Timestamp too old');
    }

    return JSON.parse(rawBody);
}

// Read raw body from request
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

export const config = {
    api: {
        bodyParser: false // Must be false for Stripe signature verification
    }
};
