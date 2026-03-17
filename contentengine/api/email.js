// Email Marketing API — Mailchimp, Klaviyo, SendGrid
// Proxies requests to email platforms using stored credentials

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { platform, action } = req.body || {};

    try {
        // ===== MAILCHIMP =====
        if (platform === 'mailchimp') {
            const apiKey = process.env.MAILCHIMP_API_KEY;
            if (!apiKey) return res.status(400).json({ error: 'Mailchimp not configured' });
            const dc = apiKey.split('-').pop();
            const baseUrl = `https://${dc}.api.mailchimp.com/3.0`;
            const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

            if (action === 'lists') {
                const resp = await fetch(`${baseUrl}/lists?count=100`, { headers });
                const data = await resp.json();
                return res.status(200).json({
                    lists: (data.lists || []).map(l => ({
                        id: l.id, name: l.name,
                        memberCount: l.stats?.member_count || 0,
                        openRate: l.stats?.open_rate || 0,
                        clickRate: l.stats?.click_rate || 0,
                    }))
                });
            }

            if (action === 'campaigns') {
                const resp = await fetch(`${baseUrl}/campaigns?count=50&sort_field=send_time&sort_dir=DESC`, { headers });
                const data = await resp.json();
                return res.status(200).json({
                    campaigns: (data.campaigns || []).map(c => ({
                        id: c.id, title: c.settings?.title, subject: c.settings?.subject_line,
                        status: c.status, sendTime: c.send_time,
                        opens: c.report_summary?.opens || 0,
                        clicks: c.report_summary?.clicks || 0,
                        recipients: c.recipients?.recipient_count || 0,
                    }))
                });
            }

            if (action === 'create-campaign') {
                const { listId, subject, previewText, htmlContent, fromName, replyTo } = req.body;
                // Create campaign
                const createResp = await fetch(`${baseUrl}/campaigns`, {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        type: 'regular',
                        recipients: { list_id: listId },
                        settings: {
                            subject_line: subject,
                            preview_text: previewText || '',
                            from_name: fromName || '',
                            reply_to: replyTo || '',
                            title: subject,
                        },
                    }),
                });
                const campaign = await createResp.json();
                if (!campaign.id) return res.status(400).json({ error: 'Failed to create campaign', details: campaign });

                // Set content
                if (htmlContent) {
                    await fetch(`${baseUrl}/campaigns/${campaign.id}/content`, {
                        method: 'PUT', headers,
                        body: JSON.stringify({ html: htmlContent }),
                    });
                }

                return res.status(200).json({ success: true, campaignId: campaign.id });
            }

            if (action === 'send-campaign') {
                const { campaignId } = req.body;
                const sendResp = await fetch(`${baseUrl}/campaigns/${campaignId}/actions/send`, {
                    method: 'POST', headers,
                });
                if (sendResp.status === 204) return res.status(200).json({ success: true });
                const err = await sendResp.json();
                return res.status(400).json({ error: 'Send failed', details: err });
            }
        }

        // ===== KLAVIYO =====
        if (platform === 'klaviyo') {
            const apiKey = process.env.KLAVIYO_API_KEY;
            if (!apiKey) return res.status(400).json({ error: 'Klaviyo not configured' });
            const headers = {
                Authorization: `Klaviyo-API-Key ${apiKey}`,
                'Content-Type': 'application/json',
                revision: '2024-02-15',
            };

            if (action === 'lists') {
                const resp = await fetch('https://a.klaviyo.com/api/lists/', { headers });
                const data = await resp.json();
                return res.status(200).json({
                    lists: (data.data || []).map(l => ({
                        id: l.id, name: l.attributes.name,
                    }))
                });
            }

            if (action === 'campaigns') {
                const resp = await fetch('https://a.klaviyo.com/api/campaigns/?sort=-send_time', { headers });
                const data = await resp.json();
                return res.status(200).json({
                    campaigns: (data.data || []).map(c => ({
                        id: c.id, name: c.attributes.name,
                        status: c.attributes.status,
                        sendTime: c.attributes.send_time,
                    }))
                });
            }

            if (action === 'create-campaign') {
                const { name, listId, subject, htmlContent } = req.body;
                const createResp = await fetch('https://a.klaviyo.com/api/campaigns/', {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        data: {
                            type: 'campaign',
                            attributes: {
                                name: name || subject,
                                audiences: { included: [{ type: 'list', id: listId }] },
                                'campaign-messages': {
                                    data: [{
                                        type: 'campaign-message',
                                        attributes: {
                                            channel: 'email',
                                            label: subject,
                                            content: { subject_line: subject, html_body: htmlContent || '' },
                                        }
                                    }]
                                },
                                send_strategy: { method: 'immediate' },
                            },
                        },
                    }),
                });
                const campaign = await createResp.json();
                return res.status(200).json({ success: true, campaign });
            }
        }

        // ===== SENDGRID =====
        if (platform === 'sendgrid') {
            const apiKey = process.env.SENDGRID_API_KEY;
            if (!apiKey) return res.status(400).json({ error: 'SendGrid not configured' });
            const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

            if (action === 'contacts') {
                const resp = await fetch('https://api.sendgrid.com/v3/marketing/contacts/count', { headers });
                const data = await resp.json();
                return res.status(200).json({ contactCount: data.contact_count || 0 });
            }

            if (action === 'lists') {
                const resp = await fetch('https://api.sendgrid.com/v3/marketing/lists', { headers });
                const data = await resp.json();
                return res.status(200).json({
                    lists: (data.result || []).map(l => ({
                        id: l.id, name: l.name, contactCount: l.contact_count || 0,
                    }))
                });
            }

            if (action === 'send-single') {
                const { to, from, subject, htmlContent, textContent } = req.body;
                const sendResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email: to }] }],
                        from: { email: from },
                        subject,
                        content: [
                            ...(textContent ? [{ type: 'text/plain', value: textContent }] : []),
                            ...(htmlContent ? [{ type: 'text/html', value: htmlContent }] : []),
                        ],
                    }),
                });
                if (sendResp.status === 202) return res.status(200).json({ success: true });
                const err = await sendResp.json();
                return res.status(400).json({ error: 'Send failed', details: err });
            }
        }

        return res.status(400).json({ error: 'Unknown platform or action' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
