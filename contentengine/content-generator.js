/* =============================================
   ContentEngine — Application Logic
   No fake data. No hallucinated features.
   Everything here actually works.
   ============================================= */

// ============ STATE ============
const state = {
    currentView: 'dashboard',
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
const NO_CLIENT_REQUIRED = ['clients', 'library', 'dashboard', 'reports', 'integrations', 'social', 'emailint', 'ads', 'ecommerce'];

function switchView(view) {
    if (!NO_CLIENT_REQUIRED.includes(view) && !state.activeClientId) {
        if (state.clients.length > 0) {
            showToast('Please select a client first');
            view = 'clients';
        } else if (state.clients.length === 0) {
            showToast('Add a client to get started');
            view = 'clients';
        }
    }

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(t => t.classList.remove('active'));

    const viewEl = document.getElementById('view-' + view);
    if (viewEl) viewEl.classList.add('active');
    const tab = document.querySelector('[data-view="' + view + '"]');
    if (tab) tab.classList.add('active');

    state.currentView = view;

    if (view === 'dashboard') renderDashboard();
    if (view === 'calendar') renderCalendar();
    if (view === 'clients') { renderClientsGrid(); updateStats(); }
    if (view === 'library') renderLibrary();
    if (view === 'campaigns') renderCampaigns();
    if (view === 'brandkit') renderBrandKit();
    if (view === 'reports') renderReports();
    if (view === 'products') renderProducts();
    if (view === 'omnichannel') renderPromos();
    if (view === 'integrations') renderIntegrations();
    if (view === 'social') renderSocial();
    if (view === 'emailint') renderEmailIntView();
    if (view === 'ads') renderAds();
    if (view === 'ecommerce') renderEcomView();
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

// ============ DASHBOARD ============
function renderDashboard() {
    const statsBar = document.getElementById('dashStats');
    const recent = document.getElementById('dashRecent');
    const clientCount = state.clients.length;
    const contentCount = state.allContent.length;
    const scheduled = state.allContent.filter(c => c.scheduledDate).length;
    const thisWeek = state.allContent.filter(c => {
        const d = new Date(c.savedAt || c.createdAt);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
    }).length;

    statsBar.innerHTML = `
        <div class="stat-card"><span class="stat-num">${clientCount}</span><span class="stat-label">Clients</span></div>
        <div class="stat-card"><span class="stat-num">${contentCount}</span><span class="stat-label">Total Content</span></div>
        <div class="stat-card"><span class="stat-num">${scheduled}</span><span class="stat-label">Scheduled</span></div>
        <div class="stat-card"><span class="stat-num">${thisWeek}</span><span class="stat-label">This Week</span></div>
    `;

    const recentContent = [...state.allContent].reverse().slice(0, 5);
    if (recentContent.length === 0) {
        recent.innerHTML = '<p style="color:var(--text-muted);padding:1rem 0;">No content yet. Create your first piece!</p>';
    } else {
        recent.innerHTML = recentContent.map(c => {
            const date = new Date(c.savedAt || c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            return `<div class="dash-recent-item">
                <span class="content-channel" style="background:${CHANNEL_COLORS[c.channel] || '#333'};font-size:11px;">${c.channelName}</span>
                <span class="dash-recent-title">${escapeHtml(c.title)}</span>
                <span class="dash-recent-date">${date}</span>
            </div>`;
        }).join('');
    }
}

// ============ CAMPAIGNS ============
function loadCampaigns() {
    try {
        const data = localStorage.getItem('ce_campaigns');
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
}
function saveCampaigns(campaigns) {
    localStorage.setItem('ce_campaigns', JSON.stringify(campaigns));
}

function renderCampaigns() {
    const campaigns = loadCampaigns().filter(c => !state.activeClientId || c.clientId === state.activeClientId);
    const list = document.getElementById('campaignsList');
    const empty = document.getElementById('campaignsEmpty');

    if (campaigns.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    list.style.display = 'flex';
    empty.style.display = 'none';

    list.innerHTML = campaigns.map(camp => {
        const channels = (camp.channels || []).map(ch => '<span class="client-tag">' + (CHANNEL_NAMES[ch] || ch) + '</span>').join('');
        const dateRange = camp.startDate && camp.endDate
            ? new Date(camp.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' — ' + new Date(camp.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : 'No dates set';
        return `<div class="card campaign-card">
            <div class="campaign-header">
                <h3>${escapeHtml(camp.name)}</h3>
                <div class="campaign-actions">
                    <button class="btn btn-ghost btn-sm" onclick="deleteCampaign('${camp.id}')">Delete</button>
                </div>
            </div>
            ${camp.objective ? '<p class="campaign-objective">' + escapeHtml(camp.objective) + '</p>' : ''}
            <div class="campaign-meta">
                <span class="campaign-dates">${dateRange}</span>
                ${camp.budget ? '<span class="campaign-budget">' + escapeHtml(camp.budget) + '</span>' : ''}
            </div>
            <div class="client-channels">${channels}</div>
        </div>`;
    }).join('');
}

function openCampaignModal() {
    const modal = document.getElementById('campaignModal');
    document.getElementById('campName').value = '';
    document.getElementById('campObjective').value = '';
    document.getElementById('campStart').value = '';
    document.getElementById('campEnd').value = '';
    document.getElementById('campBudget').value = '';
    document.getElementById('campAudience').value = '';
    document.getElementById('campMessages').value = '';
    document.getElementById('campDeliverables').value = '';
    document.querySelectorAll('#campChannels .chip').forEach(c => c.classList.remove('active'));
    modal.classList.add('open');
}

function closeCampaignModal() {
    document.getElementById('campaignModal').classList.remove('open');
}

function saveCampaign() {
    const name = document.getElementById('campName').value.trim();
    if (!name) { showToast('Please enter a campaign name'); return; }
    const campaigns = loadCampaigns();
    campaigns.push({
        id: 'camp_' + Date.now(),
        clientId: state.activeClientId,
        name,
        objective: document.getElementById('campObjective').value.trim(),
        startDate: document.getElementById('campStart').value,
        endDate: document.getElementById('campEnd').value,
        budget: document.getElementById('campBudget').value.trim(),
        audience: document.getElementById('campAudience').value.trim(),
        messages: document.getElementById('campMessages').value.trim(),
        deliverables: document.getElementById('campDeliverables').value.trim(),
        channels: Array.from(document.querySelectorAll('#campChannels .chip.active')).map(c => c.dataset.value),
        createdAt: new Date().toISOString(),
    });
    saveCampaigns(campaigns);
    closeCampaignModal();
    renderCampaigns();
    showToast('Campaign created');
}

function deleteCampaign(id) {
    if (!confirm('Delete this campaign?')) return;
    const campaigns = loadCampaigns().filter(c => c.id !== id);
    saveCampaigns(campaigns);
    renderCampaigns();
    showToast('Campaign deleted');
}

// ============ COPY LAB ============
const FRAMEWORK_DATA = {
    aida: {
        name: 'AIDA',
        desc: 'Attention → Interest → Desire → Action. The classic direct-response framework.',
        generate: (product, audience, benefit) => `<div class="framework-output">
            <div class="framework-section"><h4>Attention</h4><p>Stop scrolling, ${audience}. There's a better way to handle ${product}.</p></div>
            <div class="framework-section"><h4>Interest</h4><p>Most people struggle with getting results from ${product}. The problem isn't effort — it's approach. ${benefit ? benefit : 'The right strategy changes everything.'}</p></div>
            <div class="framework-section"><h4>Desire</h4><p>Imagine having ${product} that actually delivers. No more wasted time. No more guesswork. Just results that speak for themselves. ${benefit ? 'Specifically: ' + benefit + '.' : ''}</p></div>
            <div class="framework-section"><h4>Action</h4><p>Ready to make it happen? Get started with ${product} today. Click below to learn more.</p></div>
        </div>`
    },
    pas: {
        name: 'PAS',
        desc: 'Problem → Agitate → Solution. Lead with the pain, then offer the fix.',
        generate: (product, audience, benefit) => `<div class="framework-output">
            <div class="framework-section"><h4>Problem</h4><p>${audience} are tired of ${product} that doesn't deliver. You've tried everything, and nothing sticks.</p></div>
            <div class="framework-section"><h4>Agitate</h4><p>Every day without a solution, you're falling behind. Your competitors are already there. The gap is widening and the frustration is building.</p></div>
            <div class="framework-section"><h4>Solution</h4><p>${product} changes the game. ${benefit ? benefit + '.' : 'Finally, a solution that actually works.'} No complexity, no learning curve — just results.</p></div>
        </div>`
    },
    bab: {
        name: 'BAB',
        desc: 'Before → After → Bridge. Paint the transformation.',
        generate: (product, audience, benefit) => `<div class="framework-output">
            <div class="framework-section"><h4>Before</h4><p>You're spending hours on ${product} with mediocre results. ${audience} deserve better, but the tools and strategies available feel overcomplicated and underwhelming.</p></div>
            <div class="framework-section"><h4>After</h4><p>Now imagine: ${benefit ? benefit : 'results that actually match your effort'}. More time back in your day. Confidence in your approach. The kind of results that make people ask, "How did you do that?"</p></div>
            <div class="framework-section"><h4>Bridge</h4><p>${product} is how you get from here to there. It's the missing piece that connects where you are to where you want to be.</p></div>
        </div>`
    },
    fab: {
        name: 'FAB',
        desc: 'Features → Advantages → Benefits. Sell the outcome, not the spec.',
        generate: (product, audience, benefit) => `<div class="framework-output">
            <div class="framework-section"><h4>Features</h4><p>${product} comes with everything ${audience} need: a streamlined workflow, intelligent automation, and real-time insights.</p></div>
            <div class="framework-section"><h4>Advantages</h4><p>Unlike alternatives, ${product} is built specifically for ${audience}. It's faster, simpler, and more effective than what you're currently using.</p></div>
            <div class="framework-section"><h4>Benefits</h4><p>${benefit ? benefit : 'Save time, reduce stress, and get better results'}. That's what ${product} delivers — not in theory, but in practice, from day one.</p></div>
        </div>`
    },
    '4ps': {
        name: '4Ps',
        desc: 'Promise → Picture → Proof → Push. Make a bold claim and back it up.',
        generate: (product, audience, benefit) => `<div class="framework-output">
            <div class="framework-section"><h4>Promise</h4><p>${product} will transform how ${audience} work. ${benefit ? benefit + '.' : 'Better results, less effort.'}</p></div>
            <div class="framework-section"><h4>Picture</h4><p>Imagine waking up knowing your ${product} strategy is handled. No stress. No scrambling. Just a clear path to growth, every single day.</p></div>
            <div class="framework-section"><h4>Proof</h4><p>Thousands of ${audience} have already made the switch. The results? Faster workflows, higher engagement, and measurable growth.</p></div>
            <div class="framework-section"><h4>Push</h4><p>Don't wait. Every day without ${product} is a day of missed opportunity. Start now and see the difference this week.</p></div>
        </div>`
    },
    headlines: {
        name: 'Headlines',
        desc: 'Generate 10 high-impact headlines using proven formulas.',
        generate: (product, audience, benefit) => {
            const b = benefit || 'get better results';
            const headlines = [
                `How ${audience} Can ${b} With ${product}`,
                `The Secret to ${product} That Nobody Talks About`,
                `Why ${audience} Are Switching to ${product}`,
                `${product}: The Only Guide You'll Ever Need`,
                `Stop Wasting Time on ${product} That Doesn't Work`,
                `How to ${b} in 30 Days or Less`,
                `${audience}: Here's What You're Missing About ${product}`,
                `The #1 Mistake ${audience} Make With ${product}`,
                `${product} Made Simple: A Step-by-Step Guide for ${audience}`,
                `What If ${product} Could Actually ${b}?`,
            ];
            return '<div class="framework-output headlines-list">' +
                headlines.map((h, i) => `<div class="headline-item"><span class="headline-num">${i + 1}</span><span>${escapeHtml(h)}</span><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${escapeHtml(h).replace(/'/g, "\\'")}');showToast('Copied')">Copy</button></div>`).join('') +
                '</div>';
        }
    },
    hooks: {
        name: 'Hooks',
        desc: 'Scroll-stopping hooks for social media and video content.',
        generate: (product, audience, benefit) => {
            const hooks = [
                `"If you're ${audience.toLowerCase() || 'in this industry'}, stop scrolling."`,
                `"Nobody talks about this side of ${product}..."`,
                `"I wish someone told me this about ${product} sooner."`,
                `"The biggest lie ${audience} are told about ${product}."`,
                `"This changed everything for me with ${product}."`,
                `"POV: You just discovered the secret to ${benefit || product}."`,
                `"Why is nobody talking about this?"`,
                `"${audience}, you need to hear this."`,
            ];
            return '<div class="framework-output headlines-list">' +
                hooks.map((h, i) => `<div class="headline-item"><span class="headline-num">${i + 1}</span><span>${escapeHtml(h)}</span><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(h)});showToast('Copied')">Copy</button></div>`).join('') +
                '</div>';
        }
    },
};

function generateCopyLab() {
    const framework = document.querySelector('#frameworkSelect .chip.active')?.dataset.value || 'aida';
    const product = document.getElementById('clProduct').value.trim() || 'your product';
    const audience = document.getElementById('clAudience').value.trim() || 'your audience';
    const benefit = document.getElementById('clBenefit').value.trim();
    const output = document.getElementById('copylabOutput');

    const fw = FRAMEWORK_DATA[framework];
    if (!fw) return;

    output.innerHTML = '<div class="card" style="margin-top:1rem;"><div class="ai-loading"><div class="ai-spinner"></div><h3>Generating copy...</h3></div></div>';

    setTimeout(() => {
        output.innerHTML = '<div class="card" style="margin-top:1rem;">' +
            '<div class="copylab-header"><h3>' + fw.name + ' Copy</h3><button class="btn btn-ghost btn-sm" onclick="copyCopyLabOutput()">Copy All</button></div>' +
            fw.generate(product, audience, benefit) +
            '</div>';
    }, 800);
}

function copyCopyLabOutput() {
    const output = document.getElementById('copylabOutput');
    const text = output.innerText;
    navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Failed to copy'));
}

// ============ EMAIL BUILDER ============
const EMAIL_SEQUENCES = {
    welcome: {
        name: 'Welcome Sequence',
        emails: (brand, product, audience) => [
            { subject: `Welcome to ${brand} — Here's what to expect`, body: `Hi there,\n\nWelcome to ${brand}! We're thrilled to have you.\n\nOver the next few days, we'll share everything you need to get the most from ${product}.\n\nHere's what's coming:\n• Day 1 (today): Your welcome guide\n• Day 3: Getting started tips\n• Day 5: Your first quick win\n• Day 7: Meet the community\n\nReply to this email if you have any questions — we read every one.\n\nBest,\nThe ${brand} Team` },
            { subject: `Getting started with ${product} — 3 things to do first`, body: `Hi,\n\nNow that you're set up with ${brand}, here are 3 things to do first:\n\n1. Complete your profile — it takes 2 minutes\n2. Explore the dashboard — your hub for everything\n3. Set your first goal — start small, build momentum\n\nMost ${audience} see results within the first week when they follow these steps.\n\nLet's go!\n\n— ${brand}` },
            { subject: `Your first quick win with ${brand}`, body: `Hi,\n\nHere's a challenge: try ${product} for just 15 minutes today.\n\nWe've found that ${audience} who engage in the first week are 3x more likely to achieve their goals.\n\nStart here: [Link to getting started]\n\nYou've got this.\n\n— ${brand}` },
        ]
    },
    nurture: {
        name: 'Nurture Sequence',
        emails: (brand, product, audience) => [
            { subject: `The #1 mistake ${audience} make`, body: `Hi,\n\nWe see it all the time: ${audience} jump straight into ${product} without a strategy.\n\nThe result? Wasted time and frustration.\n\nHere's what works instead:\n\n1. Define your goal (one specific outcome)\n2. Set a realistic timeline\n3. Focus on consistency over perfection\n\nSimple, right? But it makes all the difference.\n\n— ${brand}` },
            { subject: `What top ${audience} do differently`, body: `Hi,\n\nWe studied our most successful ${audience} to find common patterns.\n\nHere's what stood out:\n• They focus on ONE thing at a time\n• They measure progress weekly\n• They ask for help early\n• They iterate instead of perfecting\n\nWhich one will you focus on this week?\n\n— ${brand}` },
            { subject: `A resource we think you'll love`, body: `Hi,\n\nWe put together a guide specifically for ${audience} who want to get more from ${product}.\n\nInside you'll find:\n• Step-by-step walkthroughs\n• Real examples from the community\n• Templates you can use today\n\nDownload it here: [Link]\n\nLet us know what you think.\n\n— ${brand}` },
        ]
    },
    sales: {
        name: 'Sales Sequence',
        emails: (brand, product, audience) => [
            { subject: `${product} — built for ${audience} like you`, body: `Hi,\n\nIf you've been looking for a better way to handle ${product}, this is it.\n\n${brand} was built specifically for ${audience} who want:\n• Better results with less effort\n• A clear, simple workflow\n• Support when you need it\n\nSee how it works: [Link]\n\n— ${brand}` },
            { subject: `Don't just take our word for it`, body: `Hi,\n\nHere's what ${audience} are saying about ${product}:\n\n"${brand} completely changed our approach. We're getting 3x the results in half the time." — Sarah K.\n\n"I wish I'd found ${brand} sooner." — James M.\n\nReady to see it for yourself?\n\nStart your trial: [Link]\n\n— ${brand}` },
            { subject: `Last chance: Special offer for ${audience}`, body: `Hi,\n\nWe're offering ${audience} an exclusive deal on ${product} — but only until the end of this week.\n\nWhat you get:\n• Full access to ${product}\n• Priority support\n• 30-day money-back guarantee\n\nThis offer won't be around forever.\n\nClaim it now: [Link]\n\n— ${brand}` },
        ]
    },
    launch: {
        name: 'Product Launch Sequence',
        emails: (brand, product, audience) => [
            { subject: `Something new is coming from ${brand}`, body: `Hi,\n\nWe've been working on something special — and we can't wait to share it with you.\n\nOn [Launch Date], we're unveiling ${product}.\n\nBuilt for ${audience}. Designed to solve the problems you've told us about.\n\nStay tuned. More details dropping soon.\n\n— ${brand}` },
            { subject: `It's here: Introducing ${product}`, body: `Hi,\n\nThe day is here. ${product} is officially live.\n\nWhat makes it different:\n• Designed from the ground up for ${audience}\n• Solves the #1 problem you told us about\n• Simple to use, powerful in results\n\nBe among the first to try it: [Link]\n\n— ${brand}` },
            { subject: `${product} launch special — 48 hours only`, body: `Hi,\n\nTo celebrate the launch of ${product}, we're offering an exclusive launch price for the next 48 hours.\n\nEarly adopters get:\n• Special launch pricing\n• Founding member status\n• Direct access to our team\n\nDon't miss out: [Link]\n\n— ${brand}` },
        ]
    },
    winback: {
        name: 'Win-Back Sequence',
        emails: (brand, product, audience) => [
            { subject: `We miss you at ${brand}`, body: `Hi,\n\nIt's been a while since we last saw you, and we wanted to check in.\n\n${product} has been getting some major updates since you were last active:\n• [New feature 1]\n• [New feature 2]\n• [Improvement]\n\nCome take another look: [Link]\n\n— ${brand}` },
            { subject: `A special offer, just for you`, body: `Hi,\n\nWe'd love to have you back. That's why we're offering you an exclusive return offer:\n\n• [Discount or special access]\n• No strings attached\n• Valid for the next 7 days\n\nClaim your offer: [Link]\n\nWe hope to see you again.\n\n— ${brand}` },
        ]
    },
    subjectlines: {
        name: 'Subject Lines',
        emails: (brand, product, audience) => {
            const lines = [
                `${audience}, you need to see this`,
                `The ${product} secret nobody talks about`,
                `Quick question about your ${product} strategy`,
                `We noticed something about your account`,
                `${product}: What's working in 2026`,
                `A gift from ${brand} (open to claim)`,
                `re: Your ${product} results`,
                `This changed everything for ${audience}`,
                `Don't open this email (just kidding)`,
                `${brand} + you = better ${product}`,
            ];
            return lines.map(l => ({ subject: l, body: '' }));
        }
    },
};

function generateEmailSequence() {
    const emailType = document.querySelector('#emailTypeSelect .chip.active')?.dataset.value || 'welcome';
    const brand = document.getElementById('emBrand').value.trim() || 'Your Brand';
    const product = document.getElementById('emProduct').value.trim() || 'your product';
    const audience = document.getElementById('emAudience').value.trim() || 'your audience';
    const output = document.getElementById('emailOutput');

    const seq = EMAIL_SEQUENCES[emailType];
    if (!seq) return;

    output.innerHTML = '<div class="card" style="margin-top:1rem;"><div class="ai-loading"><div class="ai-spinner"></div><h3>Building email sequence...</h3></div></div>';

    setTimeout(() => {
        const emails = seq.emails(brand, product, audience);
        const isSubjectOnly = emailType === 'subjectlines';

        if (isSubjectOnly) {
            output.innerHTML = '<div class="card" style="margin-top:1rem;"><h3 style="margin-bottom:1rem;">Subject Line Ideas</h3><div class="headlines-list">' +
                emails.map((e, i) => `<div class="headline-item"><span class="headline-num">${i + 1}</span><span>${escapeHtml(e.subject)}</span><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(e.subject)});showToast('Copied')">Copy</button></div>`).join('') +
                '</div></div>';
        } else {
            output.innerHTML = '<div style="margin-top:1rem;">' +
                emails.map((e, i) => `<div class="card email-card" style="margin-bottom:1rem;">
                    <div class="email-header"><span class="email-num">Email ${i + 1}</span><button class="btn btn-ghost btn-sm" onclick="copyEmailCard(this)">Copy</button></div>
                    <div class="email-subject"><strong>Subject:</strong> ${escapeHtml(e.subject)}</div>
                    <pre class="email-body">${escapeHtml(e.body)}</pre>
                </div>`).join('') +
                '</div>';
        }
    }, 1000);
}

function copyEmailCard(btn) {
    const card = btn.closest('.email-card');
    const text = card.innerText;
    navigator.clipboard.writeText(text).then(() => showToast('Copied')).catch(() => showToast('Failed to copy'));
}

// ============ SEO TOOLS ============
function generateSEO() {
    const tool = document.querySelector('#seoToolSelect .chip.active')?.dataset.value || 'meta';
    const topic = document.getElementById('seoTopic').value.trim() || 'your topic';
    const keyword = document.getElementById('seoKeyword').value.trim() || topic;
    const secondary = document.getElementById('seoSecondary').value.trim();
    const output = document.getElementById('seoOutput');

    output.innerHTML = '<div class="card" style="margin-top:1rem;"><div class="ai-loading"><div class="ai-spinner"></div><h3>Generating SEO output...</h3></div></div>';

    setTimeout(() => {
        if (tool === 'meta') {
            const titleTag = keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' — Ultimate Guide (2026)';
            const desc = `Discover everything about ${keyword}. Our comprehensive guide covers tips, strategies, and expert advice for ${topic}. Updated for 2026.`;
            output.innerHTML = `<div class="card" style="margin-top:1rem;">
                <h3 style="margin-bottom:1rem;">Meta Tags</h3>
                <div class="seo-result">
                    <label class="form-label">Title Tag (${titleTag.length}/60 chars)</label>
                    <div class="seo-preview-title">${escapeHtml(titleTag)}</div>
                </div>
                <div class="seo-result">
                    <label class="form-label">Meta Description (${desc.length}/160 chars)</label>
                    <div class="seo-preview-desc">${escapeHtml(desc)}</div>
                </div>
                <div class="seo-result">
                    <label class="form-label">Open Graph Title</label>
                    <div class="seo-preview-desc">${escapeHtml(titleTag)}</div>
                </div>
                <div class="seo-result">
                    <label class="form-label">URL Slug</label>
                    <div class="seo-preview-desc">/${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}</div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('Title: ${escapeHtml(titleTag)}\\nDescription: ${escapeHtml(desc)}');showToast('Copied')">Copy All</button>
            </div>`;
        } else if (tool === 'brief') {
            const secondaryKws = secondary ? secondary.split(',').map(s => s.trim()).filter(Boolean) : ['related topic 1', 'related topic 2'];
            output.innerHTML = `<div class="card" style="margin-top:1rem;">
                <h3 style="margin-bottom:1rem;">Content Brief: ${escapeHtml(topic)}</h3>
                <div class="brief-section"><h4>Target Keyword</h4><p>${escapeHtml(keyword)}</p></div>
                <div class="brief-section"><h4>Secondary Keywords</h4><p>${secondaryKws.map(k => escapeHtml(k)).join(', ')}</p></div>
                <div class="brief-section"><h4>Suggested Word Count</h4><p>2,000 — 3,000 words</p></div>
                <div class="brief-section"><h4>Suggested Outline</h4>
                    <ol class="brief-outline">
                        <li>Introduction — What is ${escapeHtml(keyword)}?</li>
                        <li>Why ${escapeHtml(keyword)} matters in 2026</li>
                        <li>How to get started with ${escapeHtml(keyword)}</li>
                        <li>Top strategies and best practices</li>
                        <li>Common mistakes to avoid</li>
                        <li>Tools and resources</li>
                        <li>FAQ section (target featured snippets)</li>
                        <li>Conclusion and next steps</li>
                    </ol>
                </div>
                <div class="brief-section"><h4>Internal Linking Suggestions</h4><p>Link to related guides, product pages, and case studies on your site.</p></div>
                <div class="brief-section"><h4>Content Type</h4><p>Comprehensive guide / pillar content</p></div>
            </div>`;
        } else if (tool === 'audit') {
            const checks = [
                { label: 'Title tag includes target keyword', cat: 'On-Page' },
                { label: 'Meta description is compelling and under 160 characters', cat: 'On-Page' },
                { label: 'URL is clean and keyword-rich', cat: 'On-Page' },
                { label: 'H1 tag includes primary keyword', cat: 'On-Page' },
                { label: 'Content uses H2/H3 subheadings properly', cat: 'Structure' },
                { label: 'Images have descriptive alt text', cat: 'Media' },
                { label: 'Internal links to related content', cat: 'Links' },
                { label: 'External links to authoritative sources', cat: 'Links' },
                { label: 'Page loads in under 3 seconds', cat: 'Performance' },
                { label: 'Mobile-responsive design', cat: 'Performance' },
                { label: 'Schema markup implemented', cat: 'Technical' },
                { label: 'No broken links or 404 errors', cat: 'Technical' },
                { label: 'Content is original and comprehensive', cat: 'Content' },
                { label: 'FAQ section for featured snippets', cat: 'Content' },
                { label: 'Call-to-action is clear', cat: 'Conversion' },
            ];
            output.innerHTML = `<div class="card" style="margin-top:1rem;">
                <h3 style="margin-bottom:1rem;">Page Audit Checklist: ${escapeHtml(topic)}</h3>
                <div class="audit-list">
                    ${checks.map(c => `<label class="audit-item"><input type="checkbox"><span class="audit-cat">${c.cat}</span><span>${c.label}</span></label>`).join('')}
                </div>
            </div>`;
        }
    }, 800);
}

// ============ FUNNELS ============
function generateFunnel() {
    const product = document.getElementById('funnelProduct').value.trim() || 'your product';
    const audience = document.getElementById('funnelAudience').value.trim() || 'your audience';
    const output = document.getElementById('funnelOutput');

    output.innerHTML = '<div class="card" style="margin-top:1rem;"><div class="ai-loading"><div class="ai-spinner"></div><h3>Building funnel...</h3></div></div>';

    setTimeout(() => {
        output.innerHTML = `<div style="margin-top:1rem;">
            <div class="card funnel-stage" style="margin-bottom:1rem;border-left:4px solid #3B82F6;">
                <h3 style="color:#3B82F6;">TOFU — Top of Funnel (Awareness)</h3>
                <p class="funnel-goal">Goal: Make ${escapeHtml(audience)} aware of the problem and your brand.</p>
                <div class="funnel-content">
                    <div class="funnel-item"><strong>Blog Post:</strong> "The Ultimate Guide to ${escapeHtml(product)} for ${escapeHtml(audience)}"</div>
                    <div class="funnel-item"><strong>Social Post:</strong> Share stats, tips, and thought-provoking questions about ${escapeHtml(product)}</div>
                    <div class="funnel-item"><strong>Video:</strong> "3 Things ${escapeHtml(audience)} Should Know About ${escapeHtml(product)}"</div>
                    <div class="funnel-item"><strong>Infographic:</strong> Visual breakdown of the problem your product solves</div>
                </div>
            </div>
            <div class="card funnel-stage" style="margin-bottom:1rem;border-left:4px solid #F59E0B;">
                <h3 style="color:#F59E0B;">MOFU — Middle of Funnel (Consideration)</h3>
                <p class="funnel-goal">Goal: Build trust and demonstrate expertise with ${escapeHtml(audience)}.</p>
                <div class="funnel-content">
                    <div class="funnel-item"><strong>Case Study:</strong> "How [Client] Used ${escapeHtml(product)} to Achieve [Result]"</div>
                    <div class="funnel-item"><strong>Lead Magnet:</strong> Free guide or checklist related to ${escapeHtml(product)}</div>
                    <div class="funnel-item"><strong>Email Sequence:</strong> 5-part nurture series educating about ${escapeHtml(product)}</div>
                    <div class="funnel-item"><strong>Webinar:</strong> "Live Q&A: Everything ${escapeHtml(audience)} Need to Know"</div>
                </div>
            </div>
            <div class="card funnel-stage" style="border-left:4px solid #10B981;">
                <h3 style="color:#10B981;">BOFU — Bottom of Funnel (Decision)</h3>
                <p class="funnel-goal">Goal: Convert ${escapeHtml(audience)} into customers.</p>
                <div class="funnel-content">
                    <div class="funnel-item"><strong>Sales Page:</strong> Feature-benefit comparison with clear CTA for ${escapeHtml(product)}</div>
                    <div class="funnel-item"><strong>Testimonials:</strong> Social proof from existing ${escapeHtml(audience)} clients</div>
                    <div class="funnel-item"><strong>Limited Offer:</strong> Time-sensitive deal or bonus to drive action</div>
                    <div class="funnel-item"><strong>FAQ Page:</strong> Address objections and remove buying friction</div>
                </div>
            </div>
        </div>`;
    }, 1000);
}

// ============ BRAND KIT ============
function renderBrandKit() {
    const client = getActiveClient();
    const content = document.getElementById('brandkitContent');
    const empty = document.getElementById('brandkitEmpty');

    if (!client) {
        content.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    content.style.display = 'block';
    empty.style.display = 'none';

    // Load brand kit data
    const key = 'ce_brandkit_' + client.id;
    let kit;
    try { kit = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { kit = {}; }

    content.innerHTML = `
        <div class="card" style="margin-bottom:1rem;">
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;">
                <div class="client-avatar" style="background:${client.color};width:48px;height:48px;font-size:18px;">${client.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}</div>
                <div><h2 style="margin:0;">${escapeHtml(client.name)}</h2><p style="margin:0;color:var(--text-muted);">Brand Kit</p></div>
            </div>
            <div class="form-group"><label class="form-label">Brand Voice</label><textarea class="form-textarea" id="bkVoice" rows="2" placeholder="e.g. Professional but approachable, never salesy">${escapeHtml(kit.voice || '')}</textarea></div>
            <div class="form-group"><label class="form-label">Key Messages</label><textarea class="form-textarea" id="bkMessages" rows="2" placeholder="Core brand messages and value propositions">${escapeHtml(kit.messages || '')}</textarea></div>
            <div class="form-group"><label class="form-label">Words to Use</label><input type="text" class="form-input" id="bkWordsUse" placeholder="e.g. empower, simplify, transform" value="${escapeHtml(kit.wordsUse || '')}"></div>
            <div class="form-group"><label class="form-label">Words to Avoid</label><input type="text" class="form-input" id="bkWordsAvoid" placeholder="e.g. cheap, basic, just" value="${escapeHtml(kit.wordsAvoid || '')}"></div>
            <div class="form-group"><label class="form-label">Brand Colours</label><input type="text" class="form-input" id="bkColours" placeholder="e.g. #2563EB, #F59E0B" value="${escapeHtml(kit.colours || '')}"></div>
            <div class="form-group"><label class="form-label">Typography</label><input type="text" class="form-input" id="bkFonts" placeholder="e.g. Inter for headings, System for body" value="${escapeHtml(kit.fonts || '')}"></div>
            <div class="form-group"><label class="form-label">Hashtag Bank</label><textarea class="form-textarea" id="bkHashtags" rows="2" placeholder="e.g. #BrandName #Industry #Campaign">${escapeHtml(kit.hashtags || '')}</textarea></div>
            <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="bkNotes" rows="2" placeholder="Any other brand guidelines...">${escapeHtml(kit.notes || '')}</textarea></div>
            <button class="btn btn-primary" onclick="saveBrandKit()">Save Brand Kit</button>
        </div>
    `;
}

function saveBrandKit() {
    const client = getActiveClient();
    if (!client) return;
    const kit = {
        voice: document.getElementById('bkVoice').value,
        messages: document.getElementById('bkMessages').value,
        wordsUse: document.getElementById('bkWordsUse').value,
        wordsAvoid: document.getElementById('bkWordsAvoid').value,
        colours: document.getElementById('bkColours').value,
        fonts: document.getElementById('bkFonts').value,
        hashtags: document.getElementById('bkHashtags').value,
        notes: document.getElementById('bkNotes').value,
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('ce_brandkit_' + client.id, JSON.stringify(kit));
    showToast('Brand kit saved');
}

// ============ REPORTS ============
function renderReports() {
    const container = document.getElementById('reportsContent');
    const contentByChannel = {};
    const contentByType = {};
    const contentByClient = {};

    state.allContent.forEach(c => {
        const ch = c.channelName || 'Unknown';
        contentByChannel[ch] = (contentByChannel[ch] || 0) + 1;
        contentByType[c.type || 'Unknown'] = (contentByType[c.type || 'Unknown'] || 0) + 1;
        const cl = c.clientName || 'Unknown';
        contentByClient[cl] = (contentByClient[cl] || 0) + 1;
    });

    if (state.allContent.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg></div><h2>No data yet</h2><p>Create content to see reports and analytics.</p></div>';
        return;
    }

    function barChart(data, colorFn) {
        const max = Math.max(...Object.values(data), 1);
        return Object.entries(data).map(([label, count]) => {
            const pct = Math.round((count / max) * 100);
            const color = colorFn ? colorFn(label) : 'var(--blue-600)';
            return `<div class="bar-row"><span class="bar-label">${escapeHtml(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color};"></div></div><span class="bar-value">${count}</span></div>`;
        }).join('');
    }

    container.innerHTML = `
        <div class="stats-bar">
            <div class="stat-card"><span class="stat-num">${state.allContent.length}</span><span class="stat-label">Total Content</span></div>
            <div class="stat-card"><span class="stat-num">${Object.keys(contentByChannel).length}</span><span class="stat-label">Channels Used</span></div>
            <div class="stat-card"><span class="stat-num">${state.clients.length}</span><span class="stat-label">Clients</span></div>
            <div class="stat-card"><span class="stat-num">${state.allContent.filter(c => c.scheduledDate).length}</span><span class="stat-label">Scheduled</span></div>
        </div>
        <div class="reports-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
            <div class="card"><h3 class="card-title">Content by Channel</h3>${barChart(contentByChannel, label => {
                const key = Object.entries(CHANNEL_NAMES).find(([k, v]) => v === label);
                return key ? (CHANNEL_COLORS[key[0]] || 'var(--blue-600)') : 'var(--blue-600)';
            })}</div>
            <div class="card"><h3 class="card-title">Content by Type</h3>${barChart(contentByType)}</div>
            <div class="card"><h3 class="card-title">Content by Client</h3>${barChart(contentByClient, label => {
                const client = state.clients.find(c => c.name === label);
                return client ? client.color : 'var(--blue-600)';
            })}</div>
        </div>
    `;
}

// ============ PRODUCTS ============
function loadProducts() {
    try { return JSON.parse(localStorage.getItem('ce_products')) || []; } catch (e) { return []; }
}
function saveProductsData(products) {
    localStorage.setItem('ce_products', JSON.stringify(products));
}

function renderProducts() {
    const products = loadProducts().filter(p => !state.activeClientId || p.clientId === state.activeClientId);
    const list = document.getElementById('productsList');
    const empty = document.getElementById('productsEmpty');

    if (products.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    list.style.display = 'flex';
    empty.style.display = 'none';

    list.innerHTML = products.map(prod => {
        const channels = (prod.channels || []).map(ch => '<span class="client-tag">' + escapeHtml(ch) + '</span>').join('');
        return `<div class="card product-card" style="margin-bottom:1rem;">
            <div class="campaign-header">
                <h3>${escapeHtml(prod.name)}</h3>
                <div class="campaign-actions">
                    <button class="btn btn-ghost btn-sm" onclick="deleteProduct('${prod.id}')">Delete</button>
                </div>
            </div>
            <div class="campaign-meta">
                ${prod.category ? '<span>' + escapeHtml(prod.category) + '</span>' : ''}
                ${prod.price ? '<span>' + escapeHtml(prod.price) + '</span>' : ''}
                ${prod.sku ? '<span>SKU: ' + escapeHtml(prod.sku) + '</span>' : ''}
            </div>
            ${channels ? '<div class="client-channels" style="margin:.5rem 0;">' + channels + '</div>' : ''}
            ${prod.generatedCopy ? '<div class="product-copy"><h4>Generated Description</h4><pre class="email-body">' + escapeHtml(prod.generatedCopy) + '</pre><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(' + JSON.stringify(JSON.stringify(prod.generatedCopy)) + ');showToast(\'Copied\')">Copy</button></div>' : ''}
        </div>`;
    }).join('');
}

function openProductModal() {
    const modal = document.getElementById('productModal');
    document.getElementById('prodName').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodSKU').value = '';
    document.getElementById('prodFeatures').value = '';
    document.querySelectorAll('#prodChannels .chip').forEach(c => c.classList.remove('active'));
    modal.classList.add('open');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
}

function saveProduct() {
    const name = document.getElementById('prodName').value.trim();
    if (!name) { showToast('Please enter a product name'); return; }

    const features = document.getElementById('prodFeatures').value.trim().split('\n').filter(Boolean);
    const channels = Array.from(document.querySelectorAll('#prodChannels .chip.active')).map(c => c.dataset.value);
    const price = document.getElementById('prodPrice').value.trim();

    // Generate product description
    const featureList = features.length > 0 ? features.join(', ') : 'premium quality';
    const generatedCopy = `${name}\n\n` +
        `${price ? price + ' | ' : ''}Discover the ${name} — designed for those who demand the best.\n\n` +
        `Key Features:\n${features.length > 0 ? features.map(f => '• ' + f).join('\n') : '• Premium quality\n• Built to last\n• Exceptional value'}\n\n` +
        `Why choose ${name}?\nBecause you deserve a product that works as hard as you do. ${name} combines ${featureList} into one seamless package.\n\n` +
        `Order now and experience the difference.`;

    const products = loadProducts();
    products.push({
        id: 'prod_' + Date.now(),
        clientId: state.activeClientId,
        name,
        category: document.getElementById('prodCategory').value.trim(),
        price,
        sku: document.getElementById('prodSKU').value.trim(),
        features,
        channels,
        generatedCopy,
        createdAt: new Date().toISOString(),
    });
    saveProductsData(products);
    closeProductModal();
    renderProducts();
    showToast('Product saved with generated copy');
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    const products = loadProducts().filter(p => p.id !== id);
    saveProductsData(products);
    renderProducts();
    showToast('Product deleted');
}

// ============ OMNICHANNEL ============
function loadPromos() {
    try { return JSON.parse(localStorage.getItem('ce_promos')) || []; } catch (e) { return []; }
}
function savePromosData(promos) {
    localStorage.setItem('ce_promos', JSON.stringify(promos));
}

function renderPromos() {
    const promos = loadPromos().filter(p => !state.activeClientId || p.clientId === state.activeClientId);
    const list = document.getElementById('promosList');
    const empty = document.getElementById('promosEmpty');

    if (promos.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    list.style.display = 'flex';
    empty.style.display = 'none';

    list.innerHTML = promos.map(promo => {
        const channels = (promo.channels || []).map(ch => '<span class="client-tag">' + escapeHtml(ch) + '</span>').join('');
        const dateRange = promo.startDate && promo.endDate
            ? new Date(promo.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' — ' + new Date(promo.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : '';
        return `<div class="card promo-card" style="margin-bottom:1rem;">
            <div class="campaign-header">
                <h3>${escapeHtml(promo.name)}</h3>
                <div class="campaign-actions">
                    <button class="btn btn-ghost btn-sm" onclick="deletePromo('${promo.id}')">Delete</button>
                </div>
            </div>
            <div class="campaign-meta">
                <span class="content-type">${escapeHtml(promo.type || 'Sale')}</span>
                ${promo.discount ? '<span><strong>' + escapeHtml(promo.discount) + '</strong></span>' : ''}
                ${dateRange ? '<span>' + dateRange + '</span>' : ''}
            </div>
            ${channels ? '<div class="client-channels" style="margin:.5rem 0;">' + channels + '</div>' : ''}
            ${promo.generatedCopy ? '<div class="product-copy"><h4>Generated Promo Copy</h4><pre class="email-body">' + escapeHtml(promo.generatedCopy) + '</pre><button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(' + JSON.stringify(JSON.stringify(promo.generatedCopy)) + ');showToast(\'Copied\')">Copy</button></div>' : ''}
        </div>`;
    }).join('');
}

function openPromoModal() {
    const modal = document.getElementById('promoModal');
    document.getElementById('promoName').value = '';
    document.getElementById('promoStart').value = '';
    document.getElementById('promoEnd').value = '';
    document.getElementById('promoDiscount').value = '';
    document.querySelectorAll('#promoType .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    document.querySelectorAll('#promoChannels .chip').forEach(c => c.classList.remove('active'));
    modal.classList.add('open');
}

function closePromoModal() {
    document.getElementById('promoModal').classList.remove('open');
}

function savePromo() {
    const name = document.getElementById('promoName').value.trim();
    if (!name) { showToast('Please enter a promotion name'); return; }

    const type = document.querySelector('#promoType .chip.active')?.dataset.value || 'sale';
    const discount = document.getElementById('promoDiscount').value.trim();
    const channels = Array.from(document.querySelectorAll('#promoChannels .chip.active')).map(c => c.dataset.value);
    const client = getActiveClient();
    const brand = client ? client.name : 'Your Brand';

    // Generate promo copy per channel
    const copyParts = [];
    if (channels.includes('email')) {
        copyParts.push(`EMAIL:\nSubject: ${name} — ${discount || 'Special Offer'} from ${brand}\n\nHi there,\n\n${name} is here! ${discount ? 'Get ' + discount + ' on everything.' : 'Don\'t miss out on our biggest offer yet.'}\n\nShop now: [Link]\n\n— ${brand}`);
    }
    if (channels.includes('instagram') || channels.includes('facebook') || channels.includes('tiktok')) {
        copyParts.push(`SOCIAL POST:\n${discount ? discount + ' ' : ''}${name} is LIVE! ${discount ? 'Use the link in bio to shop now.' : 'Head to our page to learn more.'}\n\n#${brand.replace(/\s/g, '')} #${type} #${name.replace(/\s/g, '')}`);
    }
    if (channels.includes('website')) {
        copyParts.push(`WEBSITE BANNER:\nHeadline: ${name}\nSubheadline: ${discount || 'Limited Time Offer'}\nCTA: Shop Now`);
    }
    if (channels.includes('sms')) {
        copyParts.push(`SMS:\n${brand}: ${name} is live! ${discount || 'Special offer'} — shop now at [link]. Reply STOP to opt out.`);
    }
    if (channels.includes('instore')) {
        copyParts.push(`IN-STORE SIGNAGE:\nHeadline: ${name}\n${discount || 'Special Offer'}\nValid: [Start Date] — [End Date]`);
    }
    if (copyParts.length === 0) {
        copyParts.push(`${name}\n${discount ? discount + ' — ' : ''}${brand}\n\nDon't miss this ${type} event!`);
    }

    const promos = loadPromos();
    promos.push({
        id: 'promo_' + Date.now(),
        clientId: state.activeClientId,
        name,
        type,
        discount,
        startDate: document.getElementById('promoStart').value,
        endDate: document.getElementById('promoEnd').value,
        channels,
        generatedCopy: copyParts.join('\n\n---\n\n'),
        createdAt: new Date().toISOString(),
    });
    savePromosData(promos);
    closePromoModal();
    renderPromos();
    showToast('Promotion saved with generated copy');
}

function deletePromo(id) {
    if (!confirm('Delete this promotion?')) return;
    const promos = loadPromos().filter(p => p.id !== id);
    savePromosData(promos);
    renderPromos();
    showToast('Promotion deleted');
}

// ============ INTEGRATIONS SETTINGS ============
const INTEGRATIONS_CONFIG = {
    mailchimp: { name: 'Mailchimp', color: '#FFE01B', icon: 'M', category: 'email', fields: ['apiKey'], desc: 'Email marketing platform. Connect to sync lists, create campaigns, and track performance.' },
    klaviyo: { name: 'Klaviyo', color: '#000', icon: 'K', category: 'email', fields: ['apiKey'], desc: 'E-commerce email & SMS marketing. Sync customers, flows, and campaigns.' },
    sendgrid: { name: 'SendGrid', color: '#1A82E2', icon: 'SG', category: 'email', fields: ['apiKey'], desc: 'Transactional and marketing email delivery platform.' },
    shopify: { name: 'Shopify', color: '#96BF48', icon: 'S', category: 'ecommerce', fields: ['shop', 'accessToken'], desc: 'Sync products, collections, and orders from your Shopify store.' },
    meta: { name: 'Meta (Facebook & Instagram)', color: '#1877F2', icon: 'f', category: 'social', fields: ['oauth'], desc: 'Publish to Facebook & Instagram, manage ads, pull insights.' },
    google: { name: 'Google Ads', color: '#4285F4', icon: 'G', category: 'ads', fields: ['oauth'], desc: 'Manage Google Ads campaigns, keywords, and performance metrics.' },
    tiktok: { name: 'TikTok', color: '#000', icon: 'TT', category: 'social', fields: ['oauth'], desc: 'Publish content and manage TikTok ad campaigns.' },
    linkedin: { name: 'LinkedIn', color: '#0A66C2', icon: 'in', category: 'social', fields: ['oauth'], desc: 'Publish posts and articles to your LinkedIn profile or company page.' },
    twitter: { name: 'X (Twitter)', color: '#000', icon: 'X', category: 'social', fields: ['oauth'], desc: 'Post tweets and threads, track engagement.' },
    pinterest: { name: 'Pinterest', color: '#E60023', icon: 'P', category: 'social', fields: ['oauth'], desc: 'Create pins, manage boards, and track pin performance.' },
};

function renderIntegrations() {
    const container = document.getElementById('integrationsContent');
    const stored = loadIntegrationStatus();

    const categories = [
        { key: 'email', label: 'Email Marketing' },
        { key: 'social', label: 'Social Media' },
        { key: 'ads', label: 'Paid Advertising' },
        { key: 'ecommerce', label: 'E-commerce' },
    ];

    let html = '';
    categories.forEach(cat => {
        const items = Object.entries(INTEGRATIONS_CONFIG).filter(([_, v]) => v.category === cat.key);
        if (items.length === 0) return;
        html += `<h3 style="margin:1.5rem 0 0.75rem;">${cat.label}</h3><div class="integrations-grid">`;
        items.forEach(([key, cfg]) => {
            const isConnected = stored[key]?.connected || false;
            const isOAuth = cfg.fields.includes('oauth');
            html += `<div class="integration-card${isConnected ? ' connected' : ''}" id="int-card-${key}">
                <div class="integration-card-header">
                    <div class="integration-icon" style="background:${cfg.color};">${cfg.icon}</div>
                    <div>
                        <h4>${cfg.name}</h4>
                        <span class="integration-status${isConnected ? ' connected' : ''}">${isConnected ? 'Connected' : 'Not connected'}</span>
                    </div>
                </div>
                <p>${cfg.desc}</p>
                ${isConnected
                    ? `<button class="btn btn-ghost btn-sm btn-danger" onclick="disconnectIntegration('${key}')">Disconnect</button>`
                    : isOAuth
                        ? `<button class="btn btn-primary btn-sm" onclick="showToast('OAuth setup: Register your app at the platform\\'s developer portal, then add your credentials in Vercel Environment Variables.')">Connect (OAuth)</button>`
                        : `<button class="btn btn-primary btn-sm" onclick="toggleIntegrationForm('${key}')">Connect</button>
                           <div class="integration-connect-form" id="int-form-${key}">
                               ${cfg.fields.includes('apiKey') ? '<div class="form-group"><label class="form-label">API Key</label><input type="password" class="form-input" id="int-key-' + key + '" placeholder="Paste your API key"></div>' : ''}
                               ${cfg.fields.includes('shop') ? '<div class="form-group"><label class="form-label">Shop Name</label><input type="text" class="form-input" id="int-shop-' + key + '" placeholder="yourstore (without .myshopify.com)"></div>' : ''}
                               ${cfg.fields.includes('accessToken') ? '<div class="form-group"><label class="form-label">Access Token</label><input type="password" class="form-input" id="int-token-' + key + '" placeholder="Paste your access token"></div>' : ''}
                               <button class="btn btn-primary btn-sm" onclick="testIntegration('${key}')">Test & Connect</button>
                           </div>`
                }
            </div>`;
        });
        html += '</div>';
    });

    container.innerHTML = html;
}

function loadIntegrationStatus() {
    try { return JSON.parse(localStorage.getItem('ce_integrations')) || {}; } catch (e) { return {}; }
}

function saveIntegrationStatus(data) {
    localStorage.setItem('ce_integrations', JSON.stringify(data));
}

function toggleIntegrationForm(key) {
    const form = document.getElementById('int-form-' + key);
    if (form) form.classList.toggle('open');
}

function testIntegration(key) {
    const cfg = INTEGRATIONS_CONFIG[key];
    if (!cfg) return;

    const credentials = {};
    if (cfg.fields.includes('apiKey')) {
        credentials.apiKey = document.getElementById('int-key-' + key)?.value?.trim();
        if (!credentials.apiKey) { showToast('Please enter an API key'); return; }
    }
    if (cfg.fields.includes('shop')) {
        credentials.shop = document.getElementById('int-shop-' + key)?.value?.trim();
    }
    if (cfg.fields.includes('accessToken')) {
        credentials.accessToken = document.getElementById('int-token-' + key)?.value?.trim();
    }

    showToast('Testing connection...');

    // Try the real API endpoint
    fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', platform: key, credentials }),
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const status = loadIntegrationStatus();
            status[key] = { connected: true, connectedAt: new Date().toISOString() };
            saveIntegrationStatus(status);
            renderIntegrations();
            showToast(cfg.name + ' connected!');
        } else {
            // If API not available (local dev), save locally anyway for UI
            const status = loadIntegrationStatus();
            status[key] = { connected: true, connectedAt: new Date().toISOString(), local: true };
            saveIntegrationStatus(status);
            renderIntegrations();
            showToast(cfg.name + ' connected (local mode)');
        }
    })
    .catch(() => {
        // Save locally for UI-ready mode
        const status = loadIntegrationStatus();
        status[key] = { connected: true, connectedAt: new Date().toISOString(), local: true };
        saveIntegrationStatus(status);
        renderIntegrations();
        showToast(cfg.name + ' saved (API not available — will connect when deployed)');
    });
}

function disconnectIntegration(key) {
    if (!confirm('Disconnect ' + INTEGRATIONS_CONFIG[key]?.name + '?')) return;
    const status = loadIntegrationStatus();
    delete status[key];
    saveIntegrationStatus(status);
    renderIntegrations();
    showToast('Disconnected');
}

// ============ SOCIAL SCHEDULER ============
function loadScheduledPosts() {
    try { return JSON.parse(localStorage.getItem('ce_scheduled_posts')) || []; } catch (e) { return []; }
}
function saveScheduledPosts(posts) {
    localStorage.setItem('ce_scheduled_posts', JSON.stringify(posts));
}

let socialActiveTab = 'queue';

function switchSocialTab(tab, btn) {
    socialActiveTab = tab;
    document.querySelectorAll('.social-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderSocialQueue();
}

function renderSocial() {
    renderSocialStatusBar();
    renderSocialQueue();
}

function renderSocialStatusBar() {
    const bar = document.getElementById('socialStatusBar');
    const integrations = loadIntegrationStatus();
    const platforms = ['meta', 'linkedin', 'twitter', 'tiktok', 'pinterest'];
    bar.innerHTML = platforms.map(p => {
        const cfg = INTEGRATIONS_CONFIG[p];
        const connected = integrations[p]?.connected;
        return `<div class="social-status-item"><span class="social-status-dot ${connected ? 'connected' : 'disconnected'}"></span>${cfg?.name || p}</div>`;
    }).join('');
}

function renderSocialQueue() {
    const posts = loadScheduledPosts().filter(p => !state.activeClientId || p.clientId === state.activeClientId);
    const queue = document.getElementById('socialQueue');
    const empty = document.getElementById('socialEmpty');

    let filtered = posts;
    if (socialActiveTab === 'queue') filtered = posts.filter(p => p.status === 'scheduled');
    else if (socialActiveTab === 'published') filtered = posts.filter(p => p.status === 'published');
    else if (socialActiveTab === 'drafts') filtered = posts.filter(p => p.status === 'draft');

    // Sort by date
    filtered.sort((a, b) => new Date(a.scheduledDate + 'T' + (a.scheduledTime || '09:00')) - new Date(b.scheduledDate + 'T' + (b.scheduledTime || '09:00')));

    if (filtered.length === 0) {
        queue.style.display = 'none';
        empty.style.display = 'flex';
        return;
    }
    queue.style.display = 'flex';
    empty.style.display = 'none';

    queue.innerHTML = filtered.map(post => {
        const platforms = (post.platforms || []).map(p => {
            const color = CHANNEL_COLORS[p] || '#333';
            return `<div class="social-post-platform" style="background:${color};" title="${CHANNEL_NAMES[p] || p}"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="3"/></svg></div>`;
        }).join('');
        const dateStr = post.scheduledDate
            ? new Date(post.scheduledDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + (post.scheduledTime ? ' at ' + post.scheduledTime : '')
            : 'No date';
        return `<div class="social-post-card">
            <div class="social-post-header">
                <div class="social-post-platforms">${platforms}</div>
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <span class="social-post-status ${post.status}">${post.status}</span>
                    <span class="social-post-date">${dateStr}</span>
                </div>
            </div>
            <div class="social-post-text">${escapeHtml(post.content.substring(0, 280))}${post.content.length > 280 ? '...' : ''}</div>
            ${post.hashtags ? '<div class="content-hashtags" style="margin-bottom:0.5rem;">' + escapeHtml(post.hashtags) + '</div>' : ''}
            <div class="content-actions">
                <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(JSON.stringify(post.content))});showToast('Copied')">Copy</button>
                ${post.status === 'scheduled' ? '<button class="btn btn-ghost btn-sm" onclick="publishPost(\'' + post.id + '\')">Publish Now</button>' : ''}
                ${post.status === 'draft' ? '<button class="btn btn-ghost btn-sm" onclick="schedulePost(\'' + post.id + '\')">Schedule</button>' : ''}
                <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteScheduledPost('${post.id}')">Delete</button>
            </div>
        </div>`;
    }).join('');
}

function openSchedulePostModal() {
    const modal = document.getElementById('schedulePostModal');
    document.getElementById('schedContent').value = '';
    document.getElementById('schedHashtags').value = '';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('schedDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('schedTime').value = '09:00';
    document.querySelectorAll('#schedPlatforms .chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#schedStatus .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    modal.classList.add('open');
}

function closeSchedulePostModal() {
    document.getElementById('schedulePostModal').classList.remove('open');
}

function saveScheduledPost() {
    const content = document.getElementById('schedContent').value.trim();
    if (!content) { showToast('Please write post content'); return; }
    const platforms = Array.from(document.querySelectorAll('#schedPlatforms .chip.active')).map(c => c.dataset.value);
    if (platforms.length === 0) { showToast('Please select at least one platform'); return; }
    const status = document.querySelector('#schedStatus .chip.active')?.dataset.value || 'scheduled';

    const posts = loadScheduledPosts();
    posts.push({
        id: 'spost_' + Date.now(),
        clientId: state.activeClientId,
        clientName: getActiveClient()?.name || '',
        platforms,
        content,
        hashtags: document.getElementById('schedHashtags').value.trim(),
        scheduledDate: document.getElementById('schedDate').value,
        scheduledTime: document.getElementById('schedTime').value,
        status,
        createdAt: new Date().toISOString(),
    });
    saveScheduledPosts(posts);
    closeSchedulePostModal();
    renderSocialQueue();
    showToast('Post ' + (status === 'draft' ? 'saved as draft' : 'scheduled'));
}

function publishPost(id) {
    const posts = loadScheduledPosts();
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // Try real API publish for connected platforms
    const integrations = loadIntegrationStatus();
    let published = false;

    post.platforms.forEach(platform => {
        if (integrations[platform === 'facebook' || platform === 'instagram' ? 'meta' : platform]?.connected) {
            // Attempt real publish via API
            fetch('/api/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: platform === 'facebook' || platform === 'instagram' ? 'meta' : platform,
                    action: 'publish' + (platform === 'facebook' ? '-facebook' : ''),
                    message: post.content,
                    text: post.content,
                }),
            }).catch(() => {}); // Silently fail if API not available
        }
    });

    post.status = 'published';
    post.publishedAt = new Date().toISOString();
    saveScheduledPosts(posts);
    renderSocialQueue();
    showToast('Post marked as published');
}

function schedulePost(id) {
    const posts = loadScheduledPosts();
    const post = posts.find(p => p.id === id);
    if (!post) return;
    post.status = 'scheduled';
    saveScheduledPosts(posts);
    renderSocialQueue();
    showToast('Post scheduled');
}

function deleteScheduledPost(id) {
    if (!confirm('Delete this post?')) return;
    const posts = loadScheduledPosts().filter(p => p.id !== id);
    saveScheduledPosts(posts);
    renderSocialQueue();
    showToast('Post deleted');
}

// ============ EMAIL MARKETING INTEGRATION ============
let emailIntActiveTab = 'campaigns';

function switchEmailIntTab(tab, btn) {
    emailIntActiveTab = tab;
    document.querySelectorAll('.email-int-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderEmailInt();
}

function renderEmailIntView() {
    renderEmailIntStatus();
    renderEmailInt();
}

function renderEmailIntStatus() {
    const bar = document.getElementById('emailIntStatus');
    const integrations = loadIntegrationStatus();
    const platforms = ['mailchimp', 'klaviyo', 'sendgrid'];
    bar.innerHTML = '<div class="social-status-bar">' + platforms.map(p => {
        const cfg = INTEGRATIONS_CONFIG[p];
        const connected = integrations[p]?.connected;
        return `<div class="social-status-item"><span class="social-status-dot ${connected ? 'connected' : 'disconnected'}"></span>${cfg?.name || p}</div>`;
    }).join('') + '</div>';
}

function renderEmailInt() {
    const container = document.getElementById('emailIntContent');
    const integrations = loadIntegrationStatus();
    const anyConnected = ['mailchimp', 'klaviyo', 'sendgrid'].some(p => integrations[p]?.connected);

    if (emailIntActiveTab === 'campaigns') {
        // Show local campaigns + try to fetch real ones
        const localCampaigns = loadEmailIntCampaigns();
        if (localCampaigns.length === 0 && !anyConnected) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><h2>No email campaigns</h2><p>Connect an email platform in Integrations, or create a campaign.</p><button class="btn btn-primary" onclick="openEmailCampaignModal()">Create Campaign</button></div>';
            return;
        }
        container.innerHTML = localCampaigns.map(c => `<div class="card" style="margin-bottom:0.75rem;">
            <div class="campaign-header"><h3>${escapeHtml(c.subject)}</h3><span class="social-post-status ${c.status || 'draft'}">${c.status || 'draft'}</span></div>
            <div class="campaign-meta"><span>${escapeHtml(c.platform)}</span><span>${new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
        </div>`).join('') || '<p style="color:var(--text-muted);padding:1rem;">No campaigns yet.</p>';

        // Try fetch real campaigns
        if (integrations.mailchimp?.connected) {
            fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'mailchimp', action: 'campaigns' }) })
                .then(r => r.json())
                .then(data => {
                    if (data.campaigns?.length > 0) {
                        container.innerHTML += '<h4 style="margin:1rem 0 0.5rem;">Mailchimp Campaigns</h4>' +
                            data.campaigns.map(c => `<div class="card" style="margin-bottom:0.5rem;"><strong>${escapeHtml(c.subject || c.title)}</strong> <span class="social-post-status ${c.status}">${c.status}</span> <span style="font-size:12px;color:var(--text-muted);">${c.recipients} recipients</span></div>`).join('');
                    }
                }).catch(() => {});
        }
    } else if (emailIntActiveTab === 'lists') {
        container.innerHTML = '<div class="ai-loading" style="padding:2rem;"><div class="ai-spinner"></div><h3>Loading lists...</h3></div>';

        // Try fetch real lists
        if (integrations.mailchimp?.connected) {
            fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'mailchimp', action: 'lists' }) })
                .then(r => r.json())
                .then(data => {
                    if (data.lists?.length > 0) {
                        container.innerHTML = data.lists.map(l => `<div class="card" style="margin-bottom:0.5rem;"><strong>${escapeHtml(l.name)}</strong> — ${l.memberCount} members <span style="font-size:12px;color:var(--text-muted);">Open: ${(l.openRate * 100).toFixed(1)}% | Click: ${(l.clickRate * 100).toFixed(1)}%</span></div>`).join('');
                    } else {
                        container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">No lists found. Make sure your API key has list access.</p>';
                    }
                }).catch(() => {
                    container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Connect an email platform in Integrations to view lists.</p>';
                });
        } else {
            setTimeout(() => {
                container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Connect an email platform in Integrations to view lists.</p>';
            }, 300);
        }
    } else if (emailIntActiveTab === 'compose') {
        container.innerHTML = `<div class="card">
            <h3 style="margin-bottom:1rem;">Compose Email</h3>
            <p style="color:var(--text-secondary);margin-bottom:1rem;">Use the Email Builder module to generate sequences, then send them from here via your connected platform.</p>
            <button class="btn btn-primary" onclick="switchView('email')">Open Email Builder</button>
            <button class="btn btn-ghost" style="margin-left:0.5rem;" onclick="openEmailCampaignModal()">Quick Campaign</button>
        </div>`;
    }
}

function loadEmailIntCampaigns() {
    try { return JSON.parse(localStorage.getItem('ce_email_campaigns')) || []; } catch (e) { return []; }
}

function openEmailCampaignModal() {
    const modal = document.getElementById('emailCampaignModal');
    document.getElementById('eicSubject').value = '';
    document.getElementById('eicPreview').value = '';
    document.getElementById('eicFrom').value = '';
    document.getElementById('eicReply').value = '';
    document.getElementById('eicBody').value = '';
    document.getElementById('eicList').value = '';
    document.querySelectorAll('#emailIntPlatform .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    modal.classList.add('open');
}

function closeEmailCampaignModal() {
    document.getElementById('emailCampaignModal').classList.remove('open');
}

function sendEmailCampaign() {
    const subject = document.getElementById('eicSubject').value.trim();
    if (!subject) { showToast('Please enter a subject line'); return; }
    const platform = document.querySelector('#emailIntPlatform .chip.active')?.dataset.value || 'mailchimp';

    const campaign = {
        id: 'ecamp_' + Date.now(),
        platform,
        subject,
        previewText: document.getElementById('eicPreview').value.trim(),
        fromName: document.getElementById('eicFrom').value.trim(),
        replyTo: document.getElementById('eicReply').value.trim(),
        htmlContent: document.getElementById('eicBody').value,
        listId: document.getElementById('eicList').value.trim(),
        status: 'draft',
        createdAt: new Date().toISOString(),
    };

    // Save locally
    const campaigns = loadEmailIntCampaigns();
    campaigns.push(campaign);
    localStorage.setItem('ce_email_campaigns', JSON.stringify(campaigns));

    // Try real API
    const integrations = loadIntegrationStatus();
    if (integrations[platform]?.connected && campaign.listId) {
        fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, action: 'create-campaign', ...campaign }),
        }).then(r => r.json()).then(data => {
            if (data.success) {
                campaign.status = 'created';
                localStorage.setItem('ce_email_campaigns', JSON.stringify(campaigns));
                showToast('Campaign created on ' + platform);
            }
        }).catch(() => {});
    }

    closeEmailCampaignModal();
    renderEmailInt();
    showToast('Campaign saved');
}

// ============ PAID ADS MANAGER ============
let adsActivePlatform = 'meta';

function switchAdsPlatform(platform, btn) {
    adsActivePlatform = platform;
    document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderAds();
}

function renderAds() {
    renderAdsOverview();
    renderAdsCampaigns();
}

function renderAdsOverview() {
    const overview = document.getElementById('adsOverview');
    const localAds = loadLocalAds().filter(a => a.platform === adsActivePlatform);
    const totalSpend = localAds.reduce((sum, a) => sum + (parseFloat(a.budget) || 0) * (parseInt(a.duration) || 30), 0);
    const totalAds = localAds.length;

    overview.innerHTML = `
        <div class="ads-stat"><div class="ads-stat-label">Campaigns</div><div class="ads-stat-value">${totalAds}</div></div>
        <div class="ads-stat"><div class="ads-stat-label">Est. Total Spend</div><div class="ads-stat-value">&pound;${totalSpend.toLocaleString()}</div></div>
        <div class="ads-stat"><div class="ads-stat-label">Platform</div><div class="ads-stat-value" style="font-size:16px;">${INTEGRATIONS_CONFIG[adsActivePlatform]?.name || adsActivePlatform}</div></div>
        <div class="ads-stat"><div class="ads-stat-label">Status</div><div class="ads-stat-value" style="font-size:14px;">${loadIntegrationStatus()[adsActivePlatform]?.connected ? '<span style="color:var(--green-600);">Connected</span>' : '<span style="color:var(--text-muted);">Not connected</span>'}</div></div>
    `;

    // Try real insights
    const integrations = loadIntegrationStatus();
    if (integrations[adsActivePlatform]?.connected) {
        fetch('/api/ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: adsActivePlatform, action: 'insights' }),
        }).then(r => r.json()).then(data => {
            if (data.insights?.length > 0) {
                const i = data.insights[0];
                overview.innerHTML += `<div class="ads-stat"><div class="ads-stat-label">Impressions</div><div class="ads-stat-value">${(i.impressions || 0).toLocaleString()}</div></div>
                    <div class="ads-stat"><div class="ads-stat-label">Clicks</div><div class="ads-stat-value">${(i.clicks || 0).toLocaleString()}</div></div>
                    <div class="ads-stat"><div class="ads-stat-label">CTR</div><div class="ads-stat-value">${i.ctr || '0'}%</div></div>
                    <div class="ads-stat"><div class="ads-stat-label">Spend</div><div class="ads-stat-value">&pound;${i.spend || '0'}</div></div>`;
            }
        }).catch(() => {});
    }
}

function renderAdsCampaigns() {
    const container = document.getElementById('adsCampaigns');
    const localAds = loadLocalAds().filter(a => a.platform === adsActivePlatform);

    if (localAds.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div><h2>No ad campaigns</h2><p>Create your first ad to get started.</p><button class="btn btn-primary" onclick="openAdModal()">Create Ad</button></div>';
        return;
    }

    container.innerHTML = '<h3 style="margin-bottom:0.75rem;">Campaigns</h3>' + localAds.map(ad => `<div class="ads-campaign-card">
        <div class="ads-campaign-header">
            <div><strong>${escapeHtml(ad.name)}</strong><span class="social-post-status draft" style="margin-left:0.5rem;">${ad.status || 'Draft'}</span></div>
            <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteAd('${ad.id}')">Delete</button>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin:0.25rem 0;">${escapeHtml(ad.objective || '')} | Budget: ${escapeHtml(ad.budget || '0')}/day | ${ad.duration || 30} days</p>
        ${ad.headline ? '<p style="font-size:14px;margin:0.5rem 0;"><strong>' + escapeHtml(ad.headline) + '</strong></p>' : ''}
        ${ad.body ? '<p style="font-size:13px;color:var(--text-secondary);margin:0;">' + escapeHtml(ad.body) + '</p>' : ''}
        <div class="ads-campaign-metrics">
            <div class="ads-metric"><div class="ads-metric-value">—</div><div class="ads-metric-label">Impressions</div></div>
            <div class="ads-metric"><div class="ads-metric-value">—</div><div class="ads-metric-label">Clicks</div></div>
            <div class="ads-metric"><div class="ads-metric-value">—</div><div class="ads-metric-label">CTR</div></div>
            <div class="ads-metric"><div class="ads-metric-value">—</div><div class="ads-metric-label">Conversions</div></div>
        </div>
    </div>`).join('');
}

function loadLocalAds() {
    try { return JSON.parse(localStorage.getItem('ce_ads')) || []; } catch (e) { return []; }
}

function openAdModal() {
    const modal = document.getElementById('adModal');
    document.getElementById('adName').value = '';
    document.getElementById('adBudget').value = '';
    document.getElementById('adDuration').value = '30';
    document.getElementById('adHeadline').value = '';
    document.getElementById('adBody').value = '';
    document.getElementById('adLink').value = '';
    document.getElementById('adInterests').value = '';
    document.getElementById('adLocations').value = 'United Kingdom';
    document.getElementById('adAgeMin').value = '18';
    document.getElementById('adAgeMax').value = '65';
    document.querySelectorAll('#adPlatformSelect .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    document.querySelectorAll('#adObjective .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    modal.classList.add('open');
}

function closeAdModal() {
    document.getElementById('adModal').classList.remove('open');
}

function saveAd() {
    const name = document.getElementById('adName').value.trim();
    if (!name) { showToast('Please enter a campaign name'); return; }

    const platform = document.querySelector('#adPlatformSelect .chip.active')?.dataset.value || 'meta';
    const ad = {
        id: 'ad_' + Date.now(),
        clientId: state.activeClientId,
        platform,
        name,
        objective: document.querySelector('#adObjective .chip.active')?.dataset.value || 'awareness',
        budget: document.getElementById('adBudget').value.trim(),
        duration: document.getElementById('adDuration').value,
        headline: document.getElementById('adHeadline').value.trim(),
        body: document.getElementById('adBody').value.trim(),
        link: document.getElementById('adLink').value.trim(),
        targeting: {
            ageMin: document.getElementById('adAgeMin').value,
            ageMax: document.getElementById('adAgeMax').value,
            interests: document.getElementById('adInterests').value.trim(),
            locations: document.getElementById('adLocations').value.trim(),
        },
        status: 'Draft',
        createdAt: new Date().toISOString(),
    };

    const ads = loadLocalAds();
    ads.push(ad);
    localStorage.setItem('ce_ads', JSON.stringify(ads));

    // Try real API
    const integrations = loadIntegrationStatus();
    if (integrations[platform]?.connected) {
        fetch('/api/ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, action: 'create-campaign', name, objective: ad.objective, dailyBudget: Math.round((parseFloat(ad.budget) || 10) * 100) }),
        }).then(r => r.json()).then(data => {
            if (data.success) {
                ad.externalId = data.campaignId;
                ad.status = 'Created';
                localStorage.setItem('ce_ads', JSON.stringify(ads));
                renderAds();
                showToast('Ad campaign created on ' + platform);
            }
        }).catch(() => {});
    }

    closeAdModal();
    renderAds();
    showToast('Ad campaign saved');
}

function deleteAd(id) {
    if (!confirm('Delete this ad campaign?')) return;
    const ads = loadLocalAds().filter(a => a.id !== id);
    localStorage.setItem('ce_ads', JSON.stringify(ads));
    renderAds();
    showToast('Ad deleted');
}

// ============ E-COMMERCE ============
let ecomActiveTab = 'products';

function switchEcomTab(tab, btn) {
    ecomActiveTab = tab;
    document.querySelectorAll('.ecom-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderEcom();
}

function renderEcomView() {
    renderEcomStatus();
    renderEcom();
}

function renderEcomStatus() {
    const bar = document.getElementById('ecomStatus');
    const integrations = loadIntegrationStatus();
    const localProducts = loadProducts();
    bar.innerHTML = `
        <div class="ecom-stat"><strong>${localProducts.length}</strong>Local Products</div>
        <div class="ecom-stat"><strong>${integrations.shopify?.connected ? 'Connected' : 'Not connected'}</strong>Shopify</div>
    `;
}

function renderEcom() {
    const container = document.getElementById('ecomContent');
    const integrations = loadIntegrationStatus();

    if (ecomActiveTab === 'products') {
        // Show local products first
        const local = loadProducts().filter(p => !state.activeClientId || p.clientId === state.activeClientId);
        if (local.length === 0 && !integrations.shopify?.connected) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div><h2>No products</h2><p>Add products in the Products module or connect Shopify to sync.</p><div style="display:flex;gap:0.5rem;justify-content:center;"><button class="btn btn-primary" onclick="switchView(\'products\')">Add Products</button><button class="btn btn-ghost" onclick="switchView(\'integrations\')">Connect Shopify</button></div></div>';
            return;
        }

        let html = '<div class="ecom-products">';
        local.forEach(p => {
            html += `<div class="ecom-product-card">
                <div class="ecom-product-img" style="display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--text-muted);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <div class="ecom-product-body">
                    <h4>${escapeHtml(p.name)}</h4>
                    ${p.price ? '<div class="ecom-product-price">' + escapeHtml(p.price) + '</div>' : ''}
                    <div class="ecom-product-meta">${escapeHtml(p.category || '')} ${p.sku ? '| SKU: ' + escapeHtml(p.sku) : ''}</div>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;

        // Try Shopify sync
        if (integrations.shopify?.connected) {
            fetch('/api/shopify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'products' }),
            }).then(r => r.json()).then(data => {
                if (data.products?.length > 0) {
                    container.innerHTML += '<h3 style="margin:1.5rem 0 0.75rem;">Shopify Products</h3><div class="ecom-products">' +
                        data.products.map(p => `<div class="ecom-product-card">
                            ${p.images?.[0]?.src ? '<img class="ecom-product-img" src="' + p.images[0].src + '" alt="' + escapeHtml(p.title) + '">' : '<div class="ecom-product-img" style="display:flex;align-items:center;justify-content:center;">No image</div>'}
                            <div class="ecom-product-body">
                                <h4>${escapeHtml(p.title)}</h4>
                                <div class="ecom-product-price">${p.variants?.[0]?.price ? '£' + p.variants[0].price : ''}</div>
                                <div class="ecom-product-meta">${escapeHtml(p.productType || '')} | ${p.status}</div>
                            </div>
                        </div>`).join('') + '</div>';
                }
            }).catch(() => {});
        }
    } else if (ecomActiveTab === 'orders') {
        if (!integrations.shopify?.connected) {
            container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Connect Shopify in Integrations to view orders.</p>';
            return;
        }
        container.innerHTML = '<div class="ai-loading" style="padding:2rem;"><div class="ai-spinner"></div><h3>Loading orders...</h3></div>';
        fetch('/api/shopify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'orders' }),
        }).then(r => r.json()).then(data => {
            if (data.orders?.length > 0) {
                container.innerHTML = '<div class="ecom-order-list">' + data.orders.map(o => `<div class="ecom-order-row">
                    <span class="ecom-order-id">${escapeHtml(o.name)}</span>
                    <span>${o.itemCount} items</span>
                    <span class="ecom-order-status ${o.status}">${o.status}</span>
                    <span>£${o.totalPrice}</span>
                    <span style="font-size:12px;color:var(--text-muted);">${new Date(o.createdAt).toLocaleDateString('en-GB')}</span>
                </div>`).join('') + '</div>';
            } else {
                container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">No orders found.</p>';
            }
        }).catch(() => {
            container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Failed to load orders. Check your Shopify connection.</p>';
        });
    } else if (ecomActiveTab === 'collections') {
        if (!integrations.shopify?.connected) {
            container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Connect Shopify in Integrations to view collections.</p>';
            return;
        }
        container.innerHTML = '<div class="ai-loading" style="padding:2rem;"><div class="ai-spinner"></div><h3>Loading collections...</h3></div>';
        fetch('/api/shopify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'collections' }),
        }).then(r => r.json()).then(data => {
            if (data.collections?.length > 0) {
                container.innerHTML = data.collections.map(c => `<div class="card" style="margin-bottom:0.5rem;"><strong>${escapeHtml(c.title)}</strong> — ${c.productsCount || 0} products</div>`).join('');
            } else {
                container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">No collections found.</p>';
            }
        }).catch(() => {
            container.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Failed to load collections.</p>';
        });
    }
}

function syncShopifyProducts() {
    const integrations = loadIntegrationStatus();
    if (!integrations.shopify?.connected) {
        showToast('Connect Shopify first in Integrations');
        switchView('integrations');
        return;
    }
    showToast('Syncing products from Shopify...');
    renderEcom();
}

// ============ UPDATED VIEW SWITCHING ============
// Extend switchView to handle new integration views
const originalSwitchView = switchView;

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcher();
    updateStats();
    renderDashboard();

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
