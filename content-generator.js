/* ============================================
   CONTENT ENGINE AI - Core Application Logic
   World-class content generation & ads optimization
   ============================================ */

// ============ STATE ============
const state = {
    currentStep: 1,
    currentView: 'clients',
    activeClientId: null,
    clients: [],
    selectedChannels: [],
    selectedGoal: '',
    selectedTone: '',
    selectedTypes: [],
    generatedContent: [],
    uploadedFiles: [],
    selectedStockMedia: [],
    calendarMonth: new Date(2026, 2), // March 2026
    schedule: 'now'
};

// ============ CLIENT MANAGEMENT ============
function loadClients() {
    const stored = localStorage.getItem('ce_clients');
    state.clients = stored ? JSON.parse(stored) : [];
    const activeId = localStorage.getItem('ce_active_client');
    if (activeId && state.clients.find(c => c.id === activeId)) {
        state.activeClientId = activeId;
    }
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcherBtn();
    updateClientStats();
}

function saveClients() {
    localStorage.setItem('ce_clients', JSON.stringify(state.clients));
    if (state.activeClientId) {
        localStorage.setItem('ce_active_client', state.activeClientId);
    }
}

function getActiveClient() {
    return state.clients.find(c => c.id === state.activeClientId) || null;
}

function setActiveClient(clientId) {
    state.activeClientId = clientId;
    localStorage.setItem('ce_active_client', clientId);
    updateClientSwitcherBtn();
    renderClientDropdown();

    // Pre-fill the wizard with client data
    const client = getActiveClient();
    if (client) {
        document.getElementById('brandNiche').value = client.name + ' - ' + client.industry;
        document.getElementById('targetAudience').value = client.audience || '';

        // Pre-select client channels
        state.selectedChannels = [...(client.channels || [])];
        document.querySelectorAll('.cg-channel-card').forEach(card => {
            card.classList.toggle('selected', state.selectedChannels.includes(card.dataset.channel));
        });

        // Pre-select tone
        if (client.tone && client.tone.length > 0) {
            document.querySelectorAll('#toneSelect .cg-chip').forEach(chip => {
                chip.classList.toggle('active', client.tone.includes(chip.dataset.value));
            });
            state.selectedTone = client.tone[0];
        }
    }

    switchView('create');
}

function openAddClientModal() {
    document.getElementById('addClientModal').style.display = 'flex';
    document.getElementById('newClientName').value = '';
    document.getElementById('newClientIndustry').value = '';
    document.getElementById('newClientAudience').value = '';
    document.getElementById('newClientWebsite').value = '';
    document.getElementById('newClientNotes').value = '';
    document.querySelectorAll('#addClientModal .cg-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.cg-color-swatch').forEach(s => s.classList.remove('active'));
    document.querySelector('.cg-color-swatch').classList.add('active');
    state.editingClientId = null;
}

function closeAddClientModal() {
    document.getElementById('addClientModal').style.display = 'none';
    state.editingClientId = null;
}

function selectColor(el) {
    document.querySelectorAll('.cg-color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function saveNewClient() {
    const name = document.getElementById('newClientName').value.trim();
    if (!name) {
        document.getElementById('newClientName').style.borderColor = '#EF4444';
        document.getElementById('newClientName').focus();
        return;
    }

    const color = document.querySelector('.cg-color-swatch.active')?.dataset.color || '#3B82F6';
    const industry = document.getElementById('newClientIndustry').value.trim();
    const audience = document.getElementById('newClientAudience').value.trim();
    const website = document.getElementById('newClientWebsite').value.trim();
    const notes = document.getElementById('newClientNotes').value.trim();
    const tone = Array.from(document.querySelectorAll('#newClientTone .cg-chip.active')).map(c => c.dataset.value);
    const channels = Array.from(document.querySelectorAll('#newClientChannels .cg-chip.active')).map(c => c.dataset.value);

    if (state.editingClientId) {
        // Update existing client
        const client = state.clients.find(c => c.id === state.editingClientId);
        if (client) {
            client.name = name;
            client.color = color;
            client.industry = industry;
            client.audience = audience;
            client.website = website;
            client.notes = notes;
            client.tone = tone;
            client.channels = channels;
            client.updatedAt = new Date().toISOString();
        }
    } else {
        // Create new client
        const client = {
            id: 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: name,
            color: color,
            industry: industry,
            audience: audience,
            website: website,
            notes: notes,
            tone: tone,
            channels: channels,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            contentCount: 0,
            adSpend: Math.floor(Math.random() * 5000),
            roas: (Math.random() * 3 + 2).toFixed(1)
        };
        state.clients.push(client);
    }

    saveClients();
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcherBtn();
    updateClientStats();
    closeAddClientModal();
}

function editClient(clientId, event) {
    if (event) event.stopPropagation();
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    state.editingClientId = clientId;
    document.getElementById('addClientModal').style.display = 'flex';
    document.getElementById('newClientName').value = client.name;
    document.getElementById('newClientIndustry').value = client.industry || '';
    document.getElementById('newClientAudience').value = client.audience || '';
    document.getElementById('newClientWebsite').value = client.website || '';
    document.getElementById('newClientNotes').value = client.notes || '';

    document.querySelectorAll('.cg-color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color === client.color);
    });
    document.querySelectorAll('#newClientTone .cg-chip').forEach(c => {
        c.classList.toggle('active', (client.tone || []).includes(c.dataset.value));
    });
    document.querySelectorAll('#newClientChannels .cg-chip').forEach(c => {
        c.classList.toggle('active', (client.channels || []).includes(c.dataset.value));
    });

    // Update modal title
    document.querySelector('#addClientModal .cg-modal-header h2').textContent = 'Edit Client';
}

function deleteClient(clientId, event) {
    if (event) event.stopPropagation();
    if (!confirm('Are you sure you want to remove this client? This cannot be undone.')) return;

    state.clients = state.clients.filter(c => c.id !== clientId);
    if (state.activeClientId === clientId) {
        state.activeClientId = state.clients.length > 0 ? state.clients[0].id : null;
    }
    saveClients();
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcherBtn();
    updateClientStats();
}

function renderClientsGrid() {
    const grid = document.getElementById('clientsGrid');
    const empty = document.getElementById('clientsEmpty');

    if (state.clients.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    const channelLabels = {
        instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook',
        linkedin: 'LinkedIn', twitter: 'X', youtube: 'YouTube',
        pinterest: 'Pinterest', email: 'Email'
    };

    grid.innerHTML = state.clients.map(client => {
        const initials = client.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const channelTags = (client.channels || []).slice(0, 4).map(ch =>
            '<span class="cg-client-channel-tag">' + (channelLabels[ch] || ch) + '</span>'
        ).join('');
        const moreChannels = (client.channels || []).length > 4
            ? '<span class="cg-client-channel-tag">+' + ((client.channels.length) - 4) + '</span>'
            : '';
        const isActive = client.id === state.activeClientId;

        return '<div class="cg-client-card' + (isActive ? ' active' : '') + '" onclick="setActiveClient(\'' + client.id + '\')">' +
            '<div class="cg-client-card-header">' +
                '<div class="cg-client-avatar" style="background:' + client.color + ';">' + initials + '</div>' +
                '<div class="cg-client-card-actions">' +
                    '<button class="cg-btn-icon-sm" onclick="editClient(\'' + client.id + '\', event)" title="Edit">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '</button>' +
                    '<button class="cg-btn-icon-sm" onclick="deleteClient(\'' + client.id + '\', event)" title="Delete">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<h3>' + client.name + '</h3>' +
            '<p class="cg-client-industry">' + (client.industry || 'No industry set') + '</p>' +
            '<div class="cg-client-channels">' + channelTags + moreChannels + '</div>' +
            '<div class="cg-client-card-footer">' +
                '<div><span>Content</span><strong>' + (client.contentCount || 0) + '</strong></div>' +
                '<div><span>Ad Spend</span><strong>&pound;' + (client.adSpend || 0).toLocaleString() + '</strong></div>' +
                '<div><span>ROAS</span><strong>' + (client.roas || '0') + 'x</strong></div>' +
            '</div>' +
            (isActive ? '<div class="cg-client-active-badge">Active</div>' : '<div class="cg-client-select-badge">Click to select</div>') +
        '</div>';
    }).join('');
}

function renderClientDropdown() {
    const list = document.getElementById('clientDropdownList');
    if (!list) return;

    if (state.clients.length === 0) {
        list.innerHTML = '<div class="cg-dropdown-empty">No clients yet</div>';
        return;
    }

    list.innerHTML = state.clients.map(client => {
        const initials = client.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const isActive = client.id === state.activeClientId;
        return '<button class="cg-dropdown-client' + (isActive ? ' active' : '') + '" onclick="setActiveClient(\'' + client.id + '\'); toggleClientDropdown();">' +
            '<span class="cg-dropdown-avatar" style="background:' + client.color + ';">' + initials + '</span>' +
            '<span class="cg-dropdown-name">' + client.name + '</span>' +
            (isActive ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-500)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
        '</button>';
    }).join('');
}

function toggleClientDropdown() {
    const dd = document.getElementById('clientDropdown');
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function updateClientSwitcherBtn() {
    const client = getActiveClient();
    const nameEl = document.getElementById('activeClientName');
    const dotEl = document.getElementById('activeClientDot');

    if (client) {
        nameEl.textContent = client.name;
        dotEl.style.background = client.color;
        dotEl.style.display = 'inline-block';
    } else {
        nameEl.textContent = 'Select Client';
        dotEl.style.display = 'none';
    }
}

function updateClientStats() {
    const total = state.clients.length;
    const totalContent = state.clients.reduce((sum, c) => sum + (c.contentCount || 0), 0);
    const totalSpend = state.clients.reduce((sum, c) => sum + (c.adSpend || 0), 0);
    const avgRoas = total > 0
        ? (state.clients.reduce((sum, c) => sum + parseFloat(c.roas || 0), 0) / total).toFixed(1)
        : '0';

    document.getElementById('statTotalClients').textContent = total;
    document.getElementById('statTotalContent').textContent = totalContent;
    document.getElementById('statTotalSpend').textContent = '\u00A3' + totalSpend.toLocaleString();
    document.getElementById('statAvgRoas').textContent = avgRoas + 'x';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const switcher = document.getElementById('clientSwitcher');
    if (switcher && !switcher.contains(e.target)) {
        document.getElementById('clientDropdown').style.display = 'none';
    }
});

// ============ VIEW SWITCHING ============
function switchView(view) {
    // Require active client for non-clients views
    if (view !== 'clients' && !state.activeClientId && state.clients.length > 0) {
        alert('Please select a client first.');
        view = 'clients';
    }
    if (view !== 'clients' && state.clients.length === 0) {
        view = 'clients';
    }

    document.querySelectorAll('.cg-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.cg-nav-tab').forEach(t => t.classList.remove('active'));

    document.getElementById('view-' + view).classList.add('active');
    const tab = document.querySelector('[data-view="' + view + '"]');
    if (tab) tab.classList.add('active');

    state.currentView = view;

    if (view === 'calendar') renderCalendar();
    if (view === 'clients') {
        renderClientsGrid();
        updateClientStats();
    }
}

// ============ WIZARD STEPS ============
function goToStep(step) {
    if (step === 3 && state.currentStep < 3) {
        generateContent();
    }
    if (step === 5) {
        renderReview();
    }

    document.querySelectorAll('.cg-step-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.cg-wizard-step').forEach(s => {
        const sNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (sNum < step) s.classList.add('completed');
        if (sNum === step) s.classList.add('active');
    });

    document.querySelectorAll('.cg-wizard-connector').forEach((c, i) => {
        c.classList.toggle('completed', i < step - 1);
    });

    document.getElementById('step-' + step).classList.add('active');
    state.currentStep = step;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ CHIP SELECTORS ============
document.querySelectorAll('.cg-chip-select:not(.multi) .cg-chip').forEach(chip => {
    chip.addEventListener('click', function() {
        const parent = this.closest('.cg-chip-select');
        parent.querySelectorAll('.cg-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        if (parent.id === 'goalSelect') state.selectedGoal = this.dataset.value;
        if (parent.id === 'toneSelect') state.selectedTone = this.dataset.value;
    });
});

document.querySelectorAll('.cg-chip-select.multi .cg-chip').forEach(chip => {
    chip.addEventListener('click', function() {
        this.classList.toggle('active');

        const parent = this.closest('.cg-chip-select');
        if (parent.id === 'typeSelect') {
            state.selectedTypes = Array.from(parent.querySelectorAll('.cg-chip.active')).map(c => c.dataset.value);
        }
    });
});

// ============ QUANTITY SELECTOR ============
function adjustQty(delta) {
    const input = document.getElementById('contentQty');
    const newVal = Math.max(1, Math.min(100, parseInt(input.value) + delta));
    input.value = newVal;
}

// ============ CHANNEL SELECTION ============
function toggleChannel(card) {
    card.classList.toggle('selected');
    const channel = card.dataset.channel;

    if (card.classList.contains('selected')) {
        if (!state.selectedChannels.includes(channel)) {
            state.selectedChannels.push(channel);
        }
    } else {
        state.selectedChannels = state.selectedChannels.filter(c => c !== channel);
    }
}

// ============ AI CONTENT GENERATION ============
function generateContent() {
    const brand = document.getElementById('brandNiche').value || 'Premium Brand';
    const audience = document.getElementById('targetAudience').value || 'Target audience';
    const qty = parseInt(document.getElementById('contentQty').value) || 5;
    const channels = state.selectedChannels.length > 0 ? state.selectedChannels : ['instagram', 'linkedin'];
    const tone = state.selectedTone || 'professional';
    const goal = state.selectedGoal || 'engagement';
    const types = state.selectedTypes.length > 0 ? state.selectedTypes : ['post', 'carousel', 'reel'];

    // Show loading
    const loading = document.getElementById('aiLoading');
    const contentList = document.getElementById('contentList');
    loading.style.display = 'flex';
    contentList.innerHTML = '';

    const statuses = [
        'Analyzing your brand voice and audience...',
        'Researching trending content in your niche...',
        'Crafting platform-specific copy...',
        'Optimizing hashtags and keywords...',
        'Generating visual concepts...',
        'Fine-tuning engagement hooks...',
        'Finalizing content calendar...'
    ];

    let statusIdx = 0;
    const statusInterval = setInterval(() => {
        statusIdx = (statusIdx + 1) % statuses.length;
        document.getElementById('aiLoadingStatus').textContent = statuses[statusIdx];
    }, 800);

    // Animate progress bar
    const fill = document.getElementById('aiProgressFill');
    fill.style.width = '0%';
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 95) progress = 95;
        fill.style.width = progress + '%';
    }, 400);

    // Generate content after animation
    setTimeout(() => {
        clearInterval(statusInterval);
        clearInterval(progressInterval);
        fill.style.width = '100%';

        state.generatedContent = generateContentPieces(brand, audience, qty, channels, tone, goal, types);

        setTimeout(() => {
            loading.style.display = 'none';
            renderContent();
        }, 500);
    }, 3500);
}

function generateContentPieces(brand, audience, qty, channels, tone, goal, types) {
    const contentTemplates = {
        post: [
            { title: 'Value Bomb Post', text: 'Most {audience} don\'t realise they\'re leaving money on the table.\n\nHere are 3 things you can do TODAY:\n\n1. Review your current tax setup\n2. Check if you qualify for salary sacrifice\n3. Set up Tax-Free Childcare\n\nThe difference? Up to {savings} per year.\n\nSave this post and thank me later.', hashtags: '#Finance #Savings #ParentLife #MoneyTips' },
            { title: 'Authority Post', text: 'I\'ve helped 500+ families save an average of {savings} per year.\n\nThe secret? It\'s not about earning more. It\'s about keeping more of what you earn.\n\nHere\'s what 95% of high earners get wrong about {topic}...', hashtags: '#ExpertAdvice #WealthBuilding #FamilyFinance' },
            { title: 'Engagement Hook', text: 'Quick question for {audience}:\n\nDo you know your ACTUAL tax rate when you include lost benefits?\n\nFor most families earning {income}, it\'s not 40%. It\'s closer to 60%.\n\nDrop a "?" in the comments and I\'ll explain why.', hashtags: '#TaxTips #UKFinance #DidYouKnow' },
            { title: 'Social Proof Post', text: '"We saved {savings} in our first year" - Sarah & Tom, London\n\nThey didn\'t change jobs. They didn\'t work harder. They just restructured how they receive their income.\n\nWant to know how? Link in bio.', hashtags: '#Testimonial #RealResults #FinancialFreedom' },
            { title: 'Myth Buster Post', text: 'MYTH: "Salary sacrifice means I earn less"\n\nREALITY: You take home MORE money.\n\nHere\'s how the maths works:\n\nBefore: {income} gross → lose childcare benefits\nAfter: Sacrifice 1% → gain {savings} in benefits\n\nNet gain: Thousands per year.', hashtags: '#MythBusted #SmartMoney #ParentHacks' }
        ],
        story: [
            { title: 'Quick Tip Story', text: 'Swipe up to discover the #1 tax strategy for parents earning {income}+\n\n{savings} saved per year on average.', hashtags: '' },
            { title: 'Poll Story', text: 'Do you know about Tax-Free Childcare?\n\nYes, I use it ✅\nNo, what is it? 🤔\n\nMost parents are missing out on £2,000/year per child.', hashtags: '' }
        ],
        reel: [
            { title: 'Hook Reel Script', text: '🎬 HOOK: "If you earn over {income}, you need to hear this"\n\n📍 SETUP: Show calculator, type in salary\n\n💡 REVEAL: "You\'re losing {savings} every single year"\n\n🎯 CTA: "Follow for more money-saving strategies"\n\nAudio: Trending sound\nDuration: 15-30s\nCaption: This changed everything for us...', hashtags: '#MoneyTok #FinanceTips #ParentHack #UKMoney' },
            { title: 'Before/After Reel', text: '🎬 "POV: Before vs After using salary sacrifice"\n\nBEFORE:\n- Losing childcare benefits ❌\n- Paying 60% effective tax ❌\n- Stressed about childcare costs ❌\n\nAFTER:\n- Full benefits restored ✅\n- 40% tax rate ✅\n- {savings} saved per year ✅\n\nDuration: 10-15s fast cuts', hashtags: '#BeforeAndAfter #GlowUp #MoneyGlowUp' }
        ],
        carousel: [
            { title: 'Educational Carousel', text: 'Slide 1: "5 Ways to Save {savings} on Childcare This Year"\n\nSlide 2: "1. Tax-Free Childcare — Get 20% off childcare costs, up to £2,000/child/year"\n\nSlide 3: "2. Salary Sacrifice — Reduce taxable income below £100k threshold"\n\nSlide 4: "3. Income Splitting — Use partnerships to optimize household tax"\n\nSlide 5: "4. Employer Benefits — Check your workplace nursery scheme"\n\nSlide 6: "5. Junior ISAs — Tax-free investment for your child\'s future"\n\nSlide 7: "Save this carousel and start implementing TODAY 📌"\n\nDesign: Clean, bold typography on gradient backgrounds', hashtags: '#CarouselPost #FinanceEducation #ParentingTips #SaveMoney' }
        ],
        thread: [
            { title: 'Twitter/X Thread', text: '🧵 THREAD: How UK parents earning {income}+ can save {savings}/year (most don\'t know this)\n\n1/ The UK tax system has a brutal cliff edge at £100,000.\n\nYou lose your Personal Allowance — £12,570 of tax-free income.\n\nEffective tax rate: 60%. Yes, really.\n\n2/ But there\'s a legal, HMRC-approved way to bring your income below £100k.\n\nIt\'s called salary sacrifice.\n\nYou redirect a small portion of salary into your pension. Your "adjusted net income" drops. Benefits unlock.\n\n3/ Here\'s what you get back:\n- Tax-Free Childcare: £2,000/child/year\n- 30 hours free childcare\n- Your personal allowance (£12,570)\n\nTotal value: up to {savings}/year.\n\n4/ The best part? Your pension grows faster too.\n\nYou\'re not losing money — you\'re redirecting it into your future, tax-free.\n\n5/ Want to calculate your exact savings? We built a free tool.\n\n[Link]\n\nIt takes 60 seconds. No email required.\n\nRetweet to help other parents. 🔄', hashtags: '' }
        ],
        article: [
            { title: 'Long-Form Article', text: '# The Complete Guide to Saving {savings} on UK Childcare Costs\n\n## Introduction\nIf you\'re a UK parent earning over {income}, you\'re probably paying far more tax than you need to — and missing out on thousands in childcare benefits.\n\nIn this comprehensive guide, we\'ll walk through every strategy available to high-earning parents...\n\n## Section 1: The £100k Tax Trap\n[Detailed explanation of the personal allowance cliff edge]\n\n## Section 2: Salary Sacrifice Explained\n[Step-by-step guide with examples]\n\n## Section 3: Tax-Free Childcare\n[Application process and maximizing benefits]\n\n## Conclusion\nBy implementing these strategies, families typically save between £8,000 and £25,000 per year.\n\nWord count target: 2,000-3,000 words\nSEO keywords: childcare costs UK, salary sacrifice childcare, tax-free childcare, high earner tax planning', hashtags: '' }
        ],
        ad: [
            { title: 'High-Converting Ad', text: '📢 AD CREATIVE\n\nHeadline: "Parents earning {income}+: You\'re losing {savings}/year"\n\nPrimary text: "The UK tax system penalises families earning over £100k. But there\'s a legal way to save up to {savings} every year on childcare costs. Our free calculator shows you exactly how much you could save in 60 seconds."\n\nCTA: Calculate My Savings\n\nTarget: Parents 28-45, HHI £100k+, UK\nPlacement: Feed, Stories, Reels\n\nVariant B Headline: "This 60-second calculator could save you {savings}"\nVariant C Headline: "Are you in the £100k tax trap?"', hashtags: '' }
        ]
    };

    const incomes = ['£100k', '£110k', '£120k', '£150k'];
    const savingsAmounts = ['£12,000', '£15,000', '£18,000', '£20,000', '£25,000'];
    const topics = ['childcare costs', 'tax planning', 'salary sacrifice', 'family finances'];

    const pieces = [];
    const channelNames = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', linkedin: 'LinkedIn', twitter: 'X (Twitter)', youtube: 'YouTube', pinterest: 'Pinterest', email: 'Email' };

    for (let i = 0; i < qty; i++) {
        const type = types[i % types.length];
        const channel = channels[i % channels.length];
        const templates = contentTemplates[type] || contentTemplates.post;
        const template = templates[i % templates.length];
        const income = incomes[Math.floor(Math.random() * incomes.length)];
        const savings = savingsAmounts[Math.floor(Math.random() * savingsAmounts.length)];
        const topic = topics[Math.floor(Math.random() * topics.length)];

        let text = template.text
            .replace(/\{audience\}/g, audience || 'high-earning parents')
            .replace(/\{income\}/g, income)
            .replace(/\{savings\}/g, savings)
            .replace(/\{topic\}/g, topic)
            .replace(/\{brand\}/g, brand);

        pieces.push({
            id: 'content-' + (i + 1),
            title: template.title,
            type: type,
            channel: channel,
            channelName: channelNames[channel] || channel,
            text: text,
            hashtags: template.hashtags,
            status: 'draft',
            score: Math.floor(Math.random() * 15) + 85
        });
    }

    return pieces;
}

function renderContent() {
    const list = document.getElementById('contentList');
    list.innerHTML = '';

    const typeIcons = {
        post: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
        story: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="2" ry="2"/></svg>',
        reel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
        carousel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="16" height="16" rx="2"/><path d="M22 7v10a2 2 0 0 1-2 2h-1"/></svg>',
        thread: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        article: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        ad: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
    };

    const channelColors = {
        instagram: 'linear-gradient(45deg, #f09433, #dc2743)',
        tiktok: '#000',
        facebook: '#1877F2',
        linkedin: '#0A66C2',
        twitter: '#000',
        youtube: '#FF0000',
        pinterest: '#E60023',
        email: 'linear-gradient(135deg, #667eea, #764ba2)'
    };

    state.generatedContent.forEach((piece, idx) => {
        const card = document.createElement('div');
        card.className = 'cg-content-card';
        card.style.animationDelay = (idx * 0.1) + 's';

        const colorVal = channelColors[piece.channel] || '#333';
        const bgStyle = colorVal.includes('gradient') ? 'background: ' + colorVal : 'background: ' + colorVal;

        card.innerHTML = `
            <div class="cg-content-card-header">
                <div class="cg-content-meta">
                    <span class="cg-content-type">${typeIcons[piece.type] || ''} ${piece.type}</span>
                    <span class="cg-content-channel" style="${bgStyle}; color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem;">${piece.channelName}</span>
                </div>
                <div class="cg-content-score">
                    <div class="cg-score-ring" data-score="${piece.score}">
                        <svg width="44" height="44" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--gray-200)" stroke-width="3"/>
                            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--emerald-500)" stroke-width="3" stroke-dasharray="${piece.score * 1.13} 113" stroke-dashoffset="0" transform="rotate(-90 22 22)" stroke-linecap="round"/>
                        </svg>
                        <span>${piece.score}</span>
                    </div>
                </div>
            </div>
            <h3 class="cg-content-title">${piece.title}</h3>
            <div class="cg-content-text" id="text-${piece.id}">
                <pre>${piece.text}</pre>
            </div>
            ${piece.hashtags ? '<div class="cg-content-hashtags">' + piece.hashtags + '</div>' : ''}
            <div class="cg-content-actions">
                <button class="cg-btn cg-btn-ghost cg-btn-sm" onclick="editContent('${piece.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                </button>
                <button class="cg-btn cg-btn-ghost cg-btn-sm" onclick="regenerateOne('${piece.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Regenerate
                </button>
                <button class="cg-btn cg-btn-ghost cg-btn-sm" onclick="copyContent('${piece.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                </button>
            </div>
        `;

        list.appendChild(card);
    });
}

function editContent(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const textEl = document.getElementById('text-' + id);
    const currentText = piece.text;

    textEl.innerHTML = `
        <textarea class="cg-edit-textarea" id="edit-${id}" rows="8">${currentText}</textarea>
        <div class="cg-edit-actions">
            <button class="cg-btn cg-btn-ghost cg-btn-sm" onclick="cancelEdit('${id}')">Cancel</button>
            <button class="cg-btn cg-btn-primary cg-btn-sm" onclick="saveEdit('${id}')">Save</button>
        </div>
    `;
}

function saveEdit(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const textarea = document.getElementById('edit-' + id);
    piece.text = textarea.value;

    const textEl = document.getElementById('text-' + id);
    textEl.innerHTML = '<pre>' + piece.text + '</pre>';
}

function cancelEdit(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const textEl = document.getElementById('text-' + id);
    textEl.innerHTML = '<pre>' + piece.text + '</pre>';
}

function regenerateOne(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const textEl = document.getElementById('text-' + id);
    textEl.innerHTML = '<div class="cg-regen-loading"><div class="cg-spinner"></div> Regenerating...</div>';

    setTimeout(() => {
        piece.score = Math.floor(Math.random() * 10) + 90;
        piece.text = piece.text.split('\n').sort(() => Math.random() - 0.5).join('\n');
        textEl.innerHTML = '<pre>' + piece.text + '</pre>';
    }, 1500);
}

function regenerateAll() {
    generateContent();
}

function copyContent(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    navigator.clipboard.writeText(piece.text + (piece.hashtags ? '\n\n' + piece.hashtags : '')).then(() => {
        const btn = event.target.closest('button');
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-500)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
    });
}

// ============ FILE UPLOAD ============
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('uploadZone').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('uploadZone').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('uploadZone').classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    const grid = document.getElementById('fileGrid');
    const container = document.getElementById('uploadedFiles');
    container.style.display = 'block';

    Array.from(files).forEach(file => {
        state.uploadedFiles.push(file);

        const item = document.createElement('div');
        item.className = 'cg-file-item';

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                item.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="cg-file-overlay">
                        <span>${file.name}</span>
                        <button class="cg-file-remove" onclick="this.closest('.cg-file-item').remove()">&times;</button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            item.innerHTML = `
                <div class="cg-file-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div class="cg-file-overlay">
                    <span>${file.name}</span>
                    <button class="cg-file-remove" onclick="this.closest('.cg-file-item').remove()">&times;</button>
                </div>
            `;
        }

        grid.appendChild(item);
    });
}

// ============ STOCK MEDIA ============
function searchStock(e) {
    if (e.key !== 'Enter') return;
    const query = e.target.value;
    const grid = document.getElementById('stockGrid');

    grid.innerHTML = '<div class="cg-stock-loading"><div class="cg-spinner"></div> Searching free stock media...</div>';

    setTimeout(() => {
        const gradients = [
            'linear-gradient(135deg, #667eea, #764ba2)',
            'linear-gradient(135deg, #f093fb, #f5576c)',
            'linear-gradient(135deg, #4facfe, #00f2fe)',
            'linear-gradient(135deg, #43e97b, #38f9d7)',
            'linear-gradient(135deg, #fa709a, #fee140)',
            'linear-gradient(135deg, #a18cd1, #fbc2eb)',
            'linear-gradient(135deg, #ffecd2, #fcb69f)',
            'linear-gradient(135deg, #ff9a9e, #fecfef)',
            'linear-gradient(135deg, #a1c4fd, #c2e9fb)'
        ];

        const terms = [query, query + ' lifestyle', query + ' professional', query + ' creative', 'office ' + query, query + ' team', query + ' modern', query + ' business', query + ' digital'];

        grid.innerHTML = '';
        terms.forEach((term, i) => {
            const item = document.createElement('div');
            item.className = 'cg-stock-item';
            item.style.background = gradients[i % gradients.length];
            item.onclick = function() { selectStock(this); };
            item.innerHTML = `<div class="cg-stock-overlay"><span>${term}</span><small>Free &middot; Unsplash</small></div>`;
            grid.appendChild(item);
        });
    }, 1000);
}

function switchStockTab(tab, btn) {
    document.querySelectorAll('.cg-stock-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

function selectStock(item) {
    item.classList.toggle('selected');
}

// ============ REVIEW & PUBLISH ============
function renderReview() {
    const grid = document.getElementById('reviewGrid');
    grid.innerHTML = '';

    const channelColors = {
        instagram: '#E4405F',
        tiktok: '#000',
        facebook: '#1877F2',
        linkedin: '#0A66C2',
        twitter: '#000',
        youtube: '#FF0000',
        pinterest: '#E60023',
        email: '#764ba2'
    };

    state.generatedContent.forEach(piece => {
        const card = document.createElement('div');
        card.className = 'cg-review-card';
        card.innerHTML = `
            <div class="cg-review-header" style="border-left: 4px solid ${channelColors[piece.channel] || '#333'};">
                <div>
                    <span class="cg-review-channel">${piece.channelName}</span>
                    <span class="cg-review-type">${piece.type}</span>
                </div>
                <span class="cg-review-score">${piece.score}/100</span>
            </div>
            <h4>${piece.title}</h4>
            <pre class="cg-review-text">${piece.text.substring(0, 200)}${piece.text.length > 200 ? '...' : ''}</pre>
        `;
        grid.appendChild(card);
    });
}

function selectSchedule(type, el) {
    document.querySelectorAll('.cg-radio-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    state.schedule = type;
}

function publishAll() {
    const modal = document.getElementById('publishModal');
    const channelsDiv = document.getElementById('publishedChannels');

    const uniqueChannels = [...new Set(state.generatedContent.map(c => c.channelName))];
    channelsDiv.innerHTML = uniqueChannels.map(ch =>
        '<span class="cg-published-badge">' + ch + '</span>'
    ).join('');

    // Update client content count
    const client = getActiveClient();
    if (client) {
        client.contentCount = (client.contentCount || 0) + state.generatedContent.length;
        saveClients();
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('publishModal').style.display = 'none';
    switchView('calendar');
}

// ============ CALENDAR ============
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDate = state.calendarMonth;
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    document.getElementById('calendarMonth').textContent =
        monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    grid.innerHTML = days.map(d => '<div class="cg-cal-header">' + d + '</div>').join('');

    for (let i = 0; i < adjustedFirst; i++) {
        grid.innerHTML += '<div class="cg-cal-day empty"></div>';
    }

    const sampleContent = [
        { day: 3, channel: 'instagram', type: 'Post', color: '#E4405F' },
        { day: 3, channel: 'linkedin', type: 'Article', color: '#0A66C2' },
        { day: 5, channel: 'tiktok', type: 'Reel', color: '#000' },
        { day: 7, channel: 'facebook', type: 'Post', color: '#1877F2' },
        { day: 10, channel: 'instagram', type: 'Carousel', color: '#E4405F' },
        { day: 10, channel: 'twitter', type: 'Thread', color: '#000' },
        { day: 12, channel: 'youtube', type: 'Short', color: '#FF0000' },
        { day: 14, channel: 'linkedin', type: 'Post', color: '#0A66C2' },
        { day: 16, channel: 'instagram', type: 'Reel', color: '#E4405F' },
        { day: 17, channel: 'email', type: 'Newsletter', color: '#764ba2' },
        { day: 19, channel: 'facebook', type: 'Ad', color: '#1877F2' },
        { day: 21, channel: 'tiktok', type: 'Reel', color: '#000' },
        { day: 22, channel: 'instagram', type: 'Story', color: '#E4405F' },
        { day: 24, channel: 'linkedin', type: 'Post', color: '#0A66C2' },
        { day: 26, channel: 'twitter', type: 'Thread', color: '#000' },
        { day: 28, channel: 'instagram', type: 'Post', color: '#E4405F' },
        { day: 30, channel: 'pinterest', type: 'Pin', color: '#E60023' }
    ];

    const today = new Date();

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dayContent = sampleContent.filter(c => c.day === d);

        let contentHtml = '';
        dayContent.forEach(c => {
            contentHtml += '<div class="cg-cal-event" style="background: ' + c.color + '; color: white;">' + c.type + '</div>';
        });

        grid.innerHTML += '<div class="cg-cal-day' + (isToday ? ' today' : '') + '"><span class="cg-cal-num">' + d + '</span>' + contentHtml + '</div>';
    }
}

function calendarNav(dir) {
    state.calendarMonth = new Date(
        state.calendarMonth.getFullYear(),
        state.calendarMonth.getMonth() + dir
    );
    renderCalendar();
}

// ============ ADS ENGINE ============
function createAdCampaign() {
    document.getElementById('campaignModal').style.display = 'flex';
}

function closeCampaignModal() {
    document.getElementById('campaignModal').style.display = 'none';
}

function launchCampaign() {
    const modal = document.getElementById('campaignModal');
    modal.querySelector('.cg-campaign-form').innerHTML = `
        <div class="cg-campaign-success">
            <div class="cg-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-500)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2>Campaign Launched!</h2>
            <p>AI is now optimizing your campaign in real-time. You'll receive hourly performance updates.</p>
            <button class="cg-btn cg-btn-primary" onclick="closeCampaignModal()">View Campaign</button>
        </div>
    `;
}

function runAdsAudit() {
    const btn = event.target.closest('button');
    const orig = btn.innerHTML;
    btn.innerHTML = '<div class="cg-spinner" style="width:18px;height:18px;"></div> Running Audit...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = orig;
        btn.disabled = false;

        const logList = document.getElementById('aiLogList');
        const newItem = document.createElement('div');
        newItem.className = 'cg-log-item new';
        newItem.innerHTML = `
            <div class="cg-log-time">Just now</div>
            <div class="cg-log-badge audit">Audit</div>
            <div class="cg-log-text"><strong>Full audit complete:</strong> Found 3 optimizations worth £847/month in savings. Applied automatically: paused 2 low-ROAS ad sets, reallocated budget to top performers, refreshed 5 fatiguing creatives.</div>
        `;
        logList.insertBefore(newItem, logList.firstChild);
    }, 3000);
}

function connectPlatform(platform) {
    const btn = event.target.closest('button');
    btn.innerHTML = '<div class="cg-spinner" style="width:14px;height:14px;"></div> Connecting...';

    setTimeout(() => {
        const card = btn.closest('.cg-platform-card');
        card.classList.add('connected');
        card.querySelector('.cg-platform-status').textContent = 'Connected';
        card.querySelector('.cg-platform-status').classList.add('connected');
        btn.remove();

        const metrics = document.createElement('div');
        metrics.className = 'cg-platform-metrics';
        metrics.innerHTML = '<div><span>CPC</span><strong>&pound;0.00</strong></div><div><span>CTR</span><strong>0.0%</strong></div><div><span>Conv.</span><strong>0</strong></div>';
        card.appendChild(metrics);

        const ai = document.createElement('div');
        ai.className = 'cg-platform-ai';
        ai.innerHTML = '<div class="cg-ai-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> AI Active</div><span class="cg-ai-action">Initializing optimization...</span>';
        card.appendChild(ai);
    }, 2000);
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    // Load clients from localStorage
    loadClients();

    // Set up click handlers on upload zone
    document.getElementById('uploadZone').addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') {
            document.getElementById('fileInput').click();
        }
    });

    // Reset add client modal title when opening fresh
    document.getElementById('addClientModal')?.addEventListener('transitionend', function() {
        if (this.style.display === 'none' && !state.editingClientId) {
            const h2 = this.querySelector('.cg-modal-header h2');
            if (h2) h2.textContent = 'Add New Client';
        }
    });
});
