// Social Media Publishing API — Meta (FB/IG), LinkedIn, X, Pinterest
// Proxies requests to social platforms using stored OAuth tokens

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { platform, action } = req.body || {};

    try {
        // ===== META (Facebook + Instagram) =====
        if (platform === 'meta') {
            const token = process.env.META_ACCESS_TOKEN;
            if (!token) return res.status(400).json({ error: 'Meta not configured' });

            if (action === 'pages') {
                const resp = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
                const data = await resp.json();
                return res.status(200).json({
                    pages: (data.data || []).map(p => ({ id: p.id, name: p.name, accessToken: p.access_token }))
                });
            }

            if (action === 'instagram-accounts') {
                const { pageId, pageToken } = req.body;
                const resp = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
                const data = await resp.json();
                return res.status(200).json({ igAccountId: data.instagram_business_account?.id || null });
            }

            if (action === 'publish-facebook') {
                const { pageId, pageToken, message, link } = req.body;
                const params = new URLSearchParams({ message, access_token: pageToken });
                if (link) params.append('link', link);
                const resp = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                    method: 'POST',
                    body: params,
                });
                const data = await resp.json();
                if (data.id) return res.status(200).json({ success: true, postId: data.id });
                return res.status(400).json({ error: 'Post failed', details: data });
            }

            if (action === 'publish-instagram') {
                const { igAccountId, pageToken, caption, imageUrl } = req.body;
                // Step 1: Create media container
                const createResp = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                    method: 'POST',
                    body: new URLSearchParams({
                        image_url: imageUrl,
                        caption,
                        access_token: pageToken,
                    }),
                });
                const container = await createResp.json();
                if (!container.id) return res.status(400).json({ error: 'Media creation failed', details: container });

                // Step 2: Publish
                const publishResp = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                    method: 'POST',
                    body: new URLSearchParams({
                        creation_id: container.id,
                        access_token: pageToken,
                    }),
                });
                const result = await publishResp.json();
                if (result.id) return res.status(200).json({ success: true, postId: result.id });
                return res.status(400).json({ error: 'Publish failed', details: result });
            }

            if (action === 'insights') {
                const { pageId, pageToken } = req.body;
                const resp = await fetch(
                    `https://graph.facebook.com/v19.0/${pageId}/insights?metric=page_impressions,page_engaged_users,page_fans&period=day&access_token=${pageToken}`
                );
                const data = await resp.json();
                return res.status(200).json({ insights: data.data || [] });
            }
        }

        // ===== LINKEDIN =====
        if (platform === 'linkedin') {
            const token = process.env.LINKEDIN_ACCESS_TOKEN;
            if (!token) return res.status(400).json({ error: 'LinkedIn not configured' });
            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

            if (action === 'profile') {
                const resp = await fetch('https://api.linkedin.com/v2/userinfo', { headers });
                const data = await resp.json();
                return res.status(200).json({ profile: { name: data.name, sub: data.sub } });
            }

            if (action === 'publish') {
                const { authorUrn, text } = req.body;
                const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        author: authorUrn,
                        lifecycleState: 'PUBLISHED',
                        specificContent: {
                            'com.linkedin.ugc.ShareContent': {
                                shareCommentary: { text },
                                shareMediaCategory: 'NONE',
                            },
                        },
                        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
                    }),
                });
                const data = await resp.json();
                return res.status(200).json({ success: true, data });
            }
        }

        // ===== X (TWITTER) =====
        if (platform === 'twitter') {
            const bearerToken = process.env.TWITTER_ACCESS_TOKEN;
            if (!bearerToken) return res.status(400).json({ error: 'X/Twitter not configured' });

            if (action === 'publish') {
                const { text } = req.body;
                const resp = await fetch('https://api.twitter.com/2/tweets', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                });
                const data = await resp.json();
                if (data.data?.id) return res.status(200).json({ success: true, tweetId: data.data.id });
                return res.status(400).json({ error: 'Tweet failed', details: data });
            }
        }

        // ===== PINTEREST =====
        if (platform === 'pinterest') {
            const token = process.env.PINTEREST_ACCESS_TOKEN;
            if (!token) return res.status(400).json({ error: 'Pinterest not configured' });
            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

            if (action === 'boards') {
                const resp = await fetch('https://api.pinterest.com/v5/boards', { headers });
                const data = await resp.json();
                return res.status(200).json({ boards: data.items || [] });
            }

            if (action === 'create-pin') {
                const { boardId, title, description, link, imageUrl } = req.body;
                const resp = await fetch('https://api.pinterest.com/v5/pins', {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        board_id: boardId, title, description, link,
                        media_source: { source_type: 'image_url', url: imageUrl },
                    }),
                });
                const data = await resp.json();
                return res.status(200).json({ success: true, pin: data });
            }
        }

        return res.status(400).json({ error: 'Unknown platform or action' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
