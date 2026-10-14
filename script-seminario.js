/* ==========================================================================
   MINIST├ëRIO REMISS├âO PORTUGAL ÔÇö Core Web Application Logic & Native Registration
   - Supabase Database Integration (trvssakxtqvwngisqzed.supabase.co)
   - Native Registration System with Mandatory Shirt Size Selection (XS, S, M, L, XL)
   - Stripe Checkout API & Webhook Integration
   - Advanced Admin Panel with KPIs, Shirt Order Report & CSV Export
   ========================================================================== */

const APP_CONFIG = {
    DEFAULT_LANG: 'pt',
    ADMIN_PASS_HASH: 'remissao2027',
    CHECKOUT_URL: 'https://buy.stripe.com/bJe7sK3HT06E9qofNh2ZO01', // URL oficial do Checkout Stripe
    SUPABASE: {
        URL: 'https://jcpjgowdxcmqditgvmeq.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcGpnb3dkeGNtcWRpdGd2bWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NDIwNTAsImV4cCI6MjEwMjMxODA1MH0.MCdmZqHdRFDaS-FzHCuDmWEdtd08qyJFYhXumepwZ8Y'
    },
    STORAGE_KEYS: {
        LANG: 'remissao_pt_lang',
        AUTH: 'remissao_pt_admin_session',
        REGISTRATIONS: 'remissao_pt_registrations',
        REGISTRATIONS_LEGACY: 'remissao_pt_registrations_store'
    }
};

// Initialize Supabase JS Client if available
let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(APP_CONFIG.SUPABASE.URL, APP_CONFIG.SUPABASE.ANON_KEY);
}

class RemissaoApp {
    constructor() {
        this.state = {
            currentLang: localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LANG) || APP_CONFIG.DEFAULT_LANG,
            isAdminAuthenticated: sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH) === 'true',
            registrations: [],
            activeFilter: 'all',
            searchQuery: ''
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkUrlParams();
        this.handleHashChange();
    }

    getLocalRegistrations() {
        try {
            let list1 = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS) || '[]');
            let list2 = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS_LEGACY) || '[]');
            
            const map = new Map();
            [...list1, ...list2].forEach(item => {
                if (item && item.id && !map.has(item.id)) {
                    map.set(item.id, item);
                }
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS, JSON.stringify(merged));
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS_LEGACY, JSON.stringify(merged));
            return merged;
        } catch (e) {
            console.warn('Error reading local registrations:', e);
            return [];
        }
    }

    saveLocalRegistrations(regs) {
        try {
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS_LEGACY, JSON.stringify(regs));
        } catch (e) {
            console.warn('Error saving local registrations:', e);
        }
    }

    bindEvents() {
        // Hash Routing
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Mobile Hamburger Menu Toggle
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                const isActive = menuToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', isActive);
            });

            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Click Event Delegation
        document.addEventListener('click', (e) => {
            // Open Native Registration Form Modal
            if (e.target.closest('.btn-open-registration-modal, .btn-registration-trigger, #heroPrimaryCta, #navRegisterBtn')) {
                e.preventDefault();
                this.openRegistrationModal();
            }

            // FAQ Accordion Headers
            const accordionHeader = e.target.closest('.faq-accordion-header');
            if (accordionHeader) {
                e.preventDefault();
                const item = accordionHeader.closest('.faq-accordion-item');
                if (item) {
                    const isActive = item.classList.contains('active');
                    document.querySelectorAll('.faq-accordion-item').forEach(el => el.classList.remove('active'));
                    if (!isActive) {
                        item.classList.add('active');
                    }
                }
            }

            // Admin Filter Pills
            const filterPill = e.target.closest('#adminFilterPills .filter-pill');
            if (filterPill) {
                e.preventDefault();
                document.querySelectorAll('#adminFilterPills .filter-pill').forEach(btn => {
                    btn.classList.remove('active', 'btn-primary');
                    btn.classList.add('btn-secondary');
                });
                filterPill.classList.add('active', 'btn-primary');
                filterPill.classList.remove('btn-secondary');
                this.state.activeFilter = filterPill.dataset.filter;
                this.renderRegistrationsTable();
            }

            // Cronograma Filter Pills
            const cronoPill = e.target.closest('#cronogramaFilterPills .cronograma-pill-btn');
            if (cronoPill) {
                e.preventDefault();
                document.querySelectorAll('#cronogramaFilterPills .cronograma-pill-btn').forEach(btn => btn.classList.remove('active'));
                cronoPill.classList.add('active');
                const filter = cronoPill.dataset.filter || 'all';
                const rows = document.querySelectorAll('#cronogramaTable tbody tr');
                let count = 0;
                rows.forEach(row => {
                    const cat = row.getAttribute('data-category');
                    if (filter === 'all' || cat === filter) {
                        row.style.display = '';
                        count++;
                    } else {
                        row.style.display = 'none';
                    }
                });
                const countBadge = document.getElementById('cronogramaActiveCount');
                if (countBadge) {
                    if (filter === 'all') {
                        countBadge.textContent = 'Exibindo todos os 14 encontros';
                    } else if (filter === 'aula') {
                        countBadge.textContent = `Exibindo ${count} aulas temáticas`;
                    } else {
                        countBadge.textContent = `Exibindo ${count} encontros especiais`;
                    }
                }
            }
        });

        // Close Modals
        document.getElementById('closeRegistrationModalBtn')?.addEventListener('click', () => this.closeModal('registrationModal'));
        document.getElementById('closeConfirmationModalBtn')?.addEventListener('click', () => this.closeModal('confirmationModal'));
        document.getElementById('btnCloseConfirmation')?.addEventListener('click', () => this.closeModal('confirmationModal'));
        document.getElementById('closeDetailsModalBtn')?.addEventListener('click', () => this.closeModal('registrationDetailsModal'));
        document.getElementById('closeWhatsappModalBtn')?.addEventListener('click', () => this.closeModal('whatsappConfirmationModal'));
        document.getElementById('btnCloseWhatsappModal')?.addEventListener('click', () => this.closeModal('whatsappConfirmationModal'));

        // Toggle Payment Method Submit Button Text
        document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const btnText = document.getElementById('btnSubmitRegistrationText');
                if (!btnText) return;
                if (e.target.value === 'whatsapp_manual') {
                    btnText.textContent = 'Concluir Inscrição e Falar no WhatsApp →';
                } else {
                    btnText.textContent = 'Ir para Pagamento Online Seguro (€85) →';
                }
            });
        });

        // Close Modal when clicking outside card
        document.querySelectorAll('.registration-modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });

        // Form Submission -> Server API /register
        const nativeForm = document.getElementById('nativeRegistrationForm');
        if (nativeForm) {
            nativeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNativeRegistrationSubmit();
            });
        }

        // Admin Search Input
        const searchInput = document.getElementById('adminSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.trim().toLowerCase();
                this.renderRegistrationsTable();
            });
        }

        // Admin Export CSV
        document.getElementById('btnExportCsv')?.addEventListener('click', () => this.exportRegistrationsCsv());

        // Admin Footer Access Link
        document.getElementById('footerAdminLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.state.isAdminAuthenticated) {
                window.location.hash = '#admin';
                this.showView('view-admin');
                this.fetchAndRenderAdminData();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                this.openAdminAuthModal();
            }
        });

        // Admin Exit
        document.getElementById('exitAdminBtn')?.addEventListener('click', () => {
            this.state.isAdminAuthenticated = false;
            sessionStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH);
            this.showToast('Sessão encerrada com segurança');
            window.location.hash = '#home';
            this.showView('view-home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Admin Auth Modal Submit
        document.getElementById('adminAuthForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value.trim();
            if (password === APP_CONFIG.ADMIN_PASS_HASH) {
                this.state.isAdminAuthenticated = true;
                sessionStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH, 'true');
                document.getElementById('adminAuthModal').classList.remove('active');
                document.getElementById('adminPassword').value = '';
                window.location.hash = '#admin';
                this.showView('view-admin');
                this.fetchAndRenderAdminData();
                this.showToast('Autenticação realizada com sucesso!');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Senha incorreta. Tente novamente.');
            }
        });

        // Close Admin Auth Modal
        document.getElementById('closeAdminAuthModalBtn')?.addEventListener('click', () => {
            document.getElementById('adminAuthModal').classList.remove('active');
        });
    }

    openRegistrationModal() {
        const modal = document.getElementById('registrationModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async handleNativeRegistrationSubmit() {
        const submitBtn = document.getElementById('btnSubmitRegistration');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳ Processando inscrição...</span>';
            }

            const fullName = document.getElementById('regFullName')?.value.trim();
            const email = document.getElementById('regEmail')?.value.trim();
            const phone = document.getElementById('regPhone')?.value.trim();
            const birthDate = document.getElementById('regBirthDate')?.value;
            const country = document.getElementById('regCountry')?.value.trim();
            const city = document.getElementById('regCity')?.value.trim();

            const selectedShirt = document.querySelector('input[name="shirt_size"]:checked');
            const shirtSize = selectedShirt ? selectedShirt.value : '';

            const selectedPayment = document.querySelector('input[name="payment_method"]:checked')?.value || 'whatsapp_manual';

            const church = document.getElementById('regChurch')?.value.trim() || '';
            const pastor = document.getElementById('regPastor')?.value.trim() || '';
            const howFound = document.getElementById('regHowFound')?.value || '';
            const previousParticipant = document.getElementById('regPreviousParticipant')?.value || '';
            const notes = document.getElementById('regNotes')?.value.trim() || '';
            const rgpdAccepted = document.getElementById('regRgpdAccepted')?.checked;

            if (!fullName || !email || !phone || !birthDate || !country || !city || !shirtSize) {
                alert('Por favor, preencha todos os campos obrigatórios (*), incluindo o tamanho da camiseta.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            if (!rgpdAccepted) {
                alert('Por favor, confirme a autorização de tratamento de dados conforme o RGPD.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            // 1. Generate unique client reference ID and create registration record
            const regId = 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
            const newRegistration = {
                id: regId,
                full_name: fullName,
                email: email,
                phone: phone,
                birth_date: birthDate,
                country: country,
                city: city,
                shirt_size: shirtSize,
                church: church,
                pastor: pastor,
                how_found: howFound,
                previous_participant: previousParticipant,
                notes: notes,
                event_name: 'Seminário Remissão Portugal 2027',
                event_price: 85.00,
                payment_status: 'pending',
                payment_method: selectedPayment,
                currency: 'EUR',
                created_at: new Date().toISOString()
            };

            // 2. Persist locally first so data is NEVER lost
            const localList = this.getLocalRegistrations();
            localList.unshift(newRegistration);
            this.saveLocalRegistrations(localList);

            // 3. Attempt async sync to backend/Supabase with timeout (non-blocking)
            try {
                if (supabaseClient) {
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
                    const insertPromise = supabaseClient.from('registrations').insert([newRegistration]);
                    await Promise.race([insertPromise, timeoutPromise]).catch((e) => {
                        console.warn('Supabase insert timed out or failed (safe in localStorage):', e);
                    });
                }
            } catch (syncErr) {
                console.warn('Background sync failed, continuing:', syncErr);
            }

            // 4. Close registration form modal
            this.closeModal('registrationModal');

            // 5. Check if user selected WhatsApp / Manual or Online Stripe
            if (selectedPayment === 'whatsapp_manual') {
                const waNameEl = document.getElementById('waConfirmName');
                const waShirtEl = document.getElementById('waConfirmShirt');
                if (waNameEl) waNameEl.textContent = fullName;
                if (waShirtEl) waShirtEl.textContent = shirtSize;

                const waMessage = `Olá Pastor Ezequias! Acabei de me inscrever no Seminário Remissão (Inscrito: ${fullName}, Camiseta: ${shirtSize}, Cidade: ${city}). Gostaria de combinar o pagamento via MB WAY / Transferência.`;
                const waUrl = `https://wa.me/351928364086?text=${encodeURIComponent(waMessage)}`;
                const waBtn = document.getElementById('btnOpenWhatsAppDirect');
                if (waBtn) waBtn.href = waUrl;

                const waModal = document.getElementById('whatsappConfirmationModal');
                if (waModal) waModal.classList.add('active');

                this.showToast('✅ Inscrição registrada! Fale com o Pr. Ezequias no WhatsApp.');
                return;
            }

            // 6. Online Stripe Checkout
            const checkoutBaseUrl = APP_CONFIG.CHECKOUT_URL || 'https://buy.stripe.com/bJe7sK3HT06E9qofNh2ZO01';
            const checkoutUrl = new URL(checkoutBaseUrl);
            checkoutUrl.searchParams.set('client_reference_id', regId);
            if (email) {
                checkoutUrl.searchParams.set('prefilled_email', email);
            }

            window.location.href = checkoutUrl.toString();

        } catch (err) {
            console.error('Registration Exception:', err);
            alert('Ocorreu um erro ao processar. Por favor, tente novamente ou fale conosco pelo WhatsApp.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }

    async checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const regId = params.get('registration_id');

        if (status === 'success' || params.has('session_id')) {
            const confirmModal = document.getElementById('confirmationModal');
            if (confirmModal) confirmModal.classList.add('active');

            if (regId) {
                fetch('/api/simulated-pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ registration_id: regId })
                }).catch(() => {});
            }
        }
    }

    handleHashChange() {
        const hash = window.location.hash || '#home';
        const isAdminPage = hash === '#admin' || window.location.pathname.includes('/admin');

        if (isAdminPage) {
            if (!this.state.isAdminAuthenticated) {
                this.openAdminAuthModal();
                return;
            }
            this.showView('view-admin');
            this.fetchAndRenderAdminData();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        this.showView('view-home');
        if (hash !== '#home' && hash !== '') {
            const targetSection = document.querySelector(hash);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    showView(viewId) {
        document.querySelectorAll('.view-page').forEach(page => {
            page.style.display = page.id === viewId ? 'block' : 'none';
        });

        // Hide floating sticky CTA button when inside Admin View
        const floatingCta = document.getElementById('floatingCta');
        if (floatingCta) {
            floatingCta.style.display = viewId === 'view-admin' ? 'none' : 'block';
        }
    }

    openAdminAuthModal() {
        const modal = document.getElementById('adminAuthModal');
        if (modal) {
            modal.classList.add('active');
            setTimeout(() => {
                document.getElementById('adminPassword')?.focus();
            }, 100);
        }
    }

    async fetchAndRenderAdminData() {
        const tbody = document.getElementById('adminRegistrationsTbody');
        const statusContainer = document.getElementById('adminSupabaseStatus');

        // 1. Immediately render local registrations so admin sees data right away!
        let localData = this.getLocalRegistrations();
        this.state.registrations = localData;
        this.renderAdminKPIs();
        this.renderShirtReport();
        this.renderRegistrationsTable();

        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="supabase-status-banner" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94A3B8;">
                    <span>⏳ Verificando conexão e sincronização com o Supabase Cloud...</span>
                </div>
            `;
        }

        // 2. Query Supabase Cloud
        let supabaseOnline = false;
        let supData = null;

        if (supabaseClient) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
                const fetchPromise = supabaseClient
                    .from('registrations')
                    .select('*')
                    .order('created_at', { ascending: false });

                const res = await Promise.race([fetchPromise, timeoutPromise]);
                if (res && !res.error && res.data) {
                    supabaseOnline = true;
                    supData = res.data;
                } else if (res && res.error) {
                    console.warn('Supabase query warning (project may be paused):', res.error);
                }
            } catch (err) {
                console.warn('Supabase connection unreachable or timed out:', err);
            }
        }

        // 3. Handle Online vs Offline Status Banner
        if (statusContainer) {
            if (supabaseOnline) {
                statusContainer.innerHTML = `
                    <div class="supabase-status-banner online">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.1rem;">🟢</span>
                            <span><strong>Supabase Cloud Conectado:</strong> Banco de dados ativo e sincronizado em tempo real.</span>
                        </div>
                        <span style="font-size: 0.78rem; opacity: 0.85; background: rgba(16, 185, 129, 0.2); padding: 0.25rem 0.6rem; border-radius: 4px;">Projeto: jcpjgowdxcmqditgvmeq</span>
                    </div>
                `;
            } else {
                statusContainer.innerHTML = `
                    <div class="supabase-status-banner offline">
                        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                            <span style="font-size: 1.2rem;">⚠️</span>
                            <div>
                                <strong>Modo Local Ativo (${localData.length} inscrições salvas no dispositivo):</strong><br>
                                <span style="font-size: 0.82rem; opacity: 0.9;">O projeto Supabase Cloud está <strong>pausado por inatividade</strong> (Free tier da Supabase). Para sincronizar na nuvem, basta reativar no painel.</span>
                            </div>
                        </div>
                        <a href="https://supabase.com/dashboard/project/jcpjgowdxcmqditgvmeq" target="_blank" rel="noopener" class="btn-restore-link">
                            🚀 Reativar no Supabase →
                        </a>
                    </div>
                `;
            }
        }

        // 4. Merge remote data if online, and auto-sync any local records not in cloud
        if (supabaseOnline && supData) {
            const map = new Map();
            supData.forEach(item => map.set(item.id, item));

            const pendingSync = [];
            localData.forEach(item => {
                if (!map.has(item.id)) {
                    map.set(item.id, item);
                    pendingSync.push(item);
                }
            });

            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            this.state.registrations = merged;
            this.saveLocalRegistrations(merged);
            this.renderAdminKPIs();
            this.renderShirtReport();
            this.renderRegistrationsTable();

            // Background sync pending items to Supabase
            if (pendingSync.length > 0 && supabaseClient) {
                console.log(`Syncing ${pendingSync.length} local registrations to Supabase...`);
                supabaseClient.from('registrations').insert(pendingSync).then(({ error }) => {
                    if (error) console.warn('Background sync error:', error);
                    else console.log('Pending registrations successfully synced to Supabase!');
                }).catch(e => console.warn('Background sync exception:', e));
            }
        }
    }

    renderAdminKPIs() {
        const regs = this.state.registrations;
        const total = regs.length;
        const paid = regs.filter(r => r.payment_status === 'paid');
        const pending = regs.filter(r => r.payment_status === 'pending');

        const totalRevenue = paid.reduce((acc, r) => acc + (parseFloat(r.amount_paid || r.event_price || 85)), 0);
        const pendingRevenue = pending.reduce((acc, r) => acc + (parseFloat(r.event_price || 85)), 0);
        const conversionRate = total > 0 ? Math.round((paid.length / total) * 100) : 0;

        document.getElementById('statTotalRegistrations').textContent = total;
        document.getElementById('statPaidRegistrations').textContent = paid.length;
        document.getElementById('statPendingRegistrations').textContent = pending.length;
        document.getElementById('statTotalRevenue').textContent = `€${totalRevenue.toFixed(2)}`;
        document.getElementById('statPendingRevenue').textContent = `€${pendingRevenue.toFixed(2)}`;
        document.getElementById('statConversionRate').textContent = `${conversionRate}%`;
    }

    renderShirtReport() {
        const regs = this.state.registrations;
        
        const shirtCounts = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
        let totalShirts = 0;

        regs.forEach(r => {
            const size = (r.shirt_size || 'M').toUpperCase();
            if (shirtCounts.hasOwnProperty(size)) {
                shirtCounts[size]++;
                totalShirts++;
            }
        });

        document.getElementById('countShirtXS').textContent = shirtCounts.XS;
        document.getElementById('countShirtS').textContent = shirtCounts.S;
        document.getElementById('countShirtM').textContent = shirtCounts.M;
        document.getElementById('countShirtL').textContent = shirtCounts.L;
        document.getElementById('countShirtXL').textContent = shirtCounts.XL;
        document.getElementById('countShirtTotal').textContent = totalShirts;
    }

    renderRegistrationsTable() {
        const tbody = document.getElementById('adminRegistrationsTbody');
        if (!tbody) return;

        let filtered = this.state.registrations;

        // Apply Status Filter
        if (this.state.activeFilter !== 'all') {
            filtered = filtered.filter(r => r.payment_status === this.state.activeFilter);
        }

        // Apply Search Filter
        if (this.state.searchQuery) {
            const q = this.state.searchQuery;
            filtered = filtered.filter(r =>
                (r.full_name && r.full_name.toLowerCase().includes(q)) ||
                (r.email && r.email.toLowerCase().includes(q)) ||
                (r.city && r.city.toLowerCase().includes(q)) ||
                (r.church && r.church.toLowerCase().includes(q))
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2.5rem; color: #94A3B8;">
                        Nenhuma inscrição encontrada para os filtros selecionados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(r => {
            const dateStr = new Date(r.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #E2E8F0;">
                    <td style="padding: 1rem 1.25rem;">
                        <strong>${r.full_name}</strong>
                    </td>
                    <td style="padding: 1rem 1.25rem;">
                        <div>${r.email}</div>
                        <div style="font-size: 0.8rem; color: #94A3B8;">${r.phone}</div>
                    </td>
                    <td style="padding: 1rem 1.25rem;">${r.city}, ${r.country}</td>
                    <td style="padding: 1rem 1.25rem;">${r.church || '—'}</td>
                    <td style="padding: 1rem 1.25rem; text-align: center;">
                        <span style="background: rgba(0,207,200,0.2); color: #00CFC8; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.85rem;">
                            ${r.shirt_size || 'M'}
                        </span>
                    </td>
                    <td style="padding: 1rem 1.25rem;">${dateStr}</td>
                    <td style="padding: 1rem 1.25rem; font-weight: 700; color: #00CFC8;">€${parseFloat(r.event_price || 85).toFixed(2)}</td>
                    <td style="padding: 1rem 1.25rem;">
                        <select class="admin-status-select" data-id="${r.id}" style="background: #0F172A; color: #FFF; border: 1.5px solid rgba(0, 207, 200, 0.4); border-radius: 8px; padding: 0.35rem 0.65rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; outline: none;">
                            <option value="pending" ${r.payment_status === 'pending' ? 'selected' : ''}>⏳ Pendente</option>
                            <option value="paid" ${r.payment_status === 'paid' ? 'selected' : ''}>✅ Pago</option>
                            <option value="cancelled" ${r.payment_status === 'cancelled' || r.payment_status === 'expired' ? 'selected' : ''}>❌ Cancelado</option>
                            <option value="refunded" ${r.payment_status === 'refunded' ? 'selected' : ''}>🔄 Reembolsado</option>
                        </select>
                    </td>
                    <td style="padding: 1rem 1.25rem; text-align: right;">
                        <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                            <button class="btn btn-sm btn-secondary btn-view-details" data-id="${r.id}" title="Ver detalhes completos" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">
                                🔍 Detalhes
                            </button>
                            <button class="btn btn-sm btn-delete-reg" data-id="${r.id}" data-name="${r.full_name}" title="Excluir inscrição" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #FCA5A5; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                                🗑️ Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind Status Change
        tbody.querySelectorAll('.admin-status-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const newStatus = e.target.value;
                this.updateRegistrationStatus(id, newStatus);
            });
        });

        // Bind Delete Buttons
        tbody.querySelectorAll('.btn-delete-reg').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target.closest('.btn-delete-reg');
                const id = button.dataset.id;
                const name = button.dataset.name;
                this.deleteRegistration(id, name);
            });
        });

        // Bind Detail Buttons
        tbody.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const reg = this.state.registrations.find(item => item.id === id);
                if (reg) this.openRegistrationDetailsModal(reg);
            });
        });
    }

    async updateRegistrationStatus(id, newStatus) {
        // 1. Update in local state & localStorage immediately
        const reg = this.state.registrations.find(r => r.id === id);
        if (reg) {
            reg.payment_status = newStatus;
            this.saveLocalRegistrations(this.state.registrations);
            this.renderAdminKPIs();
            this.renderRegistrationsTable();
        }

        // 2. Try to sync to Supabase in background
        let cloudSynced = false;
        if (supabaseClient) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
                const updatePromise = supabaseClient
                    .from('registrations')
                    .update({ payment_status: newStatus })
                    .eq('id', id)
                    .select();

                const { data, error } = await Promise.race([updatePromise, timeoutPromise]);
                if (!error && data && data.length > 0) {
                    cloudSynced = true;
                }
            } catch (err) {
                console.warn('Supabase status update failed or paused (kept locally):', err);
            }
        }

        if (cloudSynced) {
            this.showToast('✅ Status atualizado e sincronizado na nuvem!');
        } else {
            this.showToast('✅ Status atualizado localmente!');
        }
    }

    async deleteRegistration(id, fullName) {
        if (!confirm(`Tem certeza que deseja excluir permanentemente a inscrição de "${fullName}"?\n\nEsta ação removerá o registro.`)) {
            return;
        }

        // 1. Delete from local state & localStorage immediately
        this.state.registrations = this.state.registrations.filter(r => r.id !== id);
        this.saveLocalRegistrations(this.state.registrations);
        this.renderAdminKPIs();
        this.renderShirtReport();
        this.renderRegistrationsTable();
        this.closeModal('registrationDetailsModal');

        // 2. Try to delete from Supabase in background
        let cloudDeleted = false;
        if (supabaseClient) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
                const delPromise = supabaseClient
                    .from('registrations')
                    .delete()
                    .eq('id', id)
                    .select();

                const { data, error } = await Promise.race([delPromise, timeoutPromise]);
                if (!error && data && data.length > 0) {
                    cloudDeleted = true;
                }
            } catch (err) {
                console.warn('Supabase delete failed or paused (deleted locally):', err);
            }
        }

        if (cloudDeleted) {
            this.showToast('🗑️ Inscrição excluída da nuvem e localmente!');
        } else {
            this.showToast('🗑️ Inscrição excluída localmente!');
        }
    }

    openRegistrationDetailsModal(reg) {
        const title = document.getElementById('detailsNameTitle');
        const pill = document.getElementById('detailsStatusPill');
        const content = document.getElementById('detailsModalContent');

        if (title) title.textContent = reg.full_name;

        let statusBadge = '<span class="status-pill status-pending">⏳ Pendente</span>';
        if (reg.payment_status === 'paid') statusBadge = '<span class="status-pill status-paid">✅ Pago</span>';
        if (reg.payment_status === 'cancelled' || reg.payment_status === 'expired') statusBadge = '<span class="status-pill status-cancelled">❌ Cancelado</span>';
        if (reg.payment_status === 'refunded') statusBadge = '<span class="status-pill status-refunded">🔄 Reembolsado</span>';

        if (pill) pill.innerHTML = statusBadge;

        if (content) {
            content.innerHTML = `
                <div><strong>Email:</strong> ${reg.email}</div>
                <div><strong>Telemóvel:</strong> ${reg.phone}</div>
                <div><strong>Data de Nascimento:</strong> ${reg.birth_date}</div>
                <div><strong>Localização:</strong> ${reg.city}, ${reg.country}</div>
                <div><strong>Tamanho da Camiseta:</strong> <span style="color: #0B4F8A; font-weight: 800; font-size: 1.1rem;">${reg.shirt_size || 'M'}</span></div>
                <div><strong>Igreja / Pastor:</strong> ${reg.church || '—'} (Pr. ${reg.pastor || '—'})</div>
                <div><strong>Como Conheceu:</strong> ${reg.how_found || '—'}</div>
                <div><strong>Já Participou:</strong> ${reg.previous_participant || '—'}</div>
                <div><strong>Observações:</strong> ${reg.notes || 'Nenhuma'}</div>
                <div><strong>Forma de Pagamento:</strong> ${reg.payment_method === 'online_stripe' ? '<span style="color:#0B4F8A; font-weight:700;">💳 Stripe Online</span>' : '<span style="color:#15803D; font-weight:700;">💬 WhatsApp / MB WAY (Pr. Ezequias)</span>'}</div>
                <div style="margin-top: 0.6rem;">
                    <a href="https://wa.me/${(reg.phone || '').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.4rem; background: #25D366; color: #FFF; text-decoration: none; padding: 0.45rem 0.9rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        Conversar com Inscrito no WhatsApp
                    </a>
                </div>
                <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 0.5rem 0;">
                <div><strong>ID Inscrição:</strong> <code style="font-size: 0.8rem; background: #F1F5F9; padding: 0.2rem 0.4rem; border-radius: 4px;">${reg.id || '—'}</code></div>
                <div><strong>Data da Inscrição:</strong> ${new Date(reg.created_at).toLocaleString('pt-PT')}</div>

                <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 2px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <label style="font-weight: 700; font-size: 0.9rem; color: #334155;">Editar Status:</label>
                        <select id="modalStatusSelect" style="padding: 0.45rem 0.8rem; border-radius: 8px; border: 1.5px solid #CBD5E1; font-weight: 700; background: #F8FAFC; color: #0F172A; cursor: pointer;">
                            <option value="pending" ${reg.payment_status === 'pending' ? 'selected' : ''}>⏳ Pendente</option>
                            <option value="paid" ${reg.payment_status === 'paid' ? 'selected' : ''}>✅ Pago</option>
                            <option value="cancelled" ${reg.payment_status === 'cancelled' || reg.payment_status === 'expired' ? 'selected' : ''}>❌ Cancelado</option>
                            <option value="refunded" ${reg.payment_status === 'refunded' ? 'selected' : ''}>🔄 Reembolsado</option>
                        </select>
                    </div>
                    <button id="modalDeleteBtn" style="padding: 0.45rem 1rem; background: #EF4444; color: #FFF; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: background 0.2s ease;">
                        🗑️ Excluir Inscrição
                    </button>
                </div>
            `;

            document.getElementById('modalStatusSelect')?.addEventListener('change', (e) => {
                this.updateRegistrationStatus(reg.id, e.target.value);
                const modal = document.getElementById('registrationDetailsModal');
                if (modal) modal.classList.remove('active');
            });

            document.getElementById('modalDeleteBtn')?.addEventListener('click', () => {
                this.deleteRegistration(reg.id, reg.full_name);
            });
        }

        const modal = document.getElementById('registrationDetailsModal');
        if (modal) modal.classList.add('active');
    }

    exportRegistrationsCsv() {
        const regs = this.state.registrations;
        if (!regs || regs.length === 0) {
            alert('Nenhuma inscrição disponível para exportar.');
            return;
        }

        const headers = ['ID', 'Nome Completo', 'Email', 'Telemóvel', 'Data Nascimento', 'País', 'Cidade', 'Tamanho Camiseta', 'Igreja', 'Pastor', 'Como Conheceu', 'Já Participou', 'Observações', 'Status Pagamento', 'Valor (€)', 'Stripe Session ID', 'Data Inscrição'];
        
        const rows = regs.map(r => [
            `"${r.id}"`,
            `"${r.full_name || ''}"`,
            `"${r.email || ''}"`,
            `"${r.phone || ''}"`,
            `"${r.birth_date || ''}"`,
            `"${r.country || ''}"`,
            `"${r.city || ''}"`,
            `"${r.shirt_size || 'M'}"`,
            `"${r.church || ''}"`,
            `"${r.pastor || ''}"`,
            `"${r.how_found || ''}"`,
            `"${r.previous_participant || ''}"`,
            `"${(r.notes || '').replace(/"/g, '""')}"`,
            `"${r.payment_status || 'pending'}"`,
            `"${r.event_price || 85}"`,
            `"${r.stripe_session_id || ''}"`,
            `"${new Date(r.created_at).toLocaleString('pt-PT')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `inscricoes_remissao_portugal_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showToast(message) {
        let toast = document.getElementById('globalToastNotification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'globalToastNotification';
            toast.style.cssText = 'position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #0B4F8A; color: #FFF; padding: 0.75rem 1.5rem; border-radius: 50px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 100000; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; border: 1px solid #00CFC8;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.visibility = 'visible';

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.visibility = 'hidden';
        }, 3000);
    }
}

// Initialize Application when DOM is Ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RemissaoApp();
});
