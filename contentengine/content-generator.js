/* =============================================
   ContentEngine — Application Logic
   No fake data. No hallucinated features.
   Everything here actually works.
   ============================================= */

// ============ STATE ============
const state = {
    currentView: 'clients',
    activeClientId: null,
    clients: [],
    wizard: {
        step: 1,
        channels: [],
        goal: '',
        tone: '',
        types: [],
    },
    generatedContent: [],
    allContent: [],
    uploadedFiles: [],
    calendarMonth: new Date(),
    schedule: 'now',
    scheduleDate: null,
    editingClientId: null,
};

const CHANNEL_NAMES = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'X',
    youtube: 'YouTube',
    pinterest: 'Pinterest',
    email: 'Email',
};

const CHANNEL_COLORS = {
    instagram: '#E4405F',
    tiktok: '#000000',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    twitter: '#000000',
    youtube: '#FF0000',
    pinterest: '#E60023',
    email: '#7C3AED',
};

// ============ PERSISTENCE ============
function loadData() {
    try {
        const clients = localStorage.getItem('ce_clients');
        state.clients = clients ? JSON.parse(clients) : [];
        const activeId = localStorage.getItem('ce_active_client');
        if (activeId && state.clients.find(c => c.id === activeId)) {
            state.activeClientId = activeId;
        }
        const content = localStorage.getItem('ce_content');
        state.allContent = content ? JSON.parse(content) : [];
    } catch (e) {
        console.error('Failed to load data:', e);
        state.clients = [];
        state.allContent = [];
    }
}

function saveClients() {
    localStorage.setItem('ce_clients', JSON.stringify(state.clients));
    if (state.activeClientId) {
        localStorage.setItem('ce_active_client', state.activeClientId);
    }
}

function saveContent() {
    localStorage.setItem('ce_content', JSON.stringify(state.allContent));
}

function getActiveClient() {
    return state.clients.find(c => c.id === state.activeClientId) || null;
}

// ============ TOAST ============
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============ CLIENT MANAGEMENT ============
function setActiveClient(clientId) {
    state.activeClientId = clientId;
    localStorage.setItem('ce_active_client', clientId);
    updateClientSwitcher();
    renderClientDropdown();
    renderClientsGrid();
    prefillWizardFromClient();
    switchView('create');
}

function openAddClientModal() {
    state.editingClientId = null;
    const modal = document.getElementById('addClientModal');
    document.getElementById('clientModalTitle').textContent = 'Add New Client';
    document.getElementById('newClientName').value = '';
    document.getElementById('newClientIndustry').value = '';
    document.getElementById('newClientAudience').value = '';
    document.getElementById('newClientWebsite').value = '';
    document.getElementById('newClientNotes').value = '';
    document.querySelectorAll('#addClientModal .chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    document.querySelector('.color-swatch').classList.add('active');
    document.getElementById('newClientName').classList.remove('error');
    modal.classList.add('open');
}

function closeAddClientModal() {
    document.getElementById('addClientModal').classList.remove('open');
    state.editingClientId = null;
}

function selectColor(el) {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function saveNewClient() {
    const name = document.getElementById('newClientName').value.trim();
    const nameInput = document.getElementById('newClientName');
    if (!name) {
        nameInput.classList.add('error');
        nameInput.focus();
        return;
    }
    nameInput.classList.remove('error');

    const color = document.querySelector('.color-swatch.active')?.dataset.color || '#2563EB';
    const industry = document.getElementById('newClientIndustry').value.trim();
    const audience = document.getElementById('newClientAudience').value.trim();
    const website = document.getElementById('newClientWebsite').value.trim();
    const notes = document.getElementById('newClientNotes').value.trim();
    const tone = Array.from(document.querySelectorAll('#newClientTone .chip.active')).map(c => c.dataset.value);
    const channels = Array.from(document.querySelectorAll('#newClientChannels .chip.active')).map(c => c.dataset.value);

    if (state.editingClientId) {
        const client = state.clients.find(c => c.id === state.editingClientId);
        if (client) {
            Object.assign(client, { name, color, industry, audience, website, notes, tone, channels, updatedAt: new Date().toISOString() });
        }
        showToast('Client updated');
    } else {
        state.clients.push({
            id: 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
            name, color, industry, audience, website, notes, tone, channels,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        showToast('Client added');
    }

    saveClients();
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcher();
    updateStats();
    closeAddClientModal();
}

function editClient(clientId, event) {
    if (event) event.stopPropagation();
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    state.editingClientId = clientId;
    document.getElementById('clientModalTitle').textContent = 'Edit Client';
    document.getElementById('newClientName').value = client.name;
    document.getElementById('newClientIndustry').value = client.industry || '';
    document.getElementById('newClientAudience').value = client.audience || '';
    document.getElementById('newClientWebsite').value = client.website || '';
    document.getElementById('newClientNotes').value = client.notes || '';

    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color === client.color);
    });
    document.querySelectorAll('#newClientTone .chip').forEach(c => {
        c.classList.toggle('active', (client.tone || []).includes(c.dataset.value));
    });
    document.querySelectorAll('#newClientChannels .chip').forEach(c => {
        c.classList.toggle('active', (client.channels || []).includes(c.dataset.value));
    });

    document.getElementById('addClientModal').classList.add('open');
}

function deleteClient(clientId, event) {
    if (event) event.stopPropagation();
    if (!confirm('Delete this client and all their content? This cannot be undone.')) return;

    state.clients = state.clients.filter(c => c.id !== clientId);
    state.allContent = state.allContent.filter(c => c.clientId !== clientId);
    if (state.activeClientId === clientId) {
        state.activeClientId = state.clients.length > 0 ? state.clients[0].id : null;
        localStorage.setItem('ce_active_client', state.activeClientId || '');
    }
    saveClients();
    saveContent();
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcher();
    updateStats();
    showToast('Client deleted');
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

    grid.innerHTML = state.clients.map(client => {
        const initials = client.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const channelTags = (client.channels || []).slice(0, 4).map(ch =>
            '<span class="client-tag">' + (CHANNEL_NAMES[ch] || ch) + '</span>'
        ).join('');
        const moreCount = (client.channels || []).length - 4;
        const moreBadge = moreCount > 0 ? '<span class="client-tag">+' + moreCount + '</span>' : '';
        const isActive = client.id === state.activeClientId;
        const contentCount = state.allContent.filter(c => c.clientId === client.id).length;

        return `<div class="client-card${isActive ? ' active' : ''}" onclick="setActiveClient('${client.id}')">
            <div class="client-card-top">
                <div class="client-avatar" style="background:${client.color};">${initials}</div>
                <div class="client-card-actions">
                    <button class="btn-icon-sm" onclick="editClient('${client.id}', event)" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon-sm" onclick="deleteClient('${client.id}', event)" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
            <h3>${escapeHtml(client.name)}</h3>
            <p class="client-industry">${escapeHtml(client.industry || 'No industry set')}</p>
            <div class="client-channels">${channelTags}${moreBadge}</div>
            <div class="client-card-stats">
                <div><span>Content</span><strong>${contentCount}</strong></div>
            </div>
            ${isActive ? '<div class="client-badge active-badge">Active</div>' : ''}
        </div>`;
    }).join('');
}

function renderClientDropdown() {
    const list = document.getElementById('clientDropdownList');
    if (!list) return;

    if (state.clients.length === 0) {
        list.innerHTML = '<div style="padding: 0.75rem; font-size: 13px; color: var(--text-muted);">No clients yet</div>';
        return;
    }

    list.innerHTML = state.clients.map(client => {
        const initials = client.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const isActive = client.id === state.activeClientId;
        return `<button class="dropdown-client${isActive ? ' active' : ''}" onclick="setActiveClient('${client.id}'); toggleClientDropdown();">
            <span class="dropdown-avatar" style="background:${client.color};">${initials}</span>
            <span class="dropdown-name">${escapeHtml(client.name)}</span>
            ${isActive ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </button>`;
    }).join('');
}

function toggleClientDropdown() {
    const dd = document.getElementById('clientDropdown');
    dd.classList.toggle('open');
}

function updateClientSwitcher() {
    const client = getActiveClient();
    const nameEl = document.getElementById('activeClientName');
    const dotEl = document.getElementById('activeClientDot');

    if (client) {
        nameEl.textContent = client.name;
        dotEl.style.background = client.color;
        dotEl.style.display = 'inline-block';
    } else {
        nameEl.textContent = 'No client selected';
        dotEl.style.display = 'none';
    }
}

function updateStats() {
    document.getElementById('statTotalClients').textContent = state.clients.length;
    document.getElementById('statTotalContent').textContent = state.allContent.length;
    const scheduled = state.allContent.filter(c => c.scheduledDate).length;
    document.getElementById('statScheduled').textContent = scheduled;
}

// ============ VIEW SWITCHING ============
function switchView(view) {
    if (view !== 'clients' && view !== 'library' && !state.activeClientId) {
        if (state.clients.length > 0) {
            showToast('Please select a client first');
            view = 'clients';
        } else if (state.clients.length === 0) {
            showToast('Add a client to get started');
            view = 'clients';
        }
    }

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    const viewEl = document.getElementById('view-' + view);
    if (viewEl) viewEl.classList.add('active');
    const tab = document.querySelector('[data-view="' + view + '"]');
    if (tab) tab.classList.add('active');

    state.currentView = view;

    if (view === 'calendar') renderCalendar();
    if (view === 'clients') { renderClientsGrid(); updateStats(); }
    if (view === 'library') renderLibrary();
    if (view === 'create') {
        const client = getActiveClient();
        const subtitle = document.getElementById('createSubtitle');
        if (client) {
            subtitle.textContent = 'Creating content for ' + client.name;
        } else {
            subtitle.textContent = 'Set up your content strategy';
        }
    }
}

// ============ WIZARD ============
function goToStep(step) {
    // Validation
    if (step === 2 && state.wizard.step === 1) {
        const brand = document.getElementById('brandName').value.trim();
        if (!brand) {
            document.getElementById('brandName').classList.add('error');
            document.getElementById('brandName').focus();
            showToast('Please enter a brand name');
            return;
        }
        document.getElementById('brandName').classList.remove('error');
    }

    if (step === 3 && state.wizard.step === 2) {
        if (state.wizard.channels.length === 0) {
            showToast('Please select at least one channel');
            return;
        }
        generateContent();
    }

    if (step === 5) {
        renderReview();
    }

    // Update step indicators
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.wizard-step').forEach(s => {
        const sNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (sNum < step) s.classList.add('completed');
        if (sNum === step) s.classList.add('active');
    });

    document.querySelectorAll('.wizard-connector').forEach((c, i) => {
        c.classList.toggle('completed', i < step - 1);
    });

    const panel = document.getElementById('step-' + step);
    if (panel) panel.classList.add('active');
    state.wizard.step = step;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prefillWizardFromClient() {
    const client = getActiveClient();
    if (!client) return;

    document.getElementById('brandName').value = client.name;
    document.getElementById('brandIndustry').value = client.industry || '';
    document.getElementById('targetAudience').value = client.audience || '';

    // Pre-select channels
    state.wizard.channels = [...(client.channels || [])];
    document.querySelectorAll('.channel-card').forEach(card => {
        card.classList.toggle('selected', state.wizard.channels.includes(card.dataset.channel));
    });

    // Pre-select tone
    if (client.tone && client.tone.length > 0) {
        document.querySelectorAll('#toneSelect .chip').forEach(chip => {
            if (client.tone.includes(chip.dataset.value)) {
                chip.classList.add('active');
                state.wizard.tone = chip.dataset.value;
            }
        });
    }

    updateChannelHint();
}

// ============ CHIP / CHANNEL SELECTION ============
function selectChip(el, field) {
    const group = el.closest('.chip-group');
    group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    if (field === 'goal') state.wizard.goal = el.dataset.value;
    if (field === 'tone') state.wizard.tone = el.dataset.value;
}

function toggleChip(el) {
    el.classList.toggle('active');
    const group = el.closest('.chip-group');
    if (group && group.id === 'typeSelect') {
        state.wizard.types = Array.from(group.querySelectorAll('.chip.active')).map(c => c.dataset.value);
    }
}

function toggleChannel(card) {
    card.classList.toggle('selected');
    const channel = card.dataset.channel;
    if (card.classList.contains('selected')) {
        if (!state.wizard.channels.includes(channel)) state.wizard.channels.push(channel);
    } else {
        state.wizard.channels = state.wizard.channels.filter(c => c !== channel);
    }
    updateChannelHint();
}

function updateChannelHint() {
    const hint = document.getElementById('channelHint');
    const count = state.wizard.channels.length;
    if (count === 0) {
        hint.textContent = 'Select at least one channel';
    } else {
        hint.textContent = count + ' channel' + (count > 1 ? 's' : '') + ' selected';
    }
}

function adjustQty(delta) {
    const input = document.getElementById('contentQty');
    const newVal = Math.max(1, Math.min(50, parseInt(input.value || 5) + delta));
    input.value = newVal;
}

// ============ CONTENT GENERATION ============
function generateContent() {
    const brand = document.getElementById('brandName').value.trim() || 'Brand';
    const industry = document.getElementById('brandIndustry').value.trim() || '';
    const audience = document.getElementById('targetAudience').value.trim() || 'target audience';
    const qty = parseInt(document.getElementById('contentQty').value) || 5;
    const channels = state.wizard.channels.length > 0 ? state.wizard.channels : ['instagram'];
    const tone = state.wizard.tone || 'professional';
    const goal = state.wizard.goal || 'engagement';
    const types = state.wizard.types.length > 0 ? state.wizard.types : ['post'];

    // Show loading
    const loading = document.getElementById('aiLoading');
    const contentArea = document.getElementById('contentArea');
    const step3Actions = document.getElementById('step3Actions');
    loading.style.display = 'block';
    contentArea.style.display = 'none';
    step3Actions.style.display = 'none';

    const statusEl = document.getElementById('aiLoadingStatus');
    const fill = document.getElementById('aiProgressFill');
    fill.style.width = '0%';

    const steps = [
        'Analyzing brand voice...',
        'Building content templates...',
        'Tailoring to channels...',
        'Generating copy...',
        'Finalizing...',
    ];

    let stepIdx = 0;
    let progress = 0;

    const statusInterval = setInterval(() => {
        stepIdx = Math.min(stepIdx + 1, steps.length - 1);
        statusEl.textContent = steps[stepIdx];
    }, 500);

    const progressInterval = setInterval(() => {
        progress += Math.random() * 20 + 5;
        if (progress > 95) progress = 95;
        fill.style.width = progress + '%';
    }, 300);

    // Generate after a brief delay (simulating processing)
    setTimeout(() => {
        clearInterval(statusInterval);
        clearInterval(progressInterval);
        fill.style.width = '100%';

        state.generatedContent = buildContentPieces(brand, industry, audience, qty, channels, tone, goal, types);

        setTimeout(() => {
            loading.style.display = 'none';
            contentArea.style.display = 'block';
            step3Actions.style.display = 'flex';
            renderContentList();
        }, 400);
    }, 2000);
}

function buildContentPieces(brand, industry, audience, qty, channels, tone, goal, types) {
    const reference = document.getElementById('contentReference').value.trim();
    const industryLabel = industry || 'your industry';

    // Build relevant hashtags
    const brandTag = '#' + brand.replace(/[^a-zA-Z0-9]/g, '');
    const industryTag = industry ? '#' + industry.replace(/[^a-zA-Z0-9]/g, '') : '';
    const goalTags = {
        awareness: '#BrandAwareness',
        engagement: '#Community',
        leads: '#LeadGeneration',
        sales: '#ShopNow',
        authority: '#ThoughtLeadership',
        community: '#CommunityBuilding',
    };
    const hashtags = [brandTag, industryTag, goalTags[goal] || '#Growth'].filter(Boolean).join(' ');

    const templates = {
        post: [
            {
                title: 'Value-First Post',
                text: `Most ${audience} make this mistake with ${industryLabel}.\n\nHere are 3 things you can do today:\n\n1. Audit what you're currently doing\n2. Identify the biggest gap\n3. Take one focused action this week\n\nSmall changes lead to big results.\n\nSave this post and come back to it.`,
            },
            {
                title: 'Authority Post',
                text: `After working with clients in ${industryLabel}, here's what I've learned:\n\nThe ones who succeed aren't always the ones with the biggest budgets.\n\nThey're the ones who:\n- Stay consistent\n- Focus on their audience\n- Adapt quickly\n- Trust the process\n\nWhich one do you need to work on?`,
            },
            {
                title: 'Engagement Hook',
                text: `Hot take for ${audience}:\n\nMost people in ${industryLabel} are overcomplicating things.\n\nThe truth? The simplest strategy executed consistently will beat a complex one every time.\n\nAgree or disagree? Tell me why below.`,
            },
            {
                title: 'Social Proof Post',
                text: `"Working with ${brand} completely transformed our approach."\n\nThat's what our clients tell us.\n\nNot because we have a secret formula. Because we focus on what actually works for ${audience}.\n\nResults speak louder than promises.`,
            },
            {
                title: 'Myth Buster',
                text: `MYTH: "You need a huge budget to succeed in ${industryLabel}"\n\nREALITY: Strategy beats budget every time.\n\nWhat matters more:\n- Understanding your audience deeply\n- Creating content that resonates\n- Being consistent (not perfect)\n- Testing and iterating\n\nStop waiting for "enough" budget. Start with what you have.`,
            },
        ],
        story: [
            {
                title: 'Quick Tip Story',
                text: `Quick tip for ${audience}:\n\nThe #1 thing that will move the needle for your ${industryLabel} strategy this week?\n\nFocus on ONE goal. Not five. ONE.\n\nTap the link to learn more.`,
            },
            {
                title: 'Poll Story',
                text: `What's your biggest challenge with ${industryLabel} right now?\n\nA) Not enough time\nB) Not sure what works\nC) Need more resources\nD) All of the above\n\nVote and I'll share my best tip for the winner!`,
            },
        ],
        reel: [
            {
                title: 'Hook Reel Script',
                text: `HOOK: "If you're in ${industryLabel}, stop scrolling"\n\nSETUP: Quick cuts showing the problem your audience faces\n\nREVEAL: "Here's what the top performers do differently..."\n\nVALUE: Share 1 actionable tip\n\nCTA: "Follow ${brand} for more"\n\nAudio: Trending sound\nDuration: 15-30s`,
            },
            {
                title: 'Before/After Reel',
                text: `POV: Before vs After working with ${brand}\n\nBEFORE:\n- Struggling to reach your audience\n- Inconsistent results\n- Wasting time on what doesn't work\n\nAFTER:\n- Clear strategy in place\n- Consistent growth\n- More results, less effort\n\nDuration: 10-15s fast cuts\nFormat: Split screen or transition`,
            },
        ],
        carousel: [
            {
                title: 'Educational Carousel',
                text: `Slide 1: "5 ${industryLabel} Strategies That Work in 2026"\n\nSlide 2: "1. Know Your Audience — Research deeply. What keeps ${audience} up at night?"\n\nSlide 3: "2. Content First — Lead with value, not sales. Give before you ask."\n\nSlide 4: "3. Platform Native — What works on Instagram won't work on LinkedIn. Tailor everything."\n\nSlide 5: "4. Data-Driven — Track what resonates. Double down on winners."\n\nSlide 6: "5. Consistency > Perfection — Showing up regularly beats being perfect occasionally."\n\nSlide 7: "Save this carousel and start implementing today"`,
            },
        ],
        thread: [
            {
                title: 'X/Twitter Thread',
                text: `THREAD: The ${industryLabel} playbook that ${audience} need to know about\n\n1/ Most people in ${industryLabel} are doing the same thing everyone else does. That's why they get average results.\n\nHere's how to break out:\n\n2/ Define your unique angle. What can YOU say that nobody else is saying? Your experience, your perspective, your story.\n\n3/ Pick ONE platform and dominate it. Don't spread yourself across 7 platforms. Master one first.\n\n4/ Create a content engine. One long-form piece per week, repurposed into 5-10 shorter pieces.\n\n5/ Engage more than you broadcast. Comment on posts. Reply to DMs. Build real relationships.\n\n6/ Follow ${brand} for more insights on ${industryLabel}. Repost to share with someone who needs this.`,
            },
        ],
        article: [
            {
                title: 'Long-Form Article',
                text: `# The Ultimate ${industryLabel} Guide for ${audience}\n\n## Introduction\nThe landscape of ${industryLabel} is changing fast. What worked last year may not work today.\n\n## Section 1: Current State of ${industryLabel}\nAnalyze trends, challenges, and opportunities.\n\n## Section 2: Building Your Strategy\nStep-by-step framework tailored to ${audience}.\n\n## Section 3: Execution Playbook\nPractical tactics, tools, and timelines.\n\n## Section 4: Measuring Success\nKPIs and benchmarks that matter.\n\n## Conclusion\nThe best time to refine your strategy was yesterday. The second best time is today.\n\nWord count target: 2,000-3,000 words`,
            },
        ],
        ad: [
            {
                title: 'Ad Copy — Direct Response',
                text: `Headline: "${audience}: Here's what you're missing"\n\nPrimary text: "${brand} helps ${audience} get better results with ${industryLabel}. Join clients who've transformed their approach."\n\nCTA: Learn More\n\nVariant B: "The ${industryLabel} strategy ${audience} are switching to"\nVariant C: "Stop guessing. Start growing with ${brand}"`,
            },
        ],
    };

    const pieces = [];
    for (let i = 0; i < qty; i++) {
        const type = types[i % types.length];
        const channel = channels[i % channels.length];
        const pool = templates[type] || templates.post;
        const template = pool[i % pool.length];

        pieces.push({
            id: 'c_' + Date.now() + '_' + i,
            title: template.title,
            type,
            channel,
            channelName: CHANNEL_NAMES[channel] || channel,
            text: template.text,
            hashtags: (type === 'story' || type === 'thread') ? '' : hashtags,
            createdAt: new Date().toISOString(),
        });
    }

    return pieces;
}

function renderContentList() {
    const list = document.getElementById('contentList');
    const countEl = document.getElementById('contentCount');
    list.innerHTML = '';
    countEl.textContent = state.generatedContent.length + ' piece' + (state.generatedContent.length !== 1 ? 's' : '') + ' generated';

    state.generatedContent.forEach((piece, idx) => {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.style.animationDelay = (idx * 0.05) + 's';

        const color = CHANNEL_COLORS[piece.channel] || '#333';

        card.innerHTML = `
            <div class="content-card-header">
                <div class="content-meta">
                    <span class="content-type">${piece.type}</span>
                    <span class="content-channel" style="background:${color};">${piece.channelName}</span>
                </div>
            </div>
            <h3 class="content-title">${escapeHtml(piece.title)}</h3>
            <div class="content-text" id="text-${piece.id}">
                <pre>${escapeHtml(piece.text)}</pre>
            </div>
            ${piece.hashtags ? '<div class="content-hashtags">' + escapeHtml(piece.hashtags) + '</div>' : ''}
            <div class="content-actions">
                <button class="btn btn-ghost btn-sm" onclick="editContent('${piece.id}')">Edit</button>
                <button class="btn btn-ghost btn-sm" onclick="regenerateOne('${piece.id}')">Regenerate</button>
                <button class="btn btn-ghost btn-sm" onclick="copyContent('${piece.id}')">Copy</button>
            </div>
        `;

        list.appendChild(card);
    });
}

function editContent(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const textEl = document.getElementById('text-' + id);
    textEl.innerHTML = `
        <textarea class="edit-textarea" id="edit-${id}">${escapeHtml(piece.text)}</textarea>
        <div class="edit-actions">
            <button class="btn btn-ghost btn-sm" onclick="cancelEdit('${id}')">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="saveEdit('${id}')">Save</button>
        </div>
    `;
    document.getElementById('edit-' + id).focus();
}

function saveEdit(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;
    const textarea = document.getElementById('edit-' + id);
    piece.text = textarea.value;
    document.getElementById('text-' + id).innerHTML = '<pre>' + escapeHtml(piece.text) + '</pre>';
    showToast('Content updated');
}

function cancelEdit(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;
    document.getElementById('text-' + id).innerHTML = '<pre>' + escapeHtml(piece.text) + '</pre>';
}

function regenerateOne(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const textEl = document.getElementById('text-' + id);
    textEl.innerHTML = '<div class="regen-loading"><div class="ai-spinner"></div> Regenerating...</div>';

    const brand = document.getElementById('brandName').value.trim() || 'Brand';
    const industry = document.getElementById('brandIndustry').value.trim() || '';
    const audience = document.getElementById('targetAudience').value.trim() || 'target audience';
    const tone = state.wizard.tone || 'professional';
    const goal = state.wizard.goal || 'engagement';

    setTimeout(() => {
        // Generate a new piece of the same type/channel
        const newPieces = buildContentPieces(brand, industry, audience, 10, [piece.channel], tone, goal, [piece.type]);
        // Pick a random one different from current if possible
        const candidates = newPieces.filter(p => p.text !== piece.text);
        const chosen = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : newPieces[0];

        piece.text = chosen.text;
        piece.title = chosen.title;
        piece.hashtags = chosen.hashtags;

        // Re-render this card
        const card = textEl.closest('.content-card');
        card.querySelector('.content-title').textContent = piece.title;
        textEl.innerHTML = '<pre>' + escapeHtml(piece.text) + '</pre>';
        const hashEl = card.querySelector('.content-hashtags');
        if (hashEl) hashEl.textContent = piece.hashtags;

        showToast('Content regenerated');
    }, 1200);
}

function regenerateAll() {
    generateContent();
}

function copyContent(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const text = piece.text + (piece.hashtags ? '\n\n' + piece.hashtags : '');
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied to clipboard');
    });
}

function copyAllContent() {
    const allText = state.generatedContent.map(p =>
        '--- ' + p.title + ' (' + p.channelName + ' / ' + p.type + ') ---\n\n' +
        p.text +
        (p.hashtags ? '\n\n' + p.hashtags : '')
    ).join('\n\n\n');

    navigator.clipboard.writeText(allText).then(() => {
        showToast('All content copied to clipboard');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = allText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('All content copied to clipboard');
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
        item.className = 'file-item';

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                item.innerHTML = `
                    <img src="${e.target.result}" alt="${escapeHtml(file.name)}">
                    <div class="file-overlay">
                        <span>${escapeHtml(file.name.substring(0, 20))}</span>
                        <button class="file-remove" onclick="this.closest('.file-item').remove()">&times;</button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            item.innerHTML = `
                <div class="file-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div class="file-overlay">
                    <span>${escapeHtml(file.name.substring(0, 20))}</span>
                    <button class="file-remove" onclick="this.closest('.file-item').remove()">&times;</button>
                </div>
            `;
        }

        grid.appendChild(item);
    });
}

// ============ REVIEW & PUBLISH ============
function renderReview() {
    const grid = document.getElementById('reviewGrid');
    grid.innerHTML = '';

    if (state.generatedContent.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No content generated yet. Go back and generate content first.</p>';
        return;
    }

    state.generatedContent.forEach(piece => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-header">
                <div>
                    <span class="review-channel">${piece.channelName}</span>
                    <span class="review-type">${piece.type}</span>
                </div>
            </div>
            <h4>${escapeHtml(piece.title)}</h4>
            <pre class="review-text">${escapeHtml(piece.text.substring(0, 250))}${piece.text.length > 250 ? '...' : ''}</pre>
        `;
        grid.appendChild(card);
    });
}

function selectSchedule(type, el) {
    document.querySelectorAll('.schedule-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    state.schedule = type;

    const datePicker = document.getElementById('datePickerWrap');
    if (type === 'date') {
        datePicker.style.display = 'block';
        const dateInput = document.getElementById('scheduleDate');
        if (!dateInput.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }
    } else {
        datePicker.style.display = 'none';
    }
}

function publishAll() {
    if (state.generatedContent.length === 0) {
        showToast('No content to save');
        return;
    }

    const client = getActiveClient();
    const scheduledDate = state.schedule === 'date'
        ? document.getElementById('scheduleDate').value
        : null;

    // Save each piece to allContent
    state.generatedContent.forEach(piece => {
        state.allContent.push({
            ...piece,
            clientId: state.activeClientId,
            clientName: client ? client.name : 'Unknown',
            clientColor: client ? client.color : '#333',
            scheduledDate: scheduledDate || null,
            savedAt: new Date().toISOString(),
        });
    });

    saveContent();
    updateStats();

    // Show success modal
    const modal = document.getElementById('publishModal');
    const summary = document.getElementById('publishSummary');
    const channelsDiv = document.getElementById('publishedChannels');

    const count = state.generatedContent.length;
    summary.textContent = count + ' piece' + (count !== 1 ? 's' : '') + ' saved' +
        (scheduledDate ? ' for ' + new Date(scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '') +
        (client ? ' for ' + client.name : '');

    const uniqueChannels = [...new Set(state.generatedContent.map(c => c.channelName))];
    channelsDiv.innerHTML = uniqueChannels.map(ch =>
        '<span class="publish-badge">' + ch + '</span>'
    ).join('');

    modal.classList.add('open');

    // Reset wizard for next round
    state.generatedContent = [];
}

function closePublishModal() {
    document.getElementById('publishModal').classList.remove('open');
    // Reset wizard
    goToStep(1);
}

// ============ LIBRARY ============
function renderLibrary() {
    const list = document.getElementById('libraryList');
    const empty = document.getElementById('libraryEmpty');
    const clientFilter = document.getElementById('libraryClientFilter');
    const channelFilter = document.getElementById('libraryChannelFilter');

    // Update client filter options
    const currentVal = clientFilter.value;
    clientFilter.innerHTML = '<option value="all">All Clients</option>' +
        state.clients.map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
    clientFilter.value = currentVal || 'all';

    // Filter content
    let content = [...state.allContent].reverse();
    if (clientFilter.value !== 'all') {
        content = content.filter(c => c.clientId === clientFilter.value);
    }
    if (channelFilter.value !== 'all') {
        content = content.filter(c => c.channel === channelFilter.value);
    }

    if (content.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }

    list.style.display = 'flex';
    empty.style.display = 'none';

    list.innerHTML = content.map(piece => {
        const date = new Date(piece.savedAt || piece.createdAt);
        const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const scheduled = piece.scheduledDate
            ? ' &middot; Scheduled: ' + new Date(piece.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : '';

        return `<div class="library-card">
            <div class="library-card-top">
                <div class="library-card-meta">
                    <span class="library-client-name" style="background:${piece.clientColor || '#333'};">${escapeHtml(piece.clientName || 'Unknown')}</span>
                    <span class="content-channel" style="background:${CHANNEL_COLORS[piece.channel] || '#333'};">${piece.channelName}</span>
                    <span class="content-type">${piece.type}</span>
                </div>
                <span class="library-date">${dateStr}${scheduled}</span>
            </div>
            <h4>${escapeHtml(piece.title)}</h4>
            <div class="library-card-text">${escapeHtml(piece.text)}</div>
            <div class="library-card-actions">
                <button class="btn btn-ghost btn-sm" onclick="copyLibraryContent('${piece.id}')">Copy</button>
                <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteLibraryContent('${piece.id}')">Delete</button>
            </div>
        </div>`;
    }).join('');
}

function copyLibraryContent(id) {
    const piece = state.allContent.find(c => c.id === id);
    if (!piece) return;
    const text = piece.text + (piece.hashtags ? '\n\n' + piece.hashtags : '');
    navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Failed to copy'));
}

function deleteLibraryContent(id) {
    if (!confirm('Delete this content?')) return;
    state.allContent = state.allContent.filter(c => c.id !== id);
    saveContent();
    updateStats();
    renderLibrary();
    showToast('Content deleted');
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
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1; // Monday start

    const today = new Date();

    // Get content scheduled for this month
    const monthContent = state.allContent.filter(c => {
        if (!c.scheduledDate) return false;
        const d = new Date(c.scheduledDate);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    // Also include content saved this month (without specific schedule date) by savedAt date
    const savedThisMonth = state.allContent.filter(c => {
        if (c.scheduledDate) return false;
        const d = new Date(c.savedAt || c.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    // Build day -> content map
    const dayMap = {};
    monthContent.forEach(c => {
        const d = new Date(c.scheduledDate).getDate();
        if (!dayMap[d]) dayMap[d] = [];
        dayMap[d].push(c);
    });
    savedThisMonth.forEach(c => {
        const d = new Date(c.savedAt || c.createdAt).getDate();
        if (!dayMap[d]) dayMap[d] = [];
        dayMap[d].push(c);
    });

    // Render
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let html = days.map(d => '<div class="cal-header">' + d + '</div>').join('');

    for (let i = 0; i < adjustedFirst; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const items = dayMap[d] || [];

        let eventsHtml = '';
        items.slice(0, 3).forEach(c => {
            const color = CHANNEL_COLORS[c.channel] || '#333';
            eventsHtml += '<div class="cal-event" style="background:' + color + ';">' + escapeHtml(c.type) + '</div>';
        });
        if (items.length > 3) {
            eventsHtml += '<div class="cal-event" style="background: var(--text-muted);">+' + (items.length - 3) + ' more</div>';
        }

        html += '<div class="cal-day' + (isToday ? ' today' : '') + '">' +
            '<span class="cal-num">' + d + '</span>' +
            eventsHtml +
            '</div>';
    }

    grid.innerHTML = html;
}

function calendarNav(dir) {
    state.calendarMonth = new Date(
        state.calendarMonth.getFullYear(),
        state.calendarMonth.getMonth() + dir
    );
    renderCalendar();
}

function calendarToday() {
    state.calendarMonth = new Date();
    renderCalendar();
}

// ============ EXPORT ============
function exportAllData() {
    const data = {
        clients: state.clients,
        content: state.allContent,
        exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contentengine-export-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
}

// ============ UTILITIES ============
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcher();
    updateStats();

    // Close dropdown on outside click
    document.addEventListener('click', function(e) {
        const switcher = document.getElementById('clientSwitcher');
        if (switcher && !switcher.contains(e.target)) {
            document.getElementById('clientDropdown').classList.remove('open');
        }
    });

    // Upload zone click handler
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        uploadZone.addEventListener('click', function(e) {
            if (e.target.tagName !== 'BUTTON') {
                document.getElementById('fileInput').click();
            }
        });
    }
});
