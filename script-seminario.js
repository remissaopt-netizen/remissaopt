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
        AUTH: 'remissao_pt_admin_session'
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
        });

        // Close Modals
        document.getElementById('closeRegistrationModalBtn')?.addEventListener('click', () => this.closeModal('registrationModal'));
        document.getElementById('closeConfirmationModalBtn')?.addEventListener('click', () => this.closeModal('confirmationModal'));
        document.getElementById('btnCloseConfirmation')?.addEventListener('click', () => this.closeModal('confirmationModal'));
        document.getElementById('closeDetailsModalBtn')?.addEventListener('click', () => this.closeModal('registrationDetailsModal'));

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
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>ÔÅ│ Processando inscri├º├úo...</span>';

            const fullName = document.getElementById('regFullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const birthDate = document.getElementById('regBirthDate').value;
            const country = document.getElementById('regCountry').value.trim();
            const city = document.getElementById('regCity').value.trim();

            const selectedShirt = document.querySelector('input[name="shirt_size"]:checked');
            const shirtSize = selectedShirt ? selectedShirt.value : '';

            const church = document.getElementById('regChurch').value.trim();
            const pastor = document.getElementById('regPastor').value.trim();
            const howFound = document.getElementById('regHowFound').value;
            const previousParticipant = document.getElementById('regPreviousParticipant').value;
            const notes = document.getElementById('regNotes').value.trim();
            const rgpdAccepted = document.getElementById('regRgpdAccepted').checked;

            if (!fullName || !email || !phone || !birthDate || !country || !city || !shirtSize) {
                alert('Por favor, preencha todos os campos obrigat├│rios (*), incluindo o tamanho da camiseta.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            if (!rgpdAccepted) {
                alert('Por favor, confirme a autoriza├º├úo de tratamento de dados conforme o RGPD.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            const payload = {
                full_name: fullName,
                email,
                phone,
                birth_date: birthDate,
                country,
                city,
                shirt_size: shirtSize,
                church,
                pastor,
                how_found: howFound,
                previous_participant: previousParticipant,
                notes,
                rgpd_accepted: rgpdAccepted
            };

            // Call Backend API /api/register
            let response;
            try {
                response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.warn('Backend server not reachable directly, attempting Supabase direct fallback:', err);
            }

            if (response && response.ok) {
                const data = await response.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                    return;
                }
            }

            // Direct Supabase JS Client Fallback if server endpoint is standalone
            if (supabaseClient) {
                const { data: reg, error: supErr } = await supabaseClient
                    .from('registrations')
                    .insert([{
                        full_name: fullName,
                        email,
                        phone,
                        birth_date: birthDate,
                        country,
                        city,
                        shirt_size: shirtSize,
                        church,
                        pastor,
                        how_found: howFound,
                        previous_participant: previousParticipant,
                        notes,
                        event_name: 'Remission to the Nations Portugal 2026',
                        event_price: 85.00,
                        payment_status: 'pending',
                        currency: 'EUR'
                    }])
                    .select()
                    .single();

                if (supErr) throw supErr;

                this.closeModal('registrationModal');
                
                // Redirect to Stripe Checkout with client_reference_id
                if (APP_CONFIG.CHECKOUT_URL) {
                    const checkoutUrl = new URL(APP_CONFIG.CHECKOUT_URL);
                    checkoutUrl.searchParams.set('client_reference_id', reg.id);
                    window.location.href = checkoutUrl.toString();
                    return;
                }

            } else {
                alert('Inscri├º├úo salva com sucesso! Entraremos em contacto para o pagamento.');
            }

        } catch (err) {
            console.error('Registration Error:', err);
            alert('Erro ao enviar inscri├º├úo: ' + (err.message || 'Tente novamente.'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
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
        if (tbody && (!this.state.registrations || this.state.registrations.length === 0)) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2.5rem; color: #00CFC8;">
                        Carregando inscrições do banco de dados...
                    </td>
                </tr>
            `;
        }

        try {
            let data = [];
            
            if (supabaseClient) {
                const { data: supData, error } = await supabaseClient
                    .from('registrations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase query error:', error);
                } else if (supData) {
                    data = supData;
                }
            }

            this.state.registrations = data;
            this.renderAdminKPIs();
            this.renderShirtReport();
            this.renderRegistrationsTable();
        } catch (err) {
            console.error('Error fetching admin data:', err);
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
        try {
            if (supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('registrations')
                    .update({ payment_status: newStatus })
                    .eq('id', id)
                    .select();

                if (error) throw error;
                if (!data || data.length === 0) {
                    throw new Error('A alteração não foi persistida no Supabase. Verifique se as políticas de RLS (Row Level Security) permitem UPDATE.');
                }
            }

            const reg = this.state.registrations.find(r => r.id === id);
            if (reg) {
                reg.payment_status = newStatus;
            }

            this.renderAdminKPIs();
            this.renderRegistrationsTable();
            this.showToast('✅ Status atualizado com sucesso!');
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            alert('Erro ao atualizar status: ' + (err.message || 'Tente novamente.'));
            this.renderRegistrationsTable();
        }
    }

    async deleteRegistration(id, fullName) {
        if (!confirm(`Tem certeza que deseja excluir permanentemente a inscrição de "${fullName}"?\n\nEsta ação não poderá ser desfeita.`)) {
            return;
        }

        try {
            if (supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('registrations')
                    .delete()
                    .eq('id', id)
                    .select();

                if (error) throw error;
                if (!data || data.length === 0) {
                    throw new Error('O registo não foi excluído no Supabase. Verifique se as políticas de RLS (Row Level Security) da tabela registrations permitem DELETE para o cliente.');
                }
            }

            this.state.registrations = this.state.registrations.filter(r => r.id !== id);
            this.renderAdminKPIs();
            this.renderRegistrationsTable();
            this.closeModal('registrationDetailsModal');
            this.showToast('🗑️ Inscrição excluída com sucesso!');
        } catch (err) {
            console.error('Erro ao excluir inscrição:', err);
            alert('Erro ao excluir inscrição: ' + (err.message || 'Tente novamente.'));
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
            alert('Nenhuma inscri├º├úo dispon├¡vel para exportar.');
            return;
        }

        const headers = ['ID', 'Nome Completo', 'Email', 'Telem├│vel', 'Data Nascimento', 'Pa├¡s', 'Cidade', 'Tamanho Camiseta', 'Igreja', 'Pastor', 'Como Conheceu', 'J├í Participou', 'Observa├º├Áes', 'Status Pagamento', 'Valor (Ôé¼)', 'Stripe Session ID', 'Data Inscri├º├úo'];
        
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
