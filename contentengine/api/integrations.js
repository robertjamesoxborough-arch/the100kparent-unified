// Integration status & credential management API
// Stores encrypted API keys server-side (env vars in production)

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    // In production, credentials come from Vercel env vars or a database
    // This endpoint validates and tests connections
    const { action, platform, credentials } = req.body || {};

    if (req.method === 'GET') {
        // Return which integrations are configured (from env vars)
        const integrations = {
            mailchimp: { connected: !!process.env.MAILCHIMP_API_KEY, name: 'Mailchimp' },
            klaviyo: { connected: !!process.env.KLAVIYO_API_KEY, name: 'Klaviyo' },
            sendgrid: { connected: !!process.env.SENDGRID_API_KEY, name: 'SendGrid' },
            shopify: { connected: !!process.env.SHOPIFY_ACCESS_TOKEN, name: 'Shopify' },
            meta: { connected: !!process.env.META_ACCESS_TOKEN, name: 'Meta (Facebook/Instagram)' },
            google: { connected: !!process.env.GOOGLE_ADS_TOKEN, name: 'Google Ads' },
            tiktok: { connected: !!process.env.TIKTOK_ACCESS_TOKEN, name: 'TikTok Ads' },
            linkedin: { connected: !!process.env.LINKEDIN_ACCESS_TOKEN, name: 'LinkedIn' },
            twitter: { connected: !!process.env.TWITTER_ACCESS_TOKEN, name: 'X (Twitter)' },
            pinterest: { connected: !!process.env.PINTEREST_ACCESS_TOKEN, name: 'Pinterest' },
        };
        return res.status(200).json({ integrations });
    }

    if (req.method === 'POST' && action === 'test') {
        // Test a connection with provided credentials
        try {
            if (platform === 'mailchimp') {
                const apiKey = credentials.apiKey;
                const dc = apiKey.split('-').pop();
                const response = await fetch(`https://${dc}.api.mailchimp.com/3.0/ping`, {
                    headers: { Authorization: `Bearer ${apiKey}` },
                });
                const data = await response.json();
                if (data.health_status) {
                    return res.status(200).json({ success: true, message: 'Connected to Mailchimp' });
                }
                return res.status(400).json({ success: false, message: 'Invalid Mailchimp API key' });
            }

            if (platform === 'klaviyo') {
                const response = await fetch('https://a.klaviyo.com/api/accounts/', {
                    headers: {
                        Authorization: `Klaviyo-API-Key ${credentials.apiKey}`,
                        revision: '2024-02-15',
                    },
                });
                if (response.ok) {
                    return res.status(200).json({ success: true, message: 'Connected to Klaviyo' });
                }
                return res.status(400).json({ success: false, message: 'Invalid Klaviyo API key' });
            }

            if (platform === 'sendgrid') {
                const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
                    headers: { Authorization: `Bearer ${credentials.apiKey}` },
                });
                if (response.ok) {
                    return res.status(200).json({ success: true, message: 'Connected to SendGrid' });
                }
                return res.status(400).json({ success: false, message: 'Invalid SendGrid API key' });
            }

            if (platform === 'shopify') {
                const { shop, accessToken } = credentials;
                const response = await fetch(`https://${shop}.myshopify.com/admin/api/2024-01/shop.json`, {
                    headers: { 'X-Shopify-Access-Token': accessToken },
                });
                if (response.ok) {
                    return res.status(200).json({ success: true, message: 'Connected to Shopify' });
                }
                return res.status(400).json({ success: false, message: 'Invalid Shopify credentials' });
            }

            return res.status(400).json({ success: false, message: 'Unknown platform' });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Connection failed: ' + err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
