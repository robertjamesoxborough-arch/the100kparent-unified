// Paid Ads API — Meta Ads, Google Ads, TikTok Ads
// Proxies requests to ad platforms using stored credentials

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { platform, action } = req.body || {};

    try {
        // ===== META ADS =====
        if (platform === 'meta') {
            const token = process.env.META_ACCESS_TOKEN;
            const adAccountId = process.env.META_AD_ACCOUNT_ID;
            if (!token) return res.status(400).json({ error: 'Meta Ads not configured' });

            if (action === 'ad-accounts') {
                const resp = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_status,currency,balance&access_token=${token}`);
                const data = await resp.json();
                return res.status(200).json({
                    accounts: (data.data || []).map(a => ({
                        id: a.id, name: a.name, status: a.account_status, currency: a.currency, balance: a.balance,
                    }))
                });
            }

            if (action === 'campaigns') {
                const accountId = req.body.accountId || adAccountId;
                const resp = await fetch(
                    `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=name,status,objective,daily_budget,lifetime_budget,insights{spend,impressions,clicks,ctr,cpc,conversions}&access_token=${token}`
                );
                const data = await resp.json();
                return res.status(200).json({ campaigns: data.data || [] });
            }

            if (action === 'create-campaign') {
                const accountId = req.body.accountId || adAccountId;
                const { name, objective, dailyBudget, status } = req.body;
                const resp = await fetch(`https://graph.facebook.com/v19.0/${accountId}/campaigns`, {
                    method: 'POST',
                    body: new URLSearchParams({
                        name,
                        objective: objective || 'OUTCOME_ENGAGEMENT',
                        status: status || 'PAUSED',
                        special_ad_categories: '[]',
                        access_token: token,
                    }),
                });
                const data = await resp.json();
                if (data.id) return res.status(200).json({ success: true, campaignId: data.id });
                return res.status(400).json({ error: 'Campaign creation failed', details: data });
            }

            if (action === 'create-ad') {
                const accountId = req.body.accountId || adAccountId;
                const { campaignId, adSetName, adName, headline, body: adBody, callToAction, link, dailyBudget, targeting } = req.body;

                // Create Ad Set
                const adSetResp = await fetch(`https://graph.facebook.com/v19.0/${accountId}/adsets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: adSetName || adName + ' - Ad Set',
                        campaign_id: campaignId,
                        daily_budget: dailyBudget || 1000, // cents
                        billing_event: 'IMPRESSIONS',
                        optimization_goal: 'REACH',
                        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
                        targeting: targeting || { geo_locations: { countries: ['GB'] } },
                        status: 'PAUSED',
                        access_token: token,
                    }),
                });
                const adSet = await adSetResp.json();

                return res.status(200).json({ success: true, adSetId: adSet.id, note: 'Ad set created. Creative must be added via Meta Ads Manager for image/video upload.' });
            }

            if (action === 'insights') {
                const accountId = req.body.accountId || adAccountId;
                const { datePreset } = req.body;
                const resp = await fetch(
                    `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm,conversions,cost_per_action_type&date_preset=${datePreset || 'last_30d'}&access_token=${token}`
                );
                const data = await resp.json();
                return res.status(200).json({ insights: data.data || [] });
            }
        }

        // ===== GOOGLE ADS =====
        if (platform === 'google') {
            const token = process.env.GOOGLE_ADS_TOKEN;
            const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
            const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
            if (!token || !devToken) return res.status(400).json({ error: 'Google Ads not configured' });

            const headers = {
                Authorization: `Bearer ${token}`,
                'developer-token': devToken,
                'Content-Type': 'application/json',
            };
            if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
                headers['login-customer-id'] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
            }

            if (action === 'campaigns') {
                const cid = req.body.customerId || customerId;
                const resp = await fetch(`https://googleads.googleapis.com/v16/customers/${cid}/googleAds:searchStream`, {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        query: `SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.status != 'REMOVED' ORDER BY campaign.name LIMIT 50`,
                    }),
                });
                const data = await resp.json();
                return res.status(200).json({ results: data });
            }

            if (action === 'insights') {
                const cid = req.body.customerId || customerId;
                const { startDate, endDate } = req.body;
                const resp = await fetch(`https://googleads.googleapis.com/v16/customers/${cid}/googleAds:searchStream`, {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        query: `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc, segments.date FROM customer WHERE segments.date BETWEEN '${startDate || '2026-02-15'}' AND '${endDate || '2026-03-17'}'`,
                    }),
                });
                const data = await resp.json();
                return res.status(200).json({ results: data });
            }
        }

        // ===== TIKTOK ADS =====
        if (platform === 'tiktok') {
            const token = process.env.TIKTOK_ACCESS_TOKEN;
            const advertiserId = process.env.TIKTOK_ADVERTISER_ID;
            if (!token) return res.status(400).json({ error: 'TikTok Ads not configured' });

            const headers = { 'Access-Token': token, 'Content-Type': 'application/json' };

            if (action === 'campaigns') {
                const resp = await fetch(`https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${advertiserId}&page_size=50`, { headers });
                const data = await resp.json();
                return res.status(200).json({ campaigns: data.data?.list || [] });
            }

            if (action === 'insights') {
                const { startDate, endDate } = req.body;
                const resp = await fetch('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/', {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        advertiser_id: advertiserId,
                        report_type: 'BASIC',
                        dimensions: ['stat_time_day'],
                        metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions'],
                        data_level: 'AUCTION_ADVERTISER',
                        start_date: startDate || '2026-02-15',
                        end_date: endDate || '2026-03-17',
                    }),
                });
                const data = await resp.json();
                return res.status(200).json({ insights: data.data?.list || [] });
            }
        }

        return res.status(400).json({ error: 'Unknown platform or action' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
