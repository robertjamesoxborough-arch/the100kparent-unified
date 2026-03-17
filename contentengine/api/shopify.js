// Shopify E-commerce API — Product sync, orders, collections
// Proxies requests to Shopify Admin API using stored credentials

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action } = req.body || {};
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shop || !token) {
        return res.status(400).json({ error: 'Shopify not configured. Set SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN.' });
    }

    const baseUrl = `https://${shop}.myshopify.com/admin/api/2024-01`;
    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

    try {
        if (action === 'shop') {
            const resp = await fetch(`${baseUrl}/shop.json`, { headers });
            const data = await resp.json();
            return res.status(200).json({ shop: data.shop });
        }

        if (action === 'products') {
            const { limit, pageInfo } = req.body;
            let url = `${baseUrl}/products.json?limit=${limit || 50}`;
            if (pageInfo) url += `&page_info=${pageInfo}`;
            const resp = await fetch(url, { headers });
            const data = await resp.json();

            // Parse pagination from Link header
            const linkHeader = resp.headers.get('link');
            let nextPage = null;
            if (linkHeader) {
                const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
                if (nextMatch) nextPage = nextMatch[1];
            }

            return res.status(200).json({
                products: (data.products || []).map(p => ({
                    id: p.id,
                    title: p.title,
                    handle: p.handle,
                    description: p.body_html,
                    vendor: p.vendor,
                    productType: p.product_type,
                    status: p.status,
                    tags: p.tags,
                    variants: (p.variants || []).map(v => ({
                        id: v.id, title: v.title, price: v.price, sku: v.sku,
                        inventoryQuantity: v.inventory_quantity,
                    })),
                    images: (p.images || []).map(i => ({ id: i.id, src: i.src, alt: i.alt })),
                    createdAt: p.created_at,
                    updatedAt: p.updated_at,
                })),
                nextPage,
            });
        }

        if (action === 'update-product') {
            const { productId, title, description, tags } = req.body;
            const updateData = {};
            if (title) updateData.title = title;
            if (description) updateData.body_html = description;
            if (tags) updateData.tags = tags;

            const resp = await fetch(`${baseUrl}/products/${productId}.json`, {
                method: 'PUT', headers,
                body: JSON.stringify({ product: updateData }),
            });
            const data = await resp.json();
            if (data.product) return res.status(200).json({ success: true, product: data.product });
            return res.status(400).json({ error: 'Update failed', details: data });
        }

        if (action === 'collections') {
            const resp = await fetch(`${baseUrl}/custom_collections.json?limit=50`, { headers });
            const data = await resp.json();
            return res.status(200).json({
                collections: (data.custom_collections || []).map(c => ({
                    id: c.id, title: c.title, handle: c.handle, productsCount: c.products_count,
                })),
            });
        }

        if (action === 'orders') {
            const { status, limit } = req.body;
            const resp = await fetch(`${baseUrl}/orders.json?status=${status || 'any'}&limit=${limit || 25}`, { headers });
            const data = await resp.json();
            return res.status(200).json({
                orders: (data.orders || []).map(o => ({
                    id: o.id, name: o.name, totalPrice: o.total_price, currency: o.currency,
                    status: o.financial_status, fulfillment: o.fulfillment_status,
                    createdAt: o.created_at, itemCount: o.line_items?.length || 0,
                })),
            });
        }

        return res.status(400).json({ error: 'Unknown action' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
