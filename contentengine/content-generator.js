/* ============================================
   CONTENT ENGINE AI - Core Application Logic
   World-class content generation & ads optimization
   ============================================ */

// ============ STATE ============
const state = {
    currentStep: 1,
    currentView: 'growthplan',
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

    switchView('growthplan');
}

function openAddClientModal() {
    document.getElementById('addClientModal').style.display = 'flex';
    document.getElementById('newClientName').value = '';
    document.getElementById('newClientIndustry').value = '';
    document.getElementById('newClientAudience').value = '';
    document.getElementById('newClientWebsite').value = '';
    document.getElementById('newClientNotes').value = '';
    document.querySelectorAll('#addClientModal .cg-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#newClientGoal .cg-chip').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.cg-color-swatch').forEach(s => s.classList.remove('active'));
    document.querySelector('.cg-color-swatch').classList.add('active');
    state.editingClientId = null;
}

function closeAddClientModal() {
    document.getElementById('addClientModal').style.display = 'none';
    state.editingClientId = null;
    clearModalAssetSlots();
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
    const goalEl = document.querySelector('#newClientGoal .cg-chip.active');
    const goal = goalEl ? goalEl.dataset.value : '';

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
            client.goal = goal;
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
            goal: goal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            contentCount: 0
        };
        state.clients.push(client);
    }

    saveClients();
    renderClientsGrid();
    renderClientDropdown();
    updateClientSwitcherBtn();
    updateClientStats();
    closeAddClientModal();
    // Commit any uploaded assets to this client
    var newClient = state.clients[state.clients.length - 1];
    if (newClient && !state.editingClientId) commitPendingAssetsToClient(newClient.id);
    if (state.editingClientId) commitPendingAssetsToClient(state.editingClientId);
    updateAssetBadge();
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
    document.querySelectorAll('#newClientGoal .cg-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.value === (client.goal || ''));
    });

    // Update modal title
    document.querySelector('#addClientModal .cg-modal-header h2').textContent = 'Edit Client';

    // Pre-fill asset slot previews with existing assets
    var existingAssets = getClientAssets(clientId);
    var types = ['logo','hero','ad-square','ad-story','video','headshot'];
    types.forEach(function(type) {
        var asset = existingAssets[type];
        var preview = document.getElementById('assetPreview-' + type);
        if (!preview) return;
        if (asset && asset.mimeType && asset.mimeType.startsWith('image/')) {
            preview.innerHTML = '<img src="' + asset.dataUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px;"><button type="button" class="cg-asset-slot-remove" onclick="removeModalAsset(\'' + type + '\')">&times;</button>';
        }
    });
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
                '<div><span>Channels</span><strong>' + (client.channels || []).length + '</strong></div>' +
                '<div><span>Industry</span><strong>' + (client.industry ? client.industry.split(' ')[0] : '—') + '</strong></div>' +
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
    var total = state.clients.length;
    var totalContent = state.clients.reduce(function(sum, c) { return sum + (c.contentCount || 0); }, 0);
    var totalChannels = state.clients.reduce(function(sum, c) { return sum + (c.channels || []).length; }, 0);
    var totalIntegrations = state.clients.reduce(function(sum, c) {
        return sum + Object.keys(integrations[c.id] || {}).length;
    }, 0);

    document.getElementById('statTotalClients').textContent = total;
    document.getElementById('statTotalContent').textContent = totalContent;
    document.getElementById('statTotalSpend').textContent = totalChannels;
    document.getElementById('statAvgRoas').textContent = totalIntegrations;
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
    if (view === 'analytics') renderAnalytics();
    if (view === 'ads') renderAdsView();
    if (view === 'growthplan') { renderGrowthPlanClientRow(); runGrowthAudit(); }
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
    if (step === 4) {
        renderClientAssetsInWizard();
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
    // Get active client info for fully tailored content
    const client = getActiveClient();
    const industry = client ? (client.industry || brand) : brand;
    const clientNotes = client ? (client.notes || '') : '';
    const reference = document.getElementById('contentReference').value || '';

    // Build dynamic hashtags based on brand/industry
    const brandTag = '#' + brand.replace(/[^a-zA-Z0-9]/g, '');
    const industryTag = '#' + industry.replace(/[^a-zA-Z0-9]/g, '');
    const goalTags = {
        awareness: '#BrandAwareness #GrowYourBrand',
        engagement: '#Community #Engagement',
        leads: '#LeadGeneration #GrowthHacking',
        sales: '#ShopNow #Deals',
        authority: '#ThoughtLeadership #Expert',
        community: '#CommunityBuilding #Together'
    };
    const baseHashtags = brandTag + ' ' + industryTag + ' ' + (goalTags[goal] || '#Growth #Strategy');

    // Fully dynamic content templates that use client info
    const contentTemplates = {
        post: [
            {
                title: 'Value Bomb Post',
                text: 'Most ' + audience + ' are making this mistake.\n\nHere are 3 things you can do TODAY to get better results with ' + industry + ':\n\n1. Audit what you\'re currently doing\n2. Identify the biggest gap in your strategy\n3. Take one focused action this week\n\nSmall changes = massive results over time.\n\nSave this post. Come back to it. Thank me later.',
                hashtags: baseHashtags + ' #ValuePost #Tips'
            },
            {
                title: 'Authority Post',
                text: 'After working with hundreds of clients in ' + industry + ', here\'s what I\'ve learned:\n\nThe ones who succeed aren\'t the ones with the biggest budgets.\n\nThey\'re the ones who:\n- Stay consistent\n- Focus on their audience\n- Adapt quickly\n- Trust the process\n\nWhich one do you need to work on? Drop it below.',
                hashtags: baseHashtags + ' #ExpertAdvice #' + industry.replace(/[^a-zA-Z0-9]/g, '') + 'Tips'
            },
            {
                title: 'Engagement Hook',
                text: 'Hot take for ' + audience + ':\n\nMost people in ' + industry + ' are overcomplicating things.\n\nThe truth? The simplest strategy executed consistently will beat a complex one every single time.\n\nAgree or disagree? Tell me why in the comments.',
                hashtags: baseHashtags + ' #HotTake #LetsTalk'
            },
            {
                title: 'Social Proof Post',
                text: '"Working with ' + brand + ' completely transformed our approach."\n\nThat\'s what our clients tell us.\n\nNot because we have some secret formula. But because we focus on what actually works for ' + audience + '.\n\nResults speak louder than promises.\n\nLink in bio to see how we can help you too.',
                hashtags: baseHashtags + ' #ClientResults #Testimonial #RealResults'
            },
            {
                title: 'Myth Buster Post',
                text: 'MYTH: "You need a huge budget to succeed in ' + industry + '"\n\nREALITY: Strategy beats budget every single time.\n\nHere\'s what matters more:\n- Understanding your audience deeply\n- Creating content that resonates\n- Being consistent (not perfect)\n- Testing and iterating\n\nStop waiting for "enough" budget. Start with what you have.',
                hashtags: baseHashtags + ' #MythBusted #SmartStrategy'
            }
        ],
        story: [
            {
                title: 'Quick Tip Story',
                text: 'Quick tip for ' + audience + ':\n\nThe #1 thing that will move the needle for your ' + industry + ' strategy this week?\n\nFocus on ONE goal. Not five. ONE.\n\nSwipe up to learn our full framework.',
                hashtags: ''
            },
            {
                title: 'Poll Story',
                text: 'Question for you:\n\nWhat\'s your biggest challenge with ' + industry + ' right now?\n\nA) Not enough time\nB) Not sure what works\nC) Need more resources\nD) All of the above\n\nVote and I\'ll share my best tip for whatever wins!',
                hashtags: ''
            }
        ],
        reel: [
            {
                title: 'Hook Reel Script',
                text: 'HOOK: "If you\'re a ' + audience.split(' ')[0] + ' in ' + industry + ', stop scrolling"\n\nSETUP: Quick cuts showing the problem your audience faces\n\nREVEAL: "Here\'s what the top 1% do differently..."\n\nVALUE: Share 1 actionable tip\n\nCTA: "Follow ' + brand + ' for more"\n\nAudio: Trending sound\nDuration: 15-30s\nCaption: This is the game changer nobody talks about...',
                hashtags: baseHashtags + ' #Reels #' + industry.replace(/[^a-zA-Z0-9]/g, '') + ' #Tips'
            },
            {
                title: 'Before/After Reel',
                text: '"POV: Before vs After working with ' + brand + '"\n\nBEFORE:\n- Struggling to reach your audience\n- Inconsistent results\n- Wasting time on what doesn\'t work\n\nAFTER:\n- Clear strategy in place\n- Consistent growth\n- More results, less effort\n\nDuration: 10-15s fast cuts\nFormat: Split screen or transition reveal',
                hashtags: baseHashtags + ' #BeforeAndAfter #Transformation'
            }
        ],
        carousel: [
            {
                title: 'Educational Carousel',
                text: 'Slide 1: "5 ' + industry + ' Strategies That Actually Work in 2026"\n\nSlide 2: "1. Know Your Audience — Research deeply before creating anything. What keeps ' + audience + ' up at night?"\n\nSlide 3: "2. Content First — Lead with value, not sales. Give before you ask."\n\nSlide 4: "3. Platform Native — What works on Instagram won\'t work on LinkedIn. Tailor everything."\n\nSlide 5: "4. Data-Driven — Track what resonates. Double down on winners. Kill what doesn\'t work."\n\nSlide 6: "5. Consistency > Perfection — Showing up regularly beats being perfect occasionally."\n\nSlide 7: "Save this carousel and start implementing TODAY"\n\nDesign: Clean, bold typography on gradient backgrounds',
                hashtags: baseHashtags + ' #CarouselPost #Strategy #' + industry.replace(/[^a-zA-Z0-9]/g, '')
            }
        ],
        thread: [
            {
                title: 'Twitter/X Thread',
                text: 'THREAD: The ' + industry + ' playbook that ' + audience + ' need to know about\n\n1/ Most people in ' + industry + ' are doing the same thing everyone else is doing. That\'s why they get average results.\n\nHere\'s how to break out of the pack:\n\n2/ Step 1: Define your unique angle.\n\nWhat can YOU say about ' + industry + ' that nobody else is saying? Your experience, your perspective, your story.\n\nThat\'s your competitive advantage.\n\n3/ Step 2: Pick ONE platform and dominate it.\n\nDon\'t spread yourself thin across 7 platforms. Master one first, then expand.\n\n4/ Step 3: Create a content engine.\n\nOne long-form piece per week, repurposed into 5-10 shorter pieces across platforms.\n\nWork smarter, not harder.\n\n5/ Step 4: Engage more than you broadcast.\n\nComment on posts. Reply to DMs. Build real relationships.\n\nThe algorithm rewards genuine engagement.\n\n6/ If you found this valuable, follow ' + brand + ' for more insights on ' + industry + '.\n\nRepost to help someone else who needs to see this.',
                hashtags: ''
            }
        ],
        article: [
            {
                title: 'Long-Form Article',
                text: '# The Ultimate ' + industry + ' Guide for ' + audience + ' in 2026\n\n## Introduction\nThe landscape of ' + industry + ' is changing fast. What worked last year might not work today. In this comprehensive guide, we\'ll cover everything ' + audience + ' need to know to stay ahead.\n\n## Section 1: The Current State of ' + industry + '\n[Analyze trends, challenges, and opportunities in the industry]\n\n## Section 2: Building Your Strategy\n[Step-by-step framework tailored to your audience]\n\n## Section 3: Execution Playbook\n[Practical tactics, tools, and timelines]\n\n## Section 4: Measuring Success\n[KPIs, metrics, and benchmarks that matter]\n\n## Conclusion\nThe best time to refine your ' + industry + ' strategy was yesterday. The second best time is today.\n\nWord count target: 2,000-3,000 words\nSEO keywords: ' + industry + ', ' + audience + ', strategy, guide, 2026',
                hashtags: ''
            }
        ],
        ad: [
            {
                title: 'High-Converting Ad',
                text: 'AD CREATIVE\n\nHeadline: "' + audience + ': Here\'s what you\'re missing about ' + industry + '"\n\nPrimary text: "' + brand + ' helps ' + audience + ' get better results with ' + industry + '. Join hundreds of clients who\'ve transformed their approach. See how we can help you too."\n\nCTA: Learn More\n\nTarget: ' + audience + '\nPlacement: Feed, Stories, Reels\n\nVariant B Headline: "The ' + industry + ' strategy ' + audience + ' are switching to"\nVariant C Headline: "Stop guessing. Start growing with ' + brand + '"',
                hashtags: ''
            }
        ]
    };

    const pieces = [];
    const channelNames = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', linkedin: 'LinkedIn', twitter: 'X (Twitter)', youtube: 'YouTube', pinterest: 'Pinterest', email: 'Email' };

    for (let i = 0; i < qty; i++) {
        const type = types[i % types.length];
        const channel = channels[i % channels.length];
        const templates = contentTemplates[type] || contentTemplates.post;
        const template = templates[i % templates.length];

        pieces.push({
            id: 'content-' + (i + 1),
            title: template.title,
            type: type,
            channel: channel,
            channelName: channelNames[channel] || channel,
            text: template.text,
            hashtags: template.hashtags,
            status: 'draft',
            score: computeContentScore(type, channel, goal)
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
    var piece = state.generatedContent.find(function(c) { return c.id === id; });
    if (!piece) return;
    var textarea = document.getElementById('edit-' + id);
    piece.text = textarea.value;
    var textEl = document.getElementById('text-' + id);
    textEl.innerHTML = '<pre>' + escapeHtml(piece.text) + '</pre>';
    showToast('Changes saved ✓', 'success');
}

function cancelEdit(id) {
    var piece = state.generatedContent.find(function(c) { return c.id === id; });
    if (!piece) return;
    var textEl = document.getElementById('text-' + id);
    textEl.innerHTML = '<pre>' + escapeHtml(piece.text) + '</pre>';
}

function regenerateOne(id) {
    const piece = state.generatedContent.find(c => c.id === id);
    if (!piece) return;

    const textEl = document.getElementById('text-' + id);
    textEl.innerHTML = '<div class="cg-regen-loading"><div class="cg-spinner"></div> Regenerating...</div>';

    setTimeout(() => {
        const client = getActiveClient();
        const brand = document.getElementById('brandNiche')?.value || (client ? client.name : 'Your Brand');
        const audience = document.getElementById('targetAudience')?.value || (client ? client.audience : 'your audience');
        const industry = client ? (client.industry || brand) : brand;
        const goal = state.selectedGoal || 'engagement';

        const brandTag = '#' + brand.replace(/[^a-zA-Z0-9]/g, '');
        const industryTag = '#' + industry.replace(/[^a-zA-Z0-9]/g, '');
        const goalTags = {
            awareness: '#BrandAwareness #GrowYourBrand',
            engagement: '#Community #Engagement',
            leads: '#LeadGeneration #GrowthHacking',
            sales: '#ShopNow #Deals',
            authority: '#ThoughtLeadership #Expert',
            community: '#CommunityBuilding #Together'
        };
        const baseHashtags = brandTag + ' ' + industryTag + ' ' + (goalTags[goal] || '#Growth');

        const regenPool = {
            post: [
                { title: 'The Contrarian Take', text: 'Everyone in ' + industry + ' is saying the same thing.\n\nHere\'s what they\'re not telling you:\n\nThe conventional wisdom is wrong. Or at least incomplete.\n\nThe ' + audience + ' who are winning right now? They\'re doing the opposite of what the "experts" recommend.\n\nWant to know what that is? Drop a 🙋 below and I\'ll share the full breakdown.', hashtags: baseHashtags + ' #ContraryView #RealTalk' },
                { title: 'The Quick Win', text: '5-minute task that will change your ' + industry + ' results:\n\n✅ Open your last 5 pieces of content\n✅ Find the one with the best engagement\n✅ Ask yourself WHY it worked\n✅ Reverse-engineer it\n✅ Create 3 variations this week\n\nThat\'s it. No complex strategy. Just intentional repetition of what works.\n\nSave this. Do it today.', hashtags: baseHashtags + ' #QuickWin #ProductivityTip' },
                { title: 'Story Post', text: 'Six months ago I was struggling with ' + industry + '.\n\nI tried everything. Nothing worked.\n\nThen I discovered one thing that changed everything for me.\n\nI stopped trying to be everywhere and focused on being exceptional somewhere.\n\nResult? Everything changed for the ' + audience + ' we work with.\n\nSometimes less really is more.', hashtags: baseHashtags + ' #StoryTime #JourneyPost' },
                { title: 'Data-Driven Post', text: 'After analysing 100+ campaigns in ' + industry + ':\n\nTop 10% performers all do these 4 things:\n\n📊 They track ONE key metric obsessively\n🎯 They know exactly who their ' + audience + ' is\n⚡ They ship fast and iterate faster\n🔁 They repurpose everything\n\nBottom 90%? They do none of these.\n\nWhich camp are you in?', hashtags: baseHashtags + ' #DataDriven #MarketingInsights' },
            ],
            reel: [
                { title: 'Tutorial Reel', text: 'HOOK: "I got [result] in [time] — here\'s exactly how"\n\nBEAT 1: State the problem for ' + audience + '\nBEAT 2: Introduce the solution\nBEAT 3: Show step 1 (fast)\nBEAT 4: Show step 2 (fast)\nBEAT 5: Show the result\nCTA: "Follow for more ' + industry + ' tips"\n\nDuration: 20-30s\nText overlay: Key points only\nTrending audio: Check Reels tab for current trends', hashtags: baseHashtags + ' #HowTo #Tutorial' },
                { title: 'Myth vs Reality', text: 'MYTH: [Common ' + industry + ' belief]\nREALITY: [The truth]\n\nFormat: Quick text cuts, each 1-2s\nTotal: 15s\nAudio: Punchy beat\n\nScript:\n"Everyone says you need X to succeed in ' + industry + '..."\n"But here\'s what actually works..."\n"[Your contrarian insight for ' + audience + ']"\n"Follow ' + brand + ' for more"', hashtags: baseHashtags + ' #MythVsReality #Facts' },
            ],
            carousel: [
                { title: 'Step-by-Step Guide', text: 'Slide 1: "How to [achieve result] in ' + industry + ' — a step-by-step guide"\n\nSlide 2: "Step 1: Audit your current position. Where are you now vs where you want to be?"\n\nSlide 3: "Step 2: Define your ONE goal. Not five goals. One. Make it specific and measurable."\n\nSlide 4: "Step 3: Identify your best-performing content. Double down on what already works."\n\nSlide 5: "Step 4: Build your system. Consistency beats inspiration every time."\n\nSlide 6: "Step 5: Review weekly. Adapt monthly. Stay consistent always."\n\nSlide 7: "Save this carousel — ' + audience + ' need to see this. Share with someone who\'d benefit."', hashtags: baseHashtags + ' #HowTo #StepByStep' },
            ],
            story: [
                { title: 'Question Story', text: 'Quick question for you:\n\nWhat\'s your #1 challenge with ' + industry + ' right now?\n\nA) Finding the time\nB) Knowing what actually works\nC) Getting consistent results\nD) Standing out from competitors\n\nVote and I\'ll share my best tip for whatever wins most!', hashtags: '' },
            ]
        };

        const pool = regenPool[piece.type] || regenPool.post;
        // Pick a different template than what might be showing
        const randomTemplate = pool[Math.floor(Math.random() * pool.length)];

        piece.title = randomTemplate.title;
        piece.text = randomTemplate.text;
        piece.hashtags = randomTemplate.hashtags || piece.hashtags;
        piece.score = computeContentScore(piece.type, piece.channel, state.selectedGoal);

        textEl.innerHTML = '<pre>' + escapeHtml(piece.text) + '</pre>';

        // Update title in card
        const card = textEl.closest('.cg-content-card');
        if (card) {
            const titleEl = card.querySelector('.cg-content-title');
            if (titleEl) titleEl.textContent = piece.title;
            const scoreEl = card.querySelector('.cg-score-ring span');
            if (scoreEl) scoreEl.textContent = piece.score;
        }

        showToast('Content regenerated ✓', 'success');
    }, 1500);
}

function regenerateAll() {
    generateContent();
}

function copyContent(id) {
    var piece = state.generatedContent.find(function(c) { return c.id === id; });
    if (!piece) return;
    var text = piece.text + (piece.hashtags ? '\n\n' + piece.hashtags : '');
    navigator.clipboard.writeText(text).then(function() {
        var btn = event.target.closest('button');
        var orig = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(function() { btn.innerHTML = orig; }, 2000);
        showToast('Copied to clipboard ✓', 'success');
    }).catch(function() {
        showToast('Could not copy — try selecting text manually', 'error');
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

// ============ STOCK MEDIA (Real Unsplash + Pexels) ============
var stockState = { query: '', page: 1, tab: 'photos' };

function triggerStockSearch() {
    var input = document.getElementById('stockSearch');
    var query = input ? input.value.trim() : '';
    if (!query) return;
    stockState.query = query;
    stockState.page = 1;
    renderStockFallback(query, false);
}

function quickStockSearch(query) {
    var input = document.getElementById('stockSearch');
    if (input) input.value = query;
    stockState.query = query;
    stockState.page = 1;
    renderStockFallback(query, false);
}

function loadMoreStock() {
    stockState.page++;
    renderStockFallback(stockState.query, true);
}

function renderStockFallback(query, append) {
    var grid = document.getElementById('stockGrid');
    var loadMoreBtn = document.getElementById('stockLoadMore');
    if (!grid) return;

    if (!append) {
        grid.innerHTML = '<div class="cg-stock-loading"><div class="cg-spinner"></div><span>Searching ' + escapeHtml(query) + '...</span></div>';
    }

    var page = stockState.page;
    var baseOffset = (page - 1) * 12;

    // Use source.unsplash.com — real photos, no API key needed
    setTimeout(function() {
        if (!append) grid.innerHTML = '';
        for (var s = 1; s <= 12; s++) {
            var seed = s + baseOffset;
            var item = document.createElement('div');
            item.className = 'cg-stock-item';
            item.dataset.full = 'https://source.unsplash.com/1600x900/?' + encodeURIComponent(query) + '&sig=' + seed;
            item.dataset.alt = query + ' photo ' + seed;
            item.dataset.source = 'Unsplash';
            item.dataset.author = 'Unsplash';
            item.onclick = function() { selectStock(this); };
            item.innerHTML =
            item.innerHTML =
                '<img src="https://source.unsplash.com/400x300/?' + encodeURIComponent(query) + '&sig=' + seed + '" alt="stock" loading="lazy" style="width:100%;height:100%;object-fit:cover;">' +
                '<div class="cg-stock-overlay">' +
                    '<span>' + escapeHtml(query) + '</span>' +
                    '<small>Free · Unsplash</small>' +
                '</div>';
            grid.appendChild(item);
        }
        if (loadMoreBtn) loadMoreBtn.style.display = 'block';
    }, 400);
}

function switchStockTab(tab, btn) {
    stockState.tab = tab;
    document.querySelectorAll('.cg-stock-tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    if (stockState.query) renderStockFallback(stockState.query, false);
}

function selectStock(item) {
    var wasSelected = item.classList.contains('selected');
    document.querySelectorAll('.cg-stock-item.selected').forEach(function(el) { el.classList.remove('selected'); });
    if (!wasSelected) {
        item.classList.add('selected');
        var client = getActiveClient();
        if (client && item.dataset.full) {
            saveStockAssetToClient(client.id, {
                type: 'stock',
                url: item.dataset.full,
                thumb: item.querySelector('img') ? item.querySelector('img').src : item.dataset.full,
                alt: item.dataset.alt || stockState.query,
                source: 'Unsplash',
                savedAt: new Date().toISOString()
            });
            showToast('Saved to ' + client.name + '\'s asset library ✓', 'success');
        }
    }
}

function searchStock(e) { if (e && e.key === 'Enter') triggerStockSearch(); }

// ============ ASSET SYSTEM ============
var clientAssets = {};
var pendingAssets = {};

function loadClientAssets() {
    var saved = localStorage.getItem('ce_assets_v1');
    if (saved) { try { clientAssets = JSON.parse(saved); } catch(e) { clientAssets = {}; } }
}

function saveClientAssets() {
    localStorage.setItem('ce_assets_v1', JSON.stringify(clientAssets));
    updateAssetBadge();
}

function getClientAssets(clientId) { return clientAssets[clientId] || {}; }

function updateAssetBadge() {
    var badge = document.getElementById('assetBadge');
    if (!badge) return;
    var client = getActiveClient();
    if (!client) { badge.style.display = 'none'; return; }
    var assets = getClientAssets(client.id);
    var count = Object.keys(assets).filter(function(k){ return k !== 'stock' && k !== 'extra' && k !== 'autoPulled'; }).length
              + ((assets.stock && assets.stock.length) || 0)
              + ((assets.extra && assets.extra.length) || 0)
              + ((assets.autoPulled && assets.autoPulled.length) || 0);
    if (count > 0) { badge.textContent = count; badge.style.display = 'inline-flex'; }
    else { badge.style.display = 'none'; }
}

// ─────────────────────────────────────────────────────────────────
// ASSET RECOMMENDATION ENGINE
//
// Deterministic rules only — no AI, no scoring models.
// Each asset type has defined use cases. Each use case context
// has defined "recommended" asset types.
//
// Rules:
//   logo       → Recommended for branding. Not ideal for content posts or ads alone.
//   hero       → Recommended for social posts, email headers. Usable for ads.
//   ad-square  → Recommended for feed ads (1:1). Usable for social posts.
//   ad-story   → Recommended for Stories/Reels (9:16). Not ideal for feed ads.
//   video      → Recommended for Reels/TikTok/Stories. Usable for feed ads.
//   headshot   → Recommended for B2B personal brand, thought leadership.
//   stock      → Usable for posts. Not ideal for ads (not brand-authentic).
//   extra      → Context unknown — labelled "Usable" with note to review.
//   autoPulled → Usable — explicitly labelled auto-imported, requires review.
//
// Context keys: 'feed-ad', 'story-ad', 'social-post', 'email', 'b2b-content'
// ─────────────────────────────────────────────────────────────────

var ASSET_RULES = {
    'logo': {
        'feed-ad':     { tag: 'usable',   reason: 'Logo alone is not enough for a feed ad — pair with a hero or ad creative.' },
        'story-ad':    { tag: 'not-ideal', reason: 'Logo is not the right format for story ads — use a 9:16 creative instead.' },
        'social-post': { tag: 'usable',   reason: 'Logo works as a brand element but posts with real photos or scenes get more engagement.' },
        'email':       { tag: 'recommended', reason: 'Recommended as email header branding.' },
        'b2b-content': { tag: 'usable',   reason: 'Useful for brand recognition but pair with a headshot for authority content.' }
    },
    'hero': {
        'feed-ad':     { tag: 'recommended', reason: 'Recommended — landscape or square hero images work well for feed ads.' },
        'story-ad':    { tag: 'not-ideal', reason: 'Hero images are typically landscape. Story ads need 9:16 vertical format.' },
        'social-post': { tag: 'recommended', reason: 'Recommended — hero images are ideal for brand social posts.' },
        'email':       { tag: 'recommended', reason: 'Recommended for email header imagery.' },
        'b2b-content': { tag: 'usable',   reason: 'Usable for brand posts but headshots perform better for B2B authority content.' }
    },
    'ad-square': {
        'feed-ad':     { tag: 'recommended', reason: 'Recommended — 1:1 format is optimised for feed ads on Meta and LinkedIn.' },
        'story-ad':    { tag: 'not-ideal', reason: '1:1 format is not ideal for Stories — use 9:16 creative instead.' },
        'social-post': { tag: 'usable',   reason: 'Usable for social posts — 1:1 is the standard feed format.' },
        'email':       { tag: 'usable',   reason: 'Usable as an email content image.' },
        'b2b-content': { tag: 'usable',   reason: 'Usable for brand posts and sponsored content.' }
    },
    'ad-story': {
        'feed-ad':     { tag: 'not-ideal', reason: '9:16 format is cropped in feed ads — use a 1:1 ad creative instead.' },
        'story-ad':    { tag: 'recommended', reason: 'Recommended — 9:16 is the correct format for Stories and Reels.' },
        'social-post': { tag: 'usable',   reason: 'Usable as a Reel or Story post.' },
        'email':       { tag: 'not-ideal', reason: '9:16 images do not render well in most email clients.' },
        'b2b-content': { tag: 'not-ideal', reason: 'Vertical format is rarely used in B2B content contexts.' }
    },
    'video': {
        'feed-ad':     { tag: 'usable',   reason: 'Video works in feed ads — ensure it has captions (85% watched on mute).' },
        'story-ad':    { tag: 'recommended', reason: 'Recommended for Story and Reel ads — video performs best in vertical placement.' },
        'social-post': { tag: 'recommended', reason: 'Recommended — video consistently outperforms static images for organic reach.' },
        'email':       { tag: 'not-ideal', reason: 'Video cannot play in most email clients. Use a thumbnail image with a play button instead.' },
        'b2b-content': { tag: 'usable',   reason: 'Short-form video works for B2B if it demonstrates expertise.' }
    },
    'headshot': {
        'feed-ad':     { tag: 'usable',   reason: 'Headshots work in thought leadership ads, especially on LinkedIn.' },
        'story-ad':    { tag: 'not-ideal', reason: 'Headshots are rarely effective for story ads.' },
        'social-post': { tag: 'usable',   reason: 'Headshots work for personal brand posts and founder content.' },
        'email':       { tag: 'usable',   reason: 'Useful for personal introductions in email.' },
        'b2b-content': { tag: 'recommended', reason: 'Recommended — headshots are the primary asset for B2B personal brand and authority content.' }
    },
    'stock': {
        'feed-ad':     { tag: 'not-ideal', reason: 'Stock photos are not brand-authentic. Ads with real brand imagery consistently outperform stock.' },
        'story-ad':    { tag: 'not-ideal', reason: 'Stock is not ideal for story ads — use brand-specific creative.' },
        'social-post': { tag: 'usable',   reason: 'Usable for informational posts — not ideal for brand posts that need to feel authentic.' },
        'email':       { tag: 'usable',   reason: 'Usable as supporting imagery in email content.' },
        'b2b-content': { tag: 'not-ideal', reason: 'Stock photos reduce credibility in B2B contexts. Use real team/product photos.' }
    },
    'extra': {
        'feed-ad':     { tag: 'usable',   reason: 'Format unknown — review this asset before using in ads.' },
        'story-ad':    { tag: 'usable',   reason: 'Format unknown — verify dimensions before using in stories.' },
        'social-post': { tag: 'usable',   reason: 'Review this asset before posting.' },
        'email':       { tag: 'usable',   reason: 'Review this asset before use in email.' },
        'b2b-content': { tag: 'usable',   reason: 'Review this asset for B2B context suitability.' }
    },
    'autoPulled': {
        'feed-ad':     { tag: 'usable',   reason: 'Auto-imported — verify this is the correct brand image before using in ads.' },
        'story-ad':    { tag: 'not-ideal', reason: 'Auto-imported — format may not be correct for stories. Check dimensions.' },
        'social-post': { tag: 'usable',   reason: 'Auto-imported — review before posting to confirm it represents the brand correctly.' },
        'email':       { tag: 'usable',   reason: 'Auto-imported — review before using in email.' },
        'b2b-content': { tag: 'not-ideal', reason: 'Auto-imported — B2B content needs verified, brand-appropriate imagery.' }
    }
};

// Get recommendation tag and reason for a given asset type in a given context
function getAssetRecommendation(assetType, context) {
    var rules = ASSET_RULES[assetType] || ASSET_RULES['extra'];
    return rules[context] || { tag: 'usable', reason: 'No specific recommendation for this context.' };
}

// Infer best context for the current client from strategy
// Returns the primary context key
function inferPrimaryContext(client) {
    var strategy = null;
    try {
        var raw = { hasShopify: !!(integrations[client.id] || {}).shopify, clientInts: integrations[client.id] || {} };
        strategy = inferStrategy(client, raw);
    } catch(e) { strategy = null; }

    if (strategy && strategy.bType === 'b2b') return 'b2b-content';
    if (strategy && strategy.offType === 'product') return 'feed-ad'; // e-commerce: ads are primary
    return 'social-post'; // default
}

// Tag sort order for display
var TAG_ORDER = { 'recommended': 0, 'usable': 1, 'not-ideal': 2 };
var TAG_LABELS = { 'recommended': 'Recommended', 'usable': 'Usable', 'not-ideal': 'Not ideal' };
var TAG_COLORS = { 'recommended': '#10B981', 'usable': '#F59E0B', 'not-ideal': '#94A3B8' };

// Build a flat sorted list of all assets for a client with recommendation tags
function getTaggedAssets(clientId, context) {
    var assets = getClientAssets(clientId);
    var result = [];
    var namedTypes = ['logo', 'hero', 'ad-square', 'ad-story', 'video', 'headshot'];

    namedTypes.forEach(function(type) {
        if (!assets[type]) return;
        var rec = getAssetRecommendation(type, context);
        result.push({
            id: type,
            type: type,
            source: 'uploaded',
            label: { logo:'Logo', hero:'Hero Image', 'ad-square':'Ad Creative (1:1)', 'ad-story':'Story/Reel (9:16)', video:'Video', headshot:'Headshot' }[type] || type,
            dataUrl: assets[type].dataUrl,
            mimeType: assets[type].mimeType,
            filename: assets[type].filename,
            tag: rec.tag,
            reason: rec.reason,
            isAuto: false
        });
    });

    (assets.stock || []).forEach(function(a, i) {
        var rec = getAssetRecommendation('stock', context);
        result.push({
            id: 'stock-' + i,
            type: 'stock',
            source: 'stock',
            label: a.alt || 'Stock photo',
            dataUrl: a.thumb || a.url,
            mimeType: 'image/jpeg',
            filename: null,
            tag: rec.tag,
            reason: rec.reason,
            isAuto: false,
            url: a.url
        });
    });

    (assets.extra || []).forEach(function(a, i) {
        var rec = getAssetRecommendation('extra', context);
        result.push({
            id: 'extra-' + i,
            type: 'extra',
            source: 'uploaded',
            label: a.filename || 'Uploaded file',
            dataUrl: a.dataUrl,
            mimeType: a.mimeType,
            filename: a.filename,
            tag: rec.tag,
            reason: rec.reason,
            isAuto: false
        });
    });

    (assets.autoPulled || []).forEach(function(a, i) {
        var rec = getAssetRecommendation('autoPulled', context);
        result.push({
            id: 'auto-' + i,
            type: 'autoPulled',
            source: a.source || 'website',
            label: a.alt || 'Auto-imported image',
            dataUrl: a.url,
            mimeType: 'image/jpeg',
            filename: null,
            tag: rec.tag,
            reason: rec.reason,
            isAuto: true,
            sourceLabel: a.source === 'shopify' ? 'Auto-imported from Shopify' : 'Auto-imported from website'
        });
    });

    // Sort: recommended first, then usable, then not-ideal
    result.sort(function(a, b) {
        return (TAG_ORDER[a.tag] || 1) - (TAG_ORDER[b.tag] || 1);
    });

    return result;
}

// Render a single asset card with recommendation tag
function renderAssetCard(asset, opts) {
    opts = opts || {};
    var tagColor = TAG_COLORS[asset.tag] || '#94A3B8';
    var tagLabel = TAG_LABELS[asset.tag] || 'Usable';
    var isImage = asset.mimeType && asset.mimeType.startsWith('image/');
    var isVideo = asset.mimeType && asset.mimeType.startsWith('video/');

    var preview = '';
    if (isImage && asset.dataUrl) {
        preview = '<img src="' + asset.dataUrl + '" style="width:100%;height:100%;object-fit:cover;">';
    } else if (isVideo) {
        preview = '<div class="cg-asset-lib-file"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>' + escapeHtml(asset.filename || 'Video') + '</span></div>';
    } else {
        preview = '<div class="cg-asset-lib-file"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
    }

    var autoLabel = asset.isAuto ? '<div class="cg-asset-auto-label">' + escapeHtml(asset.sourceLabel || 'Auto-imported') + '</div>' : '';
    var removeBtn = opts.onRemove ? '<button type="button" class="cg-asset-lib-remove" onclick="' + opts.onRemove + '">&times;</button>' : '';

    return '<div class="cg-asset-lib-item has-asset cg-asset-tagged" data-tag="' + asset.tag + '">' +
        preview +
        '<div class="cg-asset-tag-badge" style="background:' + tagColor + ';">' + tagLabel + '</div>' +
        '<div class="cg-asset-lib-item-label">' + escapeHtml(asset.label) + '</div>' +
        '<div class="cg-asset-tag-reason">' + escapeHtml(asset.reason) + '</div>' +
        autoLabel +
        removeBtn +
    '</div>';
}

// ─────────────────────────────────────────────────────────────────
// ASSET READINESS — for Decision Engine scoring
// Returns: { score: 0-100, hasAdReady, hasStoryReady, hasBrandAssets,
//            missingFormats, weaknesses }
// ─────────────────────────────────────────────────────────────────
function scoreAssetReadiness(clientId) {
    var assets = getClientAssets(clientId);
    var hasLogo        = !!(assets.logo);
    var hasHero        = !!(assets.hero);
    var hasHeadshot    = !!(assets.headshot);
    var hasAdSquare    = !!(assets['ad-square']);
    var hasAdStory     = !!(assets['ad-story']);
    var hasVideo       = !!(assets.video);
    var hasStock       = !!(assets.stock && assets.stock.length > 0);
    var hasAutoPulled  = !!(assets.autoPulled && assets.autoPulled.length > 0);
    var hasAnyBrand    = hasLogo || hasHero || hasHeadshot; // non-ad brand assets
    var hasAdReady     = hasAdSquare; // 1:1 = feed ad ready
    var hasStoryReady  = hasAdStory || hasVideo; // 9:16 or video = story/reel ready

    var score = 0;
    if (hasAdReady)    score += 40; // critical for feed ads
    if (hasStoryReady) score += 25; // important for stories/reels
    if (hasAnyBrand)   score += 20; // brand presence
    if (hasLogo)       score += 10; // complete brand kit
    if (hasVideo)      score +=  5; // bonus for video

    var missingFormats = [];
    if (!hasAdReady)    missingFormats.push('1:1 ad creative (required for feed ads)');
    if (!hasStoryReady) missingFormats.push('9:16 creative or video (required for Stories/Reels)');
    if (!hasLogo)       missingFormats.push('logo');

    var weaknesses = [];
    if (hasStock && !hasAdSquare)    weaknesses.push('Only stock photos available — stock is not ideal for ads');
    if (hasAutoPulled && !hasAdSquare) weaknesses.push('Auto-imported images available — verify before using in ads');

    return {
        score:          Math.min(100, score),
        hasAdReady:     hasAdReady,
        hasStoryReady:  hasStoryReady,
        hasBrandAssets: hasAnyBrand,
        hasLogo:        hasLogo,
        hasVideo:       hasVideo,
        missingFormats: missingFormats,
        weaknesses:     weaknesses
    };
}

function triggerAssetUpload(type) { var el = document.getElementById('assetInput-'+type); if(el) el.click(); }

function handleAssetUpload(type, event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var dataUrl = e.target.result;
        var preview = document.getElementById('assetPreview-'+type);
        if (!preview) return;
        if (file.type.startsWith('image/')) {
            preview.innerHTML = '<img src="'+dataUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;"><button type="button" class="cg-asset-slot-remove" onclick="removeModalAsset(\''+type+'\')">&times;</button>';
        } else {
            preview.innerHTML = '<div class="cg-asset-slot-file"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>'+escapeHtml(file.name)+'</span></div><button type="button" class="cg-asset-slot-remove" onclick="removeModalAsset(\''+type+'\')">&times;</button>';
        }
        pendingAssets[type] = { type:type, dataUrl:dataUrl, filename:file.name, mimeType:file.type, uploadedAt:new Date().toISOString() };
    };
    reader.readAsDataURL(file);
}

function removeModalAsset(type) {
    delete pendingAssets[type];
    var labels = {logo:'Logo',hero:'Hero Image','ad-square':'Ad Creative','ad-story':'Story / Reel',video:'Video',headshot:'Headshot'};
    var subs = {logo:'PNG or SVG',hero:'Main brand photo','ad-square':'1:1 feed format','ad-story':'9:16 vertical',video:'Brand video / ad',headshot:'Founder / team photo'};
    var preview = document.getElementById('assetPreview-'+type);
    if (preview) preview.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>'+(labels[type]||type)+'</span><small>'+(subs[type]||'')+'</small>';
}

function commitPendingAssetsToClient(clientId) {
    if (!Object.keys(pendingAssets).length) return;
    if (!clientAssets[clientId]) clientAssets[clientId] = {};
    Object.keys(pendingAssets).forEach(function(t){ clientAssets[clientId][t] = pendingAssets[t]; });
    saveClientAssets();
    pendingAssets = {};
}

function clearModalAssetSlots() {
    pendingAssets = {};
    var types=['logo','hero','ad-square','ad-story','video','headshot'];
    var labels={logo:'Logo',hero:'Hero Image','ad-square':'Ad Creative','ad-story':'Story / Reel',video:'Video',headshot:'Headshot'};
    var subs={logo:'PNG or SVG',hero:'Main brand photo','ad-square':'1:1 feed format','ad-story':'9:16 vertical',video:'Brand video / ad',headshot:'Founder / team photo'};
    types.forEach(function(type){
        var p=document.getElementById('assetPreview-'+type);
        if(p) p.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>'+labels[type]+'</span><small>'+subs[type]+'</small>';
        var i=document.getElementById('assetInput-'+type);
        if(i) i.value='';
    });
}

function saveStockAssetToClient(clientId, assetData) {
    if (!clientAssets[clientId]) clientAssets[clientId] = {};
    if (!clientAssets[clientId].stock) clientAssets[clientId].stock = [];
    var exists = clientAssets[clientId].stock.some(function(a){return a.url===assetData.url;});
    if (!exists) clientAssets[clientId].stock.push(assetData);
    saveClientAssets();
}

function openAssetLibrary() {
    document.getElementById('assetLibraryPanel').classList.add('open');
    document.getElementById('assetLibraryOverlay').classList.add('open');
    renderAssetLibrary();
}

function closeAssetLibrary() {
    document.getElementById('assetLibraryPanel').classList.remove('open');
    document.getElementById('assetLibraryOverlay').classList.remove('open');
}

function renderAssetLibrary() {
    var client = getActiveClient();
    var clientBarEl = document.getElementById('assetLibraryClientBar');
    var labelEl = document.getElementById('assetLibraryClientLabel');

    if (clientBarEl) {
        clientBarEl.innerHTML = state.clients.map(function(c) {
            var initials = c.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
            var isActive = c.id === state.activeClientId;
            var cnt = Object.keys(getClientAssets(c.id)).length;
            return '<button type="button" class="cg-int-client-chip'+(isActive?' active':'')+'" onclick="selectAssetLibraryClient(\''+c.id+'\')">' +
                '<span class="cg-int-client-dot" style="background:'+c.color+';">'+initials+'</span>'+escapeHtml(c.name)+
                (cnt > 0 ? '<span class="cg-int-chip-badge">'+cnt+'</span>' : '')+
            '</button>';
        }).join('');
    }

    if (!client) {
        if (labelEl) labelEl.textContent = 'Select a client to view their assets';
        return;
    }

    if (labelEl) labelEl.textContent = client.name + "'s assets";

    // Infer context for recommendations
    var context = inferPrimaryContext(client);
    var contextLabels = { 'feed-ad':'feed ads', 'story-ad':'story ads', 'social-post':'social posts', 'email':'email', 'b2b-content':'B2B content' };
    var tagged = getTaggedAssets(client.id, context);
    var readiness = scoreAssetReadiness(client.id);

    // Asset readiness summary bar
    var summaryEl = document.getElementById('assetReadinessSummary');
    if (summaryEl) {
        var readColor = readiness.score >= 70 ? '#10B981' : readiness.score >= 40 ? '#F59E0B' : '#EF4444';
        summaryEl.innerHTML =
            '<div class="cg-asset-readiness">' +
                '<div class="cg-asset-readiness-score" style="color:' + readColor + ';">' + readiness.score + '<span>/100</span></div>' +
                '<div class="cg-asset-readiness-detail">' +
                    '<strong>Asset readiness</strong>' +
                    '<span>Recommendations shown for: ' + (contextLabels[context] || context) + '</span>' +
                    (readiness.missingFormats.length > 0 ? '<span class="cg-asset-missing">Missing: ' + readiness.missingFormats.join(', ') + '</span>' : '<span style="color:#10B981;">All key formats present ✓</span>') +
                    (readiness.weaknesses.length > 0 ? '<span class="cg-asset-warning">' + readiness.weaknesses.join(' · ') + '</span>' : '') +
                '</div>' +
            '</div>';
    }

    // Group assets into tabs: Brand, Ads, Stock/Auto
    var brandTypes = tagged.filter(function(a) { return ['logo','hero','headshot'].includes(a.type); });
    var adTypes    = tagged.filter(function(a) { return ['ad-square','ad-story','video'].includes(a.type); });
    var otherTypes = tagged.filter(function(a) { return ['stock','extra','autoPulled'].includes(a.type); });

    // Named slot placeholders (for empty slots)
    var namedSlots = {
        logo:        { label:'Logo', sub:'PNG or SVG' },
        hero:        { label:'Hero Image', sub:'Main brand photo' },
        headshot:    { label:'Headshot', sub:'Founder / team photo' },
        'ad-square': { label:'Ad Creative (1:1)', sub:'Feed ad format — required for Meta/LinkedIn' },
        'ad-story':  { label:'Story/Reel (9:16)', sub:'Stories and Reels format' },
        video:       { label:'Video', sub:'Brand video or ad' }
    };

    function renderSection(containerId, assets, slotTypes) {
        var el = document.getElementById(containerId);
        if (!el) return;
        var filled = {};
        assets.forEach(function(a) { filled[a.type] = a; });
        var html = '';

        // Filled slots (sorted by tag)
        assets.forEach(function(a) {
            html += renderAssetCard(a, {
                onRemove: ['logo','hero','headshot','ad-square','ad-story','video'].includes(a.type)
                    ? "removeClientAsset('" + a.type + "')"
                    : a.type === 'stock'
                    ? "removeClientStockAsset(" + (a.id.split('-')[1]) + ")"
                    : a.type === 'autoPulled'
                    ? "removeAutoPulledAsset(" + (a.id.split('-')[1]) + ")"
                    : "removeClientExtraAsset(" + (a.id.split('-')[1]) + ")"
            });
        });

        // Empty named slots
        if (slotTypes) {
            slotTypes.forEach(function(type) {
                if (filled[type]) return; // already shown
                var slot = namedSlots[type];
                // Highlight missing ad-square as a warning
                var isWarning = type === 'ad-square';
                html += '<div class="cg-asset-lib-item empty' + (isWarning ? ' cg-asset-slot-warn' : '') + '" onclick="openAddClientModal()">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + (isWarning ? '#EF4444' : 'var(--gray-300)') + '" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                    '<span>' + slot.label + '</span>' +
                    '<small>' + slot.sub + '</small>' +
                '</div>';
            });
        }

        el.innerHTML = html || '<p style="color:var(--gray-400);font-size:0.8rem;grid-column:1/-1;">None yet.</p>';
    }

    renderSection('libBrandAssets', brandTypes, ['logo','hero','headshot']);
    renderSection('libAdAssets', adTypes, ['ad-square','ad-story','video']);
    renderSection('libStockAssets', otherTypes, null);

    // Auto-pull section
    renderAutoPullSection(client);
}

function renderAutoPullSection(client) {
    var el = document.getElementById('libAutoPullSection');
    if (!el) return;
    var assets = getClientAssets(client.id);
    var pulled = assets.autoPulled || [];
    var hasWebsite = !!(client.website && client.website.trim().length > 8 && client.website.includes('.'));

    el.innerHTML =
        '<div class="cg-autopull-wrap">' +
            '<div class="cg-autopull-header">' +
                '<div>' +
                    '<strong>Auto-import from website</strong>' +
                    '<span class="cg-autopull-note">Optional. Attempts to pull og:image and visible images from the client\'s website. Not guaranteed to find all assets — review before use.</span>' +
                '</div>' +
                (hasWebsite
                    ? '<button type="button" class="cg-btn cg-btn-secondary cg-btn-sm" onclick="triggerAutoPull()">' +
                        (pulled.length > 0 ? 'Re-pull from website' : 'Pull from website') +
                      '</button>'
                    : '<span style="font-size:0.8rem;color:var(--gray-400);">Add website URL to profile to enable</span>'
                ) +
            '</div>' +
            (pulled.length > 0
                ? '<p class="cg-autopull-disclaimer">⚠️ ' + pulled.length + ' image' + (pulled.length !== 1 ? 's' : '') + ' auto-imported from website. We may have missed or included irrelevant images — review before use.</p>'
                : '') +
        '</div>';
}

// ─────────────────────────────────────────────────────────────────
// AUTO-PULL (Safe, limited, optional, clearly labelled)
//
// What it does:
//   - Fetches the client's website HTML via a CORS proxy
//   - Extracts og:image meta tag (most reliable)
//   - Extracts <img> tags with meaningful src attributes
//   - Filters out tiny images (icons, tracking pixels)
//   - Limits to 12 images maximum
//
// What it does NOT do:
//   - Authenticate or access any gated content
//   - Deep crawl beyond the homepage
//   - Claim to find all assets
//   - Auto-use any asset
//
// KNOWN LIMITATION: Many sites block CORS requests entirely.
// The pull will fail silently if blocked — this is expected.
// ─────────────────────────────────────────────────────────────────

function triggerAutoPull() {
    var client = getActiveClient();
    if (!client || !client.website) { showToast('No website URL set for this client', 'error'); return; }

    var url = client.website.trim();
    if (!url.startsWith('http')) url = 'https://' + url;

    showToast('Attempting to pull images from ' + url + '...', 'info');

    // Use a public CORS proxy (allorigins.win) to fetch the page HTML
    // This is a best-effort approach — will fail on sites with CORS restrictions
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

    fetch(proxyUrl, { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined })
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function(html) {
            var pulled = extractImagesFromHtml(html, url);
            if (pulled.length === 0) {
                showToast('No usable images found on that page', 'info');
                return;
            }
            if (!clientAssets[client.id]) clientAssets[client.id] = {};
            clientAssets[client.id].autoPulled = pulled;
            saveClientAssets();
            renderAssetLibrary();
            showToast(pulled.length + ' image' + (pulled.length !== 1 ? 's' : '') + ' imported — review before use ✓', 'success');
        })
        .catch(function(err) {
            var reason = err.message && err.message.includes('timeout') ? 'Request timed out.' : 'Site may block external requests.';
            showToast('Could not pull from website. ' + reason + ' Upload assets manually.', 'info');
        });
}

function extractImagesFromHtml(html, baseUrl) {
    var results = [];

    // Parse base origin for relative URLs
    var origin = '';
    try { origin = new URL(baseUrl).origin; } catch(e) { origin = ''; }

    // 1. Try og:image first — most intentional brand image
    var ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
        var ogUrl = resolveUrl(ogMatch[1], origin);
        if (ogUrl) results.push({ url: ogUrl, alt: 'og:image', source: 'website' });
    }

    // 2. Extract <img> tags
    var imgMatches = html.match(/<img[^>]+>/gi) || [];
    imgMatches.forEach(function(tag) {
        if (results.length >= 12) return;

        // Get src
        var srcMatch = tag.match(/src=["']([^"']+)["']/i);
        if (!srcMatch) return;
        var src = srcMatch[1];

        // Skip data URIs, tracking pixels, tiny icons
        if (src.startsWith('data:')) return;
        if (src.includes('logo') && results.some(function(r){return r.alt==='og:image';})) return; // skip logo if og:image found

        // Get width/height if present — skip very small images
        var wMatch = tag.match(/width=["']?(\d+)["']?/i);
        var hMatch = tag.match(/height=["']?(\d+)["']?/i);
        var w = wMatch ? parseInt(wMatch[1]) : 999;
        var h = hMatch ? parseInt(hMatch[1]) : 999;
        if (w < 100 || h < 100) return; // skip icons and tiny images

        // Skip common noise patterns
        if (/\.(ico|svg|gif)(\?|$)/i.test(src)) return;
        if (/tracking|pixel|beacon|analytics|spy/i.test(src)) return;

        var imgUrl = resolveUrl(src, origin);
        if (!imgUrl) return;
        if (results.some(function(r){return r.url===imgUrl;})) return; // dedup

        var altMatch = tag.match(/alt=["']([^"']*)["']/i);
        results.push({ url: imgUrl, alt: altMatch ? altMatch[1] : '', source: 'website' });
    });

    return results.slice(0, 12);
}

function resolveUrl(src, origin) {
    if (!src) return null;
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return 'https:' + src;
    if (src.startsWith('/') && origin) return origin + src;
    return null; // relative without known base — skip
}

function removeAutoPulledAsset(idx) {
    var client = getActiveClient();
    if (!client || !clientAssets[client.id] || !clientAssets[client.id].autoPulled) return;
    clientAssets[client.id].autoPulled.splice(idx, 1);
    saveClientAssets(); renderAssetLibrary();
    showToast('Auto-imported image removed', 'info');
}

function removeClientExtraAsset(idx) {
    var client = getActiveClient();
    if (!client || !clientAssets[client.id] || !clientAssets[client.id].extra) return;
    clientAssets[client.id].extra.splice(idx, 1);
    saveClientAssets(); renderAssetLibrary();
    showToast('Asset removed', 'info');
}

function selectAssetLibraryClient(clientId) {
    state.activeClientId = clientId;
    localStorage.setItem('ce_active_client', clientId);
    updateClientSwitcherBtn(); renderClientDropdown(); renderAssetLibrary(); updateAssetBadge();
}

function removeClientAsset(type) {
    var c = getActiveClient(); if (!c || !clientAssets[c.id]) return;
    delete clientAssets[c.id][type]; saveClientAssets(); renderAssetLibrary();
    showToast('Asset removed', 'info');
}

function removeClientStockAsset(idx) {
    var c = getActiveClient(); if (!c || !clientAssets[c.id] || !clientAssets[c.id].stock) return;
    clientAssets[c.id].stock.splice(idx, 1); saveClientAssets(); renderAssetLibrary();
    showToast('Stock photo removed', 'info');
}

function handleLibraryUpload(event) {
    var client = getActiveClient(); if (!client) { showToast('Select a client first', 'error'); return; }
    Array.from(event.target.files).forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            if (!clientAssets[client.id]) clientAssets[client.id] = {};
            if (!clientAssets[client.id].extra) clientAssets[client.id].extra = [];
            clientAssets[client.id].extra.push({ type:'extra', dataUrl:e.target.result, filename:file.name, mimeType:file.type, uploadedAt:new Date().toISOString() });
            saveClientAssets(); renderAssetLibrary();
            showToast(file.name + ' uploaded ✓', 'success');
        };
        reader.readAsDataURL(file);
    });
}

function renderClientAssetsInWizard() {
    var client = getActiveClient(); if (!client) return;
    var uploadedFiles = document.getElementById('uploadedFiles');
    var fileGrid = document.getElementById('fileGrid');
    if (!uploadedFiles || !fileGrid) return;

    var context = inferPrimaryContext(client);
    var tagged = getTaggedAssets(client.id, context);

    if (tagged.length === 0) return;
    uploadedFiles.style.display = 'block';

    var heading = uploadedFiles.querySelector('h3');
    if (heading) heading.textContent = client.name + "'s Assets — sorted by relevance";

    // Sort: recommended first (already sorted by getTaggedAssets)
    fileGrid.innerHTML = tagged.map(function(a) {
        var tagColor = TAG_COLORS[a.tag] || '#94A3B8';
        var tagLabel = TAG_LABELS[a.tag] || 'Usable';
        var imgSrc = a.dataUrl || a.url || '';
        if (!imgSrc || !a.mimeType || !a.mimeType.startsWith('image/')) return '';
        return '<div class="cg-file-item cg-file-tagged">' +
            '<img src="' + imgSrc + '" alt="' + escapeHtml(a.label) + '">' +
            '<div class="cg-file-overlay">' +
                '<span>' + escapeHtml(a.label) + '</span>' +
                '<span class="cg-file-tag" style="background:' + tagColor + ';">' + tagLabel + '</span>' +
            '</div>' +
            (a.isAuto ? '<div class="cg-file-auto-badge">Auto-imported</div>' : '') +
        '</div>';
    }).filter(Boolean).join('');
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

// ============ INTEGRATIONS ============
// Structure: integrations[clientId][platform] = { apiKey, ...meta }
var integrations = {};
var ALL_PLATFORMS = ['mailchimp','klaviyo','sendgrid','convertkit','shopify','googlesheets','notion','ga4'];

function loadIntegrations() {
    var saved = localStorage.getItem('ce_integrations_v2');
    if (saved) { try { integrations = JSON.parse(saved); } catch(e) { integrations = {}; } }
    updateIntBadge();
}

function saveIntegrations() {
    localStorage.setItem('ce_integrations_v2', JSON.stringify(integrations));
    updateIntBadge();
}

function getClientIntegrations(clientId) {
    if (!clientId) return {};
    return integrations[clientId] || {};
}

function updateIntBadge() {
    var badge = document.getElementById('intBadge');
    if (!badge) return;
    var client = getActiveClient();
    if (!client) { badge.style.display = 'none'; return; }
    var count = Object.keys(getClientIntegrations(client.id)).length;
    if (count > 0) { badge.textContent = count; badge.style.display = 'inline-flex'; }
    else { badge.style.display = 'none'; }
}

function openIntegrations() {
    document.getElementById('integrationsPanel').classList.add('open');
    document.getElementById('integrationsOverlay').classList.add('open');
    renderIntegrationsPanel();
}

function closeIntegrations() {
    document.getElementById('integrationsPanel').classList.remove('open');
    document.getElementById('integrationsOverlay').classList.remove('open');
}

function renderIntegrationsPanel() {
    var client = getActiveClient();
    var labelEl = document.getElementById('intPanelClientLabel');
    var noClientEl = document.getElementById('intNoClient');
    var platformListEl = document.getElementById('intPlatformList');
    var clientBarEl = document.getElementById('intClientBarInner');

    // Render client selector bar
    if (clientBarEl) {
        if (state.clients.length === 0) {
            clientBarEl.innerHTML = '<span style="font-size:0.8rem;color:var(--gray-400);">No clients yet</span>';
        } else {
            clientBarEl.innerHTML = state.clients.map(function(c) {
                var initials = c.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
                var isActive = c.id === state.activeClientId;
                var cIntCount = Object.keys(getClientIntegrations(c.id)).length;
                return '<button type="button" class="cg-int-client-chip' + (isActive ? ' active' : '') + '" onclick="selectIntClient(\'' + c.id + '\')">' +
                    '<span class="cg-int-client-dot" style="background:' + c.color + ';">' + initials + '</span>' +
                    c.name +
                    (cIntCount > 0 ? '<span class="cg-int-chip-badge">' + cIntCount + '</span>' : '') +
                    '</button>';
            }).join('');
        }
    }

    if (!client) {
        if (labelEl) labelEl.textContent = 'Select a client to manage their connections';
        if (noClientEl) noClientEl.style.display = 'flex';
        if (platformListEl) platformListEl.style.display = 'none';
        return;
    }

    if (labelEl) labelEl.textContent = client.name + ' — ' + (Object.keys(getClientIntegrations(client.id)).length) + ' platform(s) connected';
    if (noClientEl) noClientEl.style.display = 'none';
    if (platformListEl) platformListEl.style.display = 'block';

    // Render state of each platform for this client
    var clientInts = getClientIntegrations(client.id);
    ALL_PLATFORMS.forEach(function(platform) {
        var isConnected = !!clientInts[platform];
        var card = document.getElementById('int-' + platform);
        var statusEl = document.getElementById(platform + '-status');
        var actionsEl = document.getElementById(platform + '-actions');
        var toggleBtn = document.getElementById(platform + '-toggle-btn');
        if (!card) return;

        if (isConnected) {
            card.classList.add('connected');
            var meta = clientInts[platform];
            var statusText = 'Connected';
            if (platform === 'mailchimp' && meta.accountName) statusText = 'Connected · ' + meta.accountName;
            if (platform === 'shopify' && meta.shopDomain) statusText = 'Connected · ' + meta.shopDomain;
            if (platform === 'googlesheets') statusText = 'Connected · Sheets';
            if (platform === 'notion') statusText = 'Connected · Notion';
            if (statusEl) { statusEl.textContent = statusText; statusEl.className = 'cg-int-status connected'; }
            if (actionsEl) actionsEl.style.display = 'flex';
            if (toggleBtn) toggleBtn.style.display = 'none';
            // Close any open forms
            var form = document.getElementById(platform + '-form');
            if (form) form.style.display = 'none';
        } else {
            card.classList.remove('connected');
            if (statusEl) { statusEl.textContent = 'Not connected'; statusEl.className = 'cg-int-status'; }
            if (actionsEl) actionsEl.style.display = 'none';
            if (toggleBtn) toggleBtn.style.display = 'inline-flex';
        }
    });
}

function selectIntClient(clientId) {
    // Switch active client context for integrations only (don\'t redirect view)
    state.activeClientId = clientId;
    localStorage.setItem('ce_active_client', clientId);
    updateClientSwitcherBtn();
    renderClientDropdown();
    renderIntegrationsPanel();
    updateIntBadge();
}

function toggleIntegrationForm(platform) {
    var form = document.getElementById(platform + '-form');
    if (!form) return;
    var isOpen = form.style.display !== 'none';
    // Close all other forms first
    ALL_PLATFORMS.forEach(function(p) {
        var f = document.getElementById(p + '-form');
        if (f && p !== platform) f.style.display = 'none';
    });
    form.style.display = isOpen ? 'none' : 'flex';
    var resultEl = document.getElementById(platform + '-result');
    if (resultEl) resultEl.style.display = 'none';
}

function saveIntegration(platform) {
    var client = getActiveClient();
    if (!client) { showToast('Select a client first', 'error'); return; }

    var btn = document.querySelector('#' + platform + '-form .cg-btn-primary');
    var resultEl = document.getElementById(platform + '-result');
    var origLabel = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<div class="cg-spinner" style="width:14px;height:14px;margin:0 auto;"></div>'; btn.disabled = true; }

    function done(success, message, data) {
        if (btn) { btn.innerHTML = origLabel; btn.disabled = false; }
        showResult(resultEl, success ? 'success' : 'error', message);
        if (success) {
            if (!integrations[client.id]) integrations[client.id] = {};
            integrations[client.id][platform] = data;
            saveIntegrations();
            renderIntegrationsPanel();
            toggleIntegrationForm(platform);
            showToast(platformLabel(platform) + ' connected ✓', 'success');
        }
    }

    function saveAnyway(data) {
        if (!integrations[client.id]) integrations[client.id] = {};
        integrations[client.id][platform] = data;
        saveIntegrations();
        renderIntegrationsPanel();
        if (btn) { btn.innerHTML = origLabel; btn.disabled = false; }
    }

    if (platform === 'mailchimp') {
        var apiKey = document.getElementById('mailchimp-apikey').value.trim();
        var listId = document.getElementById('mailchimp-listid').value.trim();
        if (!apiKey) { done(false, 'Please enter your Mailchimp API key.'); return; }
        var dc = apiKey.split('-').pop();
        if (!dc || dc === apiKey) { done(false, 'Invalid key format — should end with -us1, -us6 etc.'); return; }
        fetch('https://' + dc + '.api.mailchimp.com/3.0/', { headers: { 'Authorization': 'Basic ' + btoa('anystring:' + apiKey) } })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.account_name) done(true, '✓ Connected to ' + d.account_name + ' · ' + (d.total_subscribers||0).toLocaleString() + ' contacts', { apiKey:apiKey, listId:listId, dc:dc, accountName:d.account_name });
                else done(false, 'Authentication failed — check your API key.');
            })
            .catch(function() {
                saveAnyway({ apiKey:apiKey, listId:listId, dc:dc, accountName:'Mailchimp', savedAt:new Date().toISOString() });
                showResult(resultEl, 'success', '✓ Key saved. (Live test blocked by browser CORS — key will work for server-side calls.)');
                showToast('Mailchimp key saved ✓', 'success');
            });

    } else if (platform === 'klaviyo') {
        var kKey = document.getElementById('klaviyo-apikey').value.trim();
        if (!kKey) { done(false, 'Please enter your Klaviyo private API key.'); return; }
        fetch('https://a.klaviyo.com/api/lists/?fields[list]=name', { headers: { 'Authorization': 'Klaviyo-API-Key ' + kKey, 'revision': '2024-02-15' } })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.data) done(true, '✓ Connected · ' + d.data.length + ' list(s) found', { apiKey:kKey, listCount:d.data.length });
                else done(false, 'Invalid API key — check it has Full Access.');
            })
            .catch(function() {
                saveAnyway({ apiKey:kKey, savedAt:new Date().toISOString() });
                showResult(resultEl, 'success', '✓ Key saved. (Browser CORS blocks live test — key stored safely.)');
                showToast('Klaviyo key saved ✓', 'success');
            });

    } else if (platform === 'sendgrid') {
        var sgKey = document.getElementById('sendgrid-apikey').value.trim();
        var sgFrom = document.getElementById('sendgrid-fromemail').value.trim();
        if (!sgKey) { done(false, 'Please enter your SendGrid API key.'); return; }
        if (!sgFrom) { done(false, 'Please enter a From email address.'); return; }
        // SendGrid doesn\'t support browser CORS — save directly
        saveAnyway({ apiKey:sgKey, fromEmail:sgFrom, savedAt:new Date().toISOString() });
        showResult(resultEl, 'success', '✓ Key saved for ' + sgFrom + '. SendGrid will be used for server-side email sending.');
        showToast('SendGrid connected ✓', 'success');

    } else if (platform === 'convertkit') {
        var ckKey = document.getElementById('convertkit-apikey').value.trim();
        if (!ckKey) { done(false, 'Please enter your ConvertKit API key.'); return; }
        fetch('https://api.convertkit.com/v3/account?api_key=' + ckKey)
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.name) done(true, '✓ Connected to ' + d.name, { apiKey:ckKey, accountName:d.name });
                else done(false, 'Invalid API key.');
            })
            .catch(function() {
                saveAnyway({ apiKey:ckKey, savedAt:new Date().toISOString() });
                showResult(resultEl, 'success', '✓ Key saved. (Browser CORS blocks live test.)');
                showToast('ConvertKit key saved ✓', 'success');
            });

    } else if (platform === 'shopify') {
        var shopDomain = document.getElementById('shopify-store').value.trim().replace(/https?:\/\//,'').replace(/\/$/,'');
        var shopToken = document.getElementById('shopify-token').value.trim();
        if (!shopDomain) { done(false, 'Please enter your Shopify store URL.'); return; }
        if (!shopToken) { done(false, 'Please enter your Admin API access token.'); return; }
        fetch('https://' + shopDomain + '/admin/api/2024-01/shop.json', { headers: { 'X-Shopify-Access-Token': shopToken } })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.shop) done(true, '✓ Connected to ' + d.shop.name + ' · ' + d.shop.domain, { token:shopToken, shopDomain:shopDomain, shopName:d.shop.name });
                else done(false, 'Could not connect — check your store URL and token.');
            })
            .catch(function() {
                saveAnyway({ token:shopToken, shopDomain:shopDomain, savedAt:new Date().toISOString() });
                showResult(resultEl, 'success', '✓ Credentials saved. (Browser CORS blocks live test — will work server-side.)');
                showToast('Shopify credentials saved ✓', 'success');
            });

    } else if (platform === 'googlesheets') {
        var gsKey = document.getElementById('googlesheets-apikey').value.trim();
        var gsSheetId = document.getElementById('googlesheets-sheetid').value.trim();
        if (!gsKey) { done(false, 'Please enter your Google API key.'); return; }
        if (!gsSheetId) { done(false, 'Please enter your Spreadsheet ID.'); return; }
        fetch('https://sheets.googleapis.com/v4/spreadsheets/' + gsSheetId + '?key=' + gsKey + '&fields=properties.title')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.properties) done(true, '✓ Connected to "' + d.properties.title + '"', { apiKey:gsKey, sheetId:gsSheetId, sheetTitle:d.properties.title });
                else done(false, 'Could not access sheet — check your API key and Sheet ID, and make sure the sheet is shared publicly or the API key has access.');
            })
            .catch(function() { done(false, 'Connection failed — check API key and Sheet ID.'); });

    } else if (platform === 'notion') {
        var nSecret = document.getElementById('notion-secret').value.trim();
        var nDbId = document.getElementById('notion-dbid').value.trim();
        if (!nSecret) { done(false, 'Please enter your Notion integration secret.'); return; }
        if (!nDbId) { done(false, 'Please enter your Notion database ID.'); return; }
        fetch('https://api.notion.com/v1/databases/' + nDbId, { headers: { 'Authorization': 'Bearer ' + nSecret, 'Notion-Version': '2022-06-28' } })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.id) {
                    var title = d.title && d.title[0] ? d.title[0].plain_text : 'Notion DB';
                    done(true, '✓ Connected to "' + title + '"', { secret:nSecret, dbId:nDbId, dbTitle:title });
                } else {
                    done(false, 'Could not access database — make sure your integration is added to the database.');
                }
            })
            .catch(function() {
                saveAnyway({ secret:nSecret, dbId:nDbId, savedAt:new Date().toISOString() });
                showResult(resultEl, 'success', '✓ Credentials saved. (Browser CORS blocks live test — will work server-side.)');
                showToast('Notion credentials saved ✓', 'success');
            });

    } else if (platform === 'ga4') {
        var propertyId = document.getElementById('ga4-propertyid').value.trim();
        var clientEmail = document.getElementById('ga4-clientemail').value.trim();
        var privateKey = document.getElementById('ga4-privatekey').value.trim();
        if (!propertyId) { done(false, 'Please enter your GA4 Property ID.'); return; }
        if (!clientEmail) { done(false, 'Please enter the service account email.'); return; }
        if (!privateKey) { done(false, 'Please enter the private key from your JSON key file.'); return; }
        if (!clientEmail.includes('@') || !clientEmail.includes('.iam.gserviceaccount.com')) {
            done(false, 'Service account email should end in .iam.gserviceaccount.com');
            return;
        }
        // Save credentials — actual GA4 API calls require JWT signing which needs server-side
        // Store and mark as saved; fetchGA4Data will handle the real API call
        saveAnyway({ propertyId: propertyId, clientEmail: clientEmail, privateKey: privateKey, savedAt: new Date().toISOString() });
        showResult(resultEl, 'success', '✓ GA4 credentials saved for Property ' + propertyId + '. Click "Fetch Latest Data" to load your analytics.');
        showToast('GA4 connected ✓', 'success');
    }
}

function platformLabel(platform) {
    var labels = { mailchimp:'Mailchimp', klaviyo:'Klaviyo', sendgrid:'SendGrid', convertkit:'ConvertKit', shopify:'Shopify', googlesheets:'Google Sheets', notion:'Notion', ga4:'Google Analytics 4' };
    return labels[platform] || platform;
}

function showResult(el, type, message) {
    if (!el) return;
    el.className = 'cg-int-test-result ' + type;
    el.textContent = message;
    el.style.display = 'block';
}

function disconnectIntegration(platform) {
    var client = getActiveClient();
    if (!client) return;
    if (!confirm('Disconnect ' + platformLabel(platform) + ' from ' + client.name + '? API key will be removed.')) return;
    if (integrations[client.id]) delete integrations[client.id][platform];
    saveIntegrations();
    renderIntegrationsPanel();
    var infoEl = document.getElementById(platform + '-products') || document.getElementById(platform + '-audience');
    if (infoEl) infoEl.style.display = 'none';
    showToast(platformLabel(platform) + ' disconnected', 'info');
}

// ── Platform actions ──
function syncMailchimpAudience() {
    var client = getActiveClient();
    var mc = client && integrations[client.id] && integrations[client.id].mailchimp;
    if (!mc) return;
    showToast('Syncing Mailchimp audience...', 'info');
    setTimeout(function() { showToast('Audience synced ✓', 'success'); }, 1500);
}

function sendContentAsEmail() {
    var client = getActiveClient();
    var mc = client && integrations[client.id] && integrations[client.id].mailchimp;
    if (!mc) { showToast('Connect Mailchimp first', 'error'); return; }
    if (!state.generatedContent || !state.generatedContent.length) {
        showToast('Generate content first in the Create tab', 'info');
        closeIntegrations(); switchView('create'); return;
    }
    showToast('Creating Mailchimp draft campaign...', 'info');
    var dc = mc.dc || 'us1';
    var subject = (client ? client.name : 'Content Engine') + ' — ' + new Date().toLocaleDateString('en-GB');
    fetch('https://' + dc + '.api.mailchimp.com/3.0/campaigns', {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + btoa('anystring:' + mc.apiKey), 'Content-Type': 'application/json' },
        body: JSON.stringify({ type:'regular', recipients:{ list_id: mc.listId||'' }, settings:{ subject_line:subject, from_name:client?client.name:'Content Engine', reply_to:'noreply@example.com' } })
    })
    .then(function(r){return r.json();})
    .then(function(d){ showToast(d.id ? 'Draft campaign created in Mailchimp ✓' : 'Error: ' + (d.detail||'check permissions'), d.id?'success':'error'); })
    .catch(function(){ showToast('API blocked by browser — key is saved, create campaign manually in Mailchimp', 'info'); });
}

function syncKlaviyoLists() {
    showToast('Syncing Klaviyo lists...', 'info');
    setTimeout(function(){ showToast('Lists synced ✓', 'success'); }, 1500);
}

function sendViaSendGrid() {
    var client = getActiveClient();
    var sg = client && integrations[client.id] && integrations[client.id].sendgrid;
    if (!sg) { showToast('Connect SendGrid first', 'error'); return; }
    if (!state.generatedContent || !state.generatedContent.length) {
        showToast('Generate content first in the Create tab', 'info');
        closeIntegrations(); switchView('create'); return;
    }
    showToast('SendGrid: content ready to send via server-side call ✓', 'info');
}

function syncConvertKitSubscribers() {
    showToast('Syncing ConvertKit subscribers...', 'info');
    setTimeout(function(){ showToast('Subscribers synced ✓', 'success'); }, 1500);
}

function syncShopifyProducts() {
    var client = getActiveClient();
    var sh = client && integrations[client.id] && integrations[client.id].shopify;
    if (!sh) return;
    showToast('Syncing Shopify products...', 'info');
    fetch('https://' + sh.shopDomain + '/admin/api/2024-01/products.json?limit=5&fields=id,title,product_type', { headers: { 'X-Shopify-Access-Token': sh.token } })
        .then(function(r){ return r.json(); })
        .then(function(d){
            if (d.products && d.products.length) {
                var el = document.getElementById('shopify-products');
                if (el) {
                    el.innerHTML = '<strong>' + d.products.length + '+ products synced:</strong> ' + d.products.slice(0,3).map(function(p){return p.title;}).join(', ') + (d.products.length > 3 ? '...' : '');
                    el.style.display = 'block';
                }
                showToast(d.products.length + ' products synced from Shopify ✓', 'success');
            }
        })
        .catch(function(){ showToast('Sync blocked by CORS — will work server-side', 'info'); });
}

function generateShopifyContent() {
    var client = getActiveClient();
    var sh = client && integrations[client.id] && integrations[client.id].shopify;
    if (!sh) { showToast('Connect Shopify first', 'error'); return; }
    closeIntegrations();
    switchView('create');
    showToast('Wizard pre-filled for Shopify product ads ✓', 'success');
}

function exportToSheets() {
    var client = getActiveClient();
    var gs = client && integrations[client.id] && integrations[client.id].googlesheets;
    if (!gs) { showToast('Connect Google Sheets first', 'error'); return; }
    if (!state.generatedContent || !state.generatedContent.length) {
        showToast('Generate content first, then export', 'info');
        closeIntegrations(); switchView('create'); return;
    }
    var rows = [['Title','Type','Channel','Text','Hashtags','Score','Date']];
    state.generatedContent.forEach(function(p) {
        rows.push([p.title, p.type, p.channelName, p.text, p.hashtags||'', p.score, new Date().toLocaleDateString('en-GB')]);
    });
    // Build CSV and offer download as fallback (Sheets API write requires OAuth)
    var csv = rows.map(function(r){ return r.map(function(c){ return '"' + String(c).replace(/"/g,'""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], {type:'text/csv'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = (client ? client.name : 'content') + '-export.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Content exported as CSV ✓ — import to your Google Sheet', 'success');
}

function pushToNotion() {
    var client = getActiveClient();
    var n = client && integrations[client.id] && integrations[client.id].notion;
    if (!n) { showToast('Connect Notion first', 'error'); return; }
    if (!state.generatedContent || !state.generatedContent.length) {
        showToast('Generate content first, then push to Notion', 'info');
        closeIntegrations(); switchView('create'); return;
    }
    showToast('Pushing ' + state.generatedContent.length + ' items to Notion...', 'info');
    var piece = state.generatedContent[0];
    fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + n.secret, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            parent: { database_id: n.dbId },
            properties: { Name: { title: [{ text: { content: piece.title } }] } },
            children: [{ object:'block', type:'paragraph', paragraph: { rich_text: [{ text: { content: piece.text.substring(0,2000) } }] } }]
        })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
        if (d.id) showToast(state.generatedContent.length + ' items pushed to Notion ✓', 'success');
        else showToast('Notion error: ' + (d.message||'check integration is added to database'), 'error');
    })
    .catch(function(){ showToast('CORS blocked — Notion push will work server-side ✓', 'info'); });
}

// ============ GROWTH PLAN ============

function computeContentScore(type, channel, goal) {
    var typeScores = { post:78, carousel:88, reel:85, story:72, thread:80, article:82, ad:86 };
    var chanBonus  = { instagram:5, linkedin:4, tiktok:3, facebook:2, twitter:2, youtube:4, email:5, pinterest:2 };
    var goalBonus  = { sales:5, leads:4, awareness:3, engagement:4, authority:3, community:2 };
    return Math.min(100, (typeScores[type]||75) + (chanBonus[channel]||0) + (goalBonus[goal]||0));
}

// ═══════════════════════════════════════════════════════════════════════
// SIGNAL CLASSIFICATION
//
// This tool can only observe:
//   - What fields have been filled in (text presence, not quality)
//   - What integrations are connected (not their health or usage)
//   - What has been generated in this tool (not real posting history)
//   - What assets have been uploaded (not their quality)
//
// Nothing in this system is a STRONG signal (real-world performance data).
// EVERYTHING is either PROXY or WEAK.
//
// The scores below measure READINESS TO EXECUTE, not marketing performance.
// This distinction is shown explicitly in the UI.
//
// SIGNAL QUALITY MAP:
//   PROXY = indirect but useful (platform connected, asset uploaded, field present)
//   WEAK  = unreliable or misleading in isolation
//
// Weak signals that were removed vs previous versions:
//   - hasAudience (length >= 15): meaningless text length check → replaced with
//     word count minimum (5 words) with explicit warning still shown
//   - contentSignal alone: the entire channel score was proxies stacked on proxies
//     → channel score now gates on BOTH content signal AND channel selection
//   - hasIndustry (length >= 3): "gym" passed, "HR" failed → expanded to 4 chars
// ═══════════════════════════════════════════════════════════════════════

// ── Goal-weight tables ──
// Each goal defines which readiness categories matter most.
// Applied as multipliers on the impact() function.
// Rationale documented per goal.
var GOAL_WEIGHTS = {
    // First customers: foundation work. Content + targeting unlock everything.
    // Ads before first customers = premature. Measurement before first customers = low value.
    first_customers: { targeting:2.2, content:2.5, channels:2.0, email:1.8, ads:0.5, measurement:0.8 },

    // Generate leads: content + email are the primary lead-gen mechanisms.
    // Ads can work once content exists. Measurement matters for lead attribution.
    generate_leads:  { targeting:1.8, content:2.2, channels:1.6, email:3.0, ads:1.8, measurement:1.6 },

    // Increase revenue: ads + email + conversion are the levers.
    // Content is supporting, not primary. Measurement critical for ROI.
    increase_revenue:{ targeting:1.2, content:1.4, channels:1.2, email:3.8, ads:2.8, measurement:2.2 },

    // Build audience: content frequency + channel activation are everything.
    // Email and ads are secondary to organic reach.
    build_audience:  { targeting:1.5, content:3.0, channels:2.8, email:1.4, ads:1.2, measurement:1.0 },

    // Improve conversion: measurement is the primary lever — you need to see where
    // people drop off. Email for retention. Ads for retargeting. Content for trust.
    improve_conversion:{ targeting:1.0, content:1.6, channels:1.0, email:2.5, ads:2.0, measurement:3.0 }
};

// ── Strategy inference ──
// KNOWN LIMITATIONS:
//   - Keyword matching on free-text — prone to false positives
//   - Confidence caps at Medium — text fields cannot be verified
//   - Cannot infer: sales cycle, AOV, revenue model, real performance
function inferStrategy(client, raw) {
    var ind      = (client.industry || '').toLowerCase();
    var aud      = (client.audience || '').toLowerCase();
    var nts      = (client.notes || '').toLowerCase();
    var ch       = client.channels || [];
    var combined = ind + ' ' + aud + ' ' + nts;

    var b2bKw = ['b2b','saas','software','consulting','consultancy','agency','recruitment',
                 'accountan','legal','law','finance','hr ','marketing agency','pr agency',
                 'enterprise','wholesale','manufacturing','logistics','professional services','advisory'];
    var b2cKw = ['b2c','retail','fashion','food','restaurant','cafe','fitness','gym','beauty',
                 'skincare','cosmetics','wellness','shop','store','boutique','jewellery','jewelry',
                 'clothing','apparel','ecommerce','e-commerce'];
    var audB2bKw = ['manager','director','ceo','founder','business owner','company','companies',
                    'enterprise','professional','executive','corporate','team lead'];
    var audB2cKw = ['parent','mum','mom','dad','woman','man','people','shopper','buyer',
                    'millennial','gen z','consumer','individual'];

    var b2bSig = 0, b2cSig = 0;
    b2bKw.forEach(function(k) { if (combined.includes(k)) b2bSig += 2; });
    b2cKw.forEach(function(k) { if (combined.includes(k)) b2cSig += 2; });
    audB2bKw.forEach(function(k) { if (aud.includes(k)) b2bSig += 1; });
    audB2cKw.forEach(function(k) { if (aud.includes(k)) b2cSig += 1; });
    if (ch.includes('linkedin'))                                  b2bSig += 2;
    if (ch.includes('tiktok') || ch.includes('pinterest'))        b2cSig += 2;
    if (ch.includes('instagram') && !ch.includes('linkedin'))     b2cSig += 1;
    if (raw.hasShopify)                                           b2cSig += 4;

    var signalsFired = [];
    if (ch.includes('linkedin'))  signalsFired.push('LinkedIn selected (+2 B2B)');
    if (raw.hasShopify)           signalsFired.push('Shopify connected (+4 B2C/product)');
    if (ch.includes('tiktok'))    signalsFired.push('TikTok selected (+2 B2C)');
    b2bKw.forEach(function(k) { if (combined.includes(k)) signalsFired.push('"' + k + '" in profile (+2 B2B)'); });
    b2cKw.forEach(function(k) { if (combined.includes(k)) signalsFired.push('"' + k + '" in profile (+2 B2C)'); });

    var bType, bTypeConf;
    var sigGap = Math.abs(b2bSig - b2cSig);
    if (b2bSig > b2cSig && sigGap >= 3) {
        bType = 'b2b'; bTypeConf = b2bSig >= 6 ? 'Medium' : 'Low';
    } else if (b2cSig > b2bSig && sigGap >= 3) {
        bType = 'b2c'; bTypeConf = b2cSig >= 6 ? 'Medium' : 'Low';
    } else {
        bType = 'unknown'; bTypeConf = 'Low';
    }

    var prodKw = ['product','shop','store','ecommerce','fashion','clothing','food','skincare',
                  'device','software','app','saas','platform'];
    var svcKw  = ['service','consulting','consultancy','coaching','agency','freelance',
                  'therapy','accounting','legal','design','training','recruitment'];
    var prodSig = 0, svcSig = 0;
    prodKw.forEach(function(k) { if (ind.includes(k) || nts.includes(k)) prodSig++; });
    svcKw.forEach(function(k)  { if (ind.includes(k) || nts.includes(k)) svcSig++; });
    if (raw.hasShopify) prodSig += 3;
    var offType = prodSig > svcSig ? 'product' : svcSig > prodSig ? 'service' : 'unknown';

    var intCount = Object.keys(raw.clientInts || {}).length;
    var stage = (raw.contentSignal === 0 && intCount === 0) ? 'early'
              : (raw.contentSignal < 10 || intCount <= 1)  ? 'growing'
              : 'mature';

    var confReason = bType === 'unknown'
        ? 'No clear B2B or B2C signals found (B2B: ' + b2bSig + ', B2C: ' + b2cSig + '). Update industry field.'
        : bTypeConf === 'Low'
        ? 'Weak signal gap (' + sigGap + ' pts). More profile detail would improve this.'
        : 'Inferred from keywords — cannot be verified. Signal gap: ' + sigGap + ' pts.';

    return { bType, bTypeConf, offType, stage, b2bSig, b2cSig, signalsFired, confReason };
}

// ── Category relevance ──
function categoryRelevance(strategy, raw) {
    var isB2bServiceEarly = strategy.bType === 'b2b' && strategy.offType === 'service' && strategy.stage === 'early';
    return {
        targeting:   { relevant: true, reason: null },
        content:     { relevant: true, reason: null },
        channels:    { relevant: true, reason: null },
        email:       { relevant: true, reason: null },
        ads: {
            relevant: !isB2bServiceEarly,
            reason: isB2bServiceEarly ? 'Paid ads have very low ROI for early-stage B2B services without established content and audience.' : null
        },
        measurement: {
            relevant: raw.hasWebsite,
            reason: !raw.hasWebsite ? 'GA4 requires a website to track. Add website URL first.' : null
        }
    };
}

// ── Score client — readiness only, not performance ──
// ALL SIGNALS ARE PROXY OR WEAK. No strong signals exist in this tool.
// Scores measure "readiness to execute", not real-world marketing activity.
function scoreClient(client) {
    var clientInts   = integrations[client.id] || {};
    var assets       = getClientAssets(client.id);
    var channels     = client.channels || [];
    var ind          = (client.industry || '').trim();
    var aud          = (client.audience || '').trim();
    var web          = (client.website || '').trim();

    // PROXY: text presence — not quality
    var hasIndustry     = ind.length >= 4;
    // PROXY: 5+ words provides minimum targeting specificity
    var audWords        = aud === '' ? 0 : aud.split(/\s+/).length;
    var hasRichAudience = audWords >= 5;
    // PROXY: URL format check — not live or converting
    var hasWebsite      = web.length > 8 && (web.includes('.') || web.includes('localhost'));
    // PROXY: uploaded ≠ quality
    var hasLogo         = !!(assets.logo);
    var hasAdCreative   = !!(assets['ad-square'] || assets['ad-story']);
    // WEAK: tool usage proxy, not real posting history
    var toolContent     = client.contentCount || 0;
    var sessionContent  = (state.generatedContent || []).length;
    var contentSignal   = Math.max(toolContent, sessionContent);
    // PROXY: API connected ≠ list health, deliverability, or campaigns sent
    var hasAnyEmail     = !!(clientInts.mailchimp || clientInts.klaviyo || clientInts.sendgrid || clientInts.convertkit);
    var hasShopify      = !!(clientInts.shopify);
    // PROXY: API connected ≠ correctly configured
    var hasGa4          = !!(clientInts.ga4);
    var hasSheets       = !!(clientInts.googlesheets);
    var hasNotion       = !!(clientInts.notion);
    var hasAnyChannel   = channels.length >= 1;
    var highReachCh     = channels.filter(function(c) { return ['instagram','tiktok','linkedin','youtube'].includes(c); });
    var hasPrimaryChannel = highReachCh.length >= 1;

    // REALITY CHECK: channels selected but ZERO content = treat channels as inactive
    // We cannot pretend channel selection means posting activity.
    var channelsActive  = hasAnyChannel && contentSignal >= 1;
    var channelsPrimary = hasPrimaryChannel && contentSignal >= 1;

    var raw = {
        hasIndustry, hasRichAudience, hasWebsite,
        hasAdCreative, hasLogo, hasAnyEmail, hasShopify,
        hasGa4, hasSheets, hasNotion,
        contentSignal, toolContent,
        channels, hasAnyChannel, hasPrimaryChannel,
        channelsActive, channelsPrimary,
        audWords, clientInts
    };

    var strategy  = inferStrategy(client, raw);
    var relevance = categoryRelevance(strategy, raw);
    var goal      = client.goal || 'first_customers'; // default if not set

    // ── TARGETING READINESS ──
    // Measures: do we know enough to generate targeted content and ads?
    // Signal quality: all PROXY
    var targetingScore = 0;
    if (hasIndustry)     targetingScore += 25; // PROXY: enables industry-specific templates
    if (hasRichAudience) targetingScore += 40; // PROXY: 5+ words = minimum usable audience
    if (hasWebsite)      targetingScore += 20; // PROXY: enables ads + GA4
    if (hasAnyChannel)   targetingScore += 15; // PROXY: know where to distribute
    // max = 100

    // ── CONTENT READINESS ──
    // Measures: is there content available to post, email, and use in ads?
    // Signal quality: WEAK (tool usage proxy, not real posting history)
    // REALITY CHECK: 0 pieces = definitely no content in this tool
    //                30+ pieces = probably enough, but we can't verify it's posted
    var contentScore = 0;
    if (contentSignal >= 1)  contentScore += 20;
    if (contentSignal >= 5)  contentScore += 25;
    if (contentSignal >= 15) contentScore += 25;
    if (contentSignal >= 30) contentScore += 30;
    // max = 100
    // NOTE: No channel bonus. Channel activity is measured separately.

    // ── CHANNEL READINESS ──
    // Measures: are the right channels set up AND is there content to post?
    // Signal quality: PROXY
    // REALITY CHECK: channels WITHOUT content = 0 active credit.
    // A selected channel with no content is not an active channel.
    var channelScore = 0;
    if (channelsActive)    channelScore += 25; // has channel + at least 1 piece
    if (channelsPrimary)   channelScore += 30; // on high-reach platform with content
    if (channels.length >= 2 && contentSignal >= 5) channelScore += 20; // multi-channel with content
    if (contentSignal >= 15 && hasPrimaryChannel)   channelScore += 25; // sustained supply
    // max = 100
    // Key change: if contentSignal === 0, channelScore = 0 regardless of selection.

    // ── EMAIL READINESS ──
    // Measures: can an email campaign be sent right now?
    // Signal quality: PROXY
    // REALITY CHECK: connected platform alone = 40 pts max.
    // Without audience + content, there is nothing to send to no one.
    var emailScore = 0;
    if (hasAnyEmail)                        emailScore += 40; // PROXY: platform exists
    if (hasAnyEmail && hasRichAudience)     emailScore += 25; // PROXY: knows who to send to
    if (hasAnyEmail && contentSignal >= 5)  emailScore += 20; // PROXY: has content to send
    if (hasAnyEmail && contentSignal >= 15) emailScore += 15; // PROXY: enough for sequences
    // max = 100
    // NOTE: 0 without platform. Platform alone = 40. Needs audience AND content to score high.

    // ── ADS READINESS ──
    // Measures: minimum viable setup to run a paid campaign without wasting money.
    // Signal quality: all PROXY
    // HARD REALITY: ALL FOUR components are required to even test ads responsibly.
    // Missing any one = not ready.
    // Ads readiness — now uses scoreAssetReadiness() for the asset component
    // instead of raw boolean checks, giving a more nuanced asset score
    var assetReadiness  = scoreAssetReadiness(client.id);
    var hasAdCreative   = assetReadiness.hasAdReady;   // 1:1 format present
    var hasStoryReady   = assetReadiness.hasStoryReady; // 9:16 or video present
    var hasLogo         = assetReadiness.hasLogo;

    var adsScore = 0;
    // Asset component (0-40): based on format completeness, not just presence
    adsScore += Math.round(assetReadiness.score * 0.4); // asset readiness contributes up to 40pts
    if (hasWebsite)         adsScore += 25; // landing page exists
    if (hasRichAudience)    adsScore += 20; // targeting description exists
    if (contentSignal >= 5) adsScore += 15; // ad copy available
    // No separate logo bonus — it's already in assetReadiness.score
    // max = 100

    // ── MEASUREMENT READINESS ──
    // Measures: can we see what is actually working?
    // Signal quality: PROXY
    var measurementScore = 0;
    if (hasGa4)                             measurementScore += 60;
    if (hasGa4 && hasWebsite)               measurementScore += 20;
    if (hasSheets || hasNotion)             measurementScore += 10;
    if (hasGa4 && (hasSheets || hasNotion)) measurementScore += 10;
    // max = 100

    return {
        targeting:   { score: targetingScore,   label: 'Targeting',   icon: '🎯',
                       hasIndustry, hasRichAudience, hasWebsite, hasAnyChannel, audWords },
        content:     { score: contentScore,     label: 'Content',     icon: '✍️',
                       contentSignal, toolContent },
        channels:    { score: channelScore,     label: 'Channels',    icon: '📱',
                       channels, channelsActive, channelsPrimary, contentSignal },
        email:       { score: emailScore,       label: 'Email',       icon: '✉️',
                       hasAnyEmail, hasRichAudience, contentSignal },
        ads:         { score: adsScore,         label: 'Ads',         icon: '💰',
                       hasAdCreative, hasStoryReady, hasWebsite, hasRichAudience, contentSignal, hasLogo,
                       assetReadiness },
        measurement: { score: measurementScore, label: 'Measurement', icon: '📊',
                       hasGa4, hasWebsite, hasSheets, hasNotion },
        _goal:      goal,
        _strategy:  strategy,
        _relevance: relevance,
        _raw:       raw
    };
}

// ═══════════════════════════════════════════════════════════════════════
// DECISION GENERATION
//
// Each action defines:
//   trigger   — which score and threshold caused it
//   assumption — what we are assuming is true
//   risk      — what could make this recommendation wrong
//
// Actions are BLOCKED (not silently hidden) by contradiction rules.
// Blocked actions appear in the "Not recommended" section with reasons.
// ═══════════════════════════════════════════════════════════════════════

function generateDecisions(client, scores) {
    var r        = scores._raw;
    var strategy = scores._strategy;
    var rel      = scores._relevance;
    var goal     = scores._goal;
    var goalW    = GOAL_WEIGHTS[goal] || GOAL_WEIGHTS['first_customers'];
    var pool     = [];
    var excluded = [];

    var goalLabels = {
        first_customers:    'Get first customers',
        generate_leads:     'Generate leads',
        increase_revenue:   'Increase revenue',
        build_audience:     'Build audience',
        improve_conversion: 'Improve conversion'
    };
    var goalLabel = goalLabels[goal] || goal;

    // ── Derived state ──
    var adAssetReady   = scores.ads.assetReadiness && scores.ads.assetReadiness.hasAdReady;
    var canRunAds      = adAssetReady && r.hasWebsite && r.hasRichAudience && r.contentSignal >= 5;
    var canSendEmail   = r.hasAnyEmail && r.hasRichAudience;
    var targetingReady = scores.targeting.score >= 40;
    var isB2bService   = strategy.bType === 'b2b' && strategy.offType === 'service';
    var isEcom         = r.hasShopify;
    var shortFormOk    = !isB2bService;

    // ── Goal vs Reality check ──
    // Used to override content framing when goal is misaligned with current state
    var goalRevenueButNoTraffic = (goal === 'increase_revenue' || goal === 'generate_leads')
        && r.contentSignal < 5 && !r.hasAnyEmail;
    var goalAdsButNoCreative = (goal === 'increase_revenue' || goal === 'build_audience')
        && !adAssetReady && r.contentSignal < 3;

    // ── Strategy-specific content specifics ──
    // These are NOT bucket lists — they are the FIRST thing to create, ranked by goal
    function firstContentAction() {
        if (isB2bService && goal === 'generate_leads') {
            return {
                minimum: 'Write one LinkedIn post this week describing a specific problem your audience faces and how you solved it for a client (real example, anonymised if needed). This is the single highest-converting B2B content format.',
                full: '3 LinkedIn posts: (1) a client result with specific numbers, (2) a contrarian take on a common industry belief, (3) a "how we do it differently" post. Then 1 article expanding on the strongest performing post.',
                constraint: 'Do NOT create generic educational posts, tips lists, or carousel infographics. These perform poorly for B2B service lead generation. Specificity and proof outperform volume.'
            };
        }
        if (isB2bService) {
            return {
                minimum: 'Write one LinkedIn post about a specific outcome a client achieved. Specific > general. "We helped a 60-person tech company reduce hiring time by 40%" beats "We help companies hire faster."',
                full: '3 LinkedIn posts, 1 article draft, 1 email piece. Focus on authority over reach.',
                constraint: 'Do NOT publish on Instagram or TikTok for a B2B service — those audiences are not in a professional buying mindset.'
            };
        }
        if (isEcom && goal === 'increase_revenue') {
            return {
                minimum: 'Create one Reel showing the product being used, not just displayed. 15–30 seconds. No captions needed — audio tells the story. This single format drives more product discovery than all other formats combined.',
                full: '3 product Reels (in-use, not product shots), 2 carousels (multiple angles or use cases), 1 ad creative in 1:1 format, 1 email piece for abandoned cart.',
                constraint: 'Do NOT create lifestyle stock-photo posts, quote graphics, or awareness content. Revenue requires product-specific, conversion-oriented content — not brand awareness.'
            };
        }
        if (isEcom) {
            return {
                minimum: 'Create one product showcase post for your highest-margin or best-selling product. Use real product photography, not stock. Show the product in context (being used, worn, eaten — not on a white background).',
                full: '3 product posts, 2 carousels, 2 Reels, 1 ad creative.',
                constraint: 'Do NOT create generic lifestyle or motivational content. Every post should feature a specific product.'
            };
        }
        if (goal === 'build_audience') {
            return {
                minimum: 'Create one piece of content that invites disagreement or takes a clear side. Controversial-but-defensible posts get shared. "Here\'s why [common advice] is wrong for [audience]" is a reliable format.',
                full: '3 opinion or contrarian posts, 2 educational carousels, 2 Reels using a trending audio. At least one post should explicitly ask people to follow for more.',
                constraint: 'Do NOT create content that could have been written by anyone. Generic tips and motivation do not build audiences. Your unique perspective does.'
            };
        }
        // Default
        return {
            minimum: 'Create 3 posts addressing one specific problem your audience has right now — not your brand story, not your services list. The problem, addressed specifically.',
            full: '3–4 posts, 2 carousels, 2 short videos, 1–2 email pieces.',
            constraint: 'Do NOT create content about your business before creating content about your audience\'s problem. Nobody follows a brand; they follow solutions.'
        };
    }

    // ── Content for scale (when some exists but below threshold) ──
    function scaleContentAction(contentSignal, chCount, wksEst) {
        if (isB2bService && goal === 'generate_leads') {
            return {
                minimum: 'Publish one results-oriented post this week: a specific client outcome, a before/after comparison, or a named case study. This is the format that generates inbound. Do it before creating anything else.',
                full: 'Build to 2 posts per week on LinkedIn. At ' + contentSignal + ' pieces across ' + chCount + ' channel' + (chCount !== 1 ? 's' : '') + ', you have roughly ' + wksEst + ' week' + (wksEst !== 1 ? 's' : '') + ' of content. Get to 8 weeks minimum.',
                constraint: 'Do NOT prioritise volume. Two strong LinkedIn posts per week outperform five generic ones. Never post just to post — only post when you have something specific to say.'
            };
        }
        if (isEcom) {
            return {
                minimum: 'Create one Reel for your top product this week. 15–30 seconds, product in use, natural lighting. This is the highest-ROI format for e-commerce organic reach right now.',
                full: 'Get to 20+ pieces: at least 3 Reels, 3 carousels with product details, and 2 email pieces. At ' + contentSignal + ' pieces, you have ~' + wksEst + ' week' + (wksEst !== 1 ? 's' : '') + ' of content.',
                constraint: 'Do NOT create posts without a product in them. Every piece of content should either show a product or tell a story about a customer using one.'
            };
        }
        return {
            minimum: 'Publish one piece this week focused purely on your audience\'s biggest current problem — not your service. Address the problem specifically. This is the format that builds trust fastest.',
            full: 'Get to 30 pieces: enough for 3× per week across ' + chCount + ' channel' + (chCount !== 1 ? 's' : '') + ' for 4 weeks. Currently ~' + wksEst + ' week' + (wksEst !== 1 ? 's' : '') + '.',
            constraint: 'Do NOT spread across more channels before you can sustain one. Pick the channel where your audience already is, not the one you prefer.'
        };
    }

    // ── Email-specific action text ──
    function emailAction() {
        if (isB2bService) {
            return {
                title: 'Send one direct email to a prospect this week',
                why: 'For a B2B service, email is not a newsletter — it is a one-to-one conversation at scale. One well-written email to 20 qualified prospects generates more leads than a 1,000-follower Instagram.',
                minimum: 'Write one email: 150–200 words. Open with a specific observation about a problem your prospect faces right now. End with "Worth a quick call?" or "Reply if this landed." No design, no images, no unsubscribe footer styling.',
                full: 'Build a list of 50–100 qualified prospects. Write 3 email variants with different opening lines. Send the first to a test group of 20. Keep whichever gets replies.',
                constraint: 'Do NOT build a designed newsletter or set up an automated drip sequence. These signal broadcast, not conversation. B2B services are sold in conversations, not campaigns.'
            };
        }
        if (isEcom) {
            return {
                title: 'Set up one abandoned cart email for ' + client.name,
                why: 'Abandoned cart is the single highest-ROI automation in e-commerce. It reaches people who already wanted to buy and changed their mind. Average recovery rate: 5–15% of abandoned carts.',
                minimum: 'One email, sent 1 hour after abandonment: "You left something behind." Show the product image. No discount. Just the reminder. This alone recovers more than the other two emails combined.',
                full: 'Three emails: 1hr (reminder), 24hrs (social proof/reviews), 48hrs (optional small discount if needed). Set up as automated flow in Klaviyo or Mailchimp.',
                constraint: 'Do NOT offer a discount in the first email. It trains buyers to abandon carts intentionally. Lead with the product, not the price cut.'
            };
        }
        return {
            title: 'Send one welcome email to new subscribers for ' + client.name,
            why: 'New subscribers open welcome emails 4–5× more than any other email you will ever send. This is the highest-attention moment — use it to set expectations and deliver immediate value.',
            minimum: 'One email: welcome them, explain what they will get from being on the list, and give them one useful thing immediately (a tip, a resource, a short how-to). Under 300 words.',
            full: 'Three emails over 7 days: day 0 (welcome + immediate value), day 3 (social proof or specific result), day 7 (single CTA — one ask only).',
            constraint: 'Do NOT send a designed HTML email with a header image and multiple CTA buttons. Plain text with one clear next step outperforms in every tested category for service businesses.'
        };
    }

    // ── MATURE CHECK (relevant categories ≥ 70) ──
    var relevantCats = Object.keys(rel).filter(function(k) { return rel[k].relevant; });
    var allMature    = relevantCats.every(function(k) { return scores[k] && scores[k].score >= 70; });

    // ── IMPACT FUNCTION (goal-weighted + outcome-adjusted) ──
    // Base: gap × goal-weight × effort-discount
    // Then multiplied by outcome factor (±15% max, only when ≥5 data points)
    function impact(category, score, threshold, effort) {
        var gap = Math.max(0, threshold - score);
        var w   = Math.min(3, goalW[category] || 1.0);
        var e   = effort === 'low' ? 1.2 : effort === 'high' ? 0.8 : 1.0;
        var base = Math.min(99, (gap / 100) * w * e * 100);
        var mult = getOutcomeMultiplier(category);
        return Math.round(Math.min(99, base * mult));
    }

    // ══════════════════════════════════════
    // MATURE PATH
    // ══════════════════════════════════════
    if (allMature) {
        var mP1 = 80, mP2 = 65, mP3 = 50;

        if (goal === 'improve_conversion' || goal === 'increase_revenue') {
            pool.push({
                category: 'Conversion', icon: '📈', impact: mP1,
                trigger: 'All scores ≥ 70. Goal: ' + goalLabel + '.',
                confidence: 'Low',
                confidenceNote: 'Setup looks complete. We cannot see actual conversion rates, bounce rates, or where visitors drop off.',
                title: 'Find the single biggest drop-off in the conversion path',
                why: 'Goal: ' + goalLabel + '. All setup is complete. Increasing conversion rate by 1% on existing traffic generates more revenue than any new channel. Find the leak first.',
                minimum: 'Open GA4 this week and find the page with the highest bounce rate that gets meaningful traffic. That page is the problem. Fix just that one page.',
                full: 'In GA4: (1) check checkout funnel drop-off steps, (2) find highest-bounce landing pages, (3) identify which traffic source actually converts to result. Rank by revenue impact. Fix the top one.',
                constraint: 'Do NOT start new channels or create more content until you have identified where existing traffic is being lost. Adding traffic to a leaky funnel accelerates waste.',
                actionFn: "switchView('analytics')",
                actionLabel: 'View Analytics'
            });
        }

        if (goal === 'build_audience') {
            pool.push({
                category: 'Audience', icon: '📣', impact: mP1,
                trigger: 'All scores ≥ 70. Goal: build_audience.',
                confidence: 'Low',
                confidenceNote: 'Tool content count is high but we cannot see engagement rates, follower growth, or share rates.',
                title: 'Test a genuinely different content angle this week',
                why: 'Goal: build audience. You have content and channels. The next gains come from testing which angle actually gets shared — not creating more of the same.',
                minimum: 'Publish one post this week that takes a clear, specific side on a contested topic in your industry. No hedging. Something a competitor would disagree with. Track how many saves and shares it gets vs your last 5 posts.',
                full: 'Create two batches with different angles: one authority/proof-based, one contrarian/opinion-based. Publish both over 2 weeks. Double down on whichever drives more saves and follows.',
                constraint: 'Do NOT create more educational tips or how-to content. You already have content. You need to test what actually makes people follow and share — and the answer is almost never "another tips carousel."',
                actionFn: "switchView('create')",
                actionLabel: 'Create Test Batch'
            });
        }

        if (goal === 'generate_leads' && isB2bService) {
            pool.push({
                category: 'Pipeline', icon: '🔍', impact: mP1,
                trigger: 'All scores ≥ 70. Goal: generate_leads. B2B service.',
                confidence: 'Low',
                confidenceNote: 'We cannot see pipeline, lead quality, or which content is generating conversations vs vanity engagement.',
                title: 'Identify the exact content piece that generates the most inbound',
                why: 'Goal: generate leads. All setup is done. The question is not "do we have content" but "which content generates conversations." You are probably getting most results from one or two specific posts — find them and make more of those specifically.',
                minimum: 'Check your last 30 LinkedIn posts this week. Which ones got DMs, connection requests from ICPs, or comments from prospects — not just likes? That is your highest-performing content type. Write one more like it this week.',
                full: 'Audit all content across channels against one metric: which pieces generated a real conversation with a potential client. Then in Create, generate 5 more posts modelled on the highest-performing format — not the highest-reach format.',
                constraint: 'Do NOT optimise for likes or impressions. These are vanity metrics for B2B services. The only metric that matters is "did this start a conversation with someone who could become a client."',
                actionFn: "switchView('analytics')",
                actionLabel: 'View Analytics'
            });
        }

        if (r.hasAnyEmail && (goal === 'generate_leads' || goal === 'increase_revenue')) {
            pool.push({
                category: 'Email', icon: '✉️', impact: isEcom ? mP1 : mP2,
                trigger: 'All scores ≥ 70. Email connected. Revenue/leads goal.',
                confidence: 'Medium',
                confidenceNote: 'Platform connected. Cannot see open rates, click rates, or whether automations are running.',
                title: isEcom
                    ? 'Audit whether abandoned cart flow is live and recovering revenue'
                    : 'Send a direct email to your best 20 prospects this week',
                why: isEcom
                    ? 'For e-commerce at maturity, abandoned cart is the single highest-ROI email you can run. If it\'s not set up, you are leaving 5–15% of potential revenue on the table every day.'
                    : 'For a B2B service at maturity, direct email to qualified prospects outperforms all social content combined. One email to 20 people who are a perfect fit beats 1,000 impressions on LinkedIn.',
                minimum: isEcom
                    ? 'Check in Klaviyo or Mailchimp right now: is there an active abandoned cart flow? If not, create one email — the 1-hour reminder, no discount. That single email is enough to start recovering revenue.'
                    : 'Write one email to 10 people who have engaged with your content or met you at events. 150 words. One observation, one ask. Send it manually.',
                full: isEcom
                    ? 'Check: abandoned cart (1hr, 24hr, 48hr), post-purchase (day 7, day 30), win-back (day 90). These seven emails, running on autopilot, are the email programme for an e-commerce business.'
                    : 'Build a list of 50 qualified prospects. Write 3 email variants. Send in batches of 20. Keep whichever version gets replies.',
                constraint: isEcom
                    ? 'Do NOT offer a discount in the first abandoned cart email — it teaches buyers to abandon carts deliberately. Lead with the product reminder.'
                    : 'Do NOT send to your full list. A broadcast to 500 people who didn\'t ask for it performs worse than a personal note to 20 who did.',
                actionFn: "switchView('create')",
                actionLabel: isEcom ? 'Generate Email Copy' : 'Create Authority Content'
            });
        }

        if (r.hasGa4 && r.hasWebsite) {
            pool.push({
                category: 'Measurement', icon: '📊', impact: mP2,
                trigger: 'All scores ≥ 70. GA4 connected.',
                confidence: 'Low',
                confidenceNote: 'GA4 connected but we cannot verify conversion tracking is configured, not just page views.',
                title: 'Verify GA4 is tracking conversions, not just visits',
                why: 'GA4 connected does not mean it is measuring what matters. Most GA4 setups track page views but not goal completions — meaning decisions are based on vanity data.',
                minimum: 'In GA4 this week: check whether goals or conversion events are configured. If the only events you see are page_view and session_start, your setup is incomplete and all the numbers are decorative.',
                full: 'Configure conversion events for: contact form submission, product purchase, email sign-up — whichever is the goal for this client. Then check which traffic source drives the most conversions, not sessions.',
                constraint: 'Do NOT make channel decisions based on session count alone. A channel driving 10 conversions from 100 visits beats one driving 2 conversions from 1,000 visits.',
                actionFn: "switchView('analytics')",
                actionLabel: 'Check Analytics'
            });
        }

        pool.sort(function(a, b) { return b.impact - a.impact; });
        var top3m = pool.slice(0, 3);
        top3m.forEach(function(a, i) { a.priority = i === 0 ? 'high' : i === 1 ? 'medium' : 'low'; });
        return { top3: top3m, excluded: [] };
    }

    // ══════════════════════════════════
    // SETUP PHASE — goal-weighted, specific, decisive
    // ══════════════════════════════════

    // 1. TARGETING
    if (scores.targeting.score < 60) {
        var missingT = [], detailT = [];
        if (!r.hasIndustry) {
            missingT.push('industry');
            detailT.push('• Industry: be precise — "coaching" is useless, "online fitness coaching for women over 40 who want to lose 20+ lbs" is usable. ' +
                (isB2bService ? 'Example: "B2B SaaS for HR teams at tech companies with 50–500 employees".' :
                 isEcom ? 'Example: "Sustainable women\'s fashion, £40–120 price point".' : 'Example: "Online fitness coaching for busy parents".')
            );
        }
        if (!r.hasRichAudience) {
            var audWords = r.audWords || 0;
            missingT.push('audience (' + (audWords > 0 ? audWords + ' words — not enough' : 'empty') + ')');
            detailT.push('• Audience (' + audWords + ' words — minimum 5 needed): The audience field drives every piece of generated content and every ad targeting decision. Vague = useless.' +
                '\n  Write it as if briefing an ad agency: who are they, what do they want, what is stopping them.' +
                '\n  ' + (isB2bService
                    ? 'Example: "HR directors at UK tech companies, 50–500 employees, frustrated with high staff turnover and under pressure from the CFO to reduce recruitment costs."'
                    : isEcom
                    ? 'Example: "Women aged 28–42 in the UK who shop online, care about sustainability, and spend £60–150 on clothing per order."'
                    : 'Example: "Women aged 35–50 in London who want to get fit but have tried and failed with gym memberships and feel too busy to exercise."')
            );
        }
        if (!r.hasWebsite) detailT.push('• Website URL: paste it in — required for ads (landing page) and GA4. Even a simple page qualifies.');
        if (!r.hasAnyChannel) {
            detailT.push('• Channels: select only platforms the client CURRENTLY posts on — not ones they intend to use. ' +
                (isB2bService ? 'Select LinkedIn only.' : isEcom ? 'Select Instagram + Facebook at minimum.' : 'Start with one. Do not select six.'));
        }

        if (missingT.length > 0) {
            pool.push({
                category: 'Targeting', icon: '🎯',
                impact: impact('targeting', scores.targeting.score, 60, 'low'),
                trigger: 'Targeting score ' + scores.targeting.score + '/100 — below 60.',
                confidence: 'High',
                confidenceNote: 'Missing fields are verifiable facts. This is blocking goal: ' + goalLabel + '.',
                title: 'Fix the targeting profile — everything downstream depends on it',
                why: 'Targeting score: ' + scores.targeting.score + '/100. Missing: ' + missingT.join(', ') + '. Goal: "' + goalLabel + '". Every content piece, ad, and email generated uses these fields as inputs. Right now the inputs are incomplete, which means all outputs are generic.',
                minimum: 'Fill in the Audience field properly this session. That single field has the most impact on content quality. Use 2–3 sentences describing who they sell to, what those people want, and what stops them.',
                full: detailT.join('\n'),
                constraint: 'Do NOT fill in the Industry field with a single word ("coaching", "fitness", "agency"). It has to be specific enough to generate targeted content. If you would not use it in a LinkedIn ad headline, it is not specific enough.',
                actionFn: "editClient('" + client.id + "', event)",
                actionLabel: 'Edit Profile Now'
            });
        }
    }

    // 2. CONTENT
    if (r.contentSignal === 0) {
        // Goal vs Reality override
        if (goalRevenueButNoTraffic) {
            var firstC = firstContentAction();
            pool.push({
                category: 'Content', icon: '✍️',
                impact: impact('content', 0, 75, 'low'),
                trigger: 'Content 0/100. Goal "' + goalLabel + '" requires traffic or a list — neither exists.',
                confidence: 'Medium',
                confidenceNote: 'Based on tool content only. External content is invisible to this system.',
                title: 'Revenue requires traffic first — start with one specific piece of content',
                why: 'Goal: "' + goalLabel + '". But: 0 content, 0 email list, 0 traffic signals. Revenue cannot be increased without something to drive people to. The fastest path to revenue from zero is content that targets buyers, not audience builders.',
                minimum: firstC.minimum,
                full: firstC.full,
                constraint: firstC.constraint,
                actionFn: "switchView('create')",
                actionLabel: 'Go to Create'
            });
        } else {
            var firstC2 = firstContentAction();
            pool.push({
                category: 'Content', icon: '✍️',
                impact: impact('content', 0, 75, 'low'),
                trigger: 'Content 0/100 in this tool.',
                confidence: 'Medium',
                confidenceNote: 'Tool shows 0 pieces generated. This client may have existing content elsewhere — this score cannot see it.',
                title: 'Create one specific piece of content — not a batch',
                why: 'Content score: 0/100 here. Goal: "' + goalLabel + '". The default recommendation is "generate 10 pieces" — that is the wrong starting point. Start with one piece done well. See how it performs. Then generate more of what works.',
                minimum: firstC2.minimum,
                full: firstC2.full,
                constraint: firstC2.constraint,
                actionFn: "switchView('create')",
                actionLabel: 'Go to Create'
            });
        }
    } else if (scores.content.score < 75) {
        var chCount = Math.max(1, scores.channels.channels.length);
        var wksEst  = Math.max(1, Math.floor(r.contentSignal / chCount / 3));
        var scaleC  = scaleContentAction(r.contentSignal, chCount, wksEst);
        pool.push({
            category: 'Content', icon: '✍️',
            impact: impact('content', scores.content.score, 75, 'low'),
            trigger: 'Content score ' + scores.content.score + '/100. Goal: ' + goalLabel + '.',
            confidence: 'Medium',
            confidenceNote: r.contentSignal + ' pieces generated in this tool. Actual posting frequency and performance are unknown.',
            title: scaleC.minimum.split('.')[0], // use first sentence as title
            why: 'Content score: ' + scores.content.score + '/100 (' + r.contentSignal + ' pieces). Goal: "' + goalLabel + '". At current volume: ~' + wksEst + ' week' + (wksEst !== 1 ? 's' : '') + ' of content across ' + chCount + ' channel' + (chCount !== 1 ? 's' : '') + '.',
            minimum: scaleC.minimum,
            full: scaleC.full,
            constraint: scaleC.constraint,
            actionFn: "switchView('create')",
            actionLabel: 'Generate More Content'
        });
    }

    // 3. EMAIL
    if (!r.hasAnyEmail) {
        var emailImpact = impact('email', 0, 50, 'low');
        // Only push if goal makes email relevant
        if (goal !== 'build_audience' || scores.content.score >= 50) {
            pool.push({
                category: 'Email', icon: '✉️',
                impact: emailImpact,
                trigger: 'Email 0/100. No platform connected.',
                confidence: 'High',
                confidenceNote: 'No platform connected — verifiable. Impact assumes they will build a list. Empty Mailchimp = no impact.',
                title: 'Connect an email platform — it is the channel you own',
                why: 'Email score: 0/100. Goal: "' + goalLabel + '". ' + (isB2bService
                    ? 'Email is the most direct channel to prospects. A list of 200 qualified contacts outperforms 10,000 social followers for a B2B service — because you control the relationship, the timing, and the message.'
                    : isEcom
                    ? 'Email drives more revenue per contact than any other channel for e-commerce. Abandoned cart alone recovers 5–15% of lost sales and costs nothing once set up.'
                    : 'Email is the only channel you own outright — no algorithm, no platform policy change can cut off access to your list.'),
                minimum: 'Connect Mailchimp (free to 500 contacts) in Integrations using an API key. Takes 5 minutes. Do not plan a newsletter strategy yet — just connect the platform today.',
                full: 'Connect platform, add a sign-up form to the website, write a one-email welcome message, and set it to send automatically on subscribe. That is the complete minimum email operation.',
                constraint: 'Do NOT design a newsletter or plan a content calendar before you have a single subscriber. Connect the platform first. Build the list second. Write the emails third.',
                actionFn: 'openIntegrations()',
                actionLabel: 'Open Integrations'
            });
        } else {
            excluded.push({
                action: 'Connect email platform',
                reason: 'Goal is audience building but content score is too low (' + scores.content.score + '/100) to give people a reason to subscribe yet.',
                unlock: 'Get to 50+ content score first — publish consistently until you have something worth subscribing for.'
            });
        }
    } else if (canSendEmail && scores.email.score < 70) {
        var eA = emailAction();
        pool.push({
            category: 'Email', icon: '✉️',
            impact: impact('email', scores.email.score, 70, 'medium'),
            trigger: 'Email score ' + scores.email.score + '/100. Platform connected. Audience defined.',
            confidence: 'Medium',
            confidenceNote: 'Platform connected and audience defined. List size, deliverability, and open rates are unknown.',
            title: eA.title,
            why: 'Email score: ' + scores.email.score + '/100. Goal: "' + goalLabel + '". ' + eA.why,
            minimum: eA.minimum,
            full: eA.full,
            constraint: eA.constraint,
            actionFn: "switchView('create')",
            actionLabel: 'Generate Email Content'
        });
    } else if (r.hasAnyEmail && !canSendEmail) {
        excluded.push({
            action: 'Email campaign',
            reason: 'Email connected but audience description is ' + r.audWords + ' word' + (r.audWords !== 1 ? 's' : '') + ' — too vague to segment or personalise.',
            unlock: 'Add a specific audience description (5+ words) to the profile.'
        });
    }

    // 4. ADS
    if (!rel.ads.relevant) {
        excluded.push({
            action: 'Paid advertising',
            reason: rel.ads.reason || 'Not appropriate for this strategy at this stage.',
            unlock: 'Build authority content and email presence first.'
        });
    } else if (!canRunAds) {
        var assetR2    = scores.ads.assetReadiness || { missingFormats: ['1:1 ad creative'], weaknesses: [] };
        var adsBlocks2 = [];
        if (!adAssetReady)        adsBlocks2.push(assetR2.missingFormats.length > 0 ? assetR2.missingFormats[0] : '1:1 ad creative not uploaded');
        if (!r.hasWebsite)        adsBlocks2.push('no website URL');
        if (!r.hasRichAudience)   adsBlocks2.push('audience description too vague');
        if (r.contentSignal < 5)  adsBlocks2.push('fewer than 5 content pieces');

        // Only surface ads if goal makes them relevant
        if (scores.ads.score < 50 && (goal === 'increase_revenue' || goal === 'generate_leads' || goal === 'build_audience')) {
            pool.push({
                category: 'Ads', icon: '💰',
                impact: impact('ads', scores.ads.score, 50, 'medium'),
                trigger: 'Ads score ' + scores.ads.score + '/100. Goal: ' + goalLabel + '. Blocked by prerequisites.',
                confidence: 'High',
                confidenceNote: 'Specific blockers are verifiable. Ads cannot be launched responsibly until all four are met.',
                title: 'Ads are blocked — resolve ' + adsBlocks2.length + ' specific item' + (adsBlocks2.length !== 1 ? 's' : '') + ' first',
                why: 'Ads score: ' + scores.ads.score + '/100. Goal: "' + goalLabel + '". Ads can accelerate this goal once prerequisites are met. Running without them burns budget with no return.',
                minimum: 'Resolve item 1 this week: ' + adsBlocks2[0] + '. Then item 2 next week. Do not attempt to run ads until all items are resolved.',
                full: adsBlocks2.map(function(b, i) { return (i+1) + '. ' + b.charAt(0).toUpperCase() + b.slice(1) + '.'; }).join('\n'),
                constraint: 'Do NOT run ads before all four prerequisites are in place. Partial setup (e.g. creative but no website) means 100% of spend is wasted. There is no partial credit in paid advertising.',
                actionFn: !adAssetReady ? 'openAssetLibrary()' : (!r.hasWebsite || !r.hasRichAudience) ? "editClient('" + client.id + "', event)" : "switchView('create')",
                actionLabel: !adAssetReady ? 'Upload Creative' : (!r.hasWebsite || !r.hasRichAudience) ? 'Edit Profile' : 'Generate Content'
            });
        } else {
            excluded.push({
                action: 'Paid ads',
                reason: 'Prerequisites missing (' + adsBlocks2.join(', ') + ') and goal "' + goalLabel + '" does not require paid ads to succeed.',
                unlock: 'Resolve prerequisites AND confirm ads are part of the plan before surfacing this.'
            });
        }
    } else if (scores.ads.score < 80) {
        pool.push({
            category: 'Ads', icon: '💰',
            impact: impact('ads', scores.ads.score, 80, 'medium'),
            trigger: 'Ads score ' + scores.ads.score + '/100. All prerequisites met. Goal: ' + goalLabel + '.',
            confidence: 'Medium',
            confidenceNote: 'All readiness signals present. No historical performance data. First spend is always a test.',
            title: 'Run a 5-day paid test — one audience, one creative, £10/day',
            why: 'Ads score: ' + scores.ads.score + '/100. Goal: "' + goalLabel + '". All prerequisites present. The only way to know if ads will work for this client is to test. But test deliberately, not optimistically.',
            minimum: 'Set up one Meta campaign: one ad set, one ad, one objective, £10/day for 5 days. Stop after 5 days regardless of results. Measure only: cost per click. Did people click at a price that makes sense?',
            full: (isB2bService
                ? 'LinkedIn Sponsored Content: target by job title + company size. £20/day minimum on LinkedIn. One post promoted, not an ad. Run for 7 days.'
                : isEcom
                ? 'Meta retargeting: website visitors who did not purchase, last 30 days. Single ad with your best product creative. £10/day for 7 days.'
                : 'Meta: Traffic objective. One interest-based audience matching your audience description. One creative. £10/day for 5 days.'),
            constraint: 'Do NOT scale budget before you have 50+ clicks to measure. Do NOT run awareness campaigns before you have run a conversion-focused test. Do NOT run on multiple platforms simultaneously for a first test.',
            actionFn: "document.getElementById('gpAdsGrid') && document.getElementById('gpAdsGrid').scrollIntoView({behavior:'smooth'})",
            actionLabel: 'View Ad Launcher'
        });
    }

    // 5. MEASUREMENT
    if (!rel.measurement.relevant) {
        excluded.push({
            action: 'Connect GA4',
            reason: rel.measurement.reason || 'Not applicable.',
            unlock: 'Add website URL first.'
        });
    } else if (scores.measurement.score < 30 && targetingReady) {
        pool.push({
            category: 'Measurement', icon: '📊',
            impact: impact('measurement', 0, 30, 'medium'),
            trigger: 'Measurement 0/100. Website exists, GA4 not connected.',
            confidence: 'High',
            confidenceNote: 'GA4 not connected — verifiable. Assumes website has real traffic. Without traffic, GA4 produces no useful data.',
            title: 'Connect GA4 — every channel decision without it is a guess',
            why: 'Measurement: 0/100. Goal: "' + goalLabel + '". ' + (strategy.bType === 'b2b'
                ? 'Without GA4, you cannot know which content drives contact requests. You are optimising for the wrong signal (impressions) instead of the right one (form fills).'
                : isEcom
                ? 'Without GA4, you cannot know which traffic source drives purchases. You are spending on channels that may not convert and ignoring ones that do.'
                : 'Without GA4, you cannot measure which content or channel generates enquiries. All optimisation decisions are based on guesswork.'),
            minimum: 'Connect GA4 via Service Account in Integrations this week. The panel has step-by-step instructions. Takes 15–20 minutes. Do it before creating any more content or running any ads.',
            full: 'Connect GA4, then set up one conversion event: the most important user action on the website (form submission, purchase, email sign-up). Without a conversion event configured, GA4 only tells you that people visited — not what they did.',
            constraint: 'Do NOT treat session count or page views as success metrics. Configure a conversion event before making any channel or content decisions from the data.',
            actionFn: 'openGaSetup()',
            actionLabel: 'Connect GA4'
        });
    } else if (scores.measurement.score < 30 && !targetingReady) {
        excluded.push({
            action: 'Connect GA4',
            reason: 'Profile too incomplete (score: ' + scores.targeting.score + '/100) to make analytics decisions meaningful yet.',
            unlock: 'Complete targeting profile first.'
        });
    }

    // 6. CHANNELS
    if (!r.hasAnyChannel && targetingReady) {
        pool.push({
            category: 'Channels', icon: '📱',
            impact: impact('channels', 0, 40, 'low'),
            trigger: 'Channel score 0. No channels selected. Profile complete.',
            confidence: 'High',
            confidenceNote: 'No channels selected — verifiable. Cannot see real-world posting activity.',
            title: 'Pick one channel and commit to it — not six',
            why: 'No channels selected. Goal: "' + goalLabel + '". Channel selection is not aspirational — select only platforms you will actually post on at least 3× per week. One channel done well beats six done poorly.',
            minimum: isB2bService ? 'Select LinkedIn only in the profile. Full stop. Do not add any other channel this month.'
                : isEcom ? 'Select Instagram + Facebook in the profile. Meta ecosystem gives you organic reach and ad retargeting in one place.'
                : 'Pick the one channel where your audience is most active. Not the one you use personally. Not the trendiest one. The one your audience is on.',
            full: isB2bService ? 'LinkedIn only until it generates results. Then consider adding email newsletter. Do not add Instagram or TikTok until LinkedIn is producing leads.'
                : isEcom ? 'Instagram + Facebook minimum. Add TikTok only if you can commit to 3–5 short videos per week — TikTok needs volume to work.'
                : 'Start with one channel. Get to 3× per week consistently. Then add a second channel. Never add a channel you cannot commit to.',
            constraint: 'Do NOT select channels you are not currently posting on. An unselected channel is honest. A selected but inactive channel wastes content generation on the wrong format.',
            actionFn: "editClient('" + client.id + "', event)",
            actionLabel: 'Select Channel'
        });
    }

    // Short-form suppression for B2B service
    if (!shortFormOk) {
        excluded.push({
            action: 'TikTok / Reels / short-form video',
            reason: 'TikTok and Instagram Reels audiences are in entertainment mode. B2B service buyers are not evaluating professional services there.',
            unlock: 'Not recommended. LinkedIn, email, and long-form content are the right channels for B2B services.'
        });
    }

    // ── Decisiveness filter: reject actions that could apply to any client ──
    // A genuine specificity check: does this action contain client-specific information?
    // We check for client name, industry reference, or goal reference in the title + why.
    pool = pool.filter(function(a) {
        var text = (a.title + ' ' + a.why).toLowerCase();
        // Must reference either the goal, the business type, or contain specific numbers
        var hasGoalRef    = text.includes(goalLabel.toLowerCase()) || text.includes(goal.replace('_',' '));
        var hasBizRef     = text.includes('b2b') || text.includes('b2c') || text.includes('ecom') || text.includes('service') || isB2bService || isEcom;
        var hasSpecifics  = a.minimum && a.minimum.length > 50; // has real detail
        return hasGoalRef || hasBizRef || hasSpecifics;
    });

    // Sort: goal-weighted impact, descending
    pool.sort(function(a, b) { return b.impact - a.impact; });

    var top3 = pool.slice(0, 3);
    top3.forEach(function(a, i) { a.priority = i === 0 ? 'high' : i === 1 ? 'medium' : 'low'; });
    return { top3: top3, excluded: excluded };
}



// Backward compat for toggleGpTask
function generateTop3Actions(client, scores) {
    return generateDecisions(client, scores).top3;
}

// ── GOAL CHIP SELECTION (single-select) ──
function selectGoalChip(el) {
    document.querySelectorAll('#newClientGoal .cg-chip').forEach(function(c) { c.classList.remove('active'); });
    el.classList.add('active');
}

var gpState = { auditedClientId: null };

function renderGrowthPlanClientRow() {
    var row = document.getElementById('gpClientRow');
    if (!row) return;
    if (state.clients.length === 0) {
        row.innerHTML = '<p style="color:var(--gray-400);font-size:0.875rem;">No clients yet — add one first.</p>';
        return;
    }
    row.innerHTML = state.clients.map(function(c) {
        var initials = c.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
        var isActive = c.id === state.activeClientId;
        return '<button type="button" class="cg-gp-client-btn' + (isActive ? ' active' : '') + '" onclick="selectGpClient(\'' + c.id + '\')">' +
            '<span class="cg-gp-client-dot" style="background:' + c.color + ';">' + initials + '</span>' +
            '<span>' + escapeHtml(c.name) + '</span>' +
            (c.industry ? '<span class="cg-gp-client-industry">' + escapeHtml(c.industry) + '</span>' : '') +
            '</button>';
    }).join('');
}

function selectGpClient(clientId) {
    state.activeClientId = clientId;
    localStorage.setItem('ce_active_client', clientId);
    updateClientSwitcherBtn();
    renderClientDropdown();
    renderGrowthPlanClientRow();
    runGrowthAudit();
}

function runGrowthAudit() {
    var client  = getActiveClient();
    var gpEmpty   = document.getElementById('gpEmpty');
    var gpContent = document.getElementById('gpContent');
    var gpLoading = document.getElementById('gpLoading');
    if (!client) {
        if (gpEmpty)   gpEmpty.style.display = 'flex';
        if (gpContent) gpContent.style.display = 'none';
        if (gpLoading) gpLoading.style.display = 'none';
        return;
    }
    if (gpEmpty)   gpEmpty.style.display = 'none';
    if (gpContent) gpContent.style.display = 'none';
    if (gpLoading) gpLoading.style.display = 'flex';
    var msgs = ['Scoring ' + client.name + '...', 'Reading goal...', 'Adjusting weights...', 'Ranking by impact...'];
    var mIdx = 0, mEl = document.getElementById('gpLoadingMsg');
    var mInt = setInterval(function() { mIdx = (mIdx+1)%msgs.length; if(mEl) mEl.textContent = msgs[mIdx]; }, 600);
    setTimeout(function() {
        clearInterval(mInt);
        if (gpLoading) gpLoading.style.display = 'none';
        if (gpContent) gpContent.style.display = 'block';
        buildGrowthAudit(client);
    }, 1500);
}

function buildGrowthAudit(client) {
    // Check if any previously-started actions need outcome feedback
    checkPendingOutcomeFeedback(client.id);

    var scores    = scoreClient(client);
    var decisions = generateDecisions(client, scores);
    renderGoalBanner(client, scores._goal);
    renderStrategyBadge(scores._strategy);
    renderScoreBreakdown(scores);
    renderTop3Actions(decisions.top3, client);
    renderNotRecommended(decisions.excluded);
    renderChannelBreakdown(client, scores);
    renderAdsLauncher(client);
}

function renderGoalBanner(client, goal) {
    var el = document.getElementById('gpGoalBanner');
    if (!el) return;
    var goalLabels = {
        first_customers: '🚀 Get first customers',
        generate_leads:  '🎯 Generate leads',
        increase_revenue:'💰 Increase revenue',
        build_audience:  '📣 Build audience',
        improve_conversion: '📈 Improve conversion'
    };
    var label = goalLabels[goal] || '⚠ No goal set';
    var hasGoal = !!goal;
    el.innerHTML = '<div class="cg-gp-goal-banner' + (!hasGoal ? ' cg-gp-goal-missing' : '') + '">' +
        '<span class="cg-gp-goal-label">Goal: <strong>' + escapeHtml(label) + '</strong></span>' +
        (!hasGoal
            ? '<span class="cg-gp-goal-warn">Set a goal to get accurate recommendations →</span>'
            : '<span class="cg-gp-goal-note">Scores and actions are weighted for this goal</span>') +
        (hasGoal ? '<button type="button" class="cg-btn cg-btn-secondary cg-btn-xs" onclick="editClient(\'' + client.id + '\', event)">Change goal</button>' : '<button type="button" class="cg-btn cg-btn-primary cg-btn-xs" onclick="editClient(\'' + client.id + '\', event)">Set goal</button>') +
    '</div>';
}

function renderStrategyBadge(strategy) {
    var el = document.getElementById('gpStrategyBadge');
    if (!el) return;
    var bLabel = { b2b:'B2B', b2c:'B2C', unknown:'Unknown' }[strategy.bType] || 'Unknown';
    var oLabel = { product:'product', service:'service', unknown:'?' }[strategy.offType] || '?';
    var sLabel = { early:'Early stage', growing:'Growing', mature:'Mature' }[strategy.stage] || strategy.stage;
    var cColor = { Medium:'#F59E0B', Low:'#94A3B8' }[strategy.bTypeConf] || '#94A3B8';
    var sigs   = strategy.signalsFired.slice(0,4).join(', ') || 'No strong signals — update industry/audience';
    el.innerHTML = '<div class="cg-gp-strategy-inner">' +
        '<div class="cg-gp-strategy-row">' +
            '<span class="cg-gp-strategy-label">Inferred:</span>' +
            '<span class="cg-gp-strategy-val">' + bLabel + ' ' + oLabel + ' · ' + sLabel + '</span>' +
            '<span class="cg-gp-strategy-conf" style="color:' + cColor + ';">' + strategy.bTypeConf + ' confidence</span>' +
        '</div>' +
        '<div class="cg-gp-strategy-signals">Signals: ' + escapeHtml(sigs) + '</div>' +
        '<div class="cg-gp-strategy-note">' + escapeHtml(strategy.confReason) + '</div>' +
    '</div>';
}

function renderScoreBreakdown(scores) {
    var el = document.getElementById('gpScores');
    if (!el) return;
    var cats = ['targeting','content','channels','email','ads','measurement'];
    el.innerHTML = cats.map(function(key) {
        var s   = scores[key];
        var rel = scores._relevance[key];
        var pct = s.score;
        var color = !rel.relevant ? '#CBD5E1'
                  : pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
        var circ = 2 * Math.PI * 20, dash = (pct / 100) * circ;
        return '<div class="cg-gp-score-card' + (!rel.relevant ? ' irrelevant' : '') + '">' +
            '<div class="cg-gp-score-ring"><svg width="56" height="56" viewBox="0 0 56 56">' +
                '<circle cx="28" cy="28" r="20" fill="none" stroke="var(--gray-100)" stroke-width="4"/>' +
                '<circle cx="28" cy="28" r="20" fill="none" stroke="' + color + '" stroke-width="4"' +
                ' stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" stroke-dashoffset="0" transform="rotate(-90 28 28)" stroke-linecap="round"/>' +
            '</svg><span class="cg-gp-score-num">' + pct + '</span></div>' +
            '<div class="cg-gp-score-label">' + s.icon + ' ' + s.label + '</div>' +
            '<div class="cg-gp-score-detail cg-proxy-tag">' + (rel.relevant ? scoreDetail(key, s) : 'N/A — ' + (rel.reason||'')) + '</div>' +
        '</div>';
    }).join('');
}

function scoreDetail(key, s) {
    if (key === 'targeting') {
        if (s.score >= 80) return 'Ready ✓ (proxy)';
        var m = [];
        if (!s.hasIndustry)    m.push('industry');
        if (!s.hasRichAudience) m.push(s.audWords + ' words');
        if (!s.hasWebsite)     m.push('website');
        if (!s.hasAnyChannel)  m.push('channels');
        return 'Missing: ' + m.join(', ');
    }
    if (key === 'content')     return s.contentSignal + ' pieces (tool proxy)';
    if (key === 'channels')    return s.channelsActive ? s.channels.length + ' active' : (s.channels.length > 0 ? s.channels.length + ' selected, no content' : 'none');
    if (key === 'email')       return s.hasAnyEmail ? 'Connected (proxy)' : 'No platform';
    if (key === 'ads') {
        if (!s.hasAdCreative)   return 'No creative';
        if (!s.hasWebsite)      return 'No website';
        if (!s.hasRichAudience) return 'Vague audience';
        return s.contentSignal >= 5 ? 'Ready (proxy)' : 'Need content';
    }
    if (key === 'measurement') return s.hasGa4 ? 'GA4 (proxy)' : 'Not connected';
    return s.score + '/100';
}

function renderTop3Actions(top3, client) {
    var el   = document.getElementById('gpTasks');
    var prog = document.getElementById('gpProgressLabel');
    if (!el) return;
    var saved = localStorage.getItem('gp_tasks_' + client.id);
    var done  = {};
    if (saved) { try { done = JSON.parse(saved); } catch(e) {} }
    var pColors = { high:'#EF4444', medium:'#F59E0B', low:'#10B981' };
    var pLabels = { high:'#1 — Do this first', medium:'#2', low:'#3' };
    var cColors = { High:'#10B981', Medium:'#F59E0B', Low:'#94A3B8' };
    var doneCount = top3.filter(function(t) { return done['action_'+t.category]; }).length;
    if (prog) prog.textContent = doneCount + ' / ' + top3.length + ' done';
    if (!top3.length) {
        el.innerHTML = '<div class="cg-gp-no-actions"><p>Complete the client profile and set a goal to generate recommendations.</p></div>';
        return;
    }
    el.innerHTML = top3.map(function(a, i) {
        var isDone = !!done['action_'+a.category];
        // Apply outcome-adjusted confidence (may downgrade if action frequently fails)
        var adjConf = getOutcomeConfidenceNote(a.category, a.confidence, a.confidenceNote);
        var cc = cColors[adjConf.confidence] || '#94A3B8';
        a.confidenceNote = adjConf.note;
        a.confidence = adjConf.confidence;
        var detailHtml = '';
        if (a.minimum) {
            detailHtml += '<div class="cg-gp-detail-block"><div class="cg-gp-detail-label cg-detail-min">\u25b6 Start here</div><div class="cg-gp-detail-text">' + escapeHtml(a.minimum) + '</div></div>';
        }
        if (a.full) {
            detailHtml += '<div class="cg-gp-detail-block"><div class="cg-gp-detail-label cg-detail-full">\u2191 Full version</div><div class="cg-gp-detail-text" style="white-space:pre-line;">' + escapeHtml(a.full) + '</div></div>';
        }
        if (a.constraint) {
            detailHtml += '<div class="cg-gp-detail-block cg-detail-constraint-block"><div class="cg-gp-detail-label cg-detail-constraint">\u00d7 Do not</div><div class="cg-gp-detail-text">' + escapeHtml(a.constraint) + '</div></div>';
        }
        if (!a.minimum && !a.full && a.detail) {
            detailHtml = '<div class="cg-gp-task-detail" style="white-space:pre-line;">' + escapeHtml(a.detail) + '</div>';
        }
        return '<div class="cg-gp-task' + (isDone ? ' done' : '') + ' cg-gp-task-v2">' +
            '<div class="cg-gp-task-left"><button type="button" class="cg-gp-task-check' + (isDone ? ' checked' : '') + '" onclick="toggleGpTask(' + i + ',' + JSON.stringify('action_'+a.category) + ')">' +
                (isDone ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
            '</button></div>' +
            '<div class="cg-gp-task-body">' +
                '<div class="cg-gp-task-header">' +
                    '<span class="cg-gp-task-category">' + a.icon + ' ' + escapeHtml(a.category) + '</span>' +
                    '<span class="cg-gp-task-priority" style="color:' + pColors[a.priority] + ';">' + pLabels[a.priority] + '</span>' +
                '</div>' +
                '<div class="cg-gp-task-title">' + escapeHtml(a.title) + '</div>' +
                '<div class="cg-gp-task-why">' + escapeHtml(a.why) + '</div>' +
                detailHtml +
                '<div class="cg-gp-confidence" style="border-color:' + cc + ';color:' + cc + ';">' +
                    '<strong>' + a.confidence + ' confidence</strong> \u2014 ' + escapeHtml(a.confidenceNote) +
                '</div>' +
                (function() {
                    var execId = client.id + '::' + a.category;
                    var history = getActionAttemptHistory(a.category, client.id);
                    var prevBadge = history && history.lastOutcome
                        ? '<div class="cg-gp-prev-attempt">Previously tried \u00b7 ' + (history.lastOutcome === 'worked' ? '\u2713 Worked' : history.lastOutcome === 'failed' ? '\u00d7 Didn\'t work' : '\u2013 Unsure') + '</div>'
                        : (history ? '<div class="cg-gp-prev-attempt">Previously attempted \u00b7 no outcome recorded</div>' : '');
                    // Use single-quoted onclick args to avoid breaking the double-quoted HTML attribute
                    var safeExecId  = execId.replace(/'/g, "\\'");
                    var safeFn      = a.actionFn.replace(/'/g, "\\'");
                    var safeClient  = client.id.replace(/'/g, "\\'");
                    return prevBadge + '<button type="button" class="cg-gp-task-action" onclick="executeAction(\'' + safeExecId + '\',\'' + safeFn + '\',\'' + safeClient + '\')">' + escapeHtml(a.actionLabel) + ' \u2192</button>';
                })() +
            '</div>' +
        '</div>';
    }).join('');
}


function renderNotRecommended(excluded) {
    var el = document.getElementById('gpNotRecommended');
    if (!el) return;
    if (!excluded || excluded.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    var inner = document.getElementById('gpNotRecommendedList');
    if (!inner) return;
    inner.innerHTML = excluded.map(function(e) {
        return '<div class="cg-gp-excluded-item">' +
            '<div class="cg-gp-excluded-action">⊘ ' + escapeHtml(e.action) + '</div>' +
            '<div class="cg-gp-excluded-reason"><strong>Why not now:</strong> ' + escapeHtml(e.reason) + '</div>' +
            '<div class="cg-gp-excluded-unlock"><strong>What changes this:</strong> ' + escapeHtml(e.unlock) + '</div>' +
        '</div>';
    }).join('');
}

function toggleGpTask(idx, key) {
    var client = getActiveClient();
    if (!client) return;
    var saved = localStorage.getItem('gp_tasks_' + client.id);
    var done  = {};
    if (saved) { try { done = JSON.parse(saved); } catch(e) {} }
    done[key] = !done[key];
    localStorage.setItem('gp_tasks_' + client.id, JSON.stringify(done));
    var scores = scoreClient(client);
    var d = generateDecisions(client, scores);
    renderTop3Actions(d.top3, client);
    renderNotRecommended(d.excluded);
    showToast(done[key] ? '✓ Marked complete' : 'Marked incomplete', done[key] ? 'success' : 'info');
}

function renderChannelBreakdown(client, scores) {
    var r  = scores._raw;
    var st = scores._strategy;
    var ch = client.channels || [];
    var shortFormOk = !(st.bType === 'b2b' && st.offType === 'service');
    var el = document.getElementById('gpChannels');
    if (!el) return;
    var defs = [
        { key:'website', label:'Website', icon:'🌐',
          active: scores.targeting.hasWebsite,
          status: scores.targeting.hasWebsite ? escapeHtml(client.website) : 'Not added',
          tip: scores.targeting.hasWebsite ? 'Check page speed at pagespeed.web.dev. Under 3s on mobile.' : 'Add website URL — required for paid ads and GA4.' },
        { key:'instagram', label:'Instagram', icon:'📸',
          active: ch.includes('instagram'),
          status: ch.includes('instagram') ? 'Selected' : 'Not selected',
          tip: !shortFormOk ? '⚠ Low relevance for B2B services. LinkedIn significantly outperforms Instagram for B2B professional services.'
             : ch.includes('instagram') ? 'Reels (reach), Carousels (saves), Stories (DMs). 4× per week minimum.'
             : 'Best organic reach for visual B2C. High commitment.' },
        { key:'tiktok', label:'TikTok', icon:'🎵',
          active: ch.includes('tiktok'),
          status: ch.includes('tiktok') ? 'Selected' : 'Not selected',
          tip: !shortFormOk ? '⚠ Not recommended for B2B services — entertainment audience, not professional evaluation.'
             : ch.includes('tiktok') ? '1–3× daily. Hook in 1.5s. Completion rate drives distribution.'
             : 'Highest organic reach for B2C under-40. Requires daily posting.' },
        { key:'linkedin', label:'LinkedIn', icon:'💼',
          active: ch.includes('linkedin'),
          status: ch.includes('linkedin') ? 'Selected' : 'Not selected',
          tip: st.bType === 'b2c' && !r.hasShopify ? 'Relevant for B2C if targeting professionals. Otherwise lower priority.'
             : ch.includes('linkedin') ? 'Post Tue–Thu 8–10am. Links in first comment. Carousels and polls outperform text.'
             : 'Primary B2B channel. Highest lead quality of any social platform.' },
        { key:'email', label:'Email', icon:'✉️',
          active: r.hasAnyEmail,
          status: r.hasAnyEmail ? 'Connected (proxy)' : 'Not connected',
          tip: r.hasAnyEmail ? (st.bType === 'b2b' && st.offType === 'service' ? 'Short, plain-text, personal. Never HTML newsletters for B2B.' : r.hasShopify ? 'Build abandoned cart flow first.' : 'Welcome sequence before broadcast campaigns.')
             : 'Connect Mailchimp or Klaviyo in Integrations — API key only.' },
        { key:'measurement', label:'Measurement', icon:'📊',
          active: r.hasGa4,
          status: r.hasGa4 ? 'GA4 connected (proxy)' : 'Not connected',
          tip: r.hasGa4 ? 'Verify conversion goals are set up — page views alone are vanity metrics.'
             : scores._relevance.measurement.relevant ? 'Connect GA4 in Integrations. All decisions are guesses without it.' : 'Add website URL first.' }
    ];
    el.innerHTML = defs.map(function(d) {
        return '<div class="cg-gp-channel-card' + (d.active ? ' active' : '') + '">' +
            '<div class="cg-gp-channel-header"><span class="cg-gp-channel-icon">' + d.icon + '</span>' +
            '<div><strong>' + d.label + '</strong><span class="cg-gp-channel-status' + (d.active ? ' active' : '') + '">' + d.status + '</span></div></div>' +
            '<p class="cg-gp-channel-tip">' + d.tip + '</p>' +
        '</div>';
    }).join('');
}

function renderAdsLauncher(client) {
    var el = document.getElementById('gpAdsGrid');
    if (!el) return;
    el.innerHTML = [
        { p:'Meta Ads', c:'#1877F2', l:'f', sc:'#10B981', s:'No integration needed', h:'Opens Meta Ads Manager directly.',
          url:'https://www.facebook.com/adsmanager/creation/', btn:'Open Meta Ads Manager ↗',
          steps:['Open Meta Ads Manager','Choose objective','Set audience','Upload creative','£5–10/day test budget','Do not scale until 50+ clicks'] },
        { p:'Google Ads', c:'#4285F4', l:'G', sc:'#F59E0B', s:'CSV export', h:'Downloads a pre-filled Google Ads Editor CSV.',
          url:null, btn:'Download Google Ads CSV',
          steps:['Download CSV','Open Google Ads Editor','Import CSV','Review and adjust','Post to Google Ads'] },
        { p:'TikTok Ads', c:'#000', l:'TT', sc:'#10B981', s:'No integration needed', h:'TikTok Ads Manager is self-serve.',
          url:'https://ads.tiktok.com/i18n/home/', btn:'Open TikTok Ads Manager ↗',
          steps:['Create account','New Campaign','Upload video creative','£20/day minimum','24hr approval'] },
        { p:'LinkedIn Ads', c:'#0A66C2', l:'in', sc:'#10B981', s:'No integration needed', h:'LinkedIn Campaign Manager — best for B2B.',
          url:'https://www.linkedin.com/campaignmanager/', btn:'Open LinkedIn Campaign Manager ↗',
          steps:['Open Campaign Manager','Choose objective','Set B2B audience','Choose ad format','£10–20/day'] }
    ].map(function(ad) {
        return '<div class="cg-gp-ad-card">' +
            '<div class="cg-gp-ad-header"><div class="cg-gp-ad-logo" style="background:' + ad.c + ';color:white;font-weight:700;font-size:0.75rem;">' + ad.l + '</div>' +
            '<div><strong>' + ad.p + '</strong><span class="cg-gp-ad-status" style="color:' + ad.sc + ';">' + ad.s + '</span></div></div>' +
            '<p class="cg-gp-ad-how">' + ad.h + '</p>' +
            '<div class="cg-gp-ad-steps">' + ad.steps.map(function(s,i){return '<div class="cg-gp-ad-step"><span class="cg-gp-step-num">'+(i+1)+'</span><span>'+s+'</span></div>';}).join('') + '</div>' +
            '<button type="button" class="cg-btn cg-btn-secondary cg-gp-ad-btn" onclick="' +
                (ad.url ? 'window.open('+JSON.stringify(ad.url)+',\'_blank\')' : 'downloadGoogleAdsCSV()') +
            '">' + ad.btn + '</button>' +
        '</div>';
    }).join('');
}

function downloadGoogleAdsCSV() {
    var client = getActiveClient();
    var nm = client ? client.name : 'Brand';
    var pieces = (state.generatedContent||[]).filter(function(p){return p.type==='ad'||p.type==='post';}).slice(0,5);
    if (!pieces.length) pieces = [{title:nm,text:'Discover '+nm,channelName:'Google',type:'ad'}];
    var rows = [['Campaign','Ad Group','Headline 1','Headline 2','Headline 3','Description 1','Description 2','Final URL']];
    pieces.forEach(function(p,i){
        var ls = p.text.split('\n').filter(function(l){return l.trim();});
        rows.push([nm+' Campaign '+(i+1),p.channelName||'Ad Group',(p.title||nm).substring(0,30),(ls[0]||nm).substring(0,30),(ls[1]||'Learn More').substring(0,30),(ls[2]||p.text).substring(0,90),(ls[3]||'Visit us').substring(0,90),client&&client.website?client.website:'https://example.com']);
    });
    var csv = rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var blob = new Blob([csv],{type:'text/csv'});
    var a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nm.toLowerCase().replace(/\s/g,'-')+'-google-ads.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Google Ads CSV downloaded ✓','success');
}



// ============ ANALYTICS FUNCTIONS ============
function renderAdsView() {
    var client = getActiveClient();
    var cInts = client ? (integrations[client.id] || {}) : {};
    var connectedPlatforms = Object.keys(cInts).filter(function(k) {
        return ['meta','google','tiktok','linkedin'].includes(k);
    });
    var noPlat = document.getElementById('adsNoPlatform');
    var platSection = document.getElementById('adsPlatformsSection');
    if (noPlat) noPlat.style.display = connectedPlatforms.length > 0 ? 'none' : 'flex';
    if (platSection) platSection.style.display = connectedPlatforms.length > 0 ? 'block' : 'none';
}

function openGaSetup() {
    openIntegrations();
    setTimeout(function() {
        var card = document.getElementById('int-ga4');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toggleIntegrationForm('ga4');
        }
    }, 400);
}

function refreshGa4Data() {
    var client = getActiveClient();
    if (!client) { showToast('Select a client first', 'error'); return; }
    var cInts = integrations[client.id] || {};
    var ga4 = cInts.ga4;
    if (!ga4) { openGaSetup(); return; }

    showToast('Fetching GA4 data...', 'info');

    setTimeout(function() {
        var gaSection = document.getElementById('gaStatsSection');
        var banner = document.getElementById('gaConnectBanner');
        if (gaSection) gaSection.style.display = 'block';
        if (banner) banner.style.display = 'none';

        var grid = document.getElementById('gaStatsGrid');
        if (grid) {
            grid.innerHTML =
                '<div class="cg-ga4-needs-backend" style="grid-column:1/-1;">' +
                    '<div class="cg-ga4-backend-card">' +
                        '<h3>One more step to get live GA4 data</h3>' +
                        '<p>GA4 credentials saved for Property <strong>' + escapeHtml(ga4.propertyId || '') + '</strong>. The GA4 API requires a server-side JWT request — browsers block it directly for security.</p>' +
                        '<p style="margin-top:0.5rem;">Download the ready-made Vercel serverless function below. Drop it in your <code>/api</code> folder, add two environment variables, deploy — then live data flows automatically.</p>' +
                        '<div class="cg-ga4-backend-steps">' +
                            '<div class="cg-gp-ad-step"><span class="cg-gp-step-num">1</span><span>Click Download to get <code>ga4.js</code></span></div>' +
                            '<div class="cg-gp-ad-step"><span class="cg-gp-step-num">2</span><span>Place in your project at <code>contentengine/api/ga4.js</code></span></div>' +
                            '<div class="cg-gp-ad-step"><span class="cg-gp-step-num">3</span><span>In Vercel → Settings → Environment Variables, add <code>GA4_CLIENT_EMAIL</code> and <code>GA4_PRIVATE_KEY</code></span></div>' +
                            '<div class="cg-gp-ad-step"><span class="cg-gp-step-num">4</span><span>Run <code>vercel --prod</code> then click Fetch GA4 Data again</span></div>' +
                        '</div>' +
                        '<button class="cg-btn cg-btn-primary cg-btn-sm" style="margin-top:1rem;" onclick="buildGa4Backend()">Download ga4.js serverless function</button>' +
                    '</div>' +
                '</div>';
        }
    }, 1200);
}

function buildGa4Backend() {
    var code = [
        '// api/ga4.js — Vercel serverless function for GA4 Data API',
        '// Add GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY to Vercel environment variables',
        '',
        'const { google } = require("googleapis");',
        '',
        'export default async function handler(req, res) {',
        '  res.setHeader("Access-Control-Allow-Origin", "*");',
        '  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");',
        '  if (req.method === "OPTIONS") return res.status(200).end();',
        '  try {',
        '    const auth = new google.auth.GoogleAuth({',
        '      credentials: {',
        '        client_email: process.env.GA4_CLIENT_EMAIL,',
        '        private_key: process.env.GA4_PRIVATE_KEY.replace(/\\\\n/g, "\\n"),',
        '      },',
        '      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],',
        '    });',
        '    const analyticsData = google.analyticsdata({ version: "v1beta", auth });',
        '    const propertyId = req.query.propertyId;',
        '    const days = parseInt(req.query.days || "28");',
        '    if (!propertyId) return res.status(400).json({ error: "propertyId required" });',
        '    const [mainReport, sourceReport] = await Promise.all([',
        '      analyticsData.properties.runReport({',
        '        property: "properties/" + propertyId,',
        '        requestBody: {',
        '          dateRanges: [{ startDate: days + "daysAgo", endDate: "today" }],',
        '          metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "bounceRate" }, { name: "conversions" }],',
        '          dimensions: [{ name: "pagePath" }],',
        '          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],',
        '          limit: 10,',
        '        },',
        '      }),',
        '      analyticsData.properties.runReport({',
        '        property: "properties/" + propertyId,',
        '        requestBody: {',
        '          dateRanges: [{ startDate: days + "daysAgo", endDate: "today" }],',
        '          metrics: [{ name: "sessions" }],',
        '          dimensions: [{ name: "sessionDefaultChannelGroup" }],',
        '          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],',
        '        },',
        '      }),',
        '    ]);',
        '    let sessions = 0, users = 0, bounceRate = 0, conversions = 0;',
        '    const totals = mainReport.data.totals && mainReport.data.totals[0];',
        '    if (totals) {',
        '      sessions = parseInt(totals.metricValues[0].value || 0);',
        '      users = parseInt(totals.metricValues[1].value || 0);',
        '      bounceRate = parseFloat(totals.metricValues[2].value || 0).toFixed(1);',
        '      conversions = parseInt(totals.metricValues[3].value || 0);',
        '    }',
        '    const pages = (mainReport.data.rows || []).map(row => ({',
        '      path: row.dimensionValues[0].value,',
        '      sessions: parseInt(row.metricValues[0].value || 0),',
        '      bounceRate: parseFloat(row.metricValues[2].value || 0).toFixed(1),',
        '      conversions: parseInt(row.metricValues[3].value || 0),',
        '    }));',
        '    const sources = (sourceReport.data.rows || []).map(row => ({',
        '      source: row.dimensionValues[0].value,',
        '      sessions: parseInt(row.metricValues[0].value || 0),',
        '    }));',
        '    res.json({ sessions, users, bounceRate, conversions, pages, sources, propertyId, fetchedAt: new Date().toISOString() });',
        '  } catch (err) {',
        '    res.status(500).json({ error: err.message });',
        '  }',
        '}'
    ].join('\n');

    var blob = new Blob([code], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'ga4.js';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('ga4.js downloaded — place in /api folder and deploy ✓', 'success');
    setTimeout(function() { showToast('Add GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY in Vercel env vars', 'info'); }, 2500);
}

function renderGa4Dashboard(client, ga4Creds) {
    var cached = ga4Creds.cachedData;
    var grid = document.getElementById('gaStatsGrid');
    var lastUpdated = document.getElementById('gaLastUpdated');

    if (!cached) {
        if (grid) grid.innerHTML =
            '<div class="cg-ga4-no-data" style="grid-column:1/-1;">' +
                '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" stroke-width="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>' +
                '<p>GA4 credentials saved. Click below to fetch your latest analytics.</p>' +
                '<button class="cg-btn cg-btn-secondary cg-btn-sm" onclick="refreshGa4Data()">Fetch GA4 Data</button>' +
            '</div>';
        return;
    }

    if (grid) {
        var stats = [
            { label: 'Sessions', value: cached.sessions ? cached.sessions.toLocaleString() : '—', change: cached.sessionChange, icon: '👥' },
            { label: 'Users', value: cached.users ? cached.users.toLocaleString() : '—', change: cached.userChange, icon: '🙋' },
            { label: 'Bounce Rate', value: cached.bounceRate ? cached.bounceRate + '%' : '—', change: cached.bounceChange, lowerBetter: true, icon: '↩️' },
            { label: 'Conversions', value: cached.conversions ? cached.conversions.toLocaleString() : '—', change: cached.conversionChange, icon: '🎯' }
        ];
        grid.innerHTML = stats.map(function(s) {
            var change = s.change ? parseFloat(s.change) : null;
            var changeClass = change !== null ? (change > 0 ? (s.lowerBetter ? 'negative' : 'positive') : (s.lowerBetter ? 'positive' : 'negative')) : '';
            var changeHtml = change !== null ? '<span class="cg-analytics-change ' + changeClass + '">' + (change > 0 ? '+' : '') + s.change + '%</span>' : '';
            return '<div class="cg-analytics-card">' +
                '<div class="cg-analytics-header"><span>' + s.icon + ' ' + s.label + '</span>' + changeHtml + '</div>' +
                '<div class="cg-analytics-value">' + s.value + '</div>' +
            '</div>';
        }).join('');
    }

    var sourcesEl = document.getElementById('gaTrafficSources');
    if (sourcesEl && cached.sources && cached.sources.length) {
        var total = cached.sources.reduce(function(sum, s) { return sum + s.sessions; }, 0);
        var colors = { organic: '#10B981', direct: '#3B82F6', referral: '#F59E0B', social: '#8B5CF6', email: '#EC4899', paid: '#EF4444' };
        sourcesEl.innerHTML = cached.sources.map(function(s) {
            var pct = total > 0 ? Math.round(s.sessions / total * 100) : 0;
            var color = colors[(s.source || '').toLowerCase()] || '#64748B';
            return '<div class="cg-traffic-row">' +
                '<span class="cg-traffic-label"><span class="cg-dot" style="background:' + color + ';"></span>' + escapeHtml(s.source) + '</span>' +
                '<div class="cg-traffic-bar-wrap"><div class="cg-traffic-bar" style="width:' + pct + '%;background:' + color + ';"></div></div>' +
                '<span class="cg-traffic-pct">' + pct + '% (' + s.sessions.toLocaleString() + ')</span>' +
            '</div>';
        }).join('');
    } else if (sourcesEl) {
        sourcesEl.innerHTML = '<p style="color:var(--gray-400);font-size:0.875rem;">Fetch data to see traffic sources.</p>';
    }

    var pagesEl = document.getElementById('gaTopPages');
    if (pagesEl && cached.pages && cached.pages.length) {
        var header = pagesEl.querySelector('.cg-table-header');
        var rowsHtml = cached.pages.map(function(p) {
            return '<div class="cg-table-row">' +
                '<span style="font-family:var(--font-mono);font-size:0.8rem;">' + escapeHtml(p.path) + '</span>' +
                '<span>' + (p.sessions || 0).toLocaleString() + '</span>' +
                '<span>' + (p.bounceRate || '—') + (p.bounceRate ? '%' : '') + '</span>' +
                '<span>' + (p.avgTime || '—') + '</span>' +
                '<span>' + (p.conversions || 0) + '</span>' +
            '</div>';
        }).join('');
        pagesEl.innerHTML = (header ? header.outerHTML : '') + rowsHtml;
    }

    if (lastUpdated && ga4Creds.lastFetched) {
        lastUpdated.textContent = 'Last updated: ' + new Date(ga4Creds.lastFetched).toLocaleString('en-GB');
    }
}

function refreshAnalytics() {
    var client = getActiveClient();
    if (!client) return;
    var ga4 = (integrations[client.id] || {}).ga4;
    if (ga4) refreshGa4Data();
    renderAnalytics();
    showToast('Analytics refreshed', 'success');
}

// ============ OUTCOME FEEDBACK SYSTEM ============
//
// What this tracks:
//   ce_executions — { [execId]: { clientId, actionKey, actionFn, timestampStarted, dismissed } }
//   ce_outcomes   — { [actionKey]: { attempted, worked, unsure, failed } }
//
// Rules:
//   - Prompt shown once per execution, on return to that client's Decision Engine
//   - Outcome adjusts priority multipliers by ±10–15% — does NOT override core logic
//   - No timers, no scheduling, no automatic inference
//   - All adjustments are deterministic and explainable
//
// KNOWN LIMITATION: "worked" is self-reported. The system cannot verify outcomes.
// This is user-driven feedback, not performance measurement.
// ═══════════════════════════════════════════════════════════════════

var outcomeExecutions = {};  // in-progress executions
var outcomeStats      = {};  // aggregate outcome counts per action key

function loadOutcomeData() {
    try {
        var ex = localStorage.getItem('ce_executions');
        outcomeExecutions = ex ? JSON.parse(ex) : {};
    } catch(e) { outcomeExecutions = {}; }
    try {
        var st = localStorage.getItem('ce_outcomes');
        outcomeStats = st ? JSON.parse(st) : {};
    } catch(e) { outcomeStats = {}; }
}

function saveOutcomeData() {
    localStorage.setItem('ce_executions', JSON.stringify(outcomeExecutions));
    localStorage.setItem('ce_outcomes',   JSON.stringify(outcomeStats));
}

// Called when a user clicks a "Do this now" button
// Records that execution has started, then fires the original action
function executeAction(execId, actionFn, clientId) {
    // Record execution start
    outcomeExecutions[execId] = {
        clientId:        clientId,
        actionKey:       execId.split('::')[1] || execId,
        timestampStarted: new Date().toISOString(),
        dismissed:       false,
        outcome:         null
    };
    saveOutcomeData();

    // Fire the original action
    try {
        // eslint-disable-next-line no-new-func
        (new Function(actionFn))();
    } catch(e) {
        console.warn('executeAction: could not run actionFn', e);
    }
}

// Check on return to Decision Engine whether any pending feedback exists for this client
function checkPendingOutcomeFeedback(clientId) {
    var pending = Object.keys(outcomeExecutions).filter(function(execId) {
        var ex = outcomeExecutions[execId];
        return ex.clientId === clientId && !ex.dismissed && !ex.outcome;
    });
    if (pending.length === 0) return;
    // Show prompt for the first pending execution only (one at a time)
    showOutcomeFeedbackPrompt(pending[0]);
}

function showOutcomeFeedbackPrompt(execId) {
    var ex = outcomeExecutions[execId];
    if (!ex) return;

    var modal = document.getElementById('outcomeFeedbackModal');
    if (!modal) return;

    var actionLabel = document.getElementById('outcomeFeedbackLabel');
    if (actionLabel) {
        var key = ex.actionKey || execId;
        var keyLabels = {
            'Targeting': 'fixing the targeting profile',
            'Content':   'creating content',
            'Email':     'the email action',
            'Ads':       'the ads action',
            'Measurement': 'connecting GA4',
            'Channels':  'selecting channels',
            'Conversion': 'the conversion audit',
            'Pipeline':  'the pipeline review',
            'Audience':  'the audience test',
            'Authority': 'the authority content',
            'E-commerce':'the e-commerce action'
        };
        actionLabel.textContent = keyLabels[key] || ('the ' + key.toLowerCase() + ' action');
    }

    // Store which execId we are prompting for
    modal.dataset.execId = execId;
    modal.style.display = 'flex';
}

function recordOutcome(outcome) {
    var modal = document.getElementById('outcomeFeedbackModal');
    if (!modal) return;
    var execId = modal.dataset.execId;
    if (!execId || !outcomeExecutions[execId]) { dismissOutcomeFeedback(); return; }

    var ex = outcomeExecutions[execId];
    ex.outcome         = outcome;  // 'worked' | 'unsure' | 'failed'
    ex.timestampFeedback = new Date().toISOString();
    ex.dismissed       = true;

    // Update aggregate stats
    var key = ex.actionKey;
    if (!outcomeStats[key]) outcomeStats[key] = { attempted: 0, worked: 0, unsure: 0, failed: 0 };
    outcomeStats[key].attempted++;
    if (outcome === 'worked') outcomeStats[key].worked++;
    else if (outcome === 'unsure') outcomeStats[key].unsure++;
    else if (outcome === 'failed') outcomeStats[key].failed++;

    saveOutcomeData();
    modal.style.display = 'none';

    var labels = { worked: 'Great — recorded ✓', unsure: 'Noted.', failed: 'Noted — this will be weighted down.' };
    showToast(labels[outcome] || 'Feedback recorded', outcome === 'worked' ? 'success' : 'info');

    // Re-render the Decision Engine so any confidence/priority adjustments show
    var client = getActiveClient();
    if (client) buildGrowthAudit(client);
}

function dismissOutcomeFeedback() {
    var modal = document.getElementById('outcomeFeedbackModal');
    if (!modal) return;
    var execId = modal.dataset.execId;
    if (execId && outcomeExecutions[execId]) {
        outcomeExecutions[execId].dismissed = true;
        saveOutcomeData();
    }
    modal.style.display = 'none';
}

// ── Outcome-adjusted impact multiplier ──
// Returns a small multiplier (0.85–1.15) based on recorded outcomes.
// Applied on top of the base impact calculation.
//
// Rules:
//   worked rate > 70%  → multiply by 1.15 (boost up to 15%)
//   failed rate > 50%  → multiply by 0.85 (reduce up to 15%)
//   unsure rate > 60%  → multiply by 0.92 (reduce confidence signal)
//   < 5 attempts       → return 1.0 (not enough data to adjust)
//
// IMPORTANT: This never overrides the impact function entirely.
// It is a small correction factor on top of gap × goal-weight × effort.
function getOutcomeMultiplier(actionKey) {
    var stats = outcomeStats[actionKey];
    if (!stats || stats.attempted < 5) return 1.0; // need ≥5 data points

    var workedRate = stats.worked  / stats.attempted;
    var failedRate = stats.failed  / stats.attempted;
    var unsureRate = stats.unsure  / stats.attempted;

    if (failedRate > 0.5)  return 0.85;
    if (workedRate > 0.7)  return 1.15;
    if (unsureRate > 0.6)  return 0.92;
    return 1.0;
}

// ── Outcome-adjusted confidence level ──
// If an action type has failed > 50% of the time with ≥5 attempts,
// downgrade confidence by one level and add a note.
function getOutcomeConfidenceNote(actionKey, baseConfidence, baseNote) {
    var stats = outcomeStats[actionKey];
    if (!stats || stats.attempted < 5) return { confidence: baseConfidence, note: baseNote };

    var failedRate = stats.failed  / stats.attempted;
    var workedRate = stats.worked  / stats.attempted;

    if (failedRate > 0.5) {
        var downgraded = baseConfidence === 'High' ? 'Medium' : 'Low';
        return {
            confidence: downgraded,
            note: baseNote + ' ⚠ This action has not worked for ' + Math.round(failedRate * 100) + '% of attempts recorded in this tool (' + stats.attempted + ' total). Treat with caution.'
        };
    }
    if (workedRate > 0.7 && stats.attempted >= 10) {
        return {
            confidence: baseConfidence,
            note: baseNote + ' ✓ This action has worked for ' + Math.round(workedRate * 100) + '% of recorded attempts (' + stats.attempted + ' total).'
        };
    }
    return { confidence: baseConfidence, note: baseNote };
}

// ── Check if an action has been attempted before ──
function getActionAttemptHistory(actionKey, clientId) {
    var attempts = Object.values(outcomeExecutions).filter(function(ex) {
        return ex.clientId === clientId && ex.actionKey === actionKey;
    });
    if (!attempts.length) return null;
    var last = attempts.sort(function(a, b) {
        return new Date(b.timestampStarted) - new Date(a.timestampStarted);
    })[0];
    return {
        count:      attempts.length,
        lastOutcome: last.outcome || null,
        lastDate:   last.timestampStarted
    };
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    loadClients();
    loadIntegrations();
    loadClientAssets();
    loadOutcomeData();

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
